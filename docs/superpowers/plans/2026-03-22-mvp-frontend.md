# GrandePrairie.dev MVP Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 5-page MVP (Home, People, Ideas, Map, Calendar) with the Industrial Builder design system, Breathing Industrial sidebar shell, and all supporting API endpoints.

**Architecture:** React 19 SPA with Vite, Tailwind CSS + shadcn/ui components, wouter for routing. Cloudflare Pages Functions for REST API backed by D1 (SQLite). App shell is a sidebar + main content layout. Design follows "Industrial Builder" aesthetic — dark mode first, Boreal Spruce/Prairie Amber/Aurora Teal palette, 6px radius, uppercase group labels.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 3, shadcn/ui (Radix), Lucide icons, Leaflet + react-leaflet, TanStack Query, wouter, Cloudflare Pages Functions, D1

**Spec:** `docs/superpowers/specs/2026-03-22-mvp-frontend-design.md`

---

## Task 1: Font loading + design token refinements

**Files:**
- Modify: `index.html`
- Modify: `src/styles/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add Google Fonts stylesheet to index.html**

Add after the preconnect links:
```html
<link href="https://fonts.googleapis.com/css2?family=Geist+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Note: Geist Sans may not be on Google Fonts yet. If so, use `https://cdn.jsdelivr.net/npm/geist@1/dist/fonts/geist-sans/style.css` for Geist, and keep Inter + JetBrains Mono on Google Fonts.

- [ ] **Step 2: Update tailwind.config.ts radius to 6px**

Change `--radius` from `0.5rem` to `0.375rem` (6px) in the CSS variables, and ensure `borderRadius` extensions use it.

- [ ] **Step 3: Add sidebar and elevation tokens to globals.css**

Add to dark mode:
```css
--sidebar: 220 20% 7%;        /* #111518 */
--sidebar-foreground: 215 15% 91%;
--sidebar-border: 215 18% 15%;
```

Add to both modes:
```css
--elevate-1: rgba(255,255,255, 0.04);
--elevate-2: rgba(255,255,255, 0.09);
```

- [ ] **Step 4: Verify fonts load and commit**

Run: `npm run dev`, open browser, inspect element, confirm Geist/Inter/JetBrains render.

```bash
git add index.html src/styles/globals.css tailwind.config.ts
git commit -m "feat: load fonts and refine design tokens for Industrial Builder"
```

---

## Task 2: Install shadcn/ui components

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/select.tsx`
- Create: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/toast.tsx` (replace stub)
- Create: `src/components/ui/sheet.tsx`
- Create: `src/components/ui/skeleton.tsx`
- Modify: `src/components/ui/toaster.tsx` (replace placeholder)

- [ ] **Step 1: Install shadcn/ui components via CLI**

```bash
npx shadcn@latest add button card badge input textarea label dialog select tabs toast sheet skeleton --yes
```

If the CLI doesn't work with the current config, install each manually from the shadcn/ui registry.

- [ ] **Step 2: Verify the toaster stub is replaced with real implementation**

Check that `src/components/ui/toaster.tsx` now exports a real `Toaster` component (not `return null`).

- [ ] **Step 3: Build check and commit**

```bash
npm run build
git add src/components/ui/ package.json package-lock.json
git commit -m "feat: install shadcn/ui component library"
```

---

## Task 3: DB schema additions + seed data

**Files:**
- Modify: `db/schema.sql`
- Create: `db/seed.sql`

- [ ] **Step 1: Add comments table and missing columns to schema.sql**

Append to end of `db/schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  author_id INTEGER REFERENCES profiles(id),
  idea_id INTEGER REFERENCES ideas(id),
  project_id INTEGER REFERENCES projects(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_idea ON comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_comments_project ON comments(project_id);
```

Note: SQLite doesn't support `ALTER TABLE ADD COLUMN` in a way that's idempotent. For the MVP, the existing schema columns are sufficient — `profiles` already has `skills`, `badges`, `links`; `events` has all needed fields. The `looking_for`, `availability`, `location`, `interests` columns for profiles and `host` for events can be added as a follow-up migration. The seed data will only use existing columns.

- [ ] **Step 2: Create db/seed.sql with sample data**

Create `db/seed.sql` with ~10 profiles (mix of roles), ~8 ideas (mix of categories, some featured), ~5 events (upcoming dates), ~4 intel items, and ~3 business requests. Use realistic Grande Prairie / Peace Region content. Example:

```sql
-- Profiles
INSERT INTO profiles (name, username, title, role, skills, badges, links, is_featured, is_admin) VALUES
('CJ Elliott', 'cjelliott', 'Founder, GrandePrairie.dev', 'founder', '["TypeScript","React","Cloudflare","AI"]', '["founder"]', '{"github":"cjelliott","linkedin":"cjelliott"}', 1, 1),
('Sarah Chen', 'sarahc', 'Full-Stack Developer', 'developer', '["Python","Django","PostgreSQL","Docker"]', '[]', '{"github":"sarahchen"}', 1, 0),
('Mike Blackfoot', 'mikeb', 'Journeyman Electrician & IoT Hobbyist', 'trades', '["Electrical","PLC","Arduino","Home Automation"]', '[]', '{}', 0, 0),
('Aisha Patel', 'aishap', 'CS Student, NW Polytechnic', 'student', '["Java","Python","Machine Learning"]', '[]', '{}', 0, 0),
('Derek Olsen', 'dereko', 'Pipeline Operations Manager', 'operator', '["SCADA","Data Analysis","Safety Systems"]', '[]', '{}', 1, 0),
('Lisa Makokis', 'lisam', 'Senior Developer & Community Mentor', 'mentor', '["JavaScript","React","Node.js","Career Coaching"]', '["mentor"]', '{"linkedin":"lisamakokis","website":"lisamakokis.dev"}', 1, 0),
('James Whitford', 'jamesw', 'Startup Founder, AgriSense', 'founder', '["Agtech","Computer Vision","Business Development"]', '[]', '{"website":"agrisense.ca"}', 0, 0),
('Priya Sharma', 'priyas', 'Data Scientist, Energy Sector', 'developer', '["Python","R","Machine Learning","Tableau"]', '[]', '{"github":"priyasharma"}', 0, 0),
('Tyler Running Rabbit', 'tylerr', 'Web Developer & Designer', 'developer', '["React","Figma","Tailwind","UI/UX"]', '[]', '{"github":"tylerrunningrabbit"}', 0, 0),
('Emma Bouchard', 'emmab', 'Mechatronics Student, GPRC', 'student', '["C++","Robotics","3D Printing","CAD"]', '[]', '{}', 0, 0);

-- Ideas
INSERT INTO ideas (title, description, category, author_id, votes, status, is_featured, tags) VALUES
('Field Data Collection AI', 'Replace paper forms with AI-powered mobile data capture for oil & gas inspections. Use OCR and ML to auto-fill safety checklists from photos.', 'ai_use_case', 1, 14, 'open', 1, '["Oil & Gas","Mobile","OCR"]'),
('GP Cowork Finder', 'Interactive map of coworking-friendly spots in Grande Prairie — cafes, library, spaces with good wifi and power.', 'problem', 9, 9, 'open', 1, '["Map","Community","Coworking"]'),
('Predictive Maintenance for Rigs', 'Use sensor data and ML models to predict equipment failures on drilling rigs before they happen.', 'ai_use_case', 5, 7, 'open', 0, '["ML","IoT","Industrial"]'),
('Student Mentorship Matching', 'Platform to match NWP/GPRC students with local tech mentors based on skills and career interests.', 'student_idea', 4, 6, 'open', 0, '["Mentorship","Students","Matching"]'),
('Automated Safety Compliance', 'Computer vision for PPE detection on construction and oil field sites. Alert when workers enter zones without proper equipment.', 'field_pain_point', 5, 5, 'open', 0, '["Safety","CV","Construction"]'),
('Local Delivery Optimization', 'ML-driven route optimization for Northern Alberta delivery challenges — weather, distances, seasonal roads.', 'startup', 8, 4, 'open', 0, '["Logistics","ML","Optimization"]'),
('Community Job Board', 'Tech-focused job board for Grande Prairie and Peace Region. Filter by remote-friendly, trades, tech, etc.', 'business_need', 6, 3, 'open', 0, '["Jobs","Community","HR"]'),
('Open Data Portal for GP', 'Aggregate public datasets about Grande Prairie — census, weather, economic indicators — into a developer-friendly API.', 'problem', 2, 2, 'open', 0, '["Open Data","API","Civic Tech"]');

-- Events
INSERT INTO events (title, description, category, start_time, location, organizer_id) VALUES
('Tech & Coffee', 'Casual morning meetup. Bring your laptop, grab a coffee, hack on projects together.', 'meetup', datetime('now', '+6 days', 'start of day', '+9 hours'), 'Beans & Bytes Café, GP', 1),
('Intro to Machine Learning', 'Workshop covering ML fundamentals with Python. Bring a laptop with Python installed.', 'workshop', datetime('now', '+13 days', 'start of day', '+18 hours'), 'NW Polytechnic Room 204', 6),
('GP Hackathon: Build for Local', '24-hour hackathon focused on solving Grande Prairie problems. Teams of 2-4.', 'hackathon', datetime('now', '+27 days', 'start of day', '+9 hours'), 'Innovation Hub, GP', 1),
('Lightning Talks Night', '5-minute talks on anything tech. Sign up on the day. Pizza provided.', 'talk', datetime('now', '+20 days', 'start of day', '+19 hours'), 'GP Public Library Meeting Room', 9),
('Founders Lunch', 'Monthly lunch for startup founders and aspiring entrepreneurs in the Peace Region.', 'social', datetime('now', '+34 days', 'start of day', '+12 hours'), 'Prairie Bistro, GP', 7);

-- Intel
INSERT INTO intel (title, body, category, source_url, author_id, is_pinned, is_featured, tags) VALUES
('NW Polytechnic hiring 2 dev instructors', 'Northwestern Polytechnic is looking for instructors in web development and data science. Full-time positions starting Fall 2026.', 'hiring', NULL, 6, 0, 1, '["NWP","Teaching","Hiring"]'),
('Greenview AI Data Centre Update', 'The proposed $70B AI data centre project in Greenview has entered Phase 2 environmental review. Could bring 500+ tech jobs to the region.', 'industry', NULL, 1, 1, 1, '["AI","Data Centre","Greenview"]'),
('GrandePrairie.dev is live!', 'Welcome to the community platform. Start by creating a profile and sharing your first idea.', 'project_activity', NULL, 1, 1, 0, '["Launch","Community"]'),
('Free AWS Credits for Startups', 'AWS Activate is offering $10K in credits for early-stage startups. Great for Peace Region founders building cloud-native products.', 'opportunity', NULL, 2, 0, 0, '["AWS","Startups","Funding"]');

-- Business Requests
INSERT INTO business_requests (business_name, contact_name, contact_email, problem, category, status) VALUES
('Prairie Mechanical Ltd', 'Ron Tessier', 'ron@prairiemech.ca', 'We still use paper work orders. Need a mobile app that our techs can use in the field — even offline. Must work with gloves.', 'automation', 'new'),
('Northern Grounds Coffee', 'Jess Park', 'jess@northerngrounds.ca', 'Our website is from 2018 and doesn''t show our menu or hours properly on mobile. Need a modern refresh.', 'website', 'new'),
('GP Grain Elevators Co-op', 'Dan Makokis', 'dan@gpgrain.ca', 'We want to use drone imagery and AI to estimate grain bin levels instead of climbing ladders to check.', 'ai', 'new');

-- Student Resources
INSERT INTO student_resources (title, description, resource_type, difficulty, link, tags) VALUES
('Build Your First React App', 'Step-by-step tutorial to build a todo app with React and deploy to Cloudflare Pages.', 'beginner_project', 'beginner', NULL, '["React","Cloudflare","Tutorial"]'),
('Python for Data Science Path', 'Curated learning path from Python basics through pandas, numpy, and matplotlib.', 'learning_path', 'intermediate', NULL, '["Python","Data Science","Learning"]'),
('NWP Summer Dev Internship', 'Northwestern Polytechnic''s summer internship program for 2nd year CS students.', 'internship', NULL, NULL, '["NWP","Internship","2026"]');
```

- [ ] **Step 3: Apply schema and seed locally**

```bash
npm run db:migrate:local
npm run db:seed:local
```

- [ ] **Step 4: Commit**

```bash
git add db/schema.sql db/seed.sql
git commit -m "feat: add comments table and seed data for MVP"
```

---

## Task 4: API endpoints — profiles, ideas (single + featured + vote), projects, events, comments

**Files:**
- Create: `functions/api/profiles/[id].ts`
- Create: `functions/api/profiles/featured.ts`
- Create: `functions/api/ideas/[id].ts`
- Create: `functions/api/ideas/featured.ts`
- Create: `functions/api/ideas/[id]/vote.ts`
- Create: `functions/api/projects.ts`
- Create: `functions/api/events/index.ts`
- Create: `functions/api/comments.ts`

- [ ] **Step 1: Create single-profile endpoint**

`functions/api/profiles/[id].ts`:
```typescript
interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const profile = await env.DB.prepare("SELECT * FROM profiles WHERE id = ?")
    .bind(params.id).first();
  if (!profile) return new Response("Not found", { status: 404 });
  return Response.json(profile);
};
```

- [ ] **Step 2: Create featured-profiles endpoint**

`functions/api/profiles/featured.ts`:
```typescript
interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT * FROM profiles WHERE is_featured = 1 ORDER BY created_at DESC"
  ).all();
  return Response.json(results);
};
```

- [ ] **Step 3: Create single-idea, featured-ideas, and vote endpoints**

Similar pattern: `functions/api/ideas/[id].ts` (GET single), `functions/api/ideas/featured.ts` (GET featured), `functions/api/ideas/[id]/vote.ts` (POST increments votes by 1).

- [ ] **Step 4: Create projects list endpoint**

`functions/api/projects.ts`:
```typescript
interface Env { DB: D1Database; }

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT * FROM projects ORDER BY created_at DESC"
  ).all();
  return Response.json(results);
};
```

- [ ] **Step 5: Create events POST endpoint**

`functions/api/events/index.ts`: exports `onRequestPost` that inserts a new event.

- [ ] **Step 6: Create comments endpoint**

`functions/api/comments.ts`: GET with `?idea_id=N` filter, POST to create comment.

- [ ] **Step 7: Build check and commit**

```bash
npm run build
git add functions/
git commit -m "feat: add remaining API endpoints for MVP (profiles, ideas, votes, events, comments)"
```

---

## Task 5: Shared types + API helpers

**Files:**
- Create: `src/lib/types.ts`
- Modify: `src/lib/queryClient.ts`

- [ ] **Step 1: Create shared TypeScript types**

`src/lib/types.ts` — define interfaces for `Profile`, `Idea`, `Project`, `Event`, `IntelPost`, `BusinessRequest`, `StudentResource`, `Comment`, and the `Stats` response. Also define constants for role lists, idea categories, event categories, and their display labels.

- [ ] **Step 2: Add apiRequest helper for POST/PATCH**

Ensure `src/lib/queryClient.ts` exports `apiRequest` (already exists) and add a `useApiMutation` pattern or just use `useMutation` directly in pages.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/queryClient.ts
git commit -m "feat: add shared types and API constants"
```

---

## Task 6: App shell — Sidebar + layout + theme toggle

**Files:**
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/MobileHeader.tsx`
- Create: `src/hooks/useTheme.ts`
- Create: `src/hooks/useMobile.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create useMobile hook**

`src/hooks/useMobile.ts`: Returns boolean, breakpoint at 768px. Uses `matchMedia` listener.

- [ ] **Step 2: Create useTheme hook**

`src/hooks/useTheme.ts`: Toggles `dark` class on `<html>`. Persists to `localStorage`. Defaults to dark.

- [ ] **Step 3: Build the Sidebar component**

`src/components/Sidebar.tsx`:
- 210px width, bg `#111518`, border-right
- Logo: diamond icon + "GRANDEPRAIRIE" / ".DEV" text
- Nav groups (Explore, Build, Connect) with group labels (uppercase, River Slate, 9px)
- Nav items with Lucide icons (Home, MapPin, Users, Lightbulb, Calendar)
- Active state: left-border 2px Aurora Teal, tinted bg, teal text (use `useLocation` from wouter)
- Footer: user initials avatar, dark/light toggle
- On mobile: render inside a `Sheet` component (slide from left)

- [ ] **Step 4: Create MobileHeader**

`src/components/MobileHeader.tsx`: Sticky bar, hamburger button that opens sidebar sheet. Only renders on mobile.

- [ ] **Step 5: Wire up App.tsx**

Update `src/App.tsx`:
- Import Sidebar and MobileHeader
- Layout: `flex h-screen w-full` → Sidebar (desktop) + `flex-col flex-1` (MobileHeader + main + scroll)
- Uncomment the 5 MVP routes (Home, People, People/:id, Ideas, Ideas/:id, Map, Calendar)
- Import the page components (can be placeholder `() => <div>TODO</div>` initially)

- [ ] **Step 6: Verify layout renders and commit**

```bash
npm run dev
# Check: sidebar renders, nav items visible, active state works, mobile sheet works
npm run build
git add src/components/ src/hooks/ src/App.tsx
git commit -m "feat: app shell with Industrial Builder sidebar and theme toggle"
```

---

## Task 7: Home page — Aurora Hero + featured content

**Files:**
- Create: `src/components/AuroraHero.tsx`
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Build AuroraHero component**

`src/components/AuroraHero.tsx`:
- Centered layout with `position: relative`
- Aurora gradient: two radial gradients (teal center-top, amber top-right) as absolute-positioned divs
- Coordinates badge: `55°N · 118°W` in Boreal Spruce chip
- Status badge: `Now Open` in Prairie Amber chip
- Heading: `BUILD REAL THINGS` (uppercase, text-3xl, font-weight 800, tracking-tight)
- Subheading: muted text
- Two CTAs: primary button (Boreal Spruce bg, Aurora Teal text, 1px border `#4A7C6A`) + outline button
- Stats row: fetched from `/api/stats`, each stat colored (teal/amber/white/rig-amber)
- Hero image: `<img>` behind content with low opacity, selected by current month. Fallback to CSS-only gradient.

- [ ] **Step 2: Build full Home page**

`src/pages/Home.tsx`:
- AuroraHero at top
- Featured Ideas section: fetch `/api/ideas/featured`, render as bordered cards with vote counts and tags
- Featured Builders section: fetch `/api/profiles/featured`, render as bordered cards with initials avatar, role badge, skills
- Next Event: fetch `/api/events/upcoming` (take first), render as card with date, title, category, location
- Quick links grid to People, Ideas, Map, Calendar

- [ ] **Step 3: Verify and commit**

```bash
npm run build
git add src/components/AuroraHero.tsx src/pages/Home.tsx
git commit -m "feat: home page with Aurora Hero and featured content sections"
```

---

## Task 8: People page + profile detail

**Files:**
- Create: `src/pages/People.tsx`
- Create: `src/pages/PersonProfile.tsx`
- Create: `src/components/PersonCard.tsx`
- Create: `src/components/RoleFilter.tsx`
- Create: `src/components/SearchInput.tsx`

- [ ] **Step 1: Build RoleFilter component**

Generic filter bar: array of values + labels, renders as horizontal buttons with `variant={selected ? "default" : "secondary"}` size="sm". Uppercase text.

- [ ] **Step 2: Build SearchInput component**

Input with Lucide `Search` icon prefix, placeholder text, debounced onChange.

- [ ] **Step 3: Build PersonCard component**

Two modes via `featured` prop:
- Featured: bordered card with avatar initial (28px circle, Boreal Spruce bg), name, title, role badge, skills (max 4 + "+N")
- Non-featured: borderless row with divider, same info compact

- [ ] **Step 4: Build People page**

`src/pages/People.tsx`:
- Title "People"
- SearchInput + RoleFilter
- Fetch `/api/profiles`, filter client-side by search term and role
- Render profiles using PersonCard (featured first, then non-featured)
- Empty state when no matches

- [ ] **Step 5: Build PersonProfile page**

`src/pages/PersonProfile.tsx`:
- Fetch `/api/profiles/:id`
- Large initials avatar, name, title, role badge
- Sections: Skills (badges), Bio, Links (GitHub/LinkedIn/website as external links)
- Back link to `/people`
- Loading skeleton while fetching

- [ ] **Step 6: Verify and commit**

```bash
npm run build
git add src/pages/People.tsx src/pages/PersonProfile.tsx src/components/PersonCard.tsx src/components/RoleFilter.tsx src/components/SearchInput.tsx
git commit -m "feat: people directory with search, role filter, and profile detail"
```

---

## Task 9: Ideas page + detail + voting

**Files:**
- Create: `src/pages/Ideas.tsx`
- Create: `src/pages/IdeaDetail.tsx`
- Create: `src/components/IdeaCard.tsx`
- Create: `src/components/VoteButton.tsx`
- Create: `src/components/CommentThread.tsx`

- [ ] **Step 1: Build VoteButton component**

Displays `▲ {count}` in Prairie Amber. On click, POST to `/api/ideas/:id/vote`, optimistic update via TanStack Query `onMutate`.

- [ ] **Step 2: Build IdeaCard component**

Two modes via `featured` prop:
- Featured: bordered card with left accent border (Aurora Teal), title, description (line-clamp-2), category badge, tags, VoteButton
- Non-featured: divider row with title, category badge, VoteButton

- [ ] **Step 3: Build Ideas page**

`src/pages/Ideas.tsx`:
- Title "Ideas" + "Submit Idea" button
- Submit dialog: form with title input, description textarea, category select (from constants), tags input
- Category filter (reuse RoleFilter with idea categories)
- Fetch `/api/ideas`, filter client-side by category
- Render with IdeaCard (featured first)
- Empty state

- [ ] **Step 4: Build CommentThread component**

Fetches `/api/comments?idea_id=N`. Renders list of comments (author name, date, content). Input + "Post Comment" button at bottom. Uses `useMutation` for POST.

- [ ] **Step 5: Build IdeaDetail page**

`src/pages/IdeaDetail.tsx`:
- Fetch `/api/ideas/:id`
- Full description, author info, date, category badge, tags
- VoteButton (large)
- CommentThread below
- Back link to `/ideas`

- [ ] **Step 6: Verify and commit**

```bash
npm run build
git add src/pages/Ideas.tsx src/pages/IdeaDetail.tsx src/components/IdeaCard.tsx src/components/VoteButton.tsx src/components/CommentThread.tsx
git commit -m "feat: ideas board with voting, categories, detail page, and comments"
```

---

## Task 10: Map page

**Files:**
- Create: `src/pages/Map.tsx`

- [ ] **Step 1: Add Leaflet CSS import**

Add to `src/styles/globals.css` or import in Map.tsx:
```css
@import "leaflet/dist/leaflet.css";
```

- [ ] **Step 2: Build Map page**

`src/pages/Map.tsx`:
- Title "Community Map" + subtitle
- Leaflet `MapContainer` centered on `[55.1707, -118.7946]`, zoom 11
- `TileLayer` from OpenStreetMap
- Fetch `/api/profiles`
- For each profile, create a `CircleMarker` at deterministic position:
  - lat: `55.1707 + ((id * 17 % 100) - 50) * 0.003`
  - lng: `-118.7946 + ((id * 31 % 100) - 50) * 0.004`
- Color by role: Developer `#1B6B6D`, Trades `#D4943A`, Student `#28A745`, Founder `#DC3545`, Operator `#6F42C1`, Mentor `#007BFF`, default `#666`
- Popup: name, role, up to 3 skills as badges
- Legend below map: colored circles with role labels
- Radius 6, weight 2, fillOpacity 0.9, color white

- [ ] **Step 3: Verify and commit**

```bash
npm run build
git add src/pages/Map.tsx src/styles/globals.css
git commit -m "feat: community map with role-colored markers and legend"
```

---

## Task 11: Calendar page

**Files:**
- Create: `src/pages/Calendar.tsx`
- Create: `src/components/EventCard.tsx`

- [ ] **Step 1: Build EventCard component**

Two modes:
- Featured/next: bordered card with prominent date (day + month), title, description, category badge, location icon + text, host
- Non-featured: divider row with date, title, category badge, location

Category badge colors: meetup (teal), workshop (amber), hackathon (rig-amber), talk (clear-sky), social (boreal-spruce), other (river-slate)

- [ ] **Step 2: Build Calendar page**

`src/pages/Calendar.tsx`:
- Title "Calendar" + "Add Event" button
- Add Event dialog: form with title, description, category select, datetime-local input, location, host inputs
- POST to `/api/events` on submit, invalidate query, close dialog, toast success
- Category filter (reuse RoleFilter)
- Fetch `/api/events/upcoming`
- First event rendered as featured EventCard, rest as rows
- Empty state: "No upcoming events — Create one to get the community together."

- [ ] **Step 3: Verify and commit**

```bash
npm run build
git add src/pages/Calendar.tsx src/components/EventCard.tsx
git commit -m "feat: calendar page with event creation and category filters"
```

---

## Task 12: Wire up App.tsx routes + final integration

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Import all page components and enable routes**

Uncomment/replace the 5 MVP routes plus detail pages:
```tsx
<Route path="/" component={Home} />
<Route path="/people" component={People} />
<Route path="/people/:id" component={PersonProfile} />
<Route path="/ideas" component={Ideas} />
<Route path="/ideas/:id" component={IdeaDetail} />
<Route path="/map" component={Map} />
<Route path="/calendar" component={Calendar} />
<Route component={NotFound} />
```

- [ ] **Step 2: Full integration test**

```bash
npm run build
npm run pages:dev
```

Test each page manually:
- Home: hero renders, stats load, featured content shows
- People: search and filter work, profile detail loads
- Ideas: submit dialog, voting, detail + comments
- Map: markers render, popups work, legend visible
- Calendar: events list, add event dialog works
- Sidebar: navigation works, active states correct, mobile sheet works
- Theme toggle: dark/light switches correctly

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up all MVP routes and complete integration"
```

---

## Task 13: Deploy and apply remote schema/seed

- [ ] **Step 1: Apply schema and seed to remote D1**

```bash
npm run db:migrate
npm run db:seed
```

- [ ] **Step 2: Deploy to Cloudflare Pages**

```bash
npm run build
npm run pages:deploy
```

- [ ] **Step 3: Push to GitHub (triggers CI deploy)**

```bash
git push origin main
```

- [ ] **Step 4: Verify live site**

Check `https://grandeprairie.dev` loads correctly with seed data.

- [ ] **Step 5: Final commit with any fixes**

```bash
git add -A
git commit -m "chore: deploy MVP with seed data"
git push origin main
```
