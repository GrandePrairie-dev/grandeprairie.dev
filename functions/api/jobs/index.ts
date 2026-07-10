import type { Env } from "../../lib/env";
import { recordSignal } from "../../lib/intelligence";

const EMPLOYMENT_TYPES = new Set(["full_time", "part_time", "contract", "internship", "cofounder", "volunteer"]);
const WORKPLACE_TYPES = new Set(["onsite", "hybrid", "remote"]);
const COMPENSATION_PERIODS = new Set(["hour", "year", "project"]);

interface JobBody {
  title?: string;
  organization?: string;
  description?: string;
  employment_type?: string;
  workplace_type?: string;
  location?: string;
  compensation_min?: number | null;
  compensation_max?: number | null;
  compensation_period?: string | null;
  application_url?: string;
  tags?: string[];
  expires_in_days?: number;
}

function validHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  const url = new URL(request.url);
  const mine = url.searchParams.get("mine") === "1";
  if (mine && !user) return new Response("Unauthorized", { status: 401 });

  const employmentType = url.searchParams.get("employment_type");
  const workplaceType = url.searchParams.get("workplace_type");
  const search = url.searchParams.get("q")?.trim().slice(0, 80);
  const clauses = mine
    ? ["j.posted_by_profile_id = ?"]
    : ["j.status = 'published'", "j.expires_at > datetime('now')"];
  const values: unknown[] = mine ? [user!.profileId] : [];

  if (employmentType && EMPLOYMENT_TYPES.has(employmentType)) {
    clauses.push("j.employment_type = ?");
    values.push(employmentType);
  }
  if (workplaceType && WORKPLACE_TYPES.has(workplaceType)) {
    clauses.push("j.workplace_type = ?");
    values.push(workplaceType);
  }
  if (search) {
    clauses.push("(j.title LIKE ? OR j.organization LIKE ? OR j.description LIKE ? OR j.tags LIKE ?)");
    const pattern = `%${search}%`;
    values.push(pattern, pattern, pattern, pattern);
  }

  const { results } = await env.DB.prepare(
    `SELECT j.*, p.name AS poster_name,
            CASE WHEN j.posted_by_profile_id = ? THEN 1 ELSE 0 END AS viewer_can_manage
       FROM jobs j
       LEFT JOIN profiles p ON p.id = j.posted_by_profile_id
      WHERE ${clauses.join(" AND ")}
      ORDER BY CASE j.employment_type WHEN 'internship' THEN 0 ELSE 1 END,
               j.created_at DESC
      LIMIT 100`,
  ).bind(user?.profileId ?? -1, ...values).all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await request.json<JobBody>();
  const title = body.title?.trim();
  const organization = body.organization?.trim();
  const description = body.description?.trim();
  const applicationUrl = body.application_url?.trim();
  const employmentType = body.employment_type ?? "";
  const workplaceType = body.workplace_type ?? "";

  if (!title || !organization || !description || !applicationUrl) {
    return Response.json({ error: "Title, organization, description, and application URL are required" }, { status: 400 });
  }
  if (!EMPLOYMENT_TYPES.has(employmentType) || !WORKPLACE_TYPES.has(workplaceType)) {
    return Response.json({ error: "Invalid employment or workplace type" }, { status: 400 });
  }
  if (!validHttpUrl(applicationUrl)) {
    return Response.json({ error: "Application URL must use HTTP or HTTPS" }, { status: 400 });
  }
  if (title.length > 120 || organization.length > 120 || description.length > 4000) {
    return Response.json({ error: "Job listing is too long" }, { status: 400 });
  }

  const compensationMin = Number.isFinite(body.compensation_min) ? Math.max(0, Math.round(body.compensation_min!)) : null;
  const compensationMax = Number.isFinite(body.compensation_max) ? Math.max(0, Math.round(body.compensation_max!)) : null;
  if (compensationMin !== null && compensationMax !== null && compensationMax < compensationMin) {
    return Response.json({ error: "Maximum compensation must be at least the minimum" }, { status: 400 });
  }
  const compensationPeriod = body.compensation_period && COMPENSATION_PERIODS.has(body.compensation_period)
    ? body.compensation_period
    : null;
  const expiryDays = Math.min(90, Math.max(7, Math.round(body.expires_in_days ?? 30)));
  const expiresAt = new Date(Date.now() + expiryDays * 86_400_000).toISOString();
  const tags = Array.isArray(body.tags)
    ? body.tags.map((tag) => tag.trim()).filter(Boolean).slice(0, 8)
    : [];

  const job = await env.DB.prepare(
    `INSERT INTO jobs
       (title, organization, description, employment_type, workplace_type, location,
        compensation_min, compensation_max, compensation_period, application_url, tags,
        posted_by_profile_id, source, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'community', ?)
     RETURNING id`,
  ).bind(
    title,
    organization,
    description,
    employmentType,
    workplaceType,
    body.location?.trim() || null,
    compensationMin,
    compensationMax,
    compensationPeriod,
    applicationUrl,
    JSON.stringify(tags),
    user.profileId,
    expiresAt,
  ).first<{ id: number }>();
  if (!job) return Response.json({ error: "Could not create listing" }, { status: 500 });

  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: "job_posted",
    targetType: "job",
    targetId: job.id,
    topic: employmentType,
    source: "jobs",
    outcome: "published",
    dedupeKey: `job-posted:${job.id}`,
  });

  return Response.json({ id: job.id }, { status: 201 });
};
