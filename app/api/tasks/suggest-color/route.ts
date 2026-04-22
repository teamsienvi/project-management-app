import { createClient } from '@/lib/supabase/server';
import { callGemini, isGeminiAvailable } from '@/lib/gemini/client';
import { SUGGEST_COLOR_PROMPT, fillPrompt } from '@/lib/gemini/prompts';
import { ColorSuggestionSchema } from '@/lib/gemini/schemas';
import { apiSuccess, apiError } from '@/lib/utils';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        const { title, description, priority, dueDate } = await req.json();

        if (!title?.trim()) {
            return apiError('Task title is required', 400);
        }

        if (!isGeminiAvailable()) {
            return apiError('AI features not configured. Set GOOGLE_GENERATIVE_AI_API_KEY.', 503);
        }

        const prompt = fillPrompt(SUGGEST_COLOR_PROMPT, {
            title,
            description: description || 'No description provided',
            priority: priority || 'medium',
            dueDate: dueDate || 'Not set',
        });

        const result = await callGemini(prompt, ColorSuggestionSchema);

        return apiSuccess({ suggestion: result });
    } catch (err: any) {
        console.error('[tasks/suggest-color] Error:', err);
        return apiError(err.message || 'Failed to suggest color', 500);
    }
}
