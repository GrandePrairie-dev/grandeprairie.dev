import type { Env, UserContext } from "../lib/env";
import { assessReportPriority, recordCommunityAction, type ReportReason } from "../lib/community";
import { notifySlack } from "../lib/slack";

const TARGET_TABLES = {
  board_post: "board_posts",
  profile: "profiles",
  project: "projects",
  event: "events",
} as const;

const REPORT_REASONS = new Set<ReportReason>([
  "spam",
  "harassment",
  "misinformation",
  "unsafe",
  "off_topic",
  "other",
]);

export const onRequestGet: PagesFunction<Env> = async ({ env, data }) => {
  const user = (data as { user?: UserContext }).user;
  if (!user?.isAdmin) return Response.json({ error: "Admin access required." }, { status: 403 });

  const { results } = await env.DB.prepare(
    `SELECT cr.*, reporter.name AS reporter_name, moderator.name AS moderator_name,
       CASE cr.target_type
         WHEN 'board_post' THEN COALESCE(
           (SELECT title FROM board_posts WHERE id = cr.target_id),
           (SELECT substr(body, 1, 100) FROM board_posts WHERE id = cr.target_id)
         )
         WHEN 'profile' THEN (SELECT name FROM profiles WHERE id = cr.target_id)
         WHEN 'project' THEN (SELECT title FROM projects WHERE id = cr.target_id)
         WHEN 'event' THEN (SELECT title FROM events WHERE id = cr.target_id)
       END AS target_label
     FROM content_reports cr
     JOIN profiles reporter ON reporter.id = cr.reporter_profile_id
     LEFT JOIN profiles moderator ON moderator.id = cr.moderator_profile_id
     ORDER BY
       CASE cr.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
       CASE cr.status WHEN 'open' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END,
       cr.created_at DESC
     LIMIT 200`,
  ).all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, data }) => {
  const user = (data as { user?: UserContext }).user;
  if (!user) return Response.json({ error: "Sign in to report content." }, { status: 401 });

  const body = await request.json<{
    target_type?: string;
    target_id?: number;
    reason?: ReportReason;
    details?: string;
  }>().catch(() => null);
  const targetType = body?.target_type as keyof typeof TARGET_TABLES | undefined;
  const targetId = Number(body?.target_id);
  const reason = body?.reason;
  const details = typeof body?.details === "string" ? body.details.trim().slice(0, 1000) : "";

  if (!targetType || !(targetType in TARGET_TABLES) || !Number.isInteger(targetId) || targetId <= 0) {
    return Response.json({ error: "Invalid report target." }, { status: 400 });
  }
  if (!reason || !REPORT_REASONS.has(reason)) {
    return Response.json({ error: "Choose a valid report reason." }, { status: 400 });
  }

  const target = await env.DB.prepare(`SELECT id FROM ${TARGET_TABLES[targetType]} WHERE id = ?`)
    .bind(targetId)
    .first<{ id: number }>();
  if (!target) return Response.json({ error: "Reported content was not found." }, { status: 404 });

  const existing = await env.DB.prepare(
    "SELECT id FROM content_reports WHERE reporter_profile_id = ? AND target_type = ? AND target_id = ?",
  ).bind(user.profileId, targetType, targetId).first<{ id: number }>();
  if (existing) return Response.json({ error: "You already reported this content." }, { status: 409 });

  const priority = assessReportPriority(reason, details);
  const result = await env.DB.prepare(
    `INSERT INTO content_reports
       (reporter_profile_id, target_type, target_id, reason, details, priority)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(user.profileId, targetType, targetId, reason, details || null, priority).run();
  const reportId = result.meta.last_row_id as number;

  await recordCommunityAction(env, user.profileId, "report_submitted", "content_report", reportId);
  if (priority === "urgent" || priority === "high") {
    await notifySlack(env, `Moderation ${priority}: ${reason} report on ${targetType} #${targetId}`);
  }

  return Response.json({ id: reportId, priority }, { status: 201 });
};
