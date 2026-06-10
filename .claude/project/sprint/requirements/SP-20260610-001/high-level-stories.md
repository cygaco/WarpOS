<!-- requirement-format-legacy -->
# High-Level Stories — Lane A — ship/install integrity fixes (2026-06-10 WARPOS.md sweep)

**Sprint:** `SP-20260610-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-001\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As a product installing WarpOS, I receive the mandatory build-chain wrapper (dispatch-claude.js) the dispatch guides require, so build-chain dispatch isn't a closed trap.

**As** the user
**I want** As a product installing WarpOS, I receive the mandatory build-chain wrapper (dispatch-claude.js) the dispatch guides require, so build-chain dispatch isn't a closed trap.
**So that** Products that install/update WarpOS receive the mandatory build-chain wrapper (dispatch-claude.js) the dispatch guides tell them to use; product repos can close sprints without the regression-seed gate falsely blocking on a canonical-only module; scaffolded products get the CommonJS runtime pin (no ESM-inherit breakage of ad-hoc runtime .js) and a PROJECT.md that points to the scaffolded brief; the test suite is honestly green (no top-level ENOENT crash masquerading as a pass); and the closed-trap class is mechanically self-detecting at /scan:full going forward.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As a product repo, I can close a sprint without the regression-seed gate falsely blocking on a canonical-only module, while canonical stays mandatory.

**As** the user
**I want** As a product repo, I can close a sprint without the regression-seed gate falsely blocking on a canonical-only module, while canonical stays mandatory.
**So that** Products that install/update WarpOS receive the mandatory build-chain wrapper (dispatch-claude.js) the dispatch guides tell them to use; product repos can close sprints without the regression-seed gate falsely blocking on a canonical-only module; scaffolded products get the CommonJS runtime pin (no ESM-inherit breakage of ad-hoc runtime .js) and a PROJECT.md that points to the scaffolded brief; the test suite is honestly green (no top-level ENOENT crash masquerading as a pass); and the closed-trap class is mechanically self-detecting at /scan:full going forward.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
