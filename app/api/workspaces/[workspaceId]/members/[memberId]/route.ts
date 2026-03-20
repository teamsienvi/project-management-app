import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireWorkspaceRole } from '@/lib/permissions';
import { updateMemberRoleSchema } from '@/lib/validators';
import { apiSuccess, apiError } from '@/lib/utils';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
    try {
        const { workspaceId, memberId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        await requireWorkspaceRole(user.id, workspaceId, ['owner']);

        const body = await request.json();
        const parsed = updateMemberRoleSchema.safeParse(body);
        if (!parsed.success) return apiError(parsed.error.issues[0].message);

        // Cannot change owner role
        const { data: target } = await supabase
            .from('workspace_members')
            .select('role, user_id')
            .eq('id', memberId)
            .eq('workspace_id', workspaceId)
            .single();

        if (!target) return apiError('Member not found', 404);
        if (target.role === 'owner') return apiError('Cannot change the owner role');
        if (target.user_id === user.id) return apiError('Cannot change your own role');

        const { data, error } = await supabase
            .from('workspace_members')
            .update({ role: parsed.data.role })
            .eq('id', memberId)
            .eq('workspace_id', workspaceId)
            .select()
            .single();

        if (error) return apiError(error.message, 500);
        return apiSuccess({ member: data });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, message.includes('permissions') ? 403 : 500);
    }
}
