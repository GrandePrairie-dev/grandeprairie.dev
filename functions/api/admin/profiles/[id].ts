import type { Env } from "../../../lib/env";
import { isAdminInDb } from "../../../lib/auth";

function parseProfileId(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

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

export const onRequestDelete: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!(await isAdminInDb(env.DB, user.profileId))) return new Response("Forbidden", { status: 403 });

  const profileId = parseProfileId(params.id);
  if (!profileId) return Response.json({ error: "Invalid profile id" }, { status: 400 });
  if (profileId === user.profileId) {
    return Response.json({ error: "Admins cannot delete their own profile" }, { status: 400 });
  }

  const target = await env.DB.prepare(
    "SELECT id, name, is_admin FROM profiles WHERE id = ?",
  ).bind(profileId).first<{ id: number; name: string; is_admin: number }>();
  if (!target) return Response.json({ error: "Profile not found" }, { status: 404 });

  if (target.is_admin) {
    const adminCount = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM profiles WHERE is_admin = 1",
    ).first<{ count: number }>();
    if ((adminCount?.count ?? 0) <= 1) {
      return Response.json({ error: "Cannot delete the last admin profile" }, { status: 400 });
    }
  }

  await env.DB.batch([
    env.DB.prepare("UPDATE ideas SET author_id = NULL WHERE author_id = ?").bind(profileId),
    env.DB.prepare("UPDATE projects SET author_id = NULL WHERE author_id = ?").bind(profileId),
    env.DB.prepare("UPDATE events SET organizer_id = NULL WHERE organizer_id = ?").bind(profileId),
    env.DB.prepare("UPDATE intel SET author_id = NULL WHERE author_id = ?").bind(profileId),
    env.DB.prepare("UPDATE comments SET author_id = NULL WHERE author_id = ?").bind(profileId),
    env.DB.prepare("UPDATE board_posts SET author_id = NULL WHERE author_id = ?").bind(profileId),
    env.DB.prepare("UPDATE activity SET profile_id = NULL WHERE profile_id = ?").bind(profileId),
    env.DB.prepare("UPDATE business_requests SET matched_profile_id = NULL WHERE matched_profile_id = ?").bind(profileId),
    env.DB.prepare("DELETE FROM idea_votes WHERE profile_id = ?").bind(profileId),
    env.DB.prepare("DELETE FROM business_request_interests WHERE profile_id = ?").bind(profileId),
    env.DB.prepare("DELETE FROM mentor_requests WHERE mentee_profile_id = ? OR mentor_profile_id = ?").bind(profileId, profileId),
    env.DB.prepare("DELETE FROM organization_members WHERE profile_id = ?").bind(profileId),
    env.DB.prepare("DELETE FROM profiles WHERE id = ?").bind(profileId),
  ]);

  return Response.json({ success: true, deleted: { id: target.id, name: target.name } });
};
