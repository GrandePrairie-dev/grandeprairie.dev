import type { Env } from "./env";

function magicLinkHtml(verifyUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#161B22;font-family:Inter,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#161B22;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
        <!-- Logo -->
        <tr><td style="padding-bottom:32px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:28px;height:28px;background:#2D4A3E;border:1px solid #4A7C6A;border-radius:6px;text-align:center;vertical-align:middle;">
              <span style="color:#3DBFA8;font-size:14px;font-weight:700;">&#9670;</span>
            </td>
            <td style="padding-left:10px;">
              <span style="color:#E2E6EC;font-size:14px;font-weight:700;letter-spacing:0.02em;">GRANDEPRAIRIE</span>
              <span style="color:#4A7C6A;font-size:10px;font-weight:600;">.DEV</span>
            </td>
          </tr></table>
        </td></tr>
        <!-- Content -->
        <tr><td style="background:#1E2530;border:1px solid #2E3742;border-radius:8px;padding:32px;">
          <h1 style="color:#E2E6EC;font-size:20px;font-weight:700;margin:0 0 12px;letter-spacing:-0.02em;">Sign in to GrandePrairie.dev</h1>
          <p style="color:#8B95A5;font-size:14px;line-height:1.6;margin:0 0 24px;">Click the button below to sign in. This link expires in 15 minutes.</p>
          <a href="${verifyUrl}" style="display:inline-block;padding:12px 28px;background:#2D4A3E;color:#3DBFA8;border:1px solid #4A7C6A;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.01em;">Sign In</a>
          <p style="color:#4C5B6E;font-size:12px;line-height:1.5;margin:24px 0 0;">If you didn't request this, you can safely ignore this email. No account will be created.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="color:#4C5B6E;font-size:11px;margin:0;">GrandePrairie.dev &mdash; Build together in the Peace Region</p>
          <p style="color:#4C5B6E;font-size:11px;margin:4px 0 0;">55&deg;N &middot; 118&deg;W</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendMagicLink(env: Env, to: string, token: string): Promise<boolean> {
  if (!env.RESEND_API_KEY) return false;
  const verifyUrl = `${env.SITE_URL}/api/auth/email/verify?token=${token}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GrandePrairie.dev <noreply@grandeprairie.dev>",
        to: [to],
        subject: "Sign in to GrandePrairie.dev",
        html: magicLinkHtml(verifyUrl),
      }),
    });
    return res.ok;
  } catch {
    console.error("Resend email failed");
    return false;
  }
}
