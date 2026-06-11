# Release Plan - E-PRODUCT-FOUNDATION-001 W0 telemetry seam

**Sprint:** `S-PF-01`
**PRD:** `.claude/project/sprint/requirements/S-PF-01/prd.md`

## Release gates

- [ ] All S-PF-01 tickets are `done`.
- [ ] `scripts/contracts/validate-artifact.js` passes on the S-PF-01 artifact chain.
- [ ] Focused S-PF-01 regression tests pass.
- [ ] Existing scaffold and lastmile tests pass or are explicitly recorded as unavailable with reason.
- [ ] `scripts/checks/scaffold-coverage-scan.js --json` passes on the real scaffold.
- [ ] Both manifests are regenerated and validators pass.
- [ ] `scripts/trackers/validate.js` passes.
- [ ] `git diff --check` passes.

## Non-release gates

- No production deploy.
- No push without explicit in-session approval.
- No report-only to blocking flip outside existing command semantics.

## Release evidence

Record exact commands, exit codes, and commit hash in `CODEX-LOG.md`, the release record, and the S-PF-01 sprint history/retro when closing.
