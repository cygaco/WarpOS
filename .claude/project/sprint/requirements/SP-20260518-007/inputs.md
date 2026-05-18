# INPUT Requirements — Sprint Goal Verification

**Sprint:** `SP-20260518-007`
**PRD:** `prd.md`

> No user-facing form inputs (Sprint A is infrastructure). INPUTS here cover the Plan Contract payload fields, fixture YAML fields, and CLI args that humans/agents pass to the new helpers.

## IN-1 — `goal_verification` block in Plan Contract payload (linked story `S-1.1`)

| Property | Value |
|---|---|
| Field | `goal_verification` (object, optional) |
| Type | object with sub-fields: `origin_evidence (string)`, `bug_classes_closed (string[])`, `reproduction (enum: executable\|not_applicable)`, `justification (string)`, `cited_tests (array of {file, test_name})`, `fixture_path (string\|null)` |
| Required | optional at the top level; `justification` REQUIRED iff `reproduction = not_applicable`; `cited_tests` REQUIRED iff `reproduction = executable` |
| Source | sprint operator authoring the Plan Contract payload |
| Validation | `scripts/sprint/validate.js` accepts the block when present, rejects empty `justification` with `reproduction = not_applicable` |
| Failure mode | Plan Contract write fails with COPY C-10-style error pointing at the malformed sub-field |

**Notes:** Additive to `plan-contract.schema.json` — no schema-version bump. Pre-Sprint-A contracts (no `goal_verification`) remain valid.

## IN-2 — `regression-fixture.yaml` record (linked story `S-1.2`)

| Property | Value |
|---|---|
| Field | full YAML document at `tests/regression/<SP-id>/<RF-id>.yaml` |
| Type | object matching `warpos/sprint/regression-fixture/v1` |
| Required | `schema, id, sprint_id, origin, bug_classes_closed, cited_tests, reproduction_kind, created_at, updated_at, fixture_path`. `justification` REQUIRED iff `reproduction_kind = not_applicable` |
| Source | fixture author (during `/sprint:design`) |
| Validation | `scripts/sprint/validate.js` against the new schema |
| Failure mode | Design refuses to advance per `S-2.2` |

**Notes:** Fixture ids follow `RF-YYYYMMDD-NNN` (analogous to other sprint ids in `scripts/sprint/ids.js`).

## IN-3 — `--documentation-scale` flag for `/sprint:design` (linked story `S-2.2`)

| Property | Value |
|---|---|
| Field | `--documentation-scale <xs\|s\|m\|l\|xl>` (existing) |
| Type | enum |
| Required | optional (defaults to `m`) |
| Source | operator |
| Validation | existing `scripts/sprint/design.js` arg parser |
| Failure mode | unchanged |

**Notes:** Sprint A does NOT add a new flag — operators pass the same flag; the fixture gate runs regardless of scale (because Sprint A's load-bearing rule is scale-independent).

## IN-4 — `--json` flag for `/check:ac-coverage` (linked story `S-3.1`)

| Property | Value |
|---|---|
| Field | `--json` (boolean toggle) |
| Type | boolean (presence = true) |
| Required | optional (default prose output) |
| Source | operator or downstream script |
| Validation | argv parsing in `scripts/sprint/check-ac-coverage.js` |
| Failure mode | unknown flag → exit 2 (usage error), matching `/linters:run` convention |

**Notes:** Single optional flag in v1. No `--sprint <id>` flag at v1 — defaults to `paths.sprintActiveRegistry#primary`; if usage shows operators want per-sprint targeting, that's a follow-up.

## IN-5 — decision-ledger override row format (linked story `S-2.3`)

| Property | Value |
|---|---|
| Field | one row appended to `paths.decisionLedger` (JSONL) |
| Type | object: `{ ts, sprint_id, kind: "release_override_inconclusive_test", test_file, test_name, reason, operator }` |
| Required | all fields above |
| Source | operator (manual record via `node -e` or future helper) |
| Validation | `release.js check` re-reads the ledger and matches by `(sprint_id, test_file, test_name)` |
| Failure mode | no matching row → gate remains blocked with COPY C-5 message |

**Notes:** No `--allow-coverage-gap` CLI flag in v1 per Beta directive. The ledger row IS the audit trail.
