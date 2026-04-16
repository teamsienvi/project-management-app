import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireWorkspaceMembership } from '@/lib/permissions';
import { apiSuccess, apiError } from '@/lib/utils';

/**
 * GET /api/files/[fileId]/preview
 * Returns an embeddable preview URL and file metadata for in-app viewing.
 * Uses our proxy endpoint to serve content without requiring Google auth.
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

        // Use our proxy endpoint to serve content without Google auth
        const proxyUrl = `/api/drive/proxy?fileId=${driveFileId}`;

        let previewUrl = proxyUrl;
        let previewType: 'iframe' | 'image' | 'video' | 'audio' | 'pdf' | 'external' | 'markdown' = 'iframe';

        if (mimeType.includes('google-apps.document') ||
            mimeType.includes('google-apps.spreadsheet') ||
            mimeType.includes('google-apps.presentation')) {
            previewType = 'pdf';
        } else if (mimeType.includes('pdf') || mimeType === 'application/pdf') {
            previewType = 'pdf';
        } else if (mimeType.startsWith('image/')) {
            previewType = 'image';
        } else if (mimeType.startsWith('video/')) {
            previewType = 'video';
        } else if (mimeType.startsWith('audio/')) {
            previewType = 'audio';
        } else if (mimeType.includes('markdown') || name.toLowerCase().endsWith('.md')) {
            previewType = 'markdown';
        } else if (mimeType.includes('text/') ||
                   name.endsWith('.txt') ||
                   name.endsWith('.json') || name.endsWith('.csv')) {
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
