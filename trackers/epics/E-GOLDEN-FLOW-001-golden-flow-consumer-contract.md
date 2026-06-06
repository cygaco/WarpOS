<!-- EPIC TRACKER — spec §22. Linked from ../../TRACKER.md. Template: ../templates/EPIC_TEMPLATE.md
     States (§19): Planned | Ready | Active | Blocked | Paused | Review Needed | Completed | Cancelled | Superseded -->

# E-GOLDEN-FLOW-001 — Golden-Flow End-to-End Hardening + Executable Consumer-Contract Gate

- **Epic label and number:** E-GOLDEN-FLOW-001
- **Title:** Golden-Flow End-to-End Hardening + Executable Consumer-Contract Gate
- **Owner:** President Agent
- **Parent roadmap area:** `/warp:reconcile` golden-flow thrust — see ../../ROADMAP.md § Epics → Active epics (and the two `🔭 … TOP PRIORITY` reconcile blocks + the `🔭 Root-cause deepening` detail that feed it)
- **Goal:** Make the bootstrap on-ramp → on-screen "WOW" on a clean machine the hardened core target, generalized across all portfolio products, and prove the exact sealed capsule a consumer pins survives a real consumer lifecycle (`setup → scan:install → real sprint → dispatch telemetry → update`, both repo roles, cold + warm) before external users hit it.
- **Background:** The companycam/dreamteam/almanac/masterconsole `WARPOS.md` reconciliation surfaced a deeper generator than "downstream missing": **contractless productization** — no hard boundary between authoring state and the shipped runtime contract (canonical is source + test + artifact + only-user at once). That root sits behind ~every downstream `WARPOS.md` gap; the executable consumer-contract gate is the structural cure (it consumes the exact artifact downstream receives instead of diffing a static manifest). Operator-directed 2026-06-02 (golden-flow-first reprioritization): hardening the golden flow *is* the engine's core job.
- **Scope:** The executable consumer-contract gate (sealed-capsule isolation with canonical inaccessible + both-role cold+warm lifecycle, fail-closed); the shared repo-role resolver (ED-009 — one canonical-vs-consumer source every guard consults); typed success semantics (BC-16 — green = the action occurred AND a telemetry record exists); dispatch-readiness preflight wiring (`provider-smoke.js --per-role` into `/warp:health` + SessionStart + `/agents:test`); the bootstrap `:setup`/`:paint` split + EVENT-CONTRACT (typed seam events so a cockpit renders buttons not commands); smart-canon (S4 — zero `{{token}}` leak, canon-type coverage).
- **Out of scope:** The 0.16.0 manifest/ship-coverage reconciliation (that is E-CONTENT-DELIVERY-001); the per-sprint exhaustive test-suite system (that is E-TEST-SUITE-001).
- **Current state:** Active
- **Percent completion:** ~35% — the cheap-slice fresh-install smoke shipped (`ff04cd9`) and caught a real bug on first run (`manifest.warpos.version = "0.1.0"` ≠ `version.json`, a version-quorum mismatch fixed in `scaffold-core.js#resolveWarposVersion`); the S1/W1/S3/S5 golden-flow batch shipped (`ac56602`). Still open: sealed-capsule isolation + the full executable consumer contract (real sprint → dispatch telemetry → update under BOTH repo roles, cold + warm). Conservative per §20 — the cheapest leading indicator is in, the load-bearing gate is not.

## Definition of Done
<!-- Concrete, checkable criteria. Nothing reaches 100% until all are satisfied + evidenced (§20, §27). -->
- [ ] Executable consumer-contract gate runs the sealed capsule through `setup → scan:install → real sprint → dispatch telemetry → update` under BOTH repo roles, cold + warm, fail-closed
- [ ] Shared repo-role resolver (ED-009) is the single source every guard consults for canonical-vs-consumer (no guard re-derives role "from path vibes")
- [ ] Typed success semantics (BC-16) kill fail-open false-green at the contract level (green = action occurred AND telemetry record exists)
- [ ] Dispatch-readiness preflight (`provider-smoke.js --per-role`) wired into `/warp:health` + SessionStart + `/agents:test`

## Related definitions
<!-- Terms from ../../TRACKER.md §Definitions that govern this epic -->
- Wiring — see ../../TRACKER.md
- Verification — see ../../TRACKER.md
- Evidence — see ../../TRACKER.md

## Related sprints
<!-- Link each sprint tracker in /trackers/sprints/ -->
- SP-20260602-001 — retrospected — Sealed-capsule executable consumer-contract gate (the epic keystone; ledger sprint, no file link)
- SP-Pickup-Queue do-next #1/#2/#3/#5/#7/#8 — ranked in ../../ROADMAP.md § Sprint Pickup Queue (ledger sprints, referenced by rank, no file link)

## Dependencies
- Shared repo-role resolver (ED-009) — open — unblocks the gate (the both-role half) and kills a recurring false-green class
- Typed success semantics (BC-16) — open — unblocks the gate (without it the gate can itself lie)

## Blockers
- None currently recorded.

## Risks
- The launch-time freeze-vs-pull posture sets the required depth of the sealed-isolation half — a hard freeze-on-snapshot down-scopes it; an imminent pull demands the full canonical-inaccessible isolation. Likelihood: medium · Impact: high · Mitigation: build the both-role lifecycle half first (independent of posture), confirm MC launch date/posture before scoping the isolation half.

## Decisions
- 2026-06-02 — Golden-flow-first reprioritization: the bootstrap on-ramp → on-screen "WOW" on a clean machine is the main hardening target, generalized across all portfolio products — rationale: hardening this is the engine's core job (get any product to on-screen/PMF); operator-directed.
- 2026-05-30 — Freeze-vs-pull is a launch-time call; because pull is a live possibility, the consumer-contract gate is the keystone either way — rationale: it makes a pull-posture safe, certifies a freeze snapshot, and produces the stability signal that informs the call.

## Open questions
- Confirm MC launch date/posture — it sets the required depth of the sealed-isolation half. Owner: operator (President surfaces the tradeoff).

## Session log
<!-- Append-only (§24). One entry per meaningful session; use SESSION_LOG_TEMPLATE.md fields. -->
### 2026-06-06 — Session 2026-06-06-tracker-T5-migration (june-5)
- Agent(s): President Agent via systems builder · Mode: sprint
- Work performed: Created this epic file as part of the T5 roadmap→epic migration — authored from the §22 epic template, deepened from the ROADMAP golden-flow reconcile + root-cause-deepening detail blocks.
- Files changed: trackers/epics/E-GOLDEN-FLOW-001-golden-flow-consumer-contract.md (new) · Paths changed: none · Wirings changed: none (authoring only)
- Decisions: see Decisions section.
- Definitions added/changed: None
- State change: (new file) → Active · Completion change: 0% → ~35%
- Verification performed: confirmed the file did not previously exist before authoring · Validation run: `node scripts/trackers/validate.js` · Validation result: PASS (12/12, exit 0)
- Next action: build the executable consumer-contract gate (sealed-capsule isolation + both-role cold+warm lifecycle); land the shared repo-role resolver first.
- Evidence/references: ../../ROADMAP.md § Epics → E-GOLDEN-FLOW-001; commits `ff04cd9` (fresh-install smoke) + `ac56602` (S1/W1/S3/S5); SP-20260602-001 in the ledger.

## Change log
<!-- §25 -->
### 2026-06-06 — Session 2026-06-06-tracker-T5-migration
- Changed: Created E-GOLDEN-FLOW-001 epic tracker file.
- Reason: T5 of E-TRACKER-001 — migrate the ROADMAP golden-flow thrust into an epic tracker file (spec §29, Roadmap item == Epic).
- Affected: new trackers/epics/E-GOLDEN-FLOW-001-golden-flow-consumer-contract.md; linked from ../../ROADMAP.md § Epics and ../../TRACKER.md.
- Previous state: No epic tracker file existed for the golden-flow thrust (ROADMAP entry only).
- New state: Epic tracker authored; Active at ~35%.

## Evidence log
<!-- §26 — concrete enough that another agent can resume/verify without memory -->
### 2026-06-06 — Cheap-slice fresh-install smoke shipped and caught a real first-run bug
- Evidence type: Command run
- Detail/location: `scripts/warpos/test-fresh-install-smoke.js` (commit `ff04cd9`) — spins up a fresh empty repo, runs the consumer install, asserts `scan:install` certifies it (exit 0), fail-closed on a stale manifest; first run caught `manifest.warpos.version = "0.1.0"` ≠ `version.json`, fixed in `scaffold-core.js#resolveWarposVersion`.
- Verified by: President Agent · Supports: the cheap-slice leading-indicator portion of DoD item 1 (full sealed gate still open).

## Verification log
<!-- §10 states: Verified Exists | Verified Nonexistent | Verified Wired | Verified Not Wired | Exists But Stale | Exists But Incomplete | Missing But Required | Present But Should Be Removed | Unknown -->
| Item | Should exist? | State | Where / wired where | Proof (cmd/inspection) | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| Fresh-install smoke (cheap slice) | Yes | Verified Exists | `scripts/warpos/test-fresh-install-smoke.js` | shipped `ff04cd9`; per-commit via `scripts/linters/run.js`; caught the `0.1.0` version-quorum bug | 2026-06-06 | President Agent |
| Executable consumer-contract gate (full) | Yes | Missing But Required | sealed-capsule isolation + both-role cold+warm lifecycle | not yet built — the load-bearing keystone (SP-20260602-001 retrospected, gate still open) | 2026-06-06 | President Agent |
| Shared repo-role resolver (ED-009) | Yes | Missing But Required | one source every guard consults | open — guards still re-derive role "from path vibes" (framework-purity G3.3 et al.) | 2026-06-06 | President Agent |
| Typed success semantics (BC-16) | Yes | Missing But Required | generalize `gauntlet-verify.js` + per-role smoke | open — fail-open false-green still possible at the contract level | 2026-06-06 | President Agent |
| Dispatch-readiness preflight wiring | Yes | Exists But Incomplete | `provider-smoke.js --per-role` → `/warp:health` + SessionStart + `/agents:test` | the `--per-role` ping is built but orphaned (A1/A3); not yet wired into all three entry points | 2026-06-06 | President Agent |

## Current next action
<!-- Required while state is not Completed/Cancelled/Superseded -->
Build the executable consumer-contract gate (sealed-capsule isolation + both-role cold+warm lifecycle); land the shared repo-role resolver (ED-009) first as the structural unblock.

## Completion record
<!-- Fill only on completion (§15/§37). See COMPLETION_RECORD_TEMPLATE.md. -->
- Final state: Not yet complete (Active, ~35%)
- Percent completion: n/a
- Completion timestamp: n/a
- Definition of done used: see Definition of Done section above (spec §37)
- Evidence of completion: n/a — in progress (cheap-slice fresh-install smoke shipped `ff04cd9`; S1/W1/S3/S5 shipped `ac56602`; full executable gate open)
- Session IDs / dates / agents: 2026-06-06-tracker-T5-migration / 2026-06-06 / President Agent via systems builder
- Related completed sprints: None currently recorded.
- Remaining follow-up items: executable consumer-contract gate (sealed-capsule isolation + both-role cold+warm lifecycle); shared repo-role resolver (ED-009); typed success semantics (BC-16); dispatch-readiness preflight wiring
- Related untracked work: None currently recorded.
- ../../TRACKER.md updated: No · Roadmap reconciled: Yes (../../ROADMAP.md § Epics → E-GOLDEN-FLOW-001 points here)
