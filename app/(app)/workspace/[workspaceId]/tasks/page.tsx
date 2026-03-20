import { requireAuth } from '@/lib/auth/helpers';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import TaskListClient from '@/components/tasks/TaskListClient';

interface PageProps {
    params: Promise<{ workspaceId: string }>;
}

export default async function TasksPage({ params }: PageProps) {
    const { workspaceId } = await params;
    const user = await requireAuth();
    await requireWorkspaceMembership(user.id, workspaceId);
    const supabase = await createClient();

    const [tasksRes, membersRes] = await Promise.all([
        supabase
            .from('tasks')
            .select('*, profiles:assignee_user_id(full_name, avatar_url)')
            .eq('workspace_id', workspaceId)
            .is('archived_at', null)
            .order('created_at', { ascending: false }),
        supabase
            .from('workspace_members')
            .select('user_id, profiles(full_name)')
            .eq('workspace_id', workspaceId),
    ]);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (
        <TaskListClient
            tasks={(tasksRes.data || []) as any}
            members={(membersRes.data || []) as any}
            workspaceId={workspaceId}
        />
    );
}
