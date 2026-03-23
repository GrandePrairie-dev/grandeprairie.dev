import type { Env } from "../../../lib/env";
import { createSession, setSessionCookie } from "../../../lib/auth";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) return new Response("Missing code or state", { status: 400 });

  const stateData = await env.SESSIONS.get(`oauth-state:${state}`, "json") as
    { returnTo: string; remember: boolean } | null;
  if (!stateData) return new Response("Invalid or expired state", { status: 400 });
  await env.SESSIONS.delete(`oauth-state:${state}`);

  // Exchange code for token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: `${env.SITE_URL}/api/auth/callback/google`,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json<{ access_token?: string; error?: string }>();
  if (!tokenData.access_token) return new Response(`OAuth error: ${tokenData.error}`, { status: 400 });

  // Fetch user info
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userInfo = await userRes.json<{
    id: string; email: string; name: string; picture: string; verified_email: boolean;
  }>();

  const googleId = userInfo.id;

  // Find or create profile
  let profile = await env.DB.prepare(
    "SELECT id, is_admin FROM profiles WHERE google_id = ?",
  ).bind(googleId).first<{ id: number; is_admin: number }>();

  if (profile) {
    await env.DB.prepare(
      "UPDATE profiles SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?",
    ).bind(userInfo.picture, profile.id).run();
  } else {
    let username = userInfo.email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
    const existing = await env.DB.prepare("SELECT id FROM profiles WHERE username = ?").bind(username).first();
    if (existing) username = `${username}-${googleId.slice(-4)}`;

    const result = await env.DB.prepare(
      `INSERT INTO profiles (name, username, email, avatar_url, google_id, auth_provider, email_verified, role)
       VALUES (?, ?, ?, ?, ?, 'google', ?, 'member')`,
    ).bind(userInfo.name, username, userInfo.email, userInfo.picture, googleId, userInfo.verified_email ? 1 : 0).run();

    profile = { id: result.meta.last_row_id as number, is_admin: 0 };
  }

  const { sessionId, maxAge } = await createSession(env, profile.id, !!profile.is_admin, stateData.remember);

  return new Response(null, {
    status: 302,
    headers: {
      Location: stateData.returnTo || "/",
      "Set-Cookie": setSessionCookie(sessionId, maxAge),
    },
  });
};
