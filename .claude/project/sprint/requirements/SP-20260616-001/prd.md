<!-- requirement-format-legacy -->
# PRD — E-DISPATCH-SHAPE-001 W2-core: shape-door report-only parity + per-wrapper enforce-ramp scaffolding

**Sprint:** `SP-20260616-001`
**Plan Contract:** `PC-20260616-0081`
**Status:** draft
**Documentation scale:** `m`

## Outcome

Every dispatch path (skill, epsilon-runtime, agent, claude) gains a uniform, kill-switchable self-detection seam for wrong-shape routing, closing the W2-core parity gap on the Master Console critical path while keeping operational behavior byte-identical until an operator-gated per-wrapper enforce flip.

## Context

### Original Request

> Operator autonomous mandate 2026-06-16 (/session:resume --turbo /mode:sprint): finish current goals + bust out the roadmap via /sprint:full, dispatch agents correctly. Item #1 = E-DISPATCH-SHAPE-001 W2 core (the wrapper enforce-flip), per DUMP.md + TRACKER.md operator-named pickup. The fix-first resolver-weakness prerequisite landed 2026-06-16 @2662b9b0, so W2-core is unblocked; this slice is the SAFE report-only first step of the per-wrapper report-only->enforce ramp.

### Interpreted Intent

Make the shape resolver (dispatch-shape.js#resolveShape/shapeMismatch) consulted at the spawn point of ALL four dispatch entry points — not just two — so a role routed through the wrong wrapper self-detects on a real dispatch. Introduce a single per-wrapper door convention (WARPOS_SHAPE_DOOR=report|enforce, default report) plus a global kill-switch so the eventual enforce flip is a one-env-flip per wrapper, ramped, never a big bang. Everything ships report-only; the enforce path exists, is tested, but is dormant by default.

### Current Behavior

Only dispatch-agent.js and dispatch-claude.js consult the shape resolver, both report-only gated by WARPOS_DISPATCH_CONTRACT_ENFORCE=block (a global, not per-wrapper, switch). dispatch-skill.js and epsilon-runtime.js do not consult the resolver at all (0 refs). There is no per-wrapper door, no kill-switch, and no enforce-mode planted test. The resolver's unknown-role distinguishing-signal weakness was fixed 2026-06-16 @2662b9b0.

### Desired Behavior

All four entry points consult dispatch-shape.js#shapeMismatch at their spawn point through one shared shapeDoor() helper. The door reads WARPOS_SHAPE_DOOR (report|enforce, default report) — optionally per-wrapper-overridable — and WARPOS_DISABLE_SHAPE_DOOR (kill-switch, forces report regardless). In report mode a mismatch logs an advisory and proceeds (exit unaffected). In enforce mode a high-severity mismatch refuses with exit 2 and a named reason. Any resolver error fails OPEN (advisory, never blocks). Default ships report-only across all four; no wrapper is enforce-by-default. Planted tests assert: report=>advisory+proceed, enforce=>refuse exit 2, kill-switch=>forces report even under enforce, resolver-error=>fail-open.

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

- `R-1` — R-1 dispatch-skill consultation: dispatch-skill.js consults dispatch-shape.js#shapeMismatch for the subprocess-skill shape at spawn, through the shared door, report-only by default, fail-open on resolver error
- `R-2` — R-2 epsilon-runtime consultation: epsilon-runtime.js consults shapeMismatch at its role spawn point for the shape it routes (subprocess-claude / subprocess-cross-provider), through the shared door, report-only, fail-open
- `R-3` — R-3 unified shape-door: a single shapeDoor() helper in dispatch-shape.js implements WARPOS_SHAPE_DOOR=report|enforce (default report) + WARPOS_DISABLE_SHAPE_DOOR kill-switch (forces report) + enforce-mode high-severity refusal (exit 2, named reason) + fail-open; all four wrappers route their consultation through it; dispatch-agent/dispatch-claude migrate without regressing existing behavior
- `R-4` — R-4 planted tests both modes: per-mode planted-violation tests assert report=>advisory+proceed(exit0), enforce=>refuse(exit2), kill-switch=>forces report under enforce, resolver-error=>fail-open; extend dispatch-shape.test.js and add per-wrapper coverage
- `R-5` — R-5 contract documentation: document the door convention + kill-switch + per-wrapper ramp in the dispatch guide (paths.agentDispatchGuide) + epsilon.md so callers know the contract (pair the transport-level seam with a referenced dispatch-contract rule, per CLAUDE.md lib-only-fix lesson)

## Non-Goals

- Do NOT flip any wrapper to enforce-by-default — the per-wrapper report->enforce flip is operator-gated and needs one clean advisory-noise-zero sprint each (plan 12.1).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/dispatch-skill.js | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260616-0081.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260616-001\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260616-001\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260616-001\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260616-001\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260616-001\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260616-001\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260616-001\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260616-001\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260616-001\release-plan.md`
