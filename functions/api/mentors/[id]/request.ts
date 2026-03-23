import type { Env } from "../../../lib/env";
import { notifySlack } from "../../../lib/slack";
import { logActivity } from "../../../lib/activity";

export const onRequestPost: PagesFunction<Env> = async ({ params, env, request, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const mentorId = Number(params.id);
  if (user.profileId === mentorId) {
    return Response.json({ error: "Cannot request yourself" }, { status: 400 });
  }

  // Check mentor exists and is available
  const mentor = await env.DB.prepare(
    "SELECT id, name, mentor_available FROM profiles WHERE id = ?"
  ).bind(mentorId).first<{ id: number; name: string; mentor_available: number }>();
  if (!mentor || !mentor.mentor_available) {
    return Response.json({ error: "Mentor not available" }, { status: 404 });
  }

  // Check for existing pending request
  const existing = await env.DB.prepare(
    "SELECT id FROM mentor_requests WHERE mentee_profile_id = ? AND mentor_profile_id = ? AND status = 'pending'"
  ).bind(user.profileId, mentorId).first();
  if (existing) return Response.json({ error: "Request already pending" }, { status: 409 });

  const body = await request.json<{ message?: string }>();

  await env.DB.prepare(
    "INSERT INTO mentor_requests (mentee_profile_id, mentor_profile_id, message) VALUES (?, ?, ?)"
  ).bind(user.profileId, mentorId, body.message ?? null).run();

  const mentee = await env.DB.prepare("SELECT name FROM profiles WHERE id = ?")
    .bind(user.profileId).first<{ name: string }>();

  await logActivity(env, "mentor_request", user.profileId, "profile", mentorId,
    `${mentee?.name ?? "Someone"} requested intro with ${mentor.name}`);
  await notifySlack(env, `Mentor request: ${mentee?.name ?? "Someone"} -> ${mentor.name} (pending)`);

  return Response.json({ success: true }, { status: 201 });
};
