# INPUTS — Enforce sprint routing policy

**Sprint:** `SP-20260514-002`
**PRD:** `prd.md`

CLI input contracts for `scripts/sprint/routing.js` subcommands. Validation runs in the script before any file I/O.

## IN-1 — `routing.js record` arguments (linked story `S-1`)

| Flag | Required | Type | Validation | Failure mode |
|---|---|---|---|---|
| `--phase` | yes | enum | One of: planning, plan_contract_review, design, execution, qa, redteam, release, retrospective, external_service_setup, docs_sync, tracker_updates, trace_updates | exit 2 — invalid phase |
| `--artifact` | yes | string | Non-empty. Path or id (PC-…, T-…, S-…, RL-…, retro:<sprint-id>, etc.) | exit 2 — missing |
| `--sprint` | yes | string | Matches `^SP-\d{8}-\d{3}$` and exists in active-sprints.yaml | exit 2 — unknown sprint |
| `--model` | yes | string | Format `provider:name`; provider in {claude, openai, gemini, …}; name non-empty | exit 2 — malformed |
| `--diff-reviewer` | no | string | Same shape as `--model`; vendor MUST differ from `--model` unless `--evidence single_vendor_session` | exit 2 — same-vendor diff review |
| `--evidence` | no | enum | One of: ok, single_vendor_session, mismatch_override (default: ok) | exit 2 — invalid evidence |
| `--decision-ref` | no | string | Decision-ledger pointer (REQUIRED when `--evidence single_vendor_session`) | exit 2 — missing pointer |
| `--verbose` | no | flag | — | — |

Side effect: appends to `paths.sprintDecisions/routing-trace.jsonl`; on `single_vendor_session` also appends to `paths.decisionLedger`.

## IN-2 — `routing.js check` arguments (linked story `S-2`)

| Flag | Required | Type | Validation | Failure mode |
|---|---|---|---|---|
| `--phase` | yes | enum | Same as IN-1 | exit 2 |
| `--artifact` | yes | string | Same as IN-1 | exit 2 |
| `--sprint` | yes | string | Same as IN-1 | exit 2 |
| `--exit-code` | no | flag | When set, exit only (no stdout) | — |

Success: exit 0 if any trace row matches phase+artifact+sprint. Failure: exit 1 + C-4 message.

## IN-3 — `routing.js coverage` arguments (linked story `S-3`)

| Flag | Required | Type | Validation | Failure mode |
|---|---|---|---|---|
| `--sprint` | yes | string | Same as IN-1 | exit 2 |
| `--format` | no | enum | One of: json, text (default text) | exit 2 |
| `--include-optional` | no | flag | When set, includes optional phases in the report | — |
| `--required-only` | no | flag | When set, exit non-zero only on missing required phases | — |

Phase classification:
- **Required:** planning, design, execution, release. (qa, redteam treated as required when ticket count > 0.)
- **Optional:** docs_sync, tracker_updates, trace_updates, plan_contract_review (advisory), retrospective (only required when sprint status = retrospected).

## IN-4 — `sprint-routing-guard.js` hook input (linked story `S-10`)

Hook reads from stdin a `PreToolUse` payload per Claude Code hook spec:
```
{ "tool": "Edit"|"Write", "input": { "file_path": "...", "old_string": "...", "new_string": "..." } }
```

Validation:
- Resolve `file_path` against `paths.sprintRoot`. If outside, exit 0 (not our concern).
- Classify: is it a Plan Contract YAML / requirements bundle file / retro.yaml / release record / sprint current.yaml? If not, exit 0.
- Look up sprint id from path (`.claude/project/sprint/sprints/<id>/...` or read from registry).
- Look up sprint status from `active-sprints.yaml`. If `closed` or `retrospected` → exit 0 (C-8 in debug).
- If `paths.sprintRouting` missing → exit 0 (C-9 in debug).
- Read `enforcement.mode` from policy.
- Infer phase from artifact kind.
- Run `routing.js check --phase <inferred> --artifact <id> --sprint <id> --exit-code`.
- On miss + mode=warn → emit C-6, exit 0.
- On miss + mode=block → emit C-7, exit 2.
- On hit → exit 0.

## IN-5 — `sprint-routing.json#enforcement` schema (linked story `S-12`)

Additive top-level key:
```json
"enforcement": {
  "mode": "warn",
  "rolled_out_at": "2026-05-14T21:00:00Z",
  "soft_rollout_until": "2026-05-21T21:00:00Z",
  "rationale": "First-week soft rollout; flip mode to 'block' after smoke validation."
}
```

Validation in `routing.js loadPolicy`:
- If absent → default `{ mode: "warn", rolled_out_at: null, soft_rollout_until: null }`.
- `mode` MUST be one of `warn`, `block`. Else `routing.js validate` exits 1.
