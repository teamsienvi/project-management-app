import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkTaskAccess } from '@/lib/permissions';
import { createNoteSchema } from '@/lib/validators';
import { apiSuccess, apiError } from '@/lib/utils';
import type { Json } from '@/lib/supabase/types';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        await checkTaskAccess(user.id, taskId);

        const body = await request.json();
        const parsed = createNoteSchema.safeParse(body);
        if (!parsed.success) return apiError(parsed.error.issues[0].message);

        // Get task workspace_id
        const { data: task } = await supabase.from('tasks').select('workspace_id').eq('id', taskId).single();
        if (!task) return apiError('Task not found', 404);

        const { data: note, error } = await supabase
            .from('task_notes')
            .insert({
                task_id: taskId,
                workspace_id: task.workspace_id,
                body: parsed.data.body,
                created_by: user.id,
            })
            .select('*, profiles:created_by(full_name, avatar_url)')
            .single();

        if (error) return apiError(error.message, 500);

        // Log activity
        await supabase.from('task_activity').insert({
            task_id: taskId,
            workspace_id: task.workspace_id,
            actor_user_id: user.id,
            event_type: 'note_added',
            metadata_json: { noteId: note.id } as unknown as Json,
        });

        return apiSuccess({ note }, 201);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, 500);
    }
}
