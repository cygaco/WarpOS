# QA Plan — WarpOS install/update provider smoke test + RCA

**Sprint:** `SP-20260513-002`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\prd.md`

> Sprint v0.1 QA plan. Honored by `/sprint:execute` (mid-sprint checks)
> and `/sprint:release` (final QA gate). Diff-model review on QA is
> declared in `paths.sprintRouting` (`qa.diff_review: true`).

## Smoke checks

- [ ] `node scripts/warpos/provider-smoke.js --json` runs without throwing on a clean dev machine and emits valid JSON to stdout.
- [ ] `node scripts/warpos/provider-smoke.js --providers nope` exits with `unknown_provider: nope` (no probe attempted).
- [ ] Catalog file is JSON-parseable and matches schema `warpos/provider-failure-modes/v1`.

## Per-story QA

### S-1 — Orchestrator + exit codes
- [ ] AC-1.1 verified (green path, exit 0)
- [ ] AC-1.2 verified (yellow path, exit 0)
- [ ] AC-1.3 verified (red path, exit 2)
- [ ] Regression: existing `node scripts/warpos/provider-health-check.js` still runs and still returns exit 0 (we are NOT changing that script in this sprint — smoke is a new orchestrator).

### S-2 — release.json postUpdateChecks
- [ ] AC-2.1 verified on a synthetic 0.5.1 capsule fixture
- [ ] AC-2.2 verified with codex mocked to return auth_missing
- [ ] Regression: existing `postUpdateChecks` for 0.5.0 (paths/build, paths/gate, hooks/build, hooks/test) still run in declared order; smoke is appended last.

### S-3 — Failure-mode catalog
- [ ] AC-3.1 verified — unit test enumerates every status string in `provider-health.js` and asserts catalog coverage.
- [ ] AC-3.2 verified — corrupt-catalog fixture
- [ ] AC-3.3 verified — auth_source_mismatch entry asserted

### S-4 — RCA module
- [ ] AC-4.1 verified — table-driven test per known status
- [ ] AC-4.2 verified — unknown status returns default

### S-5 — Auto-fix dispatcher
- [ ] AC-5.1 verified — `trusted_directory_required` recipe applies `GEMINI_CLI_TRUST_WORKSPACE=true`, re-probe succeeds in fixture
- [ ] AC-5.2 verified — `auth_source_mismatch` never autofixed
- [ ] AC-5.3 verified — `--no-autofix` short-circuits

### S-6 — Install/setup wiring
- [ ] AC-6.1 verified by running `/warp:setup` end-to-end on a scratch project
- [ ] AC-6.2 verified by forcing red via env (e.g., `PATH=` to hide codex)
- [ ] Regression: `/warp:setup` still re-runnable (idempotent) per CLAUDE.md `warp:setup` skill notes

### S-7 — Events logging
- [ ] AC-7.1 verified by tailing `paths.eventsFile` and asserting event shape per smoke run
- [ ] AC-7.2 verified by simulating 3 same-status runs in test harness and running `/issues:scan`

### S-8 — Cross-platform Windows stdin guard
- [ ] AC-8.1 verified — grep audit returns zero matches
- [ ] AC-8.2 verified — synthetic write of a forbidden pattern triggers `dispatch-route-guard` block

## Cross-cutting QA

- [ ] Lint passes (`npm run lint`)
- [ ] Typecheck passes (where applicable)
- [ ] Unit tests pass — new test files under `tests/`
- [ ] Integration tests pass — synthetic capsule fixture round-trip
- [ ] No new console errors in golden path (`/warp:health` still clean)
- [ ] No new accessibility regressions in changed UI surfaces (N/A — CLI only)
- [ ] TRACE events fire as documented in `trace.md`
- [ ] COPY matches `copy.md` (visual diff on golden output)
- [ ] INPUTS handle validation per `inputs.md`
- [ ] `/check:references` shows no broken refs from new files
- [ ] `/check:warpos-manifest-honesty` passes after release.json edits
- [ ] `path-lint` passes (no hard-coded paths in new files; all use `paths.*` tokens)

## Seven failure-mode personas applied to the smoke surface

Drawn from the seven failure-mode personas used by `/qa:audit` and `/qa:check`. Each persona is a thinking lens applied to provider-smoke specifically:

1. **The Liar** — does smoke ever return GREEN when a provider is actually broken? Test: codex CLI present but `codex --version` hangs → does smoke fall through to GREEN, or does the existing `safeExec` timeout fire? Expected: classified as `provider_timeout` → red.
2. **The Bypasser** — can an operator skip smoke at install/update? Test: `--skip-smoke` flag NOT exposed in MVP. The capsule-declared `postUpdateChecks` runs unconditionally. Confirm no env var (`WARPOS_SKIP_SMOKE`?) silently bypasses; if it must exist for CI, log it as a TR-1 event with `bypassed: true`.
3. **The Drift Detector** — does the catalog drift from `provider-health.js`? Test: AC-3.1 unit test fails if `provider-health.js` adds a status not in catalog.
4. **The Replayer** — is a smoke run reproducible? Test: same env produces same verdict + same root_cause + same RCA event sequence. Non-determinism only in `duration_ms` field.
5. **The Loop Watcher** — does autofix loop on a recipe that never works? Test: feed a recipe that always re-probes to the same status — assert autofix runs at most once per provider per smoke invocation (R-5 cycle prevention).
6. **The Auth Steward** — can autofix overwrite operator's auth config? Test: every catalog entry whose `fix_recipe` touches auth files has `safe_to_autofix: false`. RT-2 in `redteam-plan.md` covers this adversarially.
7. **The Cross-Platform Auditor** — does smoke work identically on macOS, Linux, Windows? Test: AC-8.1 + AC-8.2. On Windows specifically: no `cat | codex`, no shell-feature dependencies (`source`, `export`), all paths use `path.join`.

## External service QA

- [ ] All ESDs in `external-services/` are `ready_for_terminal_work`, `mocked`, `integrated`, or explicitly `deferred`. (None expected per Plan Contract.)
- [ ] No `secret: true` env-var values appear in any tracked file. (Audit `provider-failure-modes.json` and all new code.)
- [ ] Mocks behave equivalently to sandbox where claimed.

## Documentation scaling

This plan is the `documentation_scale: m` cut. For xs/s, ACs may be inlined and a Cross-cutting subset is enough. For l/xl, add a separate red-team plan (we have one — `redteam-plan.md`) and architecture-review plan.
