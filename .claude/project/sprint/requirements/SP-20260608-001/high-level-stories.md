<!-- requirement-format-legacy -->
# High-Level Stories — Dispatch-shape north star — resolver + earn-it ping-reap fix + mechanical enforcement

**Sprint:** `SP-20260608-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260608-001\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As the orchestrator, I consult ONE resolver that tells me the right shape for any unit per the §17 decision rule, so I stop choosing shapes by hand.

**As** the user
**I want** As the orchestrator, I consult ONE resolver that tells me the right shape for any unit per the §17 decision rule, so I stop choosing shapes by hand.
**So that** The orchestrator stops choosing dispatch shapes by hand (the recurring failure: build-chain run in-process, heavy skills run inline, the team skipped). Every unit gets the right shape from one consulted resolver; a wrong shape is caught mechanically; and a subprocess skill only routes subprocess once it has PROVEN it pays + stays good — so the dispatch system is reliable, not aspirational.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As the system, a dispatch in the WRONG shape is self-detecting (shapeMismatch), so misroutes are caught mechanically.

**As** the user
**I want** As the system, a dispatch in the WRONG shape is self-detecting (shapeMismatch), so misroutes are caught mechanically.
**So that** The orchestrator stops choosing dispatch shapes by hand (the recurring failure: build-chain run in-process, heavy skills run inline, the team skipped). Every unit gets the right shape from one consulted resolver; a wrong shape is caught mechanically; and a subprocess skill only routes subprocess once it has PROVEN it pays + stays good — so the dispatch system is reliable, not aspirational.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
