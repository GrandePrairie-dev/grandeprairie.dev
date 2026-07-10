import type { Env } from "../../lib/env";
import { recordSignal, upsertRelationship } from "../../lib/intelligence";

export const onRequestPatch: PagesFunction<Env> = async ({ params, env, request, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await request.json<{ status: string }>();
  const validStatuses = ["accepted", "declined", "cancelled"];
  if (!validStatuses.includes(body.status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const req = await env.DB.prepare("SELECT * FROM mentor_requests WHERE id = ?")
    .bind(params.id).first<{ mentor_profile_id: number; mentee_profile_id: number; status: string }>();
  if (!req) return new Response("Not found", { status: 404 });

  // Mentor can accept/decline; mentee can cancel
  if (body.status === "cancelled") {
    if (user.profileId !== req.mentee_profile_id) return new Response("Forbidden", { status: 403 });
    if (req.status !== "pending") return Response.json({ error: "Can only cancel pending requests" }, { status: 400 });
  } else {
    if (user.profileId !== req.mentor_profile_id) return new Response("Forbidden", { status: 403 });
    if (req.status !== "pending") return Response.json({ error: "Can only respond to pending requests" }, { status: 400 });
  }

  await env.DB.prepare(
    "UPDATE mentor_requests SET status = ?, responded_at = datetime('now') WHERE id = ?"
  ).bind(body.status, params.id).run();

  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: "mentor_request_decision",
    targetType: "mentor_request",
    targetId: String(params.id),
    topic: "mentorship",
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
    status: body.status === "accepted" ? "active" : "inactive",
    provenance: "mentor_requests",
    metadata: { mentor_request_id: Number(params.id), outcome: body.status },
  });

  return Response.json({ success: true });
};
