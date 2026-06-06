<!-- SPRINT TRACKER — spec §23. Linked from ../../TRACKER.md. Template: ../templates/SPRINT_TEMPLATE.md
     States (§19): Planned | Ready | Active | Blocked | Paused | Review Needed | Completed | Cancelled | Superseded -->

# T3 — System Inventory + Verification Matrix

- **Sprint label and number:** T3
- **Title:** System Inventory + Verification Matrix
- **Owner:** President
- **Parent epic:** [E-TRACKER-001](../epics/E-TRACKER-001-enforced-tracker-system.md)
- **Goal:** Build the System Inventory (§9) and the Verification Matrix (§10) so every tracker-relevant component is inventoried and every referenced path/wiring is proven (existence, nonexistence, state, wiring) rather than assumed.
- **Scope:** §9 System Inventory (every file/dir/template/mode/hook/command/validator/agent-role/artifact with expected vs verified path+state, wiring, verification method/timestamp/agent); §10 Verification Matrix populated with the allowed verification states for every required item in this spec.
- **Out of scope:** New TRACKER.md skeleton (T1); templates (T2); validation engine (T4); roadmap migration (T5); mode wiring (T6).
- **Current state:** Planned
- **Percent completion:** 0% — Not started.

## Definition of Done
- [ ] System Inventory (§9) lists every tracker-relevant component with expected vs verified path/state and wiring
- [ ] Verification Matrix (§10) answers every required question for every required item, using only allowed verification states
- [ ] No referenced operational artifact remains outside the inventory (§9)
- [ ] `Unknown` states are flagged as validation failures/blockers where they affect completion (§10)

## Related definitions
- System Inventory, Verification Matrix, Path, Expected nonexistence, Wiring — see ../../TRACKER.md.

## Tasks
- [ ] Enumerate all tracker-relevant components for the inventory
- [ ] Verify existence/nonexistence/state/wiring of each
- [ ] Populate the Verification Matrix with proofs

## Files expected to change
- TRACKER.md (System Inventory + Verification Matrix sections, or linked files)

## Files actually changed
- None currently recorded.

## Paths expected to exist
- TRACKER.md (with §9/§10 sections populated)

## Paths verified to exist
- None currently recorded.

## Paths verified nonexistent
- None currently recorded.

## Wirings expected
- None this sprint (mode wiring is T6; this sprint records wiring state, it does not create wiring).

## Wirings verified
- None currently recorded.

## Dependencies
- T1 (TRACKER.md skeleton must exist to host the sections). T2 (scaffold present).

## Blockers
- None currently recorded.

## Risks
- `Unknown`-heavy matrix if items are hard to verify — mitigation: treat persistent Unknown as a tracked gap (§10/§36). Likelihood: medium · Impact: medium.

## Decisions
- None currently recorded.

## Open questions
- Inline §9/§10 in TRACKER.md vs link out to dedicated files? — President to decide in T1.

## Session log
- None currently recorded.

## Change log
### 2026-06-05 — Session 2026-06-05-tracker-scaffold
- Changed: Created T3 sprint stub.
- Reason: Seed E-TRACKER-001 planned sprints.
- Affected: trackers/sprints/T3-system-inventory-and-verification-matrix.md.
- Previous state: Did not exist.
- New state: Planned, 0%.

## Evidence log
- None currently recorded.

## Verification log
| Item | Should exist? | State | Where / wired where | Proof (cmd/inspection) | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| System Inventory (§9) | Yes | Missing But Required | TRACKER.md / linked | not yet authored | 2026-06-05 | Alpha |
| Verification Matrix (§10) | Yes | Missing But Required | TRACKER.md / linked | not yet authored | 2026-06-05 | Alpha |

## Current next action
Start after T1 — enumerate all tracker-relevant components and build the System Inventory (§9).

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
