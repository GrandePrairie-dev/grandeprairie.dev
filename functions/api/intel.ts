interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT * FROM intel ORDER BY is_pinned DESC, created_at DESC",
  ).all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<Record<string, unknown>>();
  const { title, body: content, category, source_url, author_id, tags } = body;

  const result = await env.DB.prepare(
    `INSERT INTO intel (title, body, category, source_url, author_id, tags)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(title, content ?? null, category ?? null, source_url ?? null, author_id ?? null, JSON.stringify(tags ?? []))
    .run();

  return Response.json({ id: result.meta.last_row_id }, { status: 201 });
};
