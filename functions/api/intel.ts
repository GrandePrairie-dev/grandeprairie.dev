import type { Env } from "../lib/env";
import { isAdminInDb } from "../lib/auth";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT * FROM intel ORDER BY is_pinned DESC, created_at DESC",
  ).all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, data }) => {
  const user = (data as { user?: { profileId: number; isAdmin: boolean } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const admin = await isAdminInDb(env.DB, user.profileId);
  if (!admin) return new Response("Forbidden", { status: 403 });

  const body = await request.json<Record<string, unknown>>();
  const { title, body: content, category, source_url, tags } = body;

  const result = await env.DB.prepare(
    `INSERT INTO intel (title, body, category, source_url, author_id, tags)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(title, content ?? null, category ?? null, source_url ?? null, user.profileId, JSON.stringify(tags ?? []))
    .run();

  return Response.json({ id: result.meta.last_row_id }, { status: 201 });
};
