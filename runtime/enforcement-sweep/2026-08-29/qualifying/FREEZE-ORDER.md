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

## E3 — terminal, appended 2026-08-30T06:21:04.000Z (α), from ε's measurements (ε's; α verifies the files below)

| lane | dispatch_id | harness agentId | role as spawned | leg 1 started | 20-turn ceiling → resumed | final message | wall-clock | raw file |
|---|---|---|---|---|---|---|---|---|
| E3 | **none — `record-inprocess` REFUSED** | `a34e63055bcb9f731` | `test-runner` (registry: a subprocess route → the in-process recorder refused to mint a row; ε did not re-run under another role) | `2026-08-30T06:02:33.770Z` | `06:05:20.174Z` | `06:08:39.367Z` | 365597 ms across two legs | `out-E3.raw.md` (token `{"verdict":"fail"}`) |

- The refusal, verbatim (ε): *"record-inprocess is for in-process routes only (CLAUDE_AGENT / AGENT_TOOL); role 'test-runner' resolves to route 'claude-raw', a CLI/subprocess role — dispatch it via node scripts/dispatch-agent.js test-runner <prompt-file> (or spawnAgent)…"* — the runtime failing closed against its own conductor's dispatch error. E3 has no `dispatch_id`; its identity is the harness transcript (ED-393).
- Containment: FALSE by arithmetic (prompt legs 1863 B / 2352 B < `assembled-E3.md` 10693 B) — ED-407 instance 2. E2's transcript is 0 B — instance 3. **Only E1's containment holds** (ledger `prompt_digest` = `assembled-E1.md`).
- Ordering: row 386 `03:43:05.000Z` < E1 `05:44:20.417Z` < E2 `05:48:31.703Z` < E3 `06:02:33.770Z`. The freeze precedes every lane start.
- E1 resume ordered under β 1d7f3a86 (row 430): a continuation of `d-mtfdwwch-491effca`, transport only; its id/started_at appended here when it exists; the close reports E1 as one lane across two dispatches.

## E1 — second dispatch (the same lane, continued after its bound-death), appended 2026-08-30T06:39Z (α)

| lane | dispatch_id | started_at | file fired | file bytes / sha256 | bound | route |
|---|---|---|---|---|---|---|
| E1 (dispatch 2 of 2) | `d-mtffqf0q-48df5464` | `2026-08-30T06:35:17.258Z` | `assembled-E1-3.md` — confirmed from the live wrapper's argv (PID 64040 `node scripts/dispatch-agent.js cabinet …/assembled-E1-3.md` → PID 44480 `codex.EXE exec --sandbox workspace-write -c model_reasoning_effort=ultra -m gpt-5.6-sol`, both created 06:35:17Z) | 9226 B / `ddb6a669dd04f3d6…` (α's and ε's computation; β verified by content) | 3000000 ms (α's; 2× the observed 1500 s; β's margin note: a fresh lane repeats the search then needs synthesis — thin; a second bound-death is the pre-ruled finding) | cabinet / openai / gpt-5.6-sol, wrapper-carried |

- **Reading-order position unchanged:** E1 stays first, at its ORIGINAL start `05:44:20.417Z` (β 5b9e3c74, row 434 — a re-fire's clock position is an artifact of the death). Ordering line as it stands: row 386 `03:43:05.000Z` < E1 `05:44:20.417Z` < E2 `05:48:31.703Z` < E3 `06:02:33.770Z`.
- **What this dispatch grades, by class and epoch (β 6c3f8a24 §2 principle, disclosed):** classes 1–3 at the pin `c88aac1d` via the static worktree `.claude/worktrees/enf-e1-claimtruth`; class 4 at `enforcement-debt.SNAPSHOT.jsonl` (686837 B, `e345088ab5277bab…`, 375 rows; the ledger frozen from 06:21:04Z); class 5 at the worktree's `S6-7-RESIDUALS.md` (`5673b5c9f70c55d4`, 12 entries) — the pin-time copy, which the class's close-time definition does not name; the close-time register (`104c30da0bc8efce`, 14 entries) was graded by no lane. The E1-4 form (register snapshot on its own line) was decided by α after this dispatch had fired and is withdrawn; it is the successor template's shape.
- **Containment for this dispatch:** to be read from the terminal row's `prompt_bytes` (expected 9226) and `prompt_digest` (expected `ddb6a669…`) — the ledger's, not anyone's report. Envelope-only diff vs the first dispatch's bytes: L6, L8, L9 (three lines, two hunks — ε's count over β's "three hunks"); brief bytes identical.
- **The worktree's evidence directory carries no sibling returns and no predecessor notes** (its `qualifying/` = three briefs + `enforcer-blocked-at-06669fbe.json`; verified by α, by ε, and by β's own read). E1 can read its siblings' briefs (method, committed at the pin), not their returns.
- Terminal row awaited; bound expiry ≈ `07:25:17Z`.
