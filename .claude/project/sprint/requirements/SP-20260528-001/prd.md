<!-- requirement-format-legacy -->
# PRD — Rename check: namespace to scan: + scan:full system scan

**Sprint:** `SP-20260528-001`
**Plan Contract:** `PC-20260529-0057`
**Status:** draft
**Documentation scale:** `m`

## Outcome

A single coherent scan: namespace with scan:full as the one-command full system scan; stable foundation + naming clarity before the 0.17.0 test-suite system is built on top of it. Reduces the instability the operator is feeling by making 'run all checks' a first-class, discoverable command.

## Context

### Original Request

> Make it /scan:issues and change the check: namespace to scan: and then make a scan:full that does all scans 'a full system scan'. if 'check:all' or something similar exists, extend that when you rename it. /sprint:full for this. then, start busting out the roadmap, and i want that test suite first

### Interpreted Intent

Migrate the entire check:* skill namespace to scan:* across canonical WarpOS, fold issues:scan into the new namespace as scan:issues, and promote the existing check:all aggregator to scan:full extended to run EVERY scan as one full-system-scan unified report. Treat as a cross-cutting literal rename governed by CLAUDE.md Refactor & Rename Hygiene (grep every occurrence of the old literal; a missed caller is the whole bug class).

### Current Behavior

~32 check:* skills under _warpos/commands/check + compiled .claude/commands/check; check:all is a parallel runner producing a unified report; issues:scan lives in the issues: namespace. No scan: namespace exists.

### Desired Behavior

All check:* skills available as scan:* with identical behavior; issues:scan available as scan:issues; check:all promoted to scan:full extended to run every scan (all scan:* + scan:issues) as one full-system-scan report; deprecation alias shims resolve old high-traffic names during transition; zero stale check:/issues:scan literals remain except in history/changelog/ROADMAP-archive.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — Skill namespace rename (source + views)
- `R-2` — scan:full aggregator + unified full-system-scan report
- `R-3` — Deprecation alias shims

## Non-Goals

- Renaming the issues:list/log/resolve skills (only issues:scan moves).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| _warpos/commands/check/* (source-of-truth skill defs) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260529-0057.yaml`
- High-level stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260528-001\high-level-stories.md`
- Granular stories: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260528-001\granular-stories.md`
- COPY: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260528-001\copy.md`
- INPUTS: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260528-001\inputs.md`
- TRACE: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260528-001\trace.md`
- Acceptance criteria: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260528-001\acceptance-criteria.md`
- QA plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260528-001\qa-plan.md`
- Redteam plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260528-001\redteam-plan.md`
- Release plan: `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260528-001\release-plan.md`
