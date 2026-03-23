import type { Env } from "../../../lib/env";

export const onRequestPost: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const ideaId = Number(params.id);

  // Check for existing vote
  const existing = await env.DB.prepare(
    "SELECT id FROM idea_votes WHERE idea_id = ? AND profile_id = ?",
  ).bind(ideaId, user.profileId).first();

  if (existing) {
    return Response.json({ error: "Already voted" }, { status: 409 });
  }

  // Insert vote and increment count
  await env.DB.batch([
    env.DB.prepare("INSERT INTO idea_votes (idea_id, profile_id) VALUES (?, ?)").bind(ideaId, user.profileId),
    env.DB.prepare("UPDATE ideas SET votes = votes + 1 WHERE id = ?").bind(ideaId),
  ]);

  const idea = await env.DB.prepare("SELECT * FROM ideas WHERE id = ?").bind(ideaId).first();
  return Response.json(idea);
};
