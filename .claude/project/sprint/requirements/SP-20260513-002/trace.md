# TRACE Requirements — WarpOS install/update provider smoke test + RCA

**Sprint:** `SP-20260513-002`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\prd.md`

> TRACE captures the observability + traceability + event-capture layer.
> Every smoke invocation must leave a permanent trail in `paths.eventsFile`
> so `/check:patterns`, `/issues:scan`, and `/learn:deep` can mine across runs.

## Trace Map

| Source | Requirement | Story | COPY | INPUT | ESD | Ticket | Code | Test | Release | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| user-request smoke install/update | R-1 | S-2 | C-2 | — | — | T-002-2 | `framework/releases/*/release.json` | `tests/release-postUpdateChecks.test.js` | R-1 | — |
| user-request smoke install/update | R-2 | S-1, S-6 | C-1, C-5 | IN-1..IN-5 | — | T-002-1, T-002-6 | `scripts/warpos/provider-smoke.js`, `.claude/commands/warp/setup.md` | `tests/provider-smoke.cli.test.js` | R-2 | — |
| RCA design decision | R-3 | S-3 | C-3 | IN-6 | — | T-002-3 | `.claude/agents/00-alex/.system/policy/provider-failure-modes.json` | `tests/failure-modes.catalog.test.js` | R-3 | — |
| RCA design decision | R-4 | S-4 | — | — | — | T-002-4 | `scripts/warpos/lib/provider-rca.js` | `tests/provider-rca.unit.test.js` | R-4 | — |
| Autofix design decision | R-5 | S-5 | C-4 | IN-4 | — | T-002-5 | `scripts/warpos/lib/provider-autofix.js` | `tests/provider-autofix.unit.test.js` | R-5 | — |
| Observability requirement | R-6 | S-7 | — | — | — | T-002-7 | `scripts/warpos/lib/smoke-events.js` (or inline) | `tests/smoke-events.test.js` | R-6 | — |
| Cross-platform binding-gap | R-8 | S-8 | — | — | — | T-002-8 | (contract — no new code; consumes existing `dispatch-route-guard`) | `tests/provider-smoke.windows-stdin.test.js` | R-8 | LRN-2026-04-30 |

## TR-1 — `provider-smoke` lifecycle event

**Event:** `paths.eventsFile` append, `cat: "provider-smoke"`, `type: "smoke"`
**When:** Once per smoke invocation, after all probes + RCA + autofix complete
**Captured fields:** `verdict` (green/yellow/red), `providers` (array), `duration_ms`, `catalog_version`, `exit_code`, `invoked_from` (`install` | `update` | `standalone`)
**Linked requirement:** `R-6`
**Linked story:** `S-7`
**Why we capture this:** Establishes a per-run heartbeat so `/check:patterns` can spot install/update regressions and `/learn:deep` can correlate red bursts with capsule rollouts.

## TR-2 — `provider-smoke` per-provider event

**Event:** `paths.eventsFile` append, `cat: "provider-smoke"`, `type: "probe"`
**When:** One per provider probed
**Captured fields:** `provider`, `status`, `reason` (first 200 chars), `root_cause` (from RCA), `suggestion`
**Linked requirement:** `R-6`
**Linked story:** `S-7`
**Why we capture this:** Trend-mineable per-provider failure history. Feeds `/issues:scan` for recurring red on the same provider.

## TR-3 — RCA decision event

**Event:** `paths.eventsFile` append, `cat: "provider-smoke"`, `type: "rca"`
**When:** Once per non-green provider in the smoke run
**Captured fields:** `provider`, `status`, `catalog_entry_key`, `root_cause`, `safe_to_autofix` (bool), `fallback_allowed` (bool), `catalog_version`
**Linked requirement:** `R-6`
**Linked story:** `S-4`, `S-7`
**Why we capture this:** Verifies the catalog covers real failure shapes. If `type: "rca"` events accumulate with `catalog_entry_key: "unknown_error"`, that signals a missing entry.

## TR-4 — Auto-fix attempt event

**Event:** `paths.eventsFile` append, `cat: "provider-smoke"`, `type: "autofix"`
**When:** Once per autofix attempt
**Captured fields:** `provider`, `original_status`, `fix_recipe_id`, `applied` (bool), `success` (bool, reflects re-probe verdict), `reprobe_status`
**Linked requirement:** `R-6`
**Linked story:** `S-5`, `S-7`
**Why we capture this:** Audit trail for the auto-mutating operation. If `applied=true, success=false` accumulates for a given recipe, that recipe is dropped from the catalog or moved to `safe_to_autofix: false`.

## TR-5 — Smoke verdict propagation to recurring-issues surface

**Event:** When the same `{ provider, status, root_cause }` triple appears in 3+ TR-2 events within a 7-day rolling window, `/issues:scan` surfaces it as a candidate for `/issues:log`.
**When:** Asynchronously, on `/issues:scan` invocation (not in the smoke run itself).
**Captured fields:** N/A — derived from TR-2 corpus.
**Linked requirement:** `R-6`
**Linked story:** `S-7`
**Why we capture this:** Closes the loop — recurring red doesn't just get printed each install, it eventually becomes a tracked issue with an enforcement proposal.

## Log file path

All TR-1 through TR-4 events write to `paths.eventsFile` (resolves to `.claude/project/events/events.jsonl` today). No new log file is introduced. Smoke MUST use the canonical `lib/logger.js` writer — direct `fs.appendFileSync` calls are not allowed (per `paths-as-SoT` rule in CLAUDE.md). `--json` mode writes the same events; only stdout differs.
