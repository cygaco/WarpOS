<!-- requirement-format-legacy -->
# TRACE Requirements — E-DISPATCH-SHAPE-001 ADR-0013 enforce repair + W3 review-lane policy

**Sprint:** `SP-20260627-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260627-001\prd.md`

> TRACE captures the observability, traceability, event capture, decision
> logging, and requirement-to-code linkage layer. The point of TRACE is
> to answer: why did this exist, where did the requirement come from,
> what changed because of it, what external dependency or approval was
> required, how was it tested, what shipped, and what should persist as
> a learning.

## Trace Map

> One row per requirement area (R-1..R-N, single-source from plan_contract.requirement_areas,
> T-298). Fill in Ticket, Code, and Test columns during execution.

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| (A) Fix the dispatch-contract enforce | R-1 | S-1 | C-1 | IN-1 | — | T-… | — | — | — | — |
| (A) Fix the dispatch-contract enforce | R-2 | S-2 | C-2 | IN-2 | — | T-… | — | — | — | — |
| (A) Fix the dispatch-contract enforce | R-3 | S-3 | C-3 | IN-3 | — | T-… | — | — | — | — |
| (A) Fix the dispatch-contract enforce | R-4 | S-4 | C-4 | IN-4 | — | T-… | — | — | — | — |
| (A) Fix the dispatch-contract enforce | R-5 | S-5 | C-5 | IN-5 | — | T-… | — | — | — | — |

## TR-1 — R-1 worktree-pending validation: validateDispatch honors cwd=canonical for `-w` build-chain dispatches (the wrapper creates the worktree after validation), regression-locked against the false-refuse the gauntlet caught

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** (fill)

## TR-2 — R-2 generic build id + role normalization: add `fixer` to GENERIC_BUILD_IDS and normalize legacy/raw role names before contract evaluation so generic build/fix dispatches are not false-refused

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-2`
**Linked story:** `S-2`
**Why we capture this:** (fill)

## TR-3 — R-3 enforce-by-default flip: contractEnforceMode defaults to enforce; WARPOS_DISPATCH_CONTRACT_ENFORCE override + kill-switch preserved; the refused set stays exactly api-when-CLI / build-chain-in-process / cwd-worktree / forbidden_shapes; fail-closed on the gate's own error (BC-16)

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-3`
**Linked story:** `S-3`
**Why we capture this:** (fill)

## TR-4 — R-4 W3 per-failure-class minimum review lanes: each risk class declares minimum lanes (execution-access for enforcer/gate changes; cross-family diff for distribution-sensitive logic), wired into sprint-hook-points conditions + coverage-gate lane-shape requirement

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-4`
**Linked story:** `S-4`
**Why we capture this:** (fill)

## TR-5 — R-5 fixtures + regression integrity: planted-violation fixtures in both report and enforce modes, a planted fixture per W3 risk class, the -w/fixer false-refuse locked as a standing regression class, and the cross-provider gauntlet green on the dispatch-contract + coverage-gate diffs

**Event:** (fill)
**When:** (fill)
**Captured fields:** (fill)
**Linked requirement:** `R-5`
**Linked story:** `S-5`
**Why we capture this:** (fill)
