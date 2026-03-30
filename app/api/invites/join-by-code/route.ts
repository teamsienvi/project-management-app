import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createNotification } from '@/lib/notifications';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod/v4';

const joinByCodeSchema = z.object({
    code: z.string().min(1, 'Invite code is required').max(36),
});

/**
 * POST /api/invites/join-by-code
 * Join a workspace using the stable workspace join code.
 */
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        const body = await request.json();
        const parsed = joinByCodeSchema.safeParse(body);
        if (!parsed.success) return apiError(parsed.error.issues[0].message);

        const adminSupabase = createAdminClient();

        // Look up workspace by join code
        const { data: workspace, error: wsError } = await adminSupabase
            .from('workspaces')
            .select('id, name, join_code_enabled')
            .eq('join_code', parsed.data.code.trim())
            .single();

        if (wsError || !workspace) {
            return apiError('Invalid invite code. Please check and try again.', 400);
        }

        if (!workspace.join_code_enabled) {
            return apiError('This workspace invite code has been disabled by the owner.', 403);
        }

        // Check if already a member
        const { data: existingMember } = await adminSupabase
            .from('workspace_members')
            .select('id')
            .eq('workspace_id', workspace.id)
            .eq('user_id', user.id)
            .single();

        if (existingMember) {
            return apiError('You are already a member of this workspace.');
        }

        // Create membership with default 'member' role
        const { data: membership, error: memError } = await adminSupabase
            .from('workspace_members')
            .insert({
                workspace_id: workspace.id,
                user_id: user.id,
                role: 'member',
            })
            .select()
            .single();

        if (memError) return apiError(memError.message, 500);

        // Notify existing members
        const { data: members } = await adminSupabase
            .from('workspace_members')
            .select('user_id')
            .eq('workspace_id', workspace.id)
            .neq('user_id', user.id);

        if (members) {
            for (const m of members.slice(0, 20)) {
                await createNotification({
                    userId: m.user_id,
                    workspaceId: workspace.id,
                    type: 'member_added',
                    title: 'New Member Joined',
                    body: `A new member has joined ${workspace.name}.`,
                });
            }
        }

        return apiSuccess({ workspace: { id: workspace.id, name: workspace.name }, membership });
    } catch (err) {
        console.error('Join by code error:', err);
        return apiError('Internal server error', 500);
    }
}
