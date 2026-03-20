import { Readable } from 'stream';
import { createDriveClient } from './client';

const ROOT_FOLDER_ID = () => {
    const id = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!id) throw new Error('Missing GOOGLE_DRIVE_ROOT_FOLDER_ID');
    return id;
};

/**
 * Create a folder in Google Drive under a specific parent.
 */
export async function createFolder(
    name: string,
    parentFolderId: string
): Promise<string> {
    const drive = createDriveClient();
    const response = await drive.files.create({
        requestBody: {
            name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId],
        },
        fields: 'id',
    });

    if (!response.data.id) {
        throw new Error('Failed to create Google Drive folder');
    }

    return response.data.id;
}

/**
 * Upload a file buffer to Google Drive under a specific parent folder.
 * Returns { fileId, webViewLink }.
 */
export async function uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    parentFolderId: string
): Promise<{ fileId: string; webViewLink: string }> {
    if (!parentFolderId) {
        throw new Error('parentFolderId is required — never upload to Drive root');
    }

    const drive = createDriveClient();
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);

    const response = await drive.files.create({
        requestBody: {
            name: filename,
            parents: [parentFolderId],
        },
        media: {
            mimeType,
            body: readable,
        },
        fields: 'id, webViewLink',
    });

    if (!response.data.id) {
        throw new Error('Failed to upload file to Google Drive');
    }

    return {
        fileId: response.data.id,
        webViewLink: response.data.webViewLink || '',
    };
}

/**
 * Get the webViewLink for a file.
 */
export async function getFileWebViewLink(fileId: string): Promise<string> {
    const drive = createDriveClient();
    const response = await drive.files.get({
        fileId,
        fields: 'webViewLink',
    });
    return response.data.webViewLink || '';
}

/**
 * Delete a file (move to trash or permanent delete).
 */
export async function deleteFile(
    fileId: string,
    permanent = false
): Promise<void> {
    const drive = createDriveClient();
    if (permanent) {
        await drive.files.delete({ fileId });
    } else {
        await drive.files.update({
            fileId,
            requestBody: { trashed: true },
        });
    }
}

/**
 * Provision the full workspace folder tree under the app root folder.
 * Creates:
 *   /App Root Folder
 *     /Workspace - <name>
 *       /Storyboards
 *       /General Files
 *       /Task Attachments
 *
 * Returns all created folder IDs.
 */
export async function ensureWorkspaceFolderTree(workspaceName: string): Promise<{
    rootFolderId: string;
    storyboardsFolderId: string;
    generalFilesFolderId: string;
    taskAttachmentsFolderId: string;
}> {
    const appRootId = ROOT_FOLDER_ID();

    // Create workspace root folder
    const rootFolderId = await createFolder(
        `Workspace - ${workspaceName}`,
        appRootId
    );

    // Create child folders in parallel
    const [storyboardsFolderId, generalFilesFolderId, taskAttachmentsFolderId] =
        await Promise.all([
            createFolder('Storyboards', rootFolderId),
            createFolder('General Files', rootFolderId),
            createFolder('Task Attachments', rootFolderId),
        ]);

    return {
        rootFolderId,
        storyboardsFolderId,
        generalFilesFolderId,
        taskAttachmentsFolderId,
    };
}
