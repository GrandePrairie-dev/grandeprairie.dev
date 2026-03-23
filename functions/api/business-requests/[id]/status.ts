import type { Env } from "../../../lib/env";
import { isAdminInDb } from "../../../lib/auth";

const VALID_STATUSES = ["reviewed", "matched", "in_progress", "completed"];

export const onRequestPatch: PagesFunction<Env> = async ({ params, env, request, data }) => {
  const user = (data as { user?: { profileId: number; isAdmin: boolean } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const admin = await isAdminInDb(env.DB, user.profileId);
  if (!admin) return new Response("Forbidden", { status: 403 });

  const body = await request.json<{ status: string }>();

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return Response.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 },
    );
  }

  await env.DB.prepare(
    "UPDATE business_requests SET status = ?, updated_at = datetime('now') WHERE id = ?",
  )
    .bind(body.status, params.id)
    .run();

  return Response.json({ success: true });
};
