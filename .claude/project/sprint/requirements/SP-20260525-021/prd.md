<!-- requirement-format-legacy -->
# PRD — Suite reconciliation — portfolio/bootstrap/product (0.15.0 sprint 1)

**Sprint:** `SP-20260525-021`
**Plan Contract:** `PC-20260525-0054`
**Status:** draft
**Documentation scale:** `m`

## Outcome

One coherent, memorable command surface for creating/managing products: from WarpOS (portfolio:*) or from inside a project (bootstrap:*), both reaching the same on-ramp. Fewer skills to learn; product:* confusion gone; cloning reads as an entry mode, not a separate tool. Sets up SP-022 (canon) + SP-023 (spinup orchestrator).

## Context

### Original Request

> Reconcile the product, portfolio, and cloning suites. JTBDs: (1) clear+memorable skill names; (2) portfolio: from WarpOS, bootstrap: in installed projects; (3) 'just WarpOS' -> canonical docs + roadmap-with-sprints; (4) cloning as an alternate entry-point. Constraints: portfolio: is the from-WarpOS suite, bootstrap: is the in-project suite, product:* gone at the end. Decisions locked with operator: portfolio:* are thin dispatch-wrappers over the real in-project bootstrap:* impls; fold brief + clone into spinup as modes (--clone); delete product:* + import + standalone clone + standalone bootstrap(brief); fold adopt into portfolio:new; rename portfolio:dispatch -> portfolio:run; keep ponder as bootstrap:ponder. (This sprint = the reconciliation only; canon engine + spinup orchestrator are SP-022/023.)

### Interpreted Intent

Restructure two skill namespaces into a single-source-of-truth model: bootstrap:* hold the real in-project implementations; portfolio:* keep the manager skills (new/list/status/sync/open/register/run) plus thin wrappers that dispatch bootstrap:* into a chosen product via the existing portfolio:dispatch primitive. Cloning + the product brief stop being standalone skills and become modes of spinup (--clone / default). product:* deprecated aliases are removed entirely. Renames: dispatch->run; adopt folds into new --from-brief. No behavior is lost: the clone ENGINE (scripts/portfolio/clone.js) and the WG-11 source-class discovery are preserved and reused by spinup --clone.

### Current Behavior

portfolio/ holds 13 skills mixing manager (new/list/status/sync/open/register/adopt/dispatch) + content (bootstrap/clone/import/ponder/spinup). product/ holds 4 deprecated aliases. No bootstrap: namespace. portfolio:dispatch already runs any skill against a sibling via subprocess+CLAUDE_PROJECT_DIR (the wrapper mechanism). clone + brief are standalone content skills.

### Desired Behavior

bootstrap:spinup (+ --clone) and bootstrap:ponder exist as the real in-project skills. portfolio:* = new, list, status, sync, open, register, run (was dispatch), spinup (thin wrapper). product:*, portfolio:import, standalone clone, standalone bootstrap(brief), standalone adopt are gone. A repo-wide grep for the old names returns no stale references. /check:install + /skills:cleanup pass. The clone engine + WG-11 source-classes are preserved in spinup --clone.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — skill-namespace
- `R-2` — dispatch-wrappers
- `R-3` — skill-deletes

## Non-Goals

- The canon engine (SP-022) and the spinup orchestrator pipeline (SP-023) — this sprint only reconciles the suite surface + skeletons

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| .claude/commands/bootstrap/ (NEW namespace) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260525-0054.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-021\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-021\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-021\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-021\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-021\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-021\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-021\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-021\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-021\release-plan.md`
