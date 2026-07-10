import type { Env, UserContext } from "../../../lib/env";
import { isAdminInDb } from "../../../lib/auth";
import {
  generateBuilderRecommendations,
  getLatestBuilderRecommendations,
  recordRecommendationFeedback,
  recordSignal,
} from "../../../lib/intelligence";

function requestId(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function requireAdmin(env: Env, data: unknown): Promise<UserContext | null> {
  const user = (data as { user?: UserContext }).user;
  if (!user || !await isAdminInDb(env.DB, user.profileId)) return null;
  return user;
}

async function markDisplayed(env: Env, runId: string, profileId: number): Promise<void> {
  await recordRecommendationFeedback(env, {
    runId,
    profileId,
    feedbackType: "displayed",
    dedupeKey: `recommendation-displayed:${runId}:${profileId}`,
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = await requireAdmin(env, data);
  if (!user) return Response.json({ error: "Admin access required." }, { status: 403 });
  const id = requestId(params.id);
  if (!id) return Response.json({ error: "Invalid business request id." }, { status: 400 });

  const run = await getLatestBuilderRecommendations(env, id);
  if (run) await markDisplayed(env, run.id, user.profileId);
  return Response.json(run);
};

export const onRequestPost: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = await requireAdmin(env, data);
  if (!user) return Response.json({ error: "Admin access required." }, { status: 403 });
  const id = requestId(params.id);
  if (!id) return Response.json({ error: "Invalid business request id." }, { status: 400 });

  const run = await generateBuilderRecommendations(env, id, user.profileId);
  if (!run) return Response.json({ error: "Business request not found." }, { status: 404 });
  await markDisplayed(env, run.id, user.profileId);
  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: "recommendations_generated",
    targetType: "business_request",
    targetId: id,
    source: "builder_match",
    outcome: "generated",
    value: run.items.length,
    metadata: { run_id: run.id, algorithm_version: run.algorithm_version },
    dedupeKey: `recommendations-generated:${run.id}`,
  });
  return Response.json(run, { status: 201 });
};
