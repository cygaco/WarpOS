<!-- SPRINT TRACKER — spec §23. Linked from ../../TRACKER.md. Template: ../templates/SPRINT_TEMPLATE.md
     States (§19): Planned | Ready | Active | Blocked | Paused | Review Needed | Completed | Cancelled | Superseded -->

# T6 — Mode Wiring

- **Sprint label and number:** T6
- **Title:** Mode wiring — tracker checks into all relevant modes
- **Owner:** President
- **Parent epic:** [E-TRACKER-001](../epics/E-TRACKER-001-enforced-tracker-system.md)
- **Goal:** Wire tracker consultation, definition checks, and path/wiring verification into all relevant modes (§28.1/§34) — not only sprint mode — so any mode that can create, modify, complete, define, discover, verify, or reinterpret long-running work interacts with the tracker, with each wiring verified in the actual implementation (§34).
- **Scope:** §34 wirings for sprint / roadmap / epic-planning / implementation / review / debugging / refactor / documentation / agent-coordination / handoff-resumption / validation modes (+ research mode when it affects plans/definitions); definition-enforcement, start-of-work, end-of-work, completion-gate, path-verification, wiring-verification checks; each wiring recorded with name/purpose/source/target/verification-method/result/evidence/date/agent (§34); modes that perform work but do not consult the tracker are a validation failure (§28.7).
- **Out of scope:** The validator itself (T4 builds it; T6 wires modes to it); roadmap migration (T5).
- **Current state:** Planned
- **Percent completion:** 0% — Not started.

## Definition of Done
- [ ] Tracker consultation wired into every relevant mode (§28.1)
- [ ] Definition-enforcement, start-of-work, end-of-work, completion-gate, path- and wiring-verification checks wired (§34)
- [ ] Every wiring recorded with the §34 fields and VERIFIED in the actual implementation (not prose)
- [ ] No mode that performs meaningful work bypasses the tracker (§28.7); off-sprint work routes to UNTRACKED_WORK.md (§7.9)
- [ ] Validation confirms no "mode can work but does not consult tracker" failures remain

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
- None currently recorded.

## Paths expected to exist
- The wired mode entry points (existing files, to be modified)

## Paths verified to exist
- None currently recorded.

## Paths verified nonexistent
- None currently recorded.

## Wirings expected
- Sprint, roadmap, epic-planning, implementation, review, debugging, refactor, documentation, agent-coordination, handoff/resumption, validation (and research-when-relevant) mode tracker checks; definition-enforcement; start-of-work; end-of-work; completion-gate; path-verification; wiring-verification (§34).

## Wirings verified
- None currently recorded.

## Dependencies
- T1 (TRACKER.md + definitions), T4 (validator to wire into completion gate + to confirm coverage).

## Blockers
- None currently recorded.

## Risks
- Prose-only "wired" claims without implementation evidence (§34) — mitigation: verify each wiring in the actual code/config and record proof. Likelihood: medium · Impact: high.

## Decisions
- None currently recorded.

## Open questions
- Which existing WarpOS mode entry points map to each §28.1 mode (some are skills, some are agent specs, some are hooks)? — to inventory at sprint start.

## Session log
- None currently recorded.

## Change log
### 2026-06-05 — Session 2026-06-05-tracker-scaffold
- Changed: Created T6 sprint stub.
- Reason: Seed E-TRACKER-001 planned sprints.
- Affected: trackers/sprints/T6-mode-wiring.md.
- Previous state: Did not exist.
- New state: Planned, 0%.

## Evidence log
- None currently recorded.

## Verification log
| Item | Should exist? | State | Where / wired where | Proof (cmd/inspection) | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| Mode→tracker wirings (§34) | Yes | Unknown | modes / hooks | not yet inspected | 2026-06-05 | Alpha |

## Current next action
Start after T1/T4 — enumerate all relevant modes (§28.1) and their entry points, then wire tracker/definition/path-wiring checks into each.

## Completion record
- Final state: Not yet complete (Planned)
- Percent completion: 0%
- Completion timestamp: n/a
- Definition of done used: see Definition of Done section above
- Evidence of completion: n/a
- Session IDs / dates / agents: n/a
- Parent epic: E-TRACKER-001
- Remaining follow-up items: entire sprint
- Related untracked work: None
- ../../TRACKER.md updated: No · Roadmap reconciled: No
