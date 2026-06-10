<!-- requirement-format-legacy -->
# Granular Stories — Lane A — ship/install integrity fixes (2026-06-10 WARPOS.md sweep)

**Sprint:** `SP-20260610-001`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-001\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — TICKET-1 (BACKEND): WG-1 — add scripts/dispatch-claude.js (+ confirm/add scripts/dispatch/dispatch-claude.test.js) to generate-framework-manifest.js TOP_LEVEL_SCRIPTS; run the generator; assert both land in .claude/framework-manifest.json.

**As** the user
**I want** TICKET-1 (BACKEND): WG-1 — add scripts/dispatch-claude.js (+ confirm/add scripts/dispatch/dispatch-claude.test.js) to generate-framework-manifest.js TOP_LEVEL_SCRIPTS; run the generator; assert both land in .claude/framework-manifest.json.
**So that** Products that install/update WarpOS receive the mandatory build-chain wrapper (dispatch-claude.js) the dispatch guides tell them to use; product repos can close sprints without the regression-seed gate falsely blocking on a canonical-only module; scaffolded products get the CommonJS runtime pin (no ESM-inherit breakage of ad-hoc runtime .js) and a PROJECT.md that points to the scaffolded brief; the test suite is honestly green (no top-level ENOENT crash masquerading as a pass); and the closed-trap class is mechanically self-detecting at /scan:full going forward.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — TICKET-2 (BACKEND): WG-9 — refactor regressionSeedGate so product-vs-canonical is determined BEFORE require('../testsuite/enforce'); product repos no-op exit 0; canonical unchanged (mandatory, fail-closed); add a product-role fixture to test-regression-seed-gate.js; A-G stay green.

**As** the user
**I want** TICKET-2 (BACKEND): WG-9 — refactor regressionSeedGate so product-vs-canonical is determined BEFORE require('../testsuite/enforce'); product repos no-op exit 0; canonical unchanged (mandatory, fail-closed); add a product-role fixture to test-regression-seed-gate.js; A-G stay green.
**So that** Products that install/update WarpOS receive the mandatory build-chain wrapper (dispatch-claude.js) the dispatch guides tell them to use; product repos can close sprints without the regression-seed gate falsely blocking on a canonical-only module; scaffolded products get the CommonJS runtime pin (no ESM-inherit breakage of ad-hoc runtime .js) and a PROJECT.md that points to the scaffolded brief; the test suite is honestly green (no top-level ENOENT crash masquerading as a pass); and the closed-trap class is mechanically self-detecting at /scan:full going forward.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — TICKET-3 (BACKEND): AL-W-007 + AL-W-004 — create .claude/runtime/package.json (type:commonjs, mirror scripts/package.json) + ship it in the scaffold/install payload; add the brief-location pointer to the scaffold PROJECT.md template; verify an install/scaffold materializes both.

**As** the user
**I want** TICKET-3 (BACKEND): AL-W-007 + AL-W-004 — create .claude/runtime/package.json (type:commonjs, mirror scripts/package.json) + ship it in the scaffold/install payload; add the brief-location pointer to the scaffold PROJECT.md template; verify an install/scaffold materializes both.
**So that** Products that install/update WarpOS receive the mandatory build-chain wrapper (dispatch-claude.js) the dispatch guides tell them to use; product repos can close sprints without the regression-seed gate falsely blocking on a canonical-only module; scaffolded products get the CommonJS runtime pin (no ESM-inherit breakage of ad-hoc runtime .js) and a PROJECT.md that points to the scaffolded brief; the test suite is honestly green (no top-level ENOENT crash masquerading as a pass); and the closed-trap class is mechanically self-detecting at /scan:full going forward.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — TICKET-4 (BACKEND): E-LIFECYCLE step4 — fix tests/regression/SP-20260518-007/check-ac-coverage.test.js (repoint check/->scan/, restore/point a real-tree fixture so --json returns the populated shape); run it green with no top-level throw.

**As** the user
**I want** TICKET-4 (BACKEND): E-LIFECYCLE step4 — fix tests/regression/SP-20260518-007/check-ac-coverage.test.js (repoint check/->scan/, restore/point a real-tree fixture so --json returns the populated shape); run it green with no top-level throw.
**So that** Products that install/update WarpOS receive the mandatory build-chain wrapper (dispatch-claude.js) the dispatch guides tell them to use; product repos can close sprints without the regression-seed gate falsely blocking on a canonical-only module; scaffolded products get the CommonJS runtime pin (no ESM-inherit breakage of ad-hoc runtime .js) and a PROJECT.md that points to the scaffolded brief; the test suite is honestly green (no top-level ENOENT crash masquerading as a pass); and the closed-trap class is mechanically self-detecting at /scan:full going forward.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — TICKET-5 (BACKEND, close-out): extend scripts/checks/warpos-install-baseline.js with a ship-payload (manifest) coverage assertion (guard-mandated + shipped-gate-required script paths exist in the manifest), fail-closed; regen BOTH manifests; ff-merge to main; defer retro to milestone close.

**As** the user
**I want** TICKET-5 (BACKEND, close-out): extend scripts/checks/warpos-install-baseline.js with a ship-payload (manifest) coverage assertion (guard-mandated + shipped-gate-required script paths exist in the manifest), fail-closed; regen BOTH manifests; ff-merge to main; defer retro to milestone close.
**So that** Products that install/update WarpOS receive the mandatory build-chain wrapper (dispatch-claude.js) the dispatch guides tell them to use; product repos can close sprints without the regression-seed gate falsely blocking on a canonical-only module; scaffolded products get the CommonJS runtime pin (no ESM-inherit breakage of ad-hoc runtime .js) and a PROJECT.md that points to the scaffolded brief; the test suite is honestly green (no top-level ENOENT crash masquerading as a pass); and the closed-trap class is mechanically self-detecting at /scan:full going forward.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

