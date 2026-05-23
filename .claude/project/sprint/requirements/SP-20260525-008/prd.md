<!-- requirement-format-legacy -->
# PRD — Install matrix cross-version --apply coverage (milestone 0.12.0 sprint 4)

**Sprint:** `SP-20260525-008`
**Plan Contract:** `PC-20260523-0042`
**Status:** draft
**Documentation scale:** `s`

## Outcome

Operator never encounters a skill that says 'I work' but errors with `Cannot find module`. /check:skill-engines exits 0 on clean canonical; release-build refuses capsules with broken edges; /warp:setup postflight surfaces drift with actionable remediation.

## Context

### Original Request

> Operator finding in 0.7.x consumer install: scripts/turbo/apply.js doesn't exist but the /turbo skill doc IS installed — skill claims to work but can't. Fix-for-future bug class: ship a check that validates skill→engine dependency edges at release time AND at install postflight.

### Interpreted Intent

Skills under .claude/commands/ reference engine scripts via prose (e.g. 'Run `node scripts/turbo/apply.js`'). When the engine script is missing — either because canonical never shipped it, or because a capsule mid-build dropped it — the skill is silently broken. Add a scan/validate: parse skill docs for `scripts/...` references; cross-check that each referenced path exists in canonical. Wire into release-build as a fail-loud gate AND into /warp:setup postflight to catch consumer-side drift. Same shape as the path-manifest-coverage gap that 0.8.x solved.

### Current Behavior

No skill→engine dependency check exists. Operator finding: /turbo skill installed at 0.7.x without scripts/turbo/apply.js. Manifest coverage check ensures paths declared in MANIFEST exist on disk but does NOT validate inter-file references.

### Desired Behavior

(1) /check:skill-engines exists and exits 0 on clean canonical. (2) release-build refuses a capsule where any skill doc references a missing engine. (3) /warp:setup postflight runs the check and surfaces findings with remediation hints. (4) Tests cover clean, missing-ref, relative-path, multi-ref. (5) Local commit. Push operator-scoped.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — check-skills
- `R-2` — release-pipeline
- `R-3` — install-pipeline

## Non-Goals

- Auto-fixing missing engines

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| .claude/commands/check/skill-engines.md (NEW) | unknown |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260523-0042.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-008\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-008\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-008\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-008\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-008\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-008\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-008\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-008\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-008\release-plan.md`
