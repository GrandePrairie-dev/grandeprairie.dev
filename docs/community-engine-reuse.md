# Community Engine Reuse Plan

## Decision

GrandePrairie.dev should own its community workflows in Cloudflare Pages Functions and D1. VSMarket is a reference implementation, not a runtime dependency: its strongest community services are large, marketplace-specific, and directly coupled to Firestore.

Reuse the event vocabulary, scoring rules, selection ideas, and workflow shapes. Reimplement persistence behind GP.dev's existing `Env`, D1, KV, Resend, and Pages Function boundaries.

## Source Audit

| VSMarket source | Useful part | GP.dev treatment |
|---|---|---|
| `server/services/badge-engine.js` | Event-driven badge checks and deduplicated awards | Rebuilt as D1-native reputation events and badge rules in `functions/lib/community.ts` |
| `server/services/review-moderation.js` | Reason weighting, spam signals, queue prioritization | Rebuilt as pure report-priority scoring; human moderators retain final control |
| `server/services/review-notifications.js` | Weekly digest workflow and email sections | Adapted to the existing Resend transport and GP.dev content sources |
| `server/services/creator-spotlight.js` | Weighted scoring and diversity-aware selection | Keep as a reference for the launch-board phase; do not port Firestore queries or sales weights |
| `server/services/points.js` | Immutable points ledger concept | Rebuilt as `reputation_events` with a unique `dedupe_key` |
| `data/alberta-badges.json` | Data-driven badge definitions | Retheme only community-relevant criteria; purchase/seller badges do not transfer |
| `social-service/`, `elystrum-social/` | Promotional copy generation | Optional downstream publishing helper, not community product infrastructure |
| `zci/api/.../recursive_learning.py` | Signal, feedback, and evaluation loop | Rebuilt as durable D1 signals and outcomes; process-local prompt mutation was not ported |
| `server/services/experiments.js` | Stable assignment and metric tracking | Rebuilt as D1 experiments, assignments, and registered outcome events |
| `server/api/ai-feedback.js` | Explicit recommendation feedback | Rebuilt as recommendation feedback tied to versioned runs and items |

## Implemented Foundation

Migration `007-community-foundation.sql` adds:

- Event RSVP, capacity, cancellation, automatic waitlist placement, and first-in promotion.
- Weekly digest subscriptions, topic preferences, pause, unsubscribe, and delivery tracking.
- Community content reports with deduplication, priority scoring, moderator ownership, and resolution notes.
- Immutable reputation events, four initial community badges, points, and trust levels.

Migration `008-community-delivery-hardening.sql` adds:

- Double opt-in confirmation before any address becomes eligible for digest delivery.
- A unique subscriber/week delivery ledger with retry-safe claims and stale-claim recovery.
- A unique event/member reminder ledger for 24-hour RSVP reminders.
- Bounded batch continuation through `.github/workflows/community-scheduler.yml`.

Migration `009-intelligence-foundation.sql` adds the signal, recommendation, matching-decision,
relationship, trend, experiment, and learning-progress ledgers documented in
`docs/intelligence-layer.md`. The initial builder matcher is an explainable rules baseline,
not a self-modifying model.

User-facing surfaces:

- Home-page weekly digest signup.
- `/digest` preference center linked from every digest email.
- RSVP and waitlist controls on calendar cards.
- Report actions on board threads and replies.
- Reports tab in `/admin`, ordered by priority and state.
- `/conduct` community standards page.
- Confirmation email and 24-hour event reminder email.

Scheduling uses the existing Cloudflare pipeline pattern rather than BullMQ:

```text
POST /api/digest/send
X-Pipeline-Secret: <PIPELINE_SECRET>
```

The community scheduler workflow calls event reminders hourly and the digest Monday at 16:15 UTC. Digest delivery runs in batches of 100 and continues for up to ten batches. The delivery ledger makes workflow retries safe. `RESEND_API_KEY` must be configured in Cloudflare, and `PIPELINE_SECRET` must have the same value in Cloudflare and GitHub Actions.

## Next Feature Phases

### Phase 2: Q&A and Launch Ritual

Extend the board rather than create a second discussion system:

- Add `post_type`, accepted reply, helpful votes, and an unanswered/needs-mentor filter.
- Award helpful-answer and accepted-answer reputation events.
- Add monthly launch cycles and project votes on top of `projects`.
- Adapt VSMarket's diversity selector using GP.dev metrics: helpful answers, event hosting, project activity, profile completeness, and community votes.

Q&A is implemented by migration `010-question-answer-loop.sql`: discussion/question post types,
unanswered and needs-mentor views, unique helpful votes, append-only accepted-answer history,
reputation awards, intelligence signals, and digest labels. The launch ritual remains next.

### Phase 3: Jobs and Groups

- Use a dedicated `jobs` table for expiry, employment type, compensation, location, and application URLs. The existing board `jobs` category remains suitable for informal leads.
- Prefer a read-only CareerLynx import boundary over duplicating its full hiring workflow.
- Start groups as curated topic pages plus membership and organizer roles. Defer chat and Liveblocks until participation proves demand.

### Phase 4: Reputation Presentation

- Add badge progress and contribution history to profile pages.
- Add transparent trust-level labels; never expose a vague social-intelligence score.
- Add spotlight nominations and explain the selection breakdown in admin.

## Deployment Order

1. Apply `db/migrations/007-community-foundation.sql` and `008-community-delivery-hardening.sql` remotely, in order.
2. Deploy the Pages code.
3. Configure `RESEND_API_KEY` and verify sender-domain status.
4. Configure the weekly scheduler with `PIPELINE_SECRET`.
5. Send a controlled digest to internal addresses before enabling public delivery.
