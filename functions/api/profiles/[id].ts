interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const profile = await env.DB.prepare("SELECT * FROM profiles WHERE id = ?")
    .bind(params.id)
    .first();
  if (!profile) return new Response("Not found", { status: 404 });
  return Response.json(profile);
};
