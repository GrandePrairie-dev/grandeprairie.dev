import type { Env } from "../../lib/env";
import { sendWeeklyDigest, type DigestItem } from "../../lib/email";

interface DigestSubscription {
  id: number;
  email: string;
  topics: string;
  unsubscribe_token: string;
}

function parseTopics(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function currentWeeklyPeriod(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Edmonton",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const localDate = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
  const daysSinceMonday = (localDate.getUTCDay() + 6) % 7;
  localDate.setUTCDate(localDate.getUTCDate() - daysSinceMonday);
  return localDate.toISOString().slice(0, 10);
}

async function claimDelivery(env: Env, subscriptionId: number, periodStart: string): Promise<boolean> {
  const result = await env.DB.prepare(
    `INSERT INTO digest_deliveries (subscription_id, period_start, status)
     VALUES (?, ?, 'sending')
     ON CONFLICT(subscription_id, period_start) DO UPDATE SET
       status = 'sending', attempted_at = datetime('now')
     WHERE digest_deliveries.status = 'failed'
        OR (digest_deliveries.status = 'sending'
            AND digest_deliveries.attempted_at < datetime('now', '-15 minutes'))`,
  ).bind(subscriptionId, periodStart).run();
  return (result.meta.changes ?? 0) > 0;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.PIPELINE_SECRET || request.headers.get("X-Pipeline-Secret") !== env.PIPELINE_SECRET) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!env.RESEND_API_KEY) {
    return Response.json({ error: "Digest email is not configured." }, { status: 503 });
  }
  const periodStart = currentWeeklyPeriod();

  const [eventsResult, boardResult, projectsResult, intelResult, subscriptionsResult] = await Promise.all([
    env.DB.prepare(
      `SELECT title, location, start_time FROM events
       WHERE start_time >= datetime('now') AND start_time < datetime('now', '+8 days')
       ORDER BY start_time ASC LIMIT 8`,
    ).all<{ title: string; location: string | null; start_time: string }>(),
    env.DB.prepare(
      `SELECT id, title, category, post_type, accepted_reply_id, needs_mentor FROM board_posts
       WHERE parent_id IS NULL AND created_at >= datetime('now', '-7 days')
       ORDER BY is_pinned DESC, created_at DESC LIMIT 8`,
    ).all<{
      id: number;
      title: string;
      category: string;
      post_type: string;
      accepted_reply_id: number | null;
      needs_mentor: number;
    }>(),
    env.DB.prepare(
      `SELECT id, title, category FROM projects
       WHERE created_at >= datetime('now', '-30 days')
       ORDER BY is_featured DESC, created_at DESC LIMIT 6`,
    ).all<{ id: number; title: string; category: string | null }>(),
    env.DB.prepare(
      `SELECT title, source_url, category FROM intel
       WHERE created_at >= datetime('now', '-7 days')
       ORDER BY is_pinned DESC, created_at DESC LIMIT 8`,
    ).all<{ title: string; source_url: string | null; category: string | null }>(),
    env.DB.prepare(
      `SELECT id, email, topics, unsubscribe_token FROM digest_subscriptions
       WHERE status = 'active' AND frequency = 'weekly' AND confirmed_at IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM digest_deliveries dd
           WHERE dd.subscription_id = digest_subscriptions.id
             AND dd.period_start = ? AND dd.status = 'sent'
         )
       ORDER BY COALESCE(last_sent_at, '1970-01-01') ASC LIMIT 100`,
    ).bind(periodStart).all<DigestSubscription>(),
  ]);

  const events: DigestItem[] = eventsResult.results.map((event) => ({
    title: event.title,
    detail: `${new Date(event.start_time).toLocaleString("en-CA", { timeZone: "America/Edmonton", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}${event.location ? ` at ${event.location}` : ""}`,
    href: "/calendar",
  }));
  const boardPosts: DigestItem[] = boardResult.results.map((post) => ({
    title: post.title,
    detail: post.post_type === "question"
      ? `${post.accepted_reply_id ? "answered question" : post.needs_mentor ? "question · needs mentor" : "unanswered question"} · ${post.category.replace(/_/g, " ")}`
      : post.category.replace(/_/g, " "),
    href: "/board",
  }));
  const projects: DigestItem[] = projectsResult.results.map((project) => ({
    title: project.title,
    detail: project.category,
    href: "/projects",
  }));
  const intel: DigestItem[] = intelResult.results.map((item) => ({
    title: item.title,
    detail: item.category,
    href: item.source_url || "/intel",
  }));

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const subscription of subscriptionsResult.results) {
    if (!await claimDelivery(env, subscription.id, periodStart)) {
      skipped += 1;
      continue;
    }
    const ok = await sendWeeklyDigest(env, {
      to: subscription.email,
      unsubscribeToken: subscription.unsubscribe_token,
      topics: parseTopics(subscription.topics),
      events,
      boardPosts,
      projects,
      intel,
    });
    if (ok) {
      sent += 1;
      await env.DB.batch([
        env.DB.prepare(
          "UPDATE digest_deliveries SET status = 'sent', sent_at = datetime('now') WHERE subscription_id = ? AND period_start = ?",
        ).bind(subscription.id, periodStart),
        env.DB.prepare(
          "UPDATE digest_subscriptions SET last_sent_at = datetime('now') WHERE id = ?",
        ).bind(subscription.id),
      ]);
    } else {
      failed += 1;
      await env.DB.prepare(
        "UPDATE digest_deliveries SET status = 'failed' WHERE subscription_id = ? AND period_start = ?",
      ).bind(subscription.id, periodStart).run();
    }
  }

  const remaining = await env.DB.prepare(
    `SELECT COUNT(*) AS count FROM digest_subscriptions ds
     WHERE ds.status = 'active' AND ds.frequency = 'weekly' AND ds.confirmed_at IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM digest_deliveries dd
         WHERE dd.subscription_id = ds.id AND dd.period_start = ? AND dd.status = 'sent'
       )`,
  ).bind(periodStart).first<{ count: number }>();

  return Response.json({
    period_start: periodStart,
    subscribers: subscriptionsResult.results.length,
    sent,
    failed,
    skipped,
    remaining: remaining?.count ?? 0,
  });
};
