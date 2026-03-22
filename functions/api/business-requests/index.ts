interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT * FROM business_requests ORDER BY created_at DESC",
  ).all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<Record<string, unknown>>();
  const { business_name, contact_name, contact_email, problem, category } = body;

  const result = await env.DB.prepare(
    `INSERT INTO business_requests (business_name, contact_name, contact_email, problem, category)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(business_name, contact_name ?? null, contact_email ?? null, problem, category ?? "other")
    .run();

  return Response.json({ id: result.meta.last_row_id }, { status: 201 });
};
