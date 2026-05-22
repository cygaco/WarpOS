<!-- requirement-format-legacy -->
# PRD — Maintainer &amp; Product Workflow — .vscode/tasks.json from portfolio registry, /portfolio:open --spawn VS Code preference, aiweb product-delivery ticket (cadence rule)

**Sprint:** `SP-20260522-003`
**Plan Contract:** `PC-20260522-0024`
**Status:** draft
**Documentation scale:** `m`

## Outcome

Maintainer can switch between WarpOS-the-framework and N product repos via Ctrl+Shift+P → 'Run Task' → 'Claude: <slug>' (3 keystrokes). Each task spawns a labelled VS Code terminal pane cd'd to the right repo with `claude` running. Single VS Code window anchored to WarpOS; N panes scoped to N products. Aiweb gains the cadence-rule deliverable; future product sprints inherit the workflow.

## Context

### Original Request

> Read roadmap.md and proceed with the first 3 sprints, using /sprint:full --turbo for each.

[follow-up from user: 'And we can use a product delivery ticket from aiweb, I am doing several now, just make one up']

ROADMAP.md ## Next: Maintainer & Product Workflow (the in-scope text for this sprint, 2026-05-22):

Sprint-3 target. Reason: with privacy + install integrity solid, throughput is the next constraint — the maintainer iterating WarpOS while running product sprints in parallel without context-switching pain. Per cadence rule, Sprint 3 must also ship at least one product-side delivery in a portfolio product.

[open] Generate .vscode/tasks.json from portfolio registry — new scripts/portfolio/generate-vscode-tasks.js reads ~/.warpos/portfolio.json, writes one task per product. Hook into /portfolio:register, /portfolio:new, /portfolio:adopt. New /portfolio:tasks skill for manual regeneration.

[open] /portfolio:open --spawn prefer `code -n <path>` inside VS Code (when TERM_PROGRAM=vscode). ~10 min fix in scripts/portfolio/spawn.js#PLATFORM_BINARIES.win32.

[open] Product-delivery sprint (cadence rule). Refuse to start Sprint 3 without naming a product-delivery ticket.

### Interpreted Intent

Reduce the maintainer's friction running multiple portfolio products in parallel. (1) Generate .vscode/tasks.json from ~/.warpos/portfolio.json so each product gets a labelled task that opens an integrated VS Code terminal scoped to that repo. Hook portfolio mutations (/portfolio:register, /portfolio:new, /portfolio:adopt) to regenerate, and add /portfolio:tasks for manual refresh. (2) Tiny VS Code preference in /portfolio:open --spawn: when TERM_PROGRAM=vscode, prefer `code -n <path>` over `wt` so the new window stays inside VS Code's workspace. (3) Product-delivery ticket against aiweb per the cadence rule — exercises the new tasks.json workflow against a real product.

### Current Behavior

Portfolio registry exists at ~/.warpos/portfolio.json. /portfolio:open --spawn exists with platform binaries for win32 (wt — Windows Terminal). VS Code preference is not implemented. No .vscode/tasks.json generation today. /portfolio:tasks does not exist. Maintainer running multiple portfolio products today opens a new wt window per product, or manually opens each in VS Code separately.

### Desired Behavior

After running /portfolio:tasks (or after /portfolio:register/new/adopt auto-regenerate), the maintainer's .vscode/tasks.json contains one shell task per registered product. Each task: label = 'Claude: <slug>', command = 'claude', cwd = <repo-path>, panel = new, reveal = always, focus = true. Ctrl+Shift+P → Run Task → fuzzy-pick = 3 keystrokes to spawn a new terminal pane scoped to the product. Separately, when /portfolio:open --spawn runs and TERM_PROGRAM=vscode, the new window opens via `code -n <path>` (VS Code) rather than `wt` (Windows Terminal). Aiweb ships the chosen product-delivery feature, demonstrating the workflow end-to-end.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — Tasks generator (scripts/portfolio/generate-vscode-tasks.js)
- `R-2` — /portfolio:tasks skill
- `R-3` — Auto-hook in /portfolio:register, /portfolio:new, /portfolio:adopt

## Non-Goals

- Do NOT build the warpos-vscode extension (parked in ROADMAP Later: Platform Bets)

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/portfolio/generate-vscode-tasks.js (new) | assumed_from_request |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260522-0024.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-003\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-003\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-003\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-003\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-003\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-003\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-003\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-003\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-003\release-plan.md`
