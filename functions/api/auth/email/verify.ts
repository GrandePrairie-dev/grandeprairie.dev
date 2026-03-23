import type { Env } from "../../../lib/env";
import { createSession, setSessionCookie } from "../../../lib/auth";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) return new Response("Missing token", { status: 400 });

  // Validate and consume token (single-use)
  const tokenData = await env.SESSIONS.get(`email-login:${token}`, "json") as
    { email: string; returnTo: string } | null;
  if (!tokenData) return new Response("Invalid or expired link", { status: 400 });
  await env.SESSIONS.delete(`email-login:${token}`);

  const email = tokenData.email.trim().toLowerCase();

  // Find or create profile by email
  let profile = await env.DB.prepare(
    "SELECT id, is_admin FROM profiles WHERE LOWER(TRIM(email)) = ?",
  ).bind(email).first<{ id: number; is_admin: number }>();

  if (!profile) {
    const username = email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
    let finalUsername = username;
    const existing = await env.DB.prepare("SELECT id FROM profiles WHERE username = ?").bind(username).first();
    if (existing) finalUsername = `${username}-${crypto.randomUUID().slice(0, 4)}`;

    const result = await env.DB.prepare(
      `INSERT INTO profiles (name, username, email, auth_provider, email_verified, role)
       VALUES (?, ?, ?, 'email', 1, 'member')`,
    ).bind(finalUsername, finalUsername, email).run();

    profile = { id: result.meta.last_row_id as number, is_admin: 0 };
  } else {
    // Mark email as verified if not already
    await env.DB.prepare(
      "UPDATE profiles SET email_verified = 1, updated_at = datetime('now') WHERE id = ?",
    ).bind(profile.id).run();
  }

  const { sessionId, maxAge } = await createSession(env, profile.id, !!profile.is_admin, true);

  return new Response(null, {
    status: 302,
    headers: {
      Location: tokenData.returnTo || "/",
      "Set-Cookie": setSessionCookie(sessionId, maxAge),
    },
  });
};
