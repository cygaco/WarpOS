<!-- requirement-format-legacy -->
# PRD — /warp:update --status wires manifest validator into per-file table

**Sprint:** `SP-20260522-005`
**Plan Contract:** `PC-20260523-0028`
**Status:** draft
**Documentation scale:** `s`

## Outcome

Maintainers gain a single command to audit any WarpOS install's manifest honesty against its on-disk state — for Jobzooka, DreamTeam, or canonical itself. CI can wire this in as a release gate. Today the audit requires manually running validate.js with the right --root flag; the new wrapper is one canonical entry point.

## Context

### Original Request

> /warp:update --status wires the validator. Validator (validate.js --json) is ready to consume; need to add --status to scripts/warpos/update.js and surface the JSON output as a per-file table. Sprint 6 polish from ROADMAP.md Pickup Queue.

### Interpreted Intent

scripts/warpos/manifest/validate.js --json already emits a structured payload with findings (missing/drift/unmanifested/user_modified/schema_violation) and ownerCounts. Sprint 6 wires this into scripts/warpos/update.js as an early-branch --status flag (like --rollback), so maintainers can run /warp:update --status against any install and get a human-readable diagnostic table — or pipe through --json for CI consumption. Exit 0 when clean, exit 1 when any finding present.

### Current Behavior

scripts/warpos/update.js has --to (apply/dry-run) and --rollback early branches. No --status. Validators must be invoked directly via node scripts/warpos/manifest/validate.js --root <dir> --json.

### Desired Behavior

node scripts/warpos/update.js --status [--target <dir>] [--json] [--strict] spawns validate.js --json under the hood. Human output: header (manifest path, root, pathCount, ownerCounts), then table per finding class (DRIFT / MISSING / UNMANIFESTED / USER_MODIFIED / SCHEMA_VIOLATION) with each item's path. JSON output: validator JSON augmented with mode=status. Exit 0 when total findings == 0, exit 1 otherwise. --target defaults to REPO_ROOT. --strict passes through to validate.js.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — --status early branch in update.js
- `R-2` — runStatusCli() helper
- `R-3` — Per-class findings table renderer

## Non-Goals

- Do NOT add a new --apply mode to --status (read-only diagnostic only)

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/warpos/update.js (modify — add runStatusCli + --status early branch + exports) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260523-0028.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-005\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-005\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-005\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-005\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-005\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-005\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-005\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-005\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-005\release-plan.md`
