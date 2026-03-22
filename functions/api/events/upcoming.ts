interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT * FROM events
     WHERE start_time >= datetime('now')
     ORDER BY start_time ASC`,
  ).all();
  return Response.json(results);
};
