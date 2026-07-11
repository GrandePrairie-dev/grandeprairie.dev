# Community Platform Action Map

Last verified: 2026-07-11

## Production Baseline

GrandePrairie.dev owns its community workflows on Cloudflare Pages Functions, D1, KV, and
Resend. VSMarket remains a design and algorithm reference; it is not a runtime dependency.

| Layer | Migration | Production capability |
|---|---|---|
| Retention and trust | 007 | RSVP, waitlists, digest preferences, reports, reputation |
| Delivery hardening | 008 | Double opt-in, retry-safe digest and reminder ledgers |
| Intelligence | 009 | Signals, recommendations, matching decisions, learning and experiments |
| Q&A | 010 | Questions, helpful votes, accepted answers, mentor-needed queue |
| Launch Board | 011 | Monthly project launches, support voting, Shipped It badge |
| Jobs and gigs | 012 | Expiring structured listings and CareerLynx import boundary |
| Groups | 013 | Curated topic groups, membership, organizer roles |
| Mentor routing | 014 | Question routing, topic/capacity ranking, notifications, outcomes |

All migrations through 014 and their corresponding Pages deployments have completed successfully
in production.

## User Loops

- **Discover:** people, organizations, map, intel, groups, jobs, projects, and Launch Board.
- **Participate:** Board discussions and Q&A, event RSVP, group membership, launch support.
- **Connect:** business-to-builder matching and question-linked mentor introductions.
- **Return:** weekly digest, event reminders, transactional match and mentorship email.
- **Build trust:** immutable reputation events, earned badges, contribution history, moderation.
- **Learn:** durable learning modules, progress events, experiments, and explicit feedback.

## Operating Boundaries

- Board posts remain the only community discussion store. Groups do not add chat.
- CareerLynx is a read-only listing source; GP.dev does not copy applicant workflow state.
- Recommendations expose factors and versions. Human choices and explicit outcomes remain
  authoritative.
- Notification ledgers store recipient identifiers, not copied email addresses.
- Community actions must not fail because best-effort signals or notifications fail.

## Current Operations

The Pages deploy and migration workflows are green. The scheduled reminder workflow previously
failed and now includes retries plus a clear missing-secret diagnostic. Run it manually after
confirming that the GitHub `PIPELINE_SECRET` matches the Cloudflare Pages secret.

Required production configuration:

- `RESEND_API_KEY` with a verified sender domain.
- `PIPELINE_SECRET` in both Cloudflare Pages and GitHub Actions.
- GitHub, Google, and email authentication credentials as documented in deployment configuration.

## Next Work

1. **Scheduler verification:** run reminders and digest via `workflow_dispatch`; resolve any
   secret mismatch before relying on delivery.
2. **Activation:** seed real events, jobs, launch entries, group organizers, and available mentors.
3. **Recommendation feedback:** add useful/not-useful controls to member-facing recommendations.
4. **Partner pipeline:** sponsor and community-partner intake, review, and public profiles.
5. **Spotlight governance:** nominations and an admin-visible selection breakdown.
6. **CareerLynx import:** implement only after its source contract and authentication are confirmed.

Do not add embeddings or trained ranking models until consented outcome volume can be evaluated
against the versioned rules baseline.
