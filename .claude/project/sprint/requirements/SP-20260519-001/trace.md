# TRACE Requirements — ROADMAP + RELEASES ledger discipline

**Sprint:** `SP-20260519-001`
**PRD:** `prd.md`

> TRACE captures observability tying request → requirement → code → test → release → learning. Every event below lands in `paths.eventsFile` via `scripts/hooks/lib/logger.js`.

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| user request 2026-05-19 + RT-011 | R-1 | S-1 | C-1 | IN-1 | — | T-001 | (none — markdown spec) | ledger-format.test.js | RELEASES.md | — |
| user request + RT-011 | R-1 | S-2 | C-2, C-3 | IN-2, IN-3 | — | T-002 | (none — markdown create) | releases-md-shape.test.js | RELEASES.md | — |
| RT-011 | R-3 | S-3 | C-4 | — | — | T-003 | sprint-workflow.md | grep smoke | sprint-workflow.md | RT-011 |
| R-2 | R-2 | S-4 | C-5 | IN-1, IN-2, IN-3, IN-4 | — | T-004 | scripts/sprint/ledger.js | ledger-shape.test.js | — | — |
| R-2 | R-2 | S-5 | C-6 | IN-1 | — | T-005 | scripts/sprint/plan.js, add-sprint.js | plan-writes-ledger.test.js | ROADMAP.md | — |
| R-2 | R-2 | S-6 | C-7 | IN-4 | — | T-006 | scripts/sprint/retrospective.js | retro-updates-ledger.test.js | ROADMAP.md | — |
| R-2 | R-2 | S-7 | C-8 | IN-2 | — | T-007 | scripts/sprint/release.js | release-writes-ledger.test.js | RELEASES.md | — |
| R-2 | R-2 | S-8 | C-9 | IN-3 | — | T-008 | scripts/warpos/release-canonical.js (TBD) | warp-release-writes-ledger.test.js | RELEASES.md | — |
| R-4 | R-4 | S-9 | C-10 | IN-5, IN-6, IN-7, IN-8 | — | T-009 | scripts/sprint/backfill-ledgers.js | backfill-dry-run + backfill-apply | — | — |
| R-5 | R-5 | S-10 | C-11 | IN-10 | — | T-010 | scripts/hooks/ledger-presence-guard.js | ledger-guard-warn.test.js | — | — |
| R-7 | R-7 | S-11 | C-12 | IN-11 | — | T-011 | .claude/commands/sprint/*.md, warp/release.md | skill-bodies-reference-ledger.test.js | — | — |
| R-4 | R-4 | S-12 | (backfill output) | IN-5..IN-8 | — | T-012 | (operator step) | manual smoke | both ledgers | — |

## TR-1 — ledger.write event

**Event:** `ledger.write`
**When:** any time `appendSprintRow` / `updateSprintRow` / `appendVersionRow` / `appendReleaseRow` returns
**Captured fields:** `{ fn, file, args.id|version, written: bool, reason?, ts }`
**Linked requirement:** `R-2`
**Linked story:** `S-4`
**Why we capture this:** lets the warn-hook in S-10 correlate ledger writes to sprint command invocations within a session.

## TR-2 — ledger.fail-open event

**Event:** `ledger.fail-open`
**When:** any time `ledger.js` swallows an error (write failure, validation failure, missing anchor)
**Captured fields:** `{ fn, file, args.id|version, errorMessage, ts }`
**Linked requirement:** `R-2`
**Linked story:** `S-4`
**Why we capture this:** fail-open is invisible by design; this event is the only signal that something went wrong. Future LRNs / `/check:patterns` can mine for repeat patterns.

## TR-3 — ledger-policy.referenced event

**Event:** `ledger-policy.referenced`
**When:** any process grep-loads the `sprint-workflow.md#ledger-discipline` section (informational; emitted by the ledger.js startup path that reads the section to know which `<!-- ledger:* -->` markers it owns)
**Captured fields:** `{ caller, sprint?, ts }`
**Linked requirement:** `R-3`
**Linked story:** `S-3`
**Why we capture this:** confirms the codified policy is actually loaded at runtime, not just documented.

## TR-4 — sprint-plan.ledger-write event

**Event:** `sprint-plan.ledger-write`
**When:** `plan.js` or `add-sprint.js` calls `appendSprintRow` (success OR fail-open skip)
**Captured fields:** `{ sprint, written, reason?, ts }`
**Linked requirement:** `R-2`
**Linked story:** `S-5`
**Why we capture this:** primary signal for the warn hook in S-10 to verify plan ran AND wrote a row.

## TR-5 — sprint-retro.ledger-update event

**Event:** `sprint-retro.ledger-update`
**When:** `retrospective.js` calls `updateSprintRow`
**Captured fields:** `{ sprint, oldStatus, newStatus, written, ts }`
**Linked requirement:** `R-2`
**Linked story:** `S-6`
**Why we capture this:** status-transition-edge-ownership LRN class — this event proves the edge has an owner.

## TR-6 — sprint-release.ledger-write event

**Event:** `sprint-release.ledger-write`
**When:** `release.js` calls `appendReleaseRow` or `updateReleaseRow` (prepare → deploy)
**Captured fields:** `{ release, sprint, status, written, ts }`
**Linked requirement:** `R-2`
**Linked story:** `S-7`
**Why we capture this:** parallels TR-5 for the release-side transition.

## TR-7 — warp-release.ledger-write event

**Event:** `warp-release.ledger-write`
**When:** `release-canonical.js` (or whatever drives `/warp:release`) calls `appendVersionRow`
**Captured fields:** `{ version, written, capsulePath, ts }`
**Linked requirement:** `R-2`
**Linked story:** `S-8`
**Why we capture this:** closes the release-capsule-gap LRN class — every version bump is now traceable to a ledger row.

## TR-8 — backfill-ledgers.run event

**Event:** `backfill-ledgers.run`
**When:** end of `backfill-ledgers.js` execution
**Captured fields:** `{ mode: 'dry-run'\|'apply', sprintRowsInserted, versionRowsInserted, releaseRowsInserted, alreadyPresent, ts }`
**Linked requirement:** `R-4`
**Linked story:** `S-9`
**Why we capture this:** historical-backfill audit trail; future re-runs report deltas.

## TR-9 — ledger-presence-guard.fire event

**Event:** `ledger-presence-guard.fire`
**When:** guard hook detects a missed ledger write
**Captured fields:** `{ command, sprint?, expectedSection, mode: 'warn'\|'block', ts }`
**Linked requirement:** `R-5`
**Linked story:** `S-10`
**Why we capture this:** soft-rollout window metrics — if this fires zero times during the 14d window, the writers are healthy and the warn→block flip is safe.

## TR-10 — ledger-skill-body.grep event

**Event:** `ledger-skill-body.grep`
**When:** CI test in AC-11.1 runs
**Captured fields:** `{ file, foundReference: bool, ts }`
**Linked requirement:** `R-7`
**Linked story:** `S-11`
**Why we capture this:** regression detector — if a future skill-body refactor strips the reference, this catches it.

## TR-11 — `backfill-apply.done` event

**Event:** `backfill-apply.done`
**When:** S-12 manual operator step completes successfully
**Captured fields:** `{ operator, ts, finalRowCounts: { sprints, versions, releases } }`
**Linked requirement:** `R-4`
**Linked story:** `S-12`
**Why we capture this:** durable proof-of-backfill for the retrospective.

## TR-12 — `ledger-policy.boundary-flagged` event

**Event:** `ledger-policy.boundary-flagged`
**When:** an operator (or `backfill-ledgers.js`) encounters an event that is `MAY` per the RT-011 table (bare git tag with capsule outside `/warp:release`)
**Captured fields:** `{ tag, capsulePath, flag: 'tagged-outside-pipeline', ts }`
**Linked requirement:** `R-3`
**Linked story:** `S-3`
**Why we capture this:** the MAY tier is the audit signal — every fire is an opportunity to ask "should this be MUST?". Future `/check:patterns` mines this.
