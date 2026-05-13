# QA Plan — Harden /warp:update — preflight + transactional apply + postflight verify

**Sprint:** `SP-20260513-005`
**PRD:** `prd.md`

> Honored by `/sprint:execute` (mid-sprint checks) and `/sprint:release`
> (final QA gate). Diff-model review on QA is declared in
> `paths.sprintRouting`.

## Smoke checks

- [ ] `node scripts/warpos/update.js --to 0.5.0 --dry-run` runs against
      the canonical repo (self-update) without crash; preflight prints
      summary with 10 gates listed.
- [ ] `node scripts/warpos/test-cross-version-replay.js` exits 0.
- [ ] `npm test` (or equivalent project test runner) passes.
- [ ] `node scripts/paths/gate.js` — paths registry clean (no new
      registry violations from NEW skills).

## Per-failure-mode fixture tests

Each mined failure signature (F-1..F-8 from `failure-mining.md`) gets a
fixture that REPRODUCES the failure and asserts the right preflight gate
catches it.

Fixtures live under `runtime/qa-warp-update/fixtures/`:

### F-1 capsule missing fixture
- [ ] **Fixture:** synthetic install with `--to 0.99.0` requested (capsule
  doesn't exist anywhere).
- [ ] **Assertion:** preflight `capsule-resolvable` red; COPY C-2
  printed; no file in targetRoot touched; exit 1.

### F-3 version-quorum fixture
- [ ] **Fixture:** synthetic install with `framework-manifest.json#version=0.2.2`
  and `framework-installed.json#installedVersion=0.5.0`.
- [ ] **Assertion:** preflight `version-quorum` red; per-source value table
  in COPY C-3; exit 1.

### F-4 install-baseline fixture
- [ ] **Fixture:** synthetic project with `.claude/framework-installed.json`
  removed.
- [ ] **Assertion:** preflight `install-baseline` red; COPY C-1 printed
  with install.ps1 hint; exit 1.
- [ ] **Override:** same fixture + `--force-fresh` → preflight passes;
  treated as fresh install (massive ADD_SAFE plan).

### F-5 migration-presence fixture
- [ ] **Fixture:** synthetic capsule with `release.json#migrations:
  ["migrations/X/01.js"]` but file absent.
- [ ] **Assertion:** preflight `migration-presence` red; COPY C-4 printed;
  exit 1.

### F-6 path-resolution fixture (pre + post)
- [ ] **Fixture:** synthetic install with a `paths.json` key pointing at a
  non-existent file.
- [ ] **Assertion (pre):** preflight `path-resolution` red; exit 1; no
  transaction.
- [ ] **Assertion (post):** if preflight passes but apply introduces a
  broken `paths.json` key, postflight `path-resolution` red; evidence
  package shows the failing key; exit 0 by default, exit 1 with
  `--strict-postflight`.

### F-7 structure-parity fixture
- [ ] **Fixture:** synthetic install missing `framework/releases/` dir.
- [ ] **Assertion:** preflight `structure-parity` red; remediation
  suggests `mkdir -p` or running `install.ps1`; exit 1.

### F-8 tracked-transients fixture
- [ ] **Fixture:** synthetic capsule whose framework-manifest claims a
  `.warpos/builder-fixture-X/transaction.json` asset.
- [ ] **Assertion:** preflight `tracked-transients` red; lists offending
  patterns; exit 1.

## Rollback acceptance test

- [ ] **Fixture:** synthetic install with capsule that contains a
  deliberately broken migration (`migrations/X/03-throw.js` that throws).
- [ ] **Setup:** preflight green; transaction.begin() succeeds; apply
  proceeds.
- [ ] **Trigger:** migration step throws.
- [ ] **Assertion:** every file recorded in `snapshot.json` is restored
  byte-identical to pre-state; every ADD_SAFE file written before the
  throw is `unlink`ed; `result.json#outcome=rolled-back`; TR-3 event
  emitted with `restoredCount > 0`; exit code 1.
- [ ] **Post-assertion:** `git status` shows no diff in tracked files
  (rollback was perfect at the FS level).

## Cross-version replay (AC-S-9.1, AC-S-9.2)

- [ ] **Fixture path:** `runtime/qa-warp-update/clean-0.1.2/` matching
  `framework/releases/0.1.2/framework-manifest.json` exactly.
- [ ] **Test:** `node scripts/warpos/test-cross-version-replay.js` runs
  `update.js --to 0.5.0 --apply` against the clean fixture.
- [ ] **Assertions:** preflight green; commit ok; postflight ok; exit 0.
- [ ] **Negative:** same fixture + version drift → preflight blocks.

## Dry-run-by-default acceptance

- [ ] `update.js --to <v>` (no `--apply`) produces NO writes anywhere in
      targetRoot — verified by snapshotting `git status` + `runtime/qa-*/`
      before and after.
- [ ] `update.js --to <v> --dry-run` produces NO writes (same assertion).

## Per-story QA

### S-1 (failure-mode mining)
- [ ] AC-S-1.1 verified — `failure-mining.md` exists, ≥8 signatures, ≥1
      citation each, coverage map present.

### S-2 (preflight composer)
- [ ] AC-S-2.1, AC-S-2.2, AC-S-2.3 verified.
- [ ] **Regression:** existing dry-run output (12-category breakdown) is
      still produced AFTER preflight, not replaced.

### S-3 (capsule-resolvable)
- [ ] AC-S-3.1, AC-S-3.2, AC-S-3.3 verified.

### S-4 (version-quorum, install-baseline, migration-presence)
- [ ] AC-S-4.1, AC-S-4.2, AC-S-4.3 verified.

### S-5 (transaction begin)
- [ ] AC-S-5.1, AC-S-5.2 verified.
- [ ] **Regression:** existing transaction stub artifacts (`header.json`,
      `plan.json`, `capsule.json`, `ROLLBACK.md`) still produced.

### S-6 (commit-or-rollback)
- [ ] AC-S-6.1, AC-S-6.2, AC-S-6.3 verified.
- [ ] **Regression:** successful apply produces `result.json` with
      `outcome=committed` (unchanged path).

### S-7 (postflight composer)
- [ ] AC-S-7.1, AC-S-7.2, AC-S-7.3 verified.
- [ ] **Regression:** existing `release.json#postUpdateChecks` still run
      AFTER the composed checks (postflight does not REPLACE them).

### S-8 (provider-smoke integration)
- [ ] AC-S-8.1, AC-S-8.2 verified.
- [ ] **Coordination:** if SP-002 has shipped by SP-005 release, run
      AC-S-8.2 against actual `provider-smoke`. Otherwise AC-S-8.1
      degraded path is the only verifiable case.

### S-9 (cross-version replay)
- [ ] AC-S-9.1, AC-S-9.2 verified.

### S-10 (docs)
- [ ] AC-S-10.1, AC-S-10.2 verified by manual read.
- [ ] **Regression:** the existing "Failure modes" section is preserved
      and EXPANDED (not replaced).

### S-11 (events)
- [ ] AC-S-11.1, AC-S-11.2 verified.
- [ ] **Regression:** existing `events.jsonl` schema/shape unchanged.

## Cross-cutting QA

- [ ] Lint passes (`npm run lint` or project equivalent).
- [ ] Typecheck passes (`npm run typecheck` if present).
- [ ] Unit tests pass.
- [ ] No new console errors in golden path.
- [ ] TRACE events fire as documented (AC-S-11).
- [ ] COPY matches `copy.md` (manual diff of stderr output against C-1..C-10).
- [ ] INPUTS handle validation per `inputs.md` (schemas asserted by the
      gates themselves).
- [ ] `node scripts/warpos/release-gates.js` passes (existing release
      gates still pass — SP-005 does not regress them).
- [ ] `/check:warpos-manifest-honesty` passes after MVP ships (no drift
      introduced by NEW files).

## External service QA

- [ ] N/A. Plan Contract `external_service_dependencies.status: none_expected`.
- [ ] No `secret: true` env-var values appear in any tracked file (verified
      by `/check:privacy`).

## Documentation scaling

This plan is the `documentation_scale: l` cut. Per-failure-mode fixture
tests are required at scale l. At scale m, a single composite fixture
covering the three highest-frequency signatures (F-1, F-3, F-4) is the
minimum.

## QA exit gate

QA is GREEN iff:
1. All AC-S-*.* checked.
2. All per-failure-mode fixtures pass.
3. Rollback acceptance passes.
4. Cross-version replay passes.
5. Cross-cutting QA passes.
6. No new lint/typecheck regressions.

QA is YELLOW (`/sprint:release` may proceed with explicit operator
acceptance) iff:
- All AC pass, but provider-smoke integration is only verifiable via the
  degraded path (SP-002 not yet shipped). This is the EXPECTED state if
  SP-005 ships before SP-002.

QA is RED iff any AC fails or any fixture test fails.
