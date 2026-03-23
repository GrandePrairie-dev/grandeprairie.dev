import type { Env } from "../lib/env";
import { isContributor } from "../lib/auth";
import { logActivity } from "../lib/activity";
import { notifySlack } from "../lib/slack";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT * FROM ideas ORDER BY votes DESC, created_at DESC",
  ).all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const profile = await env.DB.prepare(
    "SELECT auth_provider, is_admin FROM profiles WHERE id = ?",
  ).bind(user.profileId).first<{ auth_provider: string; is_admin: number }>();
  if (!isContributor(profile?.auth_provider ?? null, !!profile?.is_admin)) {
    return Response.json({ error: "Contributors only \u2014 sign in with GitHub" }, { status: 403 });
  }

  const body = await request.json<Record<string, unknown>>();
  const { title, description, category, tags } = body;

  const result = await env.DB.prepare(
    `INSERT INTO ideas (title, description, category, author_id, tags)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(title, description ?? null, category ?? null, user.profileId, JSON.stringify(tags ?? []))
    .run();

  await logActivity(env, "new_idea", user.profileId, "idea", result.meta.last_row_id as number, String(title));
  await notifySlack(env, `\u{1F4A1} New idea: "${title}" submitted`);

  return Response.json({ id: result.meta.last_row_id }, { status: 201 });
};
