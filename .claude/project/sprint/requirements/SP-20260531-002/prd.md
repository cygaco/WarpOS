<!-- requirement-format-legacy -->
# PRD — _guides product-layer shipping + _planning reorg + ship-boundary enforcer

**Sprint:** `SP-20260531-002`
**Plan Contract:** `PC-20260531-0059`
**Status:** draft
**Documentation scale:** `m`

## Outcome

Vibecoders who scaffold/install a WarpOS product receive the launch guides (like DEV_SETUP_GUIDE.md) with them, while WarpOS internal planning docs never leak into product repos. Closes part of the framework/product boundary gap (ED-012; ownership taxonomy SP-20260522-001).

## Context

### Original Request

> a _guides folder, for items like our DEV_SETUP_GUIDE (ensure these ship with the product layer). Additionally, better organization for the _planning folder (and ensure our actual plan files don't ship with the product layer).

### Interpreted Intent

Establish a clear home (_guides/) for product-facing guides that are part of what WarpOS ships to consumer products, separated cleanly from _planning/ (internal, canonical-only planning that must NOT ship). Make the ship / no-ship boundary fail-closed enforced, not aspirational.

### Current Behavior

DEV_SETUP_GUIDE.md sits untracked at repo root; _planning/ is tracked and would ship if not explicitly excluded; no _guides/ dir exists; no enforcer ties guides->ship and plan->no-ship (ED-012 open).

### Desired Behavior

A _guides/ directory exists and holds product-facing guides (DEV_SETUP_GUIDE.md moved in), registered in the shipping manifest so it reaches scaffolded products; _planning/ is reorganized and explicitly excluded from shipping; a fail-closed enforcer asserts the boundary (plan files never ship, guides always ship) and is wired into scan:full.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — framework/product ship boundary
- `R-2` — directory taxonomy (_guides, _planning)
- `R-3` — fail-closed enforcement (scan)

## Non-Goals

- Building Sprint B's product-vs-dev-tooling diff panel (separate sprint)

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| _guides/ (new product-facing guides dir) | assumed_from_request |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260531-0059.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-002\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-002\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-002\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-002\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-002\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-002\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-002\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-002\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-002\release-plan.md`
