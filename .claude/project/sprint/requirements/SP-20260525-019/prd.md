<!-- requirement-format-legacy -->
# PRD — Install completeness: unify install.ps1 + warp-setup paths, scaffold PROJECT.md + product maps

**Sprint:** `SP-20260525-019`
**Plan Contract:** `PC-20260525-0053`
**Status:** draft
**Documentation scale:** `m`

## Outcome

Any WarpOS install — consumer (install.ps1) or portfolio scaffold (warp-setup.js) — yields a complete, sprint-capable product with no silent gaps, a PROJECT.md to fill, and product maps. Stops the recurring 'fresh install is hollow' bug class at its structural root (two installers drifting apart).

## Context

### Original Request

> /sprint:full fix all the gaps — (1) install.ps1 (consumer installer) and scripts/warp-setup.js (portfolio:new scaffold path) diverged; install.ps1 does NONE of the SP-018/#3 scaffolding (_warpos/ mirror, _requirements/_docs zones, ROADMAP, registry-driven paths, sprint infra). Reconcile onto one shared core. (2) PROJECT.md never scaffolded by any path though CLAUDE.md references it. (3) Product maps are the canonical baseline, not product-generated. Acceptance: fresh install via EITHER path passes /check:install + /check:warpos-structure-parity + regenerate --check, has PROJECT.md + product maps; install matrix gains an install.ps1-path scenario; no regression. Out of scope: capsule/release format.

### Interpreted Intent

There are two divergent install paths. warp-setup.js (used by /portfolio:new) now does the full SP-018/#3 scaffolding; install.ps1 (the capsule/consumer installer) only copies files + regenerates the manifest, so a consumer install is hollow. Unify both onto one shared scaffold core so any install produces an identical complete, sprint-capable product; additionally scaffold PROJECT.md (referenced by CLAUDE.md but never created) and generate product-appropriate maps instead of shipping the canonical baseline.

### Current Behavior

install.ps1 (244 lines) copies files + regenerates framework-manifest.json; it does NOT call warp-setup.js nor do any SP-018/#3 scaffolding. warp-setup.js does the full scaffold. PROJECT.md is scaffolded by neither (grep = 0 generators). Fresh installs ship the 23 canonical maps as a baseline, not product-generated maps.

### Desired Behavior

One shared scaffold core produces the complete install (registry paths.json incl. sprint keys, _warpos/ source-mirror, _requirements/_docs zones, ROADMAP, sprint infra, PROJECT.md, product maps). Both install.ps1 and warp-setup.js invoke it. A fresh install via EITHER path passes /check:install + /check:warpos-structure-parity + regenerate.js --check, has PROJECT.md and product maps. The install matrix gains an install.ps1-path scenario and asserts all of it; the existing 6 scenarios do not regress.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — installer
- `R-2` — install-parity
- `R-3` — scaffold-core

## Non-Goals

- Re-architecting the capsule/release format

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/warp-setup.js | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260525-0053.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-019\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-019\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-019\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-019\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-019\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-019\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-019\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-019\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-019\release-plan.md`
