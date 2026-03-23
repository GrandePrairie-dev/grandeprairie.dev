# Phase 3: Opportunity Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add business→builder matchmaking with interest expression and admin assignment, mentor matching with opt-in/request/accept flow, organization profiles with member/project links, and expanded activity/Slack signals.

**Architecture:** Extends Phase 2 auth + admin infrastructure. New D1 tables for interests, mentor requests, and organizations. API endpoints follow existing patterns (shared Env, middleware user context, admin D1 checks). Frontend adds detail pages for business requests and organizations, mentor directory filter, and expanded admin panel.

**Tech Stack:** Cloudflare Pages Functions, D1, KV, React 19, TanStack Query, wouter

**Spec:** `docs/superpowers/specs/2026-03-22-phase3-opportunity-layer.md`

---

## Task 1: DB migration for Phase 3 tables

**Files:**
- Create: `db/migrations/003-phase3-opportunity.sql`

- [ ] **Step 1: Create migration**

```sql
-- Business request interests
CREATE TABLE IF NOT EXISTS business_request_interests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_request_id INTEGER NOT NULL REFERENCES business_requests(id) ON DELETE CASCADE,
  profile_id INTEGER NOT NULL REFERENCES profiles(id),
  note TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(business_request_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_bri_request ON business_request_interests(business_request_id);
CREATE INDEX IF NOT EXISTS idx_bri_profile ON business_request_interests(profile_id);

-- Mentor fields on profiles
ALTER TABLE profiles ADD COLUMN mentor_available INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN mentor_topics TEXT DEFAULT '[]';

-- Mentor requests
CREATE TABLE IF NOT EXISTS mentor_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mentee_profile_id INTEGER NOT NULL REFERENCES profiles(id),
  mentor_profile_id INTEGER NOT NULL REFERENCES profiles(id),
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  responded_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_mentor_req_mentor ON mentor_requests(mentor_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_mentor_req_mentee ON mentor_requests(mentee_profile_id);

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
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

- [ ] **Step 2: Commit**

```bash
git add db/migrations/003-phase3-opportunity.sql
git commit -m "feat: Phase 3 DB migration — interests, mentors, organizations"
```

---

## Task 2: Business request detail + interest API

**Files:**
- Create: `functions/api/business-requests/[id].ts` — GET single request (with redaction)
- Create: `functions/api/business-requests/[id]/interests.ts` — POST interest, GET interests (admin)
- Create: `functions/api/business-requests/[id]/interests/me.ts` — DELETE withdraw interest
- Modify: `functions/api/business-requests/[id]/status.ts` — extend to also set matched_profile_id

- [ ] **Step 1: Create single request endpoint with redaction**

`functions/api/business-requests/[id].ts`:
- GET returns request data
- Redact `contact_email` for non-admin users (replace with null)
- Admin sees full data

- [ ] **Step 2: Create interests endpoints**

`functions/api/business-requests/[id]/interests.ts`:
- POST (authenticated): Insert into `business_request_interests` with `profile_id` from session. 409 if duplicate. Include optional `note` from body.
- GET (admin only): List all interests for this request with profile name/skills joined.

- [ ] **Step 3: Create withdraw interest endpoint**

`functions/api/business-requests/[id]/interests/me.ts`:
- DELETE (authenticated): Remove own interest row.

- [ ] **Step 4: Extend status endpoint to support matched_profile_id**

Modify `functions/api/business-requests/[id]/status.ts`:
- Accept optional `matched_profile_id` in body alongside `status`
- When setting `matched`, require `matched_profile_id`
- Add Slack notification for match: `🤝 Request #N matched to {name}`

- [ ] **Step 5: Add Slack for new interests**

In the POST interests handler, add: `notifySlack(env, "🔔 ${name} expressed interest in request #${id} — ${businessName}")`

- [ ] **Step 6: Commit**

```bash
git add functions/api/business-requests/
git commit -m "feat: business request detail, interests, matching, Slack"
```

---

## Task 3: Business page frontend — browse requests + express interest

**Files:**
- Modify: `src/pages/Business.tsx` — add "Open Requests" section with interest CTA
- Create: `src/pages/BusinessDetail.tsx` — request detail + interest form
- Modify: `src/App.tsx` — add `/business/:id` route

- [ ] **Step 1: Update Business page**

Split into two sections:
- Top: "Submit a Request" form (existing)
- Below: "Open Requests" — fetch `/api/business-requests`, filter to `status != 'completed'`, show as cards with business_name, problem excerpt, category badge, interest count (from a new count field or separate query)
- Each card links to `/business/:id`

- [ ] **Step 2: Create BusinessDetail page**

`src/pages/BusinessDetail.tsx`:
- Fetch `/api/business-requests/:id`
- Show: business_name, problem, category, status, date
- If authenticated: "Express Interest" button with optional note textarea
- If already expressed interest: show "Interest submitted" state
- Contact info hidden (redacted by API)

- [ ] **Step 3: Add route**

Add `<Route path="/business/:id" component={BusinessDetail} />` to App.tsx

- [ ] **Step 4: Commit**

```bash
git add src/pages/Business.tsx src/pages/BusinessDetail.tsx src/App.tsx
git commit -m "feat: business request browsing, detail page, express interest"
```

---

## Task 4: Admin — business interests + matching UI

**Files:**
- Modify: `src/pages/Admin.tsx`

- [ ] **Step 1: Enhance Requests tab**

In the Admin page Requests tab:
- Show interest count badge on each request
- Add "View Interests" button that fetches `GET /api/business-requests/:id/interests`
- Show interests in an expandable section: profile name, skills, note, date
- "Assign as Match" button next to each interest: calls PATCH with `{ status: "matched", matched_profile_id: profileId }`
- Show current matched builder name if set

- [ ] **Step 2: Commit**

```bash
git add src/pages/Admin.tsx
git commit -m "feat: admin business interests view + matching assignment"
```

---

## Task 5: Mentor matching — API + profile fields

**Files:**
- Modify: `functions/api/profiles/[id]/edit.ts` — accept mentor_available + mentor_topics
- Create: `functions/api/mentors.ts` — list mentors
- Create: `functions/api/mentors/[id]/request.ts` — request intro
- Create: `functions/api/mentor-requests/incoming.ts` — mentor's pending
- Create: `functions/api/mentor-requests/outgoing.ts` — mentee's requests
- Create: `functions/api/mentor-requests/[id].ts` — accept/decline/cancel

- [ ] **Step 1: Update profile edit to include mentor fields**

Add `mentor_available` (0/1) and `mentor_topics` (JSON array) to the PATCH handler in `functions/api/profiles/[id]/edit.ts`.

- [ ] **Step 2: Create mentors list endpoint**

`functions/api/mentors.ts`:
- GET public: `SELECT * FROM profiles WHERE mentor_available = 1`
- Optional `?topic=` filter: check if topic is in `mentor_topics` JSON array

- [ ] **Step 3: Create mentor request endpoint**

`functions/api/mentors/[id]/request.ts`:
- POST authenticated
- Cannot request self
- Insert into `mentor_requests` with mentee_profile_id from session
- Slack: `📬 Mentor request: {mentee} → {mentor}`

- [ ] **Step 4: Create incoming/outgoing endpoints**

`functions/api/mentor-requests/incoming.ts` — GET auth'd, filter by mentor_profile_id = session user
`functions/api/mentor-requests/outgoing.ts` — GET auth'd, filter by mentee_profile_id = session user

- [ ] **Step 5: Create accept/decline/cancel endpoint**

`functions/api/mentor-requests/[id].ts`:
- PATCH auth'd
- Mentor can accept/decline their own incoming requests
- Mentee can cancel their own outgoing pending requests
- Updates `status` and `responded_at`

- [ ] **Step 6: Commit**

```bash
git add functions/api/profiles/[id]/edit.ts functions/api/mentors.ts functions/api/mentors/ functions/api/mentor-requests/
git commit -m "feat: mentor matching API — list, request, accept/decline"
```

---

## Task 6: Mentor frontend — directory, request button, profile toggle

**Files:**
- Modify: `src/pages/EditProfile.tsx` — add mentor toggle + topics
- Modify: `src/pages/People.tsx` — add mentor filter
- Modify: `src/pages/PersonProfile.tsx` — request intro button
- Modify: `src/pages/Students.tsx` — use real mentor API

- [ ] **Step 1: Add mentor fields to EditProfile**

Add to the form:
- "Available as mentor" toggle (checkbox or switch)
- "Mentor topics" input (comma-separated, same pattern as skills)

- [ ] **Step 2: Add mentor filter to People page**

Add a "Mentors" filter option or a dedicated toggle that filters `mentor_available = 1`.

- [ ] **Step 3: Add request button to PersonProfile**

If viewing a mentor's profile and logged in (and not self): show "Request Intro" button + optional message textarea.

- [ ] **Step 4: Update Students page**

Replace the current mentor section (which queries all profiles and filters by role/badge) with a fetch to `GET /api/mentors`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/EditProfile.tsx src/pages/People.tsx src/pages/PersonProfile.tsx src/pages/Students.tsx
git commit -m "feat: mentor UI — directory filter, profile toggle, request intro"
```

---

## Task 7: Organizations — API + seed data

**Files:**
- Create: `functions/api/organizations.ts` — list + create
- Create: `functions/api/organizations/[slug].ts` — detail with members/projects
- Create: `functions/api/admin/organizations/[id].ts` — admin update
- Create: `functions/api/admin/organizations/[id]/members.ts` — link profiles
- Create: `db/seed-orgs.sql` — seed NWP, Innovate Northwest, etc.

- [ ] **Step 1: Create org list + create endpoints**

`functions/api/organizations.ts`:
- GET public: list all, optional `?type=` filter
- POST admin: create org with slug, name, type, description, website_url, location, lat, lng

- [ ] **Step 2: Create org detail endpoint**

`functions/api/organizations/[slug].ts`:
- GET public: org + joined members (from organization_members + profiles) + joined projects

- [ ] **Step 3: Create admin org management**

Admin PATCH for updates, POST for adding members.

- [ ] **Step 4: Create seed data**

`db/seed-orgs.sql`:
```sql
INSERT INTO organizations (slug, name, type, description, website_url, location) VALUES
('nwp', 'Northwestern Polytechnic', 'education', 'Computing Science degree with AI, cloud, networking, and big data tracks. Venture AI events. Trades apprenticeships.', 'https://nwpolytech.ca', 'Grande Prairie, AB'),
('innovate-nw', 'Innovate Northwest', 'community', 'Mentorship, accelerators, and ecosystem access for Peace Region startups and tech businesses.', 'https://innovatenorthwest.ca', 'Grande Prairie, AB'),
('gp-chamber', 'GP Chamber of Commerce', 'community', 'Business network, advocacy, and community events for Grande Prairie.', 'https://grandeprairiechamber.com', 'Grande Prairie, AB'),
('grandeprairie-dev', 'GrandePrairie.dev', 'community', 'The digital commons for builders in the Peace Region.', 'https://grandeprairie.dev', 'Grande Prairie, AB');
```

- [ ] **Step 5: Commit**

```bash
git add functions/api/organizations.ts functions/api/organizations/ functions/api/admin/organizations/ db/seed-orgs.sql
git commit -m "feat: organizations API + seed data (NWP, Innovate NW, Chamber, GP.dev)"
```

---

## Task 8: Organizations frontend — list + detail pages

**Files:**
- Create: `src/pages/Organizations.tsx` — org directory
- Create: `src/pages/OrgDetail.tsx` — org detail with members/projects
- Modify: `src/App.tsx` — add `/orgs` and `/orgs/:slug` routes
- Modify: `src/components/Sidebar.tsx` — add Organizations to nav

- [ ] **Step 1: Create Organizations list page**

Grid of org cards: name, type badge, description, website link. Filter by type.

- [ ] **Step 2: Create OrgDetail page**

Org header (name, type, description, website), linked members section, linked projects section.

- [ ] **Step 3: Add routes and sidebar nav**

Add routes to App.tsx. Add "Organizations" item to sidebar under "Connect" group (Building2 icon, `/orgs`).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Organizations.tsx src/pages/OrgDetail.tsx src/App.tsx src/components/Sidebar.tsx
git commit -m "feat: organizations pages — directory and detail with member/project links"
```

---

## Task 9: Activity + Slack extensions + stats

**Files:**
- Modify: `functions/api/business-requests/[id]/interests.ts` — log activity
- Modify: `functions/api/business-requests/[id]/status.ts` — log activity on match
- Modify: `functions/api/mentors/[id]/request.ts` — log activity
- Modify: `functions/api/stats.ts` — extend with opportunity counts

- [ ] **Step 1: Add activity logging**

- Business interest: `logActivity(env, "business_interest", profileId, "business_request", requestId, summary)`
- Business matched: `logActivity(env, "business_matched", matchedProfileId, "business_request", requestId, summary)`
- Mentor request: `logActivity(env, "mentor_request", menteeId, "profile", mentorId, summary)`

- [ ] **Step 2: Extend stats endpoint**

Add to `GET /api/stats`:
- `open_requests`: count business_requests WHERE status IN ('new', 'reviewed')
- `pending_interests`: count business_request_interests WHERE status = 'pending'
- `mentors`: count profiles WHERE mentor_available = 1
- `pending_mentor_requests`: count mentor_requests WHERE status = 'pending'

- [ ] **Step 3: Commit**

```bash
git add functions/api/business-requests/ functions/api/mentors/ functions/api/stats.ts
git commit -m "feat: activity logging for matches/mentors, extended stats"
```

---

## Task 10: Migrations + deploy

- [ ] **Step 1: Run migration on remote D1**

```bash
wrangler d1 execute grandeprairie-dev-db --file=db/migrations/003-phase3-opportunity.sql --remote
```

- [ ] **Step 2: Seed organizations**

```bash
wrangler d1 execute grandeprairie-dev-db --file=db/seed-orgs.sql --remote
```

- [ ] **Step 3: Build and deploy**

```bash
npm run build && npm run pages:deploy
```

- [ ] **Step 4: Push to GitHub**

```bash
git push origin main
```
