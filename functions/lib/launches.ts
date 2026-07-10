import type { Env } from "./env";

export interface LaunchCycleRow {
  id: number;
  slug: string;
  title: string;
  starts_at: string;
  ends_at: string;
}

function monthWindow(now = new Date()): Omit<LaunchCycleRow, "id"> {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const starts = new Date(Date.UTC(year, month, 1));
  const ends = new Date(Date.UTC(year, month + 1, 1));
  const monthLabel = new Intl.DateTimeFormat("en-CA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(starts);

  return {
    slug: `${year}-${String(month + 1).padStart(2, "0")}`,
    title: `${monthLabel} Launch Board`,
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
  };
}

export async function getCurrentLaunchCycle(env: Env, now = new Date()): Promise<LaunchCycleRow> {
  const window = monthWindow(now);
  await env.DB.prepare(
    `INSERT OR IGNORE INTO launch_cycles (slug, title, starts_at, ends_at)
     VALUES (?, ?, ?, ?)`,
  ).bind(window.slug, window.title, window.starts_at, window.ends_at).run();

  const cycle = await env.DB.prepare(
    "SELECT id, slug, title, starts_at, ends_at FROM launch_cycles WHERE slug = ?",
  ).bind(window.slug).first<LaunchCycleRow>();

  if (!cycle) throw new Error("Could not load current launch cycle");
  return cycle;
}

export function isLaunchCycleOpen(cycle: LaunchCycleRow, now = new Date()): boolean {
  const value = now.getTime();
  return value >= new Date(cycle.starts_at).getTime() && value < new Date(cycle.ends_at).getTime();
}
