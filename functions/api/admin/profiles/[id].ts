import type { Env } from "../../../lib/env";
import { isAdminInDb } from "../../../lib/auth";

export const onRequestPatch: PagesFunction<Env> = async ({ params, env, request, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!(await isAdminInDb(env.DB, user.profileId))) return new Response("Forbidden", { status: 403 });

  const body = await request.json<Record<string, unknown>>();
  const updates: string[] = [];
  const values: unknown[] = [];

  if ("is_featured" in body) {
    updates.push("is_featured = ?");
    values.push(body.is_featured ? 1 : 0);
  }
  if ("is_admin" in body) {
    updates.push("is_admin = ?");
    values.push(body.is_admin ? 1 : 0);
  }

  if (updates.length === 0) return Response.json({ error: "No valid fields" }, { status: 400 });

  values.push(params.id);
  await env.DB.prepare(`UPDATE profiles SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  return Response.json({ success: true });
};
