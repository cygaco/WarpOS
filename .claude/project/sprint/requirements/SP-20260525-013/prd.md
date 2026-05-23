<!-- requirement-format-legacy -->
# PRD — Events retention policy — auto-roll events.jsonl above threshold (milestone 0.13.0 sprint 4)

**Sprint:** `SP-20260525-013`
**Plan Contract:** `PC-20260523-0047`
**Status:** draft
**Documentation scale:** `s`

## Outcome

events.jsonl stays bounded in size. /events:tail / /events:query / smart-context loaders stay fast. Operator stops needing to manually compact via /sleep:deep.

## Context

### Original Request

> events.jsonl crosses ~6MB in real-world usage. sleep:deep handles compaction manually today. Automate: rotate above threshold (e.g. 10MB), compress old segment to .gz, keep last N rotations.

### Interpreted Intent

paths.eventsFile (events.jsonl) is append-only and grows monotonically. At 6MB it's already large; future growth degrades read performance for /events:tail + /events:query + smart-context's append. Add a rotation policy: when events.jsonl > 10MB, rotate to events.jsonl.<ISO>.gz; keep last 5 rotations; clean older. Triggered on append from logger.js OR via periodic check skill.

### Current Behavior

events.jsonl grows unboundedly. /sleep:deep manually compacts via aggregation. No automatic rotation.

### Desired Behavior

(1) logger.js checks file size on append; rotates above threshold. (2) Rotated files are gzipped + timestamped. (3) Last N=5 rotations kept; older deleted. (4) /events:tail + /events:query include rotated archives in their scan (or have a --no-archives flag for current-only). (5) Tests cover rotation + cleanup. (6) Local commit. Push operator-scoped.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — logging
- `R-2` — retention
- `R-3` — performance

## Non-Goals

- Cross-machine event aggregation

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/lib/logger.js | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260523-0047.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-013\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-013\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-013\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-013\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-013\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-013\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-013\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-013\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-013\release-plan.md`
