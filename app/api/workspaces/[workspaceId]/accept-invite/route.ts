import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { acceptInviteSchema } from '@/lib/validators';
import { createNotification } from '@/lib/notifications';
import { apiSuccess, apiError } from '@/lib/utils';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const { workspaceId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        const body = await request.json();
        const parsed = acceptInviteSchema.safeParse(body);
        if (!parsed.success) return apiError(parsed.error.issues[0].message);

        const adminSupabase = createAdminClient();

        // Find and validate invitation
        const { data: invitation, error: invError } = await adminSupabase
            .from('workspace_invitations')
            .select('*')
            .eq('token', parsed.data.token)
            .eq('workspace_id', workspaceId)
            .eq('status', 'pending')
            .single();

        if (invError || !invitation) return apiError('Invalid or expired invitation', 400);
        if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
            await adminSupabase.from('workspace_invitations').update({ status: 'expired' }).eq('id', invitation.id);
            return apiError('Invitation has expired', 400);
        }

        // Verify email matches
        if (invitation.email !== user.email) {
            return apiError('Invitation email does not match your account', 403);
        }

        // Check if already a member
        const { data: existingMember } = await adminSupabase
            .from('workspace_members')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('user_id', user.id)
            .single();

        if (existingMember) return apiError('Already a member of this workspace');

        // Create membership
        const { data: membership, error: memError } = await adminSupabase
            .from('workspace_members')
            .insert({
                workspace_id: workspaceId,
                user_id: user.id,
                role: invitation.role as 'manager' | 'member',
            })
            .select()
            .single();

        if (memError) return apiError(memError.message, 500);

        // Update invitation status
        await adminSupabase
            .from('workspace_invitations')
            .update({ status: 'accepted' })
            .eq('id', invitation.id);

        // Notify workspace members
        const { data: members } = await adminSupabase
            .from('workspace_members')
            .select('user_id')
            .eq('workspace_id', workspaceId)
            .neq('user_id', user.id);

        if (members) {
            for (const m of members) {
                await createNotification({
                    userId: m.user_id,
                    workspaceId,
                    type: 'member_added',
                    title: 'New Member Joined',
                    body: `A new member has joined the workspace.`,
                });
            }
        }

        const { data: workspace } = await adminSupabase
            .from('workspaces')
            .select('*')
            .eq('id', workspaceId)
            .single();

        return apiSuccess({ workspace, membership });
    } catch (err) {
        console.error('Accept invite error:', err);
        return apiError('Internal server error', 500);
    }
}
