<!-- requirement-format-legacy -->
# PRD — WarpOS installer completeness: complete + sprint-capable fresh installs

**Sprint:** `SP-20260525-018`
**Plan Contract:** `PC-20260525-0052`
**Status:** draft
**Documentation scale:** `m`

## Outcome

A freshly scaffolded product (via /portfolio:new) is immediately complete and sprint-capable: it has a ROADMAP, the sprint-orchestrator infra to run /sprint:full, the _requirements/* + _docs/ skeletons to hold specs/briefs, and adopted briefs land under _docs/. Passes /check:install + /check:warpos-structure-parity out of the box.

## Context

### Original Request

> WarpOS installer completeness: warp-setup.js must produce complete, sprint-capable fresh product installs. (1) generate ROADMAP.md via generate-roadmap-scaffold.js during setup; (2) scaffold sprint-orchestrator infra at install (.claude/project/sprint/ dirs + sprintFullAutonomy/sprintSchemas keys in installed paths.json); (3) scaffold _requirements/* + _docs/ skeleton zones; (4) /portfolio:adopt lands moved briefs under _docs/ not the repo root. Acceptance: fresh install passes /check:install + /check:warpos-structure-parity and is sprint-capable. Out of scope: the _warpos/ source-mirror migration.

### Interpreted Intent

warp-setup.js installs the .claude/ runtime + copies engine dirs to the repo root, but never scaffolds ROADMAP.md, the sprint-orchestrator runtime infra, or the _requirements/* + _docs/ skeleton zones — so a fresh product (verified on companycam 0.9.0) is not sprint-capable and fails /check:warpos-structure-parity. Make the installer produce a complete, sprint-capable install IDEMPOTENTLY (check-before-write, no regression on existing/upgrade-path installs).

### Current Behavior

companycam 0.9.0 install: .claude/ + framework/scripts/schemas present at root, but NO ROADMAP.md, NO .claude/project/sprint/ dir, paths.json lacks sprintFullAutonomy/sprintSchemas, and no _requirements/_docs zones. /check:warpos-structure-parity would flag the missing _requirements/*.

### Desired Behavior

warp-setup.js idempotently scaffolds, for fresh AND re-run installs: (1) ROADMAP.md via generate-roadmap-scaffold.js; (2) .claude/project/sprint/ runtime dirs + sprintFullAutonomy/sprintSchemas keys in installed paths.json; (3) the _requirements/* skeleton (matching /check:warpos-structure-parity) + a _docs/ skeleton (_docs/briefs/, _docs/clones/); (4) /portfolio:adopt lands briefs under _docs/. ACCEPTANCE GATE: a fresh install passes /check:install + /check:warpos-structure-parity and is sprint-capable; existing installs are not regressed. Local commit; push operator-scoped.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — installer
- `R-2` — sprint-infra
- `R-3` — structure-parity

## Non-Goals

- The _warpos/ source-of-truth mirror migration (heavy; tracked separately as the _warpos/-zone migration) — HARD non-goal; no ticket may drift toward it

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/warp-setup.js | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260525-0052.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-018\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-018\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-018\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-018\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-018\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-018\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-018\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-018\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-018\release-plan.md`
