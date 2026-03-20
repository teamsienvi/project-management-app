import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireWorkspaceRole } from '@/lib/permissions';
import { updateWorkspaceSchema } from '@/lib/validators';
import { apiSuccess, apiError } from '@/lib/utils';

export async function PATCH(
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
        const parsed = updateWorkspaceSchema.safeParse(body);
        if (!parsed.success) return apiError(parsed.error.issues[0].message);

        const { data, error } = await supabase
            .from('workspaces')
            .update({ ...parsed.data, updated_at: new Date().toISOString() })
            .eq('id', workspaceId)
            .select()
            .single();

        if (error) return apiError(error.message, 500);
        return apiSuccess({ workspace: data });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, message.includes('permissions') ? 403 : 500);
    }
}
