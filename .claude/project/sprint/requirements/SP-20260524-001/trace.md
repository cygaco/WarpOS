<!-- requirement-format-legacy -->
# TRACE Requirements — Install fixture CI matrix

**Sprint:** `SP-20260524-001`
**PRD:** `prd.md`

> Events emitted by the matrix runner to `paths.eventsFile` for telemetry + future analysis. Each event names the scenario it pertains to.

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| operator runs matrix | R-1 | S-1 | C-1,C-2 | IN-1,IN-2,IN-4 | — | T-… | scripts/warpos/test-install-matrix.js | self | — | — |
| matrix runs scenario 1 | R-2 | S-2 | C-2,C-3,C-4 | IN-2 | — | T-… | scripts/warpos/test-install-matrix.js#scenario1 | self | — | — |
| matrix runs scenario 2 | R-3 | S-3 | C-2,C-3,C-4 | IN-2 | — | T-… | scripts/warpos/test-install-matrix.js#scenario2 | self | — | — |
| matrix runs scenario 3 | R-4 | S-4 | C-2,C-3,C-4 | IN-2 | — | T-… | scripts/warpos/test-install-matrix.js#scenario3 | self | — | — |
| matrix runs scenario 4 | R-5,R-7 | S-5,S-7 | C-2,C-3,C-4,C-6 | IN-2 | — | T-… | scripts/warpos/test-install-matrix.js#scenario4 | self | — | — |
| matrix runs scenario 5 | R-6 | S-6 | C-2,C-3,C-4 | IN-2 | — | T-… | scripts/warpos/test-install-matrix.js#scenario5 | self | — | — |
| matrix emits JSON | R-8 | S-8 | — | IN-3 | — | T-… | scripts/warpos/test-install-matrix.js#jsonReport | self | — | — |
| meta-test injection | R-10 | S-10 | C-7 | IN-5 | — | T-… | scripts/warpos/test-install-matrix.js#injectRegression | self | — | — |

## TR-1 — `install_matrix_start`

**Event:** `install_matrix_start`
**When:** When `scripts/warpos/test-install-matrix.js` begins execution.
**Captured fields:** `scenarios_requested`, `fixture_root`, `json_mode`, `inject_regression`, `started_at`
**Linked requirement:** `R-1`
**Linked story:** `S-1`
**Why we capture this:** Lets later analysis correlate matrix runs with framework changes and detect flake patterns.

## TR-2 — `install_matrix_scenario_completed`

**Event:** `install_matrix_scenario_completed`
**When:** When a single scenario finishes (pass or fail).
**Captured fields:** `scenario_id`, `scenario_name`, `status`, `duration_ms`, `assertion_count`, `failed_assertions[]`
**Linked requirement:** `R-2`..`R-6`
**Linked story:** `S-2`..`S-6`
**Why we capture this:** Per-scenario telemetry for flake detection + runtime drift monitoring.

## TR-3 — `install_matrix_done`

**Event:** `install_matrix_done`
**When:** When the matrix finishes all requested scenarios.
**Captured fields:** `total_scenarios`, `pass`, `fail`, `total_duration_ms`, `exit_code`
**Linked requirement:** `R-8`, `R-9`
**Linked story:** `S-8`, `S-9`
**Why we capture this:** Aggregate signal for CI gates + ROADMAP retrospection.

## TR-4 — `install_matrix_meta_caught`

**Event:** `install_matrix_meta_caught`
**When:** When a planted regression is correctly detected by the matrix in meta-test mode.
**Captured fields:** `injection_name`, `scenario_id`, `caught_assertion`, `ts`
**Linked requirement:** `R-10`
**Linked story:** `S-10`
**Why we capture this:** Confirms the matrix actually does its job; a missing event for an expected injection signals the matrix has regressed.
