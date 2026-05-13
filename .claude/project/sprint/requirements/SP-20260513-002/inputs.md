# INPUT Requirements — WarpOS install/update provider smoke test + RCA

**Sprint:** `SP-20260513-002`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\prd.md`

> INPUTS captures fields, forms, data entry, validation, and user/system
> inputs. Each entry is testable.

## IN-1 — `--providers <csv>` (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `--providers` |
| Type | comma-separated list of provider ids |
| Required | No (default `claude,openai,gemini`) |
| Source | CLI arg, propagated from `/warp:install`/`/warp:update`/standalone |
| Validation | Each token MUST match `/^[a-z][a-z0-9_-]{1,31}$/` AND appear in the known provider set (`claude`, `openai`, `gemini`). Unknown tokens → exit 1 with `unknown_provider: <name>` (no probe attempted). |
| Failure mode | Malicious / typo tokens. Validation rejects shell-meta chars and unknown ids. |

**Notes:** Validation is the redteam guard for "malicious provider name in --providers list" (see `redteam-plan.md`). The known set is the union of keys in `provider-failure-modes.json#known_providers`.

## IN-2 — `--probe <mode>` (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `--probe` |
| Type | enum: `""` (default, presence-only), `list` (cheap reachability probe via `gemini models list` / `codex --help`) |
| Required | No |
| Source | CLI arg |
| Validation | If value not in enum, exit 1 with `unknown_probe_mode`. Default empty string preserves current `provider-health-check.js` behavior. |
| Failure mode | Operator typos. Validation rejects unknown modes. |

**Notes:** `--probe list` is opt-in because it spends a token (small) and adds ~1-2s per provider. Install/update default off; standalone `/warp:smoke` may enable.

## IN-3 — `--exit-on-yellow` (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `--exit-on-yellow` |
| Type | boolean flag |
| Required | No (default false) |
| Source | CLI arg, may be set by capsule's `postUpdateChecks` if release author wants strict mode |
| Validation | Presence-only flag; no value parsing. |
| Failure mode | None. If true and verdict is yellow, exits 2 instead of 0. |

**Notes:** PRD `R-7` says yellow → 0 by default. This flag exists so SP-005 can flip a single capsule to strict mode for high-risk releases without changing the orchestrator.

## IN-4 — `--no-autofix` (linked story `S-5`)

| Property | Value |
|---|---|
| Field | `--no-autofix` |
| Type | boolean flag |
| Required | No (default false — autofix ON for safe entries) |
| Source | CLI arg |
| Validation | Presence-only. |
| Failure mode | Operator wants pure diagnostic. With flag set, smoke runs probes + RCA + prints remediation, but never calls the autofix dispatcher. |

**Notes:** Operator opt-out per redteam concern (`RT-2`: "RCA fix that corrupts auth"). Defense in depth alongside `safe_to_autofix: false` policy on auth-mutating recipes.

## IN-5 — `--json` (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `--json` |
| Type | boolean flag |
| Required | No (default false → human output) |
| Source | CLI arg |
| Validation | Presence-only. |
| Failure mode | None. Emits `{ verdict, results[], rca[], autofixes[], schema: "warpos/provider-smoke/v1" }` and suppresses human strings on stdout. Events still log to `paths.eventsFile`. |

**Notes:** This is the SP-005 consumption interface — postflight in harden-update will parse `--json` output to decide rollback.

## IN-6 — Failure-mode catalog file (linked story `S-3`)

| Property | Value |
|---|---|
| Field | `.claude/agents/00-alex/.system/policy/provider-failure-modes.json` |
| Type | JSON document, schema `warpos/provider-failure-modes/v1` |
| Required | Yes — orchestrator exits 1 (`catalog_load_error`) if missing/invalid |
| Source | Version-controlled in repo; loaded once per process |
| Validation | Schema check at load: `schema` key, `version` key (integer), `entries` object keyed by status; each entry has `root_cause` (string), `fix_recipe` (string or null), `safe_to_autofix` (bool), `remediation` (string), `fallback_allowed` (bool). |
| Failure mode | Corrupt JSON / schema drift → orchestrator exits 1, lifecycle aborts with `catalog_load_error`. This is intentional — without a catalog the framework cannot reason about failures. |

**Notes:** Catalog ships under `paths.policyDir` for symmetry with `provider-fallback.json`. Both are loaded by smoke; cross-validation that every status in `provider-health.js` has an entry runs as a unit test (S-3 AC).
