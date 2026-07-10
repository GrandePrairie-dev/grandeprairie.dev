import type { Env } from "../lib/env";
import { logActivity } from "../lib/activity";
import { notifySlack } from "../lib/slack";
import { recordCommunityAction } from "../lib/community";
import { recordSignal } from "../lib/intelligence";

const BOARD_CATEGORIES = new Set([
  "general",
  "help",
  "jobs",
  "events",
  "showcase",
  "field_notes",
]);

function parseId(value: string | null): number | null {
  if (!value) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function clampSummary(value: string, max = 90): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}...` : trimmed;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, data }) => {
  const url = new URL(request.url);
  const parentId = parseId(url.searchParams.get("parent_id"));
  const category = url.searchParams.get("category");
  const view = url.searchParams.get("view") ?? "all";
  const viewer = (data as { user?: { profileId: number } }).user;
  const validViews = new Set(["all", "questions", "unanswered", "needs_mentor"]);

  if (url.searchParams.has("parent_id") && !parentId) {
    return Response.json({ error: "Invalid parent_id" }, { status: 400 });
  }
  if (!validViews.has(view)) return Response.json({ error: "Invalid board view" }, { status: 400 });

  if (parentId) {
    const { results } = await env.DB.prepare(
      `SELECT bp.*, p.name as author_name, p.role as author_role, p.avatar_url as author_avatar_url,
         0 as reply_count,
         EXISTS(
           SELECT 1 FROM board_helpful_votes bhv
           WHERE bhv.reply_id = bp.id AND bhv.profile_id = ?
         ) as viewer_found_helpful
       FROM board_posts bp
       LEFT JOIN profiles p ON bp.author_id = p.id
       WHERE bp.parent_id = ?
       ORDER BY bp.created_at ASC`,
    ).bind(viewer?.profileId ?? null, parentId).all();
    return Response.json(results);
  }

  const bindings: unknown[] = [];
  let where = "WHERE bp.parent_id IS NULL";

  if (category && category !== "all") {
    if (!BOARD_CATEGORIES.has(category)) {
      return Response.json({ error: "Invalid category" }, { status: 400 });
    }
    where += " AND bp.category = ?";
    bindings.push(category);
  }
  if (view === "questions") where += " AND bp.post_type = 'question'";
  if (view === "unanswered") where += " AND bp.post_type = 'question' AND bp.accepted_reply_id IS NULL";
  if (view === "needs_mentor") where += " AND bp.post_type = 'question' AND bp.needs_mentor = 1 AND bp.accepted_reply_id IS NULL";

  const { results } = await env.DB.prepare(
    `SELECT bp.*, p.name as author_name, p.role as author_role, p.avatar_url as author_avatar_url,
       (SELECT COUNT(*) FROM board_posts replies WHERE replies.parent_id = bp.id) as reply_count
     FROM board_posts bp
     LEFT JOIN profiles p ON bp.author_id = p.id
     ${where}
     ORDER BY bp.is_pinned DESC, bp.created_at DESC
     LIMIT 100`,
  ).bind(...bindings).all();

  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await request.json<{
    title?: string;
    body?: string;
    category?: string;
    parent_id?: number | string | null;
    post_type?: string;
    needs_mentor?: boolean;
  }>();

  const postBody = body.body?.trim();
  if (!postBody) return Response.json({ error: "body is required" }, { status: 400 });
  if (postBody.length > 3000) {
    return Response.json({ error: "body must be under 3000 characters" }, { status: 400 });
  }

  const parentId = body.parent_id ? Number(body.parent_id) : null;
  if (parentId !== null && (!Number.isInteger(parentId) || parentId <= 0)) {
    return Response.json({ error: "Invalid parent_id" }, { status: 400 });
  }

  let title: string | null = null;
  let category = body.category ?? "general";
  let postType = "discussion";
  let needsMentor = 0;

  if (parentId) {
    const parent = await env.DB.prepare(
      "SELECT id, category, status FROM board_posts WHERE id = ? AND parent_id IS NULL",
    ).bind(parentId).first<{ id: number; category: string; status: string }>();
    if (!parent) return Response.json({ error: "Thread not found" }, { status: 404 });
    if (parent.status !== "open") return Response.json({ error: "Thread is closed" }, { status: 400 });
    category = parent.category;
  } else {
    title = body.title?.trim() ?? "";
    if (title.length < 3) {
      return Response.json({ error: "title must be at least 3 characters" }, { status: 400 });
    }
    if (title.length > 140) {
      return Response.json({ error: "title must be under 140 characters" }, { status: 400 });
    }
    if (!BOARD_CATEGORIES.has(category)) {
      return Response.json({ error: "Invalid category" }, { status: 400 });
    }
    postType = body.post_type ?? "discussion";
    if (!new Set(["discussion", "question"]).has(postType)) {
      return Response.json({ error: "Invalid post_type" }, { status: 400 });
    }
    needsMentor = postType === "question" && body.needs_mentor ? 1 : 0;
  }

  const result = await env.DB.prepare(
    `INSERT INTO board_posts (title, body, category, author_id, parent_id, post_type, needs_mentor)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).bind(title, postBody, category, user.profileId, parentId, postType, needsMentor).run();

  const postId = result.meta.last_row_id as number;
  await logActivity(
    env,
    parentId ? "board_reply" : "board_post",
    user.profileId,
    "board_post",
    postId,
    parentId ? `replied: ${clampSummary(postBody)}` : String(title),
  );
  await recordCommunityAction(
    env,
    user.profileId,
    parentId ? "board_reply" : "board_post",
    "board_post",
    postId,
  );
  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: parentId ? "board_reply_created" : "board_post_created",
    targetType: "board_post",
    targetId: postId,
    topic: category,
    source: "board",
    outcome: "published",
    metadata: { parent_id: parentId, post_type: postType, needs_mentor: Boolean(needsMentor) },
    dedupeKey: `board-post:${postId}:published`,
  });

  if (!parentId) {
    await notifySlack(env, `\u{1F4AC} New board thread: "${title}"`);
  }

  return Response.json({ id: postId }, { status: 201 });
};
