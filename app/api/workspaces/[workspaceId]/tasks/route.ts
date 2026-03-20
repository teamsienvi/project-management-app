import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { createTaskSchema } from '@/lib/validators';
import { createNotification } from '@/lib/notifications';
import { apiSuccess, apiError } from '@/lib/utils';
import type { Json } from '@/lib/supabase/types';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const { workspaceId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        await requireWorkspaceMembership(user.id, workspaceId);

        const body = await request.json();
        const parsed = createTaskSchema.safeParse(body);
        if (!parsed.success) return apiError(parsed.error.issues[0].message);

        const { title, description, status, priority, dueDate, assigneeUserId } = parsed.data;

        const { data: task, error } = await supabase
            .from('tasks')
            .insert({
                workspace_id: workspaceId,
                title,
                description: description || null,
                status: status || 'todo',
                priority: priority || 'medium',
                due_date: dueDate || null,
                assignee_user_id: assigneeUserId || null,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) return apiError(error.message, 500);

        // Create activity
        await supabase.from('task_activity').insert({
            task_id: task.id,
            workspace_id: workspaceId,
            actor_user_id: user.id,
            event_type: 'task_created',
            metadata_json: { title } as unknown as Json,
        });

        // Notify assignee
        if (assigneeUserId && assigneeUserId !== user.id) {
            await createNotification({
                userId: assigneeUserId,
                workspaceId,
                type: 'task_assigned',
                title: 'Task Assigned',
                body: `You've been assigned: "${title}"`,
                metadata: { taskId: task.id },
            });
        }

        return apiSuccess({ task }, 201);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, message.includes('member') ? 403 : 500);
    }
}
