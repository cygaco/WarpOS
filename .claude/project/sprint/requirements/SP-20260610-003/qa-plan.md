# QA Plan — Lanes C+D — sprint-pipeline truth + research:deep runnability (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-003`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-003\prd.md`

> Sprint v0.1 QA plan. Honored by `/sprint:execute` (mid-sprint checks)
> and `/sprint:release` (final QA gate). Diff-model review on QA is
> declared in `paths.sprintRouting` (`qa.diff_review: true`).
> Scope: sprint engine + scaffold + research runner only — engine sprint, no UI.

## Smoke checks

- [ ] `node scripts/research/deep-run.js --help` exits 0
- [ ] `node scripts/sprint/full.js --help` (or equivalent dry invocation) exits 0 in a non-sprint mode with `epsilonDispatch` defaulting false (no behavior change outside sprint mode)
- [ ] trace-integrity check exits 0 against this sprint's OWN requirements bundle (SP-20260610-003 is itself a >3-area scaffold — it must pass its own enforcer)
- [ ] `grep -nE "sleep [0-9]|node -e .*writeFileSync" .claude/commands/research/deep.md` returns 0 matches

## Per-story QA

### S-1 (sprint:full org-era + epsilon default + design-transition enforcer)
- [ ] AC-1.1 verified (sprint mode → `epsilonDispatch` defaults true via `isSprint()`)
- [ ] AC-1.2 verified (solo/adhoc/oneshot + missing-marker → default unchanged; explicit flag overrides both ways)
- [ ] AC-1.3 verified (full.md routes Phase 2/3 through ε's roster; no α-authors-design instruction; grep evidence)
- [ ] AC-1.4 verified (planted changed-artifacts-without-roster-records fixture → refused/flagged report-only; legacy sprint exempt)
- [ ] Regression: a full.js invocation with explicit `--epsilon-dispatch` flags behaves exactly as before the flip (flag semantics untouched); no new mode literal introduced (grep full.js for hardcoded "sprint" mode strings — detection goes through `isSprint()`)

### S-2 (R-id single-sourcing + trace-integrity + AL-W-006)
- [ ] AC-2.1 verified (>3-area contract fixture: PRD R-list size == requirement_areas count; PRD R-id set == stories/trace R-ref set)
- [ ] AC-2.2 verified (planted orphan R-id → non-zero naming the orphan; clean fixture → 0; no legacy-waive for new scaffolds)
- [ ] AC-2.3 verified (status.js reads crash_recovery/ralph/reports; checkpoint.js validates existing checkpoint, malformed flagged)
- [ ] Regression: re-scaffold a 3-area contract fixture — output unchanged in shape vs pre-fix for the same-size case; existing scan:requirements / req-format-guard checks stay green; closed sprints' bundles NOT retro-flagged (non-goal #3)

### S-3 (deep-run.js + thin deep.md + quota probe)
- [ ] AC-3.1 verified (`--help` exit 0; internal async polling; fs-writes in-script)
- [ ] AC-3.2 verified (deep.md thin wrapper; zero `sleep N` / `node -e .*writeFileSync` matches)
- [ ] AC-3.3 verified (mocked insufficient_quota/429 → up-front skip with provider label; healthy mock → ok; no key values in any output)
- [ ] Regression: probe path uses the existing auth-resolver (no raw curl/SDK outside allowlisted wrappers — dispatch-contract CLI-vs-API rule); probe token cap ≤5 enforced in code, spend within the $5 floor

## Cross-cutting QA

- [ ] Lint passes (path-lint: no new literal paths where `paths.*` keys apply)
- [ ] Typecheck passes (n/a — plain Node scripts; `node --check` on changed/new .js instead)
- [ ] Unit tests pass (planted-fixture runs for epsilon-default, design-transition, trace-integrity, schema-align, deep-run, quota-probe)
- [ ] Integration tests pass (trace-integrity wired report-only per existing idiom; full.js default resolution exercised end-to-end in a sprint-mode fixture)
- [ ] No new console errors in golden path (n/a — no UI; runner + checks emit clean output on pass)
- [ ] No new accessibility regressions in changed UI surfaces (n/a — engine sprint, no UI)
- [ ] TRACE events fire as documented (TR-1 design-transition verdict + TR-2 trace-integrity result + TR-3 quota-probe classification emitted by fixture runs)
- [ ] COPY matches `copy.md` (C-1: confirms no user-facing copy was introduced)
- [ ] INPUTS handle validation per `inputs.md` (IN-1/IN-2/IN-3 failure modes fail safe: unverifiable mode → non-sprint default; empty requirement_areas → scaffold refuses; depleted key → up-front skip)
- [ ] Lane A disjointness held: no edits to release.js, generate-framework-manifest.js, warpos-install-baseline.js, scaffold payload (non-goal #1)
- [ ] No E-LIFECYCLE report-only gate flipped to blocking (non-goal #2)

## External service QA

- [ ] All ESDs in `external-services/` are `ready_for_terminal_work`,
      `mocked`, `integrated`, or explicitly `deferred`. (Payload: no
      external service dependencies — list is empty; the quota probe
      uses already-configured provider credentials, mocked in tests.)
- [ ] No `secret: true` env-var values appear in any tracked file.
- [ ] Mocks behave equivalently to sandbox where claimed (quota-probe
      mock mirrors real insufficient_quota/429 response shapes).

## Documentation scaling

This plan is the `documentation_scale: m` cut. For
xs/s, ACs may be inlined and a Cross-cutting subset is enough. For l/xl,
add a separate red-team plan and architecture-review plan.
