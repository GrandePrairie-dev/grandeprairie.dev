interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async ({ params, env }) => {
  await env.DB.prepare("UPDATE ideas SET votes = votes + 1 WHERE id = ?")
    .bind(params.id)
    .run();
  const idea = await env.DB.prepare("SELECT * FROM ideas WHERE id = ?")
    .bind(params.id)
    .first();
  return Response.json(idea);
};
