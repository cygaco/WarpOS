<!-- requirement-format-legacy -->
# PRD — Post-scrub gate hardening — flip ROOT_LEAK_PENDING_SCRUB=false (milestone 0.10.0 sprint 2)

**Sprint:** `SP-20260525-002`
**Plan Contract:** `PC-20260523-0036`
**Status:** draft
**Documentation scale:** `s`

## Outcome

Milestone 0.10.0 Framework Boundary Closure is shipped. Canonical WarpOS publishes externally with a structural guarantee (not just an audit step) that no product-data can leak. Any future attempt to reintroduce product-titled content at canonical root fails at write-time with a clear error message. Fresh `/warp:setup` of canonical into a new product writes zero product-titled paths.

## Context

### Original Request

> Post-scrub gate hardening — sprint 2 of milestone 0.10.0 Framework Boundary Closure. Depends on SP-20260525-001 (maintainer canonical scrub) shipping first. Flip ROOT_LEAK_PENDING_SCRUB=false in scripts/checks/framework-purity.js, regenerate _warpos/MANIFEST.json, run /check:framework-purity --full clean. Verify the gate now refuses a synthetic _requirements/00-canonical/foo.md write attempt on canonical. Verify post-scrub install of canonical into a fresh product writes no product-titled paths. Closes milestone 0.10.0. Autonomy: aggressive. Mode: adhoc.

### Interpreted Intent

Sprint 1 of milestone 0.10.0 (SP-20260525-001) physically removes WarpOS-as-product content from canonical. This sprint closes the door by flipping the `ROOT_LEAK_PENDING_SCRUB=true` flag to `false` in `scripts/checks/framework-purity.js`. Flag-flip is a one-line change; the higher-value work is the regression net around it: a synthetic write-attempt fixture proves the gate hard-refuses reintroduction, a fresh-install smoke-test proves no product-titled paths leak to consumers, and a test that runs the purity check on a clean canonical exits 0. After this sprint, the manifest-driven architecture (milestone 0.8.x) becomes load-bearing — the boundary stops being aspirational and starts being a write-time enforcement.

### Current Behavior

`scripts/checks/framework-purity.js` ships with `ROOT_LEAK_PENDING_SCRUB=true` — the root_leak detector OBSERVES the leak but exits 0 to allow shipping during the SP-001 scrub window. After flip: detector exits 1 on the same input. Existing allow-lists (ALLOW_CLIENT_SLUG_PATHS, ALLOW_ABS_PATH_PATHS, ALLOW_PROMOTE_RELIC_PATHS) handle legitimate exceptions (runtime files, ROADMAP archive references).

### Desired Behavior

After sprint completion: (1) `ROOT_LEAK_PENDING_SCRUB=false` in `scripts/checks/framework-purity.js`; (2) `/check:framework-purity --full` exits 0 on clean canonical (post-scrub state); (3) Synthetic test that writes `_requirements/00-canonical/foo.md` to canonical fails the framework-purity-guard hook with a clear message; (4) Install fixture matrix scenario 1 (clean install) and scenario 5 (user-overrides) both pass against post-scrub canonical with zero product-titled paths in the install output; (5) ROADMAP.md milestone 0.10.0 moved to Shipped section; (6) Local commit on sprint branch captures the flag flip + new tests + ROADMAP update. PUSH remains operator-scoped.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — framework-purity
- `R-2` — hooks
- `R-3` — test-coverage

## Non-Goals

- Performing the canonical scrub itself — that's SP-20260525-001

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/checks/framework-purity.js | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260523-0036.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-002\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-002\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-002\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-002\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-002\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-002\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-002\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-002\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-002\release-plan.md`
