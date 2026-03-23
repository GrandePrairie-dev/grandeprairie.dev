import type { Env } from "../../lib/env";
import { validateReturnTo } from "../../lib/auth";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const remember = url.searchParams.get("remember") !== "false";
  const returnTo = validateReturnTo(url.searchParams.get("return_to"));
  const provider = url.searchParams.get("provider") ?? "github";

  const state = crypto.randomUUID();
  await env.SESSIONS.put(
    `oauth-state:${state}`,
    JSON.stringify({ returnTo, remember, provider }),
    { expirationTtl: 600 },
  );

  if (provider === "google" && env.GOOGLE_CLIENT_ID) {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: `${env.SITE_URL}/api/auth/callback/google`,
      scope: "openid email profile",
      response_type: "code",
      state,
    });
    return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, 302);
  }

  // Default: GitHub
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${env.SITE_URL}/api/auth/callback`,
    scope: "read:user",
    state,
  });

  return Response.redirect(`https://github.com/login/oauth/authorize?${params}`, 302);
};
