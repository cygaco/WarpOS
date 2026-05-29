# QA Plan — Rename check: namespace to scan: + scan:full system scan

**Sprint:** `SP-20260528-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260528-001\prd.md`

> Sprint v0.1 QA plan. Honored by `/sprint:execute` (mid-sprint checks)
> and `/sprint:release` (final QA gate). Diff-model review on QA is
> declared in `paths.sprintRouting` (`qa.diff_review: true`).

## Smoke checks

- [ ] {{smoke_check_1}}
- [ ] {{smoke_check_2}}

## Per-story QA

### S-1
- [ ] AC-1.1 verified
- [ ] AC-1.2 verified
- [ ] Regression: {{regression_check_s1}}

### S-2
- [ ] AC-2.1 verified
- [ ] Regression: {{regression_check_s2}}

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
