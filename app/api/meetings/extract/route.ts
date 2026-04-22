import { createClient } from '@/lib/supabase/server';
import { callGemini, isGeminiAvailable } from '@/lib/gemini/client';
import { EXTRACT_TASKS_PROMPT, fillPrompt } from '@/lib/gemini/prompts';
import { ExtractionResultSchema } from '@/lib/gemini/schemas';
import { apiSuccess, apiError } from '@/lib/utils';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        const { transcript, workspaceId } = await req.json();

        if (!transcript?.trim()) {
            return apiError('Transcript or meeting summary is required', 400);
        }
        if (!workspaceId) {
            return apiError('Workspace ID is required', 400);
        }

        // Verify workspace membership
        const { data: membership } = await supabase
            .from('workspace_members')
            .select('role')
            .eq('user_id', user.id)
            .eq('workspace_id', workspaceId)
            .single();

        if (!membership) return apiError('Not a member of this workspace', 403);

        if (!isGeminiAvailable()) {
            return apiError('AI features not configured. Set GOOGLE_GENERATIVE_AI_API_KEY.', 503);
        }

        // Build prompt with today's date for relative deadline calculation
        const today = new Date().toISOString().split('T')[0];
        const prompt = fillPrompt(EXTRACT_TASKS_PROMPT, {
            today,
            transcript: transcript.slice(0, 15000), // Cap input to avoid token issues
        });

        // Call Gemini
        const result = await callGemini(prompt, ExtractionResultSchema);

        // Store the extraction
        await supabase.from('meeting_extractions' as any).insert({
            workspace_id: workspaceId,
            user_id: user.id,
            raw_input: transcript.slice(0, 20000),
            extracted_json: result as any,
            tasks_created: 0,
        });

        return apiSuccess({ extraction: result });
    } catch (err: any) {
        console.error('[meetings/extract] Error:', err);
        return apiError(err.message || 'Failed to extract tasks', 500);
    }
}
