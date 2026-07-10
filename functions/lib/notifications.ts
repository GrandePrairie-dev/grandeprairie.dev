import type { Env } from "./env";
import { sendMatchNotification, type MatchNotificationEmail } from "./email";

interface MatchDelivery extends MatchNotificationEmail {
  decisionId: number;
  recipientId: string | number;
}

async function claim(env: Env, delivery: MatchDelivery): Promise<boolean> {
  const dedupeKey = `business-match:${delivery.decisionId}:${delivery.recipientType}`;
  const result = await env.DB.prepare(
    `INSERT INTO community_notifications
       (notification_type, target_type, target_id, recipient_type, recipient_id, dedupe_key)
     VALUES ('business_match', 'matching_decision', ?, ?, ?, ?)
     ON CONFLICT(dedupe_key) DO UPDATE SET
       status = 'sending', attempted_at = datetime('now'), error_code = NULL
     WHERE community_notifications.status = 'failed'
        OR (community_notifications.status = 'sending'
            AND community_notifications.attempted_at < datetime('now', '-15 minutes'))`,
  ).bind(
    String(delivery.decisionId),
    delivery.recipientType === "builder" ? "profile" : "business_contact",
    String(delivery.recipientId),
    dedupeKey,
  ).run();
  return (result.meta.changes ?? 0) > 0;
}

export async function deliverMatchNotification(env: Env, delivery: MatchDelivery): Promise<"sent" | "failed" | "skipped"> {
  if (!await claim(env, delivery)) return "skipped";
  const dedupeKey = `business-match:${delivery.decisionId}:${delivery.recipientType}`;
  if (!delivery.to) {
    await env.DB.prepare(
      "UPDATE community_notifications SET status = 'failed', error_code = 'missing_email' WHERE dedupe_key = ?",
    ).bind(dedupeKey).run();
    return "failed";
  }

  const sent = await sendMatchNotification(env, delivery);
  await env.DB.prepare(
    `UPDATE community_notifications SET status = ?, sent_at = CASE WHEN ? THEN datetime('now') ELSE NULL END,
       error_code = CASE WHEN ? THEN NULL ELSE 'delivery_failed' END WHERE dedupe_key = ?`,
  ).bind(sent ? "sent" : "failed", sent ? 1 : 0, sent ? 1 : 0, dedupeKey).run();
  return sent ? "sent" : "failed";
}
