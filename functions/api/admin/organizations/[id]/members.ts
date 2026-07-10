import type { Env } from "../../../../lib/env";
import { isAdminInDb } from "../../../../lib/auth";
import { recordSignal, upsertRelationship } from "../../../../lib/intelligence";

export const onRequestPost: PagesFunction<Env> = async ({ params, env, request, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!(await isAdminInDb(env.DB, user.profileId))) return new Response("Forbidden", { status: 403 });

  const body = await request.json<{ profile_id: number; title?: string }>();
  if (!body.profile_id) return Response.json({ error: "profile_id required" }, { status: 400 });

  await env.DB.prepare(
    "INSERT OR IGNORE INTO organization_members (organization_id, profile_id, title) VALUES (?, ?, ?)"
  ).bind(params.id, body.profile_id, body.title ?? null).run();

  await upsertRelationship(env, {
    sourceType: "profile",
    sourceId: body.profile_id,
    targetType: "organization",
    targetId: String(params.id),
    relationshipType: "member",
    status: "active",
    provenance: "organization_members",
    metadata: { title: body.title ?? null },
  });
  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: "organization_member_added",
    targetType: "organization",
    targetId: String(params.id),
    topic: "organizations",
    source: "admin",
    outcome: "added",
    metadata: { profile_id: body.profile_id },
  });

  return Response.json({ success: true }, { status: 201 });
};
