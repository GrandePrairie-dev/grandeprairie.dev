import type { Env, UserContext } from "../../../lib/env";
import { recordCommunityAction } from "../../../lib/community";

function parseEventId(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function counts(env: Env, eventId: number) {
  return env.DB.prepare(
    `SELECT
       SUM(CASE WHEN status = 'attending' THEN 1 ELSE 0 END) AS attendee_count,
       SUM(CASE WHEN status = 'waitlist' THEN 1 ELSE 0 END) AS waitlist_count
     FROM event_rsvps WHERE event_id = ?`,
  ).bind(eventId).first<{ attendee_count: number; waitlist_count: number }>();
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, data, params }) => {
  const user = (data as { user?: UserContext }).user;
  if (!user) return Response.json({ error: "Sign in to RSVP." }, { status: 401 });

  const eventId = parseEventId(params.id);
  if (!eventId) return Response.json({ error: "Invalid event id." }, { status: 400 });

  const event = await env.DB.prepare(
    "SELECT id, capacity, allow_waitlist FROM events WHERE id = ?",
  ).bind(eventId).first<{ id: number; capacity: number | null; allow_waitlist: number }>();
  if (!event) return Response.json({ error: "Event not found." }, { status: 404 });

  const body = await request.json<{ status?: string }>().catch(() => null);
  const requestedStatus = body?.status === "cancelled" ? "cancelled" : "attending";
  const existing = await env.DB.prepare(
    "SELECT status FROM event_rsvps WHERE event_id = ? AND profile_id = ?",
  ).bind(eventId, user.profileId).first<{ status: string }>();

  let status = requestedStatus;
  if (requestedStatus === "attending" && existing?.status !== "attending" && event.capacity) {
    const currentCounts = await counts(env, eventId);
    if ((currentCounts?.attendee_count ?? 0) >= event.capacity) {
      if (!event.allow_waitlist) {
        return Response.json({ error: "This event is full." }, { status: 409 });
      }
      status = "waitlist";
    }
  }

  await env.DB.prepare(
    `INSERT INTO event_rsvps (event_id, profile_id, status)
     VALUES (?, ?, ?)
     ON CONFLICT(event_id, profile_id) DO UPDATE SET
       status = excluded.status,
       updated_at = datetime('now')`,
  ).bind(eventId, user.profileId, status).run();

  if (status === "cancelled" && existing?.status === "attending") {
    const next = await env.DB.prepare(
      `SELECT id FROM event_rsvps
       WHERE event_id = ? AND status = 'waitlist'
       ORDER BY created_at ASC LIMIT 1`,
    ).bind(eventId).first<{ id: number }>();
    if (next) {
      await env.DB.prepare(
        "UPDATE event_rsvps SET status = 'attending', updated_at = datetime('now') WHERE id = ?",
      ).bind(next.id).run();
    }
  }

  if (status === "attending") {
    await recordCommunityAction(env, user.profileId, "event_rsvp", "event", eventId);
  }

  const currentCounts = await counts(env, eventId);
  return Response.json({
    status,
    attendee_count: currentCounts?.attendee_count ?? 0,
    waitlist_count: currentCounts?.waitlist_count ?? 0,
  });
};
