<!-- requirement-format-legacy -->
# PRD — Canon engine — _requirements/00-canonical/* generator with capped research (0.15.0 sprint 2)

**Sprint:** `SP-20260525-022`
**Plan Contract:** `PC-20260525-0055`
**Status:** draft
**Documentation scale:** `m`

## Outcome

A fresh product goes from intent → grounded canonical documentation automatically, even with thin operator input (research fills bounded gaps). This is the missing capability behind JTBD-3 ('just WarpOS' → canonical docs + roadmap) and the core of the 0.14.0 Managerial Agent Layer, available now as spinup's canon phase.

## Context

### Original Request

> Build the full canon generator now. Assume there will be gaps in the input the user gives you, you may have to perform research. (0.15.0 sprint 2 of 3. β: monolithic scale=L, cap the research phase with a defined output schema — named fields, not open-ended.)

### Interpreted Intent

Create a canon-generation engine (scripts/bootstrap/canon.js or scripts/canon/) that takes the Phase-1 intent from bootstrap:spinup (the brief from the guided discussion, or the clone doc from --clone) and produces the complete _requirements/00-canonical/* for a PRODUCT: 7 narrative MD (CORE_BRIEF, USER_COHORTS, GOLDEN_PATHS, PRODUCT_MODEL, EVOLUTION, FAILURE_STATES, GLOSSARY) + 4 structured JSON (FIELD_REGISTRY, PRECEDENCE, STEPS, WATCHED_DIRS). Where the operator's intent is thin, fill gaps via research:* — but CAPPED by a defined research-output schema that enumerates the SPECIFIC named fields research may populate per doc (e.g. market signals, competitor set, cohort evidence), so research is bounded and verifiable, not open-ended discovery. Ship canon doc templates (framework/templates/canonical/*) the engine renders. Wire bootstrap:spinup's canon phase (--phase canon) to invoke the engine. Runs product-side (generates the product's own canonical docs), so no framework-purity concern in canonical — here we build the engine + generic templates only.

### Current Behavior

No generator exists for _requirements/00-canonical/*. The canonical docs in this repo are WarpOS's own (root-leak pending 0.10.0 scrub). bootstrap:spinup's canon phase is a documented hook with no engine. roadmap:create already prefers 00-canonical when present but nothing produces it for a fresh product.

### Desired Behavior

scripts/canon/generate.js takes an intent (brief/clone) + writes a complete, schema-valid _requirements/00-canonical/* for a product, filling thin spots via schema-capped research. framework/templates/canonical/* exist. bootstrap:spinup --phase canon invokes it end-to-end on a fixture intent and produces all 11 artifacts that pass validation. Research is bounded by schemas/canon/research-fields.schema.json (named fields only).

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — canon-engine
- `R-2` — canonical-templates
- `R-3` — research-cap-schema

## Non-Goals

- Generating canonical docs for any real product in THIS sprint (build the engine + templates + a fixture test only)

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/canon/generate.js (NEW canon engine) | inferred_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260525-0055.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-022\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-022\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-022\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-022\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-022\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-022\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-022\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-022\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-022\release-plan.md`
