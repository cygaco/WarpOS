<!-- requirement-format-legacy -->
# PRD — Director of Product Management agent spec (milestone 0.14.0 sprint 2)

**Sprint:** `SP-20260525-015`
**Plan Contract:** `PC-20260523-0049`
**Status:** draft
**Documentation scale:** `m`

## Outcome

Operator using /roadmap:add gets strategic prompting that catches missing-context issues (entry doesn't feed any milestone, conflicts with cadence). /roadmap:cleanup output is more actionable (specific rule citations, not just heuristic warnings). The roadmap stays more coherent with less operator effort.

## Context

### Original Request

> Fourth sprint of the Managerial Agent Layer milestone — the application that proves the mechanism + persona work end-to-end on existing skills. /roadmap:add stops being a stenographer; /roadmap:cleanup stops being a heuristic-only scan. Both consult DoPM. Closes the milestone.

### Interpreted Intent

Two existing roadmap skills (/roadmap:add, /roadmap:cleanup) get DoPM integration via the skill-scoped injection mechanism. /roadmap:add: when operator adds an entry, DoPM lenses it — 'which milestone does this feed? if none, should there be a new milestone? does this conflict with current cadence?'. /roadmap:cleanup: when scanning for stale/duplicate/hidden-urgency entries, DoPM applies decision lenses — 'this entry violates the cadence rule because…', 'this entry is duplicate because…'. Edits still go through operator review; DoPM annotates, doesn't autonomously write.

### Current Behavior

/roadmap:add accepts entry text + section, writes it without strategic review. /roadmap:cleanup runs heuristic scans (completed items, stale entries, duplicates) but doesn't apply directorial decision lenses.

### Desired Behavior

(1) Both skills declare temporary-agent: director-of-pm. (2) /roadmap:add consults DoPM on each proposed entry — 'milestone fit? cadence impact? evidence quality?'. (3) /roadmap:cleanup output includes DoPM-cited rule violations + recommendations. (4) Consultations emit manager-consult events for auditability. (5) Operator still reviews + approves all edits; DoPM annotates, doesn't autonomously write. (6) Tests cover all annotation paths. (7) Closes milestone 0.14.0 — moves to Shipped section in ROADMAP.md. (8) Local commit. Push operator-scoped.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — roadmap-skills
- `R-2` — manager-personas
- `R-3` — skill-integration

## Non-Goals

- Auto-editing roadmap without operator review

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| .claude/commands/roadmap/add.md | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260523-0049.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-015\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-015\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-015\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-015\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-015\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-015\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-015\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-015\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-015\release-plan.md`
