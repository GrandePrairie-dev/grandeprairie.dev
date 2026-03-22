interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT * FROM ideas ORDER BY votes DESC, created_at DESC",
  ).all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<Record<string, unknown>>();
  const { title, description, category, author_id, tags } = body;

  const result = await env.DB.prepare(
    `INSERT INTO ideas (title, description, category, author_id, tags)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(title, description ?? null, category ?? null, author_id ?? null, JSON.stringify(tags ?? []))
    .run();

  return Response.json({ id: result.meta.last_row_id }, { status: 201 });
};
