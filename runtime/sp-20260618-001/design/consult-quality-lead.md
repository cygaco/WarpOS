# Quality-Lead consult — SP-20260618-001 (design boundary)
*(READ-ONLY advisory; spawned by α as the in-process relay-hand at ε's design-boundary request. Real Agent return, elapsed ~48.0s.)*

## (a) Per-AC verifiability

| AC (unit) | Gate / command | Verifiable |
|---|---|---|
| U1 `_warpos/templates` 9 dirs/108 files | `Get-ChildItem _warpos/templates -Directory` =9; recursive count =108 | Y |
| U1 `framework/templates` removed | `Test-Path framework/templates` = false | Y |
| U1 `_warpos/BASELINE` exists | `Test-Path _warpos/BASELINE` = true | Y (caveat: gen-boundary — DoE resolved: inline) |
| U1 allowlist narrowed ONLY for templates | `node -e` assert shipped-set CONTAINS `_warpos/templates/*` AND NOT `_warpos/MANIFEST.json`/`settings/defaults.json` | Y — needs BOTH directions asserted |
| U1 generator + 2 build.js seeded_from repointed AFTER files land | `generate-framework-manifest.js --check`; `build.js --dry-run --json`; ship-coverage dangling=0 | Y |
| U1 no required `framework/templates` literals | `rg -n "framework/templates" scripts framework .claude` = no live refs | Y (manual judgment on "required") |
| U1 both manifests + paths regenerated | `--check` on all 3 builders exit 0 | Y |
| U1 ship-coverage GREEN twice (pre+post delete) | `warpos-ship-coverage.js` exit 0 before AND after delete | Y |
| U1 POSITIVE shipped-set assertion | `node -e` on `framework-manifest.json.assets.template[].src` contains `_warpos/templates/` | Y — load-bearing, see (b) |
| U2 provenance generated → new source | Focused Node test asserts provenance source = `_warpos/templates/...` | Y |
| U2 fresh install seeds w/ provenance | `test-fresh-install-smoke.js` exit 0 | Y |
| U2 re-run idempotent | Same test runs seeder 2× asserts byte-stability + user-edit preserved | Y |
| U3 REQUIRED_DIRS parity green | `warpos-structure-parity.js --json` exit 0 | Y |
| U3 scenario 2 post-update parity | `test-install-matrix.js --scenarios 1,2 --json`; JSON shows templates+BASELINE present | Y |

No aspirational ACs. All map to a concrete command.

## (b) qa-plan — anti-value-inversion proof
**A green ship-coverage is NOT sufficient.** `ok` = (0 hard_gaps ∧ 0 info_gaps ∧ 0 boundary ∧ 0 dangling). If line-77's blanket `_warpos/` prefix is narrowed too aggressively OR templates never enter the shipped set, the gate stays GREEN with a silently-shrunken set — exactly the bug class. The BUILD-SPEC correctly layers the **positive `node -e` shipped-set assertion** on top, run **pre- AND post-delete**. That pairing IS sufficient, with two hardening requirements ε must enforce on the builder:
1. The positive assertion must check **count/membership of all 9 template subtrees land in the shipped set**, not just that the string `_warpos/templates/` appears once (one src entry passing ≠ 108 files shipping).
2. Assert the **negative** too: `_warpos/MANIFEST.json` + `settings/defaults.json` still NOT in the shipped set (proves the narrowing was surgical, not a blanket un-exclude).

## (c) GOLDEN-user scenario + e2e proof
**Golden user = a fresh consumer product running `/warp:setup`, expecting all 108 templates + provenance-seeded `_requirements/`+`_docs/`** — the cohort this epic exists to protect. Proof end-to-end: `node scripts/warpos/test-install-matrix.js --scenarios 1,2 --json` — scenario 1 (fresh) and scenario 2 (upgrade) fixtures must BOTH show `_warpos/templates` + `_warpos/BASELINE` present in final fixture state, plus U2's fresh-install smoke confirming provenance intact. The install-matrix is the real golden-path e2e; ship-coverage alone never exercises an actual install.

## (d) Flag
The `_warpos/BASELINE` generator-boundary was OPEN at consult time (DoE has since resolved it: inline). Residual: if BASELINE is hand-created in U1, there is no gate proving it stays REPRODUCIBLE — the existence check passes a one-time hand-built dir with no regen enforcer (latent drift). Recommend ε note this as a deferred-debt item if BASELINE has no regen path this sprint.

**Confidence: HIGH** on (a)/(b)/(c) (read the actual gate source); MEDIUM on (d) (β corrections not provided verbatim). **No-ship flip:** if the builder lands only the single-string positive assertion without the count/membership + negative checks in (b).
