import type { Env } from "../../lib/env";
import { recordCommunityAction } from "../../lib/community";
import { recordSignal } from "../../lib/intelligence";
import { getCurrentLaunchCycle, isLaunchCycleOpen } from "../../lib/launches";

interface SubmissionBody {
  title?: string;
  description?: string;
  pitch?: string;
  category?: string;
  demo_url?: string;
  repo_url?: string;
  tags?: string[];
}

function cleanUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  const cycle = await getCurrentLaunchCycle(env);
  const { results } = await env.DB.prepare(
    `SELECT le.id, le.cycle_id, le.project_id, le.pitch, le.votes_count, le.submitted_at,
            p.title, p.description, p.category, p.repo_url, p.demo_url, p.tags, p.author_id,
            author.name AS author_name,
            CASE WHEN lv.profile_id IS NULL THEN 0 ELSE 1 END AS viewer_voted
       FROM launch_entries le
       JOIN projects p ON p.id = le.project_id
       LEFT JOIN profiles author ON author.id = p.author_id
       LEFT JOIN launch_votes lv ON lv.entry_id = le.id AND lv.profile_id = ?
      WHERE le.cycle_id = ?
      ORDER BY le.votes_count DESC, le.submitted_at ASC, le.id ASC`,
  ).bind(user?.profileId ?? -1, cycle.id).all<Record<string, unknown>>();

  const entries = results.map((entry, index) => ({ ...entry, rank: index + 1 }));
  return Response.json({ ...cycle, is_open: isLaunchCycleOpen(cycle), entries });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await request.json<SubmissionBody>();
  const title = body.title?.trim();
  const description = body.description?.trim();
  const pitch = body.pitch?.trim();
  if (!title || !description || !pitch) {
    return Response.json({ error: "Title, description, and launch pitch are required" }, { status: 400 });
  }
  if (title.length > 120 || description.length > 1200 || pitch.length > 280) {
    return Response.json({ error: "Submission is too long" }, { status: 400 });
  }

  const demoUrl = cleanUrl(body.demo_url);
  const repoUrl = cleanUrl(body.repo_url);
  if ((body.demo_url && !demoUrl) || (body.repo_url && !repoUrl)) {
    return Response.json({ error: "Project links must be valid HTTP or HTTPS URLs" }, { status: 400 });
  }

  const cycle = await getCurrentLaunchCycle(env);
  if (!isLaunchCycleOpen(cycle)) {
    return Response.json({ error: "This launch cycle is closed" }, { status: 409 });
  }
  const existing = await env.DB.prepare(
    "SELECT id FROM launch_entries WHERE cycle_id = ? AND submitted_by_profile_id = ?",
  ).bind(cycle.id, user.profileId).first();
  if (existing) {
    return Response.json({ error: "You already submitted a launch this month" }, { status: 409 });
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.map((tag) => tag.trim()).filter(Boolean).slice(0, 6)
    : [];
  const [projectResult, entryResult] = await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO projects
       (title, description, category, status, repo_url, demo_url, author_id, tags)
       VALUES (?, ?, ?, 'launched', ?, ?, ?, ?)`,
    ).bind(
      title,
      description,
      body.category?.trim() || "community",
      repoUrl,
      demoUrl,
      user.profileId,
      JSON.stringify(tags),
    ),
    env.DB.prepare(
      `INSERT INTO launch_entries (cycle_id, project_id, submitted_by_profile_id, pitch)
       VALUES (?, last_insert_rowid(), ?, ?)`,
    ).bind(cycle.id, user.profileId, pitch),
  ]);
  const projectId = Number(projectResult.meta.last_row_id);
  const entryId = Number(entryResult.meta.last_row_id);
  if (!projectId || !entryId) return Response.json({ error: "Could not submit launch" }, { status: 500 });

  await recordCommunityAction(env, user.profileId, "project_launched", "launch_entry", entryId);
  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: "project_launched",
    targetType: "project",
    targetId: projectId,
    topic: body.category?.trim() || "community",
    source: "launch_board",
    outcome: "submitted",
    dedupeKey: `project-launched:${projectId}`,
  });

  return Response.json({ id: entryId, project_id: projectId }, { status: 201 });
};
