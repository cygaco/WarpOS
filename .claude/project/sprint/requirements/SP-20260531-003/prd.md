<!-- requirement-format-legacy -->
# PRD — scan:warpos-layer-diff — product-vs-dev-tooling layer diff report

**Sprint:** `SP-20260531-003`
**Plan Contract:** `PC-20260531-0060`
**Status:** draft
**Documentation scale:** `m`

## Outcome

Maintainers can see the product-vs-dev-tooling split in one command instead of manually diffing _warpos/MANIFEST.json against .claude/framework-manifest.json. Complements SP-20260531-002's fail-closed ship boundary with a read-only observability view of the same boundary.

## Context

### Original Request

> a panel where i can see the diff between the product and the dev tooling layer of warpos

### Interpreted Intent

Give the maintainer a readable, at-a-glance view of which framework-owned paths SHIP to consumer products (the product layer) vs which are framework-internal dev tooling that never ships (the dev-tooling layer), so the framework/product boundary is observable — not something you reconstruct by hand from two manifests.

### Current Behavior

The product/dev-tooling split is implicit in two separate manifests (_warpos/MANIFEST.json ownership + .claude/framework-manifest.json shipped). warpos-ship-coverage.js computes the not-shipped set as infoGaps but only as a side-effect of its pass/fail gate; there is no read-only command that just SHOWS the two layers.

### Desired Behavior

A new `scan:warpos-layer-diff` skill + scripts/checks/warpos-layer-diff.js cross-references _warpos/MANIFEST.json (ownership truth) with .claude/framework-manifest.json (shipped truth) and prints a 3-section report: (1) PRODUCT LAYER = owner=framework AND shipped; (2) DEV-TOOLING LAYER = owner=framework AND NOT shipped; (3) SUMMARY counts. Read-only, informational (exit 0), --json supported. Reuses the existing classification logic (no new data sources, no manifest mutation, no GUI).

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — observability of the framework/product boundary
- `R-2` — read-only scan skill
- `R-3` — reuse of existing manifest data

## Non-Goals

- A GUI / visual panel (resolved to a plain-text report per Beta KISS)

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/checks/warpos-layer-diff.js (new read-only scan script) | assumed_from_request |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260531-0060.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-003\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-003\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-003\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-003\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-003\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-003\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-003\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-003\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260531-003\release-plan.md`
