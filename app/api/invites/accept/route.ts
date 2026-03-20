import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { acceptInviteSchema } from '@/lib/validators';
import { createNotification } from '@/lib/notifications';
import { apiSuccess, apiError } from '@/lib/utils';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        const body = await request.json();
        const parsed = acceptInviteSchema.safeParse(body);
        if (!parsed.success) return apiError(parsed.error.issues[0].message);

        const adminSupabase = createAdminClient();

        // Look up invitation by token alone (no workspace ID needed)
        const { data: invitation, error: invError } = await adminSupabase
            .from('workspace_invitations')
            .select('*')
            .eq('token', parsed.data.token)
            .eq('status', 'pending')
            .single();

        if (invError || !invitation) return apiError('Invalid or expired invitation', 400);

        if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
            await adminSupabase.from('workspace_invitations').update({ status: 'expired' }).eq('id', invitation.id);
            return apiError('Invitation has expired', 400);
        }

        // Verify email matches
        if (invitation.email !== user.email) {
            return apiError('This invitation was sent to a different email address', 403);
        }

        // Check if already a member
        const { data: existingMember } = await adminSupabase
            .from('workspace_members')
            .select('id')
            .eq('workspace_id', invitation.workspace_id)
            .eq('user_id', user.id)
            .single();

        if (existingMember) return apiError('You are already a member of this workspace');

        // Create membership
        const { data: membership, error: memError } = await adminSupabase
            .from('workspace_members')
            .insert({
                workspace_id: invitation.workspace_id,
                user_id: user.id,
                role: invitation.role as 'manager' | 'member',
            })
            .select()
            .single();

        if (memError) return apiError(memError.message, 500);

        // Mark invitation as accepted
        await adminSupabase
            .from('workspace_invitations')
            .update({ status: 'accepted' })
            .eq('id', invitation.id);

        // Notify existing workspace members
        const { data: members } = await adminSupabase
            .from('workspace_members')
            .select('user_id')
            .eq('workspace_id', invitation.workspace_id)
            .neq('user_id', user.id);

        if (members) {
            for (const m of members) {
                await createNotification({
                    userId: m.user_id,
                    workspaceId: invitation.workspace_id,
                    type: 'member_added',
                    title: 'New Member Joined',
                    body: `A new member has joined the workspace.`,
                });
            }
        }

        // Return the workspace so the client can redirect
        const { data: workspace } = await adminSupabase
            .from('workspaces')
            .select('*')
            .eq('id', invitation.workspace_id)
            .single();

        return apiSuccess({ workspace, membership });
    } catch (err) {
        console.error('Accept invite (token-only) error:', err);
        return apiError('Internal server error', 500);
    }
}
