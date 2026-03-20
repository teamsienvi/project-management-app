import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const { workspaceId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        await requireWorkspaceMembership(user.id, workspaceId);

        const { data: members, error } = await supabase
            .from('workspace_members')
            .select('*, profiles(full_name, avatar_url)')
            .eq('workspace_id', workspaceId);

        if (error) return apiError(error.message, 500);
        return apiSuccess({ members });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, 403);
    }
}
