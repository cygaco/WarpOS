<!-- requirement-format-legacy -->
# PRD — E-DISPATCH-INTEGRITY-001 F-1+F-3 — coverage-honesty (kill telemetry-only false-greens)

**Sprint:** `SP-20260610-005`
**Plan Contract:** `PC-20260610-0069`
**Status:** draft
**Documentation scale:** `s`

## Outcome

Sprint phases can no longer read green while no agent actually ran — the recurring fake-green class (RC-2/RC-4) becomes mechanically impossible instead of policed by memory.

## Context

### Original Request

> F-1 — Kill the telemetry-only false-green: a phase counts as covered only with a backing ok:true completion record (the gauntlet-verify predicate applied to coverage scans). DoD: a manager_consult coverage record alone no longer satisfies scan:sprint-manager-consult/scan:sprint-hook-coverage — a backing ok:true record is required. Risk mitigation: date-cutoff legacy exemption so historic sprints aren't retroactively uncovered. F-3 — gauntlet-verify runId/--since correlation: filter by sprint_id; refuse a whole-ledger verify so a historic ok:true cannot green a never-ran lane. DoD: gauntlet-verify requires a window / correlates by sprint_id; the T3 historic-green false-positive no longer passes.

### Interpreted Intent

Apply the record-or-it-didn't-happen predicate uniformly: coverage scans and gauntlet-verify must demand fresh, sprint-correlated ok:true completion records instead of accepting presence-of-telemetry or any-historic-record.

### Current Behavior

Per the epic (created 2026-06-07, grounded in the T3 incident): consult-presence checks accept telemetry-only manager_consult records emitted on BOTH full.js paths (doogle WG-3 aggravator, full.js:84-92,1833); gauntlet-verify can match any historic ok:true record absent a window/sprint filter.

### Desired Behavior

Both coverage scans demand a correlated ok:true completion record (legacy exemption for sprints before the cutoff date); gauntlet-verify refuses unbounded verification and correlates by sprint_id; planted fixtures prove each bites.

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

- `R-1` — manager-consult record-backed coverage (F-1)
- `R-2` — hook-coverage record-backed predicate (F-1)
- `R-3` — gauntlet-verify sprint_id/window correlation + whole-ledger refusal (F-3)
- `R-4` — legacy cutoff exemption + caller compatibility

## Non-Goals

- F-2 live-run evidence (accrues naturally from the next sprint-mode run; SP-20260610-003 flipped the default).
- Flipping any report-only gate to blocking.
- Touching dispatch-skill.js / safe-spawn (SP-20260610-004's lane — gauntlet-verify.js is this sprint's, dispatch-skill.js is ε's).
- Pushing (α merges + pushes at arc close).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/checks/sprint-manager-consult.js (+ test-sprint-manager-consult.js) — F-1: require backing ok:true completion record per consult; date-cutoff legacy exemption for pre-cutoff sprints | verified_from_repo |
| scripts/checks/sprint-hook-coverage.js (+ test-sprint-hook-coverage.js) — F-1: same record-backed predicate for hook-point coverage | verified_from_repo |
| scripts/dispatch/gauntlet-verify.js (+ gauntlet-verify.test.js) — F-3: sprint_id correlation + bounded window mandatory; whole-ledger verify REFUSED (exit non-zero with usage guidance); planted historic-green fixture must fail | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260610-0069.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\release-plan.md`
