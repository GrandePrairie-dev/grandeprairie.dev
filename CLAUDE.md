# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GrandePrairie.dev** is a community platform for Grande Prairie's tech ecosystem in the Peace Region of Alberta, Canada. It connects developers, founders, trades workers, and students. The platform includes member profiles, an ideas board, project showcases, events calendar, a Leaflet-powered map, community intel, an AI hub for regional industries, a student corner, and a small business request matchmaking system.

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

**Frontend**: React 19 + Vite + TypeScript, Tailwind CSS, shadcn/ui (Radix primitives), Lucide icons, Leaflet (maps), TanStack Query (data fetching), wouter (routing). Path alias `@/` maps to `src/`.

**Backend**: Cloudflare Pages Functions in `functions/api/`. Each file exports `onRequestGet`, `onRequestPost`, etc. Functions receive `env` with `DB` (D1) and `SESSIONS` (KV) bindings.

**Database**: Cloudflare D1 (SQLite). Schema in `db/schema.sql`. Tables: `profiles`, `ideas`, `projects`, `events`, `intel`, `business_requests`, `student_resources`.

**Deployment**: Cloudflare Pages via `wrangler`. GitHub Actions workflow in `.github/workflows/deploy.yml` deploys on push to `main`. Secrets needed: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

### Routes

| Route | Page | Status |
|---|---|---|
| `/` | Home/landing | Scaffolded |
| `/people`, `/people/:id` | Community profiles | Planned |
| `/ideas`, `/ideas/:id` | Ideas board with voting | Planned |
| `/projects`, `/projects/:id` | Project showcases | Planned |
| `/map` | Leaflet map of Peace Region | Planned |
| `/calendar` | Events calendar | Planned |
| `/intel` | Community news/intel | Planned |
| `/tech-hub` | Tech hub resources | Planned |
| `/students` | Student corner | Planned |
| `/business` | Small business request intake | Planned |
| `/ai-hub` | AI use cases for local industries | Planned |
| `/admin` | Admin panel | Planned |

### API Endpoints (Cloudflare Pages Functions)

All in `functions/api/`. TanStack Query uses the URL path as `queryKey[0]`.

- `GET|POST /api/profiles`
- `GET|POST /api/ideas`
- `GET /api/events/upcoming`
- `GET|POST /api/intel`
- `GET|POST /api/business-requests`
- `PATCH /api/business-requests/:id/status` (planned)
- `GET /api/student-resources`
- `GET /api/stats`

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
| KV Namespace | `ca2463f3917048d9a1beccac8642d861` |
| Account ID | `13c2f9e7589ab58d2f4f2981b443ba49` |
| Zone ID | `235dbf5343d71e90b981141acd199abf` |
| Domain | `grandeprairie.dev` |

## Key Differentiators

- **Regional identity**: Every color and name ties to the Peace Region landscape
- **No blue**: Deliberately avoids the navy palette of every other GP organization
- **Builder-first**: Bridges tech workers, trades, students, and small businesses
- **Business matchmaking**: Small businesses submit problems, community builders get matched
- **AI Hub**: Curated use cases for Peace Region industries (oil & gas, ag, construction)
