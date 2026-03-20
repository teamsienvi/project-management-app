import { google } from 'googleapis';

/**
 * Create an authenticated Google Drive API v3 client.
 * Uses OAuth2 with a pre-obtained refresh token from a dedicated account.
 * SERVER-ONLY — never import in client code.
 */
export function createDriveClient() {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error(
            'Missing Google Drive credentials: GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, or GOOGLE_DRIVE_REFRESH_TOKEN'
        );
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    return google.drive({ version: 'v3', auth: oauth2Client });
}
