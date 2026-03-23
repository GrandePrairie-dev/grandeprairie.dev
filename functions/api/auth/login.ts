import type { Env } from "../../lib/env";
import { validateReturnTo } from "../../lib/auth";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const remember = url.searchParams.get("remember") !== "false";
  const returnTo = validateReturnTo(url.searchParams.get("return_to"));

  const state = crypto.randomUUID();
  await env.SESSIONS.put(
    `oauth-state:${state}`,
    JSON.stringify({ returnTo, remember }),
    { expirationTtl: 600 },
  );

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${env.SITE_URL}/api/auth/callback`,
    scope: "read:user",
    state,
  });

  return Response.redirect(`https://github.com/login/oauth/authorize?${params}`, 302);
};
