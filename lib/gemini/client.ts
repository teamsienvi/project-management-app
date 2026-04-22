import { GoogleGenAI } from '@google/genai';
import { type ZodSchema } from 'zod';

// ============================================================
// Gemini Client — Central AI Service Layer for Sienvi Nexus
// Features: retry with backoff, JSON extraction, Zod validation
// ============================================================

const MODEL_ID = 'gemini-2.5-flash';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Get the Gemini client. Returns null if API key is not configured.
 */
function getClient(): GoogleGenAI | null {
    const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!key) {
        console.warn('[gemini] GOOGLE_GENERATIVE_AI_API_KEY not set — AI features disabled');
        return null;
    }
    return new GoogleGenAI({ apiKey: key });
}

/**
 * Error types for categorized retry handling.
 */
type GeminiErrorType = 'rate_limit' | 'bad_response' | 'network' | 'validation' | 'unavailable';

class GeminiError extends Error {
    constructor(
        message: string,
        public type: GeminiErrorType,
        public retryable: boolean
    ) {
        super(message);
        this.name = 'GeminiError';
    }
}

function categorizeError(err: unknown): GeminiError {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
        return new GeminiError(msg, 'rate_limit', true);
    }
    if (msg.includes('503') || msg.includes('500') || msg.toLowerCase().includes('unavailable')) {
        return new GeminiError(msg, 'unavailable', true);
    }
    if (msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT') || msg.includes('fetch')) {
        return new GeminiError(msg, 'network', true);
    }
    return new GeminiError(msg, 'bad_response', false);
}

/**
 * Extract JSON from a response that may have markdown fencing.
 */
function extractJSON(text: string): string {
    // Try to find JSON inside ```json ... ``` blocks
    const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (fenced) return fenced[1].trim();

    // Try to find raw JSON object
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) return braceMatch[0];

    return text.trim();
}

/**
 * Call Gemini with retry logic and structured output validation.
 *
 * @param prompt - The filled prompt to send
 * @param schema - Zod schema to validate the JSON response
 * @param options - Optional overrides
 * @returns Validated, typed response data
 */
export async function callGemini<T>(
    prompt: string,
    schema: ZodSchema<T>,
    options?: {
        model?: string;
        temperature?: number;
        maxRetries?: number;
    }
): Promise<T> {
    const client = getClient();
    if (!client) {
        throw new GeminiError(
            'Gemini API key not configured. Set GOOGLE_GENERATIVE_AI_API_KEY in your environment.',
            'unavailable',
            false
        );
    }

    const modelId = options?.model || MODEL_ID;
    const maxRetries = options?.maxRetries ?? MAX_RETRIES;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await client.models.generateContent({
                model: modelId,
                contents: prompt,
                config: {
                    temperature: options?.temperature ?? 0.3,
                    responseMimeType: 'application/json',
                },
            });

            const rawText = response.text ?? '';
            if (!rawText.trim()) {
                throw new GeminiError('Empty response from Gemini', 'bad_response', true);
            }

            // Parse JSON
            const jsonStr = extractJSON(rawText);
            let parsed: unknown;
            try {
                parsed = JSON.parse(jsonStr);
            } catch {
                throw new GeminiError(
                    `Failed to parse JSON from Gemini response: ${jsonStr.slice(0, 200)}`,
                    'bad_response',
                    true
                );
            }

            // Validate with Zod
            const result = schema.safeParse(parsed);
            if (!result.success) {
                throw new GeminiError(
                    `Gemini response failed validation: ${result.error.message}`,
                    'validation',
                    attempt < maxRetries - 1 // Retry validation errors (LLM may fix on retry)
                );
            }

            console.log(`[gemini] ${modelId} call succeeded on attempt ${attempt + 1}`);
            return result.data;
        } catch (err) {
            const geminiErr = err instanceof GeminiError ? err : categorizeError(err);
            lastError = geminiErr;

            if (!geminiErr.retryable || attempt === maxRetries - 1) {
                break;
            }

            // Exponential backoff
            const delay = BASE_DELAY_MS * Math.pow(2, attempt);
            console.warn(`[gemini] Attempt ${attempt + 1} failed (${geminiErr.type}), retrying in ${delay}ms...`);
            await new Promise((r) => setTimeout(r, delay));
        }
    }

    throw lastError || new GeminiError('Unknown Gemini error', 'bad_response', false);
}

/**
 * Check if Gemini is configured and available.
 */
export function isGeminiAvailable(): boolean {
    return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}
