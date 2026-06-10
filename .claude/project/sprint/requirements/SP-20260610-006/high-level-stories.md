<!-- requirement-format-legacy -->
# High-Level Stories — E-DISPATCH-SHAPE-001 W0 — make the ids and clocks true

**Sprint:** `SP-20260610-006`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-006\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As the dispatch ledger, a builder dispatch's advisory tells the truth (resolvable→silent, unresolvable→honest), so 4-sprints-of-builds-on-a-lying-advisory can't recur.

**As** the user
**I want** As the dispatch ledger, a builder dispatch's advisory tells the truth (resolvable→silent, unresolvable→honest), so 4-sprints-of-builds-on-a-lying-advisory can't recur.
**So that** A builder dispatch no longer prints a lying '(fail-closed)' advisory then proceeds; real runs carry a run_id so run-scoped coverage is satisfiable instead of degrading to time-window correlation; a foreground-dispatched wrapper writes its death record before the harness kills it (the doogle 560s death that wrote nothing stops happening). Each is guarded by a planted-violation test so the gap can't silently reopen.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As the coverage gate, real runs carry a run_id, so run-scoped §17.4 coverage is satisfiable instead of degrading to time-windows.

**As** the user
**I want** As the coverage gate, real runs carry a run_id, so run-scoped §17.4 coverage is satisfiable instead of degrading to time-windows.
**So that** A builder dispatch no longer prints a lying '(fail-closed)' advisory then proceeds; real runs carry a run_id so run-scoped coverage is satisfiable instead of degrading to time-window correlation; a foreground-dispatched wrapper writes its death record before the harness kills it (the doogle 560s death that wrote nothing stops happening). Each is guarded by a planted-violation test so the gap can't silently reopen.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
