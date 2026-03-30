import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { deleteFile as deleteDriveFile } from '@/lib/google-drive/service';
import { apiSuccess, apiError } from '@/lib/utils';

export async function DELETE(
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

        // Get the folder
        const { data: folder } = await adminSupabase
            .from('storyboard_folders')
            .select('*')
            .eq('id', folderId)
            .eq('workspace_id', workspaceId)
            .single();

        if (!folder) return apiError('Folder not found', 404);

        // Delete child files (soft-delete)
        const { data: childFiles } = await adminSupabase
            .from('file_assets')
            .select('id, google_drive_file_id')
            .eq('storyboard_folder_id', folderId)
            .is('deleted_at', null);

        for (const file of childFiles || []) {
            await adminSupabase
                .from('file_assets')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', file.id);

            if (file.google_drive_file_id) {
                try { await deleteDriveFile(file.google_drive_file_id); } catch { /* skip */ }
            }
        }

        // Delete child subfolders recursively
        const { data: childFolders } = await adminSupabase
            .from('storyboard_folders')
            .select('id, google_drive_folder_id')
            .eq('parent_folder_id', folderId);

        for (const child of childFolders || []) {
            await adminSupabase
                .from('storyboard_folders')
                .delete()
                .eq('id', child.id);

            if (child.google_drive_folder_id) {
                try { await deleteDriveFile(child.google_drive_folder_id); } catch { /* skip */ }
            }
        }

        // Delete the folder itself from DB
        await adminSupabase
            .from('storyboard_folders')
            .delete()
            .eq('id', folderId);

        // Trash in Drive
        if (folder.google_drive_folder_id) {
            try { await deleteDriveFile(folder.google_drive_folder_id); } catch { /* skip */ }
        }

        return apiSuccess({ ok: true });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, 500);
    }
}
