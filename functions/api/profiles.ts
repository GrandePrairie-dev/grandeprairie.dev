interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT * FROM profiles ORDER BY created_at DESC",
  ).all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<Record<string, unknown>>();
  const { name, username, email, title, bio, role, skills } = body;

  const result = await env.DB.prepare(
    `INSERT INTO profiles (name, username, email, title, bio, role, skills)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      name,
      username,
      email ?? null,
      title ?? null,
      bio ?? null,
      role ?? "member",
      JSON.stringify(skills ?? []),
    )
    .run();

  return Response.json({ id: result.meta.last_row_id }, { status: 201 });
};
