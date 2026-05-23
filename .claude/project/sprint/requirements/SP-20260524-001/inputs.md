<!-- requirement-format-legacy -->
# INPUT Requirements — Install fixture CI matrix

**Sprint:** `SP-20260524-001`
**PRD:** `prd.md`

> CLI inputs to `scripts/warpos/test-install-matrix.js`. No user-facing forms — this is a CLI test harness.

## IN-1 — `--help` flag (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `--help` (boolean flag) |
| Type | boolean |
| Required | no |
| Source | CLI |
| Validation | presence-only; no value |
| Failure mode | n/a (flag present → print help + exit 0) |

**Notes:** Help text must list every scenario id + name + a one-line summary.

## IN-2 — `--scenarios <list>` (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `--scenarios` (comma-separated scenario ids) |
| Type | string |
| Required | no (default = run all 5) |
| Source | CLI |
| Validation | each token must match a known scenario id (1..5 or named slugs) |
| Failure mode | unknown id → exit 2 with `unknown scenario: <id>` |

**Notes:** Allows running a subset for fast iteration during development.

## IN-3 — `--json` (linked story `S-8`)

| Property | Value |
|---|---|
| Field | `--json` (boolean flag) |
| Type | boolean |
| Required | no |
| Source | CLI |
| Validation | presence-only |
| Failure mode | n/a |

**Notes:** When set, stdout emits the JSON report shape from AC-8.1 only; no human-format mixed in.

## IN-4 — `--fixture-root <path>` (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `--fixture-root` (override default fixture base dir) |
| Type | path |
| Required | no (default = `.warpos/test-fixtures/install-matrix/`) |
| Source | CLI |
| Validation | parent must exist + be writable |
| Failure mode | not writable → exit 2 with `fixture-root not writable: <path>` |

**Notes:** Lets CI override with `os.tmpdir()` if .warpos/ is read-only.

## IN-5 — `--inject-regression <name>` (linked story `S-10`)

| Property | Value |
|---|---|
| Field | `--inject-regression` (planted-bug mode) |
| Type | string (regression name from registry) |
| Required | no |
| Source | CLI |
| Validation | name must match a known regression injection |
| Failure mode | unknown → exit 2 with `unknown injection: <name>; known: <list>` |

**Notes:** Meta-test mode. NEVER mutates anything outside the ephemeral fixture per AC-10.2.

## IN-6 — `--keep-failed` (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `--keep-failed` (preserve fixtures of failed scenarios) |
| Type | boolean |
| Required | no |
| Source | CLI |
| Validation | presence-only |
| Failure mode | n/a |

**Notes:** Default cleanup-on-failure moves failed fixtures aside under `_failed/`. With `--keep-failed`, they stay in place at their original path for inspection.
