# INPUT Requirements — /sprint:retrospective skill — close-of-sprint reflection

**Sprint:** `SP-20260513-004`
**PRD:** `prd.md`

> INPUTS captures fields, forms, data entry, validation, and user/system
> inputs. Each entry should be testable.

## IN-1 — `--sprint <SP-id>` flag (linked story `S-3`)

| Property | Value |
|---|---|
| Field | `--sprint` |
| Type | string |
| Required | no (defaults to `paths.sprintActiveRegistry#primary`) |
| Source | user |
| Validation | Matches `^SP-[0-9]{8}-[0-9]{3}$`. Must exist in registry **or** in `paths.sprintHistory/`. |
| Failure mode | Unknown id → exit non-zero with COPY `C-6` "unknown sprint" message. Malformed id → exit code `2` (bad usage). |

**Notes:** Mirrors the shared `--sprint` convention across sprint
skills (v0.2). Sets `process.env.WARPOS_SPRINT_ID` as a side effect so
the logger and decision-ledger auto-tag rows.

## IN-2 — `--no-synth` flag (linked story `S-7`)

| Property | Value |
|---|---|
| Field | `--no-synth` |
| Type | boolean (presence flag) |
| Required | no (defaults to `false` — synthesis on) |
| Source | user |
| Validation | None — presence flag. |
| Failure mode | n/a — flag is always safe. |

**Notes:** When present, the LLM call is skipped entirely and a
skeleton retro with `<TO FILL>` placeholders is written. Operator
amends by hand. Skeleton still validates against the schema.

## IN-3 — `--force` flag (linked story `S-2`)

| Property | Value |
|---|---|
| Field | `--force` |
| Type | boolean (presence flag) |
| Required | no (defaults to `false`) |
| Source | user |
| Validation | None. |
| Failure mode | Without `--force`, an existing retro at the target path → exit code `4` with COPY `C-5`. |

**Notes:** Idempotent escape hatch. With `--force`, the existing
`retro.yaml` + `retro.md` are overwritten in place. The registry
status transition (`closed` → `retrospected`) is itself idempotent —
re-flipping a `retrospected` entry to `retrospected` is a no-op.

## IN-4 — `--review-only` flag (linked story `S-3`)

| Property | Value |
|---|---|
| Field | `--review-only` |
| Type | boolean (presence flag) |
| Required | no (defaults to `false`) |
| Source | user |
| Validation | Mutually exclusive with `--force`. |
| Failure mode | If both `--review-only` and `--force` are passed → exit code `2` (bad usage). |

**Notes:** Read-only mode — prints the existing retro to stdout
without regenerating. Useful for cross-sprint inspection. Does NOT
update the registry.

## IN-5 — `--no-plan-contract` graceful-degradation flag (linked story `S-2`)

| Property | Value |
|---|---|
| Field | `--no-plan-contract` |
| Type | boolean (presence flag) |
| Required | no (defaults to `false`) |
| Source | user |
| Validation | None. |
| Failure mode | If absent and no Plan Contract is found → exit code `2` with COPY `C-3`. If present and no Plan Contract is found → the `plan_quality_actual` section is filled with `<no plan contract>` markers and the rest of the retro proceeds. |

**Notes:** Escape hatch for retros on legacy or imported sprints that
predate Plan Contracts. Not a primary flag.

## IN-6 — Tracker artifacts (linked story `S-2`)

| Property | Value |
|---|---|
| Field | Plan Contract + tickets (by bucket: `done`, `deferred`, `abandoned`, `reopened`) + issues + decisions + checkpoints + release record + `sprint-history.yaml` |
| Type | system (read-only file inputs) |
| Required | Plan Contract is required unless `--no-plan-contract`. The rest are best-effort: missing files produce empty arrays in the retro, not errors. |
| Source | system (paths registry resolves locations) |
| Validation | Each file is read with the existing `scripts/sprint/fs.js#readYamlMaybe` (fail-open). Plan Contract is validated against `plan-contract.schema.json` if present. |
| Failure mode | Missing Plan Contract → COPY `C-3` unless `--no-plan-contract`. Malformed YAML → exit code `1`. |

**Notes:** Pulling from many files is the whole point — the retro is a
synthesis of state already on disk.

## IN-7 — Retro YAML body (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `retro.yaml` body |
| Type | YAML document |
| Required | yes — must match `sprint-retrospective.schema.json` exactly |
| Source | system (script-generated; operator-amended) |
| Validation | `scripts/sprint/validate.js` against the new schema. `additionalProperties: false` is enforced. |
| Failure mode | Validation failure → script exits code `1` and the partial file is left on disk under `.partial` suffix for inspection. |

**Notes:** Sign-off fields (`signed_off_by`, `signed_off_at`) are
optional in the schema but populated by the script as `alpha` +
current ISO timestamp by default — operator can amend.

## IN-8 — `--retry-synth` flag (linked story `S-6`, `S-7`)

| Property | Value |
|---|---|
| Field | `--retry-synth` CLI flag |
| Type | boolean (presence-only, no value) |
| Required | no — only relevant after an initial synthesis failure produced a skeleton retro |
| Source | operator (CLI flag) |
| Validation | Only valid when an existing `retro.yaml` at `paths.sprintHistory/<sprint-id>/retro.yaml` has `synthesis_mode: skeleton`. Otherwise → COPY `C-3` adapted message: "no skeleton retro to retry-synth on; use `/sprint:retrospective --sprint <id>` instead". |
| Failure mode | Synthesis failure on retry behaves identically to initial synthesis failure: emit `C-7`, leave the existing skeleton retro in place, exit `0`. |

**Notes:** Wires the C-7 fallback message ("Re-run with `--retry-synth`")
to a real CLI input. Without IN-8 the flag is a phantom — C-7 would
reference a non-flag. β fix-pre-mint directive (2026-05-13).
