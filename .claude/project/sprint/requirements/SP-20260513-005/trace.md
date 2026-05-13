# TRACE Requirements — Harden /warp:update — preflight + transactional apply + postflight verify

**Sprint:** `SP-20260513-005`
**PRD:** `prd.md`

> TRACE captures the observability layer. Every event below goes to
> `paths.eventsFile` via the standard `logger.js` helper. Each event has
> a category like `warpos.update.<phase>`. The shape is the standard
> Alex event envelope `{id, ts, cat, actor, session, data}`.

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| Operator runs /warp:update --to v --apply | R-1..R-12 | S-1..S-4 | C-1..C-5 | IN-1, IN-4 | — | T-NNN preflight | `scripts/warpos/preflight.js`, `scripts/checks/warpos-*.js` | `scripts/warpos/test-cross-version-replay.js` | release-plan.md | F-1..F-9 (failure-mining.md) |
| Operator runs /warp:update --apply (commit phase) | R-13..R-18 | S-5, S-6 | C-6, C-7 | IN-2 | — | T-NNN transaction | `scripts/warpos/transaction.js`, `update.js` apply | same | release-plan.md | F-10 (trust loss) |
| Operator sees post-apply evidence | R-19..R-21 | S-7, S-8 | C-8, C-9 | IN-3, IN-5 | SP-002 (provider-smoke) | T-NNN postflight | `scripts/warpos/postflight.js` | same | release-plan.md | — |
| Failure event mining | R-22..R-24 | S-9, S-11 | — | IN-1 | — | T-NNN events | `scripts/warpos/lib/update-events.js` | n/a | — | LRN candidate |

## TR-1 — `warpos.update.preflight` event (per-gate + aggregate)

**Event:** `warpos.update.preflight`

**When:** Once per gate during the preflight phase + once aggregate after
all gates run.

**Captured fields:**

```json
{
  "cat": "warpos.update.preflight",
  "actor": "system",
  "data": {
    "txId": null,
    "phase": "preflight",
    "gate": "warpos-capsule-resolvable",
    "status": "red",
    "reason": "capsule 0.4.0 not in any searched location",
    "remediation": "/warp:update --to 0.5.0 --apply  (or pass --source <path>)",
    "durationMs": 12,
    "evidence": { "searchedLocations": ["..."] }
  }
}
```

Aggregate event after all gates:

```json
{
  "cat": "warpos.update.preflight",
  "data": {
    "phase": "preflight-summary",
    "ok": false,
    "gateCount": 10,
    "redCount": 1,
    "yellowCount": 0,
    "greenCount": 9,
    "totalDurationMs": 142
  }
}
```

**Linked requirement:** `R-12`, `R-22`.
**Linked story:** `S-2`.
**Why we capture this:** Drives `/learn:deep` and `/issues:scan` pattern
detection. Failure-mining.md F-1..F-9 each become a TRACE signature future
learning loops can mine.

## TR-2 — `warpos.update.transaction.start` event

**Event:** `warpos.update.transaction.start`

**When:** Immediately after preflight green + immediately before the apply
loop starts. Emitted ONCE per `--apply` run.

**Captured fields:**

```json
{
  "cat": "warpos.update.transaction.start",
  "actor": "system",
  "data": {
    "txId": "2026-05-13T07-30-12-warp-update-myproject",
    "fromVersion": "0.4.4",
    "toVersion": "0.5.0",
    "filesToWrite": 31,
    "filesToDelete": 0,
    "filesToAdd": 16,
    "backupPlanCount": 31
  }
}
```

**Linked requirement:** `R-13`, `R-22`.
**Linked story:** `S-5`.
**Why we capture this:** Establishes the transaction context for every
subsequent event in the chain (txId is the join key).

## TR-3 — `warpos.update.transaction.rollback` event

**Event:** `warpos.update.transaction.rollback`

**When:** Apply or migration threw. Rollback executed.

**Captured fields:**

```json
{
  "cat": "warpos.update.transaction.rollback",
  "actor": "system",
  "data": {
    "txId": "2026-05-13T07-30-12-warp-update-myproject",
    "trigger": "apply | migration",
    "failedAt": ".claude/something.md",
    "errorMessage": "ENOENT: no such file",
    "restoredCount": 18,
    "unlinkedCount": 7,
    "rollbackDurationMs": 412
  }
}
```

**Linked requirement:** `R-15`, `R-22`.
**Linked story:** `S-6`.
**Why we capture this:** Rollback is the bug-magnet — if rollback is
silently incomplete (e.g. restoredCount + unlinkedCount < intended), the
event surfaces it for diagnostic.

## TR-4 — `warpos.update.transaction.commit` event

**Event:** `warpos.update.transaction.commit`

**When:** Apply + migrations succeeded; before postflight runs.

**Captured fields:**

```json
{
  "cat": "warpos.update.transaction.commit",
  "actor": "system",
  "data": {
    "txId": "2026-05-13T07-30-12-warp-update-myproject",
    "fromVersion": "0.4.4",
    "toVersion": "0.5.0",
    "applyDurationMs": 4231,
    "migrationsRan": 0,
    "filesWritten": 47,
    "backupsTaken": 31
  }
}
```

**Linked requirement:** `R-16`, `R-22`.
**Linked story:** `S-6`.
**Why we capture this:** Marks the irreversible commit point. Anything
beyond this is observation only.

## TR-5 — `warpos.update.postflight` event

**Event:** `warpos.update.postflight`

**When:** Postflight phase finished (regardless of outcome).

**Captured fields:**

```json
{
  "cat": "warpos.update.postflight",
  "actor": "system",
  "data": {
    "txId": "2026-05-13T07-30-12-warp-update-myproject",
    "ok": false,
    "checkCount": 5,
    "greenCount": 3,
    "yellowCount": 0,
    "redCount": 1,
    "degradedCount": 1,
    "operatorAction": "review-then-decide",
    "evidencePath": ".warpos/transactions/<id>/evidence/postflight.json",
    "durationMs": 8421
  }
}
```

**Linked requirement:** `R-21`, `R-22`.
**Linked story:** `S-7`, `S-8`.
**Why we capture this:** Health surface for ongoing update reliability
metric. `/learn:deep` can mine "postflight red rate" over time.

## TR-6 — `warpos.update.evidence` event (lightweight pointer)

**Event:** `warpos.update.evidence`

**When:** After each `--apply` run that commits. Even if postflight has
warnings, this fires once postflight completes.

**Captured fields:**

```json
{
  "cat": "warpos.update.evidence",
  "actor": "system",
  "data": {
    "txId": "2026-05-13T07-30-12-warp-update-myproject",
    "evidencePath": ".warpos/transactions/<id>/evidence/postflight.json",
    "transactionDir": ".warpos/transactions/<id>",
    "outcome": "committed",
    "postflightOk": false
  }
}
```

**Linked requirement:** `R-21`, `R-22`.
**Linked story:** `S-9` (test bench reads this to verify cross-version
replay succeeded), `S-11`.
**Why we capture this:** Pointer event for downstream auditors. Cheap,
indexed.

---

## Pattern hooks for `/learn:deep`

After SP-005 ships, the following queries become possible against
`events.jsonl`:

- `cat=warpos.update.preflight status=red` → preflight false-positive
  rate per gate (red-team risk surface).
- `cat=warpos.update.transaction.rollback` rate over time → trust metric.
- `cat=warpos.update.postflight redCount>0` rate over time → install
  health metric.

These are documented in `release-plan.md` monitoring section.
