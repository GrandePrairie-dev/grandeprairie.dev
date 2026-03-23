# Phase 2: Activity Layer — Design Spec

## Overview

Phase 2 transforms GrandePrairie.dev from a public showcase into a real community platform where people can sign in, own their identity, contribute content, and be moderated. It consists of three sub-projects executed sequentially:

- **A. Authentication & Identity** — GitHub OAuth, KV sessions, profile ownership
- **B. Content Operations** — Admin tools, moderation, idea→project promotion
- **C. Community Engagement** — Profile editing, authenticated actions, activity feed, Slack webhooks

## Seed Data Migration

Phase 1 mock profiles are all fictional. On Phase 2 launch:
- **Delete all mock profiles** from D1 (they served their purpose)
- **Keep seed ideas, events, intel, business requests** — these represent plausible community content and give the platform shape until organic content replaces them
- **First real account**: CJ Elliott signs in via GitHub, auto-created profile, manually marked as admin in D1
- Update seed data `author_id` references to NULL or to CJ's new profile ID after first login

---

## Sub-project A: Authentication & Identity

### GitHub OAuth Flow

1. User clicks "Sign in with GitHub" in sidebar
2. Frontend navigates to `GET /api/auth/login`
3. Worker generates `state` param (random, stored in KV with 10-min TTL for CSRF protection), redirects to `https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&state=...&scope=read:user`
4. User authorizes on GitHub
5. GitHub redirects to `GET /api/auth/callback?code=...&state=...`
6. Worker validates `state` against KV, exchanges `code` for access token via `POST https://github.com/login/oauth/access_token`
7. Worker fetches `GET https://api.github.com/user` with access token to get profile data
8. Worker looks up D1 profile by `github_id`:
   - **Exists**: update `avatar_url`, `github_username` if changed
   - **New**: INSERT into profiles with `name`, `username` (from GitHub login), `avatar_url`, `github_id`, `github_username`, `role='member'`
9. Create session: `crypto.randomUUID()`, store in KV as `session:{uuid}` with value `{ profileId, isAdmin, createdAt }` and TTL based on remember-me (30 days default, 24h if unchecked)
10. Set `gp-session` cookie: `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=...`
11. Redirect to `/` (or to stored return URL)

### Environment Variables / Secrets

| Variable | Where | Purpose |
|---|---|---|
| `GITHUB_CLIENT_ID` | wrangler.toml `[vars]` | OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | `.dev.vars` + wrangler secret | OAuth app secret |
| `SESSION_SECRET` | `.dev.vars` + wrangler secret | HMAC signing for state params |

GitHub OAuth app callback URL: `https://grandeprairie.dev/api/auth/callback`

### Session Layer

**KV Schema:**
- Key: `session:{uuid}`
- Value: `{ "profileId": 1, "isAdmin": true, "createdAt": "2026-03-22T..." }`
- TTL: 2592000 (30 days) or 86400 (24 hours)
- Key: `oauth-state:{state}` — CSRF state, TTL: 600 (10 min)

**Middleware** (`functions/api/_middleware.ts`):
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
if (!user.isAdmin) return new Response("Forbidden", { status: 403 });
```

### API Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/login` | GET | Public | Redirect to GitHub OAuth (accepts `?remember=false` for short sessions) |
| `/api/auth/callback` | GET | Public | OAuth callback, creates session, redirects to app |
| `/api/auth/logout` | POST | Authenticated | Delete session from KV, clear cookie |
| `/api/auth/me` | GET | Public | Return current user profile or `null` |

### DB Schema Changes

```sql
-- Add to profiles table (new columns)
ALTER TABLE profiles ADD COLUMN github_id INTEGER UNIQUE;
ALTER TABLE profiles ADD COLUMN github_username TEXT;
```

Since D1/SQLite ALTER TABLE ADD COLUMN doesn't support IF NOT EXISTS, create a migration file `db/migrations/001-add-github-auth.sql`:
```sql
ALTER TABLE profiles ADD COLUMN github_id INTEGER;
ALTER TABLE profiles ADD COLUMN github_username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_github_id ON profiles(github_id);
```

### Frontend

**New hook: `src/hooks/useAuth.ts`**
```typescript
// Fetches /api/auth/me on mount
// Returns { user, isLoggedIn, isAdmin, login, logout, isLoading }
// login() navigates to /api/auth/login
// logout() POSTs to /api/auth/logout, clears query cache, reloads
```

**Sidebar changes:**
- Not logged in: show "Sign in with GitHub" button (GitHub icon) in footer area
- Logged in: show user's real avatar (from GitHub), name, role
- Login button uses the `login()` function from `useAuth`

**Profile completion banner:**
- Component: `src/components/ProfileBanner.tsx`
- Shows when user is logged in but profile is missing role, skills, or bio
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
| `POST /api/events` | Public | Authenticated; `organizer_id` from session |
| `POST /api/profiles` | Public | Removed (profiles created via OAuth) |
| `POST /api/intel` | Public | Admin only |
| `PATCH /api/business-requests/:id/status` | Public | Admin only |
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
- Toggle featured: `PATCH /api/profiles/:id/admin` with `{ is_featured: 1|0 }` (admin only)
- Toggle admin: `PATCH /api/profiles/:id/admin` with `{ is_admin: 1|0 }` (admin only)

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
- This is a second layer — app-level admin checks remain

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
  type TEXT NOT NULL,         -- 'new_member', 'new_idea', 'new_project', 'new_event', 'vote', 'comment'
  profile_id INTEGER REFERENCES profiles(id),
  target_type TEXT,           -- 'idea', 'project', 'event', 'profile'
  target_id INTEGER,
  summary TEXT,               -- pre-rendered: "Sarah Chen submitted an idea"
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at);
```

**API:** `GET /api/activity?limit=10` — public, returns recent activity with profile name joined

**Inserting activity:** Each write endpoint (create idea, create event, vote, new member via OAuth) inserts an activity row after the main operation.

**Frontend:** Home page gets a "Recent Activity" section showing the last 5-10 items with icons by type.

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
- Wrapped in try/catch — webhook failure never blocks the API response

**Message format:**
```
🆕 New member: Sarah Chen (developer) joined GrandePrairie.dev
💡 New idea: "Field Data Collection AI" submitted by CJ Elliott
🏢 New business request from Prairie Mechanical Ltd (automation)
📅 New event: "Tech & Coffee" on Mar 28 at Grande Prairie Public Library
```

---

## Migration Plan

### Before deploying Phase 2:
1. Create GitHub OAuth App (grandeprairie.dev callback URL)
2. Add `GITHUB_CLIENT_ID` to wrangler.toml vars
3. Add `GITHUB_CLIENT_SECRET` and `SESSION_SECRET` as wrangler secrets
4. Run DB migrations (add github columns, idea_votes table, activity table)
5. Clear mock profiles from D1 (keep other seed data, set author_id to NULL)
6. Configure Cloudflare Access policy for `/admin` path
7. Set up Slack webhook URL (create GP community Slack workspace first)
8. Deploy

### After deploying:
1. CJ Elliott logs in via GitHub — first real profile created
2. Manually set `is_admin = 1` on CJ's profile in D1
3. Verify admin panel is protected by Cloudflare Access
4. Invite initial community members to sign in
