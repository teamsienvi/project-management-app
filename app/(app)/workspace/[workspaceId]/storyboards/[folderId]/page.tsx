import { requireAuth } from '@/lib/auth/helpers';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { listFolderContents } from '@/lib/google-drive/service';
import FolderDetailClient from '@/components/storyboards/FolderDetailClient';

interface PageProps {
    params: Promise<{ workspaceId: string; folderId: string }>;
}

export default async function FolderDetailPage({ params }: PageProps) {
    const { workspaceId, folderId } = await params;
    const user = await requireAuth();
    await requireWorkspaceMembership(user.id, workspaceId);
    const adminSupabase = createAdminClient();

    const [folderRes, subFoldersRes, filesRes, notesRes] = await Promise.all([
        adminSupabase.from('storyboard_folders').select('*').eq('id', folderId).single(),
        adminSupabase.from('storyboard_folders').select('*').eq('parent_folder_id', folderId).order('created_at'),
        adminSupabase.from('file_assets').select('*').eq('storyboard_folder_id', folderId).is('deleted_at', null).order('created_at', { ascending: false }),
        adminSupabase.from('storyboard_notes').select('id, title, format, created_at, updated_at').eq('storyboard_folder_id', folderId).is('deleted_at', null).order('updated_at', { ascending: false }),
    ]);

    const folder = folderRes.data!;
    const subFolders = subFoldersRes.data || [];
    const files = filesRes.data || [];
    const notes = notesRes.data || [];

    // Sync nested Drive contents if this folder has a Drive ID
    let driveOnlyFiles: Array<{ id: string; name: string; mimeType: string; webViewLink: string | null; createdTime: string | null }> = [];

    if (folder.google_drive_folder_id) {
        try {
            const driveItems = await listFolderContents(folder.google_drive_folder_id);

            // Track IDs already in DB
            const trackedDriveFolderIds = new Set(
                subFolders.map(f => f.google_drive_folder_id).filter(Boolean)
            );
            const trackedDriveFileIds = new Set(
                files.map((f: { google_drive_file_id?: string }) => f.google_drive_file_id).filter(Boolean)
            );

            // Auto-import untracked subfolders
            const untrackedFolders = driveItems.filter(
                item =>
                    item.mimeType === 'application/vnd.google-apps.folder' &&
                    !trackedDriveFolderIds.has(item.id)
            );

            for (const driveFolder of untrackedFolders) {
                const { data: imported } = await adminSupabase
                    .from('storyboard_folders')
                    .insert({
                        workspace_id: workspaceId,
                        parent_folder_id: folderId,
                        name: driveFolder.name,
                        description: 'Synced from Google Drive',
                        google_drive_folder_id: driveFolder.id,
                        created_by: user.id,
                    })
                    .select()
                    .single();

                if (imported) {
                    subFolders.push(imported);
                }
            }

            // Collect untracked Drive files (shown as "From Drive" in UI)
            driveOnlyFiles = driveItems.filter(
                item =>
                    item.mimeType !== 'application/vnd.google-apps.folder' &&
                    !trackedDriveFileIds.has(item.id)
            );
        } catch (err) {
            console.error('Failed to sync subfolder Drive contents:', err);
        }
    }

    return (
        <FolderDetailClient
            folder={folder}
            subFolders={subFolders}
            files={files}
            driveFiles={driveOnlyFiles}
            notes={notes}
            workspaceId={workspaceId}
        />
    );
}

