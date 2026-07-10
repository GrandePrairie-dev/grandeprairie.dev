import type { Env, UserContext } from "../../../lib/env";
import { assignExperimentVariant, recordExperimentEvent } from "../../../lib/intelligence";

export const onRequestPost: PagesFunction<Env> = async ({ params, env, request, data }) => {
  const user = (data as { user?: UserContext }).user;
  if (!user) return Response.json({ error: "Sign in to record an experiment event." }, { status: 401 });
  const key = Array.isArray(params.key) ? params.key[0] : params.key;
  if (!key) return Response.json({ error: "Invalid experiment key." }, { status: 400 });
  const body = await request.json<{ metric?: string; value?: number; dedupe_key?: string }>().catch(() => null);
  if (!body?.metric || !/^[a-z0-9_:-]{1,64}$/.test(body.metric)) {
    return Response.json({ error: "Invalid experiment metric." }, { status: 400 });
  }
  const assignment = await assignExperimentVariant(env, key, user.profileId);
  if (!assignment) return Response.json({ error: "Active experiment not found." }, { status: 404 });
  const experiment = await env.DB.prepare(
    "SELECT primary_metric FROM experiments WHERE id = ?",
  ).bind(assignment.experiment_id).first<{ primary_metric: string }>();
  if (!experiment || (body.metric !== "exposure" && body.metric !== experiment.primary_metric)) {
    return Response.json({ error: "Metric is not registered for this experiment." }, { status: 400 });
  }
  await recordExperimentEvent(env, {
    experimentId: assignment.experiment_id,
    profileId: user.profileId,
    variant: assignment.variant,
    metric: body.metric,
    value: body.value,
    dedupeKey: body.dedupe_key
      ? `experiment:${assignment.experiment_id}:${user.profileId}:${body.dedupe_key}`
      : null,
  });
  return Response.json({ ok: true, variant: assignment.variant });
};
