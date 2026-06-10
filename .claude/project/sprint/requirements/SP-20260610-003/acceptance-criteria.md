<!-- requirement-format-legacy -->
# Acceptance Criteria — Lanes C+D — sprint-pipeline truth + research:deep runnability (WARPOS.md sweep 2026-06-10)

**Sprint:** `SP-20260610-003`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260610-003\prd.md`

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

## S-1 — TICKET-1: /sprint:full skill org-era rewrite + full.js epsilon-dispatch default via isSprint() + design-transition enforcer (report-only)

- AC-1.1: Given the live mode marker is `sprint` (`scripts/hooks/lib/mode.js` `isSprint()` returns true), when `scripts/sprint/full.js` resolves its options with no explicit `--epsilon-dispatch` flag, then `epsilonDispatch` defaults to `true` — proven by a planted test, and mode detection goes through `isSprint()` (the S-LC-01 registry mechanism), not a new mode literal.
  verified_by: tests/regression/SP-20260610-003/epsilon-dispatch-default.test.js::sprint-mode-defaults-epsilon-dispatch-on
- AC-1.2: Given the live mode is solo, adhoc, or oneshot (`isSprint()` false) — or the mode marker is missing/unreadable — when full.js resolves its options, then the `epsilonDispatch` default is UNCHANGED from pre-sprint behavior (false), and an explicit `--epsilon-dispatch` flag still overrides the default in both directions (planted test both ways).
  verified_by: tests/regression/SP-20260610-003/epsilon-dispatch-default.test.js::non-sprint-modes-unchanged-and-flag-overrides
- AC-1.3: Given `.claude/commands/sprint/full.md` carried zero mentions of ε (`grep -c epsilon` → 0, verified 2026-06-10) and instructed α to author design artifacts + mint tickets itself, when TICKET-1 lands, then the skill body routes Phase 2/3 through ε's hook-point roster (`grep -c -i epsilon` > 0 on the conduct sections) and contains no instruction for α to author design artifacts or mint tickets directly.
  verified_by: not_applicable — doc-presence AC; proven by the greps named in the AC text at the QA gate (skill prose, no runtime behavior to unit-test).
- AC-1.4: Given a planted fixture where requirement artifacts changed without matching roster completion records on the ledger, when the design→designed transition is attempted, then the design-transition enforcer refuses/flags it (report-only: loud `design-transition-refused` record, no hard block) — and a legacy (pre-fix scaffolded) sprint fixture is NOT flagged (scoping per payload complexity driver #2).
  verified_by: tests/regression/SP-20260610-003/design-transition-enforcer.test.js::changed-artifacts-without-roster-records-refused-legacy-exempt

## S-2 — TICKET-2: design scaffold R-id single-sourcing + trace-integrity check + AL-W-006 status/checkpoint schema align

- AC-2.1: Given a plan-contract fixture with MORE than 3 `requirement_areas` (e.g. 6, like this sprint's own contract), when the design scaffold runs, then the scaffolded PRD R-list size equals the `requirement_areas` count AND the R-id set defined in the PRD equals the R-id set referenced in granular-stories.md + trace.md — no fixed R-1..R-3 stub, no orphan refs (the WG-7 live reproduction from SP-20260610-002 is the regression case).
  verified_by: tests/regression/SP-20260610-003/rid-single-source-scaffold.test.js::prd-rlist-equals-stories-trace-rrefs-for-gt3-area-contract
- AC-2.2: Given a planted fixture sprint whose stories/trace cite an R-id NOT defined in its PRD, when the trace-integrity check runs against it, then it exits non-zero naming the orphan R-id(s) — FAIL, not legacy-waive, for newly scaffolded sprints; a clean fixture passes (exit 0).
  verified_by: tests/regression/SP-20260610-003/trace-integrity-check.test.js::planted-orphan-rid-fails-clean-passes
- AC-2.3: Given `status.js:55-100` missed `crash_recovery`/`ralph`/`reports` vs the current.yaml schema and `checkpoint.js:83` returned an existing checkpoint without validation, when TICKET-2 lands, then status.js reports all three field groups from a fixture sprint state, and checkpoint.js validates an existing checkpoint against the schema (malformed fixture → flagged, not silently returned).
  verified_by: tests/regression/SP-20260610-003/status-checkpoint-schema-align.test.js::current-yaml-fields-read-and-checkpoint-validated

## S-3 — TICKET-3: scripts/research/deep-run.js + deep.md thin wrapper + Phase 0 quota probe

- AC-3.1: Given NEW `scripts/research/deep-run.js` exists as a standalone node runner, when `node scripts/research/deep-run.js --help` runs, then it exits 0 and prints usage — and the script's polling is internal async (no shelling out to `sleep`) with all fs-writes inside the script (no reliance on harness `node -e` blocks).
  verified_by: tests/regression/SP-20260610-003/deep-run-runnability.test.js::help-exits-zero-and-no-shell-sleep-in-source
- AC-3.2: Given `.claude/commands/research/deep.md` carried `sleep 15/90/60` (lines 255/339/452) and `node -e ... writeFileSync` blocks (lines 212-468), when TICKET-3 lands, then deep.md is a thin wrapper that launches deep-run.js and contains ZERO matches for the patterns `sleep N` and `node -e .*writeFileSync` (grep over the rewritten skill body).
  verified_by: tests/regression/SP-20260610-003/deep-run-runnability.test.js::deep-md-contains-no-blocked-primitives
- AC-3.3: Given a mocked provider response returning `insufficient_quota`/429-credits, when deep-run.js Phase 0 runs its billable quota probe (cheapest model per provider, ≤5 tokens), then the provider is classified as an UP-FRONT skip with an actionable message naming the provider via auth-resolver label — never key values, never a post-submission failure — and a mocked healthy response classifies `ok`; total probe spend stays in cents within the $5 floor.
  verified_by: tests/regression/SP-20260610-003/quota-probe-classification.test.js::mocked-insufficient-quota-classified-upfront-skip-no-key-leak
