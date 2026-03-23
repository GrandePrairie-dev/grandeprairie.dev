import type { Env } from "../../../lib/env";
import { isAdminInDb } from "../../../lib/auth";
import { notifySlack } from "../../../lib/slack";
import { logActivity } from "../../../lib/activity";

const VALID_STATUSES = ["reviewed", "matched", "in_progress", "completed"];

export const onRequestPatch: PagesFunction<Env> = async ({ params, env, request, data }) => {
  const user = (data as { user?: { profileId: number; isAdmin: boolean } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const admin = await isAdminInDb(env.DB, user.profileId);
  if (!admin) return new Response("Forbidden", { status: 403 });

  const body = await request.json<{ status: string; matched_profile_id?: number }>();

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return Response.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  const requestId = Number(params.id);

  // When status is "matched", require matched_profile_id
  if (body.status === "matched") {
    if (!body.matched_profile_id) {
      return Response.json(
        { error: "matched_profile_id is required when status is 'matched'" },
        { status: 400 },
      );
    }

    await env.DB.prepare(
      "UPDATE business_requests SET status = ?, matched_profile_id = ?, updated_at = datetime('now') WHERE id = ?",
    )
      .bind(body.status, body.matched_profile_id, requestId)
      .run();

    // Get business request and matched profile info for notifications
    const br = await env.DB.prepare("SELECT business_name FROM business_requests WHERE id = ?")
      .bind(requestId).first<{ business_name: string }>();
    const matchedProfile = await env.DB.prepare("SELECT name FROM profiles WHERE id = ?")
      .bind(body.matched_profile_id).first<{ name: string }>();

    const businessName = br?.business_name ?? `request #${requestId}`;
    const profileName = matchedProfile?.name ?? `profile #${body.matched_profile_id}`;

    await logActivity(env, "business_matched", user.profileId, "business_request", requestId,
      `${businessName} matched with ${profileName}`);
    await notifySlack(env, `\u{1F91D} ${businessName} has been matched with ${profileName}`);
  } else {
    await env.DB.prepare(
      "UPDATE business_requests SET status = ?, updated_at = datetime('now') WHERE id = ?",
    )
      .bind(body.status, requestId)
      .run();

    // Log activity for all status changes
    const br = await env.DB.prepare("SELECT business_name FROM business_requests WHERE id = ?")
      .bind(requestId).first<{ business_name: string }>();

    await logActivity(env, "business_status", user.profileId, "business_request", requestId,
      `${br?.business_name ?? `request #${requestId}`} status changed to ${body.status}`);
  }

  return Response.json({ success: true });
};
