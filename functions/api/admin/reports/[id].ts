import type { Env, UserContext } from "../../../lib/env";

const STATUSES = new Set(["open", "reviewing", "resolved", "dismissed"]);

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, data, params }) => {
  const user = (data as { user?: UserContext }).user;
  if (!user?.isAdmin) return Response.json({ error: "Admin access required." }, { status: 403 });

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid report id." }, { status: 400 });
  }

  const body = await request.json<{ status?: string; resolution_note?: string }>().catch(() => null);
  if (!body?.status || !STATUSES.has(body.status)) {
    return Response.json({ error: "Invalid report status." }, { status: 400 });
  }
  const note = typeof body.resolution_note === "string" ? body.resolution_note.trim().slice(0, 1000) : "";
  const terminal = body.status === "resolved" || body.status === "dismissed";

  const result = await env.DB.prepare(
    `UPDATE content_reports SET
       status = ?,
       moderator_profile_id = ?,
       resolution_note = ?,
       resolved_at = CASE WHEN ? THEN datetime('now') ELSE NULL END
     WHERE id = ?`,
  ).bind(body.status, user.profileId, note || null, terminal ? 1 : 0, id).run();

  if ((result.meta.changes ?? 0) === 0) {
    return Response.json({ error: "Report not found." }, { status: 404 });
  }
  return Response.json({ ok: true });
};
