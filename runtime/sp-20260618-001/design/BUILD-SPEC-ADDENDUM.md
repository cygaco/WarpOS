# SP-20260618-001 build_spec ADDENDUM — DoE + quality-lead synthesis (design, folded by ε)

The product-lead build_spec (BUILD-SPEC.md) stands. These 7 refinements are BINDING on the
backend-builder, folded from the DoE + quality-lead in-process consults (both real Agent returns,
recorded ok:true: DoE d-mqjwn8jx, QL d-mqjwn8l9). Verified against code where noted.

## 1. BASELINE — RESOLVED: create INLINE in U1 (no separate generator this sprint)
- Content = **pristine snapshot of the owner=project seeded skeleton** (the `_requirements/` + `_docs/`
  zones U2 seeds). NOT an update-diff, NOT a templates copy.
- Sole reference is `scripts/warpos/manifest/validate.js:30` — a DEFERRED consumer ("owner=project
  seed-drift (depends on _warpos/BASELINE/ existing with snapshot of seeded content)"). VERIFIED:
  validate.js docstring lists this under "Deferred to follow-up" → the seed-drift check is NOT in
  this sprint, so BASELINE is built inline. DoE's mind-changer (would need own generator) does NOT
  trigger — confirmed in code.
- **U1↔U2 ordering nuance:** U1 creates the `_warpos/BASELINE/` dir; its CONTENT is the snapshot of
  U2's seeded skeleton. Since U2 defines what the seed-zones contain, the BASELINE snapshot content
  must reflect the seed-zone shape U2 produces. Practical resolution: U1 creates the dir + snapshots
  the CURRENT canonical `_requirements/`+`_docs/` skeleton structure (the shippable seed shape);
  if U2 changes that shape, U2 refreshes the BASELINE snapshot as part of its own verified_by.
- **DEFERRED-DEBT (quality-lead (d)):** a hand-built BASELINE has NO regen enforcer → latent drift.
  Log this as a deferred-debt item (BASELINE gets a generator when validate.js seed-drift lands).
  NOT a blocker this sprint; note it in the release/retro.

## 2. ANTI-VALUE-INVERSION — the positive shipped-set assertion MUST be count/membership + negative
quality-lead NO-SHIP FLIP CONDITION (binding): the builder FAILS the gauntlet if it lands only the
single-string assertion. Required, pre- AND post-delete:
- POSITIVE: assert all **9 template subtrees AND 108 files** land in the shipped set (framework-manifest
  assets), NOT merely that the string `_warpos/templates/` appears once (one src entry ≠ 108 files shipping).
- NEGATIVE: assert `_warpos/MANIFEST.json` + `_warpos/settings/defaults.json` are STILL NOT in the
  shipped set (proves the carve-out was surgical, not a blanket un-exclude).

## 3. CARVE-OUT — NEGATIVE-then-POSITIVE pair, order-sensitive (DoE R1, code-verified)
`KNOWN_NOT_SHIPPED` is evaluated by `isAllowlisted` via `p === prefix || p.startsWith(prefix)`
(ship-coverage.js:197–200), first-match `.find()`. Replace the blanket `{prefix:"_warpos/"}` (line 77)
with TWO narrow entries: `{prefix:"_warpos/MANIFEST.json"}` + `{prefix:"_warpos/settings/"}`.
Then `_warpos/templates/**` falls through to the hard-signal check; it is NOT under `HARD_SIGNAL_ROOTS`
(line 214), so an un-shipped `_warpos/templates` path lands in `infoGaps` → hard-fails (line 290).
That's the enforcer that catches a missed generator repoint. Keep BOTH this AND the positive assertion.

## 4. R2 — WALK-SKIP seam (DoE, code-verified CLEAN, assert it stays so)
VERIFIED: `WALK_SKIP_DIRS` (scripts/warpos/manifest/walk-skip.js, shared by build.js + validate.js)
skips by BASENAME and does NOT contain `_warpos` (only `.warpos` with a dot) or `templates`. So
`_warpos/templates/` IS walked into the ownership manifest. verified_by addition: assert
`_warpos/templates` is NOT in WALK_SKIP_DIRS (a builder adding it would silently zero the subtree, no RED).

## 5. FORWARD-SEARCH — repo-wide, not 3 dirs (DoE, β-correction #5 tightened)
The build_spec greps only `scripts framework .claude`. DoE found 59 hits/24 files in scripts/ alone,
40+ files under .claude/, + **3 LIVE path-registry keys**. VERIFIED in code:
`framework/paths.registry.json` line 370 = `framework/templates/app-scaffold`, line 859 =
`framework/templates/sprint`, line 994 = `framework/templates/portfolio` (lines 539/1000 are `_note`
prose — leave). These 3 keys are the LOAD-BEARING subset: edit in SOURCE (paths.registry.json) → run
`scripts/paths/build.js` → verify survived in `.claude/paths.json` + `lib/paths.generated.js`.
POST-CUTOVER GATE: `rg "framework/templates" -g"*.js" -g"*.json" -g"*.md"` returns zero LIVE refs
repo-wide, EXCLUDING: `runtime/`, test-fixtures, `.claude/worktrees/`, archived sprint `prd.md`/
`changelog.md`, and any deliberate KNOWN_DANGLING reason-string. Not a 3-dir grep.

## 6. U2 SEAM CONTRACT — negative gate (DoE)
U2's provenance seeder MUST read source from `_warpos/templates/...`, NEVER `framework/templates/...`
(which U1 deletes). Binding seam gate: U2 verified_by asserts provenance-source = `_warpos/templates/...`
AND a NEGATIVE: `rg "framework/templates"` against the U2 seeder file returns zero.

## 7. GOLDEN-user e2e (quality-lead (c))
Golden user = a fresh consumer product running `/warp:setup`, expecting all 108 templates +
provenance-seeded `_requirements/`+`_docs/`. e2e proof = `node scripts/warpos/test-install-matrix.js
--scenarios 1,2 --json` — scenario 1 (fresh) AND scenario 2 (upgrade) must BOTH show `_warpos/templates`
+ `_warpos/BASELINE` present in final fixture state + U2's fresh-install smoke confirms provenance intact.
ship-coverage alone never exercises a real install — the matrix is the real golden-path e2e.

## Net design verdict
DoE: sequence APPROVED + R1/R2 seam guards + repo-wide forward-search + U2 seam gate. quality-lead:
all ACs verifiable, NO aspirational; NO-SHIP flip = single-string-only positive assertion. BASELINE
resolved inline; deferred-debt = no BASELINE regen enforcer. Ready for design→build β consult.
