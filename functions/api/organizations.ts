import type { Env } from "../lib/env";
import { isAdminInDb } from "../lib/auth";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  let query = "SELECT * FROM organizations";
  const bindings: unknown[] = [];

  if (type) {
    query += " WHERE type = ?";
    bindings.push(type);
  }

  query += " ORDER BY name ASC";

  const stmt = env.DB.prepare(query);
  const { results } = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!(await isAdminInDb(env.DB, user.profileId))) return new Response("Forbidden", { status: 403 });

  const body = await request.json<Record<string, unknown>>();
  const { slug, name, type, description, website_url, location, lat, lng } = body;

  if (!slug || !name) return Response.json({ error: "slug and name required" }, { status: 400 });

  const result = await env.DB.prepare(
    `INSERT INTO organizations (slug, name, type, description, website_url, location, lat, lng)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(slug, name, type ?? null, description ?? null, website_url ?? null, location ?? null, lat ?? null, lng ?? null).run();

  return Response.json({ id: result.meta.last_row_id }, { status: 201 });
};
