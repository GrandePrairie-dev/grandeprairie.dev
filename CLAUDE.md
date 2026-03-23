# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GrandePrairie.dev** is a community platform for Grande Prairie's tech ecosystem in the Peace Region of Alberta, Canada. It connects developers, founders, trades workers, and students. The platform includes member profiles, an ideas board, project showcases, events calendar, a Leaflet-powered map, community intel, an AI hub for regional industries, a student corner, a small business request matchmaking system, mentor matching, organization profiles, and an automated intel pipeline.

## Commands

```bash
npm install              # Install dependencies
npm run dev              # Vite dev server (frontend only — API calls will 404)
npm run build            # TypeScript check + Vite production build
npm run typecheck        # TypeScript type checking only
npm run lint             # ESLint

# Cloudflare Pages local dev (REQUIRED for full-stack — serves frontend + API functions with D1/KV)
npm run pages:dev        # Use this instead of `npm run dev` for full-stack development

# Database
npm run db:migrate:local # Apply schema to local D1
npm run db:migrate       # Apply schema to remote D1
npm run db:seed:local    # Seed local D1
npm run db:seed          # Seed remote D1

# Deploy
npm run pages:deploy     # Deploy to Cloudflare Pages (also runs via GitHub Actions on push to main)
```

## Architecture

**Frontend**: React 19 + Vite + TypeScript, Tailwind CSS, shadcn/ui (Radix primitives), Lucide icons, Leaflet (maps), TanStack Query (data fetching), wouter (routing — clean path history mode). Path alias `@/` maps to `src/`.

**Backend**: Cloudflare Pages Functions in `functions/api/`. Each file exports `onRequestGet`, `onRequestPost`, etc. Functions receive `env` with `DB` (D1) and `SESSIONS` (KV) bindings.

**Database**: Cloudflare D1 (SQLite). Consolidated schema in `db/schema.sql`. Incremental migrations in `db/migrations/001-005`. Tables: `profiles`, `ideas`, `projects`, `events`, `intel`, `business_requests`, `student_resources`, `comments`, `idea_votes`, `activity`, `business_request_interests`, `mentor_requests`, `organizations`, `organization_members`, `organization_projects`, `pipeline_runs`.

**Auth**: Multi-provider. GitHub OAuth (`/api/auth/login`, `/api/auth/callback`), Google OAuth (`/api/auth/callback/google`), email magic link (`/api/auth/email/request`, `/api/auth/email/verify`). Sessions stored in KV. Current user via `/api/auth/me`. Profile fields: `github_id`, `github_username`, `google_id`, `auth_provider`, `email_verified`.

**Intel Pipeline**: Automated ingestion via `/api/pipeline/run` (cron-triggered). Tracks runs in `pipeline_runs` table. Intel items flagged with `is_automated` and `source_feed`.

**Deployment**: Cloudflare Pages via `wrangler`. GitHub Actions workflow in `.github/workflows/deploy.yml` deploys on push to `main`. Secrets needed: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

### Routes

| Route | Page | Status |
|---|---|---|
| `/` | Home/landing | Live |
| `/people`, `/people/:id` | Community profiles | Live |
| `/people/:id/edit` | Edit own profile | Live |
| `/ideas`, `/ideas/:id` | Ideas board with voting | Live |
| `/projects` | Project showcases | Live |
| `/map` | Leaflet map of Peace Region | Live |
| `/calendar` | Events calendar | Live |
| `/intel` | Community news/intel | Live |
| `/tech-hub` | Tech hub resources | Live |
| `/students` | Student corner | Live |
| `/business`, `/business/:id` | Small business request intake | Live |
| `/ai-hub` | AI use cases for local industries | Live |
| `/orgs`, `/orgs/:slug` | Organization profiles | Live |
| `/about` | About page | Live |
| `/admin` | Admin panel | Live |

### API Endpoints (Cloudflare Pages Functions)

All in `functions/api/`. TanStack Query uses the URL path as `queryKey[0]`.

**Profiles**
- `GET|POST /api/profiles`
- `GET /api/profiles/featured`
- `GET|PATCH /api/profiles/:id`
- `PATCH /api/profiles/:id/edit`

**Ideas**
- `GET|POST /api/ideas`
- `GET /api/ideas/featured`
- `GET /api/ideas/:id`
- `POST /api/ideas/:id/vote`

**Events**
- `GET|POST /api/events`
- `GET /api/events/upcoming`

**Intel**
- `GET|POST /api/intel`

**Business Requests**
- `GET|POST /api/business-requests`
- `GET|PATCH /api/business-requests/:id`
- `PATCH /api/business-requests/:id/status`
- `GET|POST /api/business-requests/:id/interests`
- `GET|DELETE /api/business-requests/:id/interests/me`

**Mentors**
- `GET /api/mentors`
- `POST /api/mentors/:id/request`
- `GET /api/mentor-requests/incoming`
- `GET /api/mentor-requests/outgoing`
- `PATCH /api/mentor-requests/:id`

**Organizations**
- `GET|POST /api/organizations`
- `GET /api/organizations/:slug`

**Auth**
- `GET /api/auth/login` (GitHub)
- `GET /api/auth/callback` (GitHub)
- `GET /api/auth/callback/google`
- `POST /api/auth/email/request`
- `GET /api/auth/email/verify`
- `GET /api/auth/me`
- `POST /api/auth/logout`

**Other**
- `GET /api/stats`
- `GET /api/activity`
- `GET|POST /api/comments`
- `GET /api/student-resources`
- `POST /api/pipeline/run`

**Admin**
- `PATCH|DELETE /api/admin/profiles/:id`
- `PATCH|DELETE /api/admin/ideas/:id`
- `PATCH|DELETE /api/admin/intel/:id`
- `PATCH|DELETE /api/admin/events/:id`
- `PATCH|DELETE /api/admin/organizations/:id`
- `POST|DELETE /api/admin/organizations/:id/members`

## Design System

Branding research in `reference/compass_artifact_*.md`. Design tokens are implemented in `src/styles/globals.css` and `tailwind.config.ts`.

**Color Palette** (Tailwind classes: `boreal-spruce`, `prairie-amber`, `aurora-teal`, `river-slate`, `midnight-prairie`, `fresh-snow`):
- **Boreal Spruce** `#2D4A3E` — primary brand (dark: `#4A7C6A`)
- **Prairie Amber** `#D4A24E` — warm accent (dark: `#C4943F`)
- **Aurora Teal** `#3DBFA8` — CTA/success, use sparingly (dark: `#34A893`)
- **River Slate** `#4C5B6E` — neutral bridge
- **Midnight Prairie** `#161B22` — dark mode background
- **Fresh Snow** `#F7F5F2` — light mode background

**Typography**: Geist Sans (display/headings), Inter (body), JetBrains Mono (code). Tailwind classes: `font-display`, `font-sans`, `font-mono`.

**Principles**: Dark mode first. No blue (every GP org uses blue). Colors from the land. Restraint over variety. Industrial warmth meets developer precision.

## Cloudflare Resources

| Resource | ID |
|---|---|
| D1 Database | `959887a4-877e-47f7-b046-46fb41fba7c7` |
| KV Namespace (sessions) | `ca2463f3917048d9a1beccac8642d861` |
| Account ID | `13c2f9e7589ab58d2f4f2981b443ba49` |
| Zone ID | `235dbf5343d71e90b981141acd199abf` |
| Domain | `grandeprairie.dev` |

## Key Differentiators

- **Regional identity**: Every color and name ties to the Peace Region landscape
- **No blue**: Deliberately avoids the navy palette of every other GP organization
- **Builder-first**: Bridges tech workers, trades, students, and small businesses
- **Business matchmaking**: Small businesses submit problems, community builders get matched
- **AI Hub**: Curated use cases for Peace Region industries (oil & gas, ag, construction)
- **Mentor matching**: Opt-in mentors, topic-based discovery, request/respond flow
- **Organization profiles**: NWP, Innovate Northwest, GP Chamber, etc.
- **Intel pipeline**: Automated ingestion of regional tech news with human review queue
