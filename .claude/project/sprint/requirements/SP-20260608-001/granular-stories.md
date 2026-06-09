<!-- requirement-format-legacy -->
# Granular Stories — Dispatch-shape north star — resolver + earn-it ping-reap fix + mechanical enforcement

**Sprint:** `SP-20260608-001`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260608-001\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — TICKET-1 (Beta: FIRST): fix the §13.6 ping non-deterministic reap so a bounded ping returns a real result deterministically (or a documented retry/savepoint mitigation that lets the earn-it stamp honestly); prove with N consecutive non-reaping pings.

**As** the user
**I want** TICKET-1 (Beta: FIRST): fix the §13.6 ping non-deterministic reap so a bounded ping returns a real result deterministically (or a documented retry/savepoint mitigation that lets the earn-it stamp honestly); prove with N consecutive non-reaping pings.
**So that** The orchestrator stops choosing dispatch shapes by hand (the recurring failure: build-chain run in-process, heavy skills run inline, the team skipped). Every unit gets the right shape from one consulted resolver; a wrong shape is caught mechanically; and a subprocess skill only routes subprocess once it has PROVEN it pays + stays good — so the dispatch system is reliable, not aspirational.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — TICKET-2: ε gauntlets the drafted resolver with a REAL PLAN-§17 decision-rule test (each rule branch incl. a mismatched-shape via shapeMismatch; agent→contract, unproven-subprocess-skill→inline fail-closed, proven→subprocess, ad-hoc criteria-matrix); harden per findings.

**As** the user
**I want** TICKET-2: ε gauntlets the drafted resolver with a REAL PLAN-§17 decision-rule test (each rule branch incl. a mismatched-shape via shapeMismatch; agent→contract, unproven-subprocess-skill→inline fail-closed, proven→subprocess, ad-hoc criteria-matrix); harden per findings.
**So that** The orchestrator stops choosing dispatch shapes by hand (the recurring failure: build-chain run in-process, heavy skills run inline, the team skipped). Every unit gets the right shape from one consulted resolver; a wrong shape is caught mechanically; and a subprocess skill only routes subprocess once it has PROVEN it pays + stays good — so the dispatch system is reliable, not aspirational.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — TICKET-3: wire resolveShape + shapeMismatch as the consulted authority in route-guard / the dispatch wrappers (the wrong shape self-detects on a real dispatch).

**As** the user
**I want** TICKET-3: wire resolveShape + shapeMismatch as the consulted authority in route-guard / the dispatch wrappers (the wrong shape self-detects on a real dispatch).
**So that** The orchestrator stops choosing dispatch shapes by hand (the recurring failure: build-chain run in-process, heavy skills run inline, the team skipped). Every unit gets the right shape from one consulted resolver; a wrong shape is caught mechanically; and a subprocess skill only routes subprocess once it has PROVEN it pays + stays good — so the dispatch system is reliable, not aspirational.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — TICKET-4: run §13.6 ping + §13.7 measurement for the heavy skills now that the ping is reliable; stamp subprocess_verified:true ONLY where both axes genuinely pass (fail-closed); the resolver then routes them subprocess.

**As** the user
**I want** TICKET-4: run §13.6 ping + §13.7 measurement for the heavy skills now that the ping is reliable; stamp subprocess_verified:true ONLY where both axes genuinely pass (fail-closed); the resolver then routes them subprocess.
**So that** The orchestrator stops choosing dispatch shapes by hand (the recurring failure: build-chain run in-process, heavy skills run inline, the team skipped). Every unit gets the right shape from one consulted resolver; a wrong shape is caught mechanically; and a subprocess skill only routes subprocess once it has PROVEN it pays + stays good — so the dispatch system is reliable, not aspirational.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — TICKET-5 (scope-guarded close-out): verify/finish doc-ref-integrity merge-guard auto-fire + team-guard default-ON; regen BOTH manifests; ff-merge to main.

**As** the user
**I want** TICKET-5 (scope-guarded close-out): verify/finish doc-ref-integrity merge-guard auto-fire + team-guard default-ON; regen BOTH manifests; ff-merge to main.
**So that** The orchestrator stops choosing dispatch shapes by hand (the recurring failure: build-chain run in-process, heavy skills run inline, the team skipped). Every unit gets the right shape from one consulted resolver; a wrong shape is caught mechanically; and a subprocess skill only routes subprocess once it has PROVEN it pays + stays good — so the dispatch system is reliable, not aspirational.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

