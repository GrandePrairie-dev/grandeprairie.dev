import type { Env, UserContext } from "../lib/env";
import { sendCommunityInvite } from "../lib/email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\r\n/g, "\n").slice(0, maxLength);
}

async function parseInviteBody(request: Request): Promise<{ email?: unknown; message?: unknown } | null> {
  try {
    return await request.json<{ email?: unknown; message?: unknown }>();
  } catch {
    return null;
  }
}

async function takeRateLimit(env: Env, key: string, limit: number, ttl: number): Promise<boolean> {
  const parsed = parseInt(await env.SESSIONS.get(key) ?? "0", 10);
  const current = Number.isFinite(parsed) ? parsed : 0;
  if (current >= limit) return false;
  await env.SESSIONS.put(key, String(current + 1), { expirationTtl: ttl });
  return true;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, data }) => {
  const user = (data as { user?: UserContext }).user;
  if (!user) {
    return Response.json({ error: "Sign in to send an invite." }, { status: 401 });
  }

  if (!env.RESEND_API_KEY) {
    return Response.json({ error: "Invite email is not configured." }, { status: 503 });
  }

  const body = await parseInviteBody(request);
  if (!body) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  if (!email) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const message = cleanText(body.message, 600);
  const inviter = await env.DB.prepare(
    "SELECT id, name, email FROM profiles WHERE id = ?",
  ).bind(user.profileId).first<{ id: number; name: string; email: string | null }>();

  if (!inviter) {
    return Response.json({ error: "Signed-in profile was not found." }, { status: 401 });
  }

  if (inviter.email?.trim().toLowerCase() === email) {
    return Response.json({ error: "Invite someone other than yourself." }, { status: 400 });
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const allowedByMember = await takeRateLimit(env, `invite-rate:member:${user.profileId}`, 10, 3600);
  const allowedByRecipient = await takeRateLimit(env, `invite-rate:recipient:${email}`, 3, 86400);
  const allowedByIp = await takeRateLimit(env, `invite-rate:ip:${ip}`, 20, 3600);

  if (!allowedByMember || !allowedByRecipient || !allowedByIp) {
    return Response.json({ error: "Invite limit reached. Try again later." }, { status: 429 });
  }

  const sent = await sendCommunityInvite(env, {
    to: email,
    inviterName: inviter.name,
    message,
  });

  if (!sent) {
    return Response.json({ error: "Invite could not be sent." }, { status: 502 });
  }

  return Response.json({ message: "Invite sent." }, { status: 202 });
};
