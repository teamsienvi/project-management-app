import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkTaskAccess } from '@/lib/permissions';
import { updateTaskSchema } from '@/lib/validators';
import { apiSuccess, apiError } from '@/lib/utils';
import type { Json } from '@/lib/supabase/types';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    try {
        const { taskId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        const membership = await checkTaskAccess(user.id, taskId);

        const body = await request.json();
        const parsed = updateTaskSchema.safeParse(body);
        if (!parsed.success) return apiError(parsed.error.issues[0].message);

        // Get current task for activity logging
        const { data: currentTask } = await supabase.from('tasks').select('*').eq('id', taskId).single();
        if (!currentTask) return apiError('Task not found', 404);

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        const { title, description, status, priority, dueDate, assigneeUserId } = parsed.data;

        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (status !== undefined) updates.status = status;
        if (priority !== undefined) updates.priority = priority;
        if (dueDate !== undefined) updates.due_date = dueDate;
        if (assigneeUserId !== undefined) updates.assignee_user_id = assigneeUserId;

        const { data: task, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', taskId)
            .select()
            .single();

        if (error) return apiError(error.message, 500);

        // Log activity for each changed field
        const changes: string[] = [];
        if (title !== undefined && title !== currentTask.title) changes.push('title');
        if (status !== undefined && status !== currentTask.status) changes.push('status');
        if (priority !== undefined && priority !== currentTask.priority) changes.push('priority');
        if (assigneeUserId !== undefined && assigneeUserId !== currentTask.assignee_user_id) changes.push('assignee');
        if (dueDate !== undefined) changes.push('due_date');

        for (const field of changes) {
            await supabase.from('task_activity').insert({
                task_id: taskId,
                workspace_id: currentTask.workspace_id,
                actor_user_id: user.id,
                event_type: `updated_${field}`,
                metadata_json: { field, old: (currentTask as Record<string, unknown>)[field], new: (updates as Record<string, unknown>)[field === 'due_date' ? 'due_date' : field === 'assignee' ? 'assignee_user_id' : field] } as unknown as Json,
            });
        }

        return apiSuccess({ task });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, message.includes('member') || message.includes('not found') ? 403 : 500);
    }
}
