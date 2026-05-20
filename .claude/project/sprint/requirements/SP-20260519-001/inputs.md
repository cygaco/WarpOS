# INPUT Requirements — ROADMAP + RELEASES ledger discipline

**Sprint:** `SP-20260519-001`
**PRD:** `prd.md`

> No user form fields in this sprint — inputs are programmatic. Each `IN-N` documents the shape of arguments passed to `ledger.js` functions and the data sources backfill reads.

## IN-1 — appendSprintRow arg shape (linked story `S-1`, `S-5`)

| Property | Value |
|---|---|
| Field | `{ id, title, status, startedAt, closedAt?, releaseRef? }` |
| Type | object |
| Required | `id, title, status, startedAt`; `closedAt`, `releaseRef` optional |
| Source | caller (plan.js, add-sprint.js, retrospective.js, backfill) |
| Validation | `id` matches `^SP-[0-9]{8}-[0-9]{3,4}$`; `status` ∈ enum; `startedAt` ISO-8601; `closedAt` ISO-8601 when present |
| Failure mode | invalid id/status → return `{ written: false, reason: 'validation: <field>' }`, stderr warn, continue (fail-open) |

**Notes:** `releaseRef` is the `RL-*` id once the sprint ships, or null.

## IN-2 — appendReleaseRow arg shape (linked story `S-2`, `S-7`)

| Property | Value |
|---|---|
| Field | `{ id, sprint, status, target, deployedAt?, changelogPath?, notes? }` |
| Type | object |
| Required | `id, sprint, status, target` |
| Source | release.js (prepare + deploy), backfill |
| Validation | `id` matches `^RL-[0-9]{8}-[0-9]{3,4}$`; `status` ∈ `{prepared, deployed, rolled_back}`; `sprint` matches sprint id regex |
| Failure mode | same as IN-1 — fail-open |

## IN-3 — appendVersionRow arg shape (linked story `S-2`, `S-8`)

| Property | Value |
|---|---|
| Field | `{ version, releasedAt, summary, capsulePath }` |
| Type | object |
| Required | all four |
| Source | release-canonical.js (or whatever drives /warp:release), backfill |
| Validation | `version` matches `^[0-9]+\.[0-9]+\.[0-9]+$`; `summary` non-empty AND no `SP-` / `RL-` / `T-` substring (downstream-readable rule); `capsulePath` resolves under `framework/releases/X.Y.Z/` |
| Failure mode | invalid summary → return `{ written: false, reason: 'downstream-readable: contains internal id' }`, stderr warn, continue |

## IN-4 — updateSprintRow arg shape (linked story `S-6`)

| Property | Value |
|---|---|
| Field | `{ id, status, closedAt?, releaseRef? }` |
| Type | object |
| Required | `id, status` |
| Source | retrospective.js, release.js (status transitions), backfill (reconcile) |
| Validation | `id` matches existing row in ROADMAP.md; if no match, fall through to appendSprintRow with the same args (rare — retrospect of a pre-ledger sprint) |
| Failure mode | row not found AND no fallback fields → fail-open warn |

## IN-5 — Backfill source: active-sprints.yaml (linked story `S-9`)

| Property | Value |
|---|---|
| Field | `paths.sprintActiveRegistry` |
| Type | YAML file |
| Required | yes (without it, sprint backfill is empty) |
| Source | filesystem |
| Validation | schema `warpos/sprint/active-sprints/v1`; entries have `id, title, status, created_at, updated_at` |
| Failure mode | missing file → backfill exits 1 with actionable message |

## IN-6 — Backfill source: releases/ directory (linked story `S-9`)

| Property | Value |
|---|---|
| Field | every `*.yaml` under `paths.sprintReleases` |
| Type | YAML files |
| Required | yes for release backfill (zero files → zero release rows, not an error) |
| Source | filesystem glob |
| Validation | schema `warpos/sprint/release/v1`; entries have `id, sprint, status, target, deployed_at, changelog_path` |
| Failure mode | malformed file → log warn, skip that file, continue |

## IN-7 — Backfill source: version.json (linked story `S-9`)

| Property | Value |
|---|---|
| Field | `version.json` at repo root |
| Type | JSON file |
| Required | yes for version backfill |
| Source | filesystem |
| Validation | schema `warpos/version/v1`; reads `version` + `previousVersions[]` + `releasedAt` for each |
| Failure mode | missing/malformed → backfill exits 1 |

## IN-8 — Backfill source: framework/releases/ directory (linked story `S-9`)

| Property | Value |
|---|---|
| Field | every `release.json` under `framework/releases/X.Y.Z/` |
| Type | JSON files |
| Required | yes for capsule-link enrichment |
| Source | filesystem glob |
| Validation | presence check — capsule path becomes the link in RELEASES.md#versions |
| Failure mode | version listed in previousVersions but no capsule on disk → row inserted with `Capsule: (missing — known gap)` and a `learning_candidates` entry written to traces.jsonl (parallels LRN-2026-05-13 release-capsule-gap class) |

## IN-9 — Ledger file detection (linked story `S-4`)

| Property | Value |
|---|---|
| Field | anchor marker `<!-- ledger:<section> -->` in ROADMAP.md / RELEASES.md |
| Type | regex on file content |
| Required | yes — without the marker, ledger.js refuses to write (operator opted out) |
| Source | file content |
| Validation | marker present exactly once per section |
| Failure mode | marker missing → return `{ written: false, reason: 'no anchor marker — operator opted out of auto-write' }`, stderr info (NOT warn), continue |

## IN-10 — ledger-presence-guard config (linked story `S-10`)

| Property | Value |
|---|---|
| Field | `policies/ledger-presence.json` |
| Type | JSON file |
| Required | yes (without it, guard is no-op) |
| Source | filesystem |
| Validation | `{ schema, enforcement: { mode: warn\|block, soft_rollout_until: ISO-8601 }, watched_commands: [...] }` |
| Failure mode | missing → guard logs `[ledger-presence-guard] no-policy, skipping` to stderr and exits 0 |

## IN-11 — Skill body grep target (linked story `S-11`)

| Property | Value |
|---|---|
| Field | literal `paths.sprintReference#ledger-discipline` string in 4 skill files |
| Type | string match in markdown |
| Required | yes — verification depends on grep |
| Source | repo file content |
| Validation | grep returns 1 match per file |
| Failure mode | missing → CI test in `AC-11.1` fails |
