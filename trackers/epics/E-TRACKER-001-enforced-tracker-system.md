<!-- EPIC TRACKER — spec §22. Linked from ../../TRACKER.md. Template: ../templates/EPIC_TEMPLATE.md
     States (§19): Planned | Ready | Active | Blocked | Paused | Review Needed | Completed | Cancelled | Superseded -->

# E-TRACKER-001 — Enforced Tracker System

- **Epic label and number:** E-TRACKER-001
- **Title:** Enforced Tracker System (roadmap/epic/sprint/definition/tracker overhaul)
- **Owner:** President
- **Parent roadmap area:** Agentic OS tracking layer — see ../../ROADMAP.md (to be migrated milestones → epics, spec §29)
- **Goal:** Implement the system defined in [`agentic_os_tracker_system_improvements.md`](../../agentic_os_tracker_system_improvements.md): an accurate, enforced, resumable tracking system that becomes the highest operational source of truth for long-running work, so work is reliably planned, tracked, resumed, verified, audited, completed, reconciled, and enforced across sessions, agents, modes, and phases.
- **Background:** During the agent-system restructuring the OS began behaving like a company; work was lost between sessions, believed complete when it wasn't (and vice-versa), plans drifted from implementation, terms drifted, and definitions lived in memory/chat/scattered files. The spec defines the fix.
- **Scope:** New `TRACKER.md` per §5; `How to Use` §7; authoritative Definitions §8; System Inventory §9; Verification Matrix §10; state model §19; percent rules §20; language rules §21; epic/sprint tracker files §22/§23; session/change/evidence logging §24–§26; `UNTRACKED_WORK.md` §18; roadmap milestones→epics §29; templates §35; validation §28.7; mode wiring §28.1/§34; enforcement §28.
- **Out of scope:** Product-feature work; non-tracking framework backlog (0.16–0.18 milestones remain in `ROADMAP.md`); shipping the brief to downstream products (it is a runtime-working-doc, UW-003).
- **Current state:** Active
- **Percent completion:** ~50% — 3 of 6 sprints done. T1 (the enforced `TRACKER.md` keystone, all 34 §5 sections + ~50 definitions, replacing the interim tracker) and T2 (the `/trackers/` tree + 10 templates + `UNTRACKED_WORK.md` + this epic file + T1–T6 sprint files) are Completed and Verified Exists on disk. T4's validation engine (`scripts/trackers/validate.js`) is built and passing (selftest 33/33; live 12/12 PASS on 2026-06-05) and the `/trackers:validate` skill exists — T4 is Review Needed (enforcement-gate wiring + deferred cross-file checks remain). Still not built: System Inventory/Verification Matrix completion (T3), roadmap milestones→epics migration (T5), and mode wiring (T6). Conservative per §20.

## Definition of Done
<!-- From spec §37. All must be satisfied + evidenced before 100%. -->
- [x] Old `TRACKER.md` deleted or fully unwired; new `TRACKER.md` exists and follows the §5 structure (T1; validated 12/12 on 2026-06-05)
- [x] `TRACKER.md` has a robust `How to Use This Document` section (§7) (T1)
- [x] Authoritative Definitions present; all required operational terms defined; definition change rules documented (§8) (T1; ~50 definitions)
- [ ] Definition enforcement wired into all relevant modes (§28.3) — PARTIAL: validator check (k) flags undefined core terms; mode wiring is T6
- [x] `UNTRACKED_WORK.md` exists and is linked (§18) (T2; Verified Exists on 2026-06-05)
- [ ] Roadmap is epic-based, not milestone-based; existing milestones migrated or explicitly deprecated (§29) — T5
- [x] Epic tracker files exist for all active and planned epics; sprint tracker files exist for all active and planned sprints (§22/§23) (T2; E-TRACKER-001 + T1–T6 Verified Exists)
- [x] Completed epics and sprints carry evidence records (§15/§16/§26) (E-ADR0007/E1–E8 + 0.14.0 + T1/T2 in TRACKER.md)
- [x] State language standardized; percent rules documented; update triggers documented (§19/§20/§27) (T1)
- [ ] Required paths verified; required nonexistence verified; required wirings verified (§28.4/§34) — PARTIAL: paths verified (T2/this pass); wirings Unknown (T6)
- [ ] System Inventory exists and is current (§9); Verification Matrix exists and is current (§10) — SEEDED + reconciled 2026-06-05; full disk-verification is T3
- [ ] Required validators exist and are runnable (§28.7) — PARTIAL: single-file engine built + passing (T4 Review Needed); cross-file checks + standing gate deferred
- [ ] Enforcement wired into sprint mode AND all other relevant modes (§28.1/§34) — T6
- [x] President documented as owner; tracker documented as higher authority than Claude memory (§3/§4) (T1)
- [ ] Validation has been run; failures fixed or tracked; Known Gaps section empty-with-evidence or fully tracked (§28.7/§28.8/§36) — PARTIAL: single-file validation run 12/12 PASS on 2026-06-05; Known Gaps G-1/G-2/G-3 tracked; cross-file checks deferred
- [ ] System is resumable from tracker files alone, without chat memory (§2/§37) — PARTIAL: keystone + scaffold + per-item files + passing validator enable it; completes when T3/T5/T6 land

## Related definitions
- Roadmap, Epic, Sprint, Tracker, Definition, Source of truth, Verification, Evidence, Untracked work, Reconciliation, System Inventory, Verification Matrix, Wiring, President agent — all to be defined in ../../TRACKER.md Definitions section (T1).

## Related sprints
- [T1 — tracker keystone](../sprints/T1-tracker-keystone.md) — Completed (100%) — new TRACKER.md + ~50 definitions, validated 12/12
- [T2 — templates and dirs](../sprints/T2-templates-and-dirs.md) — Completed (100%) — scaffold dirs + 10 templates + UNTRACKED_WORK.md + epic/sprint files
- [T3 — system inventory + verification matrix](../sprints/T3-system-inventory-and-verification-matrix.md) — Planned
- [T4 — validation engine + enforcement](../sprints/T4-validation-engine-and-enforcement.md) — Review Needed (~85%) — engine built + passing (selftest 33/33, live 12/12); enforcement-gate wiring + cross-file checks remain
- [T5 — roadmap milestones → epics](../sprints/T5-roadmap-milestones-to-epics.md) — Planned
- [T6 — mode wiring](../sprints/T6-mode-wiring.md) — Planned

## Dependencies
- The interim `TRACKER.md` (agent-system rewrite burndown) must be deleted/unwired and replaced — a coordinated cutover, not a silent overwrite (§3, §32).
- `ROADMAP.md` migration (T5) depends on definitions + epic structure from T1.
- Validation engine (T4) depends on the file/section conventions fixed in T1–T3.

## Blockers
- None currently recorded.

## Risks
- Replacing the live interim `TRACKER.md` could lose the ADR-0007 rewrite burndown state if not reconciled first — mitigation: reconcile its content into epic files before deletion (§32). Likelihood: medium · Impact: high.
- Validation that is documented but not runnable would be a false-green enforcer (§28.7) — mitigation: build runnable validator in T4, test it lies-closed.

## Decisions
- 2026-06-05 — Scaffold (dirs + templates + ledger) authored before the new `TRACKER.md` rewrite, to give T1 concrete templates to fill — rationale: templates are a T1 dependency and are low-risk to author first.
- 2026-06-05 — The project brief classified as a runtime-working-doc, not shipped downstream (UW-003) — rationale: it is an internal requirements input.

## Open questions
- Should the interim ADR-0007 `TRACKER.md` content become its own completed epic (E-ADR0007) before the new `TRACKER.md` replaces it? — President to decide during T1.
- Final on-disk home of the brief once the project lands (`_requirements/`?) — owner: President.

## Session log
### 2026-06-05 — Session 2026-06-05-tracker-scaffold (june-5)
- Agent(s): Alpha (docs/systems builder) · Mode: solo
- Work performed: Created `/trackers/{epics,sprints,templates}/`, authored all 10 templates (§35), `/trackers/README.md`, root `UNTRACKED_WORK.md` (seeded UW-001..003), this epic file, and T1–T6 sprint files.
- Files changed: trackers/README.md, trackers/templates/*.md (10), UNTRACKED_WORK.md, trackers/epics/E-TRACKER-001-enforced-tracker-system.md, trackers/sprints/T1..T6*.md
- Paths changed: created trackers/, trackers/epics/, trackers/sprints/, trackers/templates/
- Wirings changed: None (no git/regen/mode-wiring this session — authoring only)
- Decisions: see Decisions section.
- Issues discovered: cwd was a stale dead worktree (logged UW-001); operated on canonical via absolute paths.
- Definitions added/changed: None yet (deferred to T1's TRACKER.md rewrite).
- State change: (new) → Active · Completion change: 0% → 15%
- Verification performed: Confirmed TRACKER.md exists / trackers dir absent / UNTRACKED_WORK.md absent before authoring; verified the 32-ref allowlist and the brief classification on disk.
- Validation run: None (validation engine is T4, not yet built) · Validation result: Not run
- Next action: T1 — author the new `TRACKER.md` from the §5 structure and fill the Definitions section.
- Evidence/references: files listed above; UNTRACKED_WORK.md UW-001..003.

### 2026-06-05 — Reconciliation pass (President)
- Agent(s): President · Mode: documentation/reconciliation
- Work performed: Reconciled this epic to disk and to TRACKER.md — set T1/T2 Completed, T4 Review Needed, epic ~50%; checked off the now-satisfied DoD items; updated the Verification log (new TRACKER.md / validation engine / skill → Verified Exists).
- Files changed: this epic file (+ TRACKER.md and T1/T2/T4 sprint files in the same pass)
- Paths changed: none · Wirings changed: none
- Decisions: Held T4 at Review Needed (not Completed) because the enforcement-gate wiring + cross-file checks are deferred.
- Issues discovered: the epic had drifted (claimed 15%, "interim TRACKER.md still in place", new TRACKER.md Missing But Required) while the artifacts already existed on disk.
- Definitions added/changed: None
- State change: percent 15% → ~50% · related sprints T1/T2 → Completed, T4 → Review Needed
- Verification performed: ls/Read over Wave-1 artifacts; `node scripts/trackers/validate.js` → 12/12 PASS, exit 0
- Validation run: `node scripts/trackers/validate.js` · Validation result: 12/12 PASS, exit 0
- Next action: T3, T5, T6; finish T4 enforcement-gate + cross-file checks.
- Evidence/references: TRACKER.md (validated 12/12); Wave-1 artifacts on disk.

## Change log
### 2026-06-05 — Reconciliation pass (President)
- Changed: Reconciled epic state to disk — T1/T2 Completed, T4 Review Needed, percent 15% → ~50%, DoD items checked off, Verification log flipped to Verified Exists.
- Reason: The epic file had drifted from reality during the parallel build wave.
- Affected: this epic file; TRACKER.md; T1/T2/T4 sprint files.
- Previous state: Active, 15%, new TRACKER.md / validation engine recorded as Missing But Required.
- New state: Active, ~50%; new TRACKER.md + validation engine + scaffold Verified Exists.

### 2026-06-05 — Session 2026-06-05-tracker-scaffold
- Changed: Created E-TRACKER-001 and its scaffold/templates/ledger.
- Reason: Implement `agentic_os_tracker_system_improvements.md`; give T1 templates to fill.
- Affected: new trackers/ tree, UNTRACKED_WORK.md, this epic, T1–T6.
- Previous state: No enforced tracker scaffold existed.
- New state: Scaffold + templates + ledger authored; epic Active at 15%.

## Evidence log
### 2026-06-05 — Scaffold and templates exist on disk
- Evidence type: Existence confirmation
- Detail/location: trackers/templates/ holds 10 templates; trackers/epics/E-TRACKER-001-enforced-tracker-system.md; trackers/sprints/T1..T6; UNTRACKED_WORK.md at root.
- Result observed: All authored this session.
- Verified by: Alpha · Supports: scaffold/templates DoD items (T2 deliverables).
- Remaining uncertainty: New TRACKER.md, inventory, matrix, validation, roadmap migration, mode wiring not yet built.

## Verification log
| Item | Should exist? | State | Where / wired where | Proof (cmd/inspection) | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| trackers/ tree | Yes | Verified Exists | repo root | `mkdir -p` + `ls -la trackers/` | 2026-06-05 | Alpha |
| 10 templates | Yes | Verified Exists | trackers/templates/ | files authored this session | 2026-06-05 | Alpha |
| UNTRACKED_WORK.md | Yes | Verified Exists | repo root | authored this session | 2026-06-05 | Alpha |
| New TRACKER.md (per §5) | Yes | Verified Exists | repo root | ls/Read + `node scripts/trackers/validate.js` (12/12 PASS) | 2026-06-05 | President |
| System Inventory (§9) | Yes | Exists But Incomplete | TRACKER.md | seeded + reconciled; full disk-verification is T3 | 2026-06-05 | President |
| Verification Matrix (§10) | Yes | Exists But Incomplete | TRACKER.md | seeded + reconciled; full disk-verification is T3 | 2026-06-05 | President |
| Validation engine (§28.7) | Yes | Verified Exists | `scripts/trackers/validate.js` | selftest 33/33; live 12/12 PASS, exit 0 | 2026-06-05 | President |
| /trackers:validate skill | Yes | Verified Exists | `.claude/commands/trackers/validate.md` | ls/Read | 2026-06-05 | President |
| Mode wiring (§34) | Yes | Unknown | modes / hooks | not yet inspected — T6 | 2026-06-05 | Alpha |

## Current next action
Run T3 (fill System Inventory + Verification Matrix from disk), T5 (migrate ROADMAP milestones→epics + create epic tracker files), and T6 (wire tracker checks into all modes); finish T4 (wire `/trackers:validate` into the standing scan suite as an enforcement gate + add the deferred cross-file §28.7 checks) and move it from Review Needed to Completed.

## Completion record
- Final state: Not yet complete (Active, ~50%)
- Percent completion: ~50%
- Completion timestamp: n/a
- Definition of done used: see Definition of Done section above (spec §37)
- Evidence of completion: n/a — in progress (T1/T2 Completed, T4 Review Needed; see TRACKER.md Completed Sprints + Active Sprints)
- Session IDs / dates / agents: 2026-06-05-tracker-scaffold + 2026-06-05 reconciliation pass / 2026-06-05 / Alpha + President
- Related completed sprints: T1 (tracker keystone), T2 (templates + dirs)
- Remaining follow-up items: T3 (inventory/matrix), T5 (roadmap migration), T6 (mode wiring); T4 enforcement-gate wiring + cross-file checks
- Related untracked work: UW-001, UW-002, UW-003 in ../../UNTRACKED_WORK.md
- ../../TRACKER.md updated: Yes (reconciled 2026-06-05) · Roadmap reconciled: No (T5)
