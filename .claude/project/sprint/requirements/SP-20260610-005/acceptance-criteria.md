<!-- requirement-format-legacy -->
# Acceptance Criteria — E-DISPATCH-INTEGRITY-001 F-1+F-3 — coverage-honesty (kill telemetry-only false-greens)

**Sprint:** `SP-20260610-005`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-005\prd.md`

> Each AC is a testable statement. Link from the relevant granular story
> + the ticket that implements it.
>
> **`verified_by:` linkage convention (SP-20260518-007).** When the Plan
> Contract carries a `goal_verification` block, each AC MUST be
> linked by adding a `verified_by:` line directly under the AC. Two
> accepted forms:
>
> - `verified_by: <test-file>::<test-name>` (executable — ship-gate
>   runs this test under paths.sprintRegressionCorpus/<sprint-id>/)
> - `verified_by: not_applicable — <justification>` (skipped; only
>   valid when `goal_verification.reproduction = not_applicable` in
>   the Plan Contract; justification must be non-empty)
>
> `/sprint:design` refuses to advance the sprint to `designed` if any
> AC lacks a `verified_by:` line while `goal_verification.reproduction
> = executable`. `/sprint:release` ship-gate runs every cited test.

## S-1 — TICKET-1 (T-300): F-1 — record-backed coverage predicate in sprint-manager-consult + sprint-hook-coverage (legacy cutoff, planted fixtures)

- AC-1.1: Given a planted fixture sprint dated ON/AFTER the legacy cutoff (2026-06-10) whose ledger carries a `manager_consult` telemetry record but NO correlated `ok:true` completion record, when `scripts/checks/sprint-manager-consult.js` and `scripts/checks/sprint-hook-coverage.js` run against it, then BOTH report the phase/hook-point as NOT covered (RED) with a diagnostic naming the missing backing record — telemetry-only no longer satisfies either scan.
  verified_by: tests/regression/SP-20260610-005/record-backed-coverage.test.js::telemetry-only-post-cutoff-is-red-in-both-scans
- AC-1.2: Given a planted post-cutoff fixture whose ledger carries the `manager_consult` telemetry record AND a correlated `ok:true` completion record (matching sprint/phase), when both coverage scans run against it, then the phase/hook-point counts as covered (GREEN).
  verified_by: tests/regression/SP-20260610-005/record-backed-coverage.test.js::record-backed-post-cutoff-is-green-in-both-scans
- AC-1.3: Given a planted legacy fixture sprint dated BEFORE the cutoff (2026-06-10) with a telemetry-only record (no `ok:true` completion record), when both coverage scans run against it, then it remains covered (GREEN) via the explicit legacy exemption — the output names the exemption (cutoff date + legacy-exempt flag), not a silent pass — so historic sprints are not retroactively uncovered.
  verified_by: tests/regression/SP-20260610-005/record-backed-coverage.test.js::pre-cutoff-legacy-telemetry-only-is-green-with-named-exemption
- AC-1.4: Given the existing suites `scripts/checks/test-sprint-manager-consult.js` and `scripts/checks/test-sprint-hook-coverage.js`, when they run after the predicate change lands, then they pass (exit 0) — existing covered cases stay green and the new predicate idiom follows the existing dated-constant idiom if one exists in the checks.
  verified_by: tests/regression/SP-20260610-005/record-backed-coverage.test.js::existing-coverage-check-suites-stay-green

## S-2 — TICKET-2 (T-301): F-3 — gauntlet-verify sprint_id/window correlation + whole-ledger refusal (caller audit)

- AC-2.1: Given `scripts/dispatch/gauntlet-verify.js` invoked with NO sprint_id and NO bounded window (a whole-ledger verify), when it runs, then it REFUSES: exits non-zero and prints usage guidance naming the required correlation flags — it never scans the unbounded ledger for any `ok:true` record.
  verified_by: tests/regression/SP-20260610-005/gauntlet-verify-correlation.test.js::unbounded-whole-ledger-invocation-refused-nonzero-with-usage
- AC-2.2: Given a planted historic-green fixture — the ledger contains an `ok:true` completion record from a DIFFERENT sprint_id (or outside the bounded window) and no record for the sprint under verification — when gauntlet-verify runs correlated by the current sprint_id within its window, then it FAILS (exit non-zero, no-matching-record diagnostic): the T3 historic-green false-positive no longer passes.
  verified_by: tests/regression/SP-20260610-005/gauntlet-verify-correlation.test.js::historic-ok-true-from-other-sprint-cannot-green-a-never-ran-lane
- AC-2.3: Given a fixture ledger with an `ok:true` completion record whose sprint_id matches and whose timestamp falls inside the bounded window, when gauntlet-verify runs with that sprint_id/window, then it passes (exit 0) — and the caller audit holds: every call site (epsilon-runtime, sprint-close paths, located by grep) passes sprint_id/window, with `scripts/dispatch/gauntlet-verify.test.js` green after the CLI-contract change.
  verified_by: tests/regression/SP-20260610-005/gauntlet-verify-correlation.test.js::correlated-in-window-record-passes-and-callers-pass-window
