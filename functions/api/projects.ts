interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT * FROM projects ORDER BY created_at DESC",
  ).all();
  return Response.json(results);
};
