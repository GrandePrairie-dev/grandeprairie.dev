import type { Env } from "./env";

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
        html: `<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;"><h2 style="color:#2D4A3E;margin-bottom:16px;">Sign in to GrandePrairie.dev</h2><p style="color:#5D6558;line-height:1.6;">Click the button below to sign in. This link expires in 15 minutes.</p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#2D4A3E;color:#3DBFA8;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">Sign In</a><p style="color:#8B95A5;font-size:13px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p><p style="color:#8B95A5;font-size:12px;border-top:1px solid #D8D4CF;padding-top:16px;margin-top:24px;">GrandePrairie.dev &mdash; Build together in the Peace Region</p></div>`,
      }),
    });
    return res.ok;
  } catch {
    console.error("Resend email failed");
    return false;
  }
}
