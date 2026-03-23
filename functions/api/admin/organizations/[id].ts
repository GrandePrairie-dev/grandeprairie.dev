import type { Env } from "../../../lib/env";
import { isAdminInDb } from "../../../lib/auth";

export const onRequestPatch: PagesFunction<Env> = async ({ params, env, request, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!(await isAdminInDb(env.DB, user.profileId))) return new Response("Forbidden", { status: 403 });

  const body = await request.json<Record<string, unknown>>();
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const field of ["name", "type", "description", "website_url", "logo_url", "location"]) {
    if (field in body) { updates.push(`${field} = ?`); values.push(body[field] ?? null); }
  }
  if ("lat" in body) { updates.push("lat = ?"); values.push(body.lat ?? null); }
  if ("lng" in body) { updates.push("lng = ?"); values.push(body.lng ?? null); }

  if (updates.length === 0) return Response.json({ error: "No valid fields" }, { status: 400 });

  values.push(params.id);
  await env.DB.prepare(`UPDATE organizations SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  return Response.json({ success: true });
};
