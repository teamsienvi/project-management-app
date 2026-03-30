import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireWorkspaceRole } from '@/lib/permissions';
import { apiSuccess, apiError } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/workspaces/[workspaceId]/join-code
 * Returns the workspace join code and enabled state.
 * Requires: owner or manager
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const { workspaceId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        await requireWorkspaceRole(user.id, workspaceId, ['owner', 'manager']);

        const adminSupabase = createAdminClient();
        const { data: workspace } = await adminSupabase
            .from('workspaces')
            .select('join_code, join_code_enabled, join_code_last_rotated_at')
            .eq('id', workspaceId)
            .single();

        if (!workspace) return apiError('Workspace not found', 404);

        return apiSuccess({
            joinCode: workspace.join_code,
            joinCodeEnabled: workspace.join_code_enabled,
            lastRotatedAt: workspace.join_code_last_rotated_at,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, message.includes('permissions') ? 403 : 500);
    }
}

/**
 * POST /api/workspaces/[workspaceId]/join-code
 * Actions: rotate, enable, disable
 * Requires: owner
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const { workspaceId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        await requireWorkspaceRole(user.id, workspaceId, ['owner']);

        const { action } = await request.json();

        const adminSupabase = createAdminClient();

        if (action === 'rotate') {
            const newCode = uuidv4().slice(0, 8);
            const { data, error } = await adminSupabase
                .from('workspaces')
                .update({
                    join_code: newCode,
                    join_code_last_rotated_at: new Date().toISOString(),
                })
                .eq('id', workspaceId)
                .select('join_code, join_code_enabled, join_code_last_rotated_at')
                .single();

            if (error) return apiError(error.message, 500);
            return apiSuccess({ joinCode: data.join_code, joinCodeEnabled: data.join_code_enabled, lastRotatedAt: data.join_code_last_rotated_at });
        }

        if (action === 'enable' || action === 'disable') {
            const { data, error } = await adminSupabase
                .from('workspaces')
                .update({ join_code_enabled: action === 'enable' })
                .eq('id', workspaceId)
                .select('join_code, join_code_enabled, join_code_last_rotated_at')
                .single();

            if (error) return apiError(error.message, 500);
            return apiSuccess({ joinCode: data.join_code, joinCodeEnabled: data.join_code_enabled, lastRotatedAt: data.join_code_last_rotated_at });
        }

        return apiError('Invalid action. Use: rotate, enable, disable', 400);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, message.includes('permissions') ? 403 : 500);
    }
}
