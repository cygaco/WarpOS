# PRD - E-PRODUCT-FOUNDATION-001 W0 telemetry seam

**Sprint:** `S-PF-01`
**Plan Contract:** `PC-20260611-0075`
**Status:** design-ready
**Documentation scale:** `m`

## Outcome

A founder can scaffold a product and launch with activation, retention, core action, checkout, and chain-integrity telemetry available from day zero without waiting for lastmile analytics work or risking a tracker that breaks app boot.

## Context

### Original Request

> Continue after SP-20260611-002: run E-PRODUCT-FOUNDATION-001 W0. Approved Product Lead artifact is build_spec-S-PF-01-w0-telemetry-seam and the Director of Product ruling is early-derived, lastmile-confirmed activation.

### Interpreted Intent

Make the W0 product-foundation sprint executable: every future app scaffold gets a real `track(event, props)` seam, no-op fail-open sink, canonical event vocabulary, supply-chain correlation/stage vocabulary, activation definition that is derived before launch and explicitly confirmed or revised at lastmile, and an extended scaffold-coverage enforcer with planted false-green fixtures.

### Current Behavior

The scaffold currently has no telemetry seam, no canonical event union, no activation definition object, and no supply-chain correlation/stage helper. Lastmile analytics exists as a later adapter with its own vocabulary. The approved build_spec intentionally pointed at `message_brief-E-PRODUCT-FOUNDATION-001-w0` before that message_brief existed on disk.

### Desired Behavior

New app scaffolds contain a single telemetry seam: `track(event, props)` resolves exactly one sink, defaults to no-op when unconfigured, catches sink failures, and imports its event type from a single `events.ts` source. The event set is exactly `signup`, `onboarding_complete`, `activation`, `core_action`, `retention_return`, and `checkout`. Activation carries `predicate`, `provenance`, `confidence`, and `derivedFrom`; unresolved placeholders/TODOs are hard failures. Lastmile analytics enriches that vocabulary, forces confirm/revise of activation, and emits `activation_definition_change` on revision. Scaffold coverage fails on missing seam, duplicate sink, broken-chain false-green, and activation-present-but-undefined fixtures. New templates ship through both manifests.

## Requirements

- `R-1` - telemetry seam and sink contract: add `track(event, props)`, one sink resolver, no-op unconfigured sink, sink error boundary, env names only, and layout/page wiring without blocking app boot.
- `R-2` - canonical lifecycle event vocabulary: define exactly `signup`, `onboarding_complete`, `activation`, `core_action`, `retention_return`, `checkout` as the typed single source consumed by `track` and downstream analytics.
- `R-3` - activation definition contract: derive activation at canon time, fail closed if core-loop entities are too thin, carry `predicate`/`provenance`/`confidence`/`derivedFrom`, force lastmile confirm-or-revise, and emit `activation_definition_change` on revision.
- `R-4` - lastmile analytics enrichment: re-point `analytics.js` so the six seam events are the canonical base and funnel/A-B events are enrichment, never a parallel tracker or duplicate sink install.
- `R-5` - supply-chain telemetry chain: carry `correlationId` and a fixed stage vocabulary `intent -> executed -> committed/sent -> delivered -> observed/read`, with helpers that surface broken chains as first-class failure events.
- `R-6` - enforcer and shipping integrity: extend `scaffold-coverage-scan.js` with telemetry assertions, add planted seam-missing/broken-chain/duplicate-sink/unfilled-activation fixtures, validate the message_brief/build_spec chain, and regenerate both manifests.

## Non-Goals

- No real analytics provider integration.
- No per-click auto-instrumentation or global click wrapper.
- No admin event-feed UI in W0.
- No retrofit of existing portfolio products.
- No batching, transport, retry, or delivery guarantees in the no-op sink.
- No push to remote without explicit in-session approval.

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| `framework/templates/app-scaffold/src/lib/telemetry/*.ts.tmpl` | verified_from_repo |
| `framework/templates/app-scaffold/src/app/layout.tsx.tmpl` and `page.tsx.tmpl` | verified_from_repo |
| `framework/templates/app-scaffold/.env.local.example.tmpl` | verified_from_repo |
| `scripts/checks/scaffold-coverage-scan.js` | verified_from_repo |
| `scripts/bootstrap/lastmile/modules/analytics.js` | verified_from_repo |
| `_requirements/00-canonical` core-loop artifacts | verified_from_repo |
| `schemas/contracts/message_brief.schema.json` and `build_spec.schema.json` | verified_from_repo |

## Contract Artifacts

- Message brief: `.claude/project/sprint/requirements/S-PF-01/artifacts/message_brief-E-PRODUCT-FOUNDATION-001-w0.json`
- Validated chain: `.claude/project/sprint/requirements/S-PF-01/artifacts/build_spec-S-PF-01-w0-telemetry-seam.chain.json`

## External Service Dependencies

None expected. PostHog is a named future sink target only; W0 adds env variable names and a no-op sink, not credentials, signup, billing, or network calls.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260611-0075.yaml`
- High-level stories: `.claude/project/sprint/requirements/S-PF-01/high-level-stories.md`
- Granular stories: `.claude/project/sprint/requirements/S-PF-01/granular-stories.md`
- COPY: `.claude/project/sprint/requirements/S-PF-01/copy.md`
- INPUTS: `.claude/project/sprint/requirements/S-PF-01/inputs.md`
- TRACE: `.claude/project/sprint/requirements/S-PF-01/trace.md`
- Acceptance criteria: `.claude/project/sprint/requirements/S-PF-01/acceptance-criteria.md`
- QA plan: `.claude/project/sprint/requirements/S-PF-01/qa-plan.md`
- Redteam plan: `.claude/project/sprint/requirements/S-PF-01/redteam-plan.md`
- Release plan: `.claude/project/sprint/requirements/S-PF-01/release-plan.md`
