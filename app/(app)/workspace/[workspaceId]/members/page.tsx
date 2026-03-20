import { requireAuth } from '@/lib/auth/helpers';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import MembersClient from '@/components/members/MembersClient';

interface PageProps {
    params: Promise<{ workspaceId: string }>;
}

export default async function MembersPage({ params }: PageProps) {
    const { workspaceId } = await params;
    const user = await requireAuth();
    const membership = await requireWorkspaceMembership(user.id, workspaceId);
    const supabase = await createClient();

    const [{ data: members }, { data: workspace }, { data: invitations }] = await Promise.all([
        supabase
            .from('workspace_members')
            .select('*, profiles(full_name, avatar_url)')
            .eq('workspace_id', workspaceId),
        supabase
            .from('workspaces')
            .select('name')
            .eq('id', workspaceId)
            .single(),
        supabase
            .from('workspace_invitations')
            .select('id, email, role, token, status, expires_at, created_at')
            .eq('workspace_id', workspaceId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false }),
    ]);

    return (
        <MembersClient
            members={members || []}
            workspace={workspace!}
            workspaceId={workspaceId}
            currentUserRole={membership.role}
            currentUserId={user.id}
            pendingInvitations={invitations || []}
        />
    );
}

