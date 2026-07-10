import type { Env } from "../../lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  const group = await env.DB.prepare(
    `SELECT g.id, g.slug, g.name, g.description, g.tags,
            COUNT(gm.profile_id) AS member_count,
            SUM(CASE WHEN gm.role = 'organizer' THEN 1 ELSE 0 END) AS organizer_count,
            viewer.role AS viewer_role
       FROM community_groups g
       LEFT JOIN group_memberships gm ON gm.group_id = g.id
       LEFT JOIN group_memberships viewer
         ON viewer.group_id = g.id AND viewer.profile_id = ?
      WHERE g.slug = ? AND g.is_active = 1
      GROUP BY g.id`,
  ).bind(user?.profileId ?? -1, params.slug).first<Record<string, unknown>>();
  if (!group) return new Response("Not found", { status: 404 });

  const { results: members } = await env.DB.prepare(
    `SELECT p.id, p.name, p.username, p.title, p.role, p.avatar_url,
            gm.role AS membership_role, gm.joined_at
       FROM group_memberships gm
       JOIN profiles p ON p.id = gm.profile_id
      WHERE gm.group_id = ?
      ORDER BY CASE gm.role WHEN 'organizer' THEN 0 ELSE 1 END, gm.joined_at ASC
      LIMIT 100`,
  ).bind(group.id).all();
  return Response.json({ ...group, members });
};
