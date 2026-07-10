import type { Env } from "../../../lib/env";
import { isAdminInDb } from "../../../lib/auth";
import { notifySlack } from "../../../lib/slack";
import {
  recordRecommendationFeedback,
  recordSignal,
  upsertRelationship,
} from "../../../lib/intelligence";

const OUTCOMES = new Set(["successful", "unsuccessful", "cancelled"]);

function requestId(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function authorize(env: Env, data: unknown): Promise<{ profileId: number } | null> {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user || !await isAdminInDb(env.DB, user.profileId)) return null;
  return user;
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env, data }) => {
  if (!await authorize(env, data)) return Response.json({ error: "Admin access required." }, { status: 403 });
  const id = requestId(params.id);
  if (!id) return Response.json({ error: "Invalid business request id." }, { status: 400 });
  const { results } = await env.DB.prepare(
    `SELECT md.*, selected.name AS selected_profile_name, decided.name AS decided_by_name
     FROM matching_decisions md
     JOIN profiles selected ON selected.id = md.selected_profile_id
     LEFT JOIN profiles decided ON decided.id = md.decided_by_profile_id
     WHERE md.business_request_id = ?
     ORDER BY md.decided_at DESC, md.id DESC`,
  ).bind(id).all();
  return Response.json(results);
};

export const onRequestPatch: PagesFunction<Env> = async ({ params, env, request, data }) => {
  const user = await authorize(env, data);
  if (!user) return Response.json({ error: "Admin access required." }, { status: 403 });
  const id = requestId(params.id);
  if (!id) return Response.json({ error: "Invalid business request id." }, { status: 400 });
  const body = await request.json<{ outcome_status?: string; outcome_notes?: string }>().catch(() => null);
  if (!body?.outcome_status || !OUTCOMES.has(body.outcome_status)) {
    return Response.json({ error: "Invalid match outcome." }, { status: 400 });
  }

  const decision = await env.DB.prepare(
    `SELECT md.id, md.recommendation_run_id, md.selected_profile_id, br.business_name, br.category
     FROM matching_decisions md
     JOIN business_requests br ON br.id = md.business_request_id
     WHERE md.business_request_id = ? AND md.outcome_status = 'pending'
     ORDER BY md.decided_at DESC, md.id DESC LIMIT 1`,
  ).bind(id).first<{
    id: number;
    recommendation_run_id: string | null;
    selected_profile_id: number;
    business_name: string;
    category: string;
  }>();
  if (!decision) return Response.json({ error: "No pending match decision found." }, { status: 404 });
  const outcome = body.outcome_status as "successful" | "unsuccessful" | "cancelled";
  const notes = body.outcome_notes?.trim().slice(0, 1000) || null;

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE matching_decisions SET outcome_status = ?, outcome_notes = ?, outcome_at = datetime('now')
       WHERE id = ? AND outcome_status = 'pending'`,
    ).bind(outcome, notes, decision.id),
    outcome === "successful"
      ? env.DB.prepare(
        "UPDATE business_requests SET status = 'completed', updated_at = datetime('now') WHERE id = ?",
      ).bind(id)
      : env.DB.prepare(
        "UPDATE business_requests SET status = 'reviewed', matched_profile_id = NULL, updated_at = datetime('now') WHERE id = ?",
      ).bind(id),
  ]);

  await upsertRelationship(env, {
    sourceType: "profile",
    sourceId: decision.selected_profile_id,
    targetType: "business_request",
    targetId: id,
    relationshipType: "matched_builder",
    status: outcome === "successful" ? "active" : "inactive",
    strength: outcome === "successful" ? 2 : 1,
    provenance: "matching_decisions",
    metadata: { outcome, decision_id: decision.id },
  });
  if (decision.recommendation_run_id) {
    try {
      await recordRecommendationFeedback(env, {
        runId: decision.recommendation_run_id,
        profileId: user.profileId,
        feedbackType: outcome === "successful" ? "completed" : "dismissed",
        itemType: "profile",
        itemId: decision.selected_profile_id,
        metadata: { outcome },
        dedupeKey: `builder-outcome:${decision.id}:${outcome}`,
      });
    } catch (error) {
      console.error("[intelligence] match outcome feedback failed", error);
    }
  }
  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: "business_match_outcome",
    targetType: "business_request",
    targetId: id,
    topic: decision.category,
    source: "admin",
    outcome,
    metadata: { decision_id: decision.id, selected_profile_id: decision.selected_profile_id },
    dedupeKey: `business-match-outcome:${decision.id}:${outcome}`,
  });
  await notifySlack(env, `Match outcome: ${decision.business_name} — ${outcome}`);
  return Response.json({ success: true, outcome_status: outcome });
};
