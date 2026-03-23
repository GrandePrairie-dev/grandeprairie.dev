import type { Env } from "../../lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT * FROM events ORDER BY start_time DESC",
  ).all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await request.json<Record<string, unknown>>();
  const { title, description, category, start_time, location } = body;

  const result = await env.DB.prepare(
    `INSERT INTO events (title, description, category, start_time, location, organizer_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      title,
      description ?? null,
      category ?? null,
      start_time,
      location ?? null,
      user.profileId,
    )
    .run();

  return Response.json({ id: result.meta.last_row_id }, { status: 201 });
};
