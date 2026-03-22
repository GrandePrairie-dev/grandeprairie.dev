interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const idea = await env.DB.prepare("SELECT * FROM ideas WHERE id = ?")
    .bind(params.id)
    .first();
  if (!idea) return new Response("Not found", { status: 404 });
  return Response.json(idea);
};
