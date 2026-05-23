# QA Plan — Install fixture CI matrix

**Sprint:** `SP-20260524-001`
**PRD:** `prd.md`

> Sprint v0.1 QA plan. The matrix IS the QA layer for the install pipeline; this plan QAs the matrix itself.

## Smoke checks

- [ ] `node scripts/warpos/test-install-matrix.js --help` exits 0 with usage including 5 scenarios.
- [ ] `node scripts/warpos/test-install-matrix.js --scenarios 1` runs only scenario 1 (clean install) end-to-end on a fresh fixture and exits 0.
- [ ] `node scripts/warpos/test-install-matrix.js` (no args) runs all 5 scenarios within 90s on a typical dev machine.
- [ ] `npm run test:install-matrix` is reachable from `package.json` and runs the matrix.

## Per-story QA

### S-1 (runner scaffold)
- [ ] AC-1.1 verified — `--help` prints usage with all 5 scenarios
- [ ] AC-1.2 verified — fixtures cleaned up on pass; preserved under `_failed/` on fail (unless `--keep-failed`)
- [ ] Regression: rerun matrix immediately after a passing run; second run does not interfere with the first's state (.warpos/ truly ephemeral)

### S-2 (Scenario 1 clean install)
- [ ] AC-2.1 verified — clean fixture → setup → manifest+settings clean
- [ ] Regression: matrix detects a missing-file regression (delete a hook from defaults, confirm fail)

### S-3 (Scenario 2 existing-install upgrade)
- [ ] AC-3.1 verified — seeded fixture → update --to <newer> → version + transaction outcome
- [ ] Regression: corrupt the snapshot mid-flight (simulate apply failure) → confirm auto-rollback fires + matrix asserts rollback

### S-4 (Scenario 3 dirty-uncommitted)
- [ ] AC-4.1 verified — operator edit preserved OR conflict surfaced
- [ ] Regression: confirm matrix fails when an apply silently overwrites operator edit (planted bug in update.js fork)

### S-5 (Scenario 4 multi-version)
- [ ] AC-5.1 verified — N → N+2 with intermediate migrations
- [ ] AC-5.2 verified — INSUFFICIENT_CAPSULES path
- [ ] Regression: migration order swap planted → matrix detects

### S-6 (Scenario 5 user-overrides)
- [ ] AC-6.1 verified — settings.local.json overrides survive update
- [ ] Regression: matrix detects a defaults change that doesn't union with local overrides

### S-7 (capsule helper)
- [ ] AC-7.1 verified — `synthesizeCapsule()` works in isolation
- [ ] AC-7.2 verified — helper bypassed when real capsules present

### S-8 (JSON report)
- [ ] AC-8.1 verified — JSON shape correct, exit 0 on pass
- [ ] AC-8.2 verified — JSON shape on failure, exit non-zero

### S-9 (CI wire-in)
- [ ] AC-9.1 verified — `npm run test:install-matrix` works
- [ ] AC-9.2 verified — `paths.testInstallMatrix` resolves
- [ ] Regression: rename the matrix file; npm script + paths key still resolve to the canonical location (or fail loudly)

### S-10 (meta-tests)
- [ ] AC-10.1 verified — 2+ planted regressions detected by matrix
- [ ] AC-10.2 verified — `--inject-regression` never touches files outside fixture

## Cross-cutting QA

- [ ] Lint passes (`npm run lint` or equivalent).
- [ ] Typecheck passes (if applicable).
- [ ] No new console errors during a full matrix run.
- [ ] TRACE events `install_matrix_start`, `install_matrix_scenario_completed`, `install_matrix_done`, `install_matrix_meta_caught` fire as documented.
- [ ] COPY matches `copy.md`.
- [ ] INPUTS handle validation per `inputs.md`.

## External service QA

- [ ] N/A — no external services.

## Documentation scaling

This is the `documentation_scale: m` cut. ACs are inlined here for QA convenience.
