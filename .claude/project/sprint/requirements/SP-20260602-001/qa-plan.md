# QA Plan — Sealed-capsule executable consumer-contract gate (keystone)

**Sprint:** `SP-20260602-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260602-001\prd.md`

> Sprint v0.1 QA plan. Honored by `/sprint:execute` (mid-sprint checks)
> and `/sprint:release` (final QA gate). Diff-model review on QA is
> declared in `paths.sprintRouting` (`qa.diff_review: true`).

## Smoke checks

- [ ] `node scripts/warpos/test-sealed-capsule-gate.js` runs end-to-end and exits 0 on a healthy capsule.
- [ ] The gate exits NON-ZERO on each injected fault (stale manifest, planted reach-back, missing telemetry record) — the gate's own negative tests prove it catches the bug class (no false-green).

## Per-story QA (enforcer-class focus: every "green" must be earned, every failure fail-closed)

### S-1 seal
- [ ] AC-1.1 verified — sealed payload contains all manifest entries, zero canonical abs-path refs
- [ ] AC-1.2 verified — content hashes match checksums.json
- [ ] AC-1.3 verified — fail-closed on stale/missing manifest, writes nothing
- [ ] Regression: seal does not silently copy from canonical when a manifest entry is absent (must fail, not fall back)

### S-2 isolate
- [ ] AC-2.1/2.2 verified — out-of-tree repo, canonical unreachable (no abs path, scrubbed env)
- [ ] AC-2.3 verified — NEGATIVE test: planted reach-back makes the gate FAIL
- [ ] Regression: temp repo is created OUTSIDE REPO_ROOT (not a child dir that re-exposes canonical via ../)

### S-3 lifecycle
- [ ] AC-3.1/3.2 verified — full contract in order; any non-zero step fails the gate, names the step

### S-4 verifyTyped
- [ ] AC-4.1/4.2/4.3 verified — action+record required; fail-closed on malformed/no-record/runner-error; canonical-anchored ledger resolution (ED-016)

### S-5 matrix
- [ ] AC-5.1/5.2 verified — all 4 cells (role×path) run via override-arg threading; any cell fail → gate fail; no silent skip

### S-6 wire / S-7 manifests+testsuite
- [ ] AC-6.1 verified — gate runs as a named release/promotion enforcer; failure blocks promotion
- [ ] AC-7.1/7.2 verified — both manifests current (`--check` exit 0); registered in testsuite/enforce.js; no new regressions vs BC-17/BC-26 baseline

### Cross-provider gauntlet note
- [ ] This is enforcer-class HIGH-risk: the qa/redteam reviewers MUST probe for false-green / fail-open paths specifically (the recurring class — every enforcer lane last session had a real hole). A passing happy-path is NOT sufficient; the negative tests must demonstrably fail the gate.

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
