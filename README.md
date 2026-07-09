# GrandePrairie.dev

GrandePrairie.dev is a public community platform for Grande Prairie and the Peace Region tech ecosystem. It connects developers, founders, trades workers, students, small businesses, mentors, and regional organizations through profiles, ideas, projects, events, local intel, a map, AI resources, business requests, organization pages, and a community message board.

The project is built for practical regional collaboration: local problems, local builders, and public contribution paths that are easy to review.

## Stack

- React 19, Vite, TypeScript
- Tailwind CSS, shadcn/ui, Radix primitives, Lucide icons
- TanStack Query for API data
- wouter for routing
- Leaflet for maps
- Cloudflare Pages Functions for API routes
- Cloudflare D1 for SQLite data
- Cloudflare KV for sessions
- Wrangler for local Pages development, migrations, and deploys

## Quick Start

```bash
npm install
npm run db:migrate:local
npm run db:seed:local
npm run build
npm run pages:dev
```

`npm run pages:dev` is the recommended full-stack local development path. It serves the built frontend from `dist` and runs the Cloudflare Pages Functions API with local D1/KV state.

`npm run dev` starts the Vite frontend only. It is useful for fast UI work, but API routes such as `/api/profiles` will not be available through Vite by itself.

Common local URL:

```text
http://127.0.0.1:8788
```

## Scripts

```bash
npm run dev              # Vite frontend only
npm run build            # TypeScript check, Vite build, SEO snapshot pass
npm run preview          # Preview the built Vite app
npm run lint             # ESLint
npm run typecheck        # TypeScript type checking only

npm run pages:dev        # Cloudflare Pages local dev with functions and local bindings
npm run pages:deploy     # Deploy dist to Cloudflare Pages

npm run db:migrate:local # Apply schema to local D1
npm run db:migrate       # Apply schema to remote D1
npm run db:seed:local    # Seed local D1
npm run db:seed          # Seed remote D1
```

Run remote D1 commands only when you have maintainer approval and the correct Cloudflare account context.

## Environment And Secrets

This is a public repository. Do not commit API tokens, OAuth client secrets, pipeline secrets, private account credentials, production dumps, or personal data.

Use local environment files, Wrangler secrets, GitHub Actions secrets, or Cloudflare dashboard settings for private values. Public configuration such as project names, D1/KV binding names, public OAuth client IDs, and `wrangler.toml` resource identifiers may live in the repo.

Typical private values include:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- OAuth client secrets
- pipeline or ingestion secrets
- local `.dev.vars` values

## Contributor Pull Flow

External contributors should work from a fork.

```bash
git clone git@github.com:<your-user>/grandeprairie.dev.git
cd grandeprairie.dev
git remote add upstream https://github.com/GrandePrairie-dev/grandeprairie.dev.git
git fetch upstream
git checkout main
git pull --ff-only upstream main
git checkout -b feature/short-description
```

Contributors with write access can clone the main repo directly, but should still work on a branch and open a pull request instead of pushing directly to `main`.

```bash
git clone git@github.com:GrandePrairie-dev/grandeprairie.dev.git
cd grandeprairie.dev
git checkout -b feature/short-description
```

Keep your branch current before opening or updating a pull request:

```bash
git fetch upstream
git rebase upstream/main
```

If your clone uses `origin` for the main repo instead of a fork, use:

```bash
git fetch origin
git rebase origin/main
```

## Contributor Push Flow

Before pushing, run the checks that match your change. For most code changes:

```bash
npm run lint
npm run build
npm audit --audit-level=high
```

Then commit and push:

```bash
git status
git add <changed-files>
git commit -m "Describe the change"
git push -u origin <your-branch>
```

Open a pull request into:

```text
GrandePrairie-dev/grandeprairie.dev:main
```

In the PR description, include:

- what changed
- why it changed
- how you tested it
- screenshots or short recordings for UI changes
- migration notes for database changes
- any follow-up work or known limitations

For database changes, include the schema or migration file in the PR and state whether local and remote D1 migrations have been run. Remote migrations should be run by maintainers only.

## Community Notes

GrandePrairie.dev is for the local builder community. Contributions should help people in the Grande Prairie and Peace Region ecosystem find each other, share work, solve practical problems, and build durable regional capacity.

Good contributions include:

- better onboarding for developers, students, trades workers, founders, and mentors
- clearer profiles, project pages, and organization pages
- useful local events, resources, and community intel
- improvements to the ideas board and message board
- small business request matching
- accessibility, performance, and mobile usability improvements
- local SEO, GEO, and AEO improvements that make real public content easier to discover

Keep community content practical, specific, and respectful. Avoid committing private contact details, unpublished business information, scraped personal data, or anything that should not be visible in a public repo or public website.

## SEO, GEO, And AEO

Traffic optimization is part of the product. When adding routes or major content, keep these surfaces current:

- route metadata in the React app
- server-side HTML metadata injection in Cloudflare functions
- `public/robots.txt`
- `public/llms.txt`
- generated sitemap output
- visible, human-readable page content
- structured content that answers local search and AI assistant questions accurately

Do not add hidden keyword stuffing or schema that does not match visible page content. The goal is durable discoverability for real local information.

## Design And Codex Guidance

Project design tokens, architecture notes, API routes, Cloudflare resource guidance, and Codex-specific working instructions live in `AGENTS.md`.

The design system is dark-mode first and uses regional Peace Country references: Boreal Spruce, Prairie Amber, Aurora Teal, River Slate, Midnight Prairie, and Fresh Snow. Keep new UI consistent with those tokens and the existing React/Tailwind/shadcn patterns.

## Deployment

Deploys are handled through Cloudflare Pages. The GitHub Actions workflow deploys on pushes to `main` when the repository secrets are configured.

Required GitHub or Cloudflare secrets include:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Manual deploy command:

```bash
npm run build
npm run pages:deploy
```
