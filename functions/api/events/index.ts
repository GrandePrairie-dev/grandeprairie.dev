interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT * FROM events ORDER BY start_time DESC",
  ).all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<Record<string, unknown>>();
  const { title, description, category, start_time, location, organizer_id } = body;

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
      organizer_id ?? null,
    )
    .run();

  return Response.json({ id: result.meta.last_row_id }, { status: 201 });
};
