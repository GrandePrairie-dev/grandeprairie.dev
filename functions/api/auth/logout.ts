import type { Env } from "../../lib/env";
import { getSessionId, deleteSession, clearSessionCookie } from "../../lib/auth";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const sessionId = getSessionId(request);
  if (sessionId) {
    await deleteSession(env, sessionId);
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie": clearSessionCookie(),
    },
  });
};
