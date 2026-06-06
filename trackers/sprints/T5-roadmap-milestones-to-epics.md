<!-- SPRINT TRACKER — spec §23. Linked from ../../TRACKER.md. Template: ../templates/SPRINT_TEMPLATE.md
     States (§19): Planned | Ready | Active | Blocked | Paused | Review Needed | Completed | Cancelled | Superseded -->

# T5 — Roadmap Milestones → Epics

- **Sprint label and number:** T5
- **Title:** Roadmap milestones → epics migration
- **Owner:** President
- **Parent epic:** [E-TRACKER-001](../epics/E-TRACKER-001-enforced-tracker-system.md)
- **Goal:** Migrate `ROADMAP.md` from milestone-based to epic-based organization (§29), creating/linking epic tracker files and recording the migration, so each roadmap item maps to a trackable, resumable, verifiable epic.
- **Scope:** §29.1 roadmap structure; §29.2 epic-based roadmap rules (each item maps to an epic with number/title/goal/priority/state/%/tracker-link/sprints/deps/rationale/impact/next-action/definitions); §29.3 milestone→epic migration (determine one/many/remove, create epic trackers, link from roadmap + TRACKER.md, record migration in roadmap change log, deprecate milestone terminology); no duplicate milestone+epic structures unless milestone is explicitly marked deprecated.
- **Out of scope:** TRACKER.md skeleton (T1); validator (T4); mode wiring (T6). Non-tracking framework backlog content stays as-is except for the structural milestone→epic reorganization.
- **Current state:** Planned
- **Percent completion:** 0% — Not started.

## Definition of Done
- [ ] `ROADMAP.md` is epic-based per §29.1/§29.2
- [ ] Every existing milestone is migrated to one/many epics or explicitly removed/deprecated (§29.3)
- [ ] Epic tracker files exist and are linked from both `ROADMAP.md` and `TRACKER.md`
- [ ] The migration is recorded in the roadmap change log
- [ ] No active work remains attached only to the old milestone structure
- [ ] No duplicate milestone+epic structure remains unless the milestone is explicitly marked deprecated

## Related definitions
- Roadmap, Epic, Superseded, Cancelled — see ../../TRACKER.md.

## Tasks
- [ ] Inventory existing ROADMAP.md milestones
- [ ] Decide one/many/remove per milestone
- [ ] Create/link epic tracker files
- [ ] Record migration in roadmap change log; deprecate milestone terminology

## Files expected to change
- ROADMAP.md
- trackers/epics/E-*.md (new epic files per migrated milestone)
- TRACKER.md (epic links)

## Files actually changed
- None currently recorded.

## Paths expected to exist
- New epic tracker files under trackers/epics/

## Paths verified to exist
- None currently recorded.

## Paths verified nonexistent
- None currently recorded.

## Wirings expected
- None this sprint.

## Wirings verified
- None currently recorded.

## Dependencies
- T1 (definitions + TRACKER.md), T2 (EPIC_TEMPLATE). Coordinate with the dual-identity ROADMAP.md note (canonical vs downstream).

## Blockers
- None currently recorded.

## Risks
- Canonical ROADMAP.md is a live framework backlog with a dual-identity contract — restructuring it risks breaking downstream scaffold assumptions. Mitigation: preserve the dual-identity header and roadmap-trace links; verify with `/scan:roadmap-trace`. Likelihood: medium · Impact: high.

## Decisions
- None currently recorded.

## Open questions
- Does the canonical framework backlog adopt epics, or only the product-facing roadmap? — President to decide (affects scope vs the dual-identity contract).

## Session log
- None currently recorded.

## Change log
### 2026-06-05 — Session 2026-06-05-tracker-scaffold
- Changed: Created T5 sprint stub.
- Reason: Seed E-TRACKER-001 planned sprints.
- Affected: trackers/sprints/T5-roadmap-milestones-to-epics.md.
- Previous state: Did not exist.
- New state: Planned, 0%.

## Evidence log
- None currently recorded.

## Verification log
| Item | Should exist? | State | Where / wired where | Proof (cmd/inspection) | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| Epic-based ROADMAP.md (§29) | Yes | Missing But Required | ROADMAP.md | currently milestone-based | 2026-06-05 | Alpha |

## Current next action
Start after T1 — inventory existing `ROADMAP.md` milestones and decide one/many/remove per milestone (§29.3).

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
