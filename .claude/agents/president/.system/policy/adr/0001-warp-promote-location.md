# ADR 0001 - Build /warp:promote in Jobzooka First

**Date:** 2026-05-01
**Status:** accepted
**Class:** B (architecture and release process)

---

## Decision

Build `/warp:promote` in the Jobzooka repository first, then use it to promote framework-owned assets into the canonical WarpOS repository.

## Context

Jobzooka is the further-along development repository for the Alex/WarpOS framework. It already contains the active agent specs, hook system, path registry, release capsules, migration scripts, and product-tested failure fixes. The separate WarpOS repository is the shipped installable product, but at the time of this decision it lagged behind Jobzooka.

The Phase 4 plan needed a promotion engine that can compare framework-owned assets, exclude project/runtime data, classify changes, and produce a safe promotion plan. Building that engine directly in the less-complete canonical repo would require first backporting the same assets manually, which is exactly the drift class the engine is meant to eliminate.

## Options considered

1. **Jobzooka first:** Build and validate `/warp:promote` where the current framework actually lives.
2. **WarpOS first:** Pause Jobzooka framework work, manually backport enough state to WarpOS, then build the engine there.
3. **Parallel implementation:** Build separate promote scripts in both repositories and reconcile later.

## Decision criteria

| Criterion | Jobzooka first | WarpOS first | Parallel |
|---|---|---|---|
| Product fit | high | medium | low |
| Simplicity | high | low | low |
| Reliability | high | medium | low |
| Reversibility | high | medium | low |
| Drift reduction | high | medium | low |

## Why this option won

Jobzooka-first scored highest because it keeps the promotion engine close to the most complete source of truth and avoids a manual sync prerequisite. The engine is reversible because its Phase 4 baseline is dry-run only, and the actual apply path stays gated behind classification, review, and release checks.

## Risks

- Jobzooka-specific files may accidentally enter a promotion plan.
- The canonical WarpOS repository remains behind until promotion is run.
- The source of truth can be confusing if humans assume the shipped repo is always ahead.

## Mitigations

- `/warp:promote` classifies framework, generated, runtime, project, secret, template-review, and migration-candidate files separately.
- Runtime and project paths are excluded by manifest owner and path prefix.
- `NEXT-WARP.md` records that Jobzooka is the framework dev repo and WarpOS is the shipped product.
- Phase 4 keeps apply mode dry-run until the target clone path and post-promotion gates are wired.

## Reversal plan

If WarpOS becomes the more complete development repo, move the promote engine there and reverse the direction: WarpOS becomes source, Jobzooka becomes a consumer. The trigger would be a release where WarpOS contains a newer framework manifest and Jobzooka has no framework-only changes not already promoted.

## References

- `NEXT-WARP.md` Section 9, ADR-001
- `NEXT-WARP.md` Section 10, decision Q3
- `scripts/warpos/promote.js`
- `CLAUDE.md` cross-repo parity rule
