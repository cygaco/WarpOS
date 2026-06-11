# QA Plan — E-LIFECYCLE-001 close-out fix sprint — 17 REAL + 4 PARTIAL GPT 2nd-pass findings (team-guard/mode-guard bypass classes, turbo spend/auth integrity, coverage-gate waiver+expected-source, provider-tier false-green, planning-principles enforce path, ac-coverage fail-closed) + NOTAGAIN §8.3 legacy scoping

**Sprint:** `SP-20260611-002`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260611-002\prd.md`

> Sprint v0.1 QA plan. Honored by `/sprint:execute` (mid-sprint checks)
> and `/sprint:release` (final QA gate). Diff-model review on QA is
> declared in `paths.sprintRouting` (`qa.diff_review: true`). Every surface
> is an enforcer — a wrong fix is an enforcement regression (BC-16), so each
> per-story QA pairs the exploit assertion with a green-corpus / happy-path
> regression assertion.

## Smoke checks

- [ ] `node scripts/hooks/team-guard.js` + `node scripts/hooks/mode-lifecycle-guard.js` run clean against the real session state (no new false-positive blocks introduced by the verify-don't-trust hardening)
- [ ] `node scripts/turbo/apply.js` dry-run + `node scripts/turbo/spend-ledger.js` summarize the CURRENT session's grant UNCHANGED (the live-session self-lockout fixture, AC-3.5, is the gate here — fixes govern future applies only)
- [ ] `node scripts/warpos/provider-tier-check.js --json` + `node scripts/checks/planning-principles.js --enforce` + `node scripts/sprint/check-ac-coverage.js --enforce` each run and exit with the EXPECTED code on the real tree (no crash; report-only posture preserved until the operator flip)
- [ ] `node scripts/dispatch/coverage-gate.js` + `node scripts/checks/coverage-gate-scan.js` run clean on the real ledger (no historic record redded by the new legacy-scoped expected-source)

## Per-story QA

### S-1 (R-1 — team-guard / lifecycle verify-don't-trust)
- [ ] AC-1.1 .. AC-1.6 verified (fabricated team_name blocked; planted .team-live not trusted; planted mode.json cross-checked; kill-switch loud-logged; exact-match roster verify; legitimate verified team still passes)
- [ ] Regression: team-guard + mode-lifecycle-guard + lifecycle selftests green; the sprint-path EXACT-match behavior (isConductor) unchanged

### S-2 (R-2 — mode-write coverage)
- [ ] AC-2.1 .. AC-2.4 verified (mode-set.js emits events on Bash invocation; out-of-band write reds; sanctioned change not flagged; mode-guard kill-switch emits audit event)
- [ ] Regression: mode-set.js existing behavior preserved; matcher NOT extended (rejected remedy)

### S-3 (R-3 — turbo auth + spend integrity)
- [ ] AC-3.1 .. AC-3.5 verified (widening needs provenance; attested widening succeeds; reapply doesn't drop prior session spend; nonfinite fail-HIGH; LIVE-SESSION SELF-LOCKOUT fixture on a THROWAWAY auth fixture — prior grant scopes + anchor UNCHANGED)
- [ ] Regression: existing turbo apply + spend-ledger tests green; legitimate same-session re-grant path intact

### S-4 (R-4 — authorization safety floor)
- [ ] AC-4.1 .. AC-4.3 verified (node-e-fs does not approve rm/unlink; executable tracked-work-delete floor catches via any scope; legitimate write + untracked-temp delete not over-blocked)
- [ ] Regression: existing authorization-gate tests green; git-push-force + backup-branch floor patterns still hold

### S-5 (R-5 — coverage-gate waiver + expected-source + legacy scoping)
- [ ] AC-5.1 .. AC-5.5 verified (free-text waiver rejected; provenance-backed waiver honored + surfaced in scan; omitted role still expected from external source; ONE shared cutoff; post-cutoff planted violation still REDS)
- [ ] Regression: coverage-gate + coverage-gate-scan selftests green; no historic record redded

### S-6 (R-6 — provider-tier truthfulness, verdict matrix)
- [ ] AC-6.1 .. AC-6.6 verified (every truth-table cell: t3-down→tier_short REDS; corrupt config fail-closed; envelope ok mirrors verdict; unknown-self-attested reserved; absent config greenfield; happy path passes)
- [ ] Regression: existing provider-tier tests green; report-only posture preserved

### S-7 (R-7 — planning-principles real enforce)
- [ ] AC-7.1 .. AC-7.4 verified (planted-violation exits non-zero under --enforce; internal error fail-closed exit 2; section tests require heading not bare word; scan scope covers sprints + root plans)
- [ ] Regression: existing planning-principles tests green; report-only default unchanged

### S-8 (R-8 — ac-coverage fail-closed + scoping)
- [ ] AC-8.1 .. AC-8.4 verified (planted-missing artifact REDS under --enforce; greenfield no-target still fail-open; legacy cutoff shared + post-cutoff REDS; proof-syntax residue documented)
- [ ] Regression: existing check-ac-coverage tests green

### S-9 (R-9 — hooks-coverage allowlist schema)
- [ ] AC-9.1 .. AC-9.3 verified (schemaless entry rejected; expired entry flagged; valid in-date entry honored not over-flagged)
- [ ] Regression: existing mode-lifecycle-hooks-coverage tests green

### S-10 (R-10 — wrapper mode binding, post-SP-001 merge)
- [ ] AC-10.1 .. AC-10.3 verified (wrappers thread mode at both RE-LOCATED call sites; mode-narrowing gates a live dispatch; report-only ramp preserved)
- [ ] Pre-req: SP-20260611-001 WS-A merged FIRST (file overlap on dispatch wrappers); call sites re-located, no stale line numbers pinned
- [ ] Regression: existing dispatch-contract + wrapper tests green; SP-001's WS-A changes still green

## Cross-cutting QA

- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Unit tests pass
- [ ] Integration tests pass (where applicable)
- [ ] No new console errors in golden path
- [ ] No new accessibility regressions in changed UI surfaces (N/A — engine sprint)
- [ ] TRACE events fire as documented in `trace.md` (kill-switch audit events, provenance stamps, suspect-record notices, verdict matrix fields)
- [ ] COPY matches `copy.md` (refusal + kill-switch + finding strings self-identify the enforcer/reason/recovery)
- [ ] INPUTS handle validation per `inputs.md` (planted/spoofed/corrupt inputs fail closed)
- [ ] Per-surface exploit isolation (AC-X.2): each G3 surface independently runnable, a red localizes to ONE file
- [ ] Fixture namespacing (AC-X.3): all exploit fixtures under `tests/regression/SP-20260611-002/`, fixture-namespaced, NOT read by /scan as a real bypass
- [ ] No report-only→blocking flip executed (AC-X.4): enforce paths land report-only / behind the ramp env until the operator's end-of-session words

## External service QA

- [ ] All ESDs in `external-services/` are `ready_for_terminal_work`,
      `mocked`, `integrated`, or explicitly `deferred` (status: none_expected — local enforcement scripts; gauntlet uses live provider CLIs).
- [ ] No `secret: true` env-var values appear in any tracked file.
- [ ] Mocks behave equivalently to sandbox where claimed.

## Documentation scaling

This plan is the `documentation_scale: m` cut. The separate red-team plan
(`redteam-plan.md`) is present per the `m` requirement and the `l`-size /
`high`-risk scope (11 enforcement surfaces, every surface an enforcer).
