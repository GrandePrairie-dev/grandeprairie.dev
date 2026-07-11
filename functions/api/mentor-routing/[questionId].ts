import type { Env } from "../../lib/env";
import { isAdminInDb } from "../../lib/auth";

function parseTopics(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").map((item) => item.toLowerCase())
      : [];
  } catch {
    return [];
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });
  const questionId = Number(params.questionId);
  const question = await env.DB.prepare(
    `SELECT bp.*, p.name AS author_name
       FROM board_posts bp LEFT JOIN profiles p ON p.id = bp.author_id
      WHERE bp.id = ? AND bp.parent_id IS NULL AND bp.post_type = 'question'
        AND bp.needs_mentor = 1 AND bp.accepted_reply_id IS NULL`,
  ).bind(questionId).first<Record<string, unknown>>();
  if (!question) return new Response("Question not found", { status: 404 });
  if (question.author_id !== user.profileId && !await isAdminInDb(env.DB, user.profileId)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { results } = await env.DB.prepare(
    `SELECT p.id, p.name, p.username, p.title, p.bio, p.role, p.skills, p.badges,
            p.links, p.is_featured, p.is_admin, p.avatar_url, p.auth_provider,
            p.google_id, p.email_verified, p.reputation_points, p.trust_level,
            p.mentor_available, p.mentor_topics, p.mentor_capacity, p.created_at, p.updated_at,
            SUM(CASE WHEN mr.status IN ('pending', 'accepted') THEN 1 ELSE 0 END) AS active_requests
       FROM profiles p
       LEFT JOIN mentor_requests mr ON mr.mentor_profile_id = p.id
      WHERE p.mentor_available = 1 AND p.id != ?
      GROUP BY p.id
      HAVING active_requests < p.mentor_capacity
      ORDER BY p.reputation_points DESC, p.created_at ASC`,
  ).bind(user.profileId).all<Record<string, unknown>>();

  const topic = String(question.category || "help").toLowerCase();
  const questionWords = new Set(
    `${question.title ?? ""} ${question.body ?? ""} ${topic}`
      .toLowerCase().split(/[^a-z0-9+#.-]+/).filter((word) => word.length >= 3),
  );
  const mentors = results.map((mentor) => {
    const topics = parseTopics(String(mentor.mentor_topics ?? "[]"));
    const matchedTopics = topics.filter((item) =>
      questionWords.has(item) || [...questionWords].some((word) => item.includes(word) || word.includes(item)),
    );
    const active = Number(mentor.active_requests ?? 0);
    const capacity = Number(mentor.mentor_capacity ?? 2);
    return {
      ...mentor,
      active_requests: active,
      capacity_remaining: Math.max(0, capacity - active),
      match_score: matchedTopics.length * 10 + (topics.includes(topic) ? 8 : 0) + Math.min(5, Number(mentor.trust_level ?? 0)),
      matched_topics: matchedTopics,
    };
  }).sort((a, b) => b.match_score - a.match_score || b.capacity_remaining - a.capacity_remaining);

  return Response.json({ question, topic, mentors });
};
