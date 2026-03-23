import type { Env } from "../../../lib/env";
import { isAdminInDb } from "../../../lib/auth";
import { notifySlack } from "../../../lib/slack";
import { logActivity } from "../../../lib/activity";

// POST: express interest (authenticated)
export const onRequestPost: PagesFunction<Env> = async ({ params, env, request, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await request.json<{ note?: string }>();
  const requestId = Number(params.id);

  // Check request exists
  const br = await env.DB.prepare("SELECT business_name FROM business_requests WHERE id = ?")
    .bind(requestId).first<{ business_name: string }>();
  if (!br) return new Response("Not found", { status: 404 });

  // Check duplicate
  const existing = await env.DB.prepare(
    "SELECT id FROM business_request_interests WHERE business_request_id = ? AND profile_id = ?"
  ).bind(requestId, user.profileId).first();
  if (existing) return Response.json({ error: "Already expressed interest" }, { status: 409 });

  await env.DB.prepare(
    "INSERT INTO business_request_interests (business_request_id, profile_id, note) VALUES (?, ?, ?)"
  ).bind(requestId, user.profileId, body.note ?? null).run();

  // Get profile name for notifications
  const profile = await env.DB.prepare("SELECT name FROM profiles WHERE id = ?")
    .bind(user.profileId).first<{ name: string }>();

  await logActivity(env, "business_interest", user.profileId, "business_request", requestId,
    `${profile?.name ?? "Someone"} expressed interest in ${br.business_name}`);
  await notifySlack(env, `\u{1F514} ${profile?.name ?? "Someone"} expressed interest in request #${requestId} \u2014 ${br.business_name}`);

  return Response.json({ success: true }, { status: 201 });
};

// GET: list interests (admin only)
export const onRequestGet: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!(await isAdminInDb(env.DB, user.profileId))) return new Response("Forbidden", { status: 403 });

  const { results } = await env.DB.prepare(
    `SELECT bri.*, p.name as profile_name, p.skills, p.role
     FROM business_request_interests bri
     LEFT JOIN profiles p ON bri.profile_id = p.id
     WHERE bri.business_request_id = ?
     ORDER BY bri.created_at ASC`
  ).bind(params.id).all();

  return Response.json(results);
};
