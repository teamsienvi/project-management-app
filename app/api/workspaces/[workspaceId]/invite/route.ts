import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireWorkspaceRole } from '@/lib/permissions';
import { inviteMemberSchema } from '@/lib/validators';
import { createNotification } from '@/lib/notifications';
import { sendInviteEmail } from '@/lib/email';
import { apiSuccess, apiError } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const { workspaceId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        await requireWorkspaceRole(user.id, workspaceId, ['owner', 'manager']);

        const body = await request.json();
        const parsed = inviteMemberSchema.safeParse(body);
        if (!parsed.success) return apiError(parsed.error.issues[0].message);

        const { email, role } = parsed.data;
        const token = uuidv4();

        const adminSupabase = createAdminClient();

        // Check if already invited
        const { data: existing } = await adminSupabase
            .from('workspace_invitations')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('email', email)
            .eq('status', 'pending')
            .single();

        if (existing) return apiError('User already has a pending invitation');

        // Check if already a member
        const { data: { users } } = await adminSupabase.auth.admin.listUsers();
        const targetUser = users.find(u => u.email === email);
        if (targetUser) {
            const { data: existingMember } = await adminSupabase
                .from('workspace_members')
                .select('id')
                .eq('workspace_id', workspaceId)
                .eq('user_id', targetUser.id)
                .single();

            if (existingMember) return apiError('User is already a member of this workspace');
        }

        const { data: invitation, error } = await adminSupabase
            .from('workspace_invitations')
            .insert({
                workspace_id: workspaceId,
                email,
                role,
                invited_by: user.id,
                token,
                status: 'pending',
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .select()
            .single();

        if (error) return apiError(error.message, 500);

        // Get workspace name and inviter profile for the email
        const [{ data: workspace }, { data: inviterProfile }] = await Promise.all([
            adminSupabase.from('workspaces').select('name').eq('id', workspaceId).single(),
            adminSupabase.from('profiles').select('full_name').eq('id', user.id).single(),
        ]);

        // Send invite email via Resend
        const emailSent = await sendInviteEmail({
            to: email,
            workspaceName: workspace?.name || 'a workspace',
            inviterName: inviterProfile?.full_name || null,
            role,
            token,
            workspaceId,
        });

        // Also create in-app notification if the user already exists
        if (targetUser) {
            await createNotification({
                userId: targetUser.id,
                workspaceId,
                type: 'workspace_invite',
                title: 'Workspace Invitation',
                body: `You've been invited to join ${workspace?.name || 'a workspace'}.`,
                metadata: { token, workspaceId },
            });
        }

        return apiSuccess({ invitation, emailSent }, 201);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, message.includes('permissions') ? 403 : 500);
    }
}
