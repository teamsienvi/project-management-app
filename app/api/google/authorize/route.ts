import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

/**
 * GET /api/google/authorize
 * Redirects to Google OAuth consent page to get a new token with full 'drive' scope.
 */
export async function GET(_request: NextRequest) {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET!;
    const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI!;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/drive',
        ],
    });

    return NextResponse.redirect(authUrl);
}
