import type { Env, UserContext } from "../../lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ data, env }) => {
  const user = (data as { user?: UserContext }).user;
  if (!user) return Response.json(null);

  const profile = await env.DB.prepare(
    `SELECT id, name, username, title, bio, role, skills, badges, links,
            avatar_url, is_admin, is_featured, github_username,
            auth_provider, google_id, email_verified
     FROM profiles WHERE id = ?`,
  ).bind(user.profileId).first();

  return Response.json(profile ?? null);
};
