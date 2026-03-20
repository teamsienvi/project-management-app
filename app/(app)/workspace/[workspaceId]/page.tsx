import { requireAuth } from '@/lib/auth/helpers';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import WorkspaceOverview from '@/components/dashboard/WorkspaceOverview';

interface PageProps {
    params: Promise<{ workspaceId: string }>;
}

export default async function WorkspacePage({ params }: PageProps) {
    const { workspaceId } = await params;
    const user = await requireAuth();
    const membership = await requireWorkspaceMembership(user.id, workspaceId);
    const supabase = await createClient();

    const [workspaceRes, tasksRes, membersRes] = await Promise.all([
        supabase.from('workspaces').select('*').eq('id', workspaceId).single(),
        supabase.from('tasks').select('*').eq('workspace_id', workspaceId).is('archived_at', null),
        supabase.from('workspace_members').select('*, profiles(full_name, avatar_url)').eq('workspace_id', workspaceId),
    ]);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (
        <WorkspaceOverview
            workspace={workspaceRes.data!}
            tasks={tasksRes.data || []}
            members={(membersRes.data || []) as any}
            membership={membership}
        />
    );
}
