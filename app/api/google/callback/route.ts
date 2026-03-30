import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

/**
 * GET /api/google/callback
 * Handles Google OAuth callback — displays new refresh token.
 */
export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
        return new NextResponse(`OAuth Error: ${error}`, { status: 400 });
    }

    if (!code) {
        return new NextResponse('Missing authorization code', { status: 400 });
    }

    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET!;
    const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI!;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    try {
        const { tokens } = await oauth2Client.getToken(code);

        const html = `
<!DOCTYPE html>
<html>
<head><title>Google Drive Authorization Complete</title></head>
<body style="font-family: system-ui; max-width: 600px; margin: 40px auto; padding: 20px;">
    <h1 style="color: green;">✅ Authorization Successful!</h1>
    <p>Copy the new refresh token below and replace <code>GOOGLE_DRIVE_REFRESH_TOKEN</code> in your <code>.env.local</code>:</p>
    <h3>New Refresh Token:</h3>
    <textarea readonly id="token" style="width: 100%; height: 80px; font-family: monospace; padding: 8px;">${tokens.refresh_token || 'No new refresh token received'}</textarea>
    <button onclick="navigator.clipboard.writeText(document.getElementById('token').value); this.textContent='Copied!'" style="margin-top: 8px; padding: 8px 16px; cursor: pointer;">📋 Copy Token</button>
    <p style="margin-top: 16px;"><strong>Scopes:</strong> ${tokens.scope}</p>
    <hr>
    <p>After updating <code>.env.local</code>, restart the dev server and refresh the Storyboards page.</p>
</body>
</html>`;

        return new NextResponse(html, {
            headers: { 'Content-Type': 'text/html' },
        });
    } catch (err) {
        return new NextResponse(
            `Token exchange failed: ${err instanceof Error ? err.message : String(err)}`,
            { status: 500 }
        );
    }
}
