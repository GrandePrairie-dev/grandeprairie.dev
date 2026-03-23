# Phase 2: Activity Layer — Design Spec

## Overview

Phase 2 transforms GrandePrairie.dev from a public showcase into a real community platform where people can sign in, own their identity, contribute content, and be moderated. It consists of three sub-projects executed sequentially:

- **A. Authentication & Identity** — GitHub OAuth (launch), KV sessions, profile ownership
- **B. Content Operations** — Admin tools, moderation, idea→project promotion
- **C. Community Engagement** — Profile editing, authenticated actions, activity feed, Slack webhooks

**Launch scope:** GitHub OAuth only. **Planned follow-up:** Google OAuth and email-based sign-in (magic link or OTP) — see [Future: Google OAuth and email authentication](#future-google-oauth-and-email-authentication).

---

## Seed Data Migration

Phase 1 mock profiles are all fictional. On Phase 2 launch:
- **Delete all mock profiles** from D1 (they served their purpose)
- **Keep seed ideas, events, intel, business requests** — these represent plausible community content and give the platform shape until organic content replaces them
- **First real account**: CJ Elliott signs in via GitHub, auto-created profile, manually marked as admin in D1
- Update seed data `author_id` references to NULL or to CJ's new profile ID after first login

---

## Spec refinements (baked in)

These decisions apply across Sub-projects A–C so implementation stays consistent.

### OAuth `state` and secrets

- **CSRF protection:** `state` is random, stored in KV as `oauth-state:{state}` with **10-minute TTL**, then validated on callback. No HMAC required for `state` in Phase 2.
- **`SESSION_SECRET`:** **Not required for Phase 2** if sessions are opaque UUIDs in KV only. **Optional:** add later for signed cookie payloads or additional hardening; if unused at launch, omit from wrangler secrets to reduce confusion.

### Provider user IDs in D1

- Store **`github_id` as `TEXT`** (GitHub’s JSON `id` is a numeric string; avoids precision issues in Workers/JSON and future provider parity).

### Admin flag freshness (`is_admin`)

- KV session may cache `{ profileId, isAdmin }`. **For every admin-only endpoint** (PATCH/DELETE moderation, POST intel, PATCH business-request status, etc.), **re-read `is_admin` from D1** for `session.profileId` and treat that as source of truth. Optionally still cache `isAdmin` in KV for fast `403` on obvious non-admins, but **authorize mutations using D1**.
- **Rationale:** Promote/demote in D1 takes effect immediately without waiting for session TTL.

### Return URL after login

- Support **`?return_to=`** on `GET /api/auth/login` only where the path is **same-origin allowlist** (e.g. prefix match: `/`, `/ideas`, `/people`, `/admin`, … — no `//` or external hosts).
- Persist `return_to` in the OAuth state payload (or alongside `oauth-state:{state}` in KV) so callback can redirect safely after session creation.

### Middleware placement

- Verify **Cloudflare Pages Functions** layout: middleware must run for **all `/api/*`** handlers (e.g. `functions/_middleware.ts` vs `functions/api/_middleware.ts` per current docs). If a path is excluded, use a shared `getSession(request, env)` helper and call it from handlers that need auth.
- **Implementation plan:** confirm one pattern and document it in the repo.

### `ideas.status` enum

- Allowed values after Phase 2: **`open`**, **`closed`**, **`promoted`** (plus any existing seed values migrated explicitly). UI filters and admin PATCH must use this set; DB stays `TEXT` with app-level validation.

### New `POST /api/events`

- **Not present in Phase 1 codebase** — Phase 2 adds **`POST /api/events`** (authenticated, `organizer_id` from session) with validation (title, `start_time`, optional fields). Pair with admin `DELETE /api/events/:id`.

### Activity feed: votes

- **`vote` activity type:** either **omit from `GET /api/activity` default** (home feed shows member/idea/project/event/comment only) or **do not insert** vote rows for the public feed. Votes stay in `idea_votes` + counts; **no Slack** for individual votes (already excluded).
- **Rationale:** avoids noisy feed and keeps home page readable.

### Profile completion banner

- **Do not** treat default `role='member'` as “incomplete.” Show banner when **title, bio, skills, or links** are empty/minimal (configurable thresholds). Link to `/people/:id/edit`.

### Cloudflare Access vs GitHub identity

- **Access** (e.g. OTP to `cj.elliott@outlook.com`) is **independent** of GitHub login email. Expect **two layers**: Access gate on `/admin*`, then app-level `is_admin` from D1. They do not need to match.

### Optional API naming (cosmetic)

- **`PATCH /api/profiles/:id/admin`** is easy to confuse with the `/admin` route. **Optional rename:** `PATCH /api/admin/profiles/:id` (same auth rules). Pure ergonomics — pick one in the implementation plan.

### Slack failures (observability)

- **`notifySlack`:** keep try/catch so the user request never fails; **optionally** `console.error` a short message (no webhook URL) for Workers logs / debugging.

---

## Sub-project A: Authentication & Identity

### GitHub OAuth Flow

1. User clicks "Sign in with GitHub" in sidebar
2. Frontend navigates to `GET /api/auth/login` (optional: `?remember=false`, optional safe `?return_to=/ideas`)
3. Worker generates `state` param (random), stores in KV with 10-min TTL for CSRF protection, redirects to `https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&state=...&scope=read:user`
4. User authorizes on GitHub
5. GitHub redirects to `GET /api/auth/callback?code=...&state=...`
6. Worker validates `state` against KV, exchanges `code` for access token via `POST https://github.com/login/oauth/access_token`
7. Worker fetches `GET https://api.github.com/user` with access token to get profile data
8. Worker looks up D1 profile by `github_id`:
   - **Exists**: update `avatar_url`, `github_username` if changed; optionally sync `name` if empty
   - **New**: INSERT into profiles with `name`, `username` (from GitHub login; handle uniqueness collisions if any), `avatar_url`, `github_id`, `github_username`, `role='member'`
9. Create session: `crypto.randomUUID()`, store in KV as `session:{uuid}` with value `{ profileId, isAdmin, createdAt }` and TTL based on remember-me (30 days default, 24h if unchecked)
10. Set `gp-session` cookie: `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=...`
11. Redirect to **allowlisted** `return_to` or `/`

**Future note:** `read:user` only at launch; adding **`user:email`** is reserved for when email is stored or used for notifications ([Future](#future-google-oauth-and-email-authentication)).

### Environment Variables / Secrets

| Variable | Where | Purpose |
|---|---|---|
| `GITHUB_CLIENT_ID` | wrangler.toml `[vars]` | OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | `.dev.vars` + wrangler secret | OAuth app secret |
| `SESSION_SECRET` | Optional / future | Only if signed cookies or extra signing added; **omit at Phase 2 launch if unused** |

GitHub OAuth app callback URL: `https://grandeprairie.dev/api/auth/callback`

### Session Layer

**KV Schema:**
- Key: `session:{uuid}`
- Value: `{ "profileId": 1, "isAdmin": true, "createdAt": "2026-03-22T..." }`
- TTL: 2592000 (30 days) or 86400 (24 hours)
- Key: `oauth-state:{state}` — CSRF state, TTL: 600 (10 min); value may include JSON `{ returnTo?: string }` if using allowlisted return URLs

**Middleware** (`functions/api/_middleware.ts` or verified global equivalent):
- Runs on all `/api/*` requests
- Reads `gp-session` cookie
- Looks up session in KV
- Attaches `context.data.user = { profileId, isAdmin } | null` to the request context
- Does NOT block unauthenticated requests — individual endpoints decide

**Auth enforcement pattern:**
```
// In any endpoint handler:
const user = context.data.user;
if (!user) return new Response("Unauthorized", { status: 401 });
// For admin mutations, re-check is_admin from D1 for user.profileId (see Spec refinements)
if (!(await isAdminInDb(env.DB, user.profileId))) return new Response("Forbidden", { status: 403 });
```

### API Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/login` | GET | Public | Redirect to GitHub OAuth (`?remember=false`, allowlisted `?return_to=`) |
| `/api/auth/callback` | GET | Public | OAuth callback, creates session, redirects to app |
| `/api/auth/logout` | POST | Authenticated | Delete session from KV, clear cookie |
| `/api/auth/me` | GET | Public | Return current user profile or `null` (avoid leaking sensitive fields if added later) |

### DB Schema Changes

```sql
-- github_id as TEXT (see Spec refinements)
ALTER TABLE profiles ADD COLUMN github_id TEXT;
ALTER TABLE profiles ADD COLUMN github_username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_github_id ON profiles(github_id);
```

Since D1/SQLite ALTER TABLE ADD COLUMN doesn't support IF NOT EXISTS, create a migration file `db/migrations/001-add-github-auth.sql` with the above (split steps if needed for idempotent deploys).

### Frontend

**New hook: `src/hooks/useAuth.ts`**
```typescript
// Fetches /api/auth/me on mount
// Returns { user, isLoggedIn, isAdmin, login, logout, isLoading }
// login(returnTo?) navigates to /api/auth/login with allowlisted return_to
// logout() POSTs to /api/auth/logout, clears query cache, reloads
```

**Sidebar changes:**
- Not logged in: show "Sign in with GitHub" button (GitHub icon) in footer area
- Logged in: show user's real avatar (from GitHub), name, role
- Login button uses the `login()` function from `useAuth`

**Profile completion banner:**
- Component: `src/components/ProfileBanner.tsx`
- Shows when user is logged in but profile is missing **title, bio, skills, or links** (not `role` — default `member` is expected)
- Dismissible, links to `/people/:id/edit`
- Renders at top of main content area (inside App.tsx)

**Auth-aware UI changes:**
- "Submit Idea" button: hidden when not logged in, or shows login prompt on click
- "Add Event" button: same pattern
- "Post Comment": shows "Sign in to comment" when not authenticated
- "Submit Request" on business page: works without auth (public intake form)
- Vote button: tied to authenticated user (see Sub-project C)

### Auth Enforcement on Existing Endpoints

| Endpoint | Current | After Auth |
|---|---|---|
| `POST /api/ideas` | Public | Authenticated; `author_id` from session |
| `POST /api/comments` | Public (anonymous) | Authenticated; `author_id` from session |
| `POST /api/events` | Missing | **New:** Authenticated; `organizer_id` from session |
| `POST /api/profiles` | Public | Removed (profiles created via OAuth) |
| `POST /api/intel` | Public | Admin only (D1 `is_admin` check) |
| `PATCH /api/business-requests/:id/status` | Public | Admin only (validate `status` enum + D1 `is_admin`) |
| `POST /api/business-requests` | Public | Stays public (intake form) |
| `GET` endpoints | Public | Stay public |

---

## Sub-project B: Content Operations

**Depends on:** Sub-project A (auth middleware, admin enforcement)

### Admin Panel Enhancements

The existing Admin page (`/admin`) gets real moderation controls:

**Ideas tab:**
- Toggle featured: `PATCH /api/ideas/:id` with `{ is_featured: 1|0 }` (admin only)
- Change status: `PATCH /api/ideas/:id` with `{ status: "open"|"closed"|"promoted" }` (admin only)
- "Promote to Project" button (see below)

**Profiles tab:**
- Toggle featured: `PATCH /api/profiles/:id/admin` (or optional `PATCH /api/admin/profiles/:id`) with `{ is_featured: 1|0 }` (admin only)
- Toggle admin: same endpoint with `{ is_admin: 1|0 }` (admin only)

**Events tab:**
- Delete event: `DELETE /api/events/:id` (admin only)

**Intel tab:**
- Toggle pinned: `PATCH /api/intel/:id` with `{ is_pinned: 1|0 }` (admin only)
- Toggle featured: `PATCH /api/intel/:id` with `{ is_featured: 1|0 }` (admin only)
- Create new intel: inline form in admin (POST /api/intel, admin only)

**Comments moderation:**
- Delete comment: `DELETE /api/comments/:id` (admin or comment author)

### New API Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `PATCH /api/ideas/:id` | PATCH | Admin | Update is_featured, status |
| `PATCH /api/profiles/:id/admin` | PATCH | Admin | Update is_featured, is_admin |
| `PATCH /api/intel/:id` | PATCH | Admin | Update is_pinned, is_featured |
| `DELETE /api/events/:id` | DELETE | Admin | Delete event |
| `DELETE /api/comments/:id` | DELETE | Admin or author | Delete comment |

### Idea → Project Promotion

When admin or idea author clicks "Promote to Project" on an idea:
1. Opens a pre-filled dialog with title and description from the idea
2. User can edit and add project-specific fields (stage, repo_url, skills_needed)
3. POST to `/api/projects` with `source_idea_id` field
4. Idea status updated to `"promoted"`

**DB change:** Add column to projects:
```sql
ALTER TABLE projects ADD COLUMN source_idea_id INTEGER REFERENCES ideas(id);
```

### Cloudflare Access for Admin

Configure via Cloudflare dashboard or API:
- Access policy on path `/admin*`
- Allow: email = `cj.elliott@outlook.com`
- Identity provider: One-time PIN (email OTP)
- This is a second layer — app-level admin checks remain; **GitHub email and Access email need not match**

---

## Sub-project C: Community Engagement

**Depends on:** Sub-project A (auth for attribution)

### Profile Editing

**Route:** `/people/:id/edit`
**Auth:** Only the profile owner (session profileId matches route param)

**Form fields:** name, title, bio, role (select from ROLES), skills (comma-separated → JSON array), links (github, linkedin, website inputs)

**API:** `PATCH /api/profiles/:id` — authenticated, owner only. Validates that `context.data.user.profileId === params.id`.

### Authenticated Voting

Replace the session-level `Set` with D1-backed deduplication:

```sql
CREATE TABLE IF NOT EXISTS idea_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idea_id INTEGER NOT NULL REFERENCES ideas(id),
  profile_id INTEGER NOT NULL REFERENCES profiles(id),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(idea_id, profile_id)
);
```

**Vote endpoint changes:**
- `POST /api/ideas/:id/vote` — requires auth
- Check `idea_votes` for existing vote by this user
- If already voted: return 409 Conflict
- If not: INSERT into `idea_votes`, UPDATE ideas SET votes = votes + 1
- Frontend `VoteButton`: fetch user's votes on mount via `GET /api/ideas/:id/voted` (or include in idea response)

### Activity Feed

Simple activity log for the home page "Recent Activity" section:

```sql
CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,         -- 'new_member', 'new_idea', 'new_project', 'new_event', 'comment' (see below for votes)
  profile_id INTEGER REFERENCES profiles(id),
  target_type TEXT,           -- 'idea', 'project', 'event', 'profile'
  target_id INTEGER,
  summary TEXT,               -- pre-rendered: "Sarah Chen submitted an idea"
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at);
```

**API:** `GET /api/activity?limit=10` — public, returns recent activity with profile name joined

**Inserting activity:** After successful writes, insert rows for **new_member** (OAuth), **new_idea**, **new_project**, **new_event**, **new_business_request** (optional if feed should show requests — default **off** for privacy), **comment**. **Do not** insert per-vote rows for the default home feed (see Spec refinements).

**Frontend:** Home page gets a "Recent Activity" section showing the last 5–10 items with icons by type.

### Slack Integration

Fire-and-forget webhooks on key events. No Slack SDK — just `fetch()` POST to a webhook URL.

**Events that trigger webhooks:**
- New member signup (via OAuth callback)
- New idea submitted
- New business request
- New event created

**Implementation:**
- `SLACK_WEBHOOK_URL` stored as wrangler secret
- Helper function `notifySlack(text: string, env: Env)` that POSTs `{ text }` to the webhook URL
- Called from the relevant API endpoints after successful DB write
- Wrapped in try/catch — webhook failure never blocks the API response; **optional:** log failure to Workers console (no secret in log)

**Message format:**
```
🆕 New member: Sarah Chen (developer) joined GrandePrairie.dev
💡 New idea: "Field Data Collection AI" submitted by CJ Elliott
🏢 New business request from Prairie Mechanical Ltd (automation)
📅 New event: "Tech & Coffee" on Mar 28 at Grande Prairie Public Library
```

---

## Future: Google OAuth and email authentication

**Goal:** Let users sign in with **Google** or **email** (no password store on GP.dev in v1), reusing the same **profile**, **KV sessions**, and **cookie** model as GitHub.

### Design principles

1. **One profile per person** — Link multiple providers to the same `profiles` row when emails match (careful) or via explicit “link account” later; avoid duplicate profiles.
2. **Provider-specific IDs as TEXT** — `google_id TEXT`, unique index; same pattern as `github_id`.
3. **Same session shape** — `session:{uuid}` → `{ profileId, isAdmin, createdAt }`; OAuth provider is irrelevant after session creation.
4. **Unified login entry** — `GET /api/auth/login?provider=github|google` (and email flow separate below); one callback router or separate paths (`/api/auth/callback/github`, `/api/auth/callback/google`) to keep code clear.

### Google OAuth (planned)

| Item | Detail |
|---|---|
| Flow | Same as GitHub: state in KV, callback exchanges code, fetch userinfo |
| Endpoints | `openid`, `email`, `profile` scopes (minimize to what we store) |
| Secrets | `GOOGLE_CLIENT_ID` (vars), `GOOGLE_CLIENT_SECRET` (secret) |
| Callback | e.g. `https://grandeprairie.dev/api/auth/callback/google` |
| Profile match | Lookup by `google_id`; else if **verified email** matches existing profile `email`, optional **account linking** (policy: auto-link vs prompt — document in plan) |
| Columns | `ALTER TABLE profiles ADD COLUMN google_id TEXT;` + `CREATE UNIQUE INDEX ...` |

**Frontend:** “Sign in with Google” next to GitHub; `login({ provider: 'google', returnTo })`.

### Email authentication (planned)

**Preferred pattern: magic link** (passwordless; Workers-friendly).

| Step | Behavior |
|---|---|
| 1 | User enters email on `POST /api/auth/email/request` (rate-limited by IP + email hash in KV) |
| 2 | Generate token, store `email-login:{token}` in KV → `{ email, expires }` (e.g. 15 min TTL) |
| 3 | Send email via transactional provider (**Resend**, Postmark, or SendGrid) with link `https://grandeprairie.dev/api/auth/email/verify?token=...` |
| 4 | Verify handler validates KV, finds or creates profile by **normalized email**, creates session like OAuth, clears token, sets cookie, redirects |

**Schema:**
- `profiles.email` already exists; add **`email_verified INTEGER DEFAULT 0`** when email auth ships; set `1` after successful magic link.
- **Unique index on lower(trim(email))** if enforcing one profile per email (SQLite: consider normalized `email_canonical` column).

**Security:**
- Rate limit request + verify endpoints
- Single-use tokens (delete KV key on success)
- No user enumeration in error messages (generic “If an account exists, we sent a link”)

**Secrets:** `EMAIL_PROVIDER_API_KEY`, from address domain (SPF/DKIM) configured outside Workers.

### Implementation ordering (suggested)

1. **Phase 2** — GitHub only; schema leaves room (`google_id` migration can wait until Google ships).
2. **Phase 2.x** — Add Google OAuth + UI; shared auth helper module (`exchangeCode`, `upsertProfileFromProvider`).
3. **Phase 2.y** — Email magic link + `email_verified`; optional **merge** UX if GitHub email matches manual signup.

### Open decisions (for implementation plan)

- Auto-link Google/GitHub when **verified emails** match vs forced distinct accounts
- Whether **business request** notifications ever use `profiles.email` (consent / settings table later)
- **Cloudflare Access** unchanged — still OTP to admin email; independent of sign-in method

---

## Migration Plan

### Before deploying Phase 2:
1. Create GitHub OAuth App (grandeprairie.dev callback URL)
2. Add `GITHUB_CLIENT_ID` to wrangler.toml vars
3. Add `GITHUB_CLIENT_SECRET` as wrangler secret (`SESSION_SECRET` only if implementing signing — else skip)
4. Run DB migrations (github columns as TEXT, idea_votes table, activity table, ideas status semantics documented)
5. Clear mock profiles from D1 (keep other seed data, set author_id to NULL)
6. Configure Cloudflare Access policy for `/admin` path
7. Set up Slack webhook URL (create GP community Slack workspace first)
8. Deploy

### After deploying:
1. CJ Elliott logs in via GitHub — first real profile created
2. Manually set `is_admin = 1` on CJ's profile in D1
3. Verify admin panel is protected by Cloudflare Access
4. Invite initial community members to sign in

### When adding Google / email later:
1. Register Google OAuth app; add secrets and callback URL
2. Run migrations for `google_id` and email verification columns as needed
3. Configure email provider DNS + API keys
4. Ship provider-specific callbacks and rate limits; regression-test session + admin D1 checks
