import type { Env } from "../../lib/env";
import { isAdminInDb } from "../../lib/auth";
import { recordSignal } from "../../lib/intelligence";

export const onRequestGet: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  const jobId = Number(params.id);
  if (!Number.isInteger(jobId)) return new Response("Invalid job", { status: 400 });

  const job = await env.DB.prepare(
    `SELECT j.*, p.name AS poster_name,
            CASE WHEN j.posted_by_profile_id = ? THEN 1 ELSE 0 END AS viewer_can_manage
       FROM jobs j
       LEFT JOIN profiles p ON p.id = j.posted_by_profile_id
      WHERE j.id = ?`,
  ).bind(user?.profileId ?? -1, jobId).first<Record<string, unknown>>();
  if (!job) return new Response("Not found", { status: 404 });

  const canManage = job.viewer_can_manage === 1
    || (!!user && await isAdminInDb(env.DB, user.profileId));
  if ((job.status !== "published" || new Date(String(job.expires_at)).getTime() <= Date.now()) && !canManage) {
    return new Response("Not found", { status: 404 });
  }
  return Response.json({ ...job, viewer_can_manage: canManage ? 1 : 0 });
};

export const onRequestPatch: PagesFunction<Env> = async ({ params, request, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });
  const jobId = Number(params.id);
  const job = await env.DB.prepare(
    "SELECT posted_by_profile_id, status, employment_type FROM jobs WHERE id = ?",
  ).bind(jobId).first<{
    posted_by_profile_id: number | null;
    status: string;
    employment_type: string;
  }>();
  if (!job) return new Response("Not found", { status: 404 });
  const canManage = job.posted_by_profile_id === user.profileId || await isAdminInDb(env.DB, user.profileId);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const body = await request.json<{ status?: string }>();
  if (body.status !== "closed" && body.status !== "published") {
    return Response.json({ error: "Status must be published or closed" }, { status: 400 });
  }
  if (body.status === "published") {
    const expiry = await env.DB.prepare("SELECT expires_at FROM jobs WHERE id = ?")
      .bind(jobId).first<{ expires_at: string }>();
    if (!expiry || new Date(expiry.expires_at).getTime() <= Date.now()) {
      return Response.json({ error: "Expired listings cannot be reopened" }, { status: 409 });
    }
  }

  await env.DB.prepare(
    "UPDATE jobs SET status = ?, updated_at = datetime('now') WHERE id = ?",
  ).bind(body.status, jobId).run();
  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: "job_status_changed",
    targetType: "job",
    targetId: jobId,
    topic: job.employment_type,
    source: "jobs",
    outcome: body.status,
    dedupeKey: `job-status:${jobId}:${body.status}:${crypto.randomUUID()}`,
  });
  return Response.json({ id: jobId, status: body.status });
};
