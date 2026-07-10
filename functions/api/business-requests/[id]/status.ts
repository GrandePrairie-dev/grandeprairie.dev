import type { Env } from "../../../lib/env";
import { isAdminInDb } from "../../../lib/auth";
import { notifySlack } from "../../../lib/slack";
import { logActivity } from "../../../lib/activity";
import { deliverMatchNotification } from "../../../lib/notifications";
import {
  recordRecommendationFeedback,
  recordSignal,
  upsertRelationship,
} from "../../../lib/intelligence";

const VALID_STATUSES = ["reviewed", "matched", "in_progress", "completed"];

interface StatusBody {
  status: string;
  matched_profile_id?: number;
  recommendation_run_id?: string;
  rationale?: string;
  outcome_notes?: string;
}

interface BusinessRequestState {
  business_name: string;
  contact_name: string | null;
  contact_email: string | null;
  category: string;
  status: string;
  matched_profile_id: number | null;
}

export const onRequestPatch: PagesFunction<Env> = async ({ params, env, request, data }) => {
  const user = (data as { user?: { profileId: number; isAdmin: boolean } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!await isAdminInDb(env.DB, user.profileId)) return new Response("Forbidden", { status: 403 });

  const body = await request.json<StatusBody>();
  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return Response.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const requestId = Number(params.id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return Response.json({ error: "Invalid business request id." }, { status: 400 });
  }
  const current = await env.DB.prepare(
    "SELECT business_name, contact_name, contact_email, category, status, matched_profile_id FROM business_requests WHERE id = ?",
  ).bind(requestId).first<BusinessRequestState>();
  if (!current) return Response.json({ error: "Business request not found." }, { status: 404 });
  if (body.status === current.status && (body.status !== "matched" || body.matched_profile_id === current.matched_profile_id)) {
    return Response.json({ success: true, unchanged: true });
  }

  if (body.status === "matched") {
    if (!body.matched_profile_id) {
      return Response.json({ error: "matched_profile_id is required when status is 'matched'" }, { status: 400 });
    }
    const matchedProfile = await env.DB.prepare("SELECT id, name, email FROM profiles WHERE id = ?")
      .bind(body.matched_profile_id).first<{ id: number; name: string; email: string | null }>();
    if (!matchedProfile) return Response.json({ error: "Selected profile not found." }, { status: 404 });

    let recommendationExplanation: string | null = null;
    if (body.recommendation_run_id) {
      const item = await env.DB.prepare(
        `SELECT ri.explanation FROM recommendation_items ri
         JOIN recommendation_runs rr ON rr.id = ri.run_id
         WHERE ri.run_id = ? AND ri.item_type = 'profile' AND ri.item_id = ?
           AND rr.recommendation_type = 'builder_match'
           AND rr.context_type = 'business_request' AND rr.context_id = ?`,
      ).bind(body.recommendation_run_id, String(body.matched_profile_id), String(requestId))
        .first<{ explanation: string }>();
      if (!item) {
        return Response.json({ error: "The selected profile is not part of this recommendation run." }, { status: 400 });
      }
      recommendationExplanation = item.explanation;
    }

    const rationale = (body.rationale?.trim() || recommendationExplanation || null)?.slice(0, 1000) ?? null;
    const statements = [
      env.DB.prepare(
        "UPDATE business_requests SET status = 'matched', matched_profile_id = ?, updated_at = datetime('now') WHERE id = ?",
      ).bind(body.matched_profile_id, requestId),
      env.DB.prepare(
        `UPDATE matching_decisions
         SET outcome_status = 'cancelled', outcome_notes = 'Superseded by a later match', outcome_at = datetime('now')
         WHERE business_request_id = ? AND outcome_status = 'pending'`,
      ).bind(requestId),
      env.DB.prepare(
        `INSERT INTO matching_decisions
           (business_request_id, recommendation_run_id, selected_profile_id, decided_by_profile_id,
            decision_source, rationale)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).bind(
        requestId,
        body.recommendation_run_id ?? null,
        body.matched_profile_id,
        user.profileId,
        body.recommendation_run_id ? "recommendation" : "manual",
        rationale,
      ),
    ];
    if (body.recommendation_run_id) {
      statements.push(
        env.DB.prepare("UPDATE recommendation_runs SET status = 'acted' WHERE id = ?")
          .bind(body.recommendation_run_id),
        env.DB.prepare(
          "UPDATE recommendation_items SET selected_at = datetime('now') WHERE run_id = ? AND item_type = 'profile' AND item_id = ?",
        ).bind(body.recommendation_run_id, String(body.matched_profile_id)),
      );
    }
    await env.DB.batch(statements);
    const decision = await env.DB.prepare(
      `SELECT id FROM matching_decisions WHERE business_request_id = ?
       ORDER BY decided_at DESC, id DESC LIMIT 1`,
    ).bind(requestId).first<{ id: number }>();

    if (current.matched_profile_id && current.matched_profile_id !== body.matched_profile_id) {
      await upsertRelationship(env, {
        sourceType: "profile",
        sourceId: current.matched_profile_id,
        targetType: "business_request",
        targetId: requestId,
        relationshipType: "matched_builder",
        status: "inactive",
        provenance: "matching_decisions",
        metadata: { outcome: "superseded" },
      });
    }
    await upsertRelationship(env, {
      sourceType: "profile",
      sourceId: body.matched_profile_id,
      targetType: "business_request",
      targetId: requestId,
      relationshipType: "matched_builder",
      status: "active",
      provenance: "matching_decisions",
      metadata: { recommendation_run_id: body.recommendation_run_id ?? null },
    });
    if (body.recommendation_run_id) {
      try {
        await recordRecommendationFeedback(env, {
          runId: body.recommendation_run_id,
          profileId: user.profileId,
          feedbackType: "selected",
          itemType: "profile",
          itemId: body.matched_profile_id,
          dedupeKey: `builder-selected:${body.recommendation_run_id}:${body.matched_profile_id}`,
        });
      } catch (error) {
        console.error("[intelligence] recommendation selection feedback failed", error);
      }
    }
    await recordSignal(env, {
      actorProfileId: user.profileId,
      signalType: "business_match_decision",
      targetType: "business_request",
      targetId: requestId,
      topic: current.category,
      source: body.recommendation_run_id ? "builder_match" : "admin",
      outcome: "matched",
      metadata: {
        selected_profile_id: body.matched_profile_id,
        recommendation_run_id: body.recommendation_run_id ?? null,
      },
    });

    await logActivity(env, "business_matched", user.profileId, "business_request", requestId,
      `${current.business_name} matched with ${matchedProfile.name}`);
    await notifySlack(env, `\u{1F91D} ${current.business_name} has been matched with ${matchedProfile.name}`);
    if (decision) {
      await Promise.all([
        deliverMatchNotification(env, {
          decisionId: decision.id,
          recipientId: matchedProfile.id,
          to: matchedProfile.email ?? "",
          recipientName: matchedProfile.name,
          recipientType: "builder",
          businessName: current.business_name,
          category: current.category,
          builderName: matchedProfile.name,
          requestId,
        }),
        deliverMatchNotification(env, {
          decisionId: decision.id,
          recipientId: requestId,
          to: current.contact_email ?? "",
          recipientName: current.contact_name ?? current.business_name,
          recipientType: "business",
          businessName: current.business_name,
          category: current.category,
          builderName: matchedProfile.name,
          requestId,
        }),
      ]).catch((error) => console.error("[notifications] match delivery failed", error));
    }
  } else {
    const statements = [
      env.DB.prepare(
        "UPDATE business_requests SET status = ?, updated_at = datetime('now') WHERE id = ?",
      ).bind(body.status, requestId),
    ];
    let completedDecision: {
      id: number;
      recommendation_run_id: string | null;
      selected_profile_id: number;
    } | null = null;

    if (body.status === "completed" && current.matched_profile_id) {
      completedDecision = await env.DB.prepare(
        `SELECT id, recommendation_run_id, selected_profile_id FROM matching_decisions
         WHERE business_request_id = ? AND outcome_status = 'pending'
         ORDER BY decided_at DESC LIMIT 1`,
      ).bind(requestId).first<{
        id: number;
        recommendation_run_id: string | null;
        selected_profile_id: number;
      }>() ?? null;
      if (completedDecision) {
        statements.push(env.DB.prepare(
          `UPDATE matching_decisions SET outcome_status = 'successful', outcome_notes = ?, outcome_at = datetime('now')
           WHERE id = ?`,
        ).bind(body.outcome_notes?.trim().slice(0, 1000) ?? null, completedDecision.id));
      } else {
        statements.push(env.DB.prepare(
          `INSERT INTO matching_decisions
             (business_request_id, selected_profile_id, decided_by_profile_id, decision_source,
              outcome_status, outcome_notes, outcome_at)
           VALUES (?, ?, ?, 'manual', 'successful', ?, datetime('now'))`,
        ).bind(requestId, current.matched_profile_id, user.profileId, body.outcome_notes?.trim().slice(0, 1000) ?? null));
      }
    }
    await env.DB.batch(statements);

    if (body.status === "completed" && current.matched_profile_id) {
      await upsertRelationship(env, {
        sourceType: "profile",
        sourceId: current.matched_profile_id,
        targetType: "business_request",
        targetId: requestId,
        relationshipType: "matched_builder",
        status: "active",
        strength: 2,
        provenance: "matching_decisions",
        metadata: { outcome: "successful" },
      });
      if (completedDecision?.recommendation_run_id) {
        try {
          await recordRecommendationFeedback(env, {
            runId: completedDecision.recommendation_run_id,
            profileId: user.profileId,
            feedbackType: "completed",
            itemType: "profile",
            itemId: completedDecision.selected_profile_id,
            dedupeKey: `builder-completed:${completedDecision.recommendation_run_id}:${requestId}`,
          });
        } catch (error) {
          console.error("[intelligence] completion feedback failed", error);
        }
      }
    }
    await recordSignal(env, {
      actorProfileId: user.profileId,
      signalType: "business_status_changed",
      targetType: "business_request",
      targetId: requestId,
      topic: current.category,
      source: "admin",
      outcome: body.status,
      metadata: { previous_status: current.status },
    });
    await logActivity(env, "business_status", user.profileId, "business_request", requestId,
      `${current.business_name} status changed to ${body.status}`);
  }

  return Response.json({ success: true });
};
