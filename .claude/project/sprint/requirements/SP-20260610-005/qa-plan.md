# QA Plan — E-DISPATCH-INTEGRITY-001 F-1+F-3 — coverage-honesty (kill telemetry-only false-greens)

**Sprint:** `SP-20260610-005`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\prd.md`

> Sprint v0.1 QA plan. Honored by `/sprint:execute` (mid-sprint checks)
> and `/sprint:release` (final QA gate). Diff-model review on QA is
> declared in `paths.sprintRouting` (`qa.diff_review: true`).

## Smoke checks

- [ ] `node scripts/checks/test-sprint-manager-consult.js` and `node scripts/checks/test-sprint-hook-coverage.js` exit 0 after the predicate change (existing suites stay green).
- [ ] `node scripts/dispatch/gauntlet-verify.js` with NO sprint_id/window exits non-zero and prints usage guidance (whole-ledger refusal); a correlated invocation against a planted in-window `ok:true` fixture exits 0.

## Per-story QA

### S-1 (T-300)
- [ ] AC-1.1 verified (telemetry-only post-cutoff → RED in BOTH scans)
- [ ] AC-1.2 verified (record-backed post-cutoff → GREEN)
- [ ] AC-1.3 verified (pre-cutoff legacy → GREEN with NAMED exemption)
- [ ] AC-1.4 verified (existing check suites green)
- [ ] Regression: no historic (pre-2026-06-10) sprint flips RED under `/scan:full` after the predicate lands (run both scans against the real ledger, diff verdicts vs pre-change)

### S-2 (T-301)
- [ ] AC-2.1 verified (unbounded invocation refused, exit non-zero + usage)
- [ ] AC-2.2 verified (planted T3 historic-green fixture FAILS)
- [ ] AC-2.3 verified (correlated in-window record passes; caller audit complete)
- [ ] Regression: `scripts/dispatch/gauntlet-verify.test.js` green; grep shows zero remaining unbounded gauntlet-verify call sites (epsilon-runtime, sprint-close paths all pass sprint_id/window)

## Cross-cutting QA

- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Unit tests pass
- [ ] Integration tests pass (where applicable)
- [ ] No new console errors in golden path
- [ ] No new accessibility regressions in changed UI surfaces
- [ ] TRACE events fire as documented
- [ ] COPY matches `copy.md`
- [ ] INPUTS handle validation per `inputs.md`

## External service QA

- [ ] All ESDs in `external-services/` are `ready_for_terminal_work`,
      `mocked`, `integrated`, or explicitly `deferred`.
- [ ] No `secret: true` env-var values appear in any tracked file.
- [ ] Mocks behave equivalently to sandbox where claimed.

## Documentation scaling

This plan is the `documentation_scale: s` cut. For
xs/s, ACs may be inlined and a Cross-cutting subset is enough. For l/xl,
add a separate red-team plan and architecture-review plan.
