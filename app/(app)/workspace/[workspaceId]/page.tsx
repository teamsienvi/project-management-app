import { requireAuth } from '@/lib/auth/helpers';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import WorkspaceOverview from '@/components/dashboard/WorkspaceOverview';

interface PageProps {
    params: Promise<{ workspaceId: string }>;
}

export default async function WorkspacePage({ params }: PageProps) {
    const { workspaceId } = await params;
    const user = await requireAuth();
    const membership = await requireWorkspaceMembership(user.id, workspaceId);

    const adminSupabase = createAdminClient();

    const [workspaceRes, tasksRes, membersRes] = await Promise.all([
        adminSupabase.from('workspaces').select('*').eq('id', workspaceId).single(),
        adminSupabase.from('tasks').select('*').eq('workspace_id', workspaceId).is('archived_at', null),
        adminSupabase.from('workspace_members').select('*').eq('workspace_id', workspaceId),
    ]);

    if (membersRes.error) {
        console.error('Members query failed:', membersRes.error);
    }

    // Fetch profiles + email fallback
    const rawMembers = membersRes.data || [];
    let members: Array<typeof rawMembers[number] & { profiles: { full_name: string | null; avatar_url: string | null } | null }> = [];

    if (rawMembers.length > 0) {
        const userIds = rawMembers.map(m => m.user_id);
        const { data: profiles } = await adminSupabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

        const emailMap = new Map<string, string>();
        for (const uid of userIds) {
            const { data: { user: authUser } } = await adminSupabase.auth.admin.getUserById(uid);
            if (authUser?.email) emailMap.set(uid, authUser.email);
        }

        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        members = rawMembers.map(m => {
            const prof = profileMap.get(m.user_id);
            const displayName = (prof?.full_name && prof.full_name.trim()) || emailMap.get(m.user_id) || null;
            return {
                ...m,
                profiles: { full_name: displayName, avatar_url: prof?.avatar_url || null },
            };
        });
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (
        <WorkspaceOverview
            workspace={workspaceRes.data!}
            tasks={tasksRes.data || []}
            members={members as any}
            membership={membership}
        />
    );
}
