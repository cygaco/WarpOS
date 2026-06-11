# QA Plan - E-PRODUCT-FOUNDATION-001 W0 telemetry seam

**Sprint:** `S-PF-01`
**PRD:** `.claude/project/sprint/requirements/S-PF-01/prd.md`

## Smoke checks

- [ ] `node scripts/contracts/validate-artifact.js .claude/project/sprint/requirements/S-PF-01/artifacts/build_spec-S-PF-01-w0-telemetry-seam.chain.json`
- [ ] `node scripts/checks/scaffold-coverage-scan.js --json`
- [ ] `node scripts/bootstrap/lastmile/test-orchestrate.js` or the focused analytics seam tests if the full orchestrate runner is not applicable
- [ ] `node scripts/generate-framework-manifest.js --check`
- [ ] `node scripts/warpos/manifest/validate.js --strict`
- [ ] `node scripts/trackers/validate.js`

## Per-story QA

- [ ] S-1 proves no-op and throwing sinks never break app code.
- [ ] S-2 proves exact event set equality, not count-only presence.
- [ ] S-3 proves activation placeholders fail and revisions are tracked.
- [ ] S-4 proves lastmile enriches, not reinstalls.
- [ ] S-5 proves broken action chains surface as failures.
- [ ] S-6 proves planted false-green fixtures fail and real scaffold passes.

## Traceability gate

Dispatch `qa-reviewer` with `review_scope=traceability` after requirements are populated and before execution. Required review target:

- `.claude/project/sprint/requirements/S-PF-01/`
- `.claude/project/sprint/requirements/S-PF-01/artifacts/`
- `.claude/project/sprint/plan-contracts/PC-20260611-0075.yaml`

## Regression strategy

Keep tests under `tests/regression/S-PF-01/` and fixture names clearly scoped so scaffold scans never mistake planted broken telemetry fixtures for real project state.
