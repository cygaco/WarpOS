# QA Plan — _guides product-layer shipping + _planning reorg + ship-boundary enforcer

**Sprint:** `SP-20260531-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260531-002/prd.md`

> Sprint v0.1 QA plan. Honored by `/sprint:execute` (mid-sprint checks) and `/sprint:release` (final QA gate).

## Smoke checks

- [ ] `_guides/DEV_SETUP_GUIDE.md` exists; no copy remains at repo root; grep shows no stale root-path refs.
- [ ] `node scripts/checks/warpos-ship-coverage.js` exits 0 on the compliant state.

## Per-story QA

### S-1 — create _guides/ + move guide
- [ ] AC-1.1 verified (file moved, root copy gone)
- [ ] AC-1.2 verified (no stale references; grep clean)
- [ ] Regression: refactor-hygiene — old literal grepped repo-wide before completion

### S-2 — register _guides/ in manifests
- [ ] AC-2.1 verified (`_guides/**` in BOTH manifests)
- [ ] Regression: `scan:warpos-ship-coverage` allowlist green

### S-3 — exclude _planning/ from shipping
- [ ] AC-3.1 verified (`_planning/**` absent from shipped manifest)
- [ ] Regression: denylist exits non-zero if a `_planning` path is shipped

### S-4 — reorganize _planning/
- [ ] AC-4.1 verified (grouped subfolders, no content lost, `git mv` history preserved)

### S-5 — extend enforcer (fail-closed)
- [ ] AC-5.1 verified (exit 0 on compliant state)
- [ ] AC-5.2 verified (exit non-zero on an INJECTED violation — the false-green test)
- [ ] AC-5.3 verified (appears in `scan:full` Tier 3)

### S-6 — regen manifests + verify
- [ ] AC-6.1 verified (`scan:full` Tier 3 green: ship-coverage + framework-purity + manifest-coverage)

## Cross-cutting QA

- [ ] Path-lint / linters pass (no stale literal for the moved guide)
- [ ] BOTH manifests regenerated (BC-02/BC-05 not red)
- [ ] No new console errors / script errors in the enforcer
- [ ] TRACE event (TR-1) fires as documented
- [ ] COPY matches `copy.md` (only the enforcer error string, C-1)
- [ ] INPUTS: none (see `inputs.md`)

## External service QA

- [ ] No ESDs for this sprint (none_expected).
- [ ] No `secret: true` env-var values appear in any tracked file.

## Documentation scaling

`documentation_scale: m` cut.
