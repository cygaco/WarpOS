<!-- requirement-format-legacy -->
# PRD — Dispatch-shape north star — resolver + earn-it ping-reap fix + mechanical enforcement

**Sprint:** `SP-20260608-001`
**Plan Contract:** `PC-20260608-0064`
**Status:** draft
**Documentation scale:** `m`

## Outcome

The orchestrator stops choosing dispatch shapes by hand (the recurring failure: build-chain run in-process, heavy skills run inline, the team skipped). Every unit gets the right shape from one consulted resolver; a wrong shape is caught mechanically; and a subprocess skill only routes subprocess once it has PROVEN it pays + stays good — so the dispatch system is reliable, not aspirational.

## Context

### Original Request

> Implement the dispatch-shape NORTH STAR (PLAN 17): a live shape RESOLVER (scripts/dispatch/dispatch-shape.js) verified against the decision rule, tested, and wired as the consulted authority so the wrong shape self-detects; FIX the 13.6 ping reap blocker (~50% non-deterministic reap) so the 13.7 earn-it can actually stamp skills; finish mechanical enforcement (doc-ref-integrity auto-fires at commit via merge-guard; team-gate default-on). Engine/tooling sprint, ff-merge close, no release-build.

### Interpreted Intent

Build the LIVE dispatch-shape decision keystone: (1) scripts/dispatch/dispatch-shape.js#resolveShape(unit) applies PLAN §17's per-unit decision rule (inline/in-process-agent/subprocess-claude/subprocess-cross-provider/api) reading the dispatch-contract (agents) + skill-weight registry (skills, fail-closed on the earn-it proof) + the research criteria-matrix for ad-hoc units, and shapeMismatch() makes the WRONG shape self-detecting; wire it as the authority consulted by route-guard / the dispatch wrappers. (2) Fix the §13.6 ping non-deterministic reap (the RI-004 CLI-buffer reap, ~50%) so a subprocess skill can be honestly §13.6-pinged then §13.7-measured then stamped subprocess_verified:true (0 are today → all route inline). (3) Mechanical-enforcement close-out: doc-ref-integrity fires automatically at commit via merge-guard (not report-only-in-/scan:full); the S-12c team-gate ships default-ON.

### Current Behavior

The shapes are DEFINED + roles pre-classified in dispatch-contract.json, with a VALIDATOR (validateDispatch) — but there is NO resolver the orchestrator consults to pick a shape per unit, and nothing applies the decision rule to an ad-hoc unit (so the shape is chosen by hand → wrong). The skill earn-it (§13.6/§13.7) harness exists but was never run; 0 skills are subprocess_verified → all route inline. A prior ε run proved scan:full EARNS subprocess (83.9% / 5860 tok, gpt-5.5 judge PASS) but could not stamp because the §13.6 ping reaps ~50%.

### Desired Behavior

resolveShape(unit) returns {shape, proven, reason, source} for any agent/skill/ad-hoc unit per PLAN §17; shapeMismatch flags a wrong shape (route-guard consults it). The §13.6 ping is deterministic (no reap) so a subprocess skill can be pinged → measured → stamped; at least the proven skills carry subprocess_verified:true and route subprocess. doc-ref-integrity exits non-zero automatically at commit on a broken ref; the team-gate is default-ON. Engine sprint: ff-merge to main, no release-build.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — live shape resolver (resolveShape + shapeMismatch) faithful to PLAN §17
- `R-2` — resolver wiring as the consulted authority (route-guard / dispatch wrappers)
- `R-3` — §13.6 ping reap reliability fix

## Non-Goals

- Running the full §13.7 A/B for all 6 heavy skills this sprint (bounded; prove the mechanism + stamp what cleanly earns).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/dispatch/dispatch-shape.js (NEW resolver — drafted, needs gauntlet) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260608-0064.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260608-001\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260608-001\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260608-001\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260608-001\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260608-001\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260608-001\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260608-001\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260608-001\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260608-001\release-plan.md`
