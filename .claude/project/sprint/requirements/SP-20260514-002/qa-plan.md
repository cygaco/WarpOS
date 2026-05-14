# QA Plan — Enforce sprint routing policy

**Sprint:** `SP-20260514-002`
**PRD:** `prd.md`

## Scope

Validate the routing-enforcement contract end-to-end. The QA gate combines unit tests for the CLI subcommands, integration tests for the guard hook, and a smoke run against this sprint itself.

## Test inventory

### Unit — routing.js subcommands

- `tests/sprint/routing-record.test.js`
  - happy path append (AC-1.1)
  - class-mismatch rejection (AC-1.2)
  - single-vendor fallback (AC-1.3)
  - append-only (AC-1.4)
  - schema rejection (AC-4.2)
- `tests/sprint/routing-check.test.js`
  - hit (AC-2.1) + miss (AC-2.2)
- `tests/sprint/routing-coverage.test.js`
  - full (AC-3.1), partial (AC-3.2), json shape (AC-3.3)

### Integration — sprint script wiring

- `tests/sprint/plan-records-routing.test.js` — AC-5.1, AC-5.2.
- `tests/sprint/design-records-routing.test.js` — AC-6.1.
- `tests/sprint/execute-records-routing.test.js` — AC-7.1, AC-7.2.
- `tests/sprint/release-gate.test.js` — AC-8.1, AC-8.2.
- `tests/sprint/retrospective-records-routing.test.js` — AC-9.1.

### Hook — sprint-routing-guard

- `tests/hooks/sprint-routing-guard.test.js`
  - warn-mode allow (AC-10.1)
  - block-mode block (AC-10.2)
  - closed-sprint exemption (AC-10.3)
  - missing-policy fail-open (AC-10.4)

### Settings integrity

- `tests/settings/hook-order.test.js` — AC-11.1 (guard sits between memory-guard and step-registry-guard).

### Policy schema

- `tests/sprint/routing-policy.test.js` — AC-12.1, AC-12.2.

### Skill body docs

- `tests/skills/sprint-routing-section.test.js` — AC-13.1 (presence of `## Routing enforcement` section in each of the 5 skill md files).

### Smoke — this sprint

- `tests/sprint/smoke-routing-coverage.test.js` — AC-14.1, AC-14.2.

## QA gate pass conditions

- All listed tests pass.
- `node scripts/sprint/routing.js validate` exits 0.
- `node scripts/sprint/routing.js coverage --sprint SP-20260514-002` exits 0 with all required phases covered.
- `/warp:health` Section 3 (hook chain) reports no integrity errors.
- Lint, typecheck, build all pass on the worktree.

## QA gate failure modes

- A test failure → ticket re-opens to bucket `qa_failed`.
- A trace missing for the sprint itself (smoke) → the smoke ticket re-opens; ALL other tests can still pass but the sprint cannot enter release.

## Cross-cutting risks

- The hook chain in settings.json runs many guards on Edit|Write — measure latency before/after to confirm <20ms added on sprint-artifact writes.
- The `record` call inside `plan.js`/`design.js`/etc. must not regress single-vendor users — explicit single-vendor smoke run is part of the QA gate.
