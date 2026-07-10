import type { Env } from "../../../../lib/env";
import { recordSignal, upsertRelationship } from "../../../../lib/intelligence";

export const onRequestDelete: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return new Response("Unauthorized", { status: 401 });

  const requestId = Number(params.id);
  const existing = await env.DB.prepare(
    `SELECT bri.id, br.category FROM business_request_interests bri
     JOIN business_requests br ON br.id = bri.business_request_id
     WHERE bri.business_request_id = ? AND bri.profile_id = ?`,
  ).bind(requestId, user.profileId).first<{ id: number; category: string }>();
  if (!existing) return Response.json({ error: "Interest not found." }, { status: 404 });

  await env.DB.prepare(
    "DELETE FROM business_request_interests WHERE business_request_id = ? AND profile_id = ?"
  ).bind(requestId, user.profileId).run();

  await recordSignal(env, {
    actorProfileId: user.profileId,
    signalType: "business_interest",
    targetType: "business_request",
    targetId: requestId,
    topic: existing.category,
    source: "opportunity",
    outcome: "withdrawn",
  });
  await upsertRelationship(env, {
    sourceType: "profile",
    sourceId: user.profileId,
    targetType: "business_request",
    targetId: requestId,
    relationshipType: "expressed_interest",
    status: "inactive",
    provenance: "business_request_interests",
  });

  return Response.json({ success: true });
};
