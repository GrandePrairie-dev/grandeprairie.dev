# Phase 3: Opportunity Layer — Design Spec

**Status:** Draft — **decisions resolved** (see [Resolved decisions](#resolved-decisions)); ready to build against  
**Depends on:** [Phase 2: Activity Layer](./2026-03-22-phase2-activity-layer.md) — auth, profiles, admin, activity feed, Slack hooks, vote dedup  
**Strategic alignment:** GrandePrairie.dev v0.2 — *Opportunity Layer* (business→builder pipeline, mentor matching)

### Sequencing rationale

Shipping **Sub-project A (business matchmaking) before B (mentors)** is intentional: a business posts a need → builders express interest → admin matches by hand. That is the **“foster connection”** phase encoded in the product **before** adding a second matchmaking surface. Human judgment (admin) carries the matching load until Phase 4 has enough structured signal to automate.

---

## Overview

Phase 3 turns authenticated members into **participants in real matchmaking**: small businesses get matched to builders, and students/founders can find mentors. It adds **structured opportunity data** (orgs, offers, interests) without yet depending on the external **Intelligence Layer** (ElystrumCore — Phase 4).

### Goals

1. **Business → builder pipeline** — Discover, express interest, assign, and track matches on top of existing `business_requests`.
2. **Mentor matching** — Make mentors visible, let mentees request intros, and give admins a light queue.
3. **Organization profiles (v1)** — Represent local orgs (NWP, meetups, companies) as first-class pages linked to people and projects.
4. **Operational clarity** — Expand Slack (optional), email later; keep Workers + D1 + KV only unless a small add-on is justified.

### Non-goals (Phase 3)

- ML/recommendation engine, automated ranking, or ElystrumCore integration (**Phase 4**).
- Full CRM, contracts, or payments.
- Replacing Slack with in-app realtime chat (optional tiny experiments OK; not a product pillar).

### Sub-projects (suggested order)

| ID | Name | Outcome |
|----|------|--------|
| **A** | **Business matchmaking** | Builders browse/filter requests, express interest, admin assigns `matched_profile_id`, statuses drive UI + notifications |
| **B** | **Mentor matching** | Mentor opt-in on profile, mentee requests, admin/mentor accept flow |
| **C** | **Organizations v1** | `organizations` + links to profiles/projects/events; map pins optional |
| **D** | **Polish & signals** | Expanded Slack messages, digest-friendly activity types, basic analytics for admins |

Dependencies: **A** can ship first; **B** reuses auth + notifications patterns from A; **C** is parallelizable after profile stable; **D** is ongoing.

---

## Prerequisites from Phase 2 (must be true before Phase 3)

- [ ] GitHub (or multi-provider) auth + session middleware
- [ ] `PATCH /api/business-requests/:id/status` admin-only with validated status enum
- [ ] Profile edit + `role` / `skills` usable for matching filters
- [ ] Slack webhook helper for high-signal events (extend in Phase 3)

---

## Sub-project A: Business → builder pipeline

### Problem

Phase 2 keeps **public intake** (`POST /api/business-requests`) and **admin status** updates, but builders cannot **discover** requests or **signal interest**. `matched_profile_id` exists in schema but has no product surface.

### User stories

- As a **builder**, I see open business requests (filtered by category/skills), open a detail view, and **“Express interest”** (authenticated).
- As a **business contact** (optional v1: no login), I don’t need an account; matching is outbound from community side (email handled offline or via admin).
- As an **admin**, I see interests per request, assign **the** primary matcher (`matched_profile_id`), set status (`reviewed` → `matched` → `in_progress` → `completed`). **v1: one matched builder only** — see Resolved decisions.

### Data model additions

**Table: `business_request_interests`** (many builders → one request)

```sql
CREATE TABLE IF NOT EXISTS business_request_interests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_request_id INTEGER NOT NULL REFERENCES business_requests(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id),
  note TEXT,                    -- short message from builder
  status TEXT DEFAULT 'pending', -- 'pending' | 'withdrawn' | 'selected' | 'declined' (admin)
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(business_request_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_bri_request ON business_request_interests(business_request_id);
CREATE INDEX IF NOT EXISTS idx_bri_profile ON business_request_interests(profile_id);
```

**Optional columns on `business_requests` (v1 or v2):**

- `visibility TEXT DEFAULT 'community'` — future: `unlisted` for sensitive asks
- `matched_at TEXT` — audit trail when `matched_profile_id` set

**Skills alignment:** Keep `profiles.skills` as JSON array string (Phase 2). Matching v1 = **category overlap + manual admin judgment**; Phase 4 can add scoring.

### API endpoints (new / changed)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /api/business-requests` | GET | Public | Existing list; Phase 3: query params `?status=new,reviewed` (public sees subset — e.g. hide contact details for `new` if spam risk) |
| `GET /api/business-requests/:id` | GET | Public / builder | Detail; **redact** `contact_email` / phone for non-admin until **`status` indicates matched** (see Resolved decisions — no “interest = visible” shortcut) |
| `POST /api/business-requests/:id/interests` | POST | Authenticated | Create interest `{ note? }`; 409 if duplicate |
| `DELETE /api/business-requests/:id/interests/me` | DELETE | Authenticated | Withdraw own interest |
| `GET /api/business-requests/:id/interests` | GET | Admin | List interests with profile summary |
| `PATCH /api/business-requests/:id` | PATCH | Admin | Assign `matched_profile_id`, update status (merge with status-only PATCH or single endpoint) |

**Privacy rule (locked):**

- Public list: show **business_name**, **category**, **problem** excerpt, **status** badge — **not** email/phone.
- Detail: **same redaction for everyone except admin** until the request is **matched** through the platform (`matched_profile_id` set / status in matched pipeline). **Do not** expose contact info to interested-but-unmatched builders — that turns the site into a bulletin board and bypasses the matchmaking value.
- **Admins** see full contact fields for operations.

### Frontend

- **`/business`**: Split **Submit** (existing) from **Open requests** (new tab or section): cards → `/business/:id`.
- **`/business/:id`**: Detail + interest CTA; show “You’ve expressed interest” state.
- **Admin**: Existing requests tab + **interests count** + modal to view interests and **Set primary matcher** (writes `matched_profile_id` + `matched`).

### Slack (Phase 3 extension)

- **New interest:** `🔔 CJ Elliott expressed interest in request #12 (automation) — Prairie Mechanical`
- **Matched:** `🤝 Request #12 matched to CJ Elliott`

Fire-and-forget; same helper as Phase 2.

**Stale queue digest (recommended):** One **daily** Slack message summarizing **open requests still unmatched** (e.g. `status IN ('new','reviewed')` and no `matched_profile_id`) where **`created_at` is older than 48 hours**. Keeps nothing sitting cold without a separate inbox product.

- **Implementation:** Cloudflare **Cron Trigger** (e.g. daily 08:00 America/Edmonton) → scheduled Worker/Pages Function that queries D1, formats a short bullet list (id, business name, category, age), POSTs to the same `SLACK_WEBHOOK_URL`. Empty queue → skip or send “No stale requests.”
- **Secrets:** Reuse existing webhook; optional `SLACK_DIGEST_WEBHOOK_URL` if you ever want digests in a different channel.

### Migration

1. Add `business_request_interests` + indexes.
2. Backfill: none required.
3. Deploy API → UI → tighten redaction rules.

---

## Sub-project B: Mentor matching

### Problem

Strategic spec calls for **mentor matching**. Phase 2 has `role` including `mentor` but no workflow.

### Approach (v1 — lightweight)

Avoid a heavy `MentorProfile` entity until needed. Use:

- **`mentor_available INTEGER DEFAULT 0`** on `profiles` — **locked** (see Resolved decisions). A **developer who also mentors** toggles availability without forcing `role = mentor` only.
- **`mentor_topics TEXT DEFAULT '[]'`** — JSON array of topic strings (parallel to `skills`), for **filtering** the mentor directory (“career”, “startup”, “technical”, “trades pathway”, etc.).
- **`mentor_requests`** table for inbound asks.

### Data model

```sql
ALTER TABLE profiles ADD COLUMN mentor_available INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN mentor_topics TEXT DEFAULT '[]';

CREATE TABLE IF NOT EXISTS mentor_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mentee_profile_id INTEGER NOT NULL REFERENCES profiles(id),
  mentor_profile_id INTEGER NOT NULL REFERENCES profiles(id),
  message TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'accepted' | 'declined' | 'cancelled'
  created_at TEXT DEFAULT (datetime('now')),
  responded_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_mentor_req_mentor ON mentor_requests(mentor_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_mentor_req_mentee ON mentor_requests(mentee_profile_id);
```

### API

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /api/mentors` | GET | Public | List profiles where `mentor_available = 1`, optional `?topic=` filter against `mentor_topics`, paginated |
| `POST /api/mentors/:id/request` | POST | Authenticated | Mentee creates `mentor_requests` (cannot request self; rate limit) |
| `GET /api/mentor-requests/incoming` | GET | Authenticated | Mentor sees pending for their `profileId` |
| `GET /api/mentor-requests/outgoing` | GET | Authenticated | Mentee sees their requests |
| `PATCH /api/mentor-requests/:id` | PATCH | Authenticated | Mentor accepts/declines; mentee can cancel if pending |

### Frontend

- **`/people`**: Filter **Mentors**; badge on `PersonCard`.
- **`/people/:id`**: If mentor, **Request intro** button → short form (message).
- **Account area** (or `/people/:id` for self): **Mentor mode** toggle (`mentor_available`) + **topics** editor on profile edit.
- **Notifications**: **Slack-first** for admin (and per-event pings). **Email deferred** (deliverability/compliance); in-app inbox = Phase 4 candidate.

### Slack

- `📬 Mentor request: Alex → Sam (pending)`

---

## Sub-project C: Organizations v1

### Problem

Strategic spec lists **organization profiles** and richer **map layers**. Phase 3 delivers **readable org pages** and **linkage**; deep map taxonomy can stay minimal.

### Data model

```sql
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,              -- 'education' | 'company' | 'community' | 'government' | 'other'
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  location TEXT,
  lat REAL,
  lng REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS organization_members (
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  PRIMARY KEY (organization_id, profile_id)
);

CREATE TABLE IF NOT EXISTS organization_projects (
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  PRIMARY KEY (organization_id, project_id)
);
```

Optional later: `organization_events`, sponsor flags.

### API

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `GET /api/organizations` | GET | Public | List + filter by `type` |
| `GET /api/organizations/:slug` | GET | Public | Detail + linked members/projects |
| `POST /api/organizations` | POST | Admin | Create org |
| `PATCH /api/organizations/:id` | PATCH | Admin | Update |
| `POST /api/organizations/:id/members` | POST | Admin only (v1) | Link profile — **delegated org managers = Phase 4+** |

### Frontend

- **`/orgs`**, **`/orgs/:slug`** — marketing-grade layout consistent with design system.
- **Seed (institutional partnerships):** Treat **Northwestern Polytechnic (NWP)** and **Side Centre** (and e.g. **Innovate Northwest**) as **real org pages** with linked members/projects where accurate. Makes partnerships **visible** on the platform — useful in conversations with Tanya, Side Centre, etc.: *“This is how your students and programs show up next to the builder community.”*
- **Map (optional Phase 3):** If `lat/lng` set, show org pins on existing Leaflet page with filter.

---

## Sub-project D: Polish & admin signals

### Activity feed extensions

Add activity types (insert from relevant handlers):

- `business_interest`, `business_matched`, `mentor_request`, `org_joined` (if public)

Keep **noise low**; same philosophy as Phase 2 votes.

### Admin dashboard enhancements

- **Business**: interest leaderboard; stale requests (align with Slack digest: **> 48h** unmatched; optional **> 14d** highlight for admin UI).
- **Mentors**: pending mentor_requests count.
- **Orgs**: CRUD shortcuts.

### Analytics (minimal)

- `GET /api/stats` extension: counts for open requests, pending interests, pending mentor requests.
- No third-party analytics requirement; optional Cloudflare Web Analytics.

---

## Security & abuse (Phase 3)

- **Rate limits** (KV counters): interest submissions, mentor requests, public `GET` list if abused.
- **Redaction**: business contact fields; mentor messages (no HTML; length caps).
- **Authorization**: every PATCH checks profile ownership or admin via D1 `is_admin`.
- **Spam**: admin can hide or delete requests (add `deleted_at` or status `archived` if needed).

---

## Rollout checklist

1. Ship **A** (business interests + admin assign + Slack).
2. Ship **B** (mentor opt-in + requests + Slack).
3. Ship **C** (orgs list/detail + seed + optional map).
4. Iterate **D** (activity + stats + admin UX).

---

## Resolved decisions

| Topic | Resolution |
|-------|------------|
| **Business contact visibility** | **Redact email/phone until matched through the platform** (and always for public/non-admin until then). **Not** visible to interested-but-unmatched builders — preserves matchmaking value vs bulletin-board dynamics. |
| **Multiple builders per request** | **v1: single `matched_profile_id` only.** Forces a deliberate “best fit” choice; that process is the social intelligence to encode. **v2:** optional `business_request_assignments` join table once patterns are clear. |
| **Mentor opt-in** | **`mentor_available` column** — cleaner than `role === mentor` alone for people who both build and mentor. |
| **Mentor discovery** | **`mentor_topics` JSON** on profile (like skills) + filter on mentor directory. |
| **Org editing** | **Admin-only** for Phase 3 — not enough orgs to justify delegated managers; avoids extra auth complexity. |
| **Email notifications** | **Defer** — Slack covers the admin feedback loop; email is deliverability/compliance scope (Phase 3.5+ / Phase 2 email auth stack when ready). |

---

## Relationship to Phase 4 (preview)

**Intelligence Layer** (ElystrumCore): ranked builder suggestions for a request, semantic skill match, summarization of intel, optional in-app assistant.

**Phase 3 should emit clean events** (activity rows, Slack, structured D1 history) so Phase 4 can apply heuristics/ML **without rewriting the pipeline**.

Every **manual match**, **interest**, **mentor request**, and **status change** in Phase 3 is **training signal**: you are building the intelligence layer’s dataset **now**, using **human decisions** instead of algorithms — the “automate it” pass comes when volume justifies it.

---

## Document history

| Date | Change |
|------|--------|
| 2026-03-22 | Initial Phase 3 opportunity layer plan |
| 2026-03-22 | Resolved decisions, mentor_topics, privacy lock, Slack digest, NWP/Side Centre seed narrative, Phase 4 training-data note |
