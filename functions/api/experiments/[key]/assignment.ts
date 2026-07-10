import type { Env, UserContext } from "../../../lib/env";
import { assignExperimentVariant } from "../../../lib/intelligence";

export const onRequestGet: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: UserContext }).user;
  if (!user) return Response.json({ error: "Sign in to join an experiment." }, { status: 401 });
  const key = Array.isArray(params.key) ? params.key[0] : params.key;
  if (!key) return Response.json({ error: "Invalid experiment key." }, { status: 400 });
  const assignment = await assignExperimentVariant(env, key, user.profileId);
  if (!assignment) return Response.json({ error: "Active experiment not found." }, { status: 404 });
  return Response.json(assignment);
};
