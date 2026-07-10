# Community Intelligence Layer

## Purpose

GrandePrairie.dev learns from community outcomes without exposing opaque scores or coupling the product to VSMarket. The implementation is native to Cloudflare Pages Functions and D1. Rules remain inspectable, recommendation versions are immutable, and human decisions remain authoritative.

## Data Layers

Migration `009-intelligence-foundation.sql` adds:

- `community_signals`: append-only actions and outcomes with actor, target, topic, source, privacy tier, optional retention date, and deduplication.
- `recommendation_runs` and `recommendation_items`: versioned recommendation sets with rank, score, factor breakdown, and plain-language explanation.
- `recommendation_feedback`: displayed, selected, dismissed, helpful, and completed outcomes.
- `matching_decisions`: the administrator's actual builder choice, rationale, provenance, and eventual result.
- `community_relationships`: typed, directed relationships such as mentorship, organization membership, expressed interest, and completed work.
- `topic_trends`: materialized time-window snapshots derived from structured signals.
- `experiments`, assignments, and events: stable cohort allocation and registered outcome metrics.
- `learning_modules`, progress, and events: durable mission progress that replaces VSMarket's JSON-file telemetry.

## Builder Matching

The first recommendation policy is `builder-match-rules@1.0.0`. It ranks up to five profiles using only visible community facts:

| Factor | Maximum |
|---|---:|
| Relevant skills and request terms | 45 |
| Expressed interest | 25 |
| Role alignment | 10 |
| Profile completeness | 10 |
| Community contribution | 10 |

Admins generate suggestions from the Requests tab. Every candidate includes the factor breakdown and explanation. Selecting a candidate creates a `matching_decisions` row; completing the request records the outcome against the originating recommendation.

## API Boundaries

- `GET|POST /api/business-requests/:id/recommendations` retrieves or generates admin-only suggestions.
- `POST /api/recommendations/:runId/feedback` records authorized feedback.
- `GET|POST /api/admin/intelligence/trends` reads or refreshes trend snapshots.
- `GET /api/experiments/:key/assignment` provides deterministic active-experiment assignment.
- `POST /api/experiments/:key/events` accepts exposure or the experiment's registered primary metric.
- `GET /api/learning/:moduleId/progress` and `POST /api/learning/:moduleId/events` maintain member learning progress.

## Governance

Do not store contact details, message bodies, IP addresses, or secrets in intelligence metadata. Prefer stable domain events over page-view surveillance. Recommendations must expose their algorithm version and factors. Community actions must continue when best-effort signal recording fails. Only explicit admin actions may convert a recommendation into a match.

Embeddings or trained models should not be introduced until there is enough consented outcome data to evaluate them against the versioned rules baseline.
