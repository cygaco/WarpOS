<!-- requirement-format-legacy -->
# PRD — E-DISPATCH-SHAPE-001 ADR-0013 enforce repair + W3 review-lane policy

**Sprint:** `SP-20260627-001`
**Plan Contract:** `PC-20260628-0082`
**Status:** draft
**Documentation scale:** `m`

## Outcome

WarpOS's dispatch shape is enforced (not merely advisory) for the high-severity contract violations — api-when-CLI, build-chain-in-process, cwd/worktree, forbidden shapes — without breaking any legitimate builder/fixer dispatch, and every risk class provably gets the minimum review lanes it needs. This closes the last dispatch-shape reliability gap and unblocks moving doers to codex (E-DISPATCH-PERFECT W3).

## Context

### Original Request

> (A) Fix the dispatch-contract enforce implementation so it can default to ENFORCE without false-refusing legitimate dispatches, then flip it on: honor worktree-pending semantics for `-w` build-chain dispatches (cwd=canonical is legitimate because the wrapper creates the worktree AFTER contract validation), add `fixer` to GENERIC_BUILD_IDS, normalize roles into validateDispatch, default contractEnforceMode to enforce (keep WARPOS_DISPATCH_CONTRACT_ENFORCE override + kill-switch). (B) W3 per-failure-class review-lane policy: each risk class declares minimum review lanes (execution-access for enforcer/gate changes; cross-family diff for distribution-sensitive logic), wired into sprint-hook-points conditions + coverage-gate cross_provider_required lane-shape requirement + a planted fixture per class. Blast-sensitive — cross-provider gauntlet GPT-5.5 + Claude required on the dispatch-contract + coverage-gate diffs. Land on main when gauntlet-GREEN.

### Interpreted Intent

Repair the ADR-0013 dispatch-contract enforce path so its default-enforce mode stops false-refusing legitimate `-w` build-chain dispatches (cwd=canonical at validation time because the wrapper creates the worktree afterward), generic `fixer` dispatches, and normalized legacy role names; then flip contractEnforceMode to enforce-by-default while preserving the env override and kill-switch. Separately, formalize the W3 per-failure-class minimum-review-lane policy so each risk class declares the review lanes it requires, wired into the sprint hook-points + coverage-gate with a planted fixture per class.

### Current Behavior

ADR-0013 decided the dispatch-contract enforce flip (β DECIDE 0.87 FLIP-not-supersede) but the first default-enforce impl was REVERTED to report-only/opt-in after the cross-family gauntlet (GPT-5.5 0.94) caught it false-refusing a legit `-w` build-chain dispatch (cwd=canonical because claude creates the worktree AFTER validation) + generic `fixer` + raw legacy names. contractEnforceMode currently defaults report-only (enforce opt-in via WARPOS_DISPATCH_CONTRACT_ENFORCE=enforce). The W3 per-failure-class review-lane minimums are not yet formalized (coverage-gate has cross_provider_required; sprint-hook-points has risk_min; the per-class lane minimum is not wired).

### Desired Behavior

contractEnforceMode defaults to ENFORCE. validateDispatch honors worktree-pending semantics for `-w` build-chain dispatches (cwd=canonical is legitimate; the wrapper commits the worktree after validation), recognizes `fixer` as a generic build id, and normalizes legacy/raw role names before evaluating — so NO legitimate builder/fixer dispatch is false-refused, while api-when-CLI / build-chain-in-process / cwd-worktree-violation / forbidden_shapes are still refused (exit 1). WARPOS_DISPATCH_CONTRACT_ENFORCE override + WARPOS_DISABLE_SHAPE_DOOR kill-switch remain. W3: each risk class declares its minimum review lanes; coverage-gate asserts the lane-shape per class; sprint-hook-points conditions carry the per-class minimums; a planted fixture per class proves the minimum is enforced and fails closed on its own error (BC-16).

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

- `R-1` — R-1 worktree-pending validation: validateDispatch honors cwd=canonical for `-w` build-chain dispatches (the wrapper creates the worktree after validation), regression-locked against the false-refuse the gauntlet caught
- `R-2` — R-2 generic build id + role normalization: add `fixer` to GENERIC_BUILD_IDS and normalize legacy/raw role names before contract evaluation so generic build/fix dispatches are not false-refused
- `R-3` — R-3 enforce-by-default flip: contractEnforceMode defaults to enforce; WARPOS_DISPATCH_CONTRACT_ENFORCE override + kill-switch preserved; the refused set stays exactly api-when-CLI / build-chain-in-process / cwd-worktree / forbidden_shapes; fail-closed on the gate's own error (BC-16)
- `R-4` — R-4 W3 per-failure-class minimum review lanes: each risk class declares minimum lanes (execution-access for enforcer/gate changes; cross-family diff for distribution-sensitive logic), wired into sprint-hook-points conditions + coverage-gate lane-shape requirement
- `R-5` — R-5 fixtures + regression integrity: planted-violation fixtures in both report and enforce modes, a planted fixture per W3 risk class, the -w/fixer false-refuse locked as a standing regression class, and the cross-provider gauntlet green on the dispatch-contract + coverage-gate diffs

## Non-Goals

- No collapse/consolidation of the shape-door and dispatch-contract gates (separate design).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/dispatch/dispatch-contract.js | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260628-0082.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260627-001\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260627-001\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260627-001\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260627-001\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260627-001\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260627-001\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260627-001\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260627-001\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260627-001\release-plan.md`
