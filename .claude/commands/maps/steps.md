---
description: Regenerate step tables in canonical docs from docs/00-canonical/STEPS.json — closes the last loop in the step-registry infrastructure.
---

# /maps:steps — Regenerate Step Tables from STEPS.json

Reads `docs/00-canonical/STEPS.json` and rewrites the auto-generated regions in the three canonical docs:
- `docs/00-canonical/PRODUCT_MODEL.md` — onboarding + dashboard tables in "The 10-Step Model (Target State)"
- `docs/00-canonical/GLOSSARY.md` — Onboarding Steps + Dashboard Activities tables
- `docs/00-canonical/GOLDEN_PATHS.md` — Flow (Target State) primary-path diagram

Each auto-generated region is delimited by `<!-- maps:steps:START (region=<name>) --- auto-generated; do not edit -->` and `<!-- maps:steps:END (region=<name>) -->`. Content between the markers is fully replaced on each run; content outside is untouched.

This is the loop-closer for the step-registry infrastructure. After it lands: any step move/consolidation is a one-file edit to `STEPS.json` followed by `/maps:steps` — no more 29-file agent sweeps like the deep-dive move.

## Input

`$ARGUMENTS` — optional flags:
- no args → regenerate all regions
- `--check` → read-only; exit 1 if any region would change on regen (CI mode / pre-commit)
- `--verbose` → explain every replacement
- `--json` → emit JSON summary `{ changed: [...], missing_markers: [...] }`

## Procedure

1. Resolve paths from `.claude/paths.json` (specGraph is nearby; STEPS.json lives at `docs/00-canonical/STEPS.json` — literal, not yet a paths.json key).
2. Invoke the regenerator: `node scripts/generate-steps-maps.js $ARGUMENTS`.
3. If exit is non-zero AND the error is "MISSING MARKERS":
   - Report the list to the user.
   - Offer to insert the required `<!-- maps:steps:START/END -->` markers at the natural location in each doc (near the SOURCE OF TRUTH comment). Default is to insert automatically when run without `--check`; under `--check` just report.
4. If exit is non-zero AND the error is a schema / JSON error in STEPS.json, report the error verbatim and stop — do not write partial updates.
5. On success, print the list of files changed + a diff summary.

## Examples

```bash
# Regenerate everything
/maps:steps

# Pre-commit / CI: fail if regen would produce changes
/maps:steps --check

# See what's being replaced
/maps:steps --verbose
```

## What gets regenerated (per region)

| Doc | Region | Content |
|---|---|---|
| PRODUCT_MODEL.md | `product-model-onboarding` | Onboarding phase step table (# / phase / id / component / requires / produces) |
| PRODUCT_MODEL.md | `product-model-dashboard` | Dashboard phase activity table (activity / component / requires / produces) |
| GLOSSARY.md | `glossary-onboarding` | Onboarding Steps table (position / id / component / file) |
| GLOSSARY.md | `glossary-dashboard` | Dashboard Activities table (activity / component / file / feature) |
| GOLDEN_PATHS.md | `golden-paths-flow` | Primary-path diagram (onboarding → DASHBOARD → {activities}) |

## What does NOT get regenerated

- Narrative sections, invariants, "why this matters" commentary, emotional arcs, data dependency chain, invalidation rules — all hand-maintained.
- COPY.md, PRD.md, STORIES.md inside individual features — out of scope.

## Relation to step-registry-guard

- `step-registry-guard.js` blocks **hardcoded integers in source** + **invalid edits to STEPS.json itself**.
- `/maps:steps` propagates changes **from STEPS.json to the canonical doc tables** that describe it.
- `STEPS.json` is in `manifest.fileOwnership.foundation` — foundation-guard requires an Alpha/Gamma heartbeat (see `.claude/agents/store.json`) to edit.

Together, these three layers close the loop: one edit to STEPS.json, guarded edit, auto-propagated tables, warned source-code drift.

## Related

- `/maps:all` — registry of all maps; may delegate to this skill
- `/check:references` — validates cross-file references; respects the auto-generated markers
- `scripts/generate-maps.js` — sibling regenerator for hooks/skills/memory/tools/systems maps (not steps)
- `scripts/generate-steps-maps.js` — the actual implementation invoked by this skill
