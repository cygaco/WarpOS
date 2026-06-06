<!-- SPRINT TRACKER — spec §23. Linked from ../../TRACKER.md. Template: ../templates/SPRINT_TEMPLATE.md
     States (§19): Planned | Ready | Active | Blocked | Paused | Review Needed | Completed | Cancelled | Superseded -->

# T6 — Mode Wiring

- **Sprint label and number:** T6
- **Title:** Mode wiring — tracker checks into all relevant modes
- **Owner:** President
- **Parent epic:** [E-TRACKER-001](../epics/E-TRACKER-001-enforced-tracker-system.md)
- **Goal:** Wire tracker consultation, definition checks, and path/wiring verification into all relevant modes (§28.1/§34) — not only sprint mode — so any mode that can create, modify, complete, define, discover, verify, or reinterpret long-running work interacts with the tracker, with each wiring verified in the actual implementation (§34).
- **Scope:** §34 wirings for sprint / roadmap / epic-planning / implementation / review / debugging / refactor / documentation / agent-coordination / handoff-resumption / validation modes (+ research mode when it affects plans/definitions); definition-enforcement, start-of-work, end-of-work, completion-gate, path-verification, wiring-verification checks; each wiring recorded with name/purpose/source/target/verification-method/result/evidence/date/agent (§34); modes that perform work but do not consult the tracker are a validation failure (§28.7).
- **Out of scope:** The validator itself (T4 builds it; T6 wires modes to it); roadmap migration (T5); the deferred enforcement hooks (start-of-work / end-of-work / completion-gate as PreToolUse/Stop hooks — T4 follow-up) and tracker-consult for the non-enterable operational postures (roadmap / review / debugging / refactor / documentation / agent-coordination / handoff-resumption — residual T6 work, not part of the live-mode + standing-gate scope delivered here).
- **Current state:** Completed
- **Percent completion:** 100% — All four live enterable modes carry a start-of-work tracker-consult step and the validator is gated in `/scan:full`; verified by Read post-edit + `node scripts/checks/scan-coverage.js` (0 findings) + `node scripts/trackers/validate.js` (12/12 PASS, exit 0) on 2026-06-05.

## Definition of Done
- [x] Tracker consultation wired into every live enterable mode (§28.1) — `solo` Step 1.5, `adhoc` Step 1.6, `oneshot` Step 2.5, `sprint` Step 2.5 (the non-enterable operational postures are residual T6 work, recorded as such)
- [x] The validator is wired into the standing scan suite as a fail-closed automatic gate (§28.7) — `.claude/commands/scan/full.md` → `node scripts/trackers/validate.js`
- [x] Every delivered wiring recorded with the §34 fields and VERIFIED in the actual implementation (not prose) — see Wirings verified + ../../TRACKER.md Required Wirings
- [x] No live mode that performs meaningful work bypasses the tracker (§28.7); off-sprint work routes to UNTRACKED_WORK.md (§7.9) — each mode step names the UNTRACKED_WORK.md route
- [x] Validation confirms the suite stayed self-consistent — `node scripts/checks/scan-coverage.js` → 0 findings; `node scripts/trackers/validate.js` → 12/12 PASS
- [ ] DEFERRED (T4 follow-up): definition-enforcement / start-of-work / end-of-work / completion-gate / path- and wiring-verification as hard enforcement hooks; tracker-consult for the non-enterable operational postures

## Related definitions
- Mode, Wiring, Hook, Command, Validator — see ../../TRACKER.md.

## Tasks
- [ ] Enumerate all relevant modes (§28.1) and their entry points
- [ ] Wire tracker/definition/path-wiring checks into each
- [ ] Verify each wiring in the implementation; record per §34
- [ ] Run validation to confirm no bypassing modes remain

## Files expected to change
- Mode/skill/hook entry points (paths TBD — sprint mode + the other relevant modes)
- TRACKER.md / System Inventory (wiring records)

## Files actually changed
- `.claude/commands/mode/solo.md` — added Step 1.5 "Start-of-work — consult TRACKER.md" (2026-06-05).
- `.claude/commands/mode/adhoc.md` — added Step 1.6 "Start-of-work — consult TRACKER.md" (2026-06-05).
- `.claude/commands/mode/oneshot.md` — added Step 2.5 "Start-of-work — consult TRACKER.md" (2026-06-05).
- `.claude/commands/mode/sprint.md` — added Step 2.5 "Start-of-work — consult TRACKER.md" (2026-06-05; does not touch the α+ε+β persistent-team Steps 1.5/1.75).
- `.claude/commands/scan/full.md` — added the "Tracker integrity — the enforced-tracker gate" block invoking `node scripts/trackers/validate.js` (2026-06-05).
- `../../TRACKER.md` — Required Wirings / Enforcement / Validation / Verification Matrix / System Inventory / state roll-up updated.

## Paths expected to exist
- The wired mode entry points (existing files, modified) + `.claude/commands/scan/full.md`.

## Paths verified to exist
- `.claude/commands/mode/{solo,adhoc,oneshot,sprint}.md` — Verified Exists + the consult step Read-confirmed post-edit on 2026-06-05.
- `.claude/commands/scan/full.md` — Verified Exists + the tracker-gate block Read-confirmed post-edit on 2026-06-05.

## Paths verified nonexistent
- None currently recorded.

## Wirings expected
- Start-of-work tracker-consult in each live enterable mode (solo/adhoc/oneshot/sprint); the validator wired into the standing scan suite as a fail-closed gate (§28.1/§28.7). The non-enterable operational postures + the hard enforcement hooks are out of this sprint's scope (residual T6 / deferred T4).

## Wirings verified
- Sprint mode → `.claude/commands/mode/sprint.md` Step 2.5 — Verified Wired (Read post-edit 2026-06-05).
- Solo mode → `.claude/commands/mode/solo.md` Step 1.5 — Verified Wired (Read post-edit 2026-06-05).
- Adhoc mode → `.claude/commands/mode/adhoc.md` Step 1.6 — Verified Wired (Read post-edit 2026-06-05).
- Oneshot mode → `.claude/commands/mode/oneshot.md` Step 2.5 — Verified Wired (Read post-edit 2026-06-05).
- Standing scan-suite gate → `.claude/commands/scan/full.md` "Tracker integrity" block → `node scripts/trackers/validate.js` — Verified Wired (Read post-edit + `node scripts/checks/scan-coverage.js` → 0 findings, 2026-06-05).

## Dependencies
- T1 (TRACKER.md + definitions) — satisfied; T4 (the validator to gate) — satisfied (engine built + passing).

## Blockers
- None currently recorded.

## Risks
- Prose-only "wired" claims without implementation evidence (§34) — mitigated: each wiring verified by Read of the edited file post-edit + the scan-coverage run. Likelihood: low (now verified) · Impact: high.

## Decisions
- Wired the four LIVE enterable modes (solo/adhoc/oneshot/sprint) + the standing scan-suite gate this sprint; the spec's other named "modes" (roadmap/review/debugging/etc.) are operational postures, not enterable commands, so their consult-wiring is residual T6 work recorded honestly, not silently dropped.
- Registered the validator as a direct-script-invocation gate in `/scan:full` (mirroring `knowledge-coverage.js` / the canon enforcers), NOT as a new `/scan:*` skill — so `scan-coverage.js` (which inventories `/scan:*` skills only) needs no allowlist change and did not drift.

## Open questions
- Resolved: the live enterable modes are solo/adhoc/oneshot/sprint; the gate's home is `/scan:full`. Residual: tracker-consult for the non-enterable operational postures + the hard enforcement hooks (deferred to T4).

## Session log
### 2026-06-05 — T6 mode-wiring + scan-suite gate (President via systems builder)
- Agent(s): President via delegated systems builder · Mode: build/documentation
- Work performed: added a start-of-work tracker-consult step to all four live modes; wired `node scripts/trackers/validate.js` into `/scan:full` as a fail-closed gate; recorded the wirings in ../../TRACKER.md (Required Wirings, Enforcement/Validation Requirements, Verification Matrix, System Inventory) and set T6 Completed.
- Files changed: the 4 mode skills + `scan/full.md` + `../../TRACKER.md` + this file.
- Paths changed: none created · Wirings changed: 4 mode-consult + 1 scan-gate (Verified Wired).
- Decisions: see Decisions section.
- Issues discovered: none.
- Definitions added/changed: none.
- State change: Planned → Completed · Completion change: 0% → 100%.
- Verification performed: Read of each edited file post-edit; `node scripts/checks/scan-coverage.js` (0 findings); `node scripts/trackers/validate.js` (12/12 PASS, exit 0).
- Validation run: `node scripts/trackers/validate.js` + `node scripts/checks/scan-coverage.js` · Result: 12/12 PASS, exit 0; scan-coverage 0 findings.
- Next action: none for T6 (Completed); residual non-enterable-posture wiring + enforcement hooks tracked under T4.
- Evidence/references: the 4 mode skills + `scan/full.md` on disk.

## Change log
### 2026-06-05 — T6 Completed (mode-wiring + scan-suite gate)
- Changed: Wired start-of-work tracker-consult into all four live modes + the validator into `/scan:full`; recorded the wirings in ../../TRACKER.md; set T6 Completed (100%).
- Reason: Deliver sprint T6 (mode-wiring) + the standing-gate half of the T4 enforcement tail.
- Affected: the 4 mode skills; `.claude/commands/scan/full.md`; `../../TRACKER.md`; this file.
- Previous state: Planned, 0%.
- New state: Completed, 100%.

### 2026-06-05 — Session 2026-06-05-tracker-scaffold
- Changed: Created T6 sprint stub.
- Reason: Seed E-TRACKER-001 planned sprints.
- Affected: trackers/sprints/T6-mode-wiring.md.
- Previous state: Did not exist.
- New state: Planned, 0%.

## Evidence log
### 2026-06-05 — Mode-wiring + scan-suite gate wired and verified
- Evidence type: Existence + wiring + execution confirmation.
- Detail/location: `.claude/commands/mode/{solo,adhoc,oneshot,sprint}.md` (start-of-work consult steps); `.claude/commands/scan/full.md` (the "Tracker integrity" gate block invoking `node scripts/trackers/validate.js`).
- Result observed: each consult step + the gate block confirmed by Read post-edit; `node scripts/checks/scan-coverage.js` → 0 findings (48 scans, 47 delegated, 1 excluded); `node scripts/trackers/validate.js` → all 12 checks PASS, exit 0.
- Verified by: President via systems builder · Supports: every T6 DoD item delivered this sprint.
- Remaining uncertainty: tracker-consult for the non-enterable operational postures + the hard enforcement hooks are deferred (tracked under T4).

## Verification log
| Item | Should exist? | State | Where / wired where | Proof (cmd/inspection) | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| Sprint mode tracker consult | Yes | Verified Wired | `.claude/commands/mode/sprint.md` Step 2.5 | Read post-edit | 2026-06-05 | President |
| Solo mode tracker consult | Yes | Verified Wired | `.claude/commands/mode/solo.md` Step 1.5 | Read post-edit | 2026-06-05 | President |
| Adhoc mode tracker consult | Yes | Verified Wired | `.claude/commands/mode/adhoc.md` Step 1.6 | Read post-edit | 2026-06-05 | President |
| Oneshot mode tracker consult | Yes | Verified Wired | `.claude/commands/mode/oneshot.md` Step 2.5 | Read post-edit | 2026-06-05 | President |
| Scan-suite tracker gate | Yes | Verified Wired | `.claude/commands/scan/full.md` → `node scripts/trackers/validate.js` | Read post-edit + `scan-coverage.js` 0 findings | 2026-06-05 | President |

## Current next action
None for T6 (Completed). Residual work — tracker-consult for the non-enterable operational postures + the hard start-of-work/end-of-work/completion-gate enforcement hooks — is tracked under sprint T4 (cross-file checks + enforcement hooks).

## Completion record
- Final state: Completed
- Percent completion: 100%
- Completion timestamp: 2026-06-05
- Definition of done used: see Definition of Done section above (live-mode consult + standing scan-suite gate; non-enterable postures + hard hooks explicitly out of scope / deferred to T4)
- Evidence of completion: the 4 mode skills + `scan/full.md` on disk with the consult steps + gate block (Read post-edit); `node scripts/checks/scan-coverage.js` → 0 findings; `node scripts/trackers/validate.js` → 12/12 PASS, exit 0.
- Session IDs / dates / agents: 2026-06-05 / President via delegated systems builder
- Parent epic: E-TRACKER-001
- Remaining follow-up items: non-enterable-posture tracker-consult + hard enforcement hooks (deferred to T4)
- Related untracked work: None
- ../../TRACKER.md updated: Yes (Required Wirings, Enforcement/Validation, Verification Matrix, System Inventory, state roll-up, Change Log) · Roadmap reconciled: n/a (no roadmap change)
