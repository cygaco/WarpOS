<!-- requirement-format-legacy -->
# PRD — Framework Boundary &amp; Identity — _warpos/ zone, MANIFEST.json, full purge of /warp:promote suite

**Sprint:** `SP-20260522-001`
**Plan Contract:** `PC-20260522-0022`
**Status:** draft
**Documentation scale:** `l`

## Outcome

Public canonical WarpOS (github.com/cygaco/WarpOS) becomes framework-source-only — zero product-titled files, zero promote-era artifacts. Installed products gain a clear ownership story (_warpos/MANIFEST.json) and predictable update semantics. The maintainer can confidently ship canonical updates without leaking product data, and Claude Code's tool-mandated path requirements are honored without forking the source-of-truth.

## Context

### Original Request

> Read roadmap.md and proceed with the first 3 sprints, using /sprint:full --turbo for each.

[follow-ups: "Oh, /mode:adhoc --turbo. Use the persistent team for all this business" / "And we can use a product delivery ticket from aiweb, I am doing several now, just make one up" / "Makie sure sprint:full works good brother, update if you need to. It is a took for your use"]

ROADMAP.md ## Now: Framework Boundary & Identity (the in-scope text for this sprint, 2026-05-22):

The new model in one sentence. Canonical WarpOS contains only framework source. Installed products treat `_warpos/` as the framework source-of-truth zone and `.claude/` as the compiled runtime interface; `_warpos/MANIFEST.json` declares per-path ownership. Sync is one-way (canonical → product) with no upstream channel of any kind — `/warp:promote`, `/warp:promote-flags`, `/warp:flag`, and `warpos-to-update.md` are all being purged. Discoveries reach canonical exclusively through the maintainer reading the products they maintain and writing into canonical ROADMAP via `/roadmap:add`.

[open] Full purge of the upstream-discovery surface — `/warp:promote`, `/warp:promote-flags`, `/warp:flag`, `warpos-to-update.md` — including the canonical skills, scripts, root files, path-registry keys, references across docs/agents/hooks/reference/.gitignore, downstream propagation via /warp:update, GitHub purge (normal commit, no history rewrite), and a canonical pre-commit guard refusing reintroduction.

[open] `_warpos/` source-of-truth zone + `MANIFEST.json` ownership. Installed products gain one new top-level directory: `_warpos/`. Tool-mandated paths become compiled views generated from `_warpos/` at install/update time. Manifest schema declares owner ∈ {framework|generated|project|runtime}.

[open] Generated-view discipline for tool-mandated paths. Source-of-truth in `_warpos/`, byte-identical generated copies at `.claude/commands/` and `.claude/agents/`, both committed to git. CI gate /check:framework-views-fresh fails build on stale views. Hooks need no view (referenced by path, not content).

[open] Three-layer `settings.json` compiler. Read `_warpos/settings/defaults.json` + `.claude/settings.local.json` → produce `.claude/settings.json` deterministically; fail loudly on conflicts.

[open] Canonical scrub: move WarpOS-as-product specs to a private workspace. Move `_requirements/00-canonical/*`, product-specific files in `_requirements/03-architecture/*`, `_docs/research/*`, `_docs/briefs/*`, `_docs/clones/*`, `_docs/imports/*` out of canonical into a new PRIVATE repo. Canonical KEEPS at `_requirements/` and `_docs/`: nothing — those directories don't exist at root after scrub.

[open] Five structural gates (manifest-driven): canonical pre-commit guard, /check:framework-purity, installer ownership manifest, /warp:update --status drift check, /check:framework-views-fresh.

[open] Migration plan (existing installed products). One-time migration for Jobzooka/DreamTeam/canonical-as-workspace: create `_warpos/`, move framework-owned content in, generate initial MANIFEST, update settings.json hook refs.

[deferred] Pattern C′ (`_requirements/.framework/` hidden mirror). Superseded.

### Interpreted Intent

Restructure WarpOS as a managed-configuration-layer over the host project's .claude/ interface. Declare ownership via _warpos/MANIFEST.json (per-path owner ∈ {framework|generated|project|runtime}); sync is one-way canonical→product; upstream channel (/warp:promote suite + warpos-to-update.md ledger) is fully purged. Tool-mandated paths (.claude/commands, .claude/agents, .claude/settings.json) become COMPILED VIEWS regenerated deterministically from _warpos/ sources, with CI gates refusing stale views and canonical pre-commit gates refusing leakage of product-specific content. Existing installs migrate via a one-time migration script. Pattern C′ deferred.

### Current Behavior

WarpOS today has no enforced boundary between 'framework source' and 'maintainer product workspace' inside a single checkout. /warp:promote enables bidirectional sync from a product repo into canonical WarpOS; this has leaked maintainer product data (Jobzooka-titled files) into the publicly-pushed canonical clone. Sync is bidirectional via /warp:promote (product→canonical) and /warp:update (canonical→product). The flag ledger (warpos-to-update.md), the promote suite, and supporting path-registry keys are still present and tracked. Tool-mandated paths (.claude/commands, .claude/agents, .claude/settings.json) are the only source-of-truth — no separate _warpos/ zone exists. .claude/settings.json is a single hand-edited file.

### Desired Behavior

Canonical WarpOS at github.com/cygaco/WarpOS contains framework/, scripts/, tests/, CLAUDE.md, AGENTS.md, ROADMAP.md, RELEASES.md, README.md — and explicitly NO _requirements/ or _docs/ at root. Installed products gain _warpos/ as the framework source-of-truth zone with MANIFEST.json declaring per-path ownership; .claude/commands and .claude/agents become byte-identical generated views from _warpos/ committed to git; .claude/settings.json is compiled deterministically from _warpos/settings/defaults.json + .claude/settings.local.json. No /warp:promote, /warp:flag, /warp:promote-flags skill, no warpos-to-update.md ledger, no promote-era keys in paths.registry.json. Five structural gates refuse drift back. Existing products migrate via a one-time script. A grep for 'warp:promote|warp:flag|warpos-to-update' in canonical returns zero hits outside ROADMAP archive references.

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — Purge: skills, scripts, root files, path-registry keys, references, GitHub commit (push gated)
- `R-2` — _warpos/ zone: directory creation + content layout + MANIFEST.json schema
- `R-3` — Generated-view discipline: regenerator script + .claude/commands & .claude/agents as committed views + /check:framework-views-fresh gate

## Non-Goals

- Do NOT execute the per-product migration against Jobzooka or DreamTeam in this sprint (recommended scope) — that's a follow-up

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| .claude/commands/warp/promote.md, promote-flags.md, flag.md (DELETE) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260522-0022.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-001\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-001\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-001\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-001\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-001\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-001\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-001\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-001\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-001\release-plan.md`
