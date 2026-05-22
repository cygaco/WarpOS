<!-- requirement-format-legacy -->
# PRD — Install &amp; Release Integrity — manifest coverage, dry-run + rollback, idempotent install, framework-views-fresh + framework-purity gates

**Sprint:** `SP-20260522-002`
**Plan Contract:** `PC-20260522-0023`
**Status:** draft
**Documentation scale:** `l`

## Outcome

Maintainer and downstream products experience update reliability as a default, not a luxury. /warp:update --dry-run shows exactly what will change before committing. Manifest-coverage gates catch 'forgot to register new framework content' before release. Rollback snapshots let any update be undone. CI gates refuse stale generated views and product leaks from being shipped. The hollow-claim class (e.g. dreamteam manifest gap that claimed complete but broke /mode:adhoc --turbo) becomes structurally impossible.

## Context

### Original Request

> Read roadmap.md and proceed with the first 3 sprints, using /sprint:full --turbo for each.

ROADMAP.md ## Now: Install & Release Integrity (the in-scope text for this sprint, 2026-05-22):

Sprint-2 target. Reason: dreamteam's first sprint hit a manifest gap that broke /mode:adhoc --turbo despite framework-installed.json claiming a complete install. The pattern recurs — installs claim completeness, manifest snapshots get stale, capsules drift from source. Make WarpOS installs boring.

[fixed-local] Manifest generator missed 15 scripts/ subdirs + mode-set.js — to ship in this release.

[open] Manifest-coverage regression check (/check:warpos-manifest-coverage).
[open] release-build.js refuses stale manifest.
[open] .claude/manifest.json always-present at install + graceful absence in callers.
[open] release-build post-update check provenance (resolve 0.1.4-era bug class).
[open] Runtime-leak .gitignore gap.
[open] Idempotent install with per-file status reporting (codex stay-simple must-have).
[open] Update dry-run + diff (codex stay-simple must-have).
[open] Versioned migrations + user-override tracking in _warpos/MANIFEST.json (codex stay-simple must-have).
[open] _warpos/MANIFEST.json generator + validator (scripts/warpos/manifest/build.js + validate.js).
[open] Generated-views regenerator (scripts/warpos/views/regenerate.js).
[open] Three-layer settings.json compiler.
[open] /check:framework-views-fresh CI gate.
[open] /check:framework-purity canonical gate.
[open] Rollback snapshot for /warp:update.
[open] Install fixture CI matrix.

### Interpreted Intent

Harden the WarpOS install + update + release pipeline so installs become boring (predictable, dry-runnable, rollbackable, regression-tested). Implement the _warpos/MANIFEST.json generator/validator/regenerator from Sprint 1's schema; add coverage + freshness gates that refuse stale or drifted state; surface install/update changes per-file (dry-run + diff + rollback); track user-overrides so updates don't silently overwrite local work; ship the three-layer settings.json compiler; add an install-fixture CI matrix that exercises clean repo / existing install / dirty repo / multi-version-upgrade / user-override scenarios.

### Current Behavior

Install + update currently rely on .claude/framework-installed.json + framework-manifest.json (per-file kind/sha but no ownership classes, no user-override tracking, no rollback snapshot). /warp:update --dry-run is parsed but does not gate writes in all paths. release-build.js does not check manifest freshness before snapshotting into a capsule (manifest-coverage drift caused dreamteam's mode-set bug 2026-05-21). Settings.json is a hand-edited per-project file with no compile step. Hooks gate-test installs manually after each release; no CI matrix.

### Desired Behavior

Every framework file is enumerated in _warpos/MANIFEST.json with owner (framework|generated|project|runtime), source sha256, current sha256, and userModified flag. /warp:setup is idempotent and reports per-file unchanged/repaired/added/conflict. /warp:update --dry-run lists every change before applying — framework/project/user-owned/conflicts — and `--apply` writes a rollback snapshot so /warp:rollback <update-id> reverts framework files without touching user files. release-build.js refuses to snapshot a capsule when manifest is stale. /check:warpos-manifest-coverage flags any on-disk path not enumerated. /check:framework-views-fresh fails the build when .claude/commands or .claude/agents drift from _warpos/ source. /check:framework-purity refuses commits to _requirements/ or _docs/ at canonical root and rejects client slugs / maintainer abs paths / product spec titles. .claude/manifest.json is always present at install; the four CLIs that hardcode it tolerate absence + warn + fall through. CI matrix exercises clean / existing / dirty / multi-version / user-override install scenarios on every PR.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — Manifest generator/validator/regenerator
- `R-2` — Settings.json compiler
- `R-3` — /warp:update dry-run + rollback + per-file status

## Non-Goals

- Do NOT implement the central-control-plane multi-product architecture (parked)

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| scripts/warpos/manifest/build.js (new — walks _warpos/, computes sha256, classifies ownership) | assumed_from_request |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260522-0023.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-002\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-002\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-002\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-002\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-002\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-002\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-002\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-002\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-002\release-plan.md`
