<!-- requirement-format-legacy -->
# Granular Stories — E-DISPATCH-SHAPE-001 W0 — make the ids and clocks true

**Sprint:** `SP-20260610-006`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-006\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — TICKET-1 (BACKEND, G1): make the builder advisory truthful — dispatch-claude maps a known-generic build id to the build_chain_worker contract class (resolvable→honest/silent), a truly-unknown id keeps the fail-closed wording; wrapper + dispatch-contract agree; planted test: a scrapped id's advisory is honest, a resolvable id is silent. Record the option choice in the commit.

**As** the user
**I want** TICKET-1 (BACKEND, G1): make the builder advisory truthful — dispatch-claude maps a known-generic build id to the build_chain_worker contract class (resolvable→honest/silent), a truly-unknown id keeps the fail-closed wording; wrapper + dispatch-contract agree; planted test: a scrapped id's advisory is honest, a resolvable id is silent. Record the option choice in the commit.
**So that** A builder dispatch no longer prints a lying '(fail-closed)' advisory then proceeds; real runs carry a run_id so run-scoped coverage is satisfiable instead of degrading to time-window correlation; a foreground-dispatched wrapper writes its death record before the harness kills it (the doogle 560s death that wrote nothing stops happening). Each is guarded by a planted-violation test so the gap can't silently reopen.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — TICKET-2 (BACKEND, N8): full.js + epsilon-runtime spawnAgent export WARPOS_RUN_ID + WARPOS_PHASE_ID (+ WARPOS_SPRINT_ID when available) onto the dispatched child env; planted test: a record written under a live run (env set) carries a non-null run_id and satisfies the coverage run-scope check; a null run_id under a live run fails it.

**As** the user
**I want** TICKET-2 (BACKEND, N8): full.js + epsilon-runtime spawnAgent export WARPOS_RUN_ID + WARPOS_PHASE_ID (+ WARPOS_SPRINT_ID when available) onto the dispatched child env; planted test: a record written under a live run (env set) carries a non-null run_id and satisfies the coverage run-scope check; a null run_id under a live run fails it.
**So that** A builder dispatch no longer prints a lying '(fail-closed)' advisory then proceeds; real runs carry a run_id so run-scoped coverage is satisfiable instead of degrading to time-window correlation; a foreground-dispatched wrapper writes its death record before the harness kills it (the doogle 560s death that wrote nothing stops happening). Each is guarded by a planted-violation test so the gap can't silently reopen.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — TICKET-3 (BACKEND, G8/N1): foreground-aware wrapper bound — dispatch-claude/epsilon/dispatch-skill clamp the effective foreground bound to ≤540s unless explicitly backgrounded; death record always written on the bound; NEW standalone scripts/checks/dispatch-timeout-sanity.js (report-only, fail-closed) asserts every wrapper's foreground bound ≤540s; planted test: a >540s foreground bound fails the check. /scan:full wiring as a comment note only.

**As** the user
**I want** TICKET-3 (BACKEND, G8/N1): foreground-aware wrapper bound — dispatch-claude/epsilon/dispatch-skill clamp the effective foreground bound to ≤540s unless explicitly backgrounded; death record always written on the bound; NEW standalone scripts/checks/dispatch-timeout-sanity.js (report-only, fail-closed) asserts every wrapper's foreground bound ≤540s; planted test: a >540s foreground bound fails the check. /scan:full wiring as a comment note only.
**So that** A builder dispatch no longer prints a lying '(fail-closed)' advisory then proceeds; real runs carry a run_id so run-scoped coverage is satisfiable instead of degrading to time-window correlation; a foreground-dispatched wrapper writes its death record before the harness kills it (the doogle 560s death that wrote nothing stops happening). Each is guarded by a planted-violation test so the gap can't silently reopen.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

