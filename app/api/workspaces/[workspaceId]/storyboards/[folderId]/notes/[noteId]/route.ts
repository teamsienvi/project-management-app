import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { apiSuccess, apiError } from '@/lib/utils';

/**
 * GET /api/workspaces/[workspaceId]/storyboards/[folderId]/notes/[noteId]
 * Get a single note with full content
 *
 * PATCH /api/workspaces/[workspaceId]/storyboards/[folderId]/notes/[noteId]
 * Update note title/content
 *
 * DELETE /api/workspaces/[workspaceId]/storyboards/[folderId]/notes/[noteId]
 * Soft-delete a note
 */

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; folderId: string; noteId: string }> }
) {
    try {
        const { workspaceId, noteId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        await requireWorkspaceMembership(user.id, workspaceId);

        const adminSupabase = createAdminClient();
        const { data: note, error } = await adminSupabase
            .from('storyboard_notes')
            .select('*')
            .eq('id', noteId)
            .is('deleted_at', null)
            .single();

        if (error || !note) return apiError('Note not found', 404);
        return apiSuccess({ note });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, 500);
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; folderId: string; noteId: string }> }
) {
    try {
        const { workspaceId, noteId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        await requireWorkspaceMembership(user.id, workspaceId);

        const body = await request.json();
        const updates: Record<string, unknown> = { updated_by: user.id, updated_at: new Date().toISOString() };
        if (typeof body.title === 'string') updates.title = body.title;
        if (typeof body.content === 'string') updates.content = body.content;

        const adminSupabase = createAdminClient();
        const { data: note, error } = await adminSupabase
            .from('storyboard_notes')
            .update(updates)
            .eq('id', noteId)
            .select()
            .single();

        if (error) return apiError(error.message, 500);
        return apiSuccess({ note });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, 500);
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string; folderId: string; noteId: string }> }
) {
    try {
        const { workspaceId, noteId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        await requireWorkspaceMembership(user.id, workspaceId);

        const adminSupabase = createAdminClient();
        const { error } = await adminSupabase
            .from('storyboard_notes')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', noteId);

        if (error) return apiError(error.message, 500);
        return apiSuccess({ deleted: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, 500);
    }
}
