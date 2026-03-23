# Phase 2: Activity Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add GitHub OAuth authentication, KV session management, admin moderation tools, profile editing, authenticated voting, activity feed, and Slack webhooks — transforming the platform from a public showcase into a real community.

**Architecture:** GitHub OAuth flow via Cloudflare Pages Functions, KV-backed sessions with HttpOnly cookies, D1 schema migrations for auth columns + vote dedup + activity log. Middleware attaches user context to all API requests. Write endpoints enforced as authenticated or admin-only. Frontend `useAuth` hook drives conditional UI.

**Tech Stack:** Cloudflare Pages Functions, Workers KV (sessions), D1 (SQLite), GitHub OAuth API, React 19 + TanStack Query, wouter

**Spec:** `docs/superpowers/specs/2026-03-22-phase2-activity-layer.md`

---

## File Structure

### New files (Sub-project A: Auth)
- `db/migrations/001-add-github-auth.sql` — github_id, github_username columns
- `functions/api/_middleware.ts` — session middleware for all API routes
- `functions/api/auth/login.ts` — GitHub OAuth redirect
- `functions/api/auth/callback.ts` — OAuth callback, session creation
- `functions/api/auth/logout.ts` — session deletion
- `functions/api/auth/me.ts` — current user endpoint
- `functions/lib/auth.ts` — shared auth helpers (getSession, requireAuth, requireAdmin)
- `functions/lib/env.ts` — shared Env interface
- `src/hooks/useAuth.ts` — auth state hook
- `src/components/ProfileBanner.tsx` — profile completion nudge

### New files (Sub-project B: Content Ops)
- `functions/api/admin/profiles/[id].ts` — admin profile management
- `functions/api/admin/ideas/[id].ts` — admin idea management
- `functions/api/admin/intel/[id].ts` — admin intel management
- `functions/api/admin/events/[id].ts` — admin event deletion

### New files (Sub-project C: Engagement)
- `db/migrations/002-add-votes-activity.sql` — idea_votes + activity tables
- `functions/api/profiles/[id]/edit.ts` — profile editing (owner only)
- `functions/api/activity.ts` — activity feed
- `functions/lib/activity.ts` — activity logging helper
- `functions/lib/slack.ts` — Slack webhook helper
- `src/pages/EditProfile.tsx` — profile edit form

### Modified files
- `wrangler.toml` — add GITHUB_CLIENT_ID var
- `functions/api/ideas.ts` — auth on POST, author_id from session
- `functions/api/ideas/[id]/vote.ts` — auth + D1 dedup
- `functions/api/comments.ts` — auth on POST, author_id from session
- `functions/api/events/index.ts` — auth on POST, organizer_id from session
- `functions/api/intel.ts` — admin only on POST
- `functions/api/business-requests/[id]/status.ts` — admin only
- `functions/api/profiles.ts` — remove POST (profiles via OAuth only)
- `src/components/Sidebar.tsx` — auth-aware footer (login/user)
- `src/components/VoteButton.tsx` — auth-aware voting
- `src/components/CommentThread.tsx` — auth-aware commenting
- `src/pages/Ideas.tsx` — auth gate on submit
- `src/pages/Calendar.tsx` — auth gate on add event
- `src/pages/Home.tsx` — add activity feed section
- `src/pages/Admin.tsx` — add moderation controls
- `src/App.tsx` — add ProfileBanner, EditProfile route
- `db/seed.sql` — remove mock profiles, update author_id refs

---

## Sub-project A: Authentication & Identity

### Task 1: DB migration for GitHub auth columns

**Files:**
- Create: `db/migrations/001-add-github-auth.sql`
- Create: `functions/lib/env.ts`

- [ ] **Step 1: Create migration file**

Create `db/migrations/001-add-github-auth.sql`:
```sql
ALTER TABLE profiles ADD COLUMN github_id TEXT;
ALTER TABLE profiles ADD COLUMN github_username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_github_id ON profiles(github_id);
```

- [ ] **Step 2: Create shared Env interface**

Create `functions/lib/env.ts`:
```typescript
export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  SLACK_WEBHOOK_URL?: string;
  SITE_URL: string;
}

export interface UserContext {
  profileId: number;
  isAdmin: boolean;
}
```

- [ ] **Step 3: Commit**

```bash
git add db/migrations/001-add-github-auth.sql functions/lib/env.ts
git commit -m "feat: DB migration for GitHub auth columns + shared Env type"
```

---

### Task 2: Auth helpers — session read/write, auth enforcement

**Files:**
- Create: `functions/lib/auth.ts`

- [ ] **Step 1: Create auth helper module**

Create `functions/lib/auth.ts`:
```typescript
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
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 24h

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
  // Block external URLs and protocol-relative URLs
  if (returnTo.includes("//") || returnTo.includes("\\")) return "/";
  if (!returnTo.startsWith("/")) return "/";
  // Check prefix allowlist
  const isAllowed = SAFE_RETURN_PREFIXES.some(
    prefix => returnTo === prefix || returnTo.startsWith(prefix + "/") || returnTo.startsWith(prefix + "?"),
  );
  return isAllowed ? returnTo : "/";
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/lib/auth.ts
git commit -m "feat: auth helpers — session CRUD, admin check, return URL validation"
```

---

### Task 3: API middleware — attach user context to all requests

**Files:**
- Create: `functions/api/_middleware.ts`

- [ ] **Step 1: Create middleware**

Create `functions/api/_middleware.ts`:
```typescript
import { getSession } from "../lib/auth";
import type { Env } from "../lib/env";

export const onRequest: PagesFunction<Env> = async (context) => {
  const user = await getSession(context.request, context.env);
  context.data.user = user;
  return context.next();
};
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Note: existing endpoint files declare their own `interface Env` locally. The middleware adds `context.data.user`. Existing endpoints will continue to work — they just ignore `context.data`. As we modify endpoints in later tasks, we'll import the shared Env.

- [ ] **Step 3: Commit**

```bash
git add functions/api/_middleware.ts
git commit -m "feat: API middleware attaches user session to all requests"
```

---

### Task 4: OAuth endpoints — login, callback, logout, me

**Files:**
- Create: `functions/api/auth/login.ts`
- Create: `functions/api/auth/callback.ts`
- Create: `functions/api/auth/logout.ts`
- Create: `functions/api/auth/me.ts`

- [ ] **Step 1: Create login endpoint**

`functions/api/auth/login.ts`:
```typescript
import type { Env } from "../../lib/env";
import { validateReturnTo } from "../../lib/auth";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const remember = url.searchParams.get("remember") !== "false";
  const returnTo = validateReturnTo(url.searchParams.get("return_to"));

  const state = crypto.randomUUID();
  await env.SESSIONS.put(
    `oauth-state:${state}`,
    JSON.stringify({ returnTo, remember }),
    { expirationTtl: 600 },
  );

  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${env.SITE_URL}/api/auth/callback`,
    scope: "read:user",
    state,
  });

  return Response.redirect(`https://github.com/login/oauth/authorize?${params}`, 302);
};
```

- [ ] **Step 2: Create callback endpoint**

`functions/api/auth/callback.ts`:
```typescript
import type { Env } from "../../lib/env";
import { createSession, setSessionCookie } from "../../lib/auth";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 });
  }

  // Validate CSRF state
  const stateData = await env.SESSIONS.get(`oauth-state:${state}`, "json") as
    { returnTo: string; remember: boolean } | null;
  if (!stateData) {
    return new Response("Invalid or expired state", { status: 400 });
  }
  await env.SESSIONS.delete(`oauth-state:${state}`);

  // Exchange code for access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const tokenData = await tokenRes.json<{ access_token?: string; error?: string }>();
  if (!tokenData.access_token) {
    return new Response(`OAuth error: ${tokenData.error ?? "no token"}`, { status: 400 });
  }

  // Fetch GitHub user profile
  const ghRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/json",
      "User-Agent": "GrandePrairie.dev",
    },
  });
  const ghUser = await ghRes.json<{
    id: number; login: string; name: string | null; avatar_url: string;
  }>();

  const githubId = String(ghUser.id);

  // Find or create profile
  let profile = await env.DB.prepare(
    "SELECT id, is_admin FROM profiles WHERE github_id = ?",
  ).bind(githubId).first<{ id: number; is_admin: number }>();

  if (profile) {
    // Update avatar and username if changed
    await env.DB.prepare(
      "UPDATE profiles SET avatar_url = ?, github_username = ?, updated_at = datetime('now') WHERE id = ?",
    ).bind(ghUser.avatar_url, ghUser.login, profile.id).run();
  } else {
    // Check username collision
    let username = ghUser.login;
    const existing = await env.DB.prepare(
      "SELECT id FROM profiles WHERE username = ?",
    ).bind(username).first();
    if (existing) {
      username = `${ghUser.login}-${githubId.slice(-4)}`;
    }

    const result = await env.DB.prepare(
      `INSERT INTO profiles (name, username, avatar_url, github_id, github_username, role)
       VALUES (?, ?, ?, ?, ?, 'member')`,
    ).bind(
      ghUser.name ?? ghUser.login,
      username,
      ghUser.avatar_url,
      githubId,
      ghUser.login,
    ).run();

    profile = { id: result.meta.last_row_id as number, is_admin: 0 };
  }

  // Create session
  const { sessionId, maxAge } = await createSession(
    env, profile.id, !!profile.is_admin, stateData.remember,
  );

  // Redirect with session cookie
  return new Response(null, {
    status: 302,
    headers: {
      Location: stateData.returnTo || "/",
      "Set-Cookie": setSessionCookie(sessionId, maxAge),
    },
  });
};
```

- [ ] **Step 3: Create logout endpoint**

`functions/api/auth/logout.ts`:
```typescript
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
```

- [ ] **Step 4: Create me endpoint**

`functions/api/auth/me.ts`:
```typescript
import type { Env } from "../../lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ data, env }) => {
  const user = (data as { user?: { profileId: number } }).user;
  if (!user) return Response.json(null);

  const profile = await env.DB.prepare(
    "SELECT id, name, username, title, bio, role, skills, badges, links, avatar_url, is_admin, is_featured FROM profiles WHERE id = ?",
  ).bind(user.profileId).first();

  return Response.json(profile ?? null);
};
```

- [ ] **Step 5: Add GITHUB_CLIENT_ID to wrangler.toml**

Add under `[vars]`:
```toml
GITHUB_CLIENT_ID = ""
```
(Actual value set after GitHub OAuth app is created)

- [ ] **Step 6: Build check and commit**

```bash
npm run build
git add functions/api/auth/ wrangler.toml
git commit -m "feat: GitHub OAuth endpoints — login, callback, logout, me"
```

---

### Task 5: Frontend useAuth hook + sidebar auth UI

**Files:**
- Create: `src/hooks/useAuth.ts`
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Create useAuth hook**

`src/hooks/useAuth.ts`:
```typescript
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Profile } from "@/lib/types";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<Profile | null>({
    queryKey: ["/api/auth/me"],
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const isLoggedIn = !!user;
  const isAdmin = !!user?.is_admin;

  const login = (returnTo?: string) => {
    const params = new URLSearchParams();
    if (returnTo) params.set("return_to", returnTo);
    window.location.href = `/api/auth/login?${params}`;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.clear();
    window.location.href = "/";
  };

  return { user, isLoggedIn, isAdmin, isLoading, login, logout };
}
```

- [ ] **Step 2: Update Sidebar to use auth**

Modify `src/components/Sidebar.tsx`:
- Import `useAuth` and `Github` icon from lucide-react
- Replace the hardcoded "CJ / CJ Elliott / Founder" footer with:
  - If `isLoggedIn`: show `user.avatar_url` (or initials), `user.name`, `user.role`
  - If not logged in: show "Sign in with GitHub" button that calls `login()`
- Pass `useAuth` data through props or call the hook directly inside `SidebarContent`

The Sidebar currently receives `theme` and `toggleTheme` as props. Add auth to the props interface or call `useAuth()` inside `SidebarContent` directly (simpler — hook is lightweight).

- [ ] **Step 3: Build check and commit**

```bash
npm run build
git add src/hooks/useAuth.ts src/components/Sidebar.tsx
git commit -m "feat: useAuth hook + auth-aware sidebar with GitHub login"
```

---

### Task 6: Auth-gate write endpoints

**Files:**
- Modify: `functions/api/ideas.ts`
- Modify: `functions/api/comments.ts`
- Modify: `functions/api/events/index.ts`
- Modify: `functions/api/intel.ts`
- Modify: `functions/api/business-requests/[id]/status.ts`
- Modify: `functions/api/profiles.ts`

- [ ] **Step 1: Update ideas POST — require auth, author_id from session**

Modify `functions/api/ideas.ts` `onRequestPost`:
- Read `context.data.user`; return 401 if null
- Use `user.profileId` as `author_id` instead of client-supplied value
- Keep GET public

- [ ] **Step 2: Update comments POST — require auth, author_id from session**

Modify `functions/api/comments.ts` `onRequestPost`:
- Read `context.data.user`; return 401 if null
- Use `user.profileId` as `author_id`
- Keep GET public

- [ ] **Step 3: Update events POST — require auth, organizer_id from session**

Modify `functions/api/events/index.ts` `onRequestPost`:
- Read `context.data.user`; return 401 if null
- Use `user.profileId` as `organizer_id`
- Keep GET public

- [ ] **Step 4: Update intel POST — require admin**

Modify `functions/api/intel.ts` `onRequestPost`:
- Read `context.data.user`; return 401 if null
- Check `isAdminInDb(env.DB, user.profileId)`; return 403 if not admin
- Keep GET public

- [ ] **Step 5: Update business-requests status PATCH — require admin**

Modify `functions/api/business-requests/[id]/status.ts`:
- Read `context.data.user`; return 401 if null
- Check `isAdminInDb`; return 403 if not admin

- [ ] **Step 6: Remove profiles POST**

Modify `functions/api/profiles.ts`:
- Remove `onRequestPost` — profiles are created only via OAuth callback
- Keep `onRequestGet`

- [ ] **Step 7: Build check and commit**

```bash
npm run build
git add functions/api/ideas.ts functions/api/comments.ts functions/api/events/index.ts functions/api/intel.ts functions/api/business-requests/ functions/api/profiles.ts
git commit -m "feat: auth-gate all write endpoints, admin enforcement, remove profile POST"
```

---

### Task 7: Auth-aware frontend — submit gates, comment login prompt

**Files:**
- Modify: `src/pages/Ideas.tsx`
- Modify: `src/pages/Calendar.tsx`
- Modify: `src/components/CommentThread.tsx`
- Modify: `src/components/VoteButton.tsx`
- Create: `src/components/ProfileBanner.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Update Ideas page — hide submit when not logged in**

Modify `src/pages/Ideas.tsx`:
- Import `useAuth`
- If not logged in: "Submit Idea" button calls `login("/ideas")` instead of opening dialog
- If logged in: existing dialog behavior

- [ ] **Step 2: Update Calendar page — same pattern**

Modify `src/pages/Calendar.tsx`:
- Import `useAuth`
- If not logged in: "Add Event" button calls `login("/calendar")`

- [ ] **Step 3: Update CommentThread — show login prompt when not authed**

Modify `src/components/CommentThread.tsx`:
- Import `useAuth`
- If not logged in: replace the form with "Sign in to comment" button
- If logged in: existing form (no longer needs hardcoded author_id)

- [ ] **Step 4: Update VoteButton — require auth**

Modify `src/components/VoteButton.tsx`:
- Import `useAuth`
- If not logged in: click calls `login()` with current path
- If logged in: existing vote behavior (session Set still works as UX layer, D1 dedup comes in Sub-project C)

- [ ] **Step 5: Create ProfileBanner**

Create `src/components/ProfileBanner.tsx`:
```typescript
import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { parseJsonArray, parseJsonObject } from "@/lib/types";

export function ProfileBanner() {
  const { user, isLoggedIn } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!isLoggedIn || !user || dismissed) return null;

  const skills = parseJsonArray(user.skills);
  const links = parseJsonObject(user.links);
  const isIncomplete = !user.title || !user.bio || skills.length === 0 || Object.keys(links).length === 0;

  if (!isIncomplete) return null;

  return (
    <div className="mx-4 mt-4 p-3 rounded-md bg-prairie-amber/10 border border-prairie-amber/20 flex items-center justify-between gap-3">
      <p className="text-sm text-prairie-amber">
        <Link href={`/people/${user.id}/edit`}>
          <span className="font-semibold underline cursor-pointer">Complete your profile</span>
        </Link>
        {" — add your skills, bio, and links so the community can find you."}
      </p>
      <Button variant="ghost" size="icon" className="shrink-0 h-6 w-6" onClick={() => setDismissed(true)}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 6: Add ProfileBanner to App.tsx**

Modify `src/App.tsx`:
- Import `ProfileBanner`
- Render `<ProfileBanner />` inside the main content area, before `<Switch>`

- [ ] **Step 7: Build check and commit**

```bash
npm run build
git add src/pages/Ideas.tsx src/pages/Calendar.tsx src/components/CommentThread.tsx src/components/VoteButton.tsx src/components/ProfileBanner.tsx src/App.tsx
git commit -m "feat: auth-aware UI — login gates, profile banner, vote/comment auth"
```

---

## Sub-project B: Content Operations

### Task 8: Admin moderation API endpoints

**Files:**
- Create: `functions/api/admin/ideas/[id].ts`
- Create: `functions/api/admin/profiles/[id].ts`
- Create: `functions/api/admin/intel/[id].ts`
- Create: `functions/api/admin/events/[id].ts`
- Create: `functions/api/admin/comments/[id].ts`

- [ ] **Step 1: Create admin ideas endpoint**

`functions/api/admin/ideas/[id].ts`:
```typescript
import type { Env } from "../../../lib/env";
import { isAdminInDb } from "../../../lib/auth";

export const onRequestPatch: PagesFunction<Env> = async ({ params, env, data }) => {
  const user = (data as any).user;
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!(await isAdminInDb(env.DB, user.profileId))) return new Response("Forbidden", { status: 403 });

  const body = await (data as any).request?.json?.() ??
    await new Response((data as any).request?.body).json();
  // Actually we need the request from context:
  // This needs adjustment — see step implementation
  const updates: string[] = [];
  const values: unknown[] = [];

  if ("is_featured" in body) { updates.push("is_featured = ?"); values.push(body.is_featured); }
  if ("status" in body) {
    const valid = ["open", "closed", "promoted"];
    if (!valid.includes(body.status)) return Response.json({ error: "Invalid status" }, { status: 400 });
    updates.push("status = ?"); values.push(body.status);
  }

  if (updates.length === 0) return Response.json({ error: "No valid fields" }, { status: 400 });

  values.push(params.id);
  await env.DB.prepare(`UPDATE ideas SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  return Response.json({ success: true });
};
```

Pattern repeats for profiles, intel, events (DELETE), comments (DELETE — admin or owner).

- [ ] **Step 2: Create remaining admin endpoints**

Same pattern for:
- `functions/api/admin/profiles/[id].ts` — PATCH is_featured, is_admin
- `functions/api/admin/intel/[id].ts` — PATCH is_pinned, is_featured
- `functions/api/admin/events/[id].ts` — DELETE
- `functions/api/admin/comments/[id].ts` — DELETE (check admin OR comment author)

- [ ] **Step 3: Build check and commit**

```bash
npm run build
git add functions/api/admin/
git commit -m "feat: admin moderation endpoints — ideas, profiles, intel, events, comments"
```

---

### Task 9: Admin panel UI — moderation controls

**Files:**
- Modify: `src/pages/Admin.tsx`

- [ ] **Step 1: Add toggle buttons to Admin page**

Read current `src/pages/Admin.tsx` first. Add:

**Ideas tab:** For each idea row, add:
- Toggle Featured button: calls `PATCH /api/admin/ideas/:id` with `{ is_featured: toggle }`
- Status select or buttons: open / closed / promoted
- "Promote to Project" button (simple: navigates to `/projects/new?from_idea=:id` — or inline dialog)

**Profiles tab:** For each profile row, add:
- Toggle Featured button
- Toggle Admin button (with confirmation)

**Intel tab:** For each intel row, add:
- Toggle Pinned button
- Toggle Featured button

**Events tab:** For each event row, add:
- Delete button (with confirmation)

**All mutations:** Use `useMutation` + `queryClient.invalidateQueries` pattern already established.

- [ ] **Step 2: Add useAuth guard to Admin page**

Import `useAuth`. If not admin, show "Access denied" message instead of admin content. This is a UI-level guard — Cloudflare Access is the real gate.

- [ ] **Step 3: Build check and commit**

```bash
npm run build
git add src/pages/Admin.tsx
git commit -m "feat: admin panel moderation controls — feature, pin, delete, promote"
```

---

## Sub-project C: Community Engagement

### Task 10: DB migration for votes + activity

**Files:**
- Create: `db/migrations/002-add-votes-activity.sql`

- [ ] **Step 1: Create migration**

`db/migrations/002-add-votes-activity.sql`:
```sql
CREATE TABLE IF NOT EXISTS idea_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idea_id INTEGER NOT NULL REFERENCES ideas(id),
  profile_id INTEGER NOT NULL REFERENCES profiles(id),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(idea_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_idea_votes_idea ON idea_votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_votes_profile ON idea_votes(profile_id);

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  profile_id INTEGER REFERENCES profiles(id),
  target_type TEXT,
  target_id INTEGER,
  summary TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at);
```

- [ ] **Step 2: Commit**

```bash
git add db/migrations/002-add-votes-activity.sql
git commit -m "feat: DB migration for idea_votes dedup + activity feed"
```

---

### Task 11: Authenticated voting with D1 dedup

**Files:**
- Modify: `functions/api/ideas/[id]/vote.ts`
- Modify: `src/components/VoteButton.tsx`

- [ ] **Step 1: Update vote API endpoint**

Modify `functions/api/ideas/[id]/vote.ts`:
- Require auth
- Check `idea_votes` for existing vote: `SELECT id FROM idea_votes WHERE idea_id = ? AND profile_id = ?`
- If exists: return 409
- If not: INSERT into `idea_votes`, UPDATE ideas SET votes = votes + 1
- Return updated idea

- [ ] **Step 2: Update VoteButton frontend**

Modify `src/components/VoteButton.tsx`:
- Handle 409 response (already voted) — set `hasVoted = true`
- Remove session-level `Set` (D1 is now the source of truth)
- On mount: could check if user has voted via response data (optional: add `voted` field to idea queries later)

- [ ] **Step 3: Commit**

```bash
git add functions/api/ideas/[id]/vote.ts src/components/VoteButton.tsx
git commit -m "feat: D1-backed vote deduplication, replace session Set"
```

---

### Task 12: Profile editing

**Files:**
- Create: `functions/api/profiles/[id]/edit.ts`
- Create: `src/pages/EditProfile.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/PersonProfile.tsx`

- [ ] **Step 1: Create profile edit API endpoint**

`functions/api/profiles/[id]/edit.ts`:
- PATCH handler
- Require auth; verify `user.profileId === Number(params.id)` (owner only) — return 403 otherwise
- Accept: name, title, bio, role, skills (JSON array string), links (JSON object string)
- Validate role against ROLES constant
- UPDATE profiles SET ... WHERE id = ?

- [ ] **Step 2: Create EditProfile page**

`src/pages/EditProfile.tsx`:
- Fetch current profile via `/api/profiles/:id`
- Form with: name, title, bio, role (select), skills (comma-separated input → JSON), links (github/linkedin/website inputs)
- Submit via PATCH to `/api/profiles/:id/edit`
- On success: invalidate queries, navigate to `/people/:id`
- Back link to profile page

- [ ] **Step 3: Add route and edit link**

Modify `src/App.tsx`: add `<Route path="/people/:id/edit" component={EditProfile} />`
Modify `src/pages/PersonProfile.tsx`: if viewing own profile (useAuth), show "Edit Profile" button

- [ ] **Step 4: Build check and commit**

```bash
npm run build
git add functions/api/profiles/[id]/edit.ts src/pages/EditProfile.tsx src/App.tsx src/pages/PersonProfile.tsx
git commit -m "feat: profile editing — owner-only PATCH endpoint + edit form"
```

---

### Task 13: Activity feed + helpers

**Files:**
- Create: `functions/lib/activity.ts`
- Create: `functions/api/activity.ts`
- Modify: `src/pages/Home.tsx`
- Modify: `functions/api/auth/callback.ts` (add new_member activity)
- Modify: `functions/api/ideas.ts` (add new_idea activity)
- Modify: `functions/api/events/index.ts` (add new_event activity)

- [ ] **Step 1: Create activity helper**

`functions/lib/activity.ts`:
```typescript
import type { Env } from "./env";

export async function logActivity(
  env: Env,
  type: string,
  profileId: number,
  targetType: string | null,
  targetId: number | null,
  summary: string,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO activity (type, profile_id, target_type, target_id, summary)
     VALUES (?, ?, ?, ?, ?)`,
  ).bind(type, profileId, targetType, targetId, summary).run();
}
```

- [ ] **Step 2: Create activity API endpoint**

`functions/api/activity.ts`:
```typescript
import type { Env } from "../lib/env";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 10), 50);

  const { results } = await env.DB.prepare(
    `SELECT a.*, p.name as profile_name, p.avatar_url
     FROM activity a LEFT JOIN profiles p ON a.profile_id = p.id
     ORDER BY a.created_at DESC LIMIT ?`,
  ).bind(limit).all();

  return Response.json(results);
};
```

- [ ] **Step 3: Add activity logging to key endpoints**

- OAuth callback: after profile create → `logActivity(env, "new_member", profileId, "profile", profileId, "${name} joined the community")`
- Ideas POST: after insert → `logActivity(env, "new_idea", user.profileId, "idea", ideaId, "${title}")`
- Events POST: after insert → `logActivity(env, "new_event", user.profileId, "event", eventId, "${title}")`

- [ ] **Step 4: Add activity section to Home page**

Modify `src/pages/Home.tsx`:
- Fetch `/api/activity?limit=5`
- Render "Recent Activity" section between featured content and quick links
- Each item: icon by type (UserPlus, Lightbulb, Calendar, MessageSquare), profile name, summary, relative time

- [ ] **Step 5: Commit**

```bash
npm run build
git add functions/lib/activity.ts functions/api/activity.ts functions/api/auth/callback.ts functions/api/ideas.ts functions/api/events/index.ts src/pages/Home.tsx
git commit -m "feat: activity feed — logging helper, API endpoint, home page section"
```

---

### Task 14: Slack webhook integration

**Files:**
- Create: `functions/lib/slack.ts`
- Modify: `functions/api/auth/callback.ts`
- Modify: `functions/api/ideas.ts`
- Modify: `functions/api/business-requests/index.ts`
- Modify: `functions/api/events/index.ts`

- [ ] **Step 1: Create Slack helper**

`functions/lib/slack.ts`:
```typescript
import type { Env } from "./env";

export async function notifySlack(env: Env, text: string): Promise<void> {
  if (!env.SLACK_WEBHOOK_URL) return;
  try {
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    console.error("Slack webhook failed (non-blocking)");
  }
}
```

- [ ] **Step 2: Add webhook calls to endpoints**

After successful DB writes in each endpoint:
- OAuth callback (new member): `notifySlack(env, "🆕 New member: ${name} (${role}) joined GrandePrairie.dev")`
- Ideas POST: `notifySlack(env, "💡 New idea: \"${title}\" submitted by ${name}")`
- Business requests POST: `notifySlack(env, "🏢 New business request from ${businessName} (${category})")`
- Events POST: `notifySlack(env, "📅 New event: \"${title}\" at ${location}")`

- [ ] **Step 3: Commit**

```bash
npm run build
git add functions/lib/slack.ts functions/api/auth/callback.ts functions/api/ideas.ts functions/api/business-requests/index.ts functions/api/events/index.ts
git commit -m "feat: Slack webhook notifications for new members, ideas, requests, events"
```

---

### Task 15: Seed data migration + deploy

**Files:**
- Modify: `db/seed.sql`

- [ ] **Step 1: Update seed data — remove mock profiles, null author refs**

Modify `db/seed.sql`:
- Remove ALL profile INSERT statements (real profiles come from GitHub OAuth)
- Update all `author_id` references in ideas, events, intel to `NULL`
- Update `organizer_id` references in events to `NULL`
- Keep ideas, events, intel, business requests, student resources content

- [ ] **Step 2: Create GitHub OAuth App**

Manual step — do this in GitHub Settings:
- App name: `GrandePrairie.dev`
- Homepage URL: `https://grandeprairie.dev`
- Callback URL: `https://grandeprairie.dev/api/auth/callback`
- Copy Client ID and Client Secret

- [ ] **Step 3: Configure secrets**

```bash
# Set wrangler vars
# Edit wrangler.toml: set GITHUB_CLIENT_ID = "Ov23li..."

# Set wrangler secrets
wrangler secret put GITHUB_CLIENT_SECRET
# paste secret when prompted

# Optional: Slack webhook
wrangler secret put SLACK_WEBHOOK_URL
# paste webhook URL when prompted
```

- [ ] **Step 4: Run migrations on remote D1**

```bash
wrangler d1 execute grandeprairie-dev-db --file=db/migrations/001-add-github-auth.sql --remote
wrangler d1 execute grandeprairie-dev-db --file=db/migrations/002-add-votes-activity.sql --remote
```

- [ ] **Step 5: Clear mock profiles and re-seed**

```bash
# Clear mock profiles (cascade will fail on FK — null out refs first)
wrangler d1 execute grandeprairie-dev-db --command="UPDATE ideas SET author_id = NULL; UPDATE events SET organizer_id = NULL; UPDATE intel SET author_id = NULL; DELETE FROM profiles;" --remote

# Re-seed content (updated seed.sql without profiles)
wrangler d1 execute grandeprairie-dev-db --file=db/seed.sql --remote
```

- [ ] **Step 6: Build and deploy**

```bash
npm run build
npm run pages:deploy
```

- [ ] **Step 7: First login and admin setup**

1. Navigate to `https://grandeprairie.dev`
2. Click "Sign in with GitHub" — log in as CJ Elliott
3. Verify profile is auto-created
4. Set admin flag: `wrangler d1 execute grandeprairie-dev-db --command="UPDATE profiles SET is_admin = 1 WHERE github_username = 'cjelliott';" --remote`
5. Verify admin panel works

- [ ] **Step 8: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 9: Configure Cloudflare Access (manual)**

In Cloudflare dashboard:
1. Go to Zero Trust → Access → Applications
2. Create application: Self-hosted, path `/admin*`
3. Add policy: Allow email = `cj.elliott@outlook.com`
4. Identity provider: One-time PIN
