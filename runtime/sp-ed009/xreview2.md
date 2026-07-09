# ED-009 Cross-Provider Re-Review 2

Binding verdict: PASS

Blockers: 0
Notes: 2

## Findings

No blockers found in the current code. The prior blocker fixes are real rather than cosmetic, and I do not see a bootstrap behavior regression in the refactored mode detector.

## Re-verification

### BLOCKER-1a - bootstrap role detector

PASS. `scripts/warpos/manifest/bootstrap.js` now imports `isCanonicalDir` from `../repo-role` at line 41. `detectMode()` no longer defines or uses `hasWarposManifest`; the canonical branch is now `if (isCanonicalDir(root) && hasFramework)` at line 119. A repo-wide targeted search found no `hasWarposManifest`.

The `framework/` distinction is preserved. `detectMode()` still returns canonical only when the shared canonical signal and `framework/` are both present, then returns `product-bootstrapped` for `_warpos/` without `framework/` at lines 127-130. A direct fixture probe returned:

```json
{
  "canon": { "mode": "canonical" },
  "migrated": { "mode": "product-bootstrapped" },
  "product": { "mode": "product" }
}
```

The `scripts/warpos/manifest/` allowlist is now honest as a content-reader carve-out. The remaining `_warpos/MANIFEST.json` matches in that directory are build/validate/walk-skip/test content handling. The only `existsSync(... _warpos/MANIFEST.json ...)` matches there are in tests asserting generated files exist, not live role derivation.

### BLOCKER-1b - enforcer disposition and regex hardening

PASS. `.claude/commands/scan/full.md:110` wires `repo-role-single-source.js` as `REPORT-ONLY` and explicitly states the ramp-to-blocking precondition: the grep is line-local and misses split-var/multi-line plus variable-indirection shapes. The follow-up paragraph at line 117 repeats that the ED-009 enforcer is report-only until that limitation is closed. That is the honest disposition; I do not see a false-green blocking risk while it remains non-blocking and documented.

The optional-chaining hardening is present. `scripts/checks/repo-role-single-source.js` uses the `(?:\?\.|[.\[])` accessor group for both `warpos.source` and `project.slug` patterns. `scripts/warpos/test-repo-role.js:506-520` includes the FIX3 planted tests for `manifest.warpos?.source === "self"` and `m.project?.slug === "warpos"`, with the split-var/variable-indirection limitation acknowledged in the same section.

Verification:

```text
node scripts/warpos/test-repo-role.js
Tests: 82  PASS: 82  FAIL: 0

node scripts/checks/repo-role-single-source.js --json
ok: true, violationCount: 0
```

### NOTE-4 - admin preview doc

PASS. `.claude/commands/admin/preview.md:19-25` now describes the `isCanonicalDir` signal set and explicitly says a consumer `warpos:` install-record block with `source != "self"` is not a canonical signal. That agrees with AC-R1c in `.claude/project/sprint/requirements/SP-20260614-002/acceptance-criteria.md:16`. I found no remaining bare-`warpos:`-presence rule in this doc.

### Prior PASS spot-checks

Still pass.

- Env-immunity: `WARPOS_REPO_ROLE=consumer` leaves `isCanonicalDir(process.cwd()) === true` while `resolveRepoRole({ root: process.cwd() })` returns `consumer` from `env:WARPOS_REPO_ROLE`.
- Admin safety floor: `scripts/admin/preview.js` and `scripts/admin/seed.js` both import and call `isCanonicalDir`; neither re-derives canonical signals inline.
- Real WarpOS refusal and consumer non-refusal: `node tests/regression/SP-20260614-002/preview-failclear.test.js` passed `9/9`, including path refusal of the real canonical root, non-refusal for consumer `warpos.source != "self"`, and refusal for `warpos.source === "self"` / `project.slug === "warpos"`.
- Seed safety floor: `node tests/regression/SP-20260614-002/seed-idempotent.test.js` passed `2/2`, including seed-target WarpOS root refusal.

## Notes

1. I could not complete `node scripts/warpos/manifest/test-bootstrap.js` in this sandbox. Its inner `spawnSync(process.execPath, ...)` calls fail with `EPERM` on `C:\Program Files\nodejs\node.exe`, so the harness crashes before its normal summary. Direct shell-launched `node scripts/warpos/manifest/bootstrap.js --help` works, and direct `detectMode()` fixture probes confirm the canonical/product/product-bootstrapped behavior. Also, the current test file contains 48 `ok()` assertions, so the requested `47 pass / 0 fail` count appears stale against this checkout.
2. The ED-009 enforcer remains line-local. Because `/scan:full` now marks it report-only and documents the limitation, this is no longer a blocker; it should not be flipped blocking until an AST-grade scanner or explicit accepted-limitation sign-off lands.

VERDICT=PASS BLOCKERS=0 NOTES=2
