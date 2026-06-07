<!-- EPIC TRACKER — spec §22. Linked from ../../TRACKER.md. Template: ../templates/EPIC_TEMPLATE.md
     States (§19): Planned | Ready | Active | Blocked | Paused | Review Needed | Completed | Cancelled | Superseded -->

# E-DISPATCH-INTEGRITY-001 — Agent Dispatch & Orchestration Integrity (+ agents-folder de-dot)

- **Epic label and number:** E-DISPATCH-INTEGRITY-001
- **Title:** Agent Dispatch & Orchestration Integrity (+ agents-folder de-dot)
- **Owner:** President Agent
- **Parent roadmap area:** [../../ROADMAP.md](../../ROADMAP.md) § Epics → Active epics (⭐ TOP)
- **Goal:** End the recurring "dispatch done wrong / sprint theater" class — modes spawn teams never used; `/sprint:full` emits *coverage* telemetry with zero real dispatch yet reads green; reaped lanes leave no record. Make a real, recorded (`ok:true`) dispatch the ONLY way a phase counts as covered; collapse the divergent dispatch entrypoints toward one; de-dot/restructure the confusing agents folder.
- **Background:** Operator-directed 2026-06-07 after the recurring-dispatch problem recurred live this session (modes/teams spawned then bypassed; ε idle; `--provider claude` refused; GPT dispatch timed out). Diagnosed cross-provider: Claude (deep crawl + torture-test) + GPT-5.5 (tight). Reports: `.claude/runtime/diagnostics/diag-{claude,gpt2}.json`; evidence artifacts `runtime/diagnostic/{log-mining,contract-map}.md` + `tt/`.
- **Scope:**
  - F-1 — Kill the telemetry-only false-green: a phase counts as "covered" only with a backing `ok:true` completion record (the `gauntlet-verify` predicate). `full.js:95-116` + `scan:sprint-manager-consult` + `scan:sprint-hook-coverage`; either default `/sprint:full` to `--epsilon-dispatch` or reject the non-dispatch coverage path.
  - F-2 — Resolve the two-world seam: the in-process roster MUST be dispatched by a World-A agent (ε-the-agent / α via the Agent tool) with `record-inprocess` writing the backing record; demote `full.js` to a state-machine/ledger helper that never emits dispatch-telemetry it didn't perform.
  - F-3 — `gauntlet-verify` runId/`--since` correlation: filter by `sprint_id`; refuse a whole-ledger verify so a historic `ok:true` can't green a never-run lane.
  - F-4 — De-dot + restructure the agents folder: one visible convention (no `.system`/`_system`/`.system.md` collision), one canonical dispatch-guide (delete the stale-and-wrong orphan), per the recommended tree; both-layers rename (specs + scripts/paths). Absorbs the parked "simplify .claude/agents" roadmap item.
  - F-5 — Harden residual silent surfaces: `dispatch-agent.js` provider-unavailable writes a record; reap-census check; `cli.js` skip-by-visible-`_` not `startsWith(".")`.
- **Out of scope:** A live full `/sprint:full --epsilon-dispatch` end-to-end run (proved each route in isolation; F-2 delivers the live run). `.system.md` product-leakage scrub (flag to scan:framework-purity; folded into F-4).
- **Current state:** Active
- **Percent completion:** 0% — diagnosed cross-provider + fixes scoped; no fix built yet. (The diagnosis itself + this epic are the deliverables of the 2026-06-07 session.)

## Definition of Done
- [ ] F-1: a `manager_consult` coverage record alone no longer satisfies `scan:sprint-manager-consult`/`scan:sprint-hook-coverage` — a backing `ok:true` completion record is required (test: a coverage-only sprint FAILS the enforcer).
- [ ] F-2: `/sprint:full` (or its successor conduct path) dispatches the in-process roster via a World-A conductor with real `record-inprocess` records; `full.js` emits no dispatch-telemetry it didn't perform.
- [ ] F-3: `gauntlet-verify` requires a window / correlates by `sprint_id`; the T3 historic-green false-positive no longer passes.
- [ ] F-4: agents folder de-dotted to one visible convention; one dispatch-guide copy; `scan:references` green; `scan:role-parity` + `test-dispatch-config.js` green after the both-layers rename.
- [ ] F-5: provider-unavailable + reap leave a ledger trace; `cli.js` no longer drops dot-named specs silently.

## Related definitions
- Wiring, Verification, Evidence, Dispatch, Completion — see ../../TRACKER.md

## Related sprints
- F-1 false-green-kill — Planned (the highest-leverage fix; closes RC-2 + activates RC-4's enforcer)
- F-2 two-world-seam resolution — Planned (closes RC-1)
- F-3 gauntlet-verify runId/since — Planned (closes RC-4/G4)
- F-4 agents-folder de-dot — Planned (closes RC-5-hazard; absorbs the parked simplify-.claude/agents item)
- F-5 silent-surface hardening — Planned (closes RC-3 census residuals)

## Dependencies
- None hard. Pairs with the parked "simplify .claude/agents folder" roadmap item (absorbed as F-4).

## Blockers
- None currently recorded.

## Risks
- F-4 is a both-layers rename (specs + the imperative scripts/paths/fallback-table layer); a green spec↔registry bijection will MASK an un-migrated runtime — likelihood medium · impact high · mitigation: per the `rename-cutover-covers-both-layers` learning, repoint scripts/** + paths + fallback tables in the same change, verify via `scan:cutover-completeness` + `test-dispatch-config.js` before deleting old paths.
- F-1 changing the coverage-enforcer contract could surface historic sprints as retroactively-uncovered — mitigation: a date-cutoff legacy exemption (as `scan:sprint-beta-honesty` does).

## Decisions
- 2026-06-07: hidden-`.` ruled NOT the dispatch root cause (Claude tested 4 ways, 0/24,433 log evidence) despite GPT judging it likely; de-dot retained as F-4 for maintainability, not as the cause-fix. Cross-provider divergence resolved in favor of the better-grounded (Claude) verdict.

## Open questions
- F-1 mechanism: default `/sprint:full` to `--epsilon-dispatch` vs. reject the non-dispatch coverage path at the enforcer — decide at F-1 design (the enforcer-side change is the more fail-closed of the two).

## Session log
### 2026-06-07 — Session session/2026-06-06 (cross-provider diagnosis + epic creation)
- Agent(s): President Agent (α) + dispatched diagnosticians (Claude deep, GPT-5.5 tight) · Mode: sprint marker set, but conducted α-foreground (honest)
- Work performed: Operator directed a cross-provider deep diagnosis of the recurring dispatch-failure class. Dispatched Claude (`claude -p --agent general-purpose`, deep crawl + torture-test) + GPT-5.5 (`dispatch-agent.js … --provider openai`, tight inlined). Synthesized: dispatch primitives sound; orchestration layer broken (RC-2 telemetry-only-default false-green is the deepest defect; RC-1 two-world seam; RC-3 reap; RC-4 caller-dependent verify; RC-5 hidden-`.` NOT the cause). Created this epic + placed it ⭐ TOP of ROADMAP § Active epics.
- Files changed: ../../ROADMAP.md (epic entry + priority-ordering); this tracker.
- Paths changed: +`runtime/diagnostic/` evidence artifacts (log-mining, contract-map, tt/); +`.claude/runtime/diagnostics/diag-{claude,gpt2}.json`.
- Decisions: hidden-`.` ruled not-the-cause (see Decisions).
- Issues discovered: the cross-provider GPT route timed out at the 900s bound on a long task (a dispatch limitation, itself folded into the diagnosis).
- State change: (new) → Active · Completion: 0%.
- Verification performed: torture-test green (guard 12/12; reap-catcher; real qa→openai PONG; gauntlet-verify T3 false-green demonstrated).
- Validation run: `node scripts/trackers/validate.js` (run after this file lands).
- Next action: F-1 (see Current next action).
- Evidence/references: diag-{claude,gpt2}.json; runtime/diagnostic/*; full.js:653 / :95-116; epsilon-runtime.js:442-444; RI-004; ED-018/032.

## Change log
### 2026-06-07 — Epic created (President α) — cross-provider dispatch diagnosis
- Changed: Created E-DISPATCH-INTEGRITY-001 at Active/0%, ⭐ TOP of the roadmap.
- Reason: operator-directed cross-provider diagnosis of the recurring dispatch-failure class; the diagnosis converged on the orchestration-layer false-green as the root, refuting the hidden-`.` hypothesis as the cause.
- Affected: ../../ROADMAP.md (Active epics + priority-ordering); this tracker.
- Previous state: no epic owned the recurring dispatch problem (scattered across RI-004, ED-018/032, the parked simplify-.claude/agents item).
- New state: one ⭐ TOP epic with cross-provider-grounded root causes + 5 scoped fixes.

## Evidence log
### 2026-06-07 — cross-provider diagnosis
- Evidence type: Diagnostic reports + torture-test results.
- Detail/location: `.claude/runtime/diagnostics/diag-claude.json` (deep, 23KB), `diag-gpt2.json` (tight, 5.7KB); `runtime/diagnostic/{log-mining,contract-map}.md` + `tt/guard-test.js` + isolated ledgers.
- Verified by: President Agent (read both reports; cross-checked the RC-2 claim against `full.js:95-116`/`:178-179` + `.claude/commands/sprint/full.md:93`). Supports: the 0% Active state + the F-1-first ordering.

## Verification log
| Item | Should exist? | State | Where / wired where | Proof | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| Two-world seam | n/a | Verified Exists (by design) | `full.js:653`, `epsilon-runtime.js:442-444` | read in code | 2026-06-07 | President Agent |
| `/sprint:full` no `--epsilon-dispatch` default | Yes (the defect) | Verified Exists | `.claude/commands/sprint/full.md:93` + `full.js:178-179` | grep | 2026-06-07 | President Agent |
| Route guard | Yes | Verified Wired | `dispatch-route-guard.js` | torture-test 12/12 PASS | 2026-06-07 | Claude diagnostic |
| Hidden-`.` skips instructions | No (hypothesis) | Verified Nonexistent (as a cause) | manifest walker + spec-resolver + Glob/Grep all traverse dot-dirs | 0/24,433 log evidence; 4-way test | 2026-06-07 | Claude diagnostic |

## Current next action
F-1 — Kill the telemetry-only false-green: make a backing `ok:true` completion record (the `gauntlet-verify` predicate) the precondition for any phase to count as covered. Touch `scripts/sprint/full.js:95-116`, `.claude/commands/sprint/full.md:93`, `scripts/checks/sprint-manager-consult.js`, `scripts/checks/sprint-hook-coverage.js`. Decide at design: default `/sprint:full` to `--epsilon-dispatch` vs. reject the non-dispatch coverage path at the enforcer (prefer the enforcer-side, more fail-closed).

## Completion record
- Final state: Not yet complete (Active, 0%)
- Percent completion: n/a
- Completion timestamp: n/a
- Definition of done used: see Definition of Done above (spec §37)
- Evidence of completion: n/a — diagnosed only; no fix built yet
- Session IDs / dates / agents: session/2026-06-06 / 2026-06-07 / President Agent (+ Claude/GPT-5.5 diagnosticians)
- Related completed sprints: None
- Remaining follow-up items: F-1..F-5 (all planned)
- Related untracked work: None
- ../../TRACKER.md updated: pending (Active-Epics row) · Roadmap reconciled: Yes (⭐ TOP entry + priority-ordering)
