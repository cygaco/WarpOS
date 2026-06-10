<!-- requirement-format-legacy -->
# High-Level Stories — E-DISPATCH-INTEGRITY-001 F-1+F-3 — coverage-honesty (kill telemetry-only false-greens)

**Sprint:** `SP-20260610-005`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As an auditor, a green consult scan PROVES a manager actually ran (ok:true record), not merely that telemetry was emitted.

**As** an auditor
**I want** a green consult/coverage scan to PROVE a manager actually ran (a correlated `ok:true` completion record), not merely that a `manager_consult` telemetry record was emitted
**So that** Sprint phases can no longer read green while no agent actually ran — the recurring fake-green class (RC-2/RC-4) becomes mechanically impossible instead of policed by memory.

Linked granular stories: see `granular-stories.md` (`S-1`).
Linked requirements: `R-1`, `R-2`, `R-4` (legacy date-cutoff exemption so historic sprints aren't retroactively uncovered).

## H-2 — As the gauntlet, I can never be greened by someone else's old success record.

**As** the gauntlet
**I want** gauntlet-verify to correlate by `sprint_id` within a bounded window and REFUSE a whole-ledger verify
**So that** a historic `ok:true` record (someone else's old success) can never green a never-ran lane — the T3 historic-green false-positive no longer passes.

Linked granular stories: see `granular-stories.md` (`S-2`).
Linked requirements: `R-3`, `R-4` (caller compatibility — epsilon-runtime + sprint-close callers audited/updated in the same commit).
