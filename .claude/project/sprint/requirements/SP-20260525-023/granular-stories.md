<!-- requirement-format-legacy -->
# Granular Stories — Spinup orchestrator — wire bootstrap:spinup pipeline end-to-end (0.15.0 sprint 3 of 3)

**Sprint:** `SP-20260525-023`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-023\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Phase 0: wire /check:install as a hard pre-flight gate (incl. WG-4 sprint probe) that refuses a gappy install.

**As** the user
**I want** Phase 0: wire /check:install as a hard pre-flight gate (incl. WG-4 sprint probe) that refuses a gappy install.
**So that** The 0.15.0 milestone's payoff: a fresh product goes from 'just WarpOS installed' to 'core loop on screen' with ONE command. This is JTBD-3 ('just WarpOS' -> canonical docs + roadmap + something running) fully realized. Sprints A (suite reconciliation) and B (canon engine) built the parts; C composes them into the on-ramp.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Phase 1 intent: drive the guided brief (default) AND the --clone path (reuse scripts/portfolio/clone.js); the chosen output feeds Phase 2.

**As** the user
**I want** Phase 1 intent: drive the guided brief (default) AND the --clone path (reuse scripts/portfolio/clone.js); the chosen output feeds Phase 2.
**So that** The 0.15.0 milestone's payoff: a fresh product goes from 'just WarpOS installed' to 'core loop on screen' with ONE command. This is JTBD-3 ('just WarpOS' -> canonical docs + roadmap + something running) fully realized. Sprints A (suite reconciliation) and B (canon engine) built the parts; C composes them into the on-ramp.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Phase 2 canon: chain the Phase-1 intent into scripts/canon/generate.js (verify the T6 wiring end-to-end from the orchestrator).

**As** the user
**I want** Phase 2 canon: chain the Phase-1 intent into scripts/canon/generate.js (verify the T6 wiring end-to-end from the orchestrator).
**So that** The 0.15.0 milestone's payoff: a fresh product goes from 'just WarpOS installed' to 'core loop on screen' with ONE command. This is JTBD-3 ('just WarpOS' -> canonical docs + roadmap + something running) fully realized. Sprints A (suite reconciliation) and B (canon engine) built the parts; C composes them into the on-ramp.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Phase 3 roadmap: invoke roadmap:create grounded in the generated _requirements/00-canonical/*, MVP-core-loop-first.

**As** the user
**I want** Phase 3 roadmap: invoke roadmap:create grounded in the generated _requirements/00-canonical/*, MVP-core-loop-first.
**So that** The 0.15.0 milestone's payoff: a fresh product goes from 'just WarpOS installed' to 'core loop on screen' with ONE command. This is JTBD-3 ('just WarpOS' -> canonical docs + roadmap + something running) fully realized. Sprints A (suite reconciliation) and B (canon engine) built the parts; C composes them into the on-ramp.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Phase 4 on-screen: execute Milestone-1's first sprint with a verify-before-claim serve gate (build clean + dev server HTTP 200 + entry module transforms).

**As** the user
**I want** Phase 4 on-screen: execute Milestone-1's first sprint with a verify-before-claim serve gate (build clean + dev server HTTP 200 + entry module transforms).
**So that** The 0.15.0 milestone's payoff: a fresh product goes from 'just WarpOS installed' to 'core loop on screen' with ONE command. This is JTBD-3 ('just WarpOS' -> canonical docs + roadmap + something running) fully realized. Sprints A (suite reconciliation) and B (canon engine) built the parts; C composes them into the on-ramp.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Phase-state + flags: --phase <name> re-runs one phase, --resume continues from the last completed phase.

**As** the user
**I want** Phase-state + flags: --phase <name> re-runs one phase, --resume continues from the last completed phase.
**So that** The 0.15.0 milestone's payoff: a fresh product goes from 'just WarpOS installed' to 'core loop on screen' with ONE command. This is JTBD-3 ('just WarpOS' -> canonical docs + roadmap + something running) fully realized. Sprints A (suite reconciliation) and B (canon engine) built the parts; C composes them into the on-ramp.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Fixture e2e: a sample intent drives the chain (intent->canon->roadmap) in canonical without standing up a real product — the verify-before-claim for this orchestration.

**As** the user
**I want** Fixture e2e: a sample intent drives the chain (intent->canon->roadmap) in canonical without standing up a real product — the verify-before-claim for this orchestration.
**So that** The 0.15.0 milestone's payoff: a fresh product goes from 'just WarpOS installed' to 'core loop on screen' with ONE command. This is JTBD-3 ('just WarpOS' -> canonical docs + roadmap + something running) fully realized. Sprints A (suite reconciliation) and B (canon engine) built the parts; C composes them into the on-ramp.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

