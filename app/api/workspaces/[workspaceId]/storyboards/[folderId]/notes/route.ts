import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { apiSuccess, apiError } from '@/lib/utils';

/**
 * GET /api/workspaces/[workspaceId]/storyboards/[folderId]/notes
 * List all notes in a storyboard folder
 *
 * POST /api/workspaces/[workspaceId]/storyboards/[folderId]/notes
 * Create a new note in a storyboard folder
 */

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; folderId: string }> }
) {
    try {
        const { workspaceId, folderId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        await requireWorkspaceMembership(user.id, workspaceId);

        const adminSupabase = createAdminClient();
        const { data: notes, error } = await adminSupabase
            .from('storyboard_notes')
            .select('id, title, format, created_at, updated_at')
            .eq('storyboard_folder_id', folderId)
            .is('deleted_at', null)
            .order('updated_at', { ascending: false });

        if (error) return apiError(error.message, 500);
        return apiSuccess({ notes: notes || [] });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, 500);
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; folderId: string }> }
) {
    try {
        const { workspaceId, folderId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        await requireWorkspaceMembership(user.id, workspaceId);

        const body = await request.json();
        const title = body.title?.trim() || 'Untitled';
        const format = body.format === 'plaintext' ? 'plaintext' : 'markdown';

        const adminSupabase = createAdminClient();
        const { data: note, error } = await adminSupabase
            .from('storyboard_notes')
            .insert({
                workspace_id: workspaceId,
                storyboard_folder_id: folderId,
                title,
                content: '',
                format,
                created_by: user.id,
                updated_by: user.id,
            })
            .select()
            .single();

        if (error) return apiError(error.message, 500);
        return apiSuccess({ note }, 201);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, 500);
    }
}
