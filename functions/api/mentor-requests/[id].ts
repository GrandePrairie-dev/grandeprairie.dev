import type { Env } from "../../lib/env";
import { recordSignal, upsertRelationship } from "../../lib/intelligence";
import { deliverMentorNotification } from "../../lib/notifications";

export const onRequestPatch: PagesFunction<Env> = async ({ params, env, request, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await request.json<{
    status: string;
    outcome_status?: "successful" | "unsuccessful" | "cancelled";
    outcome_notes?: string;
  }>();
  const validStatuses = ["accepted", "declined", "cancelled", "completed"];
  if (!validStatuses.includes(body.status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const req = await env.DB.prepare(
    `SELECT mr.*, mentor.name AS mentor_name, mentor.email AS mentor_email,
            mentee.name AS mentee_name, mentee.email AS mentee_email,
            bp.title AS question_title
       FROM mentor_requests mr
       JOIN profiles mentor ON mentor.id = mr.mentor_profile_id
       JOIN profiles mentee ON mentee.id = mr.mentee_profile_id
       LEFT JOIN board_posts bp ON bp.id = mr.question_id
      WHERE mr.id = ?`,
  ).bind(params.id).first<{
    mentor_profile_id: number; mentee_profile_id: number; status: string;
    question_id: number | null; topic: string | null;
    mentor_name: string; mentor_email: string | null;
    mentee_name: string; mentee_email: string | null; question_title: string | null;
  }>();
  if (!req) return new Response("Not found", { status: 404 });

  // Mentor can accept/decline; mentee can cancel
  if (body.status === "completed") {
    if (user.profileId !== req.mentee_profile_id && user.profileId !== req.mentor_profile_id) {
      return new Response("Forbidden", { status: 403 });
    }
    if (req.status !== "accepted") {
      return Response.json({ error: "Only accepted mentorships can be completed" }, { status: 400 });
    }
    if (!body.outcome_status || !["successful", "unsuccessful", "cancelled"].includes(body.outcome_status)) {
      return Response.json({ error: "A completion outcome is required" }, { status: 400 });
    }
  } else if (body.status === "cancelled") {
    if (user.profileId !== req.mentee_profile_id) return new Response("Forbidden", { status: 403 });
    if (req.status !== "pending") return Response.json({ error: "Can only cancel pending requests" }, { status: 400 });
  } else {
    if (user.profileId !== req.mentor_profile_id) return new Response("Forbidden", { status: 403 });
    if (req.status !== "pending") return Response.json({ error: "Can only respond to pending requests" }, { status: 400 });
  }

  await env.DB.prepare(
    `UPDATE mentor_requests SET status = ?, responded_at = datetime('now'),
       outcome_status = CASE WHEN ? = 'completed' THEN ? ELSE outcome_status END,
       outcome_notes = CASE WHEN ? = 'completed' THEN ? ELSE outcome_notes END,
       outcome_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE outcome_at END
     WHERE id = ?`
  ).bind(
    body.status, body.status, body.outcome_status ?? null,
    body.status, body.outcome_notes?.trim().slice(0, 1000) ?? null,
    body.status, params.id,
  ).run();
  if (body.status === "completed" && body.outcome_status === "successful" && req.question_id) {
    await env.DB.prepare(
      "UPDATE board_posts SET needs_mentor = 0, updated_at = datetime('now') WHERE id = ?",
    ).bind(req.question_id).run();
  }

  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: "mentor_request_decision",
    targetType: "mentor_request",
    targetId: String(params.id),
    topic: req.topic ?? "mentorship",
    source: "mentors",
    outcome: body.status,
    metadata: {
      mentee_profile_id: req.mentee_profile_id,
      mentor_profile_id: req.mentor_profile_id,
    },
    dedupeKey: `mentor-request:${String(params.id)}:${body.status}`,
  });
  await upsertRelationship(env, {
    sourceType: "profile",
    sourceId: req.mentee_profile_id,
    targetType: "profile",
    targetId: req.mentor_profile_id,
    relationshipType: "mentorship",
    status: body.status === "accepted" ? "active" : body.status === "completed" && body.outcome_status === "successful" ? "completed" : "inactive",
    provenance: "mentor_requests",
    metadata: { mentor_request_id: Number(params.id), outcome: body.outcome_status ?? body.status, question_id: req.question_id },
  });

  const notifyMentee = body.status !== "cancelled" && user.profileId === req.mentor_profile_id;
  if (body.status === "accepted" || body.status === "declined" || body.status === "completed") {
    await deliverMentorNotification(env, {
      to: notifyMentee ? req.mentee_email ?? "" : req.mentor_email ?? "",
      recipientName: notifyMentee ? req.mentee_name : req.mentor_name,
      otherName: notifyMentee ? req.mentor_name : req.mentee_name,
      recipientId: notifyMentee ? req.mentee_profile_id : req.mentor_profile_id,
      requestId: Number(params.id),
      questionId: req.question_id,
      questionTitle: req.question_title,
      event: body.status,
    });
  }

  return Response.json({ success: true, status: body.status, outcome_status: body.outcome_status ?? null });
};
