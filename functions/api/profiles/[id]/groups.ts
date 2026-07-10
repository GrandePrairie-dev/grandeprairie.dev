import type { Env } from "../../../lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const profileId = Number(params.id);
  if (!Number.isInteger(profileId)) return new Response("Invalid profile", { status: 400 });
  const { results } = await env.DB.prepare(
    `SELECT g.id, g.slug, g.name, g.description, g.tags,
            gm.role AS viewer_role, 0 AS member_count, 0 AS organizer_count
       FROM group_memberships gm
       JOIN community_groups g ON g.id = gm.group_id
      WHERE gm.profile_id = ? AND g.is_active = 1
      ORDER BY g.name ASC`,
  ).bind(profileId).all();
  return Response.json(results);
};
