import type { Env } from "../../../lib/env";
import { isAdminInDb } from "../../../lib/auth";
import { recordCommunityAction } from "../../../lib/community";
import { recordSignal } from "../../../lib/intelligence";

function parseReplyId(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export const onRequestPatch: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return Response.json({ error: "Sign in to accept an answer." }, { status: 401 });
  const id = parseReplyId(params.id);
  if (!id) return Response.json({ error: "Invalid reply id." }, { status: 400 });

  const reply = await env.DB.prepare(
    `SELECT reply.id, reply.author_id, reply.parent_id, parent.author_id AS question_author_id,
            parent.post_type, parent.accepted_reply_id, parent.category
     FROM board_posts reply
     JOIN board_posts parent ON parent.id = reply.parent_id
     WHERE reply.id = ?`,
  ).bind(id).first<{
    id: number;
    author_id: number | null;
    parent_id: number;
    question_author_id: number | null;
    post_type: string;
    accepted_reply_id: number | null;
    category: string;
  }>();
  if (!reply) return Response.json({ error: "Reply not found." }, { status: 404 });
  if (reply.post_type !== "question") return Response.json({ error: "Only questions can accept answers." }, { status: 400 });
  if (reply.accepted_reply_id === id) return Response.json({ accepted_reply_id: id, unchanged: true });
  if (reply.question_author_id !== user.profileId && !await isAdminInDb(env.DB, user.profileId)) {
    return Response.json({ error: "Only the question author or an admin can accept an answer." }, { status: 403 });
  }

  const previous = reply.accepted_reply_id
    ? await env.DB.prepare("SELECT author_id FROM board_posts WHERE id = ?")
      .bind(reply.accepted_reply_id).first<{ author_id: number | null }>()
    : null;
  const transitionKey = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO board_answer_acceptance_history
         (transition_key, question_id, previous_reply_id, accepted_reply_id, accepted_by_profile_id)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(transitionKey, reply.parent_id, reply.accepted_reply_id, id, user.profileId),
    env.DB.prepare(
      `UPDATE board_posts SET accepted_reply_id = ?, accepted_by_profile_id = ?, accepted_at = datetime('now'),
         needs_mentor = 0, updated_at = datetime('now') WHERE id = ?`,
    ).bind(id, user.profileId, reply.parent_id),
  ]);
  const history = await env.DB.prepare(
    "SELECT id FROM board_answer_acceptance_history WHERE transition_key = ?",
  ).bind(transitionKey).first<{ id: number }>();

  if (history && previous?.author_id && previous.author_id !== reply.author_id) {
    await recordCommunityAction(env, previous.author_id, "accepted_answer_revoked", "board_acceptance", history.id);
  }
  if (history && reply.author_id && previous?.author_id !== reply.author_id) {
    await recordCommunityAction(env, reply.author_id, "accepted_answer", "board_acceptance", history.id);
  }
  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: "answer_accepted",
    targetType: "board_post",
    targetId: id,
    topic: reply.category,
    source: "board",
    outcome: "accepted",
    metadata: {
      question_id: reply.parent_id,
      answer_author_id: reply.author_id,
      previous_reply_id: reply.accepted_reply_id,
      previous_answer_author_id: previous?.author_id ?? null,
      acceptance_history_id: history?.id ?? null,
    },
  });
  return Response.json({ accepted_reply_id: id, accepted_at: new Date().toISOString() });
};
