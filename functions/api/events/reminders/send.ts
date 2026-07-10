import type { Env } from "../../../lib/env";
import { sendEventReminder } from "../../../lib/email";

interface ReminderRecipient {
  event_id: number;
  profile_id: number;
  email: string;
  title: string;
  start_time: string;
  location: string | null;
}

async function claimReminder(env: Env, eventId: number, profileId: number): Promise<boolean> {
  const result = await env.DB.prepare(
    `INSERT INTO event_reminders (event_id, profile_id, reminder_type, status)
     VALUES (?, ?, '24_hour', 'sending')
     ON CONFLICT(event_id, profile_id, reminder_type) DO UPDATE SET
       status = 'sending', attempted_at = datetime('now')
     WHERE event_reminders.status = 'failed'
        OR (event_reminders.status = 'sending'
            AND event_reminders.attempted_at < datetime('now', '-15 minutes'))`,
  ).bind(eventId, profileId).run();
  return (result.meta.changes ?? 0) > 0;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.PIPELINE_SECRET || request.headers.get("X-Pipeline-Secret") !== env.PIPELINE_SECRET) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!env.RESEND_API_KEY) {
    return Response.json({ error: "Event reminder email is not configured." }, { status: 503 });
  }

  const { results } = await env.DB.prepare(
    `SELECT e.id AS event_id, er.profile_id, p.email, e.title, e.start_time, e.location
     FROM event_rsvps er
     JOIN events e ON e.id = er.event_id
     JOIN profiles p ON p.id = er.profile_id
     WHERE er.status = 'attending'
       AND p.email IS NOT NULL AND trim(p.email) != ''
       AND datetime(e.start_time) >= datetime('now', '+23 hours')
       AND datetime(e.start_time) < datetime('now', '+25 hours')
       AND NOT EXISTS (
         SELECT 1 FROM event_reminders reminder
         WHERE reminder.event_id = e.id AND reminder.profile_id = er.profile_id
           AND reminder.reminder_type = '24_hour' AND reminder.status = 'sent'
       )
     ORDER BY e.start_time ASC
     LIMIT 100`,
  ).all<ReminderRecipient>();

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const recipient of results) {
    if (!await claimReminder(env, recipient.event_id, recipient.profile_id)) {
      skipped += 1;
      continue;
    }

    const ok = await sendEventReminder(env, {
      to: recipient.email,
      eventTitle: recipient.title,
      startTime: recipient.start_time,
      location: recipient.location,
    });
    await env.DB.prepare(
      `UPDATE event_reminders SET status = ?, sent_at = CASE WHEN ? THEN datetime('now') ELSE NULL END
       WHERE event_id = ? AND profile_id = ? AND reminder_type = '24_hour'`,
    ).bind(ok ? "sent" : "failed", ok ? 1 : 0, recipient.event_id, recipient.profile_id).run();
    if (ok) sent += 1;
    else failed += 1;
  }

  const remaining = await env.DB.prepare(
    `SELECT COUNT(*) AS count
     FROM event_rsvps er
     JOIN events e ON e.id = er.event_id
     JOIN profiles p ON p.id = er.profile_id
     WHERE er.status = 'attending'
       AND p.email IS NOT NULL AND trim(p.email) != ''
       AND datetime(e.start_time) >= datetime('now', '+23 hours')
       AND datetime(e.start_time) < datetime('now', '+25 hours')
       AND NOT EXISTS (
         SELECT 1 FROM event_reminders reminder
         WHERE reminder.event_id = e.id AND reminder.profile_id = er.profile_id
           AND reminder.reminder_type = '24_hour' AND reminder.status = 'sent'
       )`,
  ).first<{ count: number }>();

  return Response.json({ recipients: results.length, sent, failed, skipped, remaining: remaining?.count ?? 0 });
};
