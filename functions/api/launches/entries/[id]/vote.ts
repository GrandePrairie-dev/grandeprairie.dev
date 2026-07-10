import type { Env } from "../../../../lib/env";
import { recordSignal } from "../../../../lib/intelligence";
import { getCurrentLaunchCycle, isLaunchCycleOpen } from "../../../../lib/launches";

export const onRequestPost: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const entryId = Number(params.id);
  if (!Number.isInteger(entryId)) return new Response("Invalid entry", { status: 400 });

  const cycle = await getCurrentLaunchCycle(env);
  if (!isLaunchCycleOpen(cycle)) return Response.json({ error: "Voting is closed" }, { status: 409 });

  const entry = await env.DB.prepare(
    `SELECT le.id, le.project_id, p.author_id, p.category
       FROM launch_entries le
       JOIN projects p ON p.id = le.project_id
      WHERE le.id = ? AND le.cycle_id = ?`,
  ).bind(entryId, cycle.id).first<{
    id: number;
    project_id: number;
    author_id: number | null;
    category: string | null;
  }>();
  if (!entry) return new Response("Not found", { status: 404 });
  if (entry.author_id === user.profileId) {
    return Response.json({ error: "You cannot support your own launch" }, { status: 409 });
  }

  const inserted = await env.DB.prepare(
    "INSERT OR IGNORE INTO launch_votes (entry_id, profile_id) VALUES (?, ?)",
  ).bind(entryId, user.profileId).run();
  if ((inserted.meta.changes ?? 0) === 0) {
    return Response.json({ error: "Already supported" }, { status: 409 });
  }

  await env.DB.prepare(
    "UPDATE launch_entries SET votes_count = votes_count + 1 WHERE id = ?",
  ).bind(entryId).run();
  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: "launch_vote",
    targetType: "project",
    targetId: entry.project_id,
    topic: entry.category ?? "community",
    source: "launch_board",
    outcome: "supported",
    dedupeKey: `launch-vote:${entryId}:${user.profileId}`,
  });

  return Response.json({ supported: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const entryId = Number(params.id);
  const cycle = await getCurrentLaunchCycle(env);
  if (!isLaunchCycleOpen(cycle)) return Response.json({ error: "Voting is closed" }, { status: 409 });

  const removed = await env.DB.prepare(
    `DELETE FROM launch_votes
      WHERE entry_id = ? AND profile_id = ?
        AND EXISTS (
          SELECT 1 FROM launch_entries
           WHERE id = ? AND cycle_id = ?
        )`,
  ).bind(entryId, user.profileId, entryId, cycle.id).run();
  if ((removed.meta.changes ?? 0) === 0) return new Response("Not found", { status: 404 });

  await env.DB.prepare(
    "UPDATE launch_entries SET votes_count = MAX(0, votes_count - 1) WHERE id = ?",
  ).bind(entryId).run();
  return Response.json({ supported: false });
};
