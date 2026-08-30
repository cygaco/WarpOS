# SP-20260829-001 — §B freeze-ordering observable (β 8e3a5f21, row 386)

Two values a reader can compare without trusting anyone:

| what | value |
|---|---|
| the ledger row carrying the frozen aggregation rule (AG-1..AG-12), msg_id `8e3a5f21-4c67-4d90-b3a2-06f18d7c4e59` | store position **386**, `appended_at` **2026-08-30T03:43:05.000Z** |
| the earliest qualifying-lane dispatch start | `d-mtfdwwch-491effca` (E1, cabinet), `started_at` **2026-08-30T05:44:20.417Z** |

The rule row precedes the first lane start by more than two hours. The store is `.claude/agents/president/_system/beta/events.jsonl` (gitignored; the row's full text is committed at `runtime/beta-consult/SP-20260829-001-aggregation-frozen-AG-8e3a5f21.md`, commit a5f127fc, 2026-08-30T03:43Z). This file is a checkable artifact, not an enforcer — the enforcer remains owed under ED-397.

Lanes E2 and E3 (in-process spawns) are appended below as their records exist.

Written by α at 2026-08-30T05:46:07Z.

## E2 — appended 2026-08-30T06:06Z (α), from the record as it exists

| lane | dispatch_id | role / route / model | started_at | completed_at | elapsed_ms | ok | stdout_bytes | evidence_sha (record) | α recompute of out-E2.raw.md |
|---|---|---|---|---|---|---|---|---|---|
| E2 | `d-mtfek189-db4cb9a2` | `qa-reviewer` / `claude-agent` / `claude-opus-5` (in-process-agent, via `epsilon-agent`) | `2026-08-30T05:48:31.703Z` | `2026-08-30T06:02:19.833Z` | 828130 | true | 15108 | `38eb1b8fe2dddc3dac2b56af0b4ac6551882293d5970398cfeaf8f5a5bfacfee` | 15108 B · sha256 `38eb1b8fe2dddc3d…` — match |

- Ordering: row 386 appended `2026-08-30T03:43:05.000Z` < E1 `05:44:20.417Z` < E2 `05:48:31.703Z`. The freeze precedes every lane start so far.
- Limit of this record: `prompt_bytes: 0`, no prompt field — an in-process record does not preserve the prompt, so "the prompt that fired ⊇ `assembled-E2.md` (9086 B, `b6191f533f258209`)" is ε's transcript-side measurement, not something this ledger can show. Stated as ε's.
- Verdict token read from the lane's own file (`out-E2.raw.md`): `"verdict":"warn"`. No prose read by α; β aggregates from the raw file in the pre-committed order (row 427).
- E3: no record yet — returned partial after a 20-turn limit and was resumed by ε; a resumed in-process lane gets its id only when `record-inprocess` writes it.
