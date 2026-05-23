<!-- requirement-format-legacy -->
# PRD — Installer ownership manifest hook into /warp:setup — refuse writes to paths not in _warpos/MANIFEST.json

**Sprint:** `SP-20260523-003`
**Plan Contract:** `PC-20260523-0033`
**Status:** draft
**Documentation scale:** `s`

## Outcome

Every /warp:setup leaves the target in a state where _warpos/MANIFEST.json is honest about on-disk content. Maintainers using /warp:setup against new products immediately know if anything slipped through the cracks. Subsequent /warp:update + /warp:check skills get correct data.

## Context

### Original Request

> Installer ownership manifest hook into /warp:setup. /warp:setup should refuse to write any path not enumerated in _warpos/MANIFEST.json (or write it and flag as unmanifested coverage gap). Conceptually this IS the manifest generator + validator pair already shipped — needs the actual /warp:setup integration. Sprint 6 polish from ROADMAP.md Pickup Queue.

### Interpreted Intent

Sprint 1 shipped scripts/warpos/manifest/build.js (generator) and validate.js (--strict). /warp:setup writes a bunch of framework files (hooks, settings, manifest, etc) but doesn't currently verify the install matches _warpos/MANIFEST.json. This sprint adds a post-install step that runs build.js (regenerate manifest) + validate.js (--json) and surfaces findings — especially `unmanifested` (files written but not declared in manifest, which means future updates won't track them). Gentle mode: warn + log; --strict-manifest mode: refuse non-zero exit.

### Current Behavior

scripts/warp-setup.js writes framework files (hooks at scripts/hooks/, agents at .claude/agents/, settings.json, paths.json, manifest.json, etc) directly. No post-install validation against _warpos/MANIFEST.json. Validator exists but is unwired from /warp:setup.

### Desired Behavior

At the end of /warp:setup (after all writes), if target has _warpos/ directory: (1) run build.js --root <target> to regenerate/verify the manifest; (2) run validate.js --root <target> --json to check honesty; (3) parse findings and surface a summary (drift, missing, unmanifested counts). Refuse non-zero exit on --strict-manifest flag; else warn only. Fail-open if build/validate errors out (don't break install on tooling glitches).

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — Post-install manifest-coverage hook in warp-setup.js
- `R-2` — --strict-manifest flag
- `R-3` — Tests

## Non-Goals

- Do NOT modify build.js or validate.js (already shipped)

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/warp-setup.js (modify — add post-install manifest-coverage step) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260523-0033.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-003\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-003\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-003\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-003\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-003\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-003\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-003\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-003\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260523-003\release-plan.md`
