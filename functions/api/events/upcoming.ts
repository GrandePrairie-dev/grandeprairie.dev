import type { Env, UserContext } from "../../lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ env, data }) => {
  const user = (data as { user?: UserContext }).user;
  const { results } = await env.DB.prepare(
    `SELECT e.*,
       SUM(CASE WHEN er.status = 'attending' THEN 1 ELSE 0 END) AS attendee_count,
       SUM(CASE WHEN er.status = 'waitlist' THEN 1 ELSE 0 END) AS waitlist_count,
       (SELECT mine.status FROM event_rsvps mine
        WHERE mine.event_id = e.id AND mine.profile_id = ?) AS my_rsvp
     FROM events e
     LEFT JOIN event_rsvps er ON er.event_id = e.id
     WHERE e.start_time >= datetime('now')
     GROUP BY e.id
     ORDER BY e.start_time ASC`,
  ).bind(user?.profileId ?? -1).all();
  return Response.json(results);
};
