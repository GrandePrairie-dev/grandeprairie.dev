import type { Env } from "../lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const topic = url.searchParams.get("topic");

  let query = "SELECT * FROM profiles WHERE mentor_available = 1";
  const bindings: unknown[] = [];

  if (topic) {
    query += " AND mentor_topics LIKE ?";
    bindings.push(`%${topic}%`);
  }

  query += " ORDER BY created_at DESC";

  const stmt = env.DB.prepare(query);
  const { results } = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all();
  return Response.json(results);
};
