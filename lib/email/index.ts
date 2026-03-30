import { Resend } from 'resend';

const APP_NAME = process.env.APP_BRAND_NAME || 'IWPM';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@example.com';
const REPLY_TO = process.env.RESEND_REPLY_TO || undefined;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function getResend(): Resend | null {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
        console.warn('[email] RESEND_API_KEY not set — skipping email delivery');
        return null;
    }
    return new Resend(key);
}

interface InviteEmailParams {
    to: string;
    workspaceName: string;
    inviterName: string | null;
    role: string;
    token: string;
    workspaceId: string;
}

/**
 * Send a branded workspace invitation email via Resend.
 * Returns true if sent, false if skipped (no API key).
 */
export async function sendInviteEmail(params: InviteEmailParams): Promise<boolean> {
    const resend = getResend();
    if (!resend) return false;

    const { to, workspaceName, inviterName, role, token, workspaceId } = params;
    const acceptUrl = `${APP_URL}/api/invites/accept-link?token=${encodeURIComponent(token)}&workspaceId=${encodeURIComponent(workspaceId)}`;
    const inviterLine = inviterName ? `<strong>${inviterName}</strong> has` : 'You have been';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0e12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e12;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#1a1a24;border-radius:12px;border:1px solid rgba(255,255,255,0.06);">
        <!-- Header -->
        <tr><td style="padding:32px 32px 0;text-align:center;">
          <h1 style="margin:0;font-size:24px;font-weight:800;letter-spacing:-0.03em;">
            <span style="background:linear-gradient(135deg,#00e5ff,#e040fb);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">⬡ ${APP_NAME}</span>
          </h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:24px 32px;">
          <h2 style="margin:0 0 16px;color:#ffffff;font-size:20px;font-weight:600;">You're invited!</h2>
          <p style="margin:0 0 8px;color:#a0a0b8;font-size:15px;line-height:1.6;">
            ${inviterLine} invited you to join <strong style="color:#ffffff;">${workspaceName}</strong> as a <strong style="color:#00e5ff;">${role}</strong>.
          </p>
          <p style="margin:0 0 24px;color:#a0a0b8;font-size:14px;line-height:1.5;">
            Click the button below to accept the invitation and get started.
          </p>
          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${acceptUrl}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#00e5ff,#e040fb);color:#000000;font-weight:700;font-size:15px;border-radius:8px;text-decoration:none;">
              Accept Invitation
            </a>
          </td></tr></table>
        </td></tr>
        <!-- Fallback -->
        <tr><td style="padding:0 32px 32px;">
          <p style="margin:16px 0 0;color:#666680;font-size:12px;text-align:center;line-height:1.5;">
            Or paste this invite code on the Join Workspace page:<br>
            <code style="background:#0e0e12;padding:4px 8px;border-radius:4px;color:#00e5ff;font-size:13px;">${token}</code>
          </p>
        </td></tr>
      </table>
      <p style="margin:24px 0 0;color:#444458;font-size:11px;text-align:center;">
        Sent by ${APP_NAME} · This invitation expires in 7 days
      </p>
    </td></tr>
  </table>
</body>
</html>`;

    try {
        await resend.emails.send({
            from: `${APP_NAME} <${FROM_EMAIL}>`,
            to,
            replyTo: REPLY_TO,
            subject: `You're invited to ${workspaceName} on ${APP_NAME}`,
            html,
        });
        return true;
    } catch (err) {
        console.error('[email] Failed to send invite email:', err);
        return false;
    }
}
