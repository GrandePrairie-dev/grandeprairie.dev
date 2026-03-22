# GrandePrairie.dev MVP Frontend Design

## Identity

**Industrial Builder** — "where Filson meets Linear in the boreal forest." Dark mode first. Structural typography (uppercase group labels, tight letter-spacing on headings). 6px border radius. Generous spacing (Breathing Industrial).

### Color System

| Token | Light | Dark | Usage |
|---|---|---|---|
| Primary | Boreal Spruce `#2D4A3E` | `#4A7C6A` | Structural, nav active bg, primary buttons |
| Accent Warm | Prairie Amber `#D4A24E` | `#C4943F` | Highlights, vote counts, featured badges |
| Accent Bright | Aurora Teal `#3DBFA8` | `#34A893` | CTAs, success, stats, active indicators |
| Neutral | River Slate `#4C5B6E` | same | Group labels, secondary text |
| Warning | Rig Amber `#D08770` | same | Event counts, warnings |
| Error | Pipeline Red `#C45B5B` | same | Errors, destructive actions |
| Background | Fresh Snow `#F7F5F2` | Midnight Prairie `#161B22` | Page background |
| Surface | Ice White `#FFFFFF` | Deep Frost `#1E2530` | Cards, elevated surfaces |
| Border | Rime `#D8D4CF` | Permafrost `#2E3742` | Borders, dividers |

### Typography

- **Display/Headings**: Geist Sans (fallback: Cabinet Grotesk, system-ui). `font-display` class.
- **Body**: Inter (fallback: Satoshi, system-ui). `font-sans` class.
- **Code/Mono**: JetBrains Mono. `font-mono` class.
- Load via Google Fonts stylesheet in `index.html`.

### Component Tokens

- Border radius: `6px` (cards, buttons, inputs)
- Active nav: left-border `2px solid aurora-teal`, bg `rgba(45,74,62,0.4)`
- Card (featured): `bg-surface`, `border-1 border-border`, `rounded-[6px]`
- Card (featured) with accent: adds `border-l-2 border-aurora-teal`
- Row (non-featured): no border/bg, `border-b border-border` divider
- Elevation: overlay system (`::after` pseudo with rgba), not shadows

## MVP Scope — 5 Pages

### 1. Home (`/`)

**Aurora Hero Section (centered):**
- Coordinates badge: `55°N · 118°W` in Boreal Spruce chip
- Status badge: `Now Open` in Prairie Amber chip
- Heading: `BUILD REAL THINGS` (uppercase, 30px, font-weight 800, letter-spacing -0.03em)
- Subheading: "The Peace Region's open platform for developers, founders, trades, and students."
- Two CTAs: "Join the Community" (primary), "Explore Ideas →" (outline)
- Stats row below divider: Builders (teal), Ideas (amber), Projects (white), Events (rig-amber)
- Aurora gradient: `radial-gradient(ellipse, rgba(61,191,168,0.12), transparent)` top-center, with smaller amber glow top-right
- Hero images: 3-5 seasonal variants generated via Replicate, rotated by season. CSS gradient as fallback/base layer.

**Below the fold:**
- Featured Ideas section (bordered cards with vote counts, tags)
- Featured Builders section (avatar initials, role, skills)
- Next Event card (date, title, category badge, location)
- Quick links to other pages

### 2. People (`/people`)

- Title: "People"
- Search input: "Search by name or skill..."
- Role filter tabs: All, Developer, Trades, Student, Founder, Operator, Mentor
- **Mixed card treatment:**
  - Featured members → bordered card with avatar initial, name, title, role badge, skills (max 4 + "+N")
  - Non-featured → divider row with same info, compact
- Profile detail page (`/people/:id`): full bio, skills, interests, badges, links (GitHub/LinkedIn/website), "Looking for", location, join date

### 3. Ideas (`/ideas`)

- Title: "Ideas"
- Submit button → dialog with form (title, description, category select, tags)
- Category filter tabs: All, Problems, Startups, AI, Field, Student, Business
- **Mixed card treatment:**
  - Featured ideas → bordered card with left accent border, title, description, category badge, tags, vote count (▲ N in amber)
  - Non-featured → divider rows with title, category, vote count
- Vote button on each idea (POST `/api/ideas/:id/vote`)
- Detail page (`/ideas/:id`): full description, author, date, vote button, comments thread

### 4. Map (`/map`)

- Title: "Community Map" + subtitle "Members across the Grande Prairie region"
- Leaflet map: center 55.1707, -118.7946, zoom 11
- OpenStreetMap tiles
- Color-coded circle markers by role:
  - Developer: `#1B6B6D`, Trades: `#D4943A`, Student: `#28A745`, Founder: `#DC3545`, Operator: `#6F42C1`, Mentor: `#007BFF`
- Markers: 12px circles, white 2px border, shadow
- Popup: name, role, up to 3 skills
- Legend with colored circles
- Marker positions: deterministic scatter from profile ID

### 5. Calendar (`/calendar`)

- Title: "Calendar"
- Add Event button → dialog with form (title, description, category, datetime, location, host)
- Category filter tabs: All, Meetup, Workshop, Hackathon, Talk, Social
- **Mixed card treatment:**
  - Next/featured event → bordered card with date prominence, title, description, category badge, location, host
  - Future events → divider rows with date, title, category badge, location
- Empty state: "No upcoming events — Create one to get the community together."

## App Shell

### Sidebar (210px)

- Background: `#111518` (slightly darker than main bg)
- Border-right: `1px solid #1e2530`

**Logo area (top):**
- Diamond icon in Boreal Spruce square (28px, 6px radius, 1px border `#4A7C6A`)
- "GRANDEPRAIRIE" in white, `.DEV` in Boreal Spruce light below

**Nav groups:**
- Group labels: River Slate, 9px, uppercase, 0.08em letter-spacing
- Nav items: 12px, 7px vertical padding, 6px radius
- Active: left-border 2px Aurora Teal, bg `rgba(45,74,62,0.4)`, text Aurora Teal
- Inactive: text `#8B95A5`, hover bg subtle overlay
- Icons: Lucide icons (Home, MapPin, Users, Lightbulb, Calendar)

**Groups:**
- Explore: Home, Community Map, People
- Build: Ideas
- Connect: Calendar

**Footer:**
- User profile: initials avatar (28px, Boreal Spruce bg), name, role
- Dark/light mode toggle
- Keyboard shortcut hint: ⌘B

### Mobile

- Sidebar hidden by default
- Toggle button in header bar
- Opens as sheet overlay from left, 3/4 width (max `sm`)
- Backdrop overlay `bg-black/80`

### Header (mobile only)

- Sticky top bar with sidebar toggle button
- Minimal — just the hamburger, no duplicated nav

## API Additions Required

Endpoints needed beyond current scaffold:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/profiles/:id` | GET | Single profile |
| `/api/profiles/featured` | GET | Featured profiles |
| `/api/ideas/:id` | GET | Single idea |
| `/api/ideas/featured` | GET | Featured ideas |
| `/api/ideas/:id/vote` | POST | Vote on idea |
| `/api/projects` | GET | List projects (for stats) |
| `/api/events` | POST | Create event |
| `/api/comments` | GET, POST | Comments (filtered by idea_id) |

## DB Schema Additions

```sql
-- Add to existing schema
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  author_id INTEGER REFERENCES profiles(id),
  idea_id INTEGER REFERENCES ideas(id),
  project_id INTEGER REFERENCES projects(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comments_idea ON comments(idea_id);

-- Add missing columns to existing tables
-- profiles: add looking_for, availability, location, interests
-- ideas: (schema is sufficient)
-- projects: add stage, problem_statement, skills_needed, next_session_date
-- events: add host
```

## Hero Image Generation (Replicate)

Generate 3-5 images using a landscape/environment model:

1. **Winter Aurora** — Northern lights (green/teal) over snow-covered boreal forest, Grande Prairie city lights in distance
2. **Summer Midnight Sun** — Golden hour over canola fields, distant treeline, big Alberta sky
3. **Fall Harvest** — Amber/gold canola stubble fields under dramatic cloud formations
4. **Spring Breakup** — Wapiti River with ice breaking up, spruce forest banks, blue sky
5. **Night Prairie** — Stars over flat prairie, single grain elevator silhouette, aurora on horizon

Stored in `public/heroes/`. Served as optimized WebP. Rotated by month:
- Dec-Feb: winter-aurora
- Mar-Apr: spring-breakup
- May-Jul: summer-midnight-sun
- Aug-Sep: fall-harvest
- Oct-Nov: night-prairie

CSS gradient aurora glow remains as the base layer behind/below the image for visual continuity.

## Component Inventory

shadcn/ui components to install:
- Button, Card, Badge, Input, Textarea, Label
- Dialog, Select, Tabs, Toast
- Sheet (mobile sidebar)
- Skeleton (loading states)
- DropdownMenu (user menu future use)

Custom components to build:
- `Sidebar` — grouped nav with collapse
- `SidebarItem` — nav item with active state
- `StatCard` — stat counter with color
- `IdeaCard` / `IdeaRow` — mixed card treatment
- `PersonCard` / `PersonRow` — mixed card treatment
- `EventCard` / `EventRow` — mixed card treatment
- `AuroraHero` — hero section with gradient + image
- `MapView` — Leaflet wrapper with role markers
- `VoteButton` — upvote with count
- `CommentThread` — comment list + input
- `RoleFilter` — tab-style filter bar
- `SearchInput` — search with icon
