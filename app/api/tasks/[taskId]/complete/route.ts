import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkTaskAccess } from '@/lib/permissions';
import { createNotification } from '@/lib/notifications';
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

        // Get current task
        const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
        if (!task) return apiError('Task not found', 404);
        if (task.status === 'done') return apiError('Task is already complete');

        // Mark complete
        const { data: updatedTask, error } = await supabase
            .from('tasks')
            .update({
                status: 'done',
                completed_at: new Date().toISOString(),
                completed_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', taskId)
            .select()
            .single();

        if (error) return apiError(error.message, 500);

        // Log activity
        await supabase.from('task_activity').insert({
            task_id: taskId,
            workspace_id: task.workspace_id,
            actor_user_id: user.id,
            event_type: 'task_completed',
            metadata_json: {} as unknown as Json,
        });

        // Gather users to notify: creator, assignee, watchers (exclude completer)
        const notifyUserIds = new Set<string>();
        if (task.created_by && task.created_by !== user.id) notifyUserIds.add(task.created_by);
        if (task.assignee_user_id && task.assignee_user_id !== user.id) notifyUserIds.add(task.assignee_user_id);

        const { data: watchers } = await supabase.from('task_watchers').select('user_id').eq('task_id', taskId);
        if (watchers) {
            for (const w of watchers) {
                if (w.user_id !== user.id) notifyUserIds.add(w.user_id);
            }
        }

        let notificationsCreated = 0;
        for (const userId of notifyUserIds) {
            await createNotification({
                userId,
                workspaceId: task.workspace_id,
                type: 'task_completed',
                title: 'Task Completed',
                body: `"${task.title}" has been marked as done.`,
                metadata: { taskId },
            });
            notificationsCreated++;
        }

        return apiSuccess({ task: updatedTask, notificationsCreated });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, 500);
    }
}
