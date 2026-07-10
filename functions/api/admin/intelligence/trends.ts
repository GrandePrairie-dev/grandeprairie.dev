import type { Env, UserContext } from "../../../lib/env";
import { isAdminInDb } from "../../../lib/auth";
import { refreshTopicTrends } from "../../../lib/intelligence";

async function authorize(env: Env, data: unknown): Promise<boolean> {
  const user = (data as { user?: UserContext }).user;
  return Boolean(user && await isAdminInDb(env.DB, user.profileId));
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, data }) => {
  if (!await authorize(env, data)) return Response.json({ error: "Admin access required." }, { status: 403 });
  const requested = Number(new URL(request.url).searchParams.get("days") ?? 30);
  const days = Math.min(365, Math.max(1, Number.isFinite(requested) ? Math.round(requested) : 30));
  const { results } = await env.DB.prepare(
    `SELECT * FROM topic_trends WHERE period_days = ? ORDER BY period_start DESC, score DESC LIMIT 50`,
  ).bind(days).all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, data }) => {
  if (!await authorize(env, data)) return Response.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json<{ days?: number }>().catch(() => null);
  const count = await refreshTopicTrends(env, body?.days ?? 30);
  return Response.json({ updated: count });
};
