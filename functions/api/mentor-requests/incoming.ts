import type { Env } from "../../lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { results } = await env.DB.prepare(
    `SELECT mr.*, p.name as mentee_name, p.skills, p.role
     FROM mentor_requests mr
     LEFT JOIN profiles p ON mr.mentee_profile_id = p.id
     WHERE mr.mentor_profile_id = ?
     ORDER BY mr.created_at DESC`
  ).bind(user.profileId).all();

  return Response.json(results);
};
