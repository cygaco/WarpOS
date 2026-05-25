<!-- requirement-format-legacy -->
# Granular Stories — Suite reconciliation — portfolio/bootstrap/product (0.15.0 sprint 1)

**Sprint:** `SP-20260525-021`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-021\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Create .claude/commands/bootstrap/ with bootstrap:spinup (skeleton: phases + --clone hook) and bootstrap:ponder (moved).

**As** the user
**I want** Create .claude/commands/bootstrap/ with bootstrap:spinup (skeleton: phases + --clone hook) and bootstrap:ponder (moved).
**So that** One coherent, memorable command surface for creating/managing products: from WarpOS (portfolio:*) or from inside a project (bootstrap:*), both reaching the same on-ramp. Fewer skills to learn; product:* confusion gone; cloning reads as an entry mode, not a separate tool. Sets up SP-022 (canon) + SP-023 (spinup orchestrator).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Fold portfolio:bootstrap (brief Q&A) into spinup's default intent mode; delete the standalone.

**As** the user
**I want** Fold portfolio:bootstrap (brief Q&A) into spinup's default intent mode; delete the standalone.
**So that** One coherent, memorable command surface for creating/managing products: from WarpOS (portfolio:*) or from inside a project (bootstrap:*), both reaching the same on-ramp. Fewer skills to learn; product:* confusion gone; cloning reads as an entry mode, not a separate tool. Sets up SP-022 (canon) + SP-023 (spinup orchestrator).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Fold portfolio:clone into spinup --clone (reuse scripts/portfolio/clone.js + WG-11 discovery); delete the standalone.

**As** the user
**I want** Fold portfolio:clone into spinup --clone (reuse scripts/portfolio/clone.js + WG-11 discovery); delete the standalone.
**So that** One coherent, memorable command surface for creating/managing products: from WarpOS (portfolio:*) or from inside a project (bootstrap:*), both reaching the same on-ramp. Fewer skills to learn; product:* confusion gone; cloning reads as an entry mode, not a separate tool. Sets up SP-022 (canon) + SP-023 (spinup orchestrator).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Add portfolio: thin wrappers (spinup at minimum) that dispatch /bootstrap:<skill> <slug>.

**As** the user
**I want** Add portfolio: thin wrappers (spinup at minimum) that dispatch /bootstrap:<skill> <slug>.
**So that** One coherent, memorable command surface for creating/managing products: from WarpOS (portfolio:*) or from inside a project (bootstrap:*), both reaching the same on-ramp. Fewer skills to learn; product:* confusion gone; cloning reads as an entry mode, not a separate tool. Sets up SP-022 (canon) + SP-023 (spinup orchestrator).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Rename portfolio:dispatch -> portfolio:run (skill + body + engine reference).

**As** the user
**I want** Rename portfolio:dispatch -> portfolio:run (skill + body + engine reference).
**So that** One coherent, memorable command surface for creating/managing products: from WarpOS (portfolio:*) or from inside a project (bootstrap:*), both reaching the same on-ramp. Fewer skills to learn; product:* confusion gone; cloning reads as an entry mode, not a separate tool. Sets up SP-022 (canon) + SP-023 (spinup orchestrator).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Fold adopt into portfolio:new --from-brief; delete standalone adopt.

**As** the user
**I want** Fold adopt into portfolio:new --from-brief; delete standalone adopt.
**So that** One coherent, memorable command surface for creating/managing products: from WarpOS (portfolio:*) or from inside a project (bootstrap:*), both reaching the same on-ramp. Fewer skills to learn; product:* confusion gone; cloning reads as an entry mode, not a separate tool. Sets up SP-022 (canon) + SP-023 (spinup orchestrator).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Delete .claude/commands/product/ (4 aliases) and portfolio:import.

**As** the user
**I want** Delete .claude/commands/product/ (4 aliases) and portfolio:import.
**So that** One coherent, memorable command surface for creating/managing products: from WarpOS (portfolio:*) or from inside a project (bootstrap:*), both reaching the same on-ramp. Fewer skills to learn; product:* confusion gone; cloning reads as an entry mode, not a separate tool. Sets up SP-022 (canon) + SP-023 (spinup orchestrator).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-8 — Grep-sweep the repo for old names (portfolio:clone/bootstrap/dispatch/import/adopt, product:*) and update/remove every reference.

**As** the user
**I want** Grep-sweep the repo for old names (portfolio:clone/bootstrap/dispatch/import/adopt, product:*) and update/remove every reference.
**So that** One coherent, memorable command surface for creating/managing products: from WarpOS (portfolio:*) or from inside a project (bootstrap:*), both reaching the same on-ramp. Fewer skills to learn; product:* confusion gone; cloning reads as an entry mode, not a separate tool. Sets up SP-022 (canon) + SP-023 (spinup orchestrator).

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-8`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

