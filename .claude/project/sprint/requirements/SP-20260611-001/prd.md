<!-- requirement-format-legacy -->
# PRD — Cross-family findings fix sprint — 6 gemini re-review findings (epsilon-runtime spawn race, fallback ENFORCE brick, hardcoded BUILD_CHAIN_ROLES, spoofed-ts window, sprint_id correlation, verifyGauntlet parse refusal)

**Sprint:** `SP-20260611-001`
**Plan Contract:** `PC-20260611-0073`
**Status:** draft
**Documentation scale:** `m`

## Outcome

The dispatch/enforcement layer stops lying: the epsilon spawn timeout headroom actually works, the sanctioned review-fallback lane survives the W2 ENFORCE flip, build-chain role gating derives from the registry (no unregistered-role bypass), and the F-1/F-3 coverage predicates cannot be spoofed by planted timestamps, concurrent sprints, or garbage windows.

## Context

### Original Request

> execute DUMP Actionable #1: mint the cross-family findings fix sprint explicitly (RI-007) and conduct it via ε with a gemini + claude execution-access + GPT gauntlet. Build the 6 fixes in runtime/notes/crossfam-findings-2026-06-10.md (fix shapes included). Item 2 also appends to the W2 entry gate (_planning/epics/E-DISPATCH-SHAPE-001.md §12.2).

### Interpreted Intent

Close the six real findings from the 2026-06-10 cross-family (gemini) re-reviews of W0+W1 (diff 4d7301f...ba61a2f) and SP-20260610-005 (diff a05b1ef...d85e9a9) — dispatch-layer correctness and enforcement-integrity fixes — and prove them with a three-family gauntlet (gemini diff lanes + claude execution-access lanes + GPT 2nd pass).

### Current Behavior

All six findings re-verified live in canonical on 2026-06-11 (post-mint grounding pass): (1) parent timeout == child bound at both spawn sites; (2) fallback advisory suppressed only when !blocking; (3) BUILD_CHAIN_ROLES literal Set at dispatch-claude.js:103; (4) no ts clamp on window derivation; (5) hasBackingDispatchRecord(dispatchRecords, role, minTsMs, maxTsMs) has no sprint_id param; (6) parse refusal in CLI block only.

### Desired Behavior

(1) Parent spawn bound = child bound + 30-60s grace (or backstop-only when child self-bounds) at BOTH epsilon-runtime spawn sites. (2) The sanctioned --review-fallback lane is registered/exempted as a valid shape so the W2 ENFORCE flip cannot exit-1 it; W2 entry gate text appended to E-DISPATCH-SHAPE-001 §12.2. (3) Worktree-isolation gate + fallback refusal derive build-chain membership from the registry class (validateDispatchForClass/build_chain_worker), with the literal set at most a fallback. (4) Sprint window bounds clamped to sane horizons (sprint created_at ± hard cap; outlier ts discarded). (5) hasBackingDispatchRecord prefers sprint_id match when the record carries one (post-W0 records do) in BOTH sprint-hook-coverage.js and sprint-manager-consult.js. (6) verifyGauntlet() itself refuses unparseable since/until (throw/refuse), CLI message preserved. Each fix lands with regression tests; existing suites stay green.

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

- `R-1` — R-1 epsilon-runtime parent-timeout grace: parent spawnSync bound exceeds the child wrapper's internal bound by 30-60s at both spawn sites so the child's graceful death-record write wins the race
- `R-2` — R-2 review-fallback shape registration: the sanctioned --review-fallback lane is a registered/exempted valid shape under the resolver so a future blocking/ENFORCE flip does not exit-1 it; E-DISPATCH-SHAPE-001 plan §12.2 W2 entry gate gains the corresponding precondition line
- `R-3` — R-3 registry-derived build-chain gating: dispatch-claude.js worktree-isolation gate + fallback refusal consult the registry class (validateDispatchForClass / build_chain_worker), not only the hardcoded BUILD_CHAIN_ROLES literal
- `R-4` — R-4 spoofed-ts window clamp (TWO-SITE, β design directive 2026-06-11): BOTH sprint-hook-coverage.js AND sprint-manager-consult.js window derivations clamp bounds to sane horizons (sprint created_at ± hard cap, outlier/extreme timestamps discarded) so a planted 1970/2099 ts cannot widen the window in either checker
- `R-5` — R-5 sprint_id-preferring correlation: hasBackingDispatchRecord (sprint-hook-coverage.js) and the equivalent in sprint-manager-consult.js prefer rec.sprint_id match when present, falling back to time-window only for legacy records
- `R-6` — R-6 programmatic window-parse refusal: verifyGauntlet() refuses unparseable since/until inside the library function (throw/refuse, never silent whole-ledger degrade); CLI behavior preserved

## Non-Goals

- Do NOT re-fix NOTAGAIN §6 receipts or fold-20cf3bcf's 'closed by W0+W1' list (rebuild reflex = RCA symptom #3)

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/sprint/epsilon-runtime.js (spawnAgent parent timeout, lines ~476/500) | verified_from_repo |
| scripts/dispatch-claude.js (--review-fallback lane + BUILD_CHAIN_ROLES set, lines ~103/182/225/358) | verified_from_repo |
| scripts/checks/sprint-hook-coverage.js (window derivation ~191, hasBackingDispatchRecord ~88) | verified_from_repo |
| scripts/checks/sprint-manager-consult.js (window derivation 266-269, hasBackingDispatchRecord 142 — two-site per β directive) | verified_from_repo |
| scripts/dispatch/gauntlet-verify.js (verifyGauntlet programmatic API, CLI guard ~233) | verified_from_repo |
| _planning/epics/E-DISPATCH-SHAPE-001.md §12.2 (W2 entry gate text) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260611-0073.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\release-plan.md`
