<!-- requirement-format-legacy -->
# Granular Stories — E-DISPATCH-INTEGRITY-001 F-1+F-3 — coverage-honesty (kill telemetry-only false-greens)

**Sprint:** `SP-20260610-005`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — TICKET-1: F-1 — both coverage scans require a correlated ok:true completion record; legacy date-cutoff; planted telemetry-only fixture goes RED post-cutoff, GREEN pre-cutoff; existing tests stay green.

**As** an auditor
**I want** both coverage scans (`scripts/checks/sprint-manager-consult.js`, `scripts/checks/sprint-hook-coverage.js`) to require a correlated `ok:true` completion record before counting a phase as covered, with a legacy date-cutoff (2026-06-10) exemption
**So that** a `manager_consult` telemetry record alone can no longer green scan:sprint-manager-consult / scan:sprint-hook-coverage (kills RC-2 "sprint theater") while historic sprints aren't retroactively uncovered.

Acceptance criteria:
- AC-1.1 — planted telemetry-only fixture goes RED post-cutoff (see `acceptance-criteria.md`)
- AC-1.2 — record-backed fixture goes GREEN
- AC-1.3 — pre-cutoff legacy fixture goes GREEN (explicit exemption, not silence)
- AC-1.4 — existing tests stay green

Linked: `H-1`, `R-1`, `R-2`, `R-4`. Ticket: `T-300`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — TICKET-2: F-3 — gauntlet-verify mandatory sprint_id + bounded window; whole-ledger invocation refused with usage error; planted historic-green fixture fails; caller audit (epsilon-runtime, sprint close) updated in-commit.

**As** the gauntlet
**I want** `scripts/dispatch/gauntlet-verify.js` to require a `sprint_id` + bounded window, refuse whole-ledger invocation with a usage error (exit non-zero), and have its callers (epsilon-runtime, sprint close) audited/updated in the same commit
**So that** a historic `ok:true` record can never green a never-ran lane — the T3 historic-green false-positive (RC-4/G4) no longer passes.

Acceptance criteria:
- AC-2.1 — unbounded (whole-ledger) invocation exits non-zero with usage guidance (see `acceptance-criteria.md`)
- AC-2.2 — planted historic-green fixture FAILS under sprint_id/window correlation
- AC-2.3 — correlated in-window `ok:true` record passes; caller audit complete, existing tests stay green

Linked: `H-2`, `R-3`, `R-4`. Ticket: `T-301`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

