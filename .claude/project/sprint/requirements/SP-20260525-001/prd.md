<!-- requirement-format-legacy -->
# PRD — Maintainer canonical scrub orchestration (milestone 0.10.0 sprint 1)

**Sprint:** `SP-20260525-001`
**Plan Contract:** `PC-20260523-0035`
**Status:** draft
**Documentation scale:** `m`

## Outcome

After this sprint, `_requirements/00-canonical/*` and product-titled `_requirements/03-architecture/*` no longer exist in canonical WarpOS. The maintainer's product-thinking lives in a private sibling repo `warpos-as-product` (registered in the portfolio). Canonical WarpOS publishes externally with no product-data leak — passes `grep -rn '00-canonical\|jobzooka\|dreamteam\|aiweb\|companycam' .` cleanly (modulo ROADMAP archive references + version-history sections). The 0.10.0 milestone is one sprint away from done (sprint 2 flips the gate flag).

## Context

### Original Request

> Maintainer canonical scrub orchestration — first sprint of milestone 0.10.0 Framework Boundary Closure. Goal: move WarpOS-as-product specs (`_requirements/00-canonical/*`, product-titled entries in `_requirements/03-architecture/*`, `_docs/research|briefs|clones|imports/*`) out of canonical and into a new PRIVATE sibling repo `warpos-as-product`. Use `/portfolio:new --slug warpos-as-product` to scaffold. Operator-scoped pieces: confirming slug, confirming which specs are product-vs-framework (use `framework-purity.js` allow-lists + `_warpos/MANIFEST.json` ownership classes as the source of truth — `framework` owner stays, `project` owner moves). After scrub completes, the post-scrub gate hardening sprint (sprint 2 of this milestone) flips `ROOT_LEAK_PENDING_SCRUB=false`. Autonomy: aggressive. Mode: adhoc. Escalate to operator when: irreversible repo-creation step, GitHub remote push, decision on borderline framework-vs-product specs that lack clear ownership marker.

### Interpreted Intent

Today, canonical WarpOS contains spec content that describes WarpOS *as a product* (CORE_BRIEF, USER_COHORTS, GOLDEN_PATHS, PRODUCT_MODEL, EVOLUTION, FAILURE_STATES under `_requirements/00-canonical/`), plus product-titled architecture docs and research/brief/clone/import docs under `_docs/`. These leak the maintainer's product-thinking into the publicly-pushed canonical clone. The framework-purity gate already detects this class via `root_leak` detector but is gated by `ROOT_LEAK_PENDING_SCRUB=true` — meaning the gate observes the leak and tolerates it pending this sprint. This sprint physically removes the leak: scaffold a private `warpos-as-product` sibling repo via `/portfolio:new`, move the leaking specs into it, regenerate `_warpos/MANIFEST.json`, and confirm purity gate inventory shows zero `root_leak` findings. The sibling sprint (post-scrub gate hardening) flips the flag to false; that's NOT in scope here.

### Current Behavior

12 files in _requirements/00-canonical/. _docs/research/, _docs/briefs/, _docs/clones/, _docs/imports/ exist with product-specific content. framework-purity.js root_leak detector observes these but ROOT_LEAK_PENDING_SCRUB=true tolerates them. No `warpos-as-product` portfolio entry exists yet. `grep -rn 'jobzooka\|dreamteam\|aiweb\|companycam' .` in canonical returns hits in ROADMAP + research files; some of these references are legitimate (ROADMAP archive history) and some leak product thinking (research notes).

### Desired Behavior

After sprint completion: (1) `warpos-as-product` is a new private sibling repo registered in ~/.warpos/portfolio.json; (2) `_requirements/00-canonical/*` removed from canonical (relocated to warpos-as-product); (3) Product-titled entries in `_requirements/03-architecture/*` enumerated, classified, and the product-titled ones relocated (framework-generic templates stay); (4) `_docs/research/`, `_docs/briefs/`, `_docs/clones/`, `_docs/imports/` relocated; (5) `_warpos/MANIFEST.json` regenerated and clean; (6) `/check:framework-purity --full` reports zero root_leak findings on canonical; (7) Local commit on `sprint/SP-20260525-001` branch captures the canonical-side deletion; warpos-as-product repo has its own initial commit with the moved content; (8) GitHub remote push of canonical's new commit AND warpos-as-product repo creation/push remain OPERATOR-SCOPED (orchestrator does NOT push per hard ceiling).

## Requirements

> Use existing requirement ID conventions enforced by
> `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/`
> use `R-N` ids — sprint-scope PRDs that link to a feature in
> `_requirements/04-features/<feature>/PRD.md` should reuse those ids,
> not invent new ones.

- `R-1` — framework-boundary
- `R-2` — portfolio
- `R-3` — filesystem-orchestration

## Non-Goals

- Flipping `ROOT_LEAK_PENDING_SCRUB=false` — that's sprint 2 of milestone 0.10.0.

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| _requirements/00-canonical/ | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records.

## Approval Boundaries

See Plan Contract `approval_boundaries`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260523-0035.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-001\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-001\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-001\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-001\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-001\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-001\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-001\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-001\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260525-001\release-plan.md`
