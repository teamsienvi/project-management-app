import { requireAuth } from '@/lib/auth/helpers';
import { checkTaskAccess } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import TaskDetailClient from '@/components/tasks/TaskDetailClient';

interface PageProps {
    params: Promise<{ workspaceId: string; taskId: string }>;
}

export default async function TaskDetailPage({ params }: PageProps) {
    const { workspaceId, taskId } = await params;
    const user = await requireAuth();
    await checkTaskAccess(user.id, taskId);
    const supabase = await createClient();

    const [taskRes, notesRes, activityRes, membersRes, watchersRes] = await Promise.all([
        supabase.from('tasks').select('*, creator:created_by(full_name), assignee:assignee_user_id(full_name)').eq('id', taskId).single(),
        supabase.from('task_notes').select('*, profiles:created_by(full_name, avatar_url)').eq('task_id', taskId).order('created_at', { ascending: true }),
        supabase.from('task_activity').select('*, profiles:actor_user_id(full_name)').eq('task_id', taskId).order('created_at', { ascending: false }).limit(50),
        supabase.from('workspace_members').select('user_id, profiles(full_name)').eq('workspace_id', workspaceId),
        supabase.from('task_watchers').select('user_id').eq('task_id', taskId),
    ]);

    return (
        <TaskDetailClient
            task={taskRes.data!}
            notes={notesRes.data || []}
            activity={activityRes.data || []}
            members={membersRes.data || []}
            watchers={watchersRes.data || []}
            workspaceId={workspaceId}
            currentUserId={user.id}
        />
    );
}
