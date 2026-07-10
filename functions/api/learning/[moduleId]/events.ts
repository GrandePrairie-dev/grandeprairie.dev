import type { Env, UserContext } from "../../../lib/env";
import { recordLearningEvent, recordSignal } from "../../../lib/intelligence";

const EVENT_TYPES = new Set(["module_started", "step_completed", "hint_viewed", "quiz_submitted", "module_completed", "module_abandoned"]);

export const onRequestPost: PagesFunction<Env> = async ({ params, env, request, data }) => {
  const user = (data as { user?: UserContext }).user;
  if (!user) return Response.json({ error: "Sign in to record learning progress." }, { status: 401 });
  const moduleId = Array.isArray(params.moduleId) ? params.moduleId[0] : params.moduleId;
  if (!moduleId) return Response.json({ error: "Invalid learning module." }, { status: 400 });
  const module = await env.DB.prepare(
    "SELECT id FROM learning_modules WHERE id = ? AND status = 'published'",
  ).bind(moduleId).first();
  if (!module) return Response.json({ error: "Learning module not found." }, { status: 404 });
  const body = await request.json<{
    event_type?: string;
    step_key?: string;
    score?: number;
    progress_percent?: number;
    dedupe_key?: string;
  }>().catch(() => null);
  if (!body?.event_type || !EVENT_TYPES.has(body.event_type)) {
    return Response.json({ error: "Invalid learning event." }, { status: 400 });
  }
  await recordLearningEvent(env, {
    moduleId,
    profileId: user.profileId,
    eventType: body.event_type,
    stepKey: body.step_key,
    score: body.score,
    progressPercent: body.progress_percent,
    dedupeKey: body.dedupe_key ? `learning:${moduleId}:${user.profileId}:${body.dedupe_key}` : null,
  });
  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: body.event_type,
    targetType: "learning_module",
    targetId: moduleId,
    topic: "learning",
    source: "learning",
    outcome: body.event_type === "module_completed" ? "completed" : null,
    value: body.progress_percent,
    dedupeKey: body.dedupe_key ? `learning-signal:${moduleId}:${user.profileId}:${body.dedupe_key}` : null,
  });
  return Response.json({ ok: true });
};
