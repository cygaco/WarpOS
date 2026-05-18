# QA Plan — Sprint Goal Verification

**Sprint:** `SP-20260518-007`
**PRD:** `prd.md`

> Sprint A is the sprint that defines the AC-linked cited-test executor. Its own QA plan dogfoods that convention: every AC in `acceptance-criteria.md` is `verified_by:` a fixture under `tests/regression/SP-20260518-007/`, and those fixtures are the executable QA.

## Smoke checks

- [ ] `node scripts/sprint/validate.js .claude/project/sprint/plan-contracts/PC-20260518-0011.yaml` returns 0 after schema additive merges.
- [ ] `node scripts/sprint/validate.js .claude/project/sprint/sprints/SP-20260518-007/current.yaml` returns 0 after current-sprint propagation.
- [ ] `node scripts/sprint/validate.js schemas/sprint/regression-fixture.schema.json` registers `$id: warpos/sprint/regression-fixture/v1` (schema load).
- [ ] `node scripts/linters/run.js --list` shows the new sprint-test entry.
- [ ] `node scripts/sprint/check-ac-coverage.js --sprint SP-20260518-007` returns 0 (the sprint dogfoods its own convention; every AC must be linked).

## Per-story QA — every AC dogfoods `verified_by:`

### S-1.1
- [ ] AC-1.1.1 verified by `tests/regression/SP-20260518-007/plan-contract-omit-goal-verification.test.js`
- [ ] AC-1.1.2 verified by `tests/regression/SP-20260518-007/plan-contract-empty-justification.test.js`

### S-1.2
- [ ] AC-1.2.1 verified by `tests/regression/SP-20260518-007/regression-fixture-schema-loads.test.js`
- [ ] AC-1.2.2 verified by `tests/regression/SP-20260518-007/regression-fixture-valid-and-invalid.test.js`

### S-1.3
- [ ] AC-1.3.1 verified by `tests/regression/SP-20260518-007/paths-sprintregressioncorpus.test.js`
- [ ] AC-1.3.2 verified by `tests/regression/SP-20260518-007/paths-sprintregressioncorpus.test.js` (second case)

### S-2.1
- [ ] AC-2.1.1 verified by `tests/regression/SP-20260518-007/ac-template-documents-verified-by.test.js`
- [ ] AC-2.1.2 verified by `tests/regression/SP-20260518-007/ac-coverage-parses-three-states.test.js`

### S-2.2
- [ ] AC-2.2.1 verified by `tests/regression/SP-20260518-007/design-gate-backcompat.test.js`
- [ ] AC-2.2.2 verified by `tests/regression/SP-20260518-007/design-gate-refuses-missing-linkage.test.js`
- [ ] AC-2.2.3 verified by `tests/regression/SP-20260518-007/design-gate-allows-not-applicable.test.js`

### S-2.3
- [ ] AC-2.3.1 verified by `tests/regression/SP-20260518-007/release-gate-all-passing.test.js`
- [ ] AC-2.3.2 verified by `tests/regression/SP-20260518-007/release-gate-fail-closed.test.js`
- [ ] AC-2.3.3 verified by `tests/regression/SP-20260518-007/release-gate-inconclusive.test.js`
- [ ] AC-2.3.4 verified by `tests/regression/SP-20260518-007/release-gate-override.test.js`
- [ ] AC-2.3.5 verified by `tests/regression/SP-20260518-007/release-gate-enoent-is-fail.test.js` (Beta-flagged 2026-05-18)

### S-3.1
- [ ] AC-3.1.1 verified by `tests/regression/SP-20260518-007/check-ac-coverage-prose.test.js`
- [ ] AC-3.1.2 verified by `tests/regression/SP-20260518-007/check-ac-coverage-json.test.js`
- [ ] AC-3.1.3 verified by `tests/regression/SP-20260518-007/check-ac-coverage-skill-body.test.js`

### S-4.1
- [ ] AC-4.1.1 verified by `tests/regression/SP-20260518-007/linters-discovers-sprint-test.test.js`
- [ ] AC-4.1.2 verified by `tests/regression/SP-20260518-007/linters-excludes-regression-corpus.test.js`

### S-5.1
- [ ] AC-5.1.1 verified by `tests/regression/SP-20260518-007/workflow-doc-section.test.js`

### S-5.2
- [ ] AC-5.2.1 verified by `tests/regression/SP-20260518-007/retro-surfaces-verification.test.js`

### S-5.3
- [ ] AC-5.3.1 verified by `tests/regression/SP-20260518-007/sprint-full-preset-note.test.js`

### S-6.1
- [ ] AC-6.1.1 verified by `tests/regression/SP-20260518-007/sprint-skill-bodies-mention-convention.test.js`

## Cross-cutting QA

- [ ] `/linters:run` passes (path-lint + new sprint-test-plan-honors-registry discovery).
- [ ] `node scripts/sprint/test-plan-honors-registry-primary.js` still passes (no regression from Sprint A's plan.js edits).
- [ ] `node scripts/sprint/test-sprint-full.js` still passes (Sprint A's design.js / release.js changes must not break /sprint:full v1).
- [ ] `/sprint:full --preset moderate` smoke-runs against a fresh throwaway sprint without halting at the new gate (the dogfood fixture is in place).
- [ ] No new console errors / stderr noise from `scripts/sprint/plan.js` or `design.js` invocations.
- [ ] TRACE events fire as documented (`sprint-design-fixture-gate-refused`, `sprint-release-cited-test-result`, etc.).
- [ ] COPY strings match `copy.md` exactly (verified by `tests/regression/SP-20260518-007/copy-strings-exact.test.js` — additive bonus).
- [ ] `node scripts/sprint/validate.js` against every modified schema file returns 0.

## Downstream-compat QA

- [ ] `/warp:update` smoke: take a downstream project's pre-Sprint-A Plan Contract (no `goal_verification` field), run `/sprint:design` against it, confirm design.js does NOT refuse (gate is fully gated on `goal_verification` presence).
- [ ] `/warp:update` smoke: ditto for `/sprint:release` — pre-Sprint-A sprints still ship without the cited-test executor blocking them.

## External service QA

- N/A. Sprint A has no ESDs.

## Documentation scaling

This plan is the `documentation_scale: m` cut. Per-AC QA above is exhaustive for `m`. For `l/xl`, add load/perf checks on the cited-test executor (Sprint A doesn't have meaningful load).
