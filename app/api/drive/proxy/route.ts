import { NextRequest, NextResponse } from 'next/server';
import { createDriveClient } from '@/lib/google-drive/client';

/**
 * GET /api/drive/proxy?fileId=DRIVE_FILE_ID
 * Proxies Google Drive file content through our server so users
 * don't need to be signed into Google to view files.
 */
export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const fileId = url.searchParams.get('fileId');

        if (!fileId) {
            return new NextResponse('fileId is required', { status: 400 });
        }

        const drive = createDriveClient();

        // Get file metadata first
        const meta = await drive.files.get({
            fileId,
            fields: 'name, mimeType, size',
            supportsAllDrives: true,
        });

        const mimeType = meta.data.mimeType || 'application/octet-stream';
        const fileName = meta.data.name || 'file';

        // For Google Workspace files (Docs, Sheets, Slides), export as PDF
        const isGoogleDoc = mimeType.includes('google-apps.');
        let contentResponse;

        if (isGoogleDoc) {
            // Export as PDF for preview
            let exportMimeType = 'application/pdf';
            if (mimeType.includes('spreadsheet')) {
                exportMimeType = 'application/pdf';
            } else if (mimeType.includes('presentation')) {
                exportMimeType = 'application/pdf';
            } else if (mimeType.includes('document')) {
                exportMimeType = 'application/pdf';
            }

            contentResponse = await drive.files.export(
                { fileId, mimeType: exportMimeType },
                { responseType: 'stream' }
            );

            // Stream the exported content
            const chunks: Buffer[] = [];
            const stream = contentResponse.data as unknown as NodeJS.ReadableStream;
            for await (const chunk of stream) {
                chunks.push(Buffer.from(chunk as Uint8Array));
            }
            const buffer = Buffer.concat(chunks);

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': exportMimeType,
                    'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}.pdf"`,
                    'Cache-Control': 'private, max-age=300',
                },
            });
        } else {
            // For regular files, download the content directly
            contentResponse = await drive.files.get(
                { fileId, alt: 'media' },
                { responseType: 'stream' }
            );

            const chunks: Buffer[] = [];
            const stream = contentResponse.data as unknown as NodeJS.ReadableStream;
            for await (const chunk of stream) {
                chunks.push(Buffer.from(chunk as Uint8Array));
            }
            const buffer = Buffer.concat(chunks);

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': mimeType,
                    'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
                    'Cache-Control': 'private, max-age=300',
                },
            });
        }
    } catch (err) {
        console.error('Drive proxy error:', err);
        return new NextResponse(
            err instanceof Error ? err.message : 'Failed to fetch file',
            { status: 500 }
        );
    }
}
