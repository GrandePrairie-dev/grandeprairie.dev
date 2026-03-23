import type { Env } from "../../../../lib/env";

export const onRequestDelete: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  await env.DB.prepare(
    "DELETE FROM business_request_interests WHERE business_request_id = ? AND profile_id = ?"
  ).bind(params.id, user.profileId).run();

  return Response.json({ success: true });
};
