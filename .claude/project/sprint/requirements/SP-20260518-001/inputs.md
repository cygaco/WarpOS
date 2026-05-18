# INPUT Requirements — /sprint:full

**Sprint:** `SP-20260518-001`
**PRD:** `paths.sprintRequirements/SP-20260518-001/prd.md`

CLI flags + their validation + failure mode. Each entry maps to a `parseArgs` rule in `scripts/sprint/full.js`.

## IN-1 — `request` positional arg (linked story `S-1`)

| Property | Value |
|---|---|
| Field | First positional argument (no flag prefix) |
| Type | string (plain language sprint request) |
| Required | yes (unless `--resume`) |
| Source | user |
| Validation | Length ≥ 10 chars and ≤ 4000 chars. Trimmed. Empty → exit code 2 with COPY-style error. |
| Failure mode | Missing → "Usage: /sprint:full \"<request>\" [...]". Too long → reject (Plan Contract payloads have limits). |

**Notes:** Preserved verbatim into `plan_contract.source_request_verbatim` per `/sprint:plan` contract.

## IN-2 — `--autonomy <preset>` (linked story `S-11`)

| Property | Value |
|---|---|
| Field | `--autonomy` |
| Type | enum: `conservative` \| `moderate` \| `aggressive` |
| Required | no (default: `moderate`) |
| Source | user |
| Validation | Must match one of the preset names defined in `paths.sprintFullAutonomy`. Unknown preset → exit 2 with list of valid presets. |
| Failure mode | Invalid → "Unknown preset `<name>`. Valid: conservative, moderate, aggressive." |

**Notes:** Loaded at start; cached for the run. Cannot change mid-run.

## IN-3 — `--scope <variant>` (linked story `S-2`)

| Property | Value |
|---|---|
| Field | `--scope` |
| Type | enum: `minimal_safe` \| `recommended` \| `expanded` |
| Required | no (default: `recommended`) |
| Source | user |
| Validation | Must match one of the variant names defined by `/sprint:plan` Plan Contract `scope_variants`. |
| Failure mode | Invalid → "Unknown scope `<name>`. Valid: minimal_safe, recommended, expanded." |

**Notes:** Passed forward to Plan Contract construction; influences which scope_variant the Plan Contract's `interpreted_intent` reflects.

## IN-4 — `--documentation-scale <scale>` (linked story `S-3`)

| Property | Value |
|---|---|
| Field | `--documentation-scale` |
| Type | enum: `auto` \| `xs` \| `s` \| `m` \| `l` \| `xl` |
| Required | no (default: `auto`) |
| Source | user |
| Validation | Must be one of the enum values. |
| Failure mode | Invalid → "Unknown scale `<name>`." |

**Notes:** `auto` derives from `plan_contract.scope.size` per mapping in `S-3`. Passed to `design.js --documentation-scale`.

## IN-5 — `--mode <mode>` (linked story `S-15`)

| Property | Value |
|---|---|
| Field | `--mode` |
| Type | enum: `solo` \| `adhoc` |
| Required | no (default: current mode, else `adhoc`) |
| Source | user / session state |
| Validation | `oneshot` is rejected — `/sprint:full` is not for skeleton rebuilds. |
| Failure mode | `oneshot` → "Mode `oneshot` is not supported by /sprint:full. Use /mode:oneshot directly." |

**Notes:** Determines whether Beta is consulted at phase boundaries.

## IN-6 — `--sprint <SP-id>` (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `--sprint` |
| Type | string matching `^SP-\d{8}-\d{3}$` |
| Required | no (default: registry primary) |
| Source | user / `paths.sprintActiveRegistry#primary` |
| Validation | Must exist in `paths.sprintActiveRegistry`. Unknown id → exit non-zero with COPY C-10 from `/sprint:plan`. |
| Failure mode | Unknown id → standard COPY C-10 sprint-unknown message. |

**Notes:** Passed verbatim to every shelled-out helper.

## IN-7 — `--resume` (linked story `S-7`)

| Property | Value |
|---|---|
| Field | `--resume` |
| Type | boolean flag (presence) |
| Required | no |
| Source | user |
| Validation | Requires `--sprint` to also be set. Otherwise → exit 2 with "--resume requires --sprint <SP-id>". |
| Failure mode | `--sprint` missing → error. Sprint has no in-progress run → behaves like a fresh start. |

**Notes:** Reads `paths.sprintProgress`, identifies current phase, continues from next boundary.

## IN-8 — `--allow-main` (linked story `S-20`)

| Property | Value |
|---|---|
| Field | `--allow-main` |
| Type | boolean flag (presence) |
| Required | no |
| Source | user |
| Validation | Requires `--autonomy aggressive`. With `conservative` or `moderate` → exit 2 with explanation. |
| Failure mode | Wrong preset → "Override `--allow-main` requires `--autonomy aggressive`." |

**Notes:** Overrides branch-protection refusal per `R-11`.

## IN-9 — `--cost-acknowledged` (linked story `S-14`)

| Property | Value |
|---|---|
| Field | `--cost-acknowledged` |
| Type | boolean flag (presence) |
| Required | no |
| Source | user (only meaningful when resuming after a cost-estimate halt) |
| Validation | No validation; flag is permissive. |
| Failure mode | n/a — flag is informational. |

**Notes:** Raises cost threshold to 2× for THIS run only. Not persisted to preset config.

## IN-10 — Plan Contract payload (linked story `S-2`)

| Property | Value |
|---|---|
| Field | `.warpos/plan-payload-<slug>.json` |
| Type | JSON document matching `schemas/sprint/plan-contract.schema.json` (minus auto-filled fields) |
| Required | yes (auto-constructed by Alpha during Phase 1) |
| Source | system (Alpha's reasoning) |
| Validation | Must satisfy `/sprint:plan` Plan Contract schema. Invalid → `scripts/sprint/plan.js` exits non-zero. |
| Failure mode | Validation error → halt phase 1 with COPY-style report. |

**Notes:** Slug derived from a hash of the verbatim request.

## IN-11 — Autonomy preset file (linked story `S-12`)

| Property | Value |
|---|---|
| Field | `paths.sprintFullAutonomy` |
| Type | JSON document matching `schemas/sprint/sprint-full-autonomy.schema.json` |
| Required | yes (must exist or `/sprint:full` exits 1) |
| Source | system (config file) |
| Validation | Schema-validated at orchestrator start. Missing file → "Autonomy preset config missing at `paths.sprintFullAutonomy`. Run X to scaffold." |
| Failure mode | Missing or invalid → exit 1 before any phase starts. |

**Notes:** Loaded once per run. Operator can edit between runs.
