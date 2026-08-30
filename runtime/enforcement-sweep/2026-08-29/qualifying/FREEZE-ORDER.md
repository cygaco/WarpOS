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

### Correction to the E2 entry above — appended 2026-08-30T06:08Z (α), on ε's disclosure

- The sentence *"the prompt that fired ⊇ `assembled-E2.md` … is ε's transcript-side measurement"* is SUPERSEDED: there is no such measurement. ε disclosed that the E2 and E3 Agent prompts carry the `scopeContract` plus an instruction to **read `assembled-E*.md` at its absolute path in full** — the assembled bytes are referenced, not inlined. `assembled-E2.md ⊄ the prompt that fired`. **Byte-containment is NOT citable for E2 or E3.** ε's own words: "a judgement I made silently against an instruction that specified otherwise."
- What can be cited for E2 instead, and it is a different claim: **evidence of consumption, not of transmission** — E2's return quotes back facts obtainable only by reading the file and the tree (the `SUPERSEDED by b6_correction_of_purpose` prefix; 16 rows with exactly two `contested`; `HEAD = c88aac1df718fc0772c16b6e428130a095549a6c`). The close says which claim it makes.
- E1 is unaffected: `assembled-E1.md` was piped as the prompt bytes to `dispatch-agent.js`; containment holds there (the wrapper's stdin = the file — ε's route line; the completion record for CLI dispatches carries `prompt_bytes`, to be compared against 9120 on E1's terminal row).
- ED-407 confirming instance: `prompt_bytes: 0` on an in-process row + a by-reference prompt ⇒ no artifact binds E2's prompt to `assembled-E2.md` except the lane's own quotation of its contents.
- Harness agentIds (ε's): E2 = `a6b0e660114e407fa`; E3 = `a34e63055bcb9f731` (resumed; no record id until `record-inprocess` writes one).

## E1 — terminal row, appended 2026-08-30T06:13Z (α), from the record as it exists

| lane | dispatch_id | started_at | completed_at | elapsed_ms | exit_code | stdout_bytes | stderr_bytes | ok | prompt_bytes | prompt_digest (record) |
|---|---|---|---|---|---|---|---|---|---|---|
| E1 | `d-mtfdwwch-491effca` | `2026-08-30T05:44:20.417Z` | `2026-08-30T06:09:20.655Z` | 1500238 | 1 | 0 | 4020 | false | 9120 | `sha256:bf8dfae73dd38a75…` = `assembled-E1.md` — **byte-containment holds for E1 from the ledger** |

- Death at the bound: 1500238 ms against `DISPATCH_BUILDER_TIMEOUT_MS=1500000`. `out-E1.raw` (681 B) is the wrapper's death envelope with `output: ""`; the 4020 B stderr is head-truncated into it and persisted nowhere else (`out-E1.err` 0 B). No verdict token exists → **not-reached** under AG-3.
- Codex's own session file (id `01a05132-8548-7d91-bc23-388193013fbc`): copied verbatim to `out-E1.rollout.jsonl` (1516758 B, 466 events; NOT committed — size; path + size recorded here). First event 05:44:20.710Z, last 06:09:17.263Z (3 s before the kill). Derived, marked timeline: `out-E1.rollout-DERIVED-timeline.md`.
- E3 (`a34e63055bcb9f731`, in-process, resumed once after a 20-turn ceiling): completed ~06:09Z per the harness notification; its `record-inprocess` row and `out-E3.raw.md` are ε's and pending — its `started_at` is appended here when the record exists.
- Ordering unchanged: row 386 `03:43:05.000Z` < E1 `05:44:20.417Z` < E2 `05:48:31.703Z` < E3 (pending).
