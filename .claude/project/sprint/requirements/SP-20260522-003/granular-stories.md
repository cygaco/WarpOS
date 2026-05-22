<!-- requirement-format-legacy -->
# Granular Stories — Maintainer &amp; Product Workflow — .vscode/tasks.json from portfolio registry, /portfolio:open --spawn VS Code preference, aiweb product-delivery ticket (cadence rule)

**Sprint:** `SP-20260522-003`
**High-level stories:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-003\high-level-stories.md`

> Granular stories use the `S-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`. Each granular story
> should produce roughly one ticket during `/sprint:design`.

## S-1 — Implement scripts/portfolio/generate-vscode-tasks.js (read ~/.warpos/portfolio.json, write per-product task entries)

**As** the user
**I want** Implement scripts/portfolio/generate-vscode-tasks.js (read ~/.warpos/portfolio.json, write per-product task entries)
**So that** Maintainer can switch between WarpOS-the-framework and N product repos via Ctrl+Shift+P → 'Run Task' → 'Claude: <slug>' (3 keystrokes). Each task spawns a labelled VS Code terminal pane cd'd to the right repo with `claude` running. Single VS Code window anchored to WarpOS; N panes scoped to N products. Aiweb gains the cadence-rule deliverable; future product sprints inherit the workflow.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-1`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-2 — Implement /portfolio:tasks skill (manual regen + diff)

**As** the user
**I want** Implement /portfolio:tasks skill (manual regen + diff)
**So that** Maintainer can switch between WarpOS-the-framework and N product repos via Ctrl+Shift+P → 'Run Task' → 'Claude: <slug>' (3 keystrokes). Each task spawns a labelled VS Code terminal pane cd'd to the right repo with `claude` running. Single VS Code window anchored to WarpOS; N panes scoped to N products. Aiweb gains the cadence-rule deliverable; future product sprints inherit the workflow.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-2`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-3 — Hook tasks-regen into /portfolio:register flow

**As** the user
**I want** Hook tasks-regen into /portfolio:register flow
**So that** Maintainer can switch between WarpOS-the-framework and N product repos via Ctrl+Shift+P → 'Run Task' → 'Claude: <slug>' (3 keystrokes). Each task spawns a labelled VS Code terminal pane cd'd to the right repo with `claude` running. Single VS Code window anchored to WarpOS; N panes scoped to N products. Aiweb gains the cadence-rule deliverable; future product sprints inherit the workflow.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-3`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-4 — Hook tasks-regen into /portfolio:new flow

**As** the user
**I want** Hook tasks-regen into /portfolio:new flow
**So that** Maintainer can switch between WarpOS-the-framework and N product repos via Ctrl+Shift+P → 'Run Task' → 'Claude: <slug>' (3 keystrokes). Each task spawns a labelled VS Code terminal pane cd'd to the right repo with `claude` running. Single VS Code window anchored to WarpOS; N panes scoped to N products. Aiweb gains the cadence-rule deliverable; future product sprints inherit the workflow.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-4`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-5 — Hook tasks-regen into /portfolio:adopt flow

**As** the user
**I want** Hook tasks-regen into /portfolio:adopt flow
**So that** Maintainer can switch between WarpOS-the-framework and N product repos via Ctrl+Shift+P → 'Run Task' → 'Claude: <slug>' (3 keystrokes). Each task spawns a labelled VS Code terminal pane cd'd to the right repo with `claude` running. Single VS Code window anchored to WarpOS; N panes scoped to N products. Aiweb gains the cadence-rule deliverable; future product sprints inherit the workflow.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-5`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-6 — Modify scripts/portfolio/spawn.js#PLATFORM_BINARIES.win32 to prefer code -n when TERM_PROGRAM=vscode (keep wt as fallback)

**As** the user
**I want** Modify scripts/portfolio/spawn.js#PLATFORM_BINARIES.win32 to prefer code -n when TERM_PROGRAM=vscode (keep wt as fallback)
**So that** Maintainer can switch between WarpOS-the-framework and N product repos via Ctrl+Shift+P → 'Run Task' → 'Claude: <slug>' (3 keystrokes). Each task spawns a labelled VS Code terminal pane cd'd to the right repo with `claude` running. Single VS Code window anchored to WarpOS; N panes scoped to N products. Aiweb gains the cadence-rule deliverable; future product sprints inherit the workflow.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-6`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-7 — Pick aiweb feature (operator decision or make-one-up at design) — ticket minted in /sprint:design

**As** the user
**I want** Pick aiweb feature (operator decision or make-one-up at design) — ticket minted in /sprint:design
**So that** Maintainer can switch between WarpOS-the-framework and N product repos via Ctrl+Shift+P → 'Run Task' → 'Claude: <slug>' (3 keystrokes). Each task spawns a labelled VS Code terminal pane cd'd to the right repo with `claude` running. Single VS Code window anchored to WarpOS; N panes scoped to N products. Aiweb gains the cadence-rule deliverable; future product sprints inherit the workflow.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-7`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-8 — Aiweb feature implementation

**As** the user
**I want** Aiweb feature implementation
**So that** Maintainer can switch between WarpOS-the-framework and N product repos via Ctrl+Shift+P → 'Run Task' → 'Claude: <slug>' (3 keystrokes). Each task spawns a labelled VS Code terminal pane cd'd to the right repo with `claude` running. Single VS Code window anchored to WarpOS; N panes scoped to N products. Aiweb gains the cadence-rule deliverable; future product sprints inherit the workflow.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-8`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

## S-9 — Aiweb feature verification (run the new VS Code task to validate workflow end-to-end)

**As** the user
**I want** Aiweb feature verification (run the new VS Code task to validate workflow end-to-end)
**So that** Maintainer can switch between WarpOS-the-framework and N product repos via Ctrl+Shift+P → 'Run Task' → 'Claude: <slug>' (3 keystrokes). Each task spawns a labelled VS Code terminal pane cd'd to the right repo with `claude` running. Single VS Code window anchored to WarpOS; N panes scoped to N products. Aiweb gains the cadence-rule deliverable; future product sprints inherit the workflow.

Acceptance criteria:
- AC-1: (set by design step)

Linked: `H-1`, `R-9`.
COPY: see `copy.md`.
INPUTS: see `inputs.md`.
TRACE: see `trace.md`.

