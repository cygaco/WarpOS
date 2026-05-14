# INPUT Requirements — Harden WarpOS update pipeline

**Sprint:** `SP-20260514-001`
**PRD:** `prd.md`

CLI inputs new or changed.

## IN-1 — `--operator-override <gate-name>` (linked story `S-5`)

| Property | Value |
|---|---|
| Field | preflight CLI flag |
| Type | string, repeatable |
| Required | conditional — required to bypass a red gate |
| Source | user (operator) |
| Validation | value must be one of the 10 known gate names: `install-baseline`, `capsule-resolvable`, `version-quorum`, `staleness`, `manifest-honesty`, `path-resolution`, `structure-parity`, `applied-migrations`, `migration-presence`, `tracked-transients` |
| Failure mode | unknown gate name → exit 2 with the list of valid gates |

**Notes:** Replaces 4 narrow flags + `--skip-preflight`. Repeatable for multi-gate override.

## IN-2 — `--override-reason <text>` (linked story `S-5`)

| Property | Value |
|---|---|
| Field | preflight CLI flag |
| Type | string, single (last wins if repeated) |
| Required | yes when `--operator-override` is present |
| Source | user (operator) |
| Validation | non-empty after trim; ≥ 8 chars; ≤ 500 chars |
| Failure mode | empty/missing → COPY C-2 + exit 2 |

**Notes:** Reason is stored verbatim in the audit event.

## IN-3 — `framework_template` owner value in `paths.registry.json` (linked story `S-6`)

| Property | Value |
|---|---|
| Field | `paths[*].owner` |
| Type | enum |
| Required | yes per path entry |
| Source | system (registry file) |
| Validation | allowed values: `framework_owned`, `framework_template`, `project_owned` |
| Failure mode | unknown owner → schema error, refuse to load |

**Notes:** Registry schema bump is additive; existing `framework_owned` / `project_owned` continue to work.

## IN-4 — `framework-manifest.json#assets[].sha256` length (linked story `S-3`)

| Property | Value |
|---|---|
| Field | per-asset sha256 |
| Type | string |
| Required | yes |
| Source | system (release-build.js output) |
| Validation | 64 hex chars going forward; read path tolerates 12-char prefix from 0.6.x |
| Failure mode | length ∉ {12, 64} → schema error |

**Notes:** Write-path emits 64; read-path accepts both via `hashMatches`.

## IN-5 — `framework-installed.json#installedHash` length (linked story `S-4`)

| Property | Value |
|---|---|
| Field | per-asset installedHash |
| Type | string |
| Required | yes |
| Source | system (update.js snapshotInstalled) |
| Validation | post-0.7.0-apply: 64 hex chars; mid-transition (read from prior 0.6.x state): accepts 12 |
| Failure mode | length ∉ {12, 64} → schema error |

**Notes:** Apply always writes 64; reading from 0.6.x state still works via `hashMatches`.
