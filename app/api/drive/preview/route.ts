import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/utils';

/**
 * GET /api/drive/preview?fileId=DRIVE_FILE_ID&mimeType=...&name=...
 * Returns preview info for a raw Drive file (not tracked in DB).
 * Uses our proxy endpoint so users don't need Google auth to view files.
 */
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const driveFileId = url.searchParams.get('fileId');
        const mimeType = url.searchParams.get('mimeType') || '';
        const name = url.searchParams.get('name') || 'File';

        if (!driveFileId) return apiError('fileId is required', 400);

        // Use our proxy endpoint to serve content without requiring Google auth
        const proxyUrl = `/api/drive/proxy?fileId=${driveFileId}`;

        let previewUrl = proxyUrl;
        let previewType: 'iframe' | 'image' | 'video' | 'audio' | 'pdf' | 'external' = 'iframe';

        if (mimeType.includes('google-apps.document') ||
            mimeType.includes('google-apps.spreadsheet') ||
            mimeType.includes('google-apps.presentation')) {
            // Google Workspace files — proxy exports as PDF
            previewType = 'pdf';
        } else if (mimeType.includes('pdf')) {
            previewType = 'pdf';
        } else if (mimeType.startsWith('image/')) {
            previewType = 'image';
        } else if (mimeType.startsWith('video/')) {
            previewType = 'video';
        } else if (mimeType.startsWith('audio/')) {
            previewType = 'audio';
        } else if (mimeType.includes('text/') || mimeType.includes('markdown') ||
                   name.endsWith('.md') || name.endsWith('.txt') ||
                   name.endsWith('.json') || name.endsWith('.csv')) {
            previewType = 'iframe';
        }

        return apiSuccess({
            previewUrl,
            previewType,
            name,
            mimeType,
            driveFileId,
            webViewLink: `https://drive.google.com/file/d/${driveFileId}/view`,
        });
    } catch (err) {
        return apiError(err instanceof Error ? err.message : 'Unknown error', 500);
    }
}
