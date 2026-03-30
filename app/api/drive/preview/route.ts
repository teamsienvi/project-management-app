import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/utils';

/**
 * GET /api/drive/preview?fileId=DRIVE_FILE_ID&mimeType=...&name=...
 * Returns preview info for a raw Drive file (not tracked in DB).
 */
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const driveFileId = url.searchParams.get('fileId');
        const mimeType = url.searchParams.get('mimeType') || '';
        const name = url.searchParams.get('name') || 'File';

        if (!driveFileId) return apiError('fileId is required', 400);

        let previewUrl = '';
        let previewType: 'iframe' | 'image' | 'video' | 'audio' | 'pdf' | 'external' = 'iframe';

        if (mimeType.includes('google-apps.document')) {
            previewUrl = `https://docs.google.com/document/d/${driveFileId}/preview`;
        } else if (mimeType.includes('google-apps.spreadsheet')) {
            previewUrl = `https://docs.google.com/spreadsheets/d/${driveFileId}/preview`;
        } else if (mimeType.includes('google-apps.presentation')) {
            previewUrl = `https://docs.google.com/presentation/d/${driveFileId}/preview`;
        } else if (mimeType.includes('pdf')) {
            previewUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;
            previewType = 'pdf';
        } else if (mimeType.startsWith('image/')) {
            previewUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;
            previewType = 'image';
        } else if (mimeType.startsWith('video/')) {
            previewUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;
            previewType = 'video';
        } else if (mimeType.startsWith('audio/')) {
            previewUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;
            previewType = 'audio';
        } else {
            previewUrl = `https://drive.google.com/file/d/${driveFileId}/preview`;
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
