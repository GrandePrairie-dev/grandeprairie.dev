import type { Env } from "../../../lib/env";
import { recordSignal } from "../../../lib/intelligence";

export const onRequestPost: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const group = await env.DB.prepare(
    "SELECT id, slug FROM community_groups WHERE slug = ? AND is_active = 1",
  ).bind(params.slug).first<{ id: number; slug: string }>();
  if (!group) return new Response("Not found", { status: 404 });

  const result = await env.DB.prepare(
    `INSERT OR IGNORE INTO group_memberships (group_id, profile_id, role)
     SELECT ?, ?, CASE
       WHEN EXISTS (SELECT 1 FROM group_memberships WHERE group_id = ?) THEN 'member'
       ELSE 'organizer'
     END`,
  ).bind(group.id, user.profileId, group.id).run();
  if ((result.meta.changes ?? 0) === 0) {
    return Response.json({ error: "Already a member" }, { status: 409 });
  }

  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: "group_joined",
    targetType: "group",
    targetId: group.id,
    topic: group.slug,
    source: "groups",
    outcome: "joined",
    dedupeKey: `group-joined:${group.id}:${user.profileId}`,
  });
  const membership = await env.DB.prepare(
    "SELECT role FROM group_memberships WHERE group_id = ? AND profile_id = ?",
  ).bind(group.id, user.profileId).first<{ role: string }>();
  return Response.json({ joined: true, role: membership?.role ?? "member" });
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const group = await env.DB.prepare(
    "SELECT id FROM community_groups WHERE slug = ? AND is_active = 1",
  ).bind(params.slug).first<{ id: number }>();
  if (!group) return new Response("Not found", { status: 404 });

  const membership = await env.DB.prepare(
    "SELECT role FROM group_memberships WHERE group_id = ? AND profile_id = ?",
  ).bind(group.id, user.profileId).first<{ role: string }>();
  if (!membership) return new Response("Not found", { status: 404 });
  if (membership.role === "organizer") {
    const organizers = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM group_memberships WHERE group_id = ? AND role = 'organizer'",
    ).bind(group.id).first<{ count: number }>();
    if ((organizers?.count ?? 0) <= 1) {
      return Response.json({ error: "The final organizer cannot leave the group" }, { status: 409 });
    }
  }

  await env.DB.prepare(
    "DELETE FROM group_memberships WHERE group_id = ? AND profile_id = ?",
  ).bind(group.id, user.profileId).run();
  return Response.json({ joined: false });
};
