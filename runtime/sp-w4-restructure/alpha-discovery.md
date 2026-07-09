# W4 RESTRUCTURE — α discovery memo (for EpsilonW4)

*Written 2026-06-19 by α. Companion to `partition-plan.md` (the per-file disposition table). Read both before executing.*

## Goal (re-scoped W4, operator 2026-06-19)
Canonical `_requirements/` must carry **NO baked-in product** (jobzooka OR AcmeLaunch). Product canon is generated per-product at `bootstrap:spinup`. Keep ONE labeled example **aside** under `_warpos/EXAMPLES/`.

## Disk reality (VERIFY-DON'T-INHERIT — the DUMP over-claimed)
- DUMP claimed "jobzooka=0 / de-brand DONE" @ `99e033c8`. **FALSE on disk:** `grep -i jobzooka` over `_requirements/` = **108 occurrences across 38 files** (e.g. `00-canonical/CORE_BRIEF.md` line 1 still `# Jobzooka — Core Brief`). The prior de-brand did not land cleanly. **Treat disk as truth.**
- All 38 jobzooka-bearing files ∈ RELOCATE(32) ∪ GENERICIZE(10) per `partition-plan.md`. So after RELOCATE + GENERICIZE-scrub, canonical `_requirements/` reaches 0 jobzooka. (Re-verify by grep at the end — Explore's envelope under-counted jobzooka as "12"; do not trust counts, re-grep.)
- The broad product-vocab grep (`acme|rocket|scout|strike|arsenal|deus|orchestrat`) hit 59 files but is **inflated by "orchestrat"** (generic). Real product tokens = jobzooka + rockets/Scout/Strike/Arsenal/Deus-Mechanicus + acme. Re-grep precisely; don't scrub the generic word "orchestration".

## Architecture (what's source vs output)
- **`_warpos/templates/canonical/*.tmpl`** = the framework SOURCE templates (KEEP, do NOT touch). Confirmed present.
- **`_requirements/00-canonical/`** = the canon-gen **OUTPUT slot** — `scripts/canon/generate.js:65` writes product canon here. In WarpOS-canonical it currently holds the **Jobzooka example canon**. This is the product instance sitting in the output slot.
- `_requirements/` is `owner:project` and (per DUMP) currently EXCLUDED from the shipped framework manifest walk. `_warpos/EXAMPLES/` must be ADDED to the walk so the example ships.

## Example brand decision (RESOLVED)
Disk content is **Jobzooka**, not AcmeLaunch (rename never landed). Do NOT chase a half-done AcmeLaunch rename. **Relocate the instance as the Jobzooka example → `_warpos/EXAMPLES/Jobzooka/_requirements/`.** The brand of the example is immaterial to the goal (core carries no product). DUMP even lists `_warpos/EXAMPLES/Jobzooka/` as an acceptable destination.

## Surgical entanglements (the reason this is NOT a bulk git mv)
1. **`scripts/generate-steps-maps.js`** reads `_requirements/00-canonical/STEPS.json` (registry) + writes auto-gen regions into `PRODUCT_MODEL.md` / `GLOSSARY.md` / `GOLDEN_PATHS.md`. Already collects absent targets into `missing[]` and `continue`s (line ~175). **Action:** make `--check` (and a bare run) exit 0 / no-op cleanly when STEPS.json (and/or all targets) is absent — i.e. "no product canon in this repo → nothing to do". Add a regression test for the absent-canon case.
2. **`scripts/hooks/pre-commit-steps-check.js`** (BLOCKING pre-commit hook) only fires when `STEPS.json` or the 3 canon docs are **staged at their `_requirements/00-canonical/...` paths**; `--diff-filter=ACMR` excludes deletes. After relocation those paths are gone, the relocate commit stages deletes (excluded) + adds under `_warpos/EXAMPLES/` (NOT in its hardcoded watch list) → the hook **no-ops in canonical**. SAFE. Still: ensure its `runDriftCheck()` (calls generate-steps-maps.js --check) returns ok when STEPS.json absent (covered by #1).
3. **`STEPS.json`** = concrete 10-step onboarding/dashboard flow = **product-specific (Jobzooka)**. Relocate it WITH the example into `_warpos/EXAMPLES/Jobzooka/_requirements/00-canonical/`. generate-steps-maps.js + pre-commit-steps-check.js stay as framework tooling that no-ops absent a product.
4. **`scripts/bootstrap/phases/roadmap.js`** `CANON_REQUIRED=["CORE_BRIEF.md","GOLDEN_PATHS.md"]` and `test-spinup-orchestrate.js` operate on a **throwaway temp out dir** (generated product output), NOT canonical `_requirements/`. SAFE — leave.
5. **Agent specs** (research-lead, director-of-growth, backend/builder, `_system/agent-system.md`) reference `_requirements/00-canonical/USER_COHORTS.md`, `_requirements/03-architecture/FLOW_SPEC.md` etc. as **"read the product's canon WHEN PRESENT"** pointers — generic pointers to a product's canon slot, valid downstream. Leave them; do NOT repoint to EXAMPLES (they must point at the live product slot, which is correctly empty in canonical). Spot-verify none HARD-require a canonical-repo copy.
6. `scripts/delta-*` `.txt` files mention FLOW_SPEC.md/PRODUCT_MODEL.md — these are a **prompt-corpus**, not live consumers. Ignore.

## Execution order (suggested)
1. Ref-check pass (basenames of the 32 + STEPS.json across scripts/.claude/docs — confirm only the consumers in #1–#5 above; the live hard-consumers are generate-steps-maps.js + pre-commit-steps-check.js, both handled).
2. `mkdir -p _warpos/EXAMPLES/Jobzooka/_requirements/` (mirror the subdir tree).
3. `git mv` the 32 RELOCATE files (partition-plan.md list) + `00-canonical/STEPS.json` → `_warpos/EXAMPLES/Jobzooka/_requirements/<same subpath>`.
4. Make `generate-steps-maps.js` (+ `--check`) absence-tolerant; add regression test (absent-canon → exit 0). Re-run pre-commit hook logic mentally / in a probe commit.
5. GENERICIZE the 10 templates (partition-plan.md GENERICIZE list — `_standards/PRD_TEMPLATE.md`, `HIGH_LEVEL_STORIES.md`, `GRANULAR_STORIES.md`, `STORIES-COMMON.md`, `01-design-system/COLOR_SEMANTICS.md`, `UX_PRINCIPLES.md`, `09-integrations/PROVIDER/{01-anthropic,02-openai,03-google-gemini,04-stripe}.md`): scrub jobzooka/acme/product examples → neutral placeholders (e.g. `[product]`, `{{PRODUCT_NAME}}`, generic sample), KEEP the template scaffold.
6. Update `scripts/generate-framework-manifest.js` walk to SHIP `_warpos/EXAMPLES/`.
7. Handle `_warpos/BASELINE/_requirements/` (also jobzooka) — relocate to `_warpos/EXAMPLES/Jobzooka/BASELINE/` or delete (your call; document it).
8. Regen BOTH manifests (fm → installed → _warpos as applicable; `build.js`).
9. **Verify gate (all must pass):** `grep -i jobzooka` and `grep -i acmelaunch` over canonical `_requirements/` (EXCLUDING `_warpos/EXAMPLES/`) = **0**; `/scan:framework-purity` GREEN; `node scripts/bootstrap/test-spinup-orchestrate.js` still green (canon-gen + canon-no-unfilled-tokens degrade gate intact); `node scripts/generate-steps-maps.js --check` exits 0 in canonical; trackers `node scripts/trackers/validate.js` 20/20.

## Verify-gate one-liners
- `grep -rIi jobzooka _requirements/ | wc -l` → expect 0 (templates now placeholder).
- `grep -rIi acmelaunch _requirements/ | wc -l` → expect 0.
- jobzooka/acme allowed ONLY under `_warpos/EXAMPLES/Jobzooka/`.

## Branch
Conduct on the CURRENT branch `sprint/SP-20260619-001-jobzooka-genericize` (this IS the jobzooka-genericize sprint's continuation). Builders in isolation worktrees → merge back to this branch. α stays hands-off the working tree while you run; α owns final verify + the merge-to-main serialization (E-TEAMS lands on its own branch in parallel; α serializes the two merges + manifest reconcile).
