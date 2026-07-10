import type { Env } from "../../../lib/env";

const NEXT_LEVEL = [15, 75, 250] as const;

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const profileId = Number(params.id);
  if (!Number.isInteger(profileId)) return new Response("Invalid profile", { status: 400 });

  const profile = await env.DB.prepare(
    "SELECT reputation_points, trust_level FROM profiles WHERE id = ?",
  ).bind(profileId).first<{ reputation_points: number; trust_level: number }>();
  if (!profile) return new Response("Not found", { status: 404 });

  const [badges, contributions, recent] = await Promise.all([
    env.DB.prepare(
      "SELECT badge_key AS key, awarded_at FROM profile_badges WHERE profile_id = ? ORDER BY awarded_at DESC",
    ).bind(profileId).all(),
    env.DB.prepare(
      `SELECT event_type, COUNT(*) AS count, COALESCE(SUM(points), 0) AS points
         FROM reputation_events
        WHERE profile_id = ?
        GROUP BY event_type
        ORDER BY MAX(created_at) DESC`,
    ).bind(profileId).all(),
    env.DB.prepare(
      `SELECT id, event_type, points, source_type, source_id, created_at
         FROM reputation_events
        WHERE profile_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 8`,
    ).bind(profileId).all(),
  ]);

  return Response.json({
    points: profile.reputation_points,
    trust_level: profile.trust_level,
    next_level_points: NEXT_LEVEL[profile.trust_level] ?? null,
    badges: badges.results,
    contributions: contributions.results,
    recent: recent.results,
  });
};
