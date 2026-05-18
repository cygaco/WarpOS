# High-Level Stories — Sprint Goal Verification

**Sprint:** `SP-20260518-007`
**PRD:** `prd.md`

## H-1 — Plan-time goal recording

**As** a sprint operator,
**I want** every Plan Contract I write to carry a `goal_verification` block (origin evidence, bug classes closed, reproduction plan),
**So that** the executable proof obligation is captured at plan-time, before design or execution can quietly drop it.

Linked granular stories: `S-1.1`, `S-1.2`, `S-1.3`.
Linked requirements: `R-1`, `R-2`, `R-3`.

## H-2 — Design-time fixture gate

**As** a sprint designer,
**I want** `/sprint:design` to refuse to advance the sprint to `designed` until every AC carries a `verified_by:` link (or an explicit `not_applicable` + justification),
**So that** AC-coverage gaps cannot survive past design and surface as surprises in release.

Linked granular stories: `S-2.1`, `S-2.2`.
Linked requirements: `R-4`, `R-5`.

## H-3 — Release-time ship-gate

**As** a release approver,
**I want** `/sprint:release` to enumerate every cited test, execute it, and refuse to advance when any fails or returns unparseable output,
**So that** "AC satisfied" stops being a checkbox and becomes an evidence-backed claim that the failure is gone.

Linked granular stories: `S-2.3`.
Linked requirements: `R-6`.

## H-4 — Coverage audit on demand

**As** a maintainer auditing sprint hygiene,
**I want** a read-only `/check:ac-coverage` skill that reports per-sprint linkage + executability,
**So that** I can spot drift before it hits the ship-gate, without modifying any tracker state.

Linked granular stories: `S-3.1`.
Linked requirements: `R-7`.

## H-5 — Lint-time regression catch

**As** future-me looking at the lint board,
**I want** `scripts/sprint/test-plan-honors-registry-primary.js` to run as part of `/linters:run`,
**So that** the `plan.js` drift bug class from 2026-05-18 cannot silently recur — any future change that drops the registry-primary honor fails the lint board immediately.

Linked granular stories: `S-4.1`.
Linked requirements: `R-8`.

## H-6 — Documentation, retrospective, preset hygiene

**As** a downstream-project operator picking up this framework via `/warp:update`,
**I want** the workflow doc, retro, and `/sprint:full` autonomy preset to honestly describe the new gate,
**So that** I'm not surprised by a refusal I didn't read about and my old sprints don't break on upgrade.

Linked granular stories: `S-5.1`, `S-5.2`, `S-5.3`.
Linked requirements: `R-9`, `R-10`, `R-11`.
