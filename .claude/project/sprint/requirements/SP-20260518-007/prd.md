# PRD — Sprint Goal Verification — regression corpus, AC linkage, ship-gate, /check:ac-coverage

**Sprint:** `SP-20260518-007`
**Plan Contract:** `PC-20260518-0011`
**Status:** draft
**Documentation scale:** `m`

## Outcome

Every shipped sprint carries durable, executable proof that the originally-reported failure is gone and would still be detected if it regressed. Sprint quality stops depending on operator memory and the English-checkbox AC discipline; it becomes a property the tracker enforces. Cross-sprint regressions caught by `/linters:run` (or the next sprint's ship-gate) instead of by user reports weeks later.

## Context

### Original Request

> Add Sprint Goal Verification — every sprint ships a regression fixture under `tests/regression/<sprint-id>/`, AC entries link `verified_by: <test-file>::<test-name>`, `/sprint:release` ship-gate runs all cited tests, new `/check:ac-coverage` skill audits linkage on demand. Also wire `scripts/sprint/test-plan-honors-registry-primary.js` into `/linters:run`.

### Interpreted Intent

Today's QA plans verify ACs with English checkboxes; there's no executable link between the user's original bug and a fixture that asserts the fix. Sprint A closes that gap. Every sprint must produce at least one test that would have failed before the sprint started and passes after.

To enforce that, this sprint (a) adds a `goal_verification` block to the Plan Contract and propagates it through `current-sprint`, (b) defines a new `regression-fixture` schema and a per-sprint corpus under `tests/regression/<SP-id>/`, (c) introduces an AC linkage convention (`verified_by: <test-file>::<test-name>`), (d) makes `/sprint:design` refuse to advance without a fixture (or an explicit `not_applicable` justification for research/docs/refactor sprints), (e) makes `/sprint:release` ship-gate run all cited tests, (f) ships a read-only `/check:ac-coverage` audit skill, (g) wires the existing `scripts/sprint/test-plan-honors-registry-primary.js` regression test into `/linters:run` so the `plan.js` drift bug from 2026-05-18 cannot silently recur. Closed/retrospected sprints are exempt — no backfill, no retroactive enforcement.

### Beta directives applied (logged `EVT-sprint-A-plan-1779138833023`)

- `goal_verification.reproduction` = `not_applicable` is **allowed** for research/docs/pure-refactor sprints, paired with a **non-empty** justification field; empty justification is treated as missing (design refuses).
- Ship-gate behavior on **unparseable test output** defaults to `inconclusive`, requires an operator override logged to `paths.decisionLedger`, and does **not** ship an `--allow-coverage-gap` flag in v1.
- `/sprint:full` autonomy presets (`sprint-full-autonomy.json`) get an **explicit** note on the `moderate` preset documenting the new design-time fixture gate. No silent inheritance.
- `scripts/hooks/lib/paths.js` must mirror the new `sprintRegressionCorpus` key in lockstep with `.claude/paths.json` (LRN-2026-04-29 stale-literal class).
- Downstream-project compatibility: the design.js refusal is **gated** on `plan_contract.goal_verification` presence so sprints planned before Sprint A ships do not break on their next `/sprint:design` call post-`/warp:update`.

### Current Behavior

Today AC markdown is the only acceptance artifact (template at `framework/templates/sprint/requirements/acceptance-criteria.md.tmpl` uses `AC-N.M` numbering with prose Given/When/Then). No `verified_by` linkage. `/sprint:release` Step 2 checks `acceptance_criteria_satisfied` as a boolean — operator discipline, not execution. `/sprint:release` ship-gate does not execute any sprint-specific tests; routing/coverage checks happen but are independent of AC-level fixtures. `/linters:run` discovers `scripts/lint-*.js` and `package.json#lint*` — `test-plan-honors-registry-primary.js` (placed under `scripts/sprint/`) is not currently auto-discovered, and there is **no root `package.json`** in this repo so the `package.json#lint:*` discovery path is dead.

### Desired Behavior

Every Plan Contract for an active sprint carries a `goal_verification` block recording the originally-reported failure (`origin_evidence`), the `bug_classes_closed`, and a contract that a regression fixture under `tests/regression/<SP-id>/` will exist by `/sprint:design` exit. Each AC in `acceptance-criteria.md` links `verified_by: <test-file>::<test-name>`. `/sprint:design` refuses to advance unless every AC is linked (or marked `not_applicable` + justification). `/sprint:release` ship-gate enumerates cited tests, runs each, and fails closed on any failure; unparseable output is `inconclusive` and requires an operator override entered into the decision-ledger. `/check:ac-coverage` reports linkage + execution status on demand. `scripts/sprint/test-plan-honors-registry-primary.js` runs as part of `/linters:run`, catching the `plan.js` drift bug class at lint-time.

## Requirements

> `R-N` ids per `scripts/hooks/requirement-format-guard.js`.

- `R-1` — **goal_verification schema (plan-contract).** `plan-contract.schema.json` gains an additive optional `goal_verification` block: `{ origin_evidence (string), bug_classes_closed (string[]), reproduction (enum: executable|not_applicable), justification (string, required when reproduction=not_applicable), cited_tests (array of {file, test_name}), fixture_path (string|null) }`. No schema-version bump (precedent: `current-sprint.schema.json#lane`). Block is **optional** to preserve backward compatibility with pre-Sprint-A Plan Contracts.
- `R-2` — **regression-fixture schema (new).** `schemas/sprint/regression-fixture.schema.json` defines the per-fixture record: `{ schema: "warpos/sprint/regression-fixture/v1", id, sprint_id, origin (bug_id|ticket_id|user_report), bug_classes_closed[], cited_tests[{file, test_name}], reproduction_kind (executable|not_applicable), justification (required iff not_applicable), created_at, updated_at, fixture_path }`. Stored under `paths.sprintRegressionCorpus/<SP-id>/<RF-id>.yaml`.
- `R-3` — **paths.sprintRegressionCorpus.** New key in `.claude/paths.json` with value `tests/regression`. Mirrored in `scripts/hooks/lib/paths.js` so path-guard hook and ship-gate read the same source of truth. Per CLAUDE.md §Paths, no literal `"tests/regression"` strings outside these two files.
- `R-4` — **AC linkage convention.** `acceptance-criteria.md.tmpl` updated so each AC carries a `verified_by:` annotation. Two forms accepted: `verified_by: <test-file>::<test-name>` (executable) or `verified_by: not_applicable — <justification>` (skipped). Parser-friendly format that survives prose surrounding it.
- `R-5` — **`/sprint:design` fixture gate.** `scripts/sprint/design.js` refuses to advance (status → `designed` blocked) when `plan_contract.goal_verification` is present and any AC lacks a `verified_by:` annotation, OR when `reproduction = executable` and no fixture exists under `paths.sprintRegressionCorpus/<SP-id>/`. Gate is **fully gated** on `plan_contract.goal_verification` existing — sprints planned before this ships are unaffected.
- `R-6` — **`/sprint:release` ship-gate cited-test executor.** `scripts/sprint/release.js check` enumerates cited tests from the AC markdown + the fixture records, executes each (`node <file>`), parses pass/fail per case, and aggregates. Fail-closed on any failure. Unparseable output → `inconclusive` per cited test; release blocked unless operator records a decision-ledger override (no flag in v1).
- `R-7` — **`/check:ac-coverage` skill + helper.** `.claude/commands/check/ac-coverage.md` (skill body) + `scripts/sprint/check-ac-coverage.js` (helper). Read-only. Scans active sprints, reports per-AC linkage + per-fixture executability status. Prose default; `--json` flag for machine consumption.
- `R-8` — **`/linters:run` wiring for `test-plan-honors-registry-primary.js`.** Extend `scripts/linters/run.js` discoverer to pick up `scripts/sprint/test-*.js` (matching the existing `scripts/lint-*.js` convention but namespaced). `tests/regression/<SP-id>/` is **explicitly excluded** from this discovery — those fixtures run via the ship-gate only.
- `R-9` — **`sprint-workflow.md` reference doc updates.** New section in `paths.sprintReference` documenting the goal_verification convention, AC linkage syntax, ship-gate behavior, and the `/check:ac-coverage` skill. Updated skill bodies for `/sprint:plan`, `/sprint:design`, `/sprint:release`, `/sprint:execute` to mention the convention.
- `R-10` — **Retrospective annotation (read-only).** `scripts/sprint/retrospective.js` surfaces per-AC verification status (executable/not_applicable/missing) in the retro report. No scoring, no blocking — read-only annotation only.
- `R-11` — **`/sprint:full` autonomy preset note.** `sprint-full-autonomy.json` updated so the `moderate` preset carries a documented note that the design-time fixture gate now applies. No behavior change to the preset itself — operators get a heads-up via the preset description.

## Non-Goals

- Canaries / `scripts/canary/` / `/canary:add` skill — separate workstream, deferred per DUMP.md.
- Golden-path harness convention — separate workstream, deferred per DUMP.md.
- Backfilling `goal_verification` for closed sprints — closed sprints stay opt-out.
- Coupling the ship-gate to `diff_review` (currently decorative; do not add a new dependency).
- Adoption of a canonical test runner — bespoke `node` scripts remain the convention.
- Hooking `/check:ac-coverage` into `/check:all` as a default — separate, lower-risk add for later.

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| `schemas/sprint/plan-contract.schema.json` | verified_from_repo |
| `schemas/sprint/current-sprint.schema.json` | verified_from_repo |
| `schemas/sprint/regression-fixture.schema.json` (new) | verified_from_repo |
| `scripts/sprint/plan.js` | verified_from_repo |
| `scripts/sprint/design.js` | verified_from_repo |
| `scripts/sprint/release.js` | verified_from_repo |
| `scripts/sprint/retrospective.js` | verified_from_repo |
| `scripts/sprint/check-ac-coverage.js` (new) | verified_from_repo |
| `.claude/commands/check/ac-coverage.md` (new) | verified_from_repo |
| `.claude/commands/sprint/{plan,design,release,execute}.md` | verified_from_repo (plan + release), inferred_from_repo (design + execute) |
| `.claude/paths.json` | verified_from_repo |
| `scripts/hooks/lib/paths.js` | unknown (must inspect during execution) |
| `paths.sprintReference` (`.claude/project/reference/sprint-workflow.md`) | verified_from_repo |
| `scripts/sprint/test-plan-honors-registry-primary.js` | verified_from_repo |
| `scripts/linters/run.js` | verified_from_repo |
| `tests/regression/` (new dir) | verified_from_repo (absent) |
| `framework/templates/sprint/requirements/acceptance-criteria.md.tmpl` | verified_from_repo |
| `.claude/agents/00-alex/.system/policy/sprint-full-autonomy.json` | verified_from_repo (path key; content not directly read this sprint) |

## External Service Dependencies

None. Sprint A is wholly internal — schemas, helpers, skill bodies, a path key, doc updates.

## Approval Boundaries

- Production deploy of release (required per CLAUDE.md §Autonomy).
- Beta review required (Class B — Sprint A changes every future sprint's contract).

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260518-0011.yaml`
- High-level stories: `high-level-stories.md`
- Granular stories: `granular-stories.md`
- COPY: `copy.md`
- INPUTS: `inputs.md`
- TRACE: `trace.md`
- Acceptance criteria: `acceptance-criteria.md`
- QA plan: `qa-plan.md`
- Red-team plan: `redteam-plan.md`
- Release plan: `release-plan.md`
