# Acceptance Criteria — Sprint Goal Verification

**Sprint:** `SP-20260518-007`
**PRD:** `prd.md`

> Each AC is a testable statement. Sprint A dogfoods the `verified_by:` linkage convention it introduces. Two accepted forms:
> - `verified_by: <test-file>::<test-name>` (executable)
> - `verified_by: not_applicable — <justification>` (skipped)

## S-1.1 — Plan Contract `goal_verification` block

- **AC-1.1.1** — Given a Plan Contract written by `scripts/sprint/plan.js` after Sprint A ships, when the operator omits `goal_verification` from the payload, then the script writes the contract with no `goal_verification` field present (additive/optional preserved).
  verified_by: tests/regression/SP-20260518-007/plan-contract-omit-goal-verification.test.js::test_plan_contract_omits_goal_verification_field
- **AC-1.1.2** — Given a payload that includes `goal_verification` with `reproduction: not_applicable` and an empty `justification`, when `scripts/sprint/plan.js` writes the contract, then `scripts/sprint/validate.js` reports the contract as invalid (empty justification = same as missing).
  verified_by: tests/regression/SP-20260518-007/plan-contract-empty-justification.test.js::test_empty_justification_treated_as_missing

## S-1.2 — `regression-fixture.schema.json` definition

- **AC-1.2.1** — Given `schemas/sprint/regression-fixture.schema.json` exists, when `node scripts/sprint/validate.js` loads it, then it parses successfully and registers `$id: warpos/sprint/regression-fixture/v1`.
  verified_by: tests/regression/SP-20260518-007/regression-fixture-schema-loads.test.js::test_regression_fixture_schema_parses
- **AC-1.2.2** — Given a fixture YAML with all required fields, when validated against the schema, then validation passes; given the same with `reproduction_kind: not_applicable` and an empty `justification`, validation fails.
  verified_by: tests/regression/SP-20260518-007/regression-fixture-valid-and-invalid.test.js::test_valid_fixture_passes_and_empty_justification_fails

## S-1.3 — `paths.sprintRegressionCorpus` registration

- **AC-1.3.1** — Given `.claude/paths.json`, when read, then it contains `"sprintRegressionCorpus": "tests/regression"`.
  verified_by: tests/regression/SP-20260518-007/paths-sprintregressioncorpus.test.js::test_paths_json_has_sprint_regression_corpus
- **AC-1.3.2** — Given `scripts/hooks/lib/paths.js` is required, when its exported PATHS object is read, then it exposes the same `sprintRegressionCorpus` value (in lockstep with `.claude/paths.json`).
  verified_by: tests/regression/SP-20260518-007/paths-sprintregressioncorpus.test.js::test_hookslib_paths_has_sprint_regression_corpus_in_lockstep

## S-2.1 — AC `verified_by:` linkage convention

- **AC-2.1.1** — Given `framework/templates/sprint/requirements/acceptance-criteria.md.tmpl`, when read, then it contains an explanatory block documenting both accepted forms of `verified_by:`.
  verified_by: tests/regression/SP-20260518-007/ac-template-documents-verified-by.test.js::test_ac_template_documents_verified_by_convention
- **AC-2.1.2** — Given a populated acceptance-criteria.md for any active sprint, when `scripts/sprint/check-ac-coverage.js` parses it, then every AC line that begins with `**AC-` is recognized as either having a `verified_by:` link, a `not_applicable` marker, or being unlinked.
  verified_by: tests/regression/SP-20260518-007/ac-coverage-parses-three-states.test.js::test_ac_coverage_recognizes_three_linkage_states

## S-2.2 — `/sprint:design` fixture gate

- **AC-2.2.1** — Given a Plan Contract WITHOUT `goal_verification`, when `/sprint:design` advances the sprint, then design proceeds normally (gate is fully gated on the contract field — backward-compat preserved).
  verified_by: tests/regression/SP-20260518-007/design-gate-backcompat.test.js::test_design_advances_when_goal_verification_absent
- **AC-2.2.2** — Given a Plan Contract WITH `goal_verification.reproduction: executable` and ACs missing `verified_by:`, when `/sprint:design` runs, then it refuses to set status to `designed`, exits non-zero, and emits a message naming the ACs missing linkage.
  verified_by: tests/regression/SP-20260518-007/design-gate-refuses-missing-linkage.test.js::test_design_refuses_when_ac_missing_verified_by
- **AC-2.2.3** — Given a Plan Contract WITH `goal_verification.reproduction: not_applicable` and a non-empty `justification`, when `/sprint:design` runs, then design proceeds (the `not_applicable` path is honored when justification is present).
  verified_by: tests/regression/SP-20260518-007/design-gate-allows-not-applicable.test.js::test_design_allows_not_applicable_with_justification

## S-2.3 — `/sprint:release` cited-test executor

- **AC-2.3.1** — Given a sprint with cited tests under `tests/regression/<SP-id>/` and all tests passing, when `scripts/sprint/release.js check` runs, then it reports `acceptance_criteria_satisfied: true` and lists each cited test with `status: passed`.
  verified_by: tests/regression/SP-20260518-007/release-gate-all-passing.test.js::test_release_gate_passes_when_all_cited_tests_pass
- **AC-2.3.2** — Given any cited test fails (exit code != 0 with parseable per-case output), when `release.js check` runs, then it reports `acceptance_criteria_satisfied: false` and the release status remains in `preparing` (does not advance to `approval_pending`).
  verified_by: tests/regression/SP-20260518-007/release-gate-fail-closed.test.js::test_release_gate_fails_closed_on_test_failure
- **AC-2.3.3** — Given a cited test with unparseable output (no recognizable per-case lines), when `release.js check` runs, then the per-test status is `inconclusive`, the gate blocks the release, and the message instructs the operator to record a decision-ledger override.
  verified_by: tests/regression/SP-20260518-007/release-gate-inconclusive.test.js::test_release_gate_inconclusive_on_unparseable_output
- **AC-2.3.4** — Given an `inconclusive` test and an operator decision-ledger override row matching the sprint + test, when `release.js check` runs again, then the gate honors the override and advances.
  verified_by: tests/regression/SP-20260518-007/release-gate-override.test.js::test_release_gate_honors_decision_ledger_override
- **AC-2.3.5** — Given a cited test file that does NOT exist on disk (`ENOENT`), when `release.js check` runs, then the per-test status is `fail` (NOT `inconclusive`); the rename/delete bypass class is closed. Beta-flagged stop-the-bus (2026-05-18 design review).
  verified_by: tests/regression/SP-20260518-007/release-gate-enoent-is-fail.test.js::test_release_gate_enoent_is_fail_not_inconclusive

## S-3.1 — `/check:ac-coverage` skill + helper

- **AC-3.1.1** — Given `scripts/sprint/check-ac-coverage.js` exists, when run with no flags against a sprint, then it emits a prose report listing each AC's linkage state (`executable`, `not_applicable`, `missing`) and exit code 0 if no `missing`, else 1.
  verified_by: tests/regression/SP-20260518-007/check-ac-coverage-prose.test.js::test_check_ac_coverage_emits_prose_and_correct_exit_code
- **AC-3.1.2** — Given the same with `--json`, then the output is a machine-readable JSON object matching `{ sprint_id, total_acs, executable, not_applicable, missing, details[] }`.
  verified_by: tests/regression/SP-20260518-007/check-ac-coverage-json.test.js::test_check_ac_coverage_json_output_shape
- **AC-3.1.3** — Given `.claude/commands/check/ac-coverage.md` exists, when read, then it follows the same skill-body conventions as other `/check:*` skills (frontmatter with `user-invocable: true`, sections for Input/Output/Empty-state/Implementation).
  verified_by: tests/regression/SP-20260518-007/check-ac-coverage-skill-body.test.js::test_check_ac_coverage_skill_body_conventions

## S-4.1 — `/linters:run` wiring for `test-plan-honors-registry-primary.js`

- **AC-4.1.1** — Given `scripts/linters/run.js` is updated, when `node scripts/linters/run.js --list` runs, then the output includes a line for `test-plan-honors-registry-primary` (or equivalently-named entry) pointing at the script under `scripts/sprint/`.
  verified_by: tests/regression/SP-20260518-007/linters-discovers-sprint-test.test.js::test_linters_run_list_includes_sprint_test_plan_honors_registry_primary
- **AC-4.1.2** — Given the discovery extension, when `node scripts/linters/run.js` runs against a corpus containing a `tests/regression/<SP-id>/something.test.js` fixture, then the fixture is NOT picked up by the linter run (corpus is excluded).
  verified_by: tests/regression/SP-20260518-007/linters-excludes-regression-corpus.test.js::test_linters_run_excludes_tests_regression_subtree

## S-5.1 — `sprint-workflow.md` reference update

- **AC-5.1.1** — Given `.claude/project/reference/sprint-workflow.md` after Sprint A ships, when read, then it contains a new heading-level section describing `goal_verification`, the `verified_by:` AC convention, the cited-test ship-gate, and the `/check:ac-coverage` skill — each with a one-paragraph description.
  verified_by: tests/regression/SP-20260518-007/workflow-doc-section.test.js::test_sprint_workflow_reference_has_goal_verification_section

## S-5.2 — Retrospective annotation

- **AC-5.2.1** — Given a sprint with `goal_verification` and a populated AC linkage set, when `scripts/sprint/retrospective.js` renders the retro report, then a "Goal verification status" section appears with counts (executable / not_applicable / missing). No scoring, no blocking.
  verified_by: tests/regression/SP-20260518-007/retro-surfaces-verification.test.js::test_retro_surfaces_goal_verification_counts

## S-5.3 — `/sprint:full` autonomy preset note

- **AC-5.3.1** — Given `.claude/agents/00-alex/.system/policy/sprint-full-autonomy.json` after Sprint A ships, when read, then the `moderate` preset description includes a phrase mentioning the design-time fixture gate (so operators see it inline at preset selection).
  verified_by: tests/regression/SP-20260518-007/sprint-full-preset-note.test.js::test_sprint_full_moderate_preset_documents_fixture_gate

## S-6.1 — Skill body updates

- **AC-6.1.1** — Given the four sprint skill bodies (`.claude/commands/sprint/{plan,design,release,execute}.md`) after Sprint A ships, when each is read, then each contains at least one paragraph referencing `goal_verification` (plan), the design-time gate (design), the cited-test executor (release), or the AC linkage convention (execute).
  verified_by: tests/regression/SP-20260518-007/sprint-skill-bodies-mention-convention.test.js::test_each_sprint_skill_body_mentions_goal_verification
