import type { Env } from "../../../lib/env";
import { isAdminInDb } from "../../../lib/auth";

export const onRequestDelete: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!(await isAdminInDb(env.DB, user.profileId))) return new Response("Forbidden", { status: 403 });

  await env.DB.prepare("DELETE FROM events WHERE id = ?").bind(params.id).run();
  return Response.json({ success: true });
};
