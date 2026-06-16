<!-- requirement-format-legacy -->
# Granular Stories — E-DISPATCH-SHAPE-001 W2-core: shape-door report-only parity + per-wrapper enforce-ramp scaffolding

**Sprint:** `SP-20260616-001`
**High-level stories:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260616-001\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Add the shared shapeDoor() helper to dispatch-shape.js with report/enforce/kill-switch/fail-open semantics

**As** the user
**I want** Add the shared shapeDoor() helper to dispatch-shape.js with report/enforce/kill-switch/fail-open semantics
**So that** Every dispatch path (skill, epsilon-runtime, agent, claude) gains a uniform, kill-switchable self-detection seam for wrong-shape routing, closing the W2-core parity gap on the Master Console critical path while keeping operational behavior byte-identical until an operator-gated per-wrapper enforce flip.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Wire dispatch-skill.js to consult through the door (subprocess-skill shape)

**As** the user
**I want** Wire dispatch-skill.js to consult through the door (subprocess-skill shape)
**So that** Every dispatch path (skill, epsilon-runtime, agent, claude) gains a uniform, kill-switchable self-detection seam for wrong-shape routing, closing the W2-core parity gap on the Master Console critical path while keeping operational behavior byte-identical until an operator-gated per-wrapper enforce flip.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Wire epsilon-runtime.js to consult through the door at its spawn point

**As** the user
**I want** Wire epsilon-runtime.js to consult through the door at its spawn point
**So that** Every dispatch path (skill, epsilon-runtime, agent, claude) gains a uniform, kill-switchable self-detection seam for wrong-shape routing, closing the W2-core parity gap on the Master Console critical path while keeping operational behavior byte-identical until an operator-gated per-wrapper enforce flip.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Migrate dispatch-agent.js + dispatch-claude.js to the door, preserving current report-only + sanctioned-lane behavior

**As** the user
**I want** Migrate dispatch-agent.js + dispatch-claude.js to the door, preserving current report-only + sanctioned-lane behavior
**So that** Every dispatch path (skill, epsilon-runtime, agent, claude) gains a uniform, kill-switchable self-detection seam for wrong-shape routing, closing the W2-core parity gap on the Master Console critical path while keeping operational behavior byte-identical until an operator-gated per-wrapper enforce flip.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Add planted-violation tests for both modes + kill-switch + fail-open

**As** the user
**I want** Add planted-violation tests for both modes + kill-switch + fail-open
**So that** Every dispatch path (skill, epsilon-runtime, agent, claude) gains a uniform, kill-switchable self-detection seam for wrong-shape routing, closing the W2-core parity gap on the Master Console critical path while keeping operational behavior byte-identical until an operator-gated per-wrapper enforce flip.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Document the door + ramp + kill-switch in the dispatch guide and epsilon.md

**As** the user
**I want** Document the door + ramp + kill-switch in the dispatch guide and epsilon.md
**So that** Every dispatch path (skill, epsilon-runtime, agent, claude) gains a uniform, kill-switchable self-detection seam for wrong-shape routing, closing the W2-core parity gap on the Master Console critical path while keeping operational behavior byte-identical until an operator-gated per-wrapper enforce flip.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

