# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Code Intelligence (CodeGraph)

This repo is indexed with [CodeGraph](https://github.com/colbymchenry/codegraph) — a local
knowledge graph (symbols, call edges, dependencies) that auto-syncs on file changes. Prefer
the `codegraph_explore` / `codegraph_node` MCP tools over grep/Read sweeps for architecture
questions, tracing call paths, or impact analysis before editing a symbol — they return
verbatim source with full caller/callee context in one call, near-zero file reads.

Other repos across the portfolio are indexed too — query them in the same session by passing
`projectPath` to the CodeGraph tools instead of switching directories.

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

**Database**: Cloudflare D1 (SQLite). Consolidated schema in `db/schema.sql`. Incremental migrations in `db/migrations/001-008`. Core community tables also include `board_posts`, `event_rsvps`, `digest_subscriptions`, `digest_deliveries`, `event_reminders`, `content_reports`, `reputation_events`, and `profile_badges`.

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
| `/conduct` | Community standards | Live |
| `/digest` | Digest preference center | Live |
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
- `POST /api/events/:id/rsvp`
- `POST /api/events/reminders/send` (scheduler secret required)

**Community Retention & Trust**
- `GET|POST|PATCH|DELETE /api/digest/subscriptions`
- `POST /api/digest/send` (scheduler secret required)
- `GET|POST /api/reports`
- `PATCH /api/admin/reports/:id`

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
- `POST /api/invites`
- `POST /api/pipeline/run`

**Admin**
- `PATCH|DELETE /api/admin/profiles/:id`
- `PATCH|DELETE /api/admin/ideas/:id`
- `PATCH|DELETE /api/admin/intel/:id`
- `PATCH|DELETE /api/admin/events/:id`
- `PATCH|DELETE /api/admin/organizations/:id`
- `POST|DELETE /api/admin/organizations/:id/members`

## Design System

Branding research lives in `reference/compass_artifact_*.md`. The reviewed design-system bundle is documented in `docs/design-system.md`; the source zip was `C:\Users\cjell\Downloads\GrandePrairie.dev Design System.zip`. Design tokens are implemented in `src/styles/globals.css` and `tailwind.config.ts`.

Do not dump the design-system export into app code. Incorporate it through the existing React/Tailwind/shadcn surfaces: global CSS variables, Tailwind theme aliases, shared `src/components/ui/*` primitives, page components, and public assets.

**Color Palette** (Tailwind classes: `boreal-spruce`, `prairie-amber`, `aurora-teal`, `river-slate`, `midnight-prairie`, `fresh-snow`):
- **Boreal Spruce** `#2D4A3E` — primary brand (dark: `#4A7C6A`)
- **Prairie Amber** `#D4A24E` — warm accent (dark: `#C4943F`)
- **Aurora Teal** `#3DBFA8` — CTA/success, use sparingly (dark: `#34A893`)
- **River Slate** `#4C5B6E` — neutral bridge
- **Midnight Prairie** `#161B22` — dark mode background
- **Fresh Snow** `#F7F5F2` — light mode background

**Typography**: Geist (display/headings), Inter (body), JetBrains Mono (code, coordinates, labels). Tailwind classes: `font-display`, `font-sans`, `font-mono`.

**Layout / density**: Dark mode first. Fixed 210px sidebar on desktop, compact 14px body text, 56rem content column, 16px card padding, 6px radius anchor, minimum 44px interactive targets.

**Depth / polish**: Use the tokenized polish layer in `src/styles/globals.css`: `shadow-gp-*`, `gp-glow`, `gp-glass`, and `gp-toplit`. Use glow/glass sparingly for hero, auth, dialogs, or floating controls. The ambient network overlay is `public/scripts/neural-net.js` and can be rendered with `<neural-net>` behind hero/auth/header content.

**Agency route**: `/agency` is a separate Build / Run / Show marketing language. Keep it scoped under `.gp-agency` with near-black canvas, bronze-gold accent, Instrument Serif display, DM Sans body, IBM Plex Mono labels, sharper corners, film grain, and measured scroll reveals. Do not let agency tokens leak into the community platform shell.

**Assets**: `public/images/` contains the reviewed brand photography and `logo-swan.png`. The design bundle's swan logo currently has a white background; do not place it on dark surfaces until a transparent/knockout export exists. Continue using the diamond mark for favicon/sidebar contexts.

**Principles**: Dark mode first. No blue as a dominant brand color. Colors from the land. Restraint over variety. Industrial warmth meets developer precision. The UI is a working community platform, not a marketing landing page unless editing `/agency`.

## Cloudflare Resources

This is a public repo. Keep API tokens, OAuth secrets, pipeline secrets, and account-level identifiers out of committed guidance files. Use `.dev.vars`, Wrangler secrets, GitHub Actions secrets, or local environment variables for private deploy/auth values.

Public deploy configuration lives in `wrangler.toml`; treat D1/KV IDs and OAuth client IDs there as public identifiers, not secrets. Do not add secret values to `AGENTS.md`, `CLAUDE.md`, docs, scripts, or tests.

| Resource | Location |
|---|---|
| D1 Database binding | `wrangler.toml` / Cloudflare dashboard |
| KV Namespace binding | `wrangler.toml` / Cloudflare dashboard |
| Account ID | `CLOUDFLARE_ACCOUNT_ID` env or GitHub Actions secret |
| API token | `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_API_KEY` secret only |
| Resend API key | `RESEND_API_KEY` secret only |
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
