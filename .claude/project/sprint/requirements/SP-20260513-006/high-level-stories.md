# High-Level Stories — Turbo as mode argument

**Sprint:** `SP-20260513-006`
**PRD:** `prd.md`

## H-1 — Operator enters mode + pre-authorizes in one command

**As** an operator about to drive a batch of routine actions
**I want** `/mode:<mode> --turbo` to enter the mode AND apply a turbo authorization in a single command
**So that** I don't pay the keyboard cadence of running two commands back-to-back to start the same work.

Linked requirements: `R-1`, `R-2`, `R-4`.
Linked granular stories: `S-1`, `S-2`, `S-3`, `S-5`.

## H-2 — Default scope per mode matches typical workload

**As** an operator
**I want** each mode's `--turbo` (no args) to authorize a scope set appropriate to that mode's typical workload
**So that** the shortcut actually shortens the work without needing to spell out `--scope` every time.

Linked requirements: `R-1`.
Linked granular stories: `S-2`.

## H-3 — Clear recovery when turbo apply fails after mode is set

**As** an operator
**I want** a clear instruction when `mode-set` succeeded but `turbo apply` failed (mode active, turbo not)
**So that** I'm not stranded in a half-applied state without knowing what to re-run.

Linked requirements: `R-3`.
Linked granular stories: `S-4`.

## H-4 — `/turbo` skill body declares the composition

**As** a future maintainer reading `/turbo` for the first time
**I want** the skill body to say "also invoked by `/mode:X` when `--turbo` is passed"
**So that** the cross-skill composition is discoverable without grepping every mode skill.

Linked requirements: `R-4`.
Linked granular stories: `S-5`.
