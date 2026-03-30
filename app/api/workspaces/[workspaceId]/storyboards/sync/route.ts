import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { listFolderContents } from '@/lib/google-drive/service';
import { apiSuccess, apiError } from '@/lib/utils';

/**
 * GET /api/workspaces/[workspaceId]/storyboards/sync
 * Syncs storyboard folders with Google Drive and returns merged results.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ workspaceId: string }> }
) {
    try {
        const { workspaceId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        await requireWorkspaceMembership(user.id, workspaceId);

        const adminSupabase = createAdminClient();

        // 1. Get workspace Drive config
        const { data: workspace } = await adminSupabase
            .from('workspaces')
            .select('google_drive_storyboards_folder_id')
            .eq('id', workspaceId)
            .single();

        // 2. Fetch existing DB folders
        const { data: dbFolders } = await adminSupabase
            .from('storyboard_folders')
            .select('*')
            .eq('workspace_id', workspaceId)
            .is('parent_folder_id', null)
            .order('created_at', { ascending: false });

        const existingFolders = dbFolders || [];
        let driveOnlyFiles: Array<{ id: string; name: string; mimeType: string; webViewLink: string | null; createdTime: string | null }> = [];

        // 3. Sync with Google Drive
        if (workspace?.google_drive_storyboards_folder_id) {
            try {
                const driveItems = await listFolderContents(workspace.google_drive_storyboards_folder_id);

                // Find tracked Drive IDs
                const trackedDriveIds = new Set(
                    existingFolders
                        .map(f => f.google_drive_folder_id)
                        .filter(Boolean)
                );

                // Import untracked Drive folders
                const untrackedFolders = driveItems.filter(
                    item =>
                        item.mimeType === 'application/vnd.google-apps.folder' &&
                        !trackedDriveIds.has(item.id)
                );

                for (const folder of untrackedFolders) {
                    const { data: imported } = await adminSupabase
                        .from('storyboard_folders')
                        .insert({
                            workspace_id: workspaceId,
                            parent_folder_id: null,
                            name: folder.name,
                            description: 'Synced from Google Drive',
                            google_drive_folder_id: folder.id,
                            created_by: user.id,
                        })
                        .select()
                        .single();

                    if (imported) {
                        existingFolders.push(imported);
                    }
                }

                // Collect non-folder files
                driveOnlyFiles = driveItems.filter(
                    item =>
                        item.mimeType !== 'application/vnd.google-apps.folder' &&
                        !trackedDriveIds.has(item.id)
                );
            } catch (err) {
                console.error('[DRIVE SYNC API] Failed:', err);
            }
        }

        return apiSuccess({ folders: existingFolders, driveFiles: driveOnlyFiles });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, 500);
    }
}
