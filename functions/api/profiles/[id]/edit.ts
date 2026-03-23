import type { Env } from "../../../lib/env";

const VALID_ROLES = ["developer", "trades", "student", "founder", "operator", "mentor", "member"];

export const onRequestPatch: PagesFunction<Env> = async ({ params, env, request, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (user.profileId !== Number(params.id)) {
    return new Response("Forbidden", { status: 403 });
  }

  const body = await request.json<Record<string, unknown>>();
  const updates: string[] = [];
  const values: unknown[] = [];

  if ("name" in body && typeof body.name === "string" && body.name.trim()) {
    updates.push("name = ?"); values.push(body.name.trim());
  }
  if ("title" in body) {
    updates.push("title = ?"); values.push(typeof body.title === "string" ? body.title.trim() : null);
  }
  if ("bio" in body) {
    updates.push("bio = ?"); values.push(typeof body.bio === "string" ? body.bio.trim() : null);
  }
  if ("role" in body && typeof body.role === "string" && VALID_ROLES.includes(body.role)) {
    updates.push("role = ?"); values.push(body.role);
  }
  if ("skills" in body) {
    updates.push("skills = ?"); values.push(JSON.stringify(body.skills ?? []));
  }
  if ("links" in body) {
    updates.push("links = ?"); values.push(JSON.stringify(body.links ?? {}));
  }

  if (updates.length === 0) return Response.json({ error: "No valid fields" }, { status: 400 });

  updates.push("updated_at = datetime('now')");
  values.push(params.id);

  await env.DB.prepare(`UPDATE profiles SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();

  const profile = await env.DB.prepare("SELECT * FROM profiles WHERE id = ?").bind(params.id).first();
  return Response.json(profile);
};
