import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireWorkspaceRole } from '@/lib/permissions';
import { inviteMemberSchema } from '@/lib/validators';
import { createNotification } from '@/lib/notifications';
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
        const { data: existingMember } = await adminSupabase
            .from('workspace_members')
            .select('id')
            .eq('workspace_id', workspaceId)
            .eq('user_id', (await adminSupabase.auth.admin.listUsers()).data.users.find(u => u.email === email)?.id || '')
            .single();

        if (existingMember) return apiError('User is already a member of this workspace');

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

        // Notify the invited user if they exist
        const { data: { users } } = await adminSupabase.auth.admin.listUsers();
        const invitedUser = users.find(u => u.email === email);
        if (invitedUser) {
            await createNotification({
                userId: invitedUser.id,
                workspaceId,
                type: 'workspace_invite',
                title: 'Workspace Invitation',
                body: `You've been invited to join a workspace. Use token: ${token}`,
                metadata: { token, workspaceId },
            });
        }

        return apiSuccess({ invitation }, 201);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, message.includes('permissions') ? 403 : 500);
    }
}
