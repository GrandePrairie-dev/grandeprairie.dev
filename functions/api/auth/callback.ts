import type { Env } from "../../lib/env";
import { createSession, setSessionCookie } from "../../lib/auth";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 });
  }

  // Validate CSRF state
  const stateData = await env.SESSIONS.get(`oauth-state:${state}`, "json") as
    { returnTo: string; remember: boolean } | null;
  if (!stateData) {
    return new Response("Invalid or expired state", { status: 400 });
  }
  await env.SESSIONS.delete(`oauth-state:${state}`);

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const tokenData = await tokenRes.json<{ access_token?: string; error?: string }>();
  if (!tokenData.access_token) {
    return new Response(`OAuth error: ${tokenData.error ?? "no token"}`, { status: 400 });
  }

  // Fetch GitHub user profile
  const ghRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/json",
      "User-Agent": "GrandePrairie.dev",
    },
  });
  const ghUser = await ghRes.json<{
    id: number; login: string; name: string | null; avatar_url: string;
  }>();

  const githubId = String(ghUser.id);

  // Find or create profile
  let profile = await env.DB.prepare(
    "SELECT id, is_admin FROM profiles WHERE github_id = ?",
  ).bind(githubId).first<{ id: number; is_admin: number }>();

  if (profile) {
    // Update avatar and username if changed
    await env.DB.prepare(
      "UPDATE profiles SET avatar_url = ?, github_username = ?, updated_at = datetime('now') WHERE id = ?",
    ).bind(ghUser.avatar_url, ghUser.login, profile.id).run();
  } else {
    // Check username collision
    let username = ghUser.login;
    const existing = await env.DB.prepare(
      "SELECT id FROM profiles WHERE username = ?",
    ).bind(username).first();
    if (existing) {
      username = `${ghUser.login}-${githubId.slice(-4)}`;
    }

    const result = await env.DB.prepare(
      `INSERT INTO profiles (name, username, avatar_url, github_id, github_username, role)
       VALUES (?, ?, ?, ?, ?, 'member')`,
    ).bind(
      ghUser.name ?? ghUser.login,
      username,
      ghUser.avatar_url,
      githubId,
      ghUser.login,
    ).run();

    profile = { id: result.meta.last_row_id as number, is_admin: 0 };
  }

  // Create session
  const { sessionId, maxAge } = await createSession(
    env, profile.id, !!profile.is_admin, stateData.remember,
  );

  // Redirect with session cookie
  return new Response(null, {
    status: 302,
    headers: {
      Location: stateData.returnTo || "/",
      "Set-Cookie": setSessionCookie(sessionId, maxAge),
    },
  });
};
