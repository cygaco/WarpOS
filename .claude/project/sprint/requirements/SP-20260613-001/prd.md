<!-- requirement-format-legacy -->
# PRD — ED-051 enforcer — missing_product_lead_authoring finding

**Sprint:** `SP-20260613-001`
**Plan Contract:** `PC-20260614-0076`
**Status:** draft
**Documentation scale:** `m`

## Outcome

The WG-3 routing rule stops being aspirational: any future sprint where alpha silently self-authors product requirements (the exact ED-051 failure) is caught at /scan:full instead of going unnoticed, so the 'who's writing the product reqs?' bug class is self-detecting.

## Context

### Original Request

> Build the ED-051 enforcer (completes last session's WG-3 fix — the skill-body routing change shipped, the detector is unbuilt). Extend scripts/checks/sprint-manager-consult.js with a `missing_product_lead_authoring` finding: for a post-cutoff sprint that has a plan-contract or PRD but no product-lead authorship record, flag it; `authored_by: alpha-solo` is valid only when the sprint mode was solo. Wire the finding into /scan:full. Mirror the existing `missing_design_consult` finding's pattern. Engine/tooling sprint — no deploy artifact; fast-close via ff-merge.

### Interpreted Intent

Close the aspirational-vs-enforced gap on the WG-3 routing change: a sprint that produced a plan-contract or PRD after the enforcer's cutoff must carry a record that product-lead authored those requirements (or have been run in solo mode, where alpha-solo authoring is legitimate). Absence of such a record on a non-solo post-cutoff sprint is a finding. The detector lives beside missing_design_consult in sprint-manager-consult.js, reuses the same record-backed coverage machinery (RECORD_BACKED_CUTOFF, hasBackingDispatchRecord), and surfaces through /scan:full so drift is observable at the same gate as the other manager-consult findings.

### Current Behavior

The WG-3 fix (commit 1e2e6faf) changed /sprint:plan and /sprint:design skill bodies to route authoring to product-lead, but nothing detects a violation: a sprint can produce a plan-contract/PRD with alpha-solo authoring and pass /scan:full clean. ED-051 is logged as open enforcement debt. sprint-manager-consult.js currently emits missing_design_consult but has no product-lead-authoring finding.

### Desired Behavior

scripts/checks/sprint-manager-consult.js emits a missing_product_lead_authoring finding when: a sprint's date is >= the finding's cutoff AND the sprint produced a plan-contract or PRD AND the sprint mode was NOT solo AND there is no backing product-lead authorship record correlated to the sprint. Solo-mode sprints (alpha-solo authoring legitimate), pre-cutoff sprints, and sprints with a valid product-lead record produce no finding. The finding surfaces through /scan:full alongside missing_design_consult. The detector is covered by planted positive and negative fixtures and is fail-closed (a missing/unparseable record source does not silently pass). ED-051 is marked resolved.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.
>
> This list is generated from `plan_contract.requirement_areas` (N items → R-1..R-N).
> A sprint with >3 requirement areas will have more than 3 entries here — trace.md
> and granular-stories.md reference the same R-1..R-N set (single-source, T-298).

- `R-1` — R-1 detector: add a missing_product_lead_authoring finding to computeFindings() — cutoff-gated, record-backed (reuse hasBackingDispatchRecord), solo-mode-aware (alpha-solo legitimate only in solo mode), fail-closed on a missing/unparseable record source; export any new constants for the test harness.
- `R-2` — R-2 authorship-record contract: define and read the authoritative product-lead authorship signal correlated to a sprint (resolved in design), and the precondition that the sprint produced a plan-contract or PRD.
- `R-3` — R-3 scan wiring: surface the new finding_type through scan:sprint-manager-consult / /scan:full alongside missing_design_consult (additive).
- `R-4` — R-4 fixtures + coverage: plant positive fixtures (post-cutoff non-solo sprint with plan-contract/PRD and no product-lead record) and negative fixtures (solo mode, pre-cutoff, valid product-lead record present) so the detector is proven and false-green-resistant.
- `R-5` — R-5 debt reconciliation: mark ED-051 resolved in enforcement-debt.jsonl with the enforcer reference; regenerate both manifests if any framework-tracked file changed.

## Non-Goals

- No change to the WG-3 skill-body routing itself (already shipped at 1e2e6faf).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/checks/sprint-manager-consult.js | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260614-0076.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260613-001\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260613-001\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260613-001\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260613-001\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260613-001\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260613-001\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260613-001\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260613-001\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260613-001\release-plan.md`
