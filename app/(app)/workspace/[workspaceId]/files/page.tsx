import { requireAuth } from '@/lib/auth/helpers';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { listFolderContents } from '@/lib/google-drive/service';
import FilesListClient from '@/components/files/FilesListClient';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ workspaceId: string }>;
}

export default async function FilesPage({ params }: PageProps) {
    const { workspaceId } = await params;
    const user = await requireAuth();
    await requireWorkspaceMembership(user.id, workspaceId);
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Get uploaded files from DB
    const { data: files } = await supabase
        .from('file_assets')
        .select('*, profiles:uploaded_by(full_name)')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    // Get workspace Drive config
    const { data: workspace } = await adminSupabase
        .from('workspaces')
        .select('google_drive_root_folder_id, google_drive_general_files_folder_id, google_drive_storyboards_folder_id')
        .eq('id', workspaceId)
        .single();

    // Try to list Drive contents from the root folder for a comprehensive file view
    let driveFolders: Array<{ id: string; name: string; mimeType: string; webViewLink: string | null; createdTime: string | null }> = [];
    let driveFiles: Array<{ id: string; name: string; mimeType: string; webViewLink: string | null; createdTime: string | null }> = [];

    const driveFolderId = workspace?.google_drive_root_folder_id || workspace?.google_drive_storyboards_folder_id;

    if (driveFolderId) {
        try {
            const driveItems = await listFolderContents(driveFolderId);

            // Separate folders and files
            driveFolders = driveItems.filter(
                item => item.mimeType === 'application/vnd.google-apps.folder'
            );
            driveFiles = driveItems.filter(
                item => item.mimeType !== 'application/vnd.google-apps.folder'
            );
        } catch (err) {
            console.error('Failed to list Drive contents for files page:', err);
        }
    }

    // Map Drive folder IDs to storyboard folder DB IDs for navigation
    const driveIdToStoryboardId: Record<string, string> = {};
    if (driveFolders.length > 0) {
        const driveIds = driveFolders.map(f => f.id);
        const { data: storyboardFolders } = await adminSupabase
            .from('storyboard_folders')
            .select('id, google_drive_folder_id')
            .eq('workspace_id', workspaceId)
            .in('google_drive_folder_id', driveIds);

        for (const sf of storyboardFolders || []) {
            if (sf.google_drive_folder_id) {
                driveIdToStoryboardId[sf.google_drive_folder_id] = sf.id;
            }
        }
    }

    return (
        <FilesListClient
            files={files || []}
            workspaceId={workspaceId}
            driveFolders={driveFolders}
            driveFiles={driveFiles}
            driveIdToStoryboardId={driveIdToStoryboardId}
        />
    );
}
