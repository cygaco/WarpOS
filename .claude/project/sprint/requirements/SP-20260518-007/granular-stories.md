# Granular Stories — Sprint Goal Verification

**Sprint:** `SP-20260518-007`
**High-level stories:** `high-level-stories.md`

> Each `S-N` produces ≈ one ticket during `/sprint:design`.

## S-1.1 — Plan Contract `goal_verification` block

**As** a sprint operator,
**I want** `plan-contract.schema.json` to accept an optional `goal_verification` block (origin_evidence, bug_classes_closed, reproduction, justification, cited_tests, fixture_path),
**So that** every new Plan Contract has a place to record the executable-goal contract without breaking pre-existing contracts.

Acceptance criteria: `AC-1.1.1`, `AC-1.1.2`.
Linked: `H-1`, `R-1`.

## S-1.2 — `regression-fixture.schema.json` definition

**As** a fixture author,
**I want** a typed record format for a regression fixture (`schemas/sprint/regression-fixture.schema.json`),
**So that** the `<test-file>::<test-name>` cite-format and the per-sprint corpus structure are machine-validatable, not folklore.

Acceptance criteria: `AC-1.2.1`, `AC-1.2.2`.
Linked: `H-1`, `R-2`.

## S-1.3 — `paths.sprintRegressionCorpus` registration

**As** a code path reading the corpus,
**I want** `.claude/paths.json` AND `scripts/hooks/lib/paths.js` to both expose `sprintRegressionCorpus = "tests/regression"`,
**So that** path-guard hook + ship-gate + `/check:ac-coverage` agree on the corpus root — no stale-literal drift (LRN-2026-04-29).

Acceptance criteria: `AC-1.3.1`, `AC-1.3.2`.
Linked: `H-1`, `R-3`.

## S-2.1 — AC `verified_by:` linkage convention

**As** an AC author,
**I want** the `acceptance-criteria.md.tmpl` template to document the `verified_by: <test-file>::<test-name>` (or `verified_by: not_applicable — <justification>`) annotation,
**So that** every AC in every future sprint emits the linkage and the audit tools can parse it.

Acceptance criteria: `AC-2.1.1`, `AC-2.1.2`.
Linked: `H-2`, `R-4`.

## S-2.2 — `/sprint:design` fixture gate

**As** a sprint designer,
**I want** `scripts/sprint/design.js` to refuse advancing the sprint to `designed` when `plan_contract.goal_verification` is present and ACs lack `verified_by:` (or `reproduction = executable` and no fixture exists),
**So that** the gate is enforced at design-time, not discovered at release.

Acceptance criteria: `AC-2.2.1`, `AC-2.2.2`, `AC-2.2.3`.
Linked: `H-2`, `R-5`.

## S-2.3 — `/sprint:release` cited-test executor

**As** a release approver,
**I want** `scripts/sprint/release.js check` to enumerate cited tests, execute each, and fail-closed (or mark `inconclusive` on unparseable output with operator override),
**So that** "AC satisfied" reflects the test result, not operator memory.

Acceptance criteria: `AC-2.3.1`, `AC-2.3.2`, `AC-2.3.3`, `AC-2.3.4`.
Linked: `H-3`, `R-6`.

## S-3.1 — `/check:ac-coverage` skill + helper

**As** a maintainer,
**I want** `/check:ac-coverage` (skill body + `scripts/sprint/check-ac-coverage.js`) to scan active sprints and report linkage + executability per AC,
**So that** coverage drift surfaces before the ship-gate fires.

Acceptance criteria: `AC-3.1.1`, `AC-3.1.2`, `AC-3.1.3`.
Linked: `H-4`, `R-7`.

## S-4.1 — `/linters:run` wiring for `test-plan-honors-registry-primary.js`

**As** a future-me catching lint failures,
**I want** `scripts/linters/run.js` to discover `scripts/sprint/test-*.js` (excluding `tests/regression/**`),
**So that** the existing `test-plan-honors-registry-primary.js` runs on every lint pass.

Acceptance criteria: `AC-4.1.1`, `AC-4.1.2`.
Linked: `H-5`, `R-8`.

## S-5.1 — `sprint-workflow.md` reference update

**As** an operator reading the canonical workflow doc,
**I want** `paths.sprintReference` to carry a new section on `goal_verification` + the AC linkage convention + ship-gate behavior + `/check:ac-coverage`,
**So that** the convention is discoverable from the same place operators already read.

Acceptance criteria: `AC-5.1.1`.
Linked: `H-6`, `R-9`.

## S-5.2 — Retrospective annotation

**As** a sprint retro reader,
**I want** `scripts/sprint/retrospective.js` to surface per-AC verification status (executable/not_applicable/missing) in the retro report,
**So that** patterns of coverage drift become visible across sprints.

Acceptance criteria: `AC-5.2.1`.
Linked: `H-6`, `R-10`.

## S-5.3 — `/sprint:full` autonomy preset note

**As** an operator launching `/sprint:full --preset moderate`,
**I want** the preset description to explicitly note the new design-time fixture gate,
**So that** I'm not surprised when a moderate-preset autonomous run halts at design.

Acceptance criteria: `AC-5.3.1`.
Linked: `H-6`, `R-11`.

## S-6.1 — Skill body updates (`/sprint:plan`, `/sprint:design`, `/sprint:release`, `/sprint:execute`)

**As** an operator running any per-phase sprint skill,
**I want** the skill body to mention the `goal_verification` block, the AC linkage convention, and (for release) the cited-test executor,
**So that** the convention is discoverable from the skill body — not just the reference doc.

Acceptance criteria: `AC-6.1.1`.
Linked: `H-6`, `R-9`.
