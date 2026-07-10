import type { Env } from "./env";

export type CommunityAction =
  | "board_post"
  | "board_reply"
  | "event_created"
  | "event_rsvp"
  | "helpful_answer"
  | "accepted_answer"
  | "accepted_answer_revoked"
  | "project_launched"
  | "report_submitted";

export type ReportReason =
  | "spam"
  | "harassment"
  | "misinformation"
  | "unsafe"
  | "off_topic"
  | "other";

const ACTION_POINTS: Record<CommunityAction, number> = {
  board_post: 5,
  board_reply: 2,
  event_created: 10,
  event_rsvp: 2,
  helpful_answer: 3,
  accepted_answer: 10,
  accepted_answer_revoked: -10,
  project_launched: 15,
  report_submitted: 0,
};

const BADGE_RULES = [
  {
    key: "shipped_it",
    label: "Shipped It",
    actions: ["project_launched"] as CommunityAction[],
    count: 1,
  },
  {
    key: "first_contribution",
    label: "First Contribution",
    actions: ["board_post", "board_reply", "event_created"] as CommunityAction[],
    count: 1,
  },
  {
    key: "community_host",
    label: "Community Host",
    actions: ["event_created"] as CommunityAction[],
    count: 1,
  },
  {
    key: "shows_up",
    label: "Shows Up",
    actions: ["event_rsvp"] as CommunityAction[],
    count: 3,
  },
  {
    key: "neighbour",
    label: "Good Neighbour",
    actions: ["board_post", "board_reply", "event_created", "event_rsvp"] as CommunityAction[],
    count: 10,
  },
  {
    key: "problem_solver",
    label: "Problem Solver",
    actions: ["accepted_answer"] as CommunityAction[],
    count: 1,
  },
  {
    key: "helpful_neighbour",
    label: "Helpful Neighbour",
    actions: ["helpful_answer"] as CommunityAction[],
    count: 3,
  },
] as const;

function trustLevelForPoints(points: number): number {
  if (points >= 250) return 3;
  if (points >= 75) return 2;
  if (points >= 15) return 1;
  return 0;
}

function parseBadges(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

async function awardEligibleBadges(env: Env, profileId: number, action: CommunityAction): Promise<void> {
  const relevantRules = BADGE_RULES.filter((rule) => rule.actions.includes(action));
  if (relevantRules.length === 0) return;

  const profile = await env.DB.prepare("SELECT badges FROM profiles WHERE id = ?")
    .bind(profileId)
    .first<{ badges: string | null }>();
  const currentBadges = parseBadges(profile?.badges ?? null);
  let changed = false;

  for (const rule of relevantRules) {
    const placeholders = rule.actions.map(() => "?").join(",");
    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS count FROM reputation_events
       WHERE profile_id = ? AND event_type IN (${placeholders})`,
    ).bind(profileId, ...rule.actions).first<{ count: number }>();

    if ((row?.count ?? 0) < rule.count) continue;

    const result = await env.DB.prepare(
      "INSERT OR IGNORE INTO profile_badges (profile_id, badge_key) VALUES (?, ?)",
    ).bind(profileId, rule.key).run();

    if ((result.meta.changes ?? 0) > 0 && !currentBadges.includes(rule.label)) {
      currentBadges.push(rule.label);
      changed = true;
    }
  }

  if (changed) {
    await env.DB.prepare("UPDATE profiles SET badges = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(JSON.stringify(currentBadges), profileId)
      .run();
  }
}

export async function recordCommunityAction(
  env: Env,
  profileId: number,
  action: CommunityAction,
  sourceType: string,
  sourceId: number,
): Promise<void> {
  const points = ACTION_POINTS[action];
  const dedupeKey = `${action}:${sourceType}:${sourceId}:profile:${profileId}`;
  const result = await env.DB.prepare(
    `INSERT OR IGNORE INTO reputation_events
       (profile_id, event_type, points, source_type, source_id, dedupe_key)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(profileId, action, points, sourceType, sourceId, dedupeKey).run();

  if ((result.meta.changes ?? 0) === 0) return;

  const pointsRow = await env.DB.prepare(
    "SELECT COALESCE(SUM(points), 0) AS points FROM reputation_events WHERE profile_id = ?",
  ).bind(profileId).first<{ points: number }>();
  const totalPoints = pointsRow?.points ?? 0;

  await env.DB.prepare(
    "UPDATE profiles SET reputation_points = ?, trust_level = ?, updated_at = datetime('now') WHERE id = ?",
  ).bind(totalPoints, trustLevelForPoints(totalPoints), profileId).run();

  await awardEligibleBadges(env, profileId, action);
}

const REASON_SCORES: Record<ReportReason, number> = {
  spam: 1,
  harassment: 3,
  misinformation: 2,
  unsafe: 4,
  off_topic: 0,
  other: 1,
};

export function assessReportPriority(reason: ReportReason, details: string): "low" | "normal" | "high" | "urgent" {
  let score = REASON_SCORES[reason];
  const normalized = details.toLowerCase();

  if (/\b(threat|violence|weapon|doxx|address|suicide|self-harm)\b/.test(normalized)) score += 4;
  if (/\b(scam|fraud|impersonat|stolen)\b/.test(normalized)) score += 2;
  if ((normalized.match(/https?:\/\//g) ?? []).length >= 3) score += 1;
  if (details.trim().length >= 120) score += 1;

  if (score >= 7) return "urgent";
  if (score >= 4) return "high";
  if (score <= 0) return "low";
  return "normal";
}
