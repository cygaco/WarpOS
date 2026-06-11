# QA Plan — Cross-family findings fix sprint — 6 gemini re-review findings (epsilon-runtime spawn race, fallback ENFORCE brick, hardcoded BUILD_CHAIN_ROLES, spoofed-ts window, sprint_id correlation, verifyGauntlet parse refusal)

**Sprint:** `SP-20260611-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-001\prd.md`

> Sprint v0.1 QA plan. Honored by `/sprint:execute` (mid-sprint checks)
> and `/sprint:release` (final QA gate). Diff-model review on QA is
> declared in `paths.sprintRouting` (`qa.diff_review: true`).

## Smoke checks

- [ ] `node scripts/sprint/epsilon-runtime.js plan --sprint SP-20260611-001 --json` still resolves a plan (runtime not broken by the timeout change)
- [ ] `node scripts/checks/sprint-hook-coverage.js` + `node scripts/checks/sprint-manager-consult.js` run clean on the real ledger (no new findings introduced by clamp/correlation changes)
- [ ] `node scripts/dispatch/gauntlet-verify.js` CLI with a valid window exits as before

## Per-story QA

### S-1
- [ ] AC-1.1, AC-1.2 verified (both spawn sites — check the second site explicitly)
- [ ] Regression: existing epsilon-runtime tests green

### S-2
- [ ] AC-2.1, AC-2.2, AC-2.3 verified
- [ ] Regression: dispatch-shape resolver tests (26/26 baseline) green; non-sanctioned mismatch still refuses under blocking

### S-3
- [ ] AC-3.1, AC-3.2 (membership parity — byte-identical for existing roles), AC-3.3 verified
- [ ] Regression: dispatch-claude tests green

### S-4
- [ ] AC-4.1 AND AC-4.2 verified (the planted-1970/2099 exploit tested against BOTH checkers)
- [ ] Regression: both checkers' selftests green

### S-5
- [ ] AC-5.1, AC-5.2 (concurrent-sprint no-false-green), AC-5.3 (legacy fallback keeps clamped window) verified in BOTH checkers
- [ ] Regression: F-1 record-backed coverage behavior preserved for legacy sprints (RECORD_BACKED_CUTOFF exemption intact)

### S-6
- [ ] AC-6.1, AC-6.2 verified
- [ ] Regression: gauntlet-verify suite (47/47 baseline) green

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

This plan is the `documentation_scale: m` cut. For
xs/s, ACs may be inlined and a Cross-cutting subset is enough. For l/xl,
add a separate red-team plan and architecture-review plan.
