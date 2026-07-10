import type { Env } from "../../lib/env";
import { isContributor } from "../../lib/auth";
import { logActivity } from "../../lib/activity";
import { notifySlack } from "../../lib/slack";
import { recordCommunityAction } from "../../lib/community";

export const onRequestGet: PagesFunction<Env> = async ({ env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  const { results } = await env.DB.prepare(
    `SELECT e.*,
       SUM(CASE WHEN er.status = 'attending' THEN 1 ELSE 0 END) AS attendee_count,
       SUM(CASE WHEN er.status = 'waitlist' THEN 1 ELSE 0 END) AS waitlist_count,
       (SELECT mine.status FROM event_rsvps mine
        WHERE mine.event_id = e.id AND mine.profile_id = ?) AS my_rsvp
     FROM events e
     LEFT JOIN event_rsvps er ON er.event_id = e.id
     GROUP BY e.id
     ORDER BY e.start_time DESC`,
  ).bind(user?.profileId ?? -1).all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const profile = await env.DB.prepare(
    "SELECT auth_provider, is_admin FROM profiles WHERE id = ?",
  ).bind(user.profileId).first<{ auth_provider: string; is_admin: number }>();
  if (!isContributor(profile?.auth_provider ?? null, !!profile?.is_admin)) {
    return Response.json({ error: "Contributors only \u2014 sign in with GitHub" }, { status: 403 });
  }

  const body = await request.json<Record<string, unknown>>();
  const { title, description, category, start_time, location, capacity, allow_waitlist } = body;
  const parsedCapacity = capacity === null || capacity === undefined || capacity === ""
    ? null
    : Number(capacity);
  if (parsedCapacity !== null && (!Number.isInteger(parsedCapacity) || parsedCapacity < 1 || parsedCapacity > 5000)) {
    return Response.json({ error: "capacity must be between 1 and 5000" }, { status: 400 });
  }

  const result = await env.DB.prepare(
    `INSERT INTO events
       (title, description, category, start_time, location, organizer_id, capacity, allow_waitlist)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      title,
      description ?? null,
      category ?? null,
      start_time,
      location ?? null,
      user.profileId,
      parsedCapacity,
      allow_waitlist === false ? 0 : 1,
    )
    .run();

  await logActivity(env, "new_event", user.profileId, "event", result.meta.last_row_id as number, String(title));
  await recordCommunityAction(
    env,
    user.profileId,
    "event_created",
    "event",
    result.meta.last_row_id as number,
  );
  await notifySlack(env, `\u{1F4C5} New event: "${title}" at ${location ?? "TBD"}`);

  return Response.json({ id: result.meta.last_row_id }, { status: 201 });
};
