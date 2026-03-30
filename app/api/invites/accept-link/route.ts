import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiError } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

/**
 * GET /api/invites/accept-link?token=TOKEN&workspaceId=WORKSPACE_ID
 *
 * Email CTA redirect handler. Accepts the invite for authenticated users
 * and redirects to the workspace. If unauthenticated, redirects to login.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const token = searchParams.get('token');
    const workspaceId = searchParams.get('workspaceId');

    if (!token) {
        return apiError('Missing token', 400);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // If not authenticated, redirect to login with return URL
    if (!user) {
        const returnUrl = `/api/invites/accept-link?token=${encodeURIComponent(token)}${workspaceId ? `&workspaceId=${encodeURIComponent(workspaceId)}` : ''}`;
        redirect(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    }

    const adminSupabase = createAdminClient();

    // Find the invitation by token
    const { data: invitation, error: invError } = await adminSupabase
        .from('workspace_invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

    if (invError || !invitation) {
        redirect(`/dashboard?error=${encodeURIComponent('Invalid or expired invitation')}`);
    }

    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        await adminSupabase.from('workspace_invitations').update({ status: 'expired' }).eq('id', invitation.id);
        redirect(`/dashboard?error=${encodeURIComponent('Invitation has expired')}`);
    }

    if (invitation.email !== user.email) {
        redirect(`/dashboard?error=${encodeURIComponent('This invitation was sent to a different email address')}`);
    }

    // Check if already a member
    const { data: existingMember } = await adminSupabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', invitation.workspace_id)
        .eq('user_id', user.id)
        .single();

    if (existingMember) {
        redirect(`/workspace/${invitation.workspace_id}`);
    }

    // Create membership
    await adminSupabase
        .from('workspace_members')
        .insert({
            workspace_id: invitation.workspace_id,
            user_id: user.id,
            role: invitation.role as 'manager' | 'member',
        });

    // Mark invitation as accepted
    await adminSupabase
        .from('workspace_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

    redirect(`/workspace/${invitation.workspace_id}`);
}
