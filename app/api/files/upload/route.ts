import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { uploadFile } from '@/lib/google-drive/service';
import { createNotification } from '@/lib/notifications';
import { apiSuccess, apiError } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const workspaceId = formData.get('workspaceId') as string;
        const storyboardFolderId = formData.get('storyboardFolderId') as string | null;
        const taskId = formData.get('taskId') as string | null;
        const targetFolderType = formData.get('targetFolderType') as string;

        if (!file) return apiError('File is required');
        if (!workspaceId) return apiError('workspaceId is required');
        if (!targetFolderType) return apiError('targetFolderType is required');

        await requireWorkspaceMembership(user.id, workspaceId);

        // Get workspace to find Drive folder IDs
        const { data: workspace } = await supabase
            .from('workspaces')
            .select('*')
            .eq('id', workspaceId)
            .single();

        if (!workspace) return apiError('Workspace not found', 404);

        // Determine target Drive folder
        let targetDriveFolderId: string | null = null;

        if (targetFolderType === 'storyboard' && storyboardFolderId) {
            const { data: folder } = await supabase
                .from('storyboard_folders')
                .select('google_drive_folder_id')
                .eq('id', storyboardFolderId)
                .single();
            targetDriveFolderId = folder?.google_drive_folder_id || workspace.google_drive_storyboards_folder_id;
        } else if (targetFolderType === 'task_attachment') {
            targetDriveFolderId = workspace.google_drive_task_attachments_folder_id;
        } else {
            targetDriveFolderId = workspace.google_drive_general_files_folder_id;
        }

        if (!targetDriveFolderId) {
            return apiError('No Google Drive folder configured for this workspace. Please ensure Drive integration is set up.', 400);
        }

        // Read file buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Google Drive
        const driveResult = await uploadFile(buffer, file.name, file.type || 'application/octet-stream', targetDriveFolderId);

        // Save metadata in Supabase
        const { data: fileAsset, error } = await supabase
            .from('file_assets')
            .insert({
                workspace_id: workspaceId,
                storyboard_folder_id: storyboardFolderId || null,
                task_id: taskId || null,
                storage_provider: 'google_drive',
                google_drive_file_id: driveResult.fileId,
                google_drive_folder_id: targetDriveFolderId,
                google_drive_web_view_link: driveResult.webViewLink,
                original_name: file.name,
                mime_type: file.type || null,
                size_bytes: buffer.length,
                uploaded_by: user.id,
            })
            .select()
            .single();

        if (error) return apiError(error.message, 500);

        // Notify workspace members
        const { data: members } = await supabase
            .from('workspace_members')
            .select('user_id')
            .eq('workspace_id', workspaceId)
            .neq('user_id', user.id);

        if (members) {
            for (const m of members.slice(0, 10)) {
                await createNotification({
                    userId: m.user_id,
                    workspaceId,
                    type: 'file_uploaded',
                    title: 'New File Uploaded',
                    body: `"${file.name}" has been uploaded to the workspace.`,
                    metadata: { fileId: fileAsset.id },
                });
            }
        }

        return apiSuccess({
            file: {
                id: fileAsset.id,
                googleDriveFileId: driveResult.fileId,
                googleDriveFolderId: targetDriveFolderId,
                webViewLink: driveResult.webViewLink,
                originalName: file.name,
            },
        }, 201);
    } catch (err) {
        console.error('File upload error:', err);
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, 500);
    }
}
