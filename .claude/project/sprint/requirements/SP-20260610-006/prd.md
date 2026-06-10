<!-- requirement-format-legacy -->
# PRD — E-DISPATCH-SHAPE-001 W0 — make the ids and clocks true

**Sprint:** `SP-20260610-006`
**Plan Contract:** `PC-20260610-0070`
**Status:** draft
**Documentation scale:** `m`

## Outcome

A builder dispatch no longer prints a lying '(fail-closed)' advisory then proceeds; real runs carry a run_id so run-scoped coverage is satisfiable instead of degrading to time-window correlation; a foreground-dispatched wrapper writes its death record before the harness kills it (the doogle 560s death that wrote nothing stops happening). Each is guarded by a planted-violation test so the gap can't silently reopen.

## Context

### Original Request

> W0 — make the ids and clocks true. (1) Role-id bijection (audit G1): the generic 'builder' id the dispatch guide mandates is unresolvable by dispatch-contract/role-registry — every builder dispatch prints a misleading '(fail-closed)' advisory and proceeds. Fix per existing idiom (alias 'builder' to the right registry row, or a real generic row; pick the LESS invasive, record the choice in the commit). The wrapper and the contract must agree; the advisory must become truthful. (2) Run-correlation export (audit N8): full.js + epsilon-runtime export WARPOS_RUN_ID/WARPOS_PHASE_ID into dispatched-wrapper env; all three wrappers stamp run_id (and sprint_id when available) from env onto completion records. (3) Timeout sanity (audit G8/N1): every wrapper's effective bound must be < its applicable ceiling (foreground harness Bash ≤600s → bound ≤540s) OR the dispatch must be documented/forced background; the death record must ALWAYS be written before the bound expires. Add a /scan:full-runnable config check (standalone-runnable; do NOT edit .claude/commands/scan/full.md). PLANTED-VIOLATION TESTS for all three.

### Interpreted Intent

Make the dispatch ledger honest at the id + clock level so the enforcement layer above it (coverage-gate run-scoping, gauntlet-verify liveness, the §17.4 contract) has true inputs to work on. These are the W0 foundation of the dispatch-shape epic — the smallest fixes that unblock W1/W2. NOT building the resolver-as-only-door (that is W2); NOT flipping ENFORCE (that is W2 after the sweep).

### Current Behavior

G1: builder dispatch prints '(fail-closed)' and proceeds (advisory-only, ENFORCE never set); 78/231 ledger records carry unresolvable roles. N8: run_id null on all 231 real records (orchestrators never export WARPOS_RUN_ID). G8/N1: wrapper bounds 15-20m all exceed the 600s foreground ceiling; a foreground dispatch is killed before its death record (doogle 560s death wrote nothing). All three live-reproduced in the audit.

### Desired Behavior

G1: a builder dispatch's advisory is truthful — resolvable→silent/honest 'resolved to build-chain-worker', truly-unresolvable→honest fail-closed wording; the wrapper and contract agree. N8: full.js+epsilon-runtime export WARPOS_RUN_ID/PHASE_ID/SPRINT_ID; real records carry a non-null run_id; run-scoped coverage is satisfiable. G8/N1: every wrapper's foreground effective bound ≤540s (or documented background); the death record is always written before the bound; a standalone config check fails a >540s foreground bound. Three planted-violation tests green.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.
>
> This list is generated from `plan_contract.requirement_areas` (N items → R-1..R-N).
> A sprint with >3 requirement areas will have more than 3 entries here — trace.md
> and granular-stories.md reference the same R-1..R-N set (single-source, T-298).

- `R-1` — G1: builder role-id bijection — truthful advisory (wrapper+contract agree)
- `R-2` — N8: WARPOS_RUN_ID/PHASE_ID export from full.js+epsilon-runtime onto wrapper env
- `R-3` — G8/N1: foreground-aware wrapper timeout bound + always-write death record
- `R-4` — standalone dispatch-timeout-sanity config check (report-only, no scan/full.md edit)
- `R-5` — 3 planted-violation tests (scrapped-id/run_id/timeout)

## Non-Goals

- W1/W2/W3 of the epic (claude-fallback wrapper, circuit breaker, auth-posture, resolver-as-only-door, ENFORCE flip, per-class lane policy).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| G1 — role-id bijection: scripts/dispatch-claude.js (~L247-270 advisory) + scripts/dispatch/dispatch-contract.js (validateDispatch) + role-registry/role-aliases | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260610-0070.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-006\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-006\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-006\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-006\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-006\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-006\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-006\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-006\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-006\release-plan.md`
