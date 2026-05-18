# TRACE Requirements — Sprint Goal Verification

**Sprint:** `SP-20260518-007`
**PRD:** `prd.md`

> TRACE captures the observability + decision-ledger linkage layer for Sprint A. Every new mechanism that can refuse, block, or override has a TRACE entry so the audit trail is queryable.

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| DUMP.md 2026-05-18 | R-1 | S-1.1 | — | IN-1 | — | T-… | `schemas/sprint/plan-contract.schema.json`, `scripts/sprint/plan.js`, `scripts/sprint/validate.js` | `tests/regression/SP-20260518-007/plan-contract-*.test.js` | RL-… | — |
| DUMP.md 2026-05-18 | R-2 | S-1.2 | — | IN-2 | — | T-… | `schemas/sprint/regression-fixture.schema.json` | `tests/regression/SP-20260518-007/regression-fixture-*.test.js` | RL-… | — |
| DUMP.md 2026-05-18 | R-3 | S-1.3 | — | — | — | T-… | `.claude/paths.json`, `scripts/hooks/lib/paths.js` | `tests/regression/SP-20260518-007/paths-sprintregressioncorpus.test.js` | RL-… | LRN-2026-04-29 |
| DUMP.md 2026-05-18 | R-4 | S-2.1 | — | — | — | T-… | `framework/templates/sprint/requirements/acceptance-criteria.md.tmpl` | `tests/regression/SP-20260518-007/ac-template-*.test.js` | RL-… | — |
| DUMP.md 2026-05-18 | R-5 | S-2.2 | C-1, C-2 | IN-3 | — | T-… | `scripts/sprint/design.js` | `tests/regression/SP-20260518-007/design-gate-*.test.js` | RL-… | RT-008 (2026-05-18) |
| DUMP.md 2026-05-18 | R-6 | S-2.3 | C-3, C-4, C-5 | IN-5 | — | T-… | `scripts/sprint/release.js` | `tests/regression/SP-20260518-007/release-gate-*.test.js` | RL-… | — |
| DUMP.md 2026-05-18 | R-7 | S-3.1 | C-6 | IN-4 | — | T-… | `scripts/sprint/check-ac-coverage.js`, `.claude/commands/check/ac-coverage.md` | `tests/regression/SP-20260518-007/check-ac-coverage-*.test.js` | RL-… | — |
| DUMP.md 2026-05-18 | R-8 | S-4.1 | C-7 | — | — | T-… | `scripts/linters/run.js` | `tests/regression/SP-20260518-007/linters-*.test.js` | RL-… | RT-008 |
| DUMP.md 2026-05-18 | R-9 | S-5.1, S-6.1 | — | — | — | T-… | `.claude/project/reference/sprint-workflow.md`, `.claude/commands/sprint/{plan,design,release,execute}.md` | `tests/regression/SP-20260518-007/workflow-doc-*.test.js`, `tests/regression/SP-20260518-007/sprint-skill-bodies-*.test.js` | RL-… | — |
| DUMP.md 2026-05-18 | R-10 | S-5.2 | — | — | — | T-… | `scripts/sprint/retrospective.js` | `tests/regression/SP-20260518-007/retro-surfaces-verification.test.js` | RL-… | — |
| DUMP.md 2026-05-18 | R-11 | S-5.3 | — | — | — | T-… | `.claude/agents/00-alex/.system/policy/sprint-full-autonomy.json` | `tests/regression/SP-20260518-007/sprint-full-preset-note.test.js` | RL-… | — |

## TR-1 — Design-gate refusal event

**Event:** `sprint-design-fixture-gate-refused`
**When:** `scripts/sprint/design.js` exits non-zero because the fixture gate rejected an attempt to advance.
**Captured fields:** `sprint_id, missing_acs[], plan_contract_id, reproduction_kind, justification_present`
**Linked requirement:** `R-5`
**Linked story:** `S-2.2`
**Why we capture this:** Audit trail for how often the gate refuses; informs whether the not_applicable bypass is being abused. Logged to `paths.eventsFile` via `loggerLib`.

## TR-2 — Release-gate cited-test result

**Event:** `sprint-release-cited-test-result`
**When:** Each cited test the `release.js check` runs.
**Captured fields:** `sprint_id, release_id, test_file, test_name, status (pass|fail|inconclusive), elapsed_ms, exit_code`
**Linked requirement:** `R-6`
**Linked story:** `S-2.3`
**Why we capture this:** Per-test history for the ship-gate. Lets `/check:ac-coverage` surface execution status without re-running. Logged to `paths.eventsFile`.

## TR-3 — Release-gate inconclusive override

**Event:** `sprint-release-inconclusive-override`
**When:** Operator records a decision-ledger row to override an inconclusive cited test.
**Captured fields:** `sprint_id, release_id, test_file, test_name, reason, operator, ts`
**Linked requirement:** `R-6`
**Linked story:** `S-2.3`
**Why we capture this:** Beta directive (Q2): no `--allow-coverage-gap` flag in v1; the override IS the audit trail. Lives in `paths.decisionLedger` (JSONL) AND surfaced in retro annotation.

## TR-4 — `/check:ac-coverage` audit run

**Event:** `check-ac-coverage-run`
**When:** Operator invokes `/check:ac-coverage`.
**Captured fields:** `sprint_id, total_acs, executable, not_applicable, missing, exit_code, output_mode (prose|json)`
**Linked requirement:** `R-7`
**Linked story:** `S-3.1`
**Why we capture this:** Track whether operators actually use the audit skill. Informs whether `/check:all` should auto-include it later. Logged to `paths.eventsFile`.

## TR-5 — `/linters:run` sprint-test execution

**Event:** `linters-run-sprint-test`
**When:** `scripts/linters/run.js` runs a discovered `scripts/sprint/test-*.js` script.
**Captured fields:** `name, cmd, ok (bool), elapsed_ms, error (truncated)`
**Linked requirement:** `R-8`
**Linked story:** `S-4.1`
**Why we capture this:** Existing `/linters:run` already logs per-linter results; this trace just inherits that machinery. Logged via existing run.js output → `paths.eventsFile` (if configured downstream).

## TR-6 — Retro verification annotation

**Event:** `sprint-retro-verification-status`
**When:** `scripts/sprint/retrospective.js` renders the retro report.
**Captured fields:** `sprint_id, executable_count, not_applicable_count, missing_count, total`
**Linked requirement:** `R-10`
**Linked story:** `S-5.2`
**Why we capture this:** Cross-sprint pattern detection — if `missing_count > 0` ever ships, the retro has the evidence.
