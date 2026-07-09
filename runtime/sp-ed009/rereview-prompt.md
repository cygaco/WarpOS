# Cross-provider RE-REVIEW — ED-009 adoption, fix-cycle for the 1 blocker (session/2026-06-15)

You previously reviewed this change and returned `VERDICT=FAIL BLOCKERS=1 NOTES=4`. Your full prior findings are at `runtime/sp-ed009/xreview.md`. The fixes are applied. RE-VERIFY each against the CURRENT code and give a fresh BINDING verdict. Be skeptical — confirm fixes are real, not cosmetic, and that the bootstrap refactor did not introduce a behavior regression.

scopeContract: { "mode": "read-only", "allowedFiles": [], "forbiddenFiles": ["**/*"], "note": "read-only reviewer — write findings ONLY to runtime/sp-ed009/xreview2.md" }

## BLOCKER-1a (was: dir-allowlist masks a LIVE inline role detector in bootstrap.js)
Confirm `scripts/warpos/manifest/bootstrap.js#detectMode()` no longer re-derives canonical role inline:
- It now imports `isCanonicalDir` from `../repo-role` and the canonical branch is `if (isCanonicalDir(root) && hasFramework)` — the inline `fs.existsSync(_warpos/MANIFEST.json)` role check is GONE; `hasWarposManifest` was removed.
- The `framework/` distinction is preserved (so an already-migrated product that kept `_warpos/` but shed `framework/` is still `product-bootstrapped`, NOT canonical).
- VERIFY behavior preserved: `node scripts/warpos/manifest/test-bootstrap.js` → 47 pass / 0 fail, including the `detectMode canonical` and `detectMode product` cases.
- The `scripts/warpos/manifest/` dir allowlist (`scripts/checks/repo-role-single-source.js:43-51`) is now documented as a CONTENT-reader carve-out (build/validate/walk-skip), no longer masking a role detector. Is that honest now, or does any OTHER file in that dir still derive role inline?

## BLOCKER-1b (was: regex line-local + literal-shape; blocking flip gives false assurance)
Two changes:
- The enforcer is now wired **REPORT-ONLY** in `.claude/commands/scan/full.md` (NOT blocking), with the line-local limitation documented as the ramp-to-blocking precondition. Confirm it is report-only and the claim is no longer overclaiming "ALL role derivation".
- The `warpos_source_self` + `project_slug_warpos` regexes now use a `(?:\?\.|[.\[])` accessor group to also catch optional chaining (`warpos?.source`, `project?.slug`). Planted tests added in `scripts/warpos/test-repo-role.js` (FIX3 section). Confirm. The split-var/multi-line + variable-indirection misses are ACKNOWLEDGED as a known line-local limitation gating the blocking flip — is report-only the honest disposition given that, or do you still see a false-green RISK in the report-only state?

## NOTE-4 (was: stale doc re-teaches bare-presence)
Confirm `.claude/commands/admin/preview.md:19-23` now describes the `isCanonicalDir` signal set (no bare-`warpos:`-presence rule) and agrees with AC-R1c.

## Re-confirm the prior PASS items still hold
Notes 1-3 (env-immunity, safety-floor change justified + real WarpOS still refused, honest regression test) — spot-check they did not regress under the fix-cycle.

## Output
Write findings to `runtime/sp-ed009/xreview2.md`. End stdout with ONE line exactly:
`VERDICT=<PASS|FAIL> BLOCKERS=<n> NOTES=<n>`
