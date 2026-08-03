<!-- requirement-format-legacy -->
# PRD — Job #1 — port lastmile detect/score/adapters into the Vlad engine, adopt score.js as the ONE readiness number, mint receipt v1 from portfolio dogfood

**Sprint:** `S-VLADW1-02`
**Plan Contract:** `PC-20260730-0084`
**Status:** draft
**Documentation scale:** `m`

## Outcome

A founder with a prototype points Vlad at their repo and gets back an honest readiness audit: what Vlad did, what it verified, and the one thing it needs. It degrades honestly — a repo with no tests is reported 'NOT verified', never scored as if it passed. This is the first Vlad capability that reaches a user and the evidence base for the receipt contract the rest of v1 depends on.

## Context

### Original Request

> S-VLADW1-02 (epic label SP-VLAD-W1-AUDIT) — candidate — Job #1: port lastmile detect/score/adapters into the engine; remove WarpOS refusals in the ported copy; intake fallback for undetectable stacks; adopt score.js as the ONE readiness number (checklist proxy not ported); receipt schema v1 from portfolio dogfood

### Interpreted Intent

Port the existing lastmile readiness-audit engine (detect, score, adapters) into the new Vlad product engine so Job #1 — a read-only readiness audit — runs end-to-end on a stranger repo and returns a receipt. Three things make this a port rather than a build: the WarpOS-specific refusals are edited out in the PORTED copy (canonical WarpOS assets are never modified); score.js is ADOPTED as the single readiness number rather than converged with the checklist proxy (J3); and the receipt schema's interior — left deliberately untyped by S-VLADW1-01 (J4) — is filled here from real dogfood data and minted as v1.

### Current Behavior

Nothing exists product-side. The sibling repo is Verified Nonexistent as of 2026-07-29 (no path assigned; operator gate #1 unresolved). Inside WarpOS the registry entry, ROADMAP row and sprint stores exist for S-VLADW1-02 (current.yaml + progress.yaml only, both at their minted defaults); the tracker at trackers/sprints/S-VLADW1-02-vlad-audit-lastmile-port.md was authored separately because add-sprint.js does not scaffold one. No product code has been written and none may be before the design->build gate clears.

### Desired Behavior

Inside the Vlad engine, a read-only audit job runs against an arbitrary repository and completes without any WarpOS-specific refusal firing: it detects the stack (falling back to an intake flow when the stack is undetectable rather than failing), scores readiness through the single adopted score.js, and emits a receipt whose interior is now typed as v1 and derived from real dogfood observations. Exactly ONE readiness number exists in the product repo — score.js adopted, the checklist proxy absent, and the FOUNDERS_CHECKLIST-dependent dimension either re-sourced or reported as NOT SCORED. A build-failing enforcer refuses to let a second readiness number appear. Where the repo gives no evidence (no tests), the audit says 'NOT verified' rather than inferring a pass.

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

- `R-1` — Port fidelity and reference verification — every cited path and line confirmed before code moves
- `R-2` — Stack detection and the intake fallback for undetectable stacks
- `R-3` — Readiness scoring: single-number adoption and its build-failing enforcer
- `R-4` — Honest degradation and claims correctness ('NOT verified' when evidence is absent)
- `R-5` — Receipt interior schema v1, derived from real dogfood observations
- `R-6` — WarpOS-refusal removal confined to the ported copy
- `R-7` — Dogfood corpus operation under recorded read-only authorization

## Non-Goals

- The write path — porting transaction.js, branch-per-job, preflight, ff-only apply, draft-PR park, undo. That is Wave 2.

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| The sibling Vlad product repo (all product-side files) | unknown |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260730-0084.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-02\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-02\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-02\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-02\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-02\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-02\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-02\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-02\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\S-VLADW1-02\release-plan.md`
