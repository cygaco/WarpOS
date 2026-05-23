<!-- requirement-format-legacy -->
# PRD — Install fixture CI matrix — 5-scenario regression test suite for /warp:setup + /warp:update

**Sprint:** `SP-20260524-001`
**Plan Contract:** `PC-20260523-0034`
**Status:** ready_for_execution
**Documentation scale:** `m`

## Outcome

Future install-reliability work — per-file status reporting (added/repaired/unchanged/conflict), versioned migrations with userModified tracking, release-build.js refusing stale manifests, .claude/manifest.json always-present + 4 hardcoded-caller cleanup — can land with confidence because the matrix catches regressions in <60 seconds. Maintainer stops having to mentally simulate 5 install scenarios for every framework-side change. Downstream products updating via capsule trust the install pipeline more.

## Context

### Original Request

> `/sprint:full it` — execute the install fixture CI matrix sprint planned in PC-20260523-0034.

Sprint scope was picked from a menu of 6 install-reliability follow-ups; operator selected option A (CI matrix) as the highest-leverage choice because it protects every install-reliability item — both shipped and pending — from regression.

### Interpreted Intent

Author `scripts/warpos/test-install-matrix.js` — a fixture-based runner that spins up 5 ephemeral fixture projects (under `.warpos/test-fixtures/install-matrix/`, gitignored), runs the appropriate `/warp:setup` or `/warp:update` flow per scenario, asserts the expected post-state (files present/matching defaults, transaction snapshot exists, settings.json `--check` clean, manifest honest, operator overrides preserved, etc.), cleans up after each scenario, and emits a structured pass/fail report. Wired into the existing canonical test invocation surface (npm script + optional `/check:all` entry). Each scenario is independent and parallelizable.

### Current Behavior

`scripts/warpos/` has 3 narrow tests of the install pipeline:
- `test-cross-version-replay.js` (cross-version capsule replay)
- `test-transaction-smoke.js` (transaction begin/commit/rollback shape)
- `test-rollback-cli-smoke.js` (`--rollback` CLI)

No end-to-end fixture matrix that exercises `/warp:setup` + `/warp:update` against representative real-world install scenarios. Regressions in install/update flow currently only surface when an operator runs the real install against a real product — too late.

### Desired Behavior

Running `node scripts/warpos/test-install-matrix.js` (or via `npm run test:install-matrix`) spins up 5 ephemeral fixture projects, runs the appropriate install/update path per scenario, asserts the expected post-state, cleans up, and reports pass/fail with structured per-scenario output. `--json` mode for CI consumption. Exit 0 on full pass, non-zero with per-scenario failure detail otherwise. Total runtime target <60s for the full matrix; parallelize per-scenario when safe.

## Requirements

> Use existing requirement ID conventions enforced by `scripts/hooks/requirement-format-guard.js`. PRDs in `_requirements/` use `R-N` ids — sprint-scope PRDs that link to a feature in `_requirements/04-features/<feature>/PRD.md` should reuse those ids, not invent new ones.

- `R-1` — Test runner scaffold at `scripts/warpos/test-install-matrix.js` with fixture lifecycle primitives (create/run/assert/cleanup) usable by all scenarios.
- `R-2` — Scenario 1 (clean install): empty fixture project → `/warp:setup` → assert all framework files present, manifest honest, settings.json `--check` clean.
- `R-3` — Scenario 2 (existing-install upgrade): fixture seeded with prior-version install → `/warp:update --to <newer>` → assert post-state matches new version.
- `R-4` — Scenario 3 (dirty-uncommitted preservation): fixture seeded with install + operator edit to a framework file → `/warp:update` → assert operator edit preserved (or properly conflicted with surface-area report).
- `R-5` — Scenario 4 (multi-version upgrade): fixture seeded with install at version N → `/warp:update --to N+k` → assert all intermediate migrations ran in order and final state matches target.
- `R-6` — Scenario 5 (user-overrides preservation): fixture seeded with install + operator `settings.local.json` + permissions overrides → `/warp:update` → assert overrides survive via the layered compile.
- `R-7` — Test capsule helper or capsule selection logic for Scenario 4. Either synthesize minimal capsules on the fly OR document/select existing `framework/releases/<X.Y.Z>/` capsules.
- `R-8` — `--json` report mode emitting structured per-scenario result (status, duration, assertions checked, failure detail) for CI consumption.
- `R-9` — CI wire-in: `npm run test:install-matrix` npm script + optional `/check:all` entry + `paths.testInstallMatrix` registry key.
- `R-10` — Meta-tests: plant 2+ intentional regressions (e.g., deleted hook from defaults, missing settings.local merge) into fixtures and confirm the matrix detects each one with non-zero exit + scenario-specific failure detail.

## Non-Goals

- Do NOT modify `scripts/warpos/update.js`, `transaction.js`, `snapshot-installed.js`, `settings/compile.js`, `manifest/build.js`, `manifest/validate.js` — these are the SUT, not the test.
- Do NOT add new install flows or new behavior to the install pipeline — test-only sprint.
- Do NOT test downstream-product-specific scenarios — downstream products are responsible for their own install testing.
- Do NOT touch portfolio products (Dreamteam, aiweb, etc.) — operator constraint.
- Do NOT build full property-based fuzz mode (that's the expanded variant; defer to future sprint).

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| `scripts/warpos/test-install-matrix.js` (new — fixture-matrix runner) | assumed_from_request |
| `scripts/warpos/test-fixtures/install-matrix/` (new — scenario definitions + assertions) | assumed_from_request |
| `.warpos/test-fixtures/install-matrix/` (new — ephemeral fixture roots, gitignored) | inferred_from_repo |
| `scripts/warpos/update.js` (read — SUT) | verified_from_repo |
| `scripts/warpos/transaction.js` (read — exercised for snapshot/rollback assertions) | verified_from_repo |
| `scripts/warp-setup.js` (read — clean-install scenario) | inferred_from_repo |
| `scripts/warpos/settings/compile.js` (read — settings.json `--check` assertion) | verified_from_repo |
| `scripts/warpos/manifest/validate.js` (read — manifest honesty assertion) | verified_from_repo |
| `framework/releases/<X.Y.Z>/release.json` (read — Scenario 4 capsule source) | verified_from_repo |
| `package.json` (modify — npm script wire-in) | assumed_from_request |
| `.claude/paths.json` (modify — `paths.testInstallMatrix` key, optional) | assumed_from_request |
| `ROADMAP.md` (update on ship — mark scenario A done) | verified_from_repo |

## External Service Dependencies

See `.claude/project/sprint/external-services/` for ESD records. None required.

## Approval Boundaries

See Plan Contract `approval_boundaries`. None.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260523-0034.yaml`
- High-level stories: `high-level-stories.md`
- Granular stories: `granular-stories.md`
- COPY: `copy.md`
- INPUTS: `inputs.md`
- TRACE: `trace.md`
- Acceptance criteria: `acceptance-criteria.md`
- QA plan: `qa-plan.md`
- Redteam plan: `redteam-plan.md`
- Release plan: `release-plan.md`
