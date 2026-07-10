import type { Env, UserContext } from "../../lib/env";
import { sendDigestConfirmation } from "../../lib/email";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOPICS = new Set(["events", "board", "projects", "intel"]);
const DEFAULT_TOPICS = ["events", "board", "projects", "intel"];

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) && email.length <= 254 ? email : null;
}

function normalizeTopics(value: unknown): string[] {
  if (!Array.isArray(value)) return DEFAULT_TOPICS;
  const topics = [...new Set(value.filter((item): item is string => typeof item === "string" && TOPICS.has(item)))];
  return topics.length > 0 ? topics : DEFAULT_TOPICS;
}

async function takeRateLimit(env: Env, key: string): Promise<boolean> {
  const current = Number(await env.SESSIONS.get(key) ?? "0");
  if (Number.isFinite(current) && current >= 10) return false;
  await env.SESSIONS.put(key, String((Number.isFinite(current) ? current : 0) + 1), { expirationTtl: 86400 });
  return true;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return Response.json({ error: "Missing subscription token." }, { status: 400 });

  const subscription = await env.DB.prepare(
    "SELECT email, frequency, topics, status FROM digest_subscriptions WHERE unsubscribe_token = ?",
  ).bind(token).first();
  if (!subscription) return Response.json({ error: "Subscription not found." }, { status: 404 });
  return Response.json(subscription);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, data }) => {
  const user = (data as { user?: UserContext }).user;
  const body = await request.json<{ email?: unknown; topics?: unknown }>().catch(() => null);
  const email = normalizeEmail(body?.email);
  if (!email) return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  if (!env.RESEND_API_KEY) {
    return Response.json({ error: "Digest email is not configured." }, { status: 503 });
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  if (!await takeRateLimit(env, `digest-subscribe:${ip}`)) {
    return Response.json({ error: "Too many subscription attempts. Try again later." }, { status: 429 });
  }

  const topics = JSON.stringify(normalizeTopics(body?.topics));
  const existing = await env.DB.prepare(
    "SELECT id, unsubscribe_token, confirmed_at, status FROM digest_subscriptions WHERE email = ?",
  ).bind(email).first<{ id: number; unsubscribe_token: string; confirmed_at: string | null; status: string }>();

  if (existing?.confirmed_at && existing.status === "active") {
    await env.DB.prepare(
      `UPDATE digest_subscriptions SET
         profile_id = COALESCE(?, profile_id), topics = ?, frequency = 'weekly',
         status = 'active', updated_at = datetime('now')
       WHERE id = ?`,
    ).bind(user?.profileId ?? null, topics, existing.id).run();
    return Response.json({ message: "Your weekly digest preferences were updated." });
  }

  const confirmationToken = crypto.randomUUID();
  if (existing) {
    await env.DB.prepare(
      `UPDATE digest_subscriptions SET
         profile_id = COALESCE(?, profile_id), topics = ?, frequency = 'weekly',
         status = 'unsubscribed', confirmation_token = ?, confirmed_at = NULL,
         updated_at = datetime('now')
       WHERE id = ?`,
    ).bind(user?.profileId ?? null, topics, confirmationToken, existing.id).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO digest_subscriptions
         (email, profile_id, topics, status, unsubscribe_token, confirmation_token)
       VALUES (?, ?, ?, 'unsubscribed', ?, ?)`,
    ).bind(email, user?.profileId ?? null, topics, crypto.randomUUID(), confirmationToken).run();
  }

  const sent = await sendDigestConfirmation(env, email, confirmationToken);
  if (!sent) {
    return Response.json({ error: "Confirmation email could not be sent." }, { status: 502 });
  }

  return Response.json({ message: "Check your email to confirm the weekly digest." }, { status: 202 });
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<{ token?: string; topics?: unknown; frequency?: string }>().catch(() => null);
  if (!body?.token) return Response.json({ error: "Missing subscription token." }, { status: 400 });
  const frequency = body.frequency === "paused" ? "paused" : "weekly";
  const topics = JSON.stringify(normalizeTopics(body.topics));
  const result = await env.DB.prepare(
    `UPDATE digest_subscriptions SET frequency = ?, topics = ?, status = 'active', updated_at = datetime('now')
     WHERE unsubscribe_token = ? AND confirmed_at IS NOT NULL`,
  ).bind(frequency, topics, body.token).run();
  if ((result.meta.changes ?? 0) === 0) return Response.json({ error: "Subscription not found." }, { status: 404 });
  return Response.json({ ok: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return Response.json({ error: "Missing subscription token." }, { status: 400 });
  const result = await env.DB.prepare(
    `UPDATE digest_subscriptions SET status = 'unsubscribed', updated_at = datetime('now')
     WHERE unsubscribe_token = ?`,
  ).bind(token).run();
  if ((result.meta.changes ?? 0) === 0) return Response.json({ error: "Subscription not found." }, { status: 404 });
  return Response.json({ ok: true });
};
