# COPY Requirements — Harden WarpOS update pipeline

**Sprint:** `SP-20260514-001`
**PRD:** `prd.md`

User-visible text emitted by the update pipeline.

## C-1 — Preflight pass (no override) (linked story `S-5`)

**Context:** `preflight.js` exits 0 with all gates green.
**Text:**

> Preflight: all 10 gates passed. Safe to apply.

**Notes:** Plain success line. No emoji.

## C-2 — Override missing reason (linked story `S-5`)

**Context:** `--operator-override` passed without `--override-reason`.
**Text:**

> --operator-override requires --override-reason "<text>". No override applied.

**Notes:** Hard-fail message. Exit 2.

## C-3 — Override accepted (linked story `S-5`)

**Context:** `--operator-override <gate>` + reason; named gate is red.
**Text:**

> Operator override accepted for gate "<gate>". Reason: <reason>. Audit event written to paths.eventsFile.

**Notes:** Always emit even on success, so the operator sees that audit happened.

## C-4 — LF-only mismatch informational (linked story `S-9`)

**Context:** `update.js` finds a content-hash match but a raw-hash mismatch.
**Text:**

> content-hash match, raw-hash differs (LF-only). Treating as no-change. (See event content-hash-mismatch kind=lf_only.)

**Notes:** Stays informational; classifier does NOT escalate to MERGE_CONFLICT.

## C-5 — Stale migration outside capsule (linked story `S-8`)

**Context:** `applied-migrations` gate finds a migration dir not in capsule's migration list.
**Text:**

> Migration "<m>" exists on disk but is not in capsule release.json#migrations[]. Apply blocked. Remove the stale dir or override with --operator-override applied-migrations --override-reason "<text>".

**Notes:** Tells operator the exact override invocation.

## C-6 — Ownership transition (linked story `S-6`)

**Context:** Classifier promotes a `framework_template` path to `project_owned`.
**Text:**

> Ownership transition: "<path>" framework_template → project_owned (consumer-edited). Will not be removed by framework restructure.

**Notes:** Single line per transition. Logged + printed.

## C-7 — Successful update summary (linked story `S-10`)

**Context:** End-of-apply summary.
**Text:**

> /warp:update apply complete. <N> Class A items, 0 Class C. Manifest hashes upgraded to full 64-char. Audit events: <K>. Transaction <txId>.

**Notes:** Always shows hash-upgrade count and audit event count. `K=0` is good (no overrides).
