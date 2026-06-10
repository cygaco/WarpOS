<!-- requirement-format-legacy -->
# High-Level Stories — Lane B — dispatch/registry coherence (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-002\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — Registry-routed spec models agree with the role-registry

**As** the dispatcher (α)
**I want** every registry-routed role's spec frontmatter model pinned from the role-registry (no `model: inherit`, no sonnet-vs-opus drift), with role-parity-scan failing loudly on any mismatch
**So that** sub-agents never silently run on the session model and the role-registry stays the enforced single routing source (ADR-0008 keystone).

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`, `R-2`, `R-6`.

## H-2 — Derived dispatch shape never contradicts the registry route

**As** an enforcer author
**I want** the dispatch-contract's class_derivation to derive subprocess shape for cross-provider leads (before the generic `{tier:lead}→manager` rule) and the parity scan to FAIL on any shape-vs-route contradiction
**So that** shape-based gates can be trusted — design-lead's derived shape matches its registry route instead of contradicting it (live advisory observed in doogle SP-20260609-001).

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`, `R-3`.

## H-3 — Teammate-ε's documented conduct route is one it can actually execute

**As** a teammate-spawned ε
**I want** subprocess dispatch (`claude -p --agent` non-build, `dispatch-claude.js` build-chain, `dispatch-agent.js` cross-provider) documented as my SANCTIONED conduct route (ED-041-consistent), with a startup self-check that records which conduct route is active
**So that** every future product install gets a conduct loop that is actually implementable instead of an Agent-tool loop a teammate cannot run (operator-ratified in doogle 2026-06-09).

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-4`.

## H-4 — A stalled conductor surfaces as a loud event

**As** the team lead
**I want** teammate stall rules in epsilon.md (never idle awaiting background returns, dispatch blocking, report-before-idle) plus a fail-closed epsilon-liveness check
**So that** a stalled conductor surfaces as a loud `epsilon-stalled` event within N minutes instead of a 25-minute silent wait the operator has to notice (recurrence ×3 in doogle).

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-5`, `R-6`.
