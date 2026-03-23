import type { Env } from "../../lib/env";
import { isAdminInDb } from "../../lib/auth";

export const onRequestGet: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: { profileId: number; isAdmin: boolean } }).user;

  const request = await env.DB.prepare("SELECT * FROM business_requests WHERE id = ?")
    .bind(params.id).first();
  if (!request) return new Response("Not found", { status: 404 });

  // Redact contact info for non-admin
  const isAdmin = user ? await isAdminInDb(env.DB, user.profileId) : false;
  if (!isAdmin) {
    (request as Record<string, unknown>).contact_email = null;
  }

  // Get interest count
  const countResult = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM business_request_interests WHERE business_request_id = ?"
  ).bind(params.id).first<{ count: number }>();

  // Check if current user has expressed interest
  let hasInterest = false;
  if (user) {
    const existing = await env.DB.prepare(
      "SELECT id FROM business_request_interests WHERE business_request_id = ? AND profile_id = ?"
    ).bind(params.id, user.profileId).first();
    hasInterest = !!existing;
  }

  return Response.json({
    ...request,
    interest_count: countResult?.count ?? 0,
    user_has_interest: hasInterest,
  });
};
