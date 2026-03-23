import type { Env } from "../lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT * FROM profiles ORDER BY created_at DESC",
  ).all();
  return Response.json(results);
};
