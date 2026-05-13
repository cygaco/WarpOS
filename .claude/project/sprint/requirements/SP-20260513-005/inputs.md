# INPUT Requirements — Harden /warp:update — preflight + transactional apply + postflight verify

**Sprint:** `SP-20260513-005`
**PRD:** `prd.md`

> INPUTS captures the data shapes consumed/produced by preflight,
> transaction, and postflight. Each entry is testable.

## IN-1 — Preflight gate result + aggregate report (linked story `S-2`)

| Property | Value |
|---|---|
| Field | `PreflightGateResult` |
| Type | JSON object per gate |
| Required | yes |
| Source | system (each `check:warpos-*` script returns one) |
| Validation | schema must include `{name, status, reason, remediation, durationMs}` |
| Failure mode | Missing required field → preflight aggregator records as `status:degraded reason:"malformed gate result"` |

Shape:

```json
{
  "name": "warpos-capsule-resolvable",
  "status": "green | yellow | red",
  "reason": "string explanation",
  "remediation": "string — exact fix command(s) OR null",
  "durationMs": 12,
  "evidence": { /* optional gate-specific blob */ }
}
```

Aggregate report:

```json
{
  "ok": true,
  "gateCount": 10,
  "greenCount": 10,
  "yellowCount": 0,
  "redCount": 0,
  "gates": [ /* array of PreflightGateResult */ ],
  "totalDurationMs": 142,
  "startedAt": "2026-05-13T07:30:00.123Z",
  "completedAt": "2026-05-13T07:30:00.265Z"
}
```

**Notes:** `ok` is `true` iff `redCount === 0`. Yellow is allowed (e.g.
`staleness` warning that an `--allow-stale` flag could pass). Red blocks.

## IN-2 — Transaction record (linked stories `S-5`, `S-6`)

| Property | Value |
|---|---|
| Field | `TransactionRecord` |
| Type | JSON object written to `<txDir>/header.json` + `<txDir>/plan.json` + `<txDir>/snapshot.json` + `<txDir>/result.json` |
| Required | yes (every `--apply` run) |
| Source | system (`transaction.js#begin()` produces it) |
| Validation | schema must match the shape below |
| Failure mode | Transaction dir cannot be created → apply refuses (does not silently apply with no rollback path) |

Header (`header.json` — written at begin):

```json
{
  "kind": "warp:update",
  "txId": "2026-05-13T07-30-12-warp-update-myproject",
  "fromVersion": "0.4.4",
  "toVersion": "0.5.0",
  "sourceRoot": "/abs/path/to/WarpOS",
  "targetRoot": "/abs/path/to/myproject",
  "sourceTreeRoot": "/abs/path/to/WarpOS",
  "startedAt": "2026-05-13T07:30:12.456Z"
}
```

Plan (`plan.json` — decisions for every asset):

```json
[
  {
    "id": "asset-id",
    "dest": ".claude/commands/warp/update.md",
    "kind": "skill",
    "owner": "framework",
    "category": "UPDATE_SAFE",
    "reason": "Already at target version (sha matches)."
  }
]
```

Snapshot (`snapshot.json` — pre-apply manifest of every file that WILL be
touched):

```json
{
  "$schema": "warpos/update-snapshot/v1",
  "txId": "...",
  "entries": [
    {
      "dest": ".claude/commands/warp/update.md",
      "category": "UPDATE_SAFE",
      "existed_pre_apply": true,
      "pre_state_sha256": "abc123...",
      "backup_path": "backup/.claude/commands/warp/update.md",
      "intended_action": "overwrite"
    },
    {
      "dest": ".claude/commands/check/warpos-capsule-resolvable.md",
      "category": "ADD_SAFE",
      "existed_pre_apply": false,
      "pre_state_sha256": null,
      "backup_path": null,
      "intended_action": "create"
    }
  ]
}
```

Result (`result.json` — written at commit OR rollback):

```json
{
  "completedAt": "2026-05-13T07:30:18.901Z",
  "outcome": "committed | rolled-back",
  "apply": { "counts": { /* added, updated, deleted, ... */ } },
  "migrations": { "ran": 0, "failed": 0, "log": [], "status": "skipped" },
  "rollback": null
}
```

If `outcome=rolled-back`:

```json
{
  "rollback": {
    "trigger": "apply | migration",
    "failedAt": ".claude/something.md",
    "error": "ENOENT: no such file",
    "restoredCount": 18,
    "unlinkedCount": 7,
    "rollbackDurationMs": 412
  }
}
```

## IN-3 — Postflight evidence package (linked story `S-7`)

| Property | Value |
|---|---|
| Field | `PostflightEvidencePackage` |
| Type | JSON written to `<txDir>/evidence/postflight.json` |
| Required | yes (every `--apply` that commits) |
| Source | system (`postflight.js#runPostflight()` produces it) |
| Validation | per-check `{name, status, evidence}`; `status ∈ {green, yellow, red, degraded}` |
| Failure mode | Postflight dies → write `<txDir>/evidence/postflight.error.log` |

Shape:

```json
{
  "$schema": "warpos/update-evidence/v1",
  "txId": "2026-05-13T07-30-12-warp-update-myproject",
  "completedAt": "2026-05-13T07:30:25.123Z",
  "checks": [
    {
      "name": "manifest-honesty",
      "status": "green",
      "evidence": {
        "assetsChecked": 412,
        "drift": []
      }
    },
    {
      "name": "path-resolution",
      "status": "red",
      "evidence": {
        "checked": 28,
        "failing": ["paths.providerSmokeSkill"]
      }
    },
    {
      "name": "provider-smoke",
      "status": "degraded",
      "evidence": {
        "reason": "provider-smoke skill not yet shipped (SP-002 dependency)"
      }
    }
  ],
  "summary": { "green": 3, "yellow": 0, "red": 1, "degraded": 1 },
  "operatorAction": "review-then-decide"
}
```

`operatorAction` is one of: `"green-light"` (all green), `"review-then-decide"`
(any red or yellow), `"rollback-recommended"` (multiple reds in critical
checks).

## IN-4 — `release.json` capsule contract (existing, validated by preflight) (linked stories `S-3`, `S-4`)

| Property | Value |
|---|---|
| Field | `release.json` |
| Type | JSON; existing schema `warpos/release/v1` |
| Required | yes (must exist + parse) |
| Source | capsule under `framework/releases/<v>/release.json` |
| Validation | `version` matches the directory name; `migrations[]` entries exist as files; `postUpdateChecks[]` are `node <script.js>` strings |
| Failure mode | Validation fails → preflight `migration-presence` gate red OR `capsule-resolvable` gate red |

Existing shape (from 0.5.0/release.json):

```json
{
  "schema": "warpos/release/v1",
  "version": "0.5.0",
  "createdAt": "2026-05-13T05:26:49.162Z",
  "commit": "01c9bc599788319d84235bab9e8458cb33c5ecc9",
  "minUpgradeableFrom": "0.1.2",
  "manifestSchema": "warpos/framework-manifest/v2",
  "pathRegistryVersion": "v5",
  "migrations": [],
  "postUpdateChecks": [
    "node scripts/paths/build.js --check",
    "node scripts/paths/gate.js",
    "node scripts/hooks/build.js --check",
    "node scripts/hooks/test.js"
  ],
  "checksumsFile": "checksums.json"
}
```

No new fields required by SP-005 — postflight runs the existing
`postUpdateChecks[]` PLUS the composed checks from R-20.

## IN-5 — External-check primitive (linked story `S-8`)

| Property | Value |
|---|---|
| Field | `ExternalCheck` |
| Type | JSON contract for an externally-provided check (e.g. `provider-smoke` from SP-002) |
| Required | optional |
| Source | resolved via `paths.X` (e.g. `paths.providerSmokeSkill`) |
| Validation | resolved path must exist and be a `node <script>.js` invocation |
| Failure mode | path key absent → recorded `status:degraded reason:"<name> skill not yet shipped"` |

Shape (registered in postflight composer):

```js
{
  name: "provider-smoke",
  resolvePath: "paths.providerSmokeSkill",
  required: false,                                   // if true, absence = red
  degradedReason: "provider-smoke skill not yet shipped"
}
```

Postflight iterates `externalChecks[]`; resolves each; if absent and
`required:false`, records `status:degraded`; otherwise runs via spawnSync
like `postUpdateChecks` already does (`update.js#runPostUpdateChecks`).

**Notes:** This is the SP-002 integration boundary. SP-005 ships the
primitive; SP-002 ships the actual `provider-smoke` script and the
`paths.providerSmokeSkill` entry.
