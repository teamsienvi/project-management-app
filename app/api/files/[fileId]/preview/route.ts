import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { createDriveClient } from '@/lib/google-drive/client';
import { apiSuccess, apiError } from '@/lib/utils';

/**
 * GET /api/files/[fileId]/preview
 * Returns an embeddable preview URL and file metadata for in-app viewing.
 * For Google Docs/Sheets/Slides: returns the /preview embed URL
 * For images/videos/PDFs: returns a direct content URL
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ fileId: string }> }
) {
    try {
        const { fileId } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return apiError('Unauthorized', 401);

        const { data: file } = await supabase
            .from('file_assets')
            .select('*')
            .eq('id', fileId)
            .is('deleted_at', null)
            .single();

        if (!file) return apiError('File not found', 404);
        await requireWorkspaceMembership(user.id, file.workspace_id);

        const driveFileId = file.google_drive_file_id;
        const mimeType = file.mime_type || '';
        const name = file.original_name || 'File';

        let previewUrl = '';
        let previewType: 'iframe' | 'image' | 'video' | 'audio' | 'pdf' | 'external' = 'external';

        // Google Workspace files — use preview embed
        if (mimeType.includes('google-apps.document')) {
            previewUrl = `https://docs.google.com/document/d/${driveFileId}/preview`;
            previewType = 'iframe';
        } else if (mimeType.includes('google-apps.spreadsheet')) {
            previewUrl = `https://docs.google.com/spreadsheets/d/${driveFileId}/preview`;
            previewType = 'iframe';
        } else if (mimeType.includes('google-apps.presentation')) {
            previewUrl = `https://docs.google.com/presentation/d/${driveFileId}/preview`;
            previewType = 'iframe';
        } else if (mimeType.includes('pdf') || mimeType === 'application/pdf') {
            // PDF — embed via Google Drive viewer
            previewUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;
            previewType = 'pdf';
        } else if (mimeType.startsWith('image/')) {
            // Images — use direct thumbnail/content URL
            try {
                const drive = createDriveClient();
                const res = await drive.files.get({
                    fileId: driveFileId,
                    fields: 'thumbnailLink, webContentLink',
                    supportsAllDrives: true,
                });
                previewUrl = res.data.webContentLink || res.data.thumbnailLink || '';
            } catch {
                previewUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;
            }
            previewType = 'image';
        } else if (mimeType.startsWith('video/')) {
            // Videos — use Drive preview embed
            previewUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;
            previewType = 'video';
        } else if (mimeType.startsWith('audio/')) {
            previewUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;
            previewType = 'audio';
        } else {
            // Everything else — use Google Drive preview
            previewUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;
            previewType = 'iframe';
        }

        return apiSuccess({
            previewUrl,
            previewType,
            name,
            mimeType,
            driveFileId,
            webViewLink: file.google_drive_web_view_link || `https://drive.google.com/file/d/${driveFileId}/view`,
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Internal server error';
        return apiError(message, message.includes('member') ? 403 : 500);
    }
}
