<!-- requirement-format-legacy -->
# PRD — Migration bootstrap script — convert existing WarpOS installs to _warpos/ architecture

**Sprint:** `SP-20260522-004`
**Plan Contract:** `PC-20260523-0026`
**Status:** draft
**Documentation scale:** `m`

## Outcome

Rolling _warpos/ out to real products (Jobzooka, DreamTeam) becomes a single command instead of a multi-day manual migration. The new ownership/regeneration/validation system gets exercised under real load — which surfaces edge cases that canonical-only testing can't. Sprint 5 candidates after this (install/release reliability batch, Sprint 6 polish) all build on the assumption that _warpos/ exists in products.

## Context

### Original Request

> Implement scripts/warpos/manifest/bootstrap.js — migration script that converts an existing WarpOS install (Jobzooka, DreamTeam, canonical-as-workspace) to the new _warpos/ architecture. Creates _warpos/ zone at product root, copies framework-owned content in (scripts/hooks → _warpos/hooks, templates, schemas, reference, settings/defaults), generates initial _warpos/MANIFEST.json via build.js, updates .claude/settings.json hook references to point at _warpos/hooks/, runs validator.js --strict to confirm clean migration. Canonical-vs-product detection (canonical = self-references, product = _warpos source-of-truth). Safe-copy semantics (no overwrites without explicit flag). Sprint 5 candidate from ROADMAP.md Pickup Queue (lines 45, 138, 297-303). Output: scripts/warpos/manifest/bootstrap.js + comprehensive tests + integration with /warp:setup discovery.

### Interpreted Intent

Sprint-1's architecture-core landed schema v1 + generator + validator + regenerator + settings compiler + structural gates against canonical itself, but installed products (Jobzooka, DreamTeam) still have no _warpos/ zone. A one-shot bootstrap script materializes that zone in an existing install: creates _warpos/, copies framework-owned content (hooks, templates, schemas, reference, settings/defaults) into it, generates the initial MANIFEST.json via build.js, rewrites .claude/settings.json hook paths to point at _warpos/hooks/*.js, then runs validator.js --strict for a clean-state attestation. Canonical-vs-product detection branches behavior (canonical sources self-reference; product sources point at _warpos/). Safe-copy semantics refuse to overwrite without --force.

### Current Behavior

scripts/warpos/manifest/ has build.js, validate.js, test-build.js, test-validate.js. scripts/warpos/views/ has regenerate.js, test-regenerate.js. Canonical _warpos/ contains only MANIFEST.json (1939 paths, 0 unmanifested). DreamTeam product repo has zero _warpos/ directory. No bootstrap.js exists. There is no automated path from a v0.8.x install (scripts/hooks/, no _warpos/) to a v0.9+ install (_warpos/ zone with framework-owned content). A maintainer wanting to migrate Jobzooka or DreamTeam would have to hand-create _warpos/, copy content in, regenerate MANIFEST, rewrite settings.json hook refs — all error-prone.

### Desired Behavior

node scripts/warpos/manifest/bootstrap.js [--root <dir>] [--source <canonical-clone>] [--force] [--dry-run] [--json] performs the migration end-to-end: (1) detect canonical-vs-product mode from the target's framework-installed.json or absence thereof; (2) refuse if _warpos/ already exists without --force; (3) copy framework-owned content from the source canonical (scripts/hooks → _warpos/hooks, templates, schemas, reference, settings/defaults) into the target's _warpos/; (4) invoke build.js to generate initial _warpos/MANIFEST.json with canonical-vs-product sourcePrefix; (5) rewrite .claude/settings.json hooks block — every command path that starts with scripts/hooks/ becomes _warpos/hooks/; (6) optionally invoke views/regenerate.js to materialize .claude/commands and .claude/agents from _warpos/; (7) run validate.js --strict and report clean-state attestation; (8) emit a bootstrap report. --dry-run prints the plan without writing.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — Bootstrap CLI (scripts/warpos/manifest/bootstrap.js)
- `R-2` — Canonical-vs-product detection helpers
- `R-3` — Safe-copy + force-overwrite semantics

## Non-Goals

- Do NOT migrate _requirements/ or _docs/ — those are project-owned content per the ownership model

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/warpos/manifest/bootstrap.js (new) | assumed_from_request |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260523-0026.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-004\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-004\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-004\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-004\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-004\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-004\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-004\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-004\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-004\release-plan.md`
