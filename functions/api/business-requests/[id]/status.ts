interface Env {
  DB: D1Database;
}

export const onRequestPatch: PagesFunction<Env> = async ({ params, env, request }) => {
  const body = await request.json<{ status: string }>();
  await env.DB.prepare("UPDATE business_requests SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(body.status, params.id).run();
  return Response.json({ success: true });
};
