import type { Env, UserContext } from "./env";

export function getSessionId(request: Request): string | null {
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(/gp-session=([^;]+)/);
  return match ? match[1] : null;
}

export async function getSession(request: Request, env: Env): Promise<UserContext | null> {
  const sessionId = getSessionId(request);
  if (!sessionId) return null;
  const data = await env.SESSIONS.get(`session:${sessionId}`, "json");
  if (!data) return null;
  return data as UserContext;
}

export async function createSession(
  env: Env,
  profileId: number,
  isAdmin: boolean,
  rememberMe: boolean = true,
): Promise<{ sessionId: string; maxAge: number }> {
  const sessionId = crypto.randomUUID();
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
  await env.SESSIONS.put(
    `session:${sessionId}`,
    JSON.stringify({ profileId, isAdmin, createdAt: new Date().toISOString() }),
    { expirationTtl: maxAge },
  );
  return { sessionId, maxAge };
}

export async function deleteSession(env: Env, sessionId: string): Promise<void> {
  await env.SESSIONS.delete(`session:${sessionId}`);
}

export function setSessionCookie(sessionId: string, maxAge: number): string {
  return `gp-session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return "gp-session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";
}

export async function isAdminInDb(db: D1Database, profileId: number): Promise<boolean> {
  const row = await db.prepare("SELECT is_admin FROM profiles WHERE id = ?")
    .bind(profileId).first<{ is_admin: number }>();
  return row?.is_admin === 1;
}

const SAFE_RETURN_PREFIXES = ["/", "/ideas", "/people", "/projects", "/map", "/calendar", "/intel", "/tech-hub", "/students", "/business", "/ai-hub", "/about", "/admin"];

export function validateReturnTo(returnTo: string | null): string {
  if (!returnTo) return "/";
  if (returnTo.includes("//") || returnTo.includes("\\")) return "/";
  if (!returnTo.startsWith("/")) return "/";
  const isAllowed = SAFE_RETURN_PREFIXES.some(
    prefix => returnTo === prefix || returnTo.startsWith(prefix + "/") || returnTo.startsWith(prefix + "?"),
  );
  return isAllowed ? returnTo : "/";
}
