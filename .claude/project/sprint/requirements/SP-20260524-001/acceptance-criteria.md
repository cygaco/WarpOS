<!-- requirement-format-legacy -->
# Acceptance Criteria — Install fixture CI matrix

**Sprint:** `SP-20260524-001`
**PRD:** `prd.md`

> `goal_verification` block was not declared in PC-20260523-0034, so the strict `verified_by:` gate is OFF for this sprint. Each AC still names the test that proves it; convention is `scripts/warpos/test-install-matrix.js` self-assertions exercised via the runner CLI.

## S-1 — Test runner scaffold

- AC-1.1: Given no fixture root exists, when `node scripts/warpos/test-install-matrix.js --help` runs, then it prints usage with the 5 scenario names and exits 0.
  verified_by: scripts/warpos/test-install-matrix.js::self-test --help
- AC-1.2: Given a clean working tree, when the runner spawns a fixture, runs a scenario, asserts, and cleans up, then the fixture directory under `.warpos/test-fixtures/install-matrix/` is removed at process exit (or moved aside under `.warpos/test-fixtures/install-matrix/_failed/<scenario>-<ts>/` on failure for inspection).
  verified_by: scripts/warpos/test-install-matrix.js::scenario_lifecycle_cleanup

## S-2 — Scenario 1 (clean install)

- AC-2.1: Given an empty fixture project (no `.claude/`, no `_warpos/`), when scenario 1 invokes `scripts/warp-setup.js` against the fixture root, then all framework files declared in `_warpos/MANIFEST.json` are present in the fixture, `node scripts/warpos/manifest/validate.js --root <fixture>` exits 0, and `node scripts/warpos/settings/compile.js --root <fixture> --check` exits 0.
  verified_by: scripts/warpos/test-install-matrix.js::scenario_1_clean_install

## S-3 — Scenario 2 (existing-install upgrade)

- AC-3.1: Given a fixture seeded with WarpOS version N-1 install, when scenario 2 invokes `scripts/warpos/update.js --to <N> --apply` against the fixture root, then the post-state matches `framework/releases/<N>/release.json` decisions (Class A/B applied, no Class C), `framework-installed.json#installedVersion` equals N, and a transaction directory `<fixture>/.warpos/transactions/<txId>/` exists with `result.json#outcome:"committed"`.
  verified_by: scripts/warpos/test-install-matrix.js::scenario_2_existing_install_upgrade

## S-4 — Scenario 3 (dirty-uncommitted preservation)

- AC-4.1: Given a fixture with version-N install + a known framework file (e.g., a hook script) modified by the operator (uncommitted), when scenario 3 invokes `scripts/warpos/update.js --to <N+1> --apply`, then either (a) the operator's modification is preserved unchanged AND the change is surfaced in the apply report as `preserved_user_modified`, OR (b) the apply refuses with a clear `user_modified_conflict` error naming the file and requiring an operator decision. The matrix asserts that the apply does NOT silently overwrite operator changes.
  verified_by: scripts/warpos/test-install-matrix.js::scenario_3_dirty_uncommitted

## S-5 — Scenario 4 (multi-version upgrade) + capsule helper

- AC-5.1: Given a fixture seeded with version N install and at least 2 capsules at versions N+1 and N+2 available (real from `framework/releases/` OR synthesized via helper), when scenario 4 invokes `scripts/warpos/update.js --to <N+2> --apply`, then the apply succeeds and any migrations declared in the intermediate capsules' `release.json#migrations[]` are executed in version order (no skipped migrations).
  verified_by: scripts/warpos/test-install-matrix.js::scenario_4_multi_version_upgrade
- AC-5.2: Given the test needs ≥2 versions on top of baseline, when scenario 4 fails to find enough real capsules, then either (a) it synthesizes minimal test capsules via helper OR (b) it skips with a clear `INSUFFICIENT_CAPSULES` message and exits the scenario non-zero (matrix-level fail with explanatory detail).
  verified_by: scripts/warpos/test-install-matrix.js::scenario_4_capsule_resolution

## S-6 — Scenario 5 (user-overrides preservation)

- AC-6.1: Given a fixture with version-N install + a `settings.local.json` containing operator permissions overrides (e.g., extra `permissions.allow` entries) + an updated `_warpos/settings/defaults.json` in version N+1, when scenario 5 invokes `scripts/warpos/update.js --to <N+1> --apply`, then post-update `node scripts/warpos/settings/compile.js --root <fixture> --check` exits 0 AND the compiled `.claude/settings.json` includes both the new defaults' permissions AND the operator's settings.local overrides (union).
  verified_by: scripts/warpos/test-install-matrix.js::scenario_5_user_overrides

## S-7 — Test capsule helper

- AC-7.1: When invoked as a module function `synthesizeCapsule({version, baseRoot, migrations})`, the helper produces `<baseRoot>/framework/releases/<version>/release.json` + minimal manifest + at least one declared file delta sufficient for `update.js` to apply it.
  verified_by: scripts/warpos/test-install-matrix.js::capsule_helper_synth
- AC-7.2: Capsule helper is only invoked when scenario 4 detects insufficient real capsules; if `framework/releases/` has ≥2 capsules newer than baseline, the helper is bypassed and real capsules are chained.
  verified_by: scripts/warpos/test-install-matrix.js::capsule_helper_bypass

## S-8 — JSON report mode

- AC-8.1: Given `--json` flag, when the matrix completes, then stdout contains a single JSON document with shape `{ ok: bool, scenarios: [{ id, name, status: pass|fail, durationMs, assertions: [{ name, status, detail? }] }], totals: { pass, fail, durationMs } }` and the process exits 0 only when every scenario passed.
  verified_by: scripts/warpos/test-install-matrix.js::json_report_shape
- AC-8.2: Given `--json` and a planted regression in any scenario, when the matrix runs, then JSON output's `ok` is `false`, the failing scenario's `status` is `fail`, the offending assertion's `detail` names the cause (e.g., file missing, hash mismatch, --check stale), and exit code is non-zero.
  verified_by: scripts/warpos/test-install-matrix.js::json_report_regression_detail

## S-9 — CI wire-in

- AC-9.1: `package.json` declares `"test:install-matrix": "node scripts/warpos/test-install-matrix.js"`, and `npm run test:install-matrix` exits 0 against a clean working tree with all real capsules.
  verified_by: package.json scripts entry + npm-run smoke
- AC-9.2: `.claude/paths.json` declares `paths.testInstallMatrix` pointing at `scripts/warpos/test-install-matrix.js`; `node scripts/paths-doctor.js` (or equivalent) reports no path-key drift.
  verified_by: paths-doctor smoke

## S-10 — Meta-tests

- AC-10.1: Given a "regression injection" mode (e.g., `--inject-regression <name>`), when invoked, the matrix mutates a known fixture file (deletes a hook from defaults, removes a manifest entry, etc.) and confirms the relevant scenario fails with the expected assertion failure code. At least 2 distinct injections are supported.
  verified_by: scripts/warpos/test-install-matrix.js::meta_test_detects_planted_regression
- AC-10.2: All meta-tests are isolated — invoking `--inject-regression` MUST NOT mutate any file outside the ephemeral fixture.
  verified_by: scripts/warpos/test-install-matrix.js::meta_test_isolation
