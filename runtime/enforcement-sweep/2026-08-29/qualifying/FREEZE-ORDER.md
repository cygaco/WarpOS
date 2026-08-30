# SP-20260829-001 — §B freeze-ordering observable (β 8e3a5f21, row 386)

Two values a reader can compare without trusting anyone:

| what | value |
|---|---|
| the ledger row carrying the frozen aggregation rule (AG-1..AG-12), msg_id `8e3a5f21-4c67-4d90-b3a2-06f18d7c4e59` | store position **386**, `appended_at` **2026-08-30T03:43:05.000Z** |
| the earliest qualifying-lane dispatch start | `d-mtfdwwch-491effca` (E1, cabinet), `started_at` **2026-08-30T05:44:20.417Z** |

The rule row precedes the first lane start by more than two hours. The store is `.claude/agents/president/_system/beta/events.jsonl` (gitignored; the row's full text is committed at `runtime/beta-consult/SP-20260829-001-aggregation-frozen-AG-8e3a5f21.md`, commit a5f127fc, 2026-08-30T03:43Z). This file is a checkable artifact, not an enforcer — the enforcer remains owed under ED-397.

Lanes E2 and E3 (in-process spawns) are appended below as their records exist.

Written by α at 2026-08-30T05:46:07Z.
