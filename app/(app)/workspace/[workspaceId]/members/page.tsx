import { requireAuth } from '@/lib/auth/helpers';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import MembersClient from '@/components/members/MembersClient';

interface PageProps {
    params: Promise<{ workspaceId: string }>;
}

export default async function MembersPage({ params }: PageProps) {
    const { workspaceId } = await params;
    const user = await requireAuth();
    const membership = await requireWorkspaceMembership(user.id, workspaceId);

    const adminSupabase = createAdminClient();

    const [{ data: rawMembers, error: membersError }, { data: workspace }, { data: invitations }] = await Promise.all([
        adminSupabase
            .from('workspace_members')
            .select('*')
            .eq('workspace_id', workspaceId),
        adminSupabase
            .from('workspaces')
            .select('name, join_code, join_code_enabled')
            .eq('id', workspaceId)
            .single(),
        adminSupabase
            .from('workspace_invitations')
            .select('id, email, role, status, expires_at, created_at')
            .eq('workspace_id', workspaceId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false }),
    ]);

    if (membersError) {
        console.error('Members query failed:', membersError);
    }

    // Fetch profiles + emails separately
    const membersList = rawMembers || [];
    let members: Array<typeof membersList[number] & { profiles: { full_name: string | null; avatar_url: string | null } | null }> = [];

    if (membersList.length > 0) {
        const userIds = membersList.map(m => m.user_id);
        const { data: profiles } = await adminSupabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);

        // Get emails from auth as display-name fallback
        const emailMap = new Map<string, string>();
        for (const uid of userIds) {
            const { data: { user: authUser } } = await adminSupabase.auth.admin.getUserById(uid);
            if (authUser?.email) emailMap.set(uid, authUser.email);
        }

        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        members = membersList.map(m => {
            const prof = profileMap.get(m.user_id);
            const displayName = (prof?.full_name && prof.full_name.trim()) || emailMap.get(m.user_id) || null;
            return {
                ...m,
                profiles: { full_name: displayName, avatar_url: prof?.avatar_url || null },
            };
        });
    }

    return (
        <MembersClient
            members={members}
            workspace={workspace!}
            workspaceId={workspaceId}
            currentUserRole={membership.role}
            currentUserId={user.id}
            pendingInvitations={invitations || []}
        />
    );
}
