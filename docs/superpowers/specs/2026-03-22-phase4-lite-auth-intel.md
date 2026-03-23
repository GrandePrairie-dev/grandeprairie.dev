# Phase 4 Lite: Auth Expansion + Daily Intel Pipeline

**Status:** Approved
**Depends on:** Phase 3 (auth, profiles, intel, admin, Slack)

---

## Overview

Two independent sub-projects:

- **A. Auth Expansion + Adaptive Users** — Google OAuth, email magic link (Resend), Member/Contributor tiers
- **B. Daily Intel Pipeline** — RSS feeds → Groq summarization → Anthropic QC → auto-publish to Intel feed

### Non-goals
- User-facing AI/API access (no paying subscribers)
- Full ElystrumCore intelligence layer (Phase 4 proper)
- Account linking/merging across providers (future)

---

## Sub-project A: Auth Expansion + Adaptive Users

### User Tiers

| Tier | Auth Method | Capabilities |
|------|------------|-------------|
| **Member** | Google OAuth, email magic link | Browse, vote, comment, express interest in business requests, request mentors, edit own profile |
| **Contributor** | GitHub OAuth | All Member features + submit ideas, create events, join projects, promote ideas to projects |
| **Admin** | Any + `is_admin` flag | All features + moderation, content management, org management |

Implementation: `profiles.auth_provider TEXT` column (`github`, `google`, `email`). Contributor check: `auth_provider === 'github' || is_admin`. No separate permissions table.

### Google OAuth

Same pattern as GitHub OAuth (Phase 2):

1. `GET /api/auth/login?provider=google` → redirect to Google OAuth
2. Google redirects to `GET /api/auth/callback/google?code=...&state=...`
3. Exchange code for token, fetch userinfo
4. Find or create profile by `google_id`
5. Create KV session, set cookie, redirect

**Scopes:** `openid email profile`

**DB changes:**
```sql
ALTER TABLE profiles ADD COLUMN google_id TEXT;
ALTER TABLE profiles ADD COLUMN auth_provider TEXT DEFAULT 'github';
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_google_id ON profiles(google_id);
```

**Secrets:** `GOOGLE_CLIENT_ID` (vars), `GOOGLE_CLIENT_SECRET` (secret)

**Google OAuth app:** callback URL `https://grandeprairie.dev/api/auth/callback/google`

### Email Magic Link

1. User enters email on login page
2. `POST /api/auth/email/request` — rate limited (KV counter: max 3 per email per hour, max 10 per IP per hour)
3. Generate token (`crypto.randomUUID()`), store in KV as `email-login:{token}` → `{ email, expires }` with 15-min TTL
4. Send email via Resend API with link: `https://grandeprairie.dev/api/auth/email/verify?token=...`
5. `GET /api/auth/email/verify?token=...` — validate KV token, find or create profile by normalized email, create session, redirect
6. Profile created with `auth_provider = 'email'`, `role = 'member'`

**Email template:** Simple, on-brand. Subject: "Sign in to GrandePrairie.dev". Body: "Click to sign in. Link expires in 15 minutes. If you didn't request this, ignore it."

**Secrets:** `RESEND_API_KEY` (secret). Sending domain: configure SPF/DKIM for `grandeprairie.dev` in Cloudflare DNS.

**Anti-enumeration:** Always return "If an account exists, we sent a link" — never confirm whether email is registered.

### Frontend Changes

**Login page / sidebar:**
- Current: "Sign in with GitHub" button
- After: Three options stacked:
  - "Sign in with GitHub" (GitHub icon) — labeled "For contributors"
  - "Sign in with Google" (Google icon)
  - "Sign in with email" → expands to email input + "Send link" button
- Small text: "GitHub accounts can submit ideas and create events. Google and email accounts can browse, vote, and connect."

**Auth-gated actions:**
- "Submit Idea" button: show for contributors only. Members see "Sign in with GitHub to submit ideas" or a disabled state with tooltip.
- "Add Event" button: same — contributors only.
- Vote, comment, express interest, request mentor: all auth methods.

### API Changes

| Endpoint | Method | Purpose |
|---|---|---|
| `GET /api/auth/login` | GET | Extended: `?provider=github\|google` param |
| `GET /api/auth/callback/google` | GET | Google OAuth callback |
| `POST /api/auth/email/request` | POST | Request magic link |
| `GET /api/auth/email/verify` | GET | Verify magic link token, create session |

Existing GitHub endpoints unchanged. Shared session creation (`createSession`) reused.

### Contributor Check Helper

```typescript
// functions/lib/auth.ts addition
export function isContributor(authProvider: string | null, isAdmin: boolean): boolean {
  return authProvider === 'github' || isAdmin;
}
```

Used in ideas POST, events POST, and project-related endpoints.

---

## Sub-project B: Daily Intel Pipeline

### Architecture

```
Cloudflare Cron Trigger (daily 7am MT / 14:00 UTC)
  → Scheduled Worker
    → Fetch RSS feeds (5-8 sources, last 24h items)
    → Deduplicate against existing Intel titles
    → Groq API: summarize + categorize each item
    → Anthropic API: QC each draft (accept/reject/edit)
    → Accepted → INSERT into intel (auto-published)
    → Slack: batch summary notification
```

### RSS Sources (initial set)

| Source | URL Pattern | Category |
|--------|-----------|----------|
| NWP News | nwpolytech.ca/news RSS | hiring, events |
| City of GP | cityofgp.com news feed | industry, events |
| GP Chamber | grandeprairiechamber.com news | industry, events |
| Alberta Innovates | albertainnovates.ca news | opportunity, industry |
| ATB Financial | atb.com/insights RSS | industry |
| Alberta Energy Regulator | aer.ca news | industry |
| GP Daily Herald-Tribune | dailyheraldtribune.com tech/business | industry |

Sources stored in a config array in the worker code — not in D1. Easy to add/remove.

### Pipeline Steps

**Step 1 — Fetch:**
- Fetch each RSS/Atom feed
- Parse items with `published` date in last 24 hours
- Extract: title, link, description/summary, published date
- Deduplicate against existing Intel: `SELECT id FROM intel WHERE title LIKE ?` (fuzzy) or exact source_url match

**Step 2 — Draft (Groq):**
- Model: `llama-3.1-70b-versatile` (fast, cheap)
- System prompt:
  ```
  You write Intel posts for GrandePrairie.dev, a tech community platform in Grande Prairie, Alberta (Peace Region).

  For each news item, produce a JSON object:
  { "title": "...", "body": "2-3 sentence summary", "category": "hiring|industry|opportunity|events|project_activity", "tags": ["tag1", "tag2"], "relevant": true|false }

  Only mark relevant=true if the item relates to:
  - Grande Prairie, Peace Region, or Northern Alberta
  - Technology, trades-tech, oil & gas tech, agri-tech, forestry tech
  - Post-secondary education in the region (NWP)
  - Startup/business development in the region
  - AI, data, automation applicable to regional industries

  Skip generic national news, sports, weather, politics. Be concise and practical — no hype.
  ```
- Send batch of items in one call. Parse response. Filter `relevant === true`.

**Step 3 — QC (Anthropic):**
- Model: `claude-haiku-4-5-20251001` (fast, cheap, good enough for QC)
- Per-item prompt:
  ```
  Review this Intel post draft for GrandePrairie.dev:

  Title: {title}
  Body: {body}
  Category: {category}
  Source: {source_url}

  Check:
  1. Is the summary factually grounded in the source URL title/description?
  2. Is the tone practical and non-hype?
  3. Is the category correct?
  4. Is the content relevant to Grande Prairie / Peace Region / Northern Alberta tech?

  Respond with JSON: { "verdict": "accept"|"reject"|"edit", "reason": "...", "edited_body": "..." }
  ```
- Accept: publish as-is
- Edit: publish with Anthropic's corrected body
- Reject: skip, log reason

**Step 4 — Publish:**
- INSERT into `intel` table:
  - `title`, `body`, `category`, `source_url`, `tags` (JSON)
  - `author_id = NULL` (system-generated)
  - `is_automated = 1`
  - `is_pinned = 0`, `is_featured = 0` (admin can feature later)

**Step 5 — Notify:**
- Slack message:
  ```
  📰 Daily Intel Pipeline — Mar 23, 2026
  Published: 3 posts (1 hiring, 2 industry)
  Rejected: 2 items (not relevant, duplicate)
  Sources checked: 7 feeds
  ```
- If 0 published: `📰 Daily Intel — no relevant items found today.`

### DB Changes

```sql
ALTER TABLE intel ADD COLUMN is_automated INTEGER DEFAULT 0;
ALTER TABLE intel ADD COLUMN source_feed TEXT;
```

### Wrangler Configuration

```toml
# wrangler.toml addition
[triggers]
crons = ["0 14 * * *"]  # 7am Mountain Time = 14:00 UTC
```

The cron handler is a `scheduled` event handler in a Worker, separate from the Pages Functions. It needs access to the same D1 + KV bindings.

Implementation: `functions/_worker.ts` or a separate `src/worker.ts` that exports a `scheduled` handler alongside the Pages `fetch` handler.

### API Keys (from .env / wrangler secrets)

| Key | Purpose |
|-----|---------|
| `GROQ_API_KEY` | Groq API for drafting |
| `ANTHROPIC_API_KEY` | Anthropic API for QC |
| `RESEND_API_KEY` | Resend API for magic link emails |

All server-side only. No user-facing API access.

### Frontend Changes

**Intel page:**
- Automated posts show a subtle "🤖 Auto-generated" badge or "via [source]" link
- Admin can feature/pin automated posts same as manual ones

**Home page:**
- Activity feed: automated intel posts do NOT appear in activity feed (only human actions)
- Featured Intel section can include auto-generated posts if admin features them

### Cost Estimate (daily)

| Service | Usage | Cost |
|---------|-------|------|
| Groq | ~20 items × 1 batch call | Free tier / ~$0.01 |
| Anthropic Haiku | ~10 items × QC | ~$0.02 |
| Resend | ~5-20 magic link emails/day | Free tier (100/day) |
| **Total** | | **~$0.03/day, ~$1/month** |

---

## Migration Plan

### Sub-project A (Auth):
1. Register Google OAuth app (Google Cloud Console)
2. Configure Resend account + verify `grandeprairie.dev` sending domain (SPF/DKIM in Cloudflare DNS)
3. Add secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`
4. Run DB migration (google_id, auth_provider columns)
5. Update existing GitHub profiles: `UPDATE profiles SET auth_provider = 'github' WHERE github_id IS NOT NULL`
6. Deploy auth endpoints + frontend

### Sub-project B (Pipeline):
1. Add secrets: `GROQ_API_KEY`, `ANTHROPIC_API_KEY`
2. Run DB migration (is_automated, source_feed columns)
3. Add cron trigger to wrangler.toml
4. Deploy scheduled worker
5. Test: run manually, verify Slack output, check Intel page
6. Enable cron

### Sequencing
A and B are independent. Can be built in parallel or either-first. A is more user-facing; B is more operational. Recommend A first (unblocks new signups), B second (can iterate on source quality).
