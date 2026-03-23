import type { Env } from "../../../../lib/env";
import { isAdminInDb } from "../../../../lib/auth";

export const onRequestPost: PagesFunction<Env> = async ({ params, env, request, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!(await isAdminInDb(env.DB, user.profileId))) return new Response("Forbidden", { status: 403 });

  const body = await request.json<{ profile_id: number; title?: string }>();
  if (!body.profile_id) return Response.json({ error: "profile_id required" }, { status: 400 });

  await env.DB.prepare(
    "INSERT OR IGNORE INTO organization_members (organization_id, profile_id, title) VALUES (?, ?, ?)"
  ).bind(params.id, body.profile_id, body.title ?? null).run();

  return Response.json({ success: true }, { status: 201 });
};
