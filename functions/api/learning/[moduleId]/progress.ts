import type { Env, UserContext } from "../../../lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: UserContext }).user;
  if (!user) return Response.json({ error: "Sign in to view learning progress." }, { status: 401 });
  const moduleId = Array.isArray(params.moduleId) ? params.moduleId[0] : params.moduleId;
  const progress = await env.DB.prepare(
    "SELECT * FROM learning_progress WHERE module_id = ? AND profile_id = ?",
  ).bind(moduleId, user.profileId).first();
  return Response.json(progress);
};
