import type { Env } from "../../../lib/env";
import { validateReturnTo } from "../../../lib/auth";
import { sendMagicLink } from "../../../lib/email";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json<{ email?: string; return_to?: string }>();
  const email = body.email?.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ message: "If an account exists, we sent a link." });
  }

  const returnTo = validateReturnTo(body.return_to ?? null);

  // Rate limit by email: 3 per hour
  const emailKey = `email-rate:${email}`;
  const emailCount = parseInt(await env.SESSIONS.get(emailKey) ?? "0", 10);
  if (emailCount >= 3) {
    // Silent success (anti-enumeration)
    return Response.json({ message: "If an account exists, we sent a link." });
  }

  // Rate limit by IP: 10 per hour
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const ipKey = `email-rate-ip:${ip}`;
  const ipCount = parseInt(await env.SESSIONS.get(ipKey) ?? "0", 10);
  if (ipCount >= 10) {
    return Response.json({ message: "If an account exists, we sent a link." });
  }

  // Generate token and store with 15-min TTL
  const token = crypto.randomUUID();
  await env.SESSIONS.put(
    `email-login:${token}`,
    JSON.stringify({ email, returnTo }),
    { expirationTtl: 900 },
  );

  // Update rate limits (1-hour TTL)
  await env.SESSIONS.put(emailKey, String(emailCount + 1), { expirationTtl: 3600 });
  await env.SESSIONS.put(ipKey, String(ipCount + 1), { expirationTtl: 3600 });

  // Send the magic link
  await sendMagicLink(env, email, token);

  return Response.json({ message: "If an account exists, we sent a link." });
};
