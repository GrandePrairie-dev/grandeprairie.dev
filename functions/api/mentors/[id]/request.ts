import type { Env } from "../../../lib/env";
import { notifySlack } from "../../../lib/slack";
import { logActivity } from "../../../lib/activity";
import { recordSignal, upsertRelationship } from "../../../lib/intelligence";
import { deliverMentorNotification } from "../../../lib/notifications";

export const onRequestPost: PagesFunction<Env> = async ({ params, env, request, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const mentorId = Number(params.id);
  if (user.profileId === mentorId) {
    return Response.json({ error: "Cannot request yourself" }, { status: 400 });
  }

  // Check mentor exists and is available
  const mentor = await env.DB.prepare(
    `SELECT p.id, p.name, p.email, p.mentor_available, p.mentor_capacity,
            SUM(CASE WHEN mr.status IN ('pending', 'accepted') THEN 1 ELSE 0 END) AS active_requests
       FROM profiles p LEFT JOIN mentor_requests mr ON mr.mentor_profile_id = p.id
      WHERE p.id = ? GROUP BY p.id`
  ).bind(mentorId).first<{
    id: number; name: string; email: string | null; mentor_available: number;
    mentor_capacity: number; active_requests: number;
  }>();
  if (!mentor || !mentor.mentor_available) {
    return Response.json({ error: "Mentor not available" }, { status: 404 });
  }
  if (mentor.active_requests >= mentor.mentor_capacity) {
    return Response.json({ error: "Mentor is currently at capacity" }, { status: 409 });
  }

  // Check for existing pending request
  const existing = await env.DB.prepare(
    "SELECT id FROM mentor_requests WHERE mentee_profile_id = ? AND mentor_profile_id = ? AND status = 'pending'"
  ).bind(user.profileId, mentorId).first();
  if (existing) return Response.json({ error: "Request already pending" }, { status: 409 });

  const body = await request.json<{ message?: string; question_id?: number; topic?: string }>();
  let questionId: number | null = null;
  let topic = body.topic?.trim().slice(0, 80) || "mentorship";
  if (body.question_id) {
    const question = await env.DB.prepare(
      `SELECT id, category FROM board_posts
        WHERE id = ? AND author_id = ? AND parent_id IS NULL
          AND post_type = 'question' AND needs_mentor = 1 AND accepted_reply_id IS NULL`,
    ).bind(body.question_id, user.profileId).first<{ id: number; category: string }>();
    if (!question) return Response.json({ error: "Question is not eligible for mentor routing" }, { status: 400 });
    questionId = question.id;
    topic = question.category || topic;
  }

  const result = await env.DB.prepare(
    `INSERT INTO mentor_requests
       (mentee_profile_id, mentor_profile_id, message, question_id, topic)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(user.profileId, mentorId, body.message?.trim().slice(0, 1000) ?? null, questionId, topic).run();
  const mentorRequestId = result.meta.last_row_id as number;

  const mentee = await env.DB.prepare("SELECT name, email FROM profiles WHERE id = ?")
    .bind(user.profileId).first<{ name: string; email: string | null }>();
  const questionTitle = questionId
    ? (await env.DB.prepare("SELECT title FROM board_posts WHERE id = ?").bind(questionId)
      .first<{ title: string | null }>())?.title ?? null
    : null;

  await logActivity(env, "mentor_request", user.profileId, "profile", mentorId,
    `${mentee?.name ?? "Someone"} requested intro with ${mentor.name}`);
  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: "mentor_request",
    targetType: "profile",
    targetId: mentorId,
    topic,
    source: "mentors",
    outcome: "pending",
    metadata: { mentor_request_id: mentorRequestId, question_id: questionId },
    dedupeKey: `mentor-request:${mentorRequestId}:pending`,
  });
  await upsertRelationship(env, {
    sourceType: "profile",
    sourceId: user.profileId,
    targetType: "profile",
    targetId: mentorId,
    relationshipType: "mentorship",
    status: "pending",
    provenance: "mentor_requests",
    metadata: { mentor_request_id: mentorRequestId, question_id: questionId, topic },
  });
  await notifySlack(env, `Mentor request: ${mentee?.name ?? "Someone"} -> ${mentor.name} (pending)`);
  await deliverMentorNotification(env, {
    to: mentor.email ?? "",
    recipientName: mentor.name,
    otherName: mentee?.name ?? "A community member",
    recipientId: mentor.id,
    requestId: mentorRequestId,
    questionId,
    questionTitle,
    event: "requested",
  });

  return Response.json({ success: true, id: mentorRequestId }, { status: 201 });
};
