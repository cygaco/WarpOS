<!-- requirement-format-legacy -->
# High-Level Stories — E-DISPATCH-SHAPE-001 W2-core: shape-door report-only parity + per-wrapper enforce-ramp scaffolding

**Sprint:** `SP-20260616-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260616-001\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As the dispatch substrate, every entry point self-detects wrong-shape routing on a real dispatch, not just two of four

**As** the user
**I want** As the dispatch substrate, every entry point self-detects wrong-shape routing on a real dispatch, not just two of four
**So that** Every dispatch path (skill, epsilon-runtime, agent, claude) gains a uniform, kill-switchable self-detection seam for wrong-shape routing, closing the W2-core parity gap on the Master Console critical path while keeping operational behavior byte-identical until an operator-gated per-wrapper enforce flip.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As the operator, I can flip any single wrapper from report to enforce with one env var, and kill the whole door instantly if it false-refuses

**As** the user
**I want** As the operator, I can flip any single wrapper from report to enforce with one env var, and kill the whole door instantly if it false-refuses
**So that** Every dispatch path (skill, epsilon-runtime, agent, claude) gains a uniform, kill-switchable self-detection seam for wrong-shape routing, closing the W2-core parity gap on the Master Console critical path while keeping operational behavior byte-identical until an operator-gated per-wrapper enforce flip.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
