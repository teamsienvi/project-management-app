import { createClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/utils';
import { createNotification } from '@/lib/notifications';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        const { tasks, workspaceId } = await req.json();

        if (!Array.isArray(tasks) || tasks.length === 0) {
            return apiError('No tasks provided', 400);
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

        // Get workspace members for assignee matching
        const { data: members } = await supabase
            .from('workspace_members')
            .select('user_id, profiles(full_name)')
            .eq('workspace_id', workspaceId);

        const createdTasks = [];

        for (const task of tasks) {
            // Try to match assignee by name
            let assigneeUserId: string | null = null;
            if (task.assignee && members) {
                const match = members.find((m: any) => {
                    const name = (m.profiles as any)?.full_name || '';
                    return name.toLowerCase().includes(task.assignee.toLowerCase());
                });
                if (match) {
                    assigneeUserId = match.user_id;
                }
            }

            // Parse deadline
            let dueDate: string | null = null;
            if (task.deadline) {
                try {
                    dueDate = new Date(task.deadline).toISOString();
                } catch {
                    // Skip invalid dates
                }
            }

            const { data: created, error } = await supabase
                .from('tasks')
                .insert({
                    workspace_id: workspaceId,
                    title: task.title,
                    description: task.description || null,
                    priority: task.priority || 'medium',
                    color: task.color || 'gray',
                    status: 'todo',
                    due_date: dueDate,
                    assignee_user_id: assigneeUserId,
                    created_by: user.id,
                })
                .select()
                .single();

            if (error) {
                console.error('[meetings/create-tasks] Insert error:', error);
                continue;
            }

            // Log activity
            await supabase.from('task_activity').insert({
                task_id: created.id,
                workspace_id: workspaceId,
                actor_user_id: user.id,
                event_type: 'task_created',
                metadata_json: { title: created.title, source: 'meeting_extraction' } as any,
            });

            // Notify assignee
            if (assigneeUserId && assigneeUserId !== user.id) {
                await createNotification({
                    userId: assigneeUserId,
                    workspaceId,
                    type: 'task_assigned',
                    title: 'New task from meeting',
                    body: `You've been assigned: "${created.title}"`,
                    metadata: { taskId: created.id },
                });
            }

            createdTasks.push(created);
        }

        return apiSuccess({
            created: createdTasks.length,
            tasks: createdTasks,
        });
    } catch (err: any) {
        console.error('[meetings/create-tasks] Error:', err);
        return apiError(err.message || 'Failed to create tasks', 500);
    }
}
