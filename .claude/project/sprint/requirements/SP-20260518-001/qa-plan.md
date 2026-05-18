# QA Plan — /sprint:full

**Sprint:** `SP-20260518-001`
**PRD:** `paths.sprintRequirements/SP-20260518-001/prd.md`

Honored by `/sprint:execute` (mid-sprint checks) and `/sprint:release` (final QA gate). Diff-model review on QA is declared in `paths.sprintRouting` (`qa.diff_review: true`).

## Smoke checks

- [ ] `scripts/sprint/full.js --help` (or equivalent argv help) emits a clear synopsis listing all 11 inputs.
- [ ] Loading `paths.sprintFullAutonomy` validates against `schemas/sprint/sprint-full-autonomy.schema.json` for all three default presets.
- [ ] `scripts/sprint/test-sprint-full.js` exits 0 with all 5 scenarios passing.
- [ ] On a fresh sprint, `/sprint:full "test request" --autonomy conservative` halts at the first non-trivial gate (proves preset-bounded autonomy).
- [ ] On a halted sprint, `/sprint:full --sprint <id> --resume` does NOT re-run completed phases.

## Per-story QA

### S-1 — orchestrator entry point
- [ ] AC-1.1 verified (boot + Phase 1 entry)
- [ ] AC-1.2 verified (missing preset config exits cleanly)
- [ ] Regression: argv parse handles flag-in-any-order, double-dash, equals form

### S-2 — Phase 1: plan
- [ ] AC-2.1 verified (Plan Contract written)
- [ ] AC-2.2 verified (halt on needs_user_clarification)
- [ ] Regression: payload slug is stable across re-runs of same request

### S-3 — Phase 2a: design scaffold
- [ ] AC-3.1 verified (10 templates rendered at scale=m)
- [ ] Regression: scale=auto correctly maps from scope.size

### S-4 — Phase 2b: hand-edit templates
- [ ] AC-4.1 verified (no placeholders, no legacy marker)
- [ ] AC-4.2 verified (requirement-format-guard passes)
- [ ] Regression: hand-edit on xs scale doesn't try to edit skipped templates

### S-5 — Phase 2c: mint tickets
- [ ] AC-5.1 verified (N tickets minted with full traceability)
- [ ] AC-5.2 verified (all in ready_for_execution bucket)
- [ ] Regression: bucket-bleed guard satisfied (explicit --sprint)

### S-6 — Phase 3: execute
- [ ] AC-6.1 verified (continue on completed)
- [ ] AC-6.2 verified (defer on repeated_failure with COPY C-6)
- [ ] AC-6.3 verified (halt on approval_beyond_preset)
- [ ] Regression: stop_reason mapping is exhaustive (all 9 reasons explicitly handled)

### S-7 — Phase 4: release-prep
- [ ] AC-7.1 verified (aggressive + staging → ready_to_deploy, no deploy)
- [ ] AC-7.2 verified (moderate halts on release approval)
- [ ] Regression: production target NEVER auto-approves even in aggressive

### S-8 — Phase 5: retrospective
- [ ] AC-8.1 verified (retro.yaml exists, skeleton fallback OK)
- [ ] Regression: retro --no-synth scenario doesn't halt the orchestrator

### S-9 — halt-report writer
- [ ] AC-9.1 verified (file exists with all schema fields)
- [ ] AC-9.2 verified (TR-4 event row references halt-report path)
- [ ] Regression: file path matches `paths.sprintFullReports/<SP-id>/halt-<ISO>.md` (no PowerShell-unfriendly chars)

### S-10 — final-report writer
- [ ] AC-10.1 verified (sprint-full-report.md with timeline)
- [ ] Regression: report renders even when N=0 tickets minted (edge case)

### S-11 — autonomy preset schema
- [ ] AC-11.1 verified (3 default presets pass schema)
- [ ] AC-11.2 verified (malformed preset rejected with clear error)
- [ ] Regression: `hard_ceilings[]` is read-only — attempt to override is rejected

### S-12 — default presets config
- [ ] AC-12.1 verified (all 3 presets validate, hard_ceilings identical)
- [ ] AC-12.2 verified (moderate excludes release/production/paid approvals)
- [ ] Regression: aggressive preset does NOT include `production_release_approval`

### S-13 — path registry additions
- [ ] AC-13.1 verified (path-guard passes, doctor resolves both keys)
- [ ] Regression: paths-coverage doc updated if applicable

### S-14 — cost-estimate halt gate
- [ ] AC-14.1 verified (halt on threshold breach)
- [ ] AC-14.2 verified (--cost-acknowledged raises 2× for this run only)
- [ ] Regression: cost counter persists across phases within one run

### S-15 — beta consultation cadence
- [ ] AC-15.1 verified (4 boundary consultations in adhoc mode)
- [ ] AC-15.2 verified (ESCALATE halts)
- [ ] Regression: solo mode does NOT invoke Beta (no events emitted)

### S-16 — skill body
- [ ] AC-16.1 verified (documents all inputs/COPY/TRACE/phases)

### S-17 — AUTONOMY doc
- [ ] AC-17.1 verified (plain-English, includes custom preset example)

### S-18 — workflow + OVERVIEW updates
- [ ] AC-18.1 verified (front-door positioning + decision tree)

### S-19 — integration test harness
- [ ] AC-19.1-19.5 verified (all 5 scenarios pass)
- [ ] Regression: test harness doesn't leak temp files to .claude/project/

### S-20 — branch protection guard
- [ ] AC-20.1 verified (refuses on main, allows on feature)
- [ ] Regression: detached HEAD edge case handled (not main but not safe either)

## Cross-cutting QA

- [ ] Lint passes (eslint/prettier on full.js)
- [ ] Typecheck passes if applicable
- [ ] All 14 Edit|Write hooks exit 0 against synthetic /sprint:full file edits
- [ ] No new console errors in golden path xs run
- [ ] TRACE events (TR-1..TR-11) all fire as documented
- [ ] COPY matches `copy.md` byte-for-byte (no paraphrasing)
- [ ] INPUTS handle validation per `inputs.md`
- [ ] Routing trace coverage passes for SP-20260518-001 at release time
- [ ] No regression in /sprint:plan, /sprint:design, /sprint:execute, /sprint:release, /sprint:retrospective when invoked directly (orchestrator is composition-only)
- [ ] Path-lint passes on all new files (no literal paths)

## External service QA

- [ ] No new ESDs introduced.
- [ ] No `secret: true` env-var values appear in any tracked file.
- [ ] Existing dispatch-agent route + routing trace unchanged.

## Documentation scaling

This plan is the `documentation_scale: m` cut. Tests cover the 5 halt scenarios + 1 happy path. xl scope (per scope_variants.expanded) would add: auto-deploy gate tests, retro-action-item-to-ticket promotion tests, per-ticket Beta rollup tests.
