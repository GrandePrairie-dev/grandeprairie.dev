import type { Env } from "../lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 10), 50);

  const { results } = await env.DB.prepare(
    `SELECT a.*, p.name as profile_name, p.avatar_url
     FROM activity a LEFT JOIN profiles p ON a.profile_id = p.id
     ORDER BY a.created_at DESC LIMIT ?`,
  ).bind(limit).all();

  return Response.json(results);
};
