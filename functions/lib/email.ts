import type { Env } from "./env";

interface CommunityInviteEmail {
  to: string;
  inviterName: string;
  message?: string;
}

export interface DigestItem {
  title: string;
  detail?: string | null;
  href: string;
}

export interface WeeklyDigestEmail {
  to: string;
  unsubscribeToken: string;
  topics: string[];
  events: DigestItem[];
  boardPosts: DigestItem[];
  projects: DigestItem[];
  intel: DigestItem[];
}

export interface EventReminderEmail {
  to: string;
  eventTitle: string;
  startTime: string;
  location?: string | null;
}

interface ResendEmailPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plainText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

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

function communityInviteHtml({ inviterName, message }: CommunityInviteEmail, siteUrl: string): string {
  const safeInviterName = escapeHtml(plainText(inviterName) || "A GrandePrairie.dev member");
  const safeMessage = message
    ? escapeHtml(message.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n")).replace(/\n/g, "<br>")
    : "";
  const inviteUrl = `${siteUrl}/?invite=1`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#161B22;font-family:Inter,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#161B22;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
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
        <tr><td style="background:#1E2530;border:1px solid #2E3742;border-radius:8px;padding:32px;">
          <p style="color:#3DBFA8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 12px;">Community invite</p>
          <h1 style="color:#E2E6EC;font-size:22px;font-weight:700;margin:0 0 12px;letter-spacing:-0.02em;">${safeInviterName} invited you to GrandePrairie.dev</h1>
          <p style="color:#8B95A5;font-size:14px;line-height:1.6;margin:0 0 20px;">Join the Peace Region builder community for developers, trades workers, founders, students, local businesses, mentors, and organizations building practical things around Grande Prairie.</p>
          ${safeMessage ? `<div style="border-left:3px solid #D4A24E;background:#161B22;padding:12px 14px;margin:0 0 24px;"><p style="color:#C9D1D9;font-size:13px;line-height:1.6;margin:0;">${safeMessage}</p></div>` : ""}
          <a href="${inviteUrl}" style="display:inline-block;padding:12px 28px;background:#2D4A3E;color:#3DBFA8;border:1px solid #4A7C6A;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.01em;">Join the community</a>
          <p style="color:#4C5B6E;font-size:12px;line-height:1.5;margin:24px 0 0;">If this invite is not relevant, you can ignore it.</p>
        </td></tr>
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

function digestSection(title: string, items: DigestItem[], siteUrl: string): string {
  if (items.length === 0) return "";
  const rows = items.map((item) => {
    const href = item.href.startsWith("http") ? item.href : `${siteUrl}${item.href}`;
    return `<tr><td style="padding:0 0 14px;">
      <a href="${escapeHtml(href)}" style="color:#3DBFA8;font-size:14px;font-weight:700;text-decoration:none;">${escapeHtml(item.title)}</a>
      ${item.detail ? `<p style="color:#8B95A5;font-size:12px;line-height:1.5;margin:4px 0 0;">${escapeHtml(item.detail)}</p>` : ""}
    </td></tr>`;
  }).join("");

  return `<tr><td style="padding:22px 0 8px;border-top:1px solid #2E3742;">
    <p style="color:#D4A24E;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 14px;">${escapeHtml(title)}</p>
    <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
  </td></tr>`;
}

function weeklyDigestHtml(digest: WeeklyDigestEmail, siteUrl: string): string {
  const topics = new Set(digest.topics);
  const unsubscribeUrl = `${siteUrl}/digest?token=${encodeURIComponent(digest.unsubscribeToken)}`;
  const sections = [
    topics.has("events") ? digestSection("This week", digest.events, siteUrl) : "",
    topics.has("board") ? digestSection("From the board", digest.boardPosts, siteUrl) : "",
    topics.has("projects") ? digestSection("Projects shipping", digest.projects, siteUrl) : "",
    topics.has("intel") ? digestSection("Regional intel", digest.intel, siteUrl) : "",
  ].join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#161B22;font-family:Inter,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#161B22;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr><td style="padding-bottom:24px;">
          <span style="color:#E2E6EC;font-size:14px;font-weight:700;">GRANDEPRAIRIE</span><span style="color:#4A7C6A;font-size:10px;font-weight:600;">.DEV</span>
        </td></tr>
        <tr><td style="background:#1E2530;border:1px solid #2E3742;border-radius:8px;padding:30px;">
          <p style="color:#3DBFA8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 10px;">The GP.dev Weekly</p>
          <h1 style="color:#E2E6EC;font-size:22px;font-weight:700;margin:0 0 10px;">What local builders are doing</h1>
          <p style="color:#8B95A5;font-size:13px;line-height:1.6;margin:0 0 22px;">Events, questions, projects, and useful signals from Grande Prairie and the Peace Region.</p>
          <table width="100%" cellpadding="0" cellspacing="0">${sections || `<tr><td style="color:#8B95A5;font-size:13px;">A quiet week. Check the community for the latest activity.</td></tr>`}</table>
          <a href="${siteUrl}" style="display:inline-block;margin-top:12px;padding:11px 22px;background:#2D4A3E;color:#3DBFA8;border:1px solid #4A7C6A;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;">Open GrandePrairie.dev</a>
        </td></tr>
        <tr><td style="padding-top:20px;text-align:center;">
          <p style="color:#4C5B6E;font-size:11px;line-height:1.5;margin:0;">You subscribed to the GP.dev community digest. <a href="${unsubscribeUrl}" style="color:#8B95A5;">Manage or unsubscribe</a>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function digestConfirmationHtml(confirmUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#161B22;font-family:Inter,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#161B22;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
        <tr><td style="background:#1E2530;border:1px solid #2E3742;border-radius:8px;padding:32px;">
          <p style="color:#3DBFA8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 12px;">The GP.dev Weekly</p>
          <h1 style="color:#E2E6EC;font-size:22px;font-weight:700;margin:0 0 12px;">Confirm your subscription</h1>
          <p style="color:#8B95A5;font-size:14px;line-height:1.6;margin:0 0 24px;">Confirm that you want one weekly email with local events, community questions, projects, and regional tech signals.</p>
          <a href="${escapeHtml(confirmUrl)}" style="display:inline-block;padding:12px 24px;background:#2D4A3E;color:#3DBFA8;border:1px solid #4A7C6A;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">Confirm subscription</a>
          <p style="color:#4C5B6E;font-size:12px;line-height:1.5;margin:24px 0 0;">If you did not request this, ignore the email. You will not be subscribed.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function eventReminderHtml(reminder: EventReminderEmail, siteUrl: string): string {
  const date = new Date(reminder.startTime);
  const formatted = Number.isNaN(date.getTime())
    ? reminder.startTime
    : date.toLocaleString("en-CA", {
      timeZone: "America/Edmonton",
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#161B22;font-family:Inter,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#161B22;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
        <tr><td style="background:#1E2530;border:1px solid #2E3742;border-radius:8px;padding:32px;">
          <p style="color:#D4A24E;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 12px;">Event reminder</p>
          <h1 style="color:#E2E6EC;font-size:22px;font-weight:700;margin:0 0 16px;">${escapeHtml(reminder.eventTitle)}</h1>
          <p style="color:#C9D1D9;font-size:14px;line-height:1.6;margin:0 0 6px;">${escapeHtml(formatted)}</p>
          ${reminder.location ? `<p style="color:#8B95A5;font-size:13px;line-height:1.5;margin:0 0 24px;">${escapeHtml(reminder.location)}</p>` : `<div style="height:18px;"></div>`}
          <a href="${siteUrl}/calendar" style="display:inline-block;padding:12px 24px;background:#2D4A3E;color:#3DBFA8;border:1px solid #4A7C6A;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;">View event</a>
          <p style="color:#4C5B6E;font-size:12px;line-height:1.5;margin:24px 0 0;">You are receiving this reminder because you RSVP'd on GrandePrairie.dev.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendResendEmail(env: Env, payload: ResendEmailPayload): Promise<boolean> {
  if (!env.RESEND_API_KEY) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    console.error("Resend email failed");
    return false;
  }
}

export async function sendMagicLink(env: Env, to: string, token: string): Promise<boolean> {
  const verifyUrl = `${env.SITE_URL}/api/auth/email/verify?token=${token}`;

  return sendResendEmail(env, {
    from: "GrandePrairie.dev <noreply@grandeprairie.dev>",
    to: [to],
    subject: "Sign in to GrandePrairie.dev",
    html: magicLinkHtml(verifyUrl),
  });
}

export async function sendCommunityInvite(env: Env, invite: CommunityInviteEmail): Promise<boolean> {
  const inviterName = plainText(invite.inviterName) || "A GrandePrairie.dev member";

  return sendResendEmail(env, {
    from: "GrandePrairie.dev <noreply@grandeprairie.dev>",
    to: [invite.to],
    subject: `${inviterName} invited you to join GrandePrairie.dev`,
    html: communityInviteHtml(invite, env.SITE_URL),
  });
}

export async function sendWeeklyDigest(env: Env, digest: WeeklyDigestEmail): Promise<boolean> {
  return sendResendEmail(env, {
    from: "GrandePrairie.dev <noreply@grandeprairie.dev>",
    to: [digest.to],
    subject: "This week in Grande Prairie tech",
    html: weeklyDigestHtml(digest, env.SITE_URL),
  });
}

export async function sendDigestConfirmation(env: Env, to: string, token: string): Promise<boolean> {
  const confirmUrl = `${env.SITE_URL}/api/digest/confirm?token=${encodeURIComponent(token)}`;
  return sendResendEmail(env, {
    from: "GrandePrairie.dev <noreply@grandeprairie.dev>",
    to: [to],
    subject: "Confirm your GP.dev weekly digest",
    html: digestConfirmationHtml(confirmUrl),
  });
}

export async function sendEventReminder(env: Env, reminder: EventReminderEmail): Promise<boolean> {
  return sendResendEmail(env, {
    from: "GrandePrairie.dev <noreply@grandeprairie.dev>",
    to: [reminder.to],
    subject: `Tomorrow: ${plainText(reminder.eventTitle)}`,
    html: eventReminderHtml(reminder, env.SITE_URL),
  });
}
