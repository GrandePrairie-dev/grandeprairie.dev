import type { Env, UserContext } from "../../../lib/env";
import { isAdminInDb } from "../../../lib/auth";
import { recordRecommendationFeedback, recordSignal } from "../../../lib/intelligence";

const FEEDBACK_TYPES = new Set(["opened", "selected", "dismissed", "helpful", "not_helpful", "completed"]);

export const onRequestPost: PagesFunction<Env> = async ({ params, env, request, data }) => {
  const user = (data as { user?: UserContext }).user;
  if (!user) return Response.json({ error: "Sign in to provide feedback." }, { status: 401 });
  const runId = Array.isArray(params.runId) ? params.runId[0] : params.runId;
  if (!runId) return Response.json({ error: "Invalid recommendation run." }, { status: 400 });

  const run = await env.DB.prepare(
    "SELECT profile_id, recommendation_type FROM recommendation_runs WHERE id = ?",
  ).bind(runId).first<{ profile_id: number | null; recommendation_type: string }>();
  if (!run) return Response.json({ error: "Recommendation run not found." }, { status: 404 });
  const admin = await isAdminInDb(env.DB, user.profileId);
  if (!admin && run.profile_id !== user.profileId) {
    return Response.json({ error: "This recommendation was not issued to you." }, { status: 403 });
  }

  const body = await request.json<{
    feedback_type?: string;
    item_type?: string;
    item_id?: string | number;
    value?: number;
  }>().catch(() => null);
  if (!body?.feedback_type || !FEEDBACK_TYPES.has(body.feedback_type)) {
    return Response.json({ error: "Invalid feedback type." }, { status: 400 });
  }
  if (body.item_type && body.item_id !== undefined) {
    const item = await env.DB.prepare(
      "SELECT id FROM recommendation_items WHERE run_id = ? AND item_type = ? AND item_id = ?",
    ).bind(runId, body.item_type, String(body.item_id)).first();
    if (!item) return Response.json({ error: "Recommendation item not found." }, { status: 404 });
  }

  const feedbackType = body.feedback_type as "opened" | "selected" | "dismissed" | "helpful" | "not_helpful" | "completed";
  await recordRecommendationFeedback(env, {
    runId,
    profileId: user.profileId,
    feedbackType,
    itemType: body.item_type,
    itemId: body.item_id,
    value: body.value,
  });
  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: "recommendation_feedback",
    targetType: "recommendation_run",
    targetId: runId,
    source: run.recommendation_type,
    outcome: feedbackType,
    value: body.value,
    metadata: { item_type: body.item_type, item_id: body.item_id },
  });
  return Response.json({ ok: true });
};
