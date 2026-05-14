# INPUT Requirements — Turbo as mode argument

**Sprint:** `SP-20260513-006`
**PRD:** `prd.md`

## IN-1 — `--turbo` flag (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `/mode:<mode>` skill arg |
| Type | boolean flag |
| Required | no |
| Source | user (operator) |
| Validation | none (presence-only) |
| Failure mode | n/a — absence is the default |

**Notes:** When absent, mode skill behaves exactly as before.

## IN-2 — `--scope <csv>|all` pass-through (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `/mode:<mode>` skill arg, forwarded to `scripts/turbo/apply.js` |
| Type | comma-separated string, or literal `all` |
| Required | no (per-mode default applies) |
| Source | user (operator) |
| Validation | delegated to `scripts/turbo/apply.js` |
| Failure mode | invalid scope → `apply.js` exit 2; operator-facing recovery per C-3 |

**Notes:** Operator-supplied value overrides the per-mode default.

## IN-3 — `--ttl <duration>` pass-through (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `/mode:<mode>` skill arg, forwarded to `scripts/turbo/apply.js` |
| Type | duration string (e.g. `30m`, `4h`) |
| Required | no |
| Source | user (operator) |
| Validation | delegated to `scripts/turbo/apply.js` |
| Failure mode | invalid TTL → `apply.js` exit 2 |

**Notes:** Per-mode default applies when omitted. `/mode:oneshot --turbo` defaults to 4h.

## IN-4 — `--reason "<text>"` pass-through (linked story `S-1`)

| Property | Value |
|---|---|
| Field | `/mode:<mode>` skill arg, forwarded to `scripts/turbo/apply.js` |
| Type | string |
| Required | no |
| Source | user (operator) |
| Validation | delegated to `scripts/turbo/apply.js` |
| Failure mode | empty/whitespace reason rejected by `apply.js` |

**Notes:** When omitted, per-mode skill body supplies a default reason like `"entered via /mode:adhoc"` so the audit log is honest about provenance.
