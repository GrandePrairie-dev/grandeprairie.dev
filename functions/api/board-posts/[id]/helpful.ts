import type { Env } from "../../../lib/env";
import { recordCommunityAction } from "../../../lib/community";
import { recordSignal } from "../../../lib/intelligence";

function parseReplyId(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function getReply(env: Env, id: number) {
  return env.DB.prepare(
    `SELECT reply.id, reply.author_id, reply.parent_id, parent.category
     FROM board_posts reply
     JOIN board_posts parent ON parent.id = reply.parent_id
     WHERE reply.id = ?`,
  ).bind(id).first<{ id: number; author_id: number | null; parent_id: number; category: string }>();
}

export const onRequestPost: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return Response.json({ error: "Sign in to mark an answer helpful." }, { status: 401 });
  const id = parseReplyId(params.id);
  if (!id) return Response.json({ error: "Invalid reply id." }, { status: 400 });
  const reply = await getReply(env, id);
  if (!reply) return Response.json({ error: "Reply not found." }, { status: 404 });
  if (reply.author_id === user.profileId) {
    return Response.json({ error: "You cannot mark your own reply helpful." }, { status: 400 });
  }

  const result = await env.DB.prepare(
    "INSERT OR IGNORE INTO board_helpful_votes (reply_id, profile_id) VALUES (?, ?)",
  ).bind(id, user.profileId).run();
  if ((result.meta.changes ?? 0) === 0) {
    return Response.json({ error: "Already marked helpful." }, { status: 409 });
  }
  await env.DB.prepare(
    "UPDATE board_posts SET helpful_count = helpful_count + 1, updated_at = datetime('now') WHERE id = ?",
  ).bind(id).run();

  if (reply.author_id) {
    await recordCommunityAction(env, reply.author_id, "helpful_answer", "board_post", id);
  }
  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: "answer_helpful_vote",
    targetType: "board_post",
    targetId: id,
    topic: reply.category,
    source: "board",
    outcome: "helpful",
    metadata: { question_id: reply.parent_id, answer_author_id: reply.author_id },
    dedupeKey: `answer-helpful:${id}:${user.profileId}`,
  });

  const count = await env.DB.prepare("SELECT helpful_count FROM board_posts WHERE id = ?")
    .bind(id).first<{ helpful_count: number }>();
  return Response.json({ helpful_count: count?.helpful_count ?? 1, viewer_found_helpful: 1 });
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return Response.json({ error: "Sign in to update helpful votes." }, { status: 401 });
  const id = parseReplyId(params.id);
  if (!id) return Response.json({ error: "Invalid reply id." }, { status: 400 });
  const reply = await getReply(env, id);
  if (!reply) return Response.json({ error: "Reply not found." }, { status: 404 });

  const result = await env.DB.prepare(
    "DELETE FROM board_helpful_votes WHERE reply_id = ? AND profile_id = ?",
  ).bind(id, user.profileId).run();
  if ((result.meta.changes ?? 0) === 0) return Response.json({ error: "Helpful vote not found." }, { status: 404 });
  await env.DB.prepare(
    "UPDATE board_posts SET helpful_count = MAX(0, helpful_count - 1), updated_at = datetime('now') WHERE id = ?",
  ).bind(id).run();
  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: "answer_helpful_vote",
    targetType: "board_post",
    targetId: id,
    topic: reply.category,
    source: "board",
    outcome: "removed",
    metadata: { question_id: reply.parent_id, answer_author_id: reply.author_id },
  });
  const count = await env.DB.prepare("SELECT helpful_count FROM board_posts WHERE id = ?")
    .bind(id).first<{ helpful_count: number }>();
  return Response.json({ helpful_count: count?.helpful_count ?? 0, viewer_found_helpful: 0 });
};
