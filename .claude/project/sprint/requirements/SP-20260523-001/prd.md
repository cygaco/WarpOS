<!-- requirement-format-legacy -->
# PRD — Fix current.yaml#status + active-sprints.yaml status lag after /sprint:full Phase 5

**Sprint:** `SP-20260523-001`
**Plan Contract:** `PC-20260523-0030`
**Status:** draft
**Documentation scale:** `s`

## Outcome

Sprint registry stays honest with actual completion state — operator can run /sprint:status and trust the output. The active-sprints.yaml registry is what other skills (/sprint:status, downstream tooling) read; manual patches today are a footgun.

## Context

### Original Request

> current.yaml#status lag after /sprint:full Phase 5 — sprint stays at status: designing/releasing even after the full pipeline runs through retrospective. Probably the retrospective.js fall-through (skeleton exit 3) is the missed update site. Sprint 6 polish from ROADMAP.md Pickup Queue.

### Interpreted Intent

When /sprint:full runs all 5 phases to completion, both current.yaml (per-sprint state) and active-sprints.yaml#sprints[id].status (registry) should advance to 'retrospected'. Today they remain stuck at an earlier phase. Likely root cause: retrospective.js falls through with exit 3 (skeleton mode) without updating either file. Fix: in retrospective.js (or sprint/full.js Phase 5 wrapper), after retrospective completes (success OR skeleton-skip), explicitly call status updaters for current.yaml AND active-sprints.yaml. Add a test that runs /sprint:full end-to-end against a fixture and asserts both files reach 'retrospected'.

### Current Behavior

After /sprint:full SP-20260522-004 reached 'done' through all 5 phases this session, active-sprints.yaml still showed SP-004 with status=planning. Same for SP-005. Manual patch via Edit tool was the workaround. The sprint-full-report.md correctly shows completion; the registry doesn't.

### Desired Behavior

After /sprint:full final phase completes (including skeleton-exit-3 retrospective skip), both active-sprints.yaml#sprints[id].status AND .claude/project/sprint/sprints/<SP-id>/current.yaml#status are updated to 'retrospected'. Test fixture runs full pipeline against a tmp dir and asserts both files post-completion.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — Status update helper (find or create)
- `R-2` — Phase 5 wrapper in full.js
- `R-3` — retrospective.js exit-3 path

## Non-Goals

- Do NOT redesign the status state machine

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/sprint/retrospective.js (modify — ensure exits update status before returning) | inferred_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260523-0030.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-001\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-001\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-001\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-001\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-001\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-001\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-001\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-001\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-001\release-plan.md`
