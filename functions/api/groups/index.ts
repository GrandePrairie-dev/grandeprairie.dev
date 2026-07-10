import type { Env } from "../../lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  const { results } = await env.DB.prepare(
    `SELECT g.id, g.slug, g.name, g.description, g.tags,
            COUNT(gm.profile_id) AS member_count,
            SUM(CASE WHEN gm.role = 'organizer' THEN 1 ELSE 0 END) AS organizer_count,
            viewer.role AS viewer_role
       FROM community_groups g
       LEFT JOIN group_memberships gm ON gm.group_id = g.id
       LEFT JOIN group_memberships viewer
         ON viewer.group_id = g.id AND viewer.profile_id = ?
      WHERE g.is_active = 1
      GROUP BY g.id
      ORDER BY g.name ASC`,
  ).bind(user?.profileId ?? -1).all();
  return Response.json(results);
};
