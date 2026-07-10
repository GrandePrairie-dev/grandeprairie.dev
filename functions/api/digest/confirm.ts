import type { Env } from "../../lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return Response.json({ error: "Missing confirmation token." }, { status: 400 });

  const subscription = await env.DB.prepare(
    "SELECT id, unsubscribe_token FROM digest_subscriptions WHERE confirmation_token = ?",
  ).bind(token).first<{ id: number; unsubscribe_token: string }>();
  if (!subscription) return Response.json({ error: "Confirmation link is invalid." }, { status: 404 });

  await env.DB.prepare(
    `UPDATE digest_subscriptions SET
       status = 'active', frequency = 'weekly', confirmed_at = COALESCE(confirmed_at, datetime('now')),
       updated_at = datetime('now')
     WHERE id = ?`,
  ).bind(subscription.id).run();

  const redirect = new URL("/digest", env.SITE_URL);
  redirect.searchParams.set("token", subscription.unsubscribe_token);
  redirect.searchParams.set("confirmed", "1");
  return Response.redirect(redirect.toString(), 302);
};
