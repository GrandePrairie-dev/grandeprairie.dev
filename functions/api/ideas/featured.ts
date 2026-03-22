interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT * FROM ideas WHERE is_featured = 1 ORDER BY votes DESC",
  ).all();
  return Response.json(results);
};
