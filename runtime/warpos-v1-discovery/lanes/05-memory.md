# Memory / Events / Learning — Discovery Report (disc-memory, 2026-07-09)

## Store inventory (real counts — 2026-07-09)

Semantic memory (`.claude/project/memory/`, all JSONL, append-only, guarded by `memory-guard.js` PreToolUse fail-closed):
| Store | paths key | Lines | Bytes | Last write | Writer | Reader(s) |
|---|---|---|---|---|---|---|
| learnings.jsonl | learningsFile | **126** | 106K | 06-17 | `logLearning()`, `append-learning.js`, assess-session | smart-context, learn:integrate, learning-validator |
| systems.jsonl | systemsFile | 90 | 79K | 06-22 | discover:systems | scan:system, learning-validator schema check |
| beta-honesty-waivers.jsonl | betaHonestyWaivers | 108 | 84K | 06-27 | β-gate | scan:sprint-beta-honesty |
| enforcement-debt.jsonl | enforcementDebt | 60 | 94K | 06-20 | enforcement:log | enforcement:list, scan:full |
| traces.jsonl | tracesFile | **10** | 17K | 06-08 | reasoning:log | smart-context (near-dead: 10 entries, stale ~1mo) |
| recurring-issues.jsonl | recurringIssuesFile | 7 | 9K | 06-11 | issues:log | issues:list |

All append-only; mutable only via logger/allowlisted writers. `learning-validator.js` PostToolUse is advisory (warn-only, never blocks).

## Events analysis
- **Split by category, NOT by date.** One monolithic `events.jsonl` (**53,222 lines / 17.2 MB**) is master; `logger.js:94` fans out copies to per-category files (`tools.jsonl` 29K/9.2MB, `requirements.jsonl` 890, `manager-consult.jsonl` 607). Declared-but-absent on disk: `skill-usage.jsonl`, `code.jsonl`, `plans.jsonl`, `requirements-staged.jsonl`.
- Category mix: tool 29,014 · audit 20,190 · spec 890 · prompt 833 · inbox 633 · manager_consult 607 · modification 494 · team-lifecycle 292 · decision 81 · lifecycle 58 · learning 46 · beta 5.
- **No compaction/rotation** (`compact-saver.js` is session-compaction telemetry, unrelated). `query()` reads the whole 17MB file and scans backwards (`logger.js:369`) — O(file) per read, unbounded.
- **No write-time schema validation** — `log()` appends any object; readers JSON.parse/skip-malformed.
- **Real consumers that ACT (not write-only telemetry):** `beta-gate.js`, `gauntlet-gate.js`, `cycle-enforcer.js`, `authorization-gate.js`, `dispatch-route-guard.js`, `check-guard-promotion.js` (7-day audit-count → promotion candidate), `handoff-live.js`, smart-context. The bulk (tool/audit, ~49K rows) is pure telemetry.

## Learning promotion (enforced or PROSE?)
**PROSE + one-directional partial mechanism — the v1 promotion rule is NOT enforced.**
- `learning-lifecycle.md`: logged→validated→implemented, "never self-promote," `implemented_by` provenance. Current split: **51 logged · 5 validated · 2 applied · 22 implemented** (+1 pending, +1 pending_validation). 109 of 126 score 0. 32 rows carry `implemented_by`.
- The ONLY mechanism (`learning-validator.js:96`) checks the FORWARD direction: IF status=="implemented" THEN `implemented_by` present + valid-prefix (`hook:`/`rule:`/`lint:`/`gate:`/`guard:` or real file). Advisory (warn-only), inspects only the last 3 lines of a write.
- **Nothing detects the reverse** — a learning stuck `logged`/`validated` forever with no enforcer. The "no lesson complete until it becomes a hook/check/test/fixture" rule lives in CLAUDE.md prose only. **Classification: PROSE.**
- The attestation trail (`logger.js:21`; re-emit when target disappears) is **inert — 0 attestation events in events.jsonl.** `emit-attestation-events.js` is a self-described "one-shot Batch D helper" with hardcoded IDs; the "future /learn:integrate emits inline" promise is unfulfilled → stale learning→enforcer pointers are NOT self-detected.

## smart-context
- UserPromptSubmit hook (`smart-context.js`). One **Haiku** call/prompt (`claude-haiku-4-5`, max_tokens 1000, 15s timeout): infers intent, optionally rewrites prompt, selects 5-7 learnings / 0-3 traces / decisions / state / inbox as `additionalContext`. Dark-by-default skill ranker (`SKILL_RANKER_ENABLED`).
- Cost: ~1 Haiku call per non-slash/non-approval prompt; MAX_LEARNINGS 60 tail-slice (full 126 pool timed out at 8s — LRN-2026-04-17). Session dedup on OUTPUT (`injected.json` md5).
- **Failure mode: fail-open "smart or nothing"** — no key/timeout/parse-error → original prompt passes through, zero context, silent.
- **Helm-neutral equivalent: NONE.** Hardcoded `api.anthropic.com` + `ANTHROPIC_API_KEY` (`smart-context.js:386`) inside a Claude-Code-specific UserPromptSubmit hook returning `hookSpecificOutput.additionalContext`. **MECH-CLAUDE — the single biggest helm-lock in the subsystem.**

## Maps staleness (real mtimes)
- `scripts/regen-maps.js` (47K) regenerates. Bulk-regenerated **2026-06-27 19:37** (SPEC_GRAPH, enforcements, hooks, memory.jsonl, skills, tools, systems).
- **Confirmed stale vs sources:** `.stale.json` flags skills/hooks/enforcements/memory/tools stale since **2026-06-08/09** (triggers scan/full.md, handoff-live.js, turbo.md) — never cleared. `inventory-memory.json` (gen 2026-06-28 02:37) reports events **51,845** vs **53,222** actual, and beta-waivers **42** vs **108** actual — materialized inventory lags live stores by ~1,400 events and is materially wrong on waivers.
- Oldest untouched: `system-coherence.graph.json` (06-08), `guide-integration.jsonl`/`knowledge-integration.jsonl` (06-13). Maps are **manual/skill-triggered pull-regeneration, not event-driven** → chronic drift.

## Rebuild needs
- **KEEP:** append-only JSONL + `memory-guard` fail-closed protection; `logLearning()` as the single canonical write path (already fixed the silent-write bug); category-fan-out concept; the lifecycle status model.
- **EVOLVE:** split `events.jsonl` → `_events/YYYY-MM-DD/*.jsonl` (v1 design) — the monolith + whole-file `query()` is the scaling wall; add write-time schema validation; make maps/inventory **materialized views regenerated FROM events on a hook**, not a manual skill (kills the 06-08 staleness class); add compaction/rotation (absent).
- **REPLACE (promotion-enforcement):** turn the promotion "rule" into a real gate — flag any `validated` learning older than N days with no `implemented_by`; re-activate attestation re-emit so dead enforcer pointers self-detect; promote `learning-validator` advisory → gating for the completeness (reverse) direction. All PROSE/inert today.
- **HELM-NEUTRAL:** replace `smart-context.js` (Claude-API-only injection) with a **memory-query API/CLI any helm can call** (`warpos memory recall <prompt>`) so a non-Claude helm gets the same learnings/traces/decisions selection without the harness `additionalContext` hook. This is the critical gap: memory recall is 100% Claude-Code-bound today.

Pointers: `scripts/hooks/lib/logger.js:94` (fan-out), `:288` (logLearning), `:369` (whole-file read); `scripts/hooks/smart-context.js:386` (hardcoded Anthropic host); `scripts/hooks/learning-validator.js:96` (forward-only promotion check); `scripts/hooks/memory-guard.js:19` (append-only guard); `.claude/project/maps/.stale.json` (uncleared staleness since 06-08).
