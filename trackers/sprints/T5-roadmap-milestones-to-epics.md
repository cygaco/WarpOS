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
- **Current state:** Completed
- **Percent completion:** 100% — Completed 2026-06-06. `ROADMAP.md` § Epics registry is the primary organizing unit; `## 🏛 Milestones` marked DEPRECATED; 8 new epic files created; migration recorded in the roadmap change log; validator 12/12 PASS.

## Definition of Done
- [x] `ROADMAP.md` is epic-based per §29.1/§29.2 — `## Epics` registry added as the primary organizing unit with the §29.2 per-epic fields
- [x] Every existing milestone is migrated to one/many epics or explicitly removed/deprecated (§29.3) — each milestone mapped to an epic (mapping in the DEPRECATED banner); `## 🏛 Milestones` preserved-but-deprecated
- [x] Epic tracker files exist and are linked from both `ROADMAP.md` and `TRACKER.md` — 9 files in `trackers/epics/` (E-TRACKER-001 + 8 new); all 9 ROADMAP §Epics links resolve (9/9); TRACKER.md Related Tracker Documents + Verification Matrix link them
- [x] The migration is recorded in the roadmap change log — `ROADMAP.md` § Epics → `### Roadmap change log` (2026-06-06 entry)
- [x] No active work remains attached only to the old milestone structure — all active/planned milestone work is mirrored as epics in `## Epics`; the milestone blocks remain only as the detail source behind each epic
- [x] No duplicate milestone+epic structure remains unless the milestone is explicitly marked deprecated — `## 🏛 Milestones` carries an explicit `⚠️ DEPRECATED` banner

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
- `ROADMAP.md` (added `## Epics` registry; `## 🏛 Milestones` → DEPRECATED banner; new `### Roadmap change log`).
- `trackers/epics/E-GOLDEN-FLOW-001-golden-flow-consumer-contract.md`, `E-CONTENT-DELIVERY-001-content-delivery-integrity.md`, `E-TEST-SUITE-001-per-sprint-test-suite.md`, `E-STABLE-CHANNEL-001-stable-lts-channel.md`, `E-BOUNDARY-001-framework-boundary-closure.md`, `E-MULTIPRODUCT-001-multi-product-distribution.md`, `E-SKILL-CATALOG-001-skill-catalog-polish.md`, `E-MANAGER-LAYER-001-managerial-agent-layer.md` (8 new).
- `../../TRACKER.md` (header summary, Related Tracker Documents, Definition: Roadmap, E-TRACKER-001 epic, Active/Planned/Completed Sprints, Roadmap Rules, Definition of Done, Required Files, System Inventory + Verification Matrix, G-2, Change Log, Session Log).
- `../epics/E-TRACKER-001-enforced-tracker-system.md` (percent ~80%→~90%, DoD, related-sprints T5, change log).

## Paths expected to exist
- New epic tracker files under trackers/epics/

## Paths verified to exist
- All 8 new `trackers/epics/E-*.md` files (`ls -1 trackers/epics/` → 9 total; `grep`-resolution of all 9 ROADMAP §Epics links → 9/9 OK, 2026-06-06).

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
- 2026-06-06 — The canonical framework backlog ADOPTS epics (the `## Epics` registry IS the canonical roadmap's primary unit). Rationale: ROADMAP.md's dual-identity is one-way (canonical → product via a separate scaffold generator), so restructuring canonical does not affect the downstream consumer scaffold — canonical is free to be epic-based. Resolves the open question below.
- 2026-06-06 — Migration is ADDITIVE, not a destructive rewrite: add `## Epics`, deprecate (not delete) `## 🏛 Milestones`, and leave the `## Sprints` ledger table + all `Shipped` narrative regions untouched. Rationale: `scan:roadmap-trace` requires the ledger row + Shipped narrative per shipped sprint; `scan:references` requires links to resolve — a rewrite risks both.

## Open questions
- RESOLVED (2026-06-06): the canonical framework backlog adopts epics (see Decisions). No open questions remain.

## Session log
### 2026-06-06 — T5 migration (President α + delegated systems builders)
- Agent(s): President Agent (α) + 8 general-purpose systems builders (one epic file each) · Mode: sprint (start-of-work tracker-consult done)
- Work performed: authored the `ROADMAP.md` `## Epics` registry; deprecated `## 🏛 Milestones`; added the roadmap change log; fanned out 8 builders to create the active/planned epic files (one writer per file, no clobber); reconciled `TRACKER.md` + the E-TRACKER-001 epic file.
- Files changed: see Files actually changed. · State change: Planned → Completed · Completion change: 0% → 100%
- Verification performed: `ls -1 trackers/epics/` (9 files); `grep`-resolution of all 9 ROADMAP §Epics links (9/9 OK); Read post-edit of `## Epics` + DEPRECATED banner. · Validation run: `node scripts/trackers/validate.js` → 12/12 PASS, exit 0.
- Next action: None — sprint Completed. (Epic E-TRACKER-001 next action: finish T4's cross-file §28.7 checks.)
- Evidence/references: `ROADMAP.md` § Epics; the 8 new epic files; `TRACKER.md` Change Log 2026-06-06.

## Change log
### 2026-06-06 — T5 Completed (President via systems builders)
- Changed: Executed the milestone→epic migration; sprint Planned → Completed (0% → 100%).
- Reason: Deliver sprint T5 (§29 Roadmap Rules).
- Affected: `ROADMAP.md`; 8 new `trackers/epics/E-*.md`; `../../TRACKER.md`; `../epics/E-TRACKER-001-*.md`; this file.
- Previous state: Planned, 0%; `ROADMAP.md` milestone-based.
- New state: Completed, 100%; `ROADMAP.md` epic-based; 9 epic files Verified Exists; validator 12/12 PASS.

### 2026-06-05 — Session 2026-06-05-tracker-scaffold
- Changed: Created T5 sprint stub.
- Reason: Seed E-TRACKER-001 planned sprints.
- Affected: trackers/sprints/T5-roadmap-milestones-to-epics.md.
- Previous state: Did not exist.
- New state: Planned, 0%.

## Evidence log
### 2026-06-06 — ROADMAP.md is epic-based; 8 new epic files exist
- Evidence type: File changed + Existence confirmation + Validation result.
- Detail/location: `ROADMAP.md` § Epics (primary unit) + `## 🏛 Milestones — ⚠️ DEPRECATED` banner + `### Roadmap change log`; `ls -1 trackers/epics/` → 9 files; `grep -oE "trackers/epics/E-[A-Z0-9-]+-[a-z-]+\.md" ROADMAP.md` → 9/9 resolve; `node scripts/trackers/validate.js` → 12/12 PASS, exit 0 (2026-06-06).
- Verified by: President Agent + systems builders · Supports: all DoD items.

## Verification log
| Item | Should exist? | State | Where / wired where | Proof (cmd/inspection) | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| Epic-based ROADMAP.md (§29) | Yes | Verified Exists | ROADMAP.md § Epics | `grep "^## Epics" ROADMAP.md` + Read post-edit | 2026-06-06 | President via systems builder |
| `## 🏛 Milestones` DEPRECATED banner | Yes | Verified Exists | ROADMAP.md | `grep "🏛 Milestones — ⚠️ DEPRECATED" ROADMAP.md` | 2026-06-06 | President via systems builder |
| 8 new epic files | Yes | Verified Exists | trackers/epics/ | `ls -1 trackers/epics/` (9) + 9/9 link-resolve | 2026-06-06 | President via systems builder |

## Current next action
None — sprint Completed (2026-06-06). The parent epic E-TRACKER-001's next action is to finish T4's cross-file §28.7 checks.

## Completion record
- Final state: Completed
- Percent completion: 100%
- Completion timestamp: 2026-06-06
- Definition of done used: see Definition of Done section above (all 6 items checked + evidenced)
- Evidence of completion: `ROADMAP.md` § Epics + DEPRECATED milestones banner + roadmap change log; 8 new `trackers/epics/E-*.md` files (9 total in dir; all 9 ROADMAP links resolve); `node scripts/trackers/validate.js` → 12/12 PASS, exit 0.
- Session IDs / dates / agents: 2026-06-06 · President Agent (α) + 8 delegated systems builders.
- Parent epic: E-TRACKER-001
- Remaining follow-up items: None (the T4 cross-file checks are a separate sprint).
- Related untracked work: None
- ../../TRACKER.md updated: Yes · Roadmap reconciled: Yes
