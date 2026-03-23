import type { Env } from "./env";

export async function logActivity(
  env: Env,
  type: string,
  profileId: number,
  targetType: string | null,
  targetId: number | null,
  summary: string,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO activity (type, profile_id, target_type, target_id, summary)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(type, profileId, targetType, targetId, summary).run();
}
