<!-- SPRINT TRACKER — spec §23. Linked from ../../TRACKER.md. Template: ../templates/SPRINT_TEMPLATE.md
     States (§19): Planned | Ready | Active | Blocked | Paused | Review Needed | Completed | Cancelled | Superseded -->

# T2 — Templates and Dirs

- **Sprint label and number:** T2
- **Title:** Templates and directory scaffold + UNTRACKED_WORK.md
- **Owner:** President
- **Parent epic:** [E-TRACKER-001](../epics/E-TRACKER-001-enforced-tracker-system.md)
- **Goal:** Create the `/trackers/` directory tree, the 10 fill-in-the-blank templates (§35), the `/trackers/README.md`, and the root `UNTRACKED_WORK.md` (§18) — the concrete scaffold the rest of the epic fills in.
- **Scope:** `trackers/{epics,sprints,templates}/`; `trackers/README.md`; 10 templates per §35 (EPIC §22, SPRINT §23, SESSION_LOG §24, UNTRACKED_WORK §18, DEFINITION §8.1, CHANGE_LOG §25, EVIDENCE_LOG §26, VERIFICATION §10, RECONCILIATION §32, COMPLETION_RECORD §15/§16/§37); root `UNTRACKED_WORK.md` seeded with this session's real untracked work; the E-TRACKER-001 epic file and T1–T6 sprint files so TRACKER.md links resolve.
- **Out of scope:** New TRACKER.md (T1); System Inventory / Verification Matrix population (T3); validation engine (T4); roadmap migration (T5); mode wiring (T6). No git/commit/regen this session (authoring only).
- **Current state:** Completed
- **Percent completion:** 100% — The `/trackers/` tree, all 10 templates, `trackers/README.md`, `UNTRACKED_WORK.md`, the E-TRACKER-001 epic file, and the T1–T6 sprint files are all Verified Exists on disk (ls/Read on 2026-06-05) and landed in the Wave-1 commit. The scaffold is now also validated by the tracker validator (`scripts/trackers/validate.js` check (l) required-paths PASS, plus (c)/(d) link/tracker-file checks PASS — 12/12 overall on 2026-06-05).

## Definition of Done
- [x] `trackers/`, `trackers/epics/`, `trackers/sprints/`, `trackers/templates/` exist
- [x] `trackers/README.md` explains layout and links back to `../TRACKER.md`
- [x] All 10 templates present in `trackers/templates/` matching their spec field lists
- [x] Root `UNTRACKED_WORK.md` exists, linked to `../TRACKER.md`, seeded with real untracked work (§18)
- [x] `E-TRACKER-001` epic file authored (§22) and T1–T6 sprint files authored (§23) so TRACKER.md links resolve
- [x] Validated by the tracker validator — `scripts/trackers/validate.js` checks (c)/(d)/(l) PASS (12/12 overall on 2026-06-05)
- [x] Committed + manifests regenerated — landed in the Wave-1 commit (the scaffold is tracked on `june-5`)

## Related definitions
- Template, Untracked work, Epic, Sprint — see ../../TRACKER.md (to be authored in T1).

## Tasks
- [x] Create the `/trackers/` directory tree
- [x] Author `trackers/README.md`
- [x] Author all 10 templates (§35)
- [x] Author root `UNTRACKED_WORK.md` and seed UW-001..003
- [x] Author E-TRACKER-001 epic file
- [x] Author T1–T6 sprint files
- [x] Run tracker validation — `node scripts/trackers/validate.js` → 12/12 PASS, exit 0 (2026-06-05)
- [x] Commit + regen manifests — landed in the Wave-1 commit

## Files expected to change
- trackers/README.md
- trackers/templates/{EPIC,SPRINT,SESSION_LOG,UNTRACKED_WORK,DEFINITION,CHANGE_LOG,EVIDENCE_LOG,VERIFICATION,RECONCILIATION,COMPLETION_RECORD}_TEMPLATE.md
- UNTRACKED_WORK.md
- trackers/epics/E-TRACKER-001-enforced-tracker-system.md
- trackers/sprints/T1..T6*.md

## Files actually changed
- trackers/README.md — 2026-06-05
- trackers/templates/ (10 templates) — 2026-06-05
- UNTRACKED_WORK.md — 2026-06-05
- trackers/epics/E-TRACKER-001-enforced-tracker-system.md — 2026-06-05
- trackers/sprints/T1-tracker-keystone.md, T2-templates-and-dirs.md, T3..T6 — 2026-06-05

## Paths expected to exist
- trackers/, trackers/epics/, trackers/sprints/, trackers/templates/
- UNTRACKED_WORK.md

## Paths verified to exist
- trackers/ + epics/ + sprints/ + templates/ — Verified Exists 2026-06-05 via `mkdir -p` then `ls -la trackers/` by Alpha
- trackers/templates/ (10 files) — Verified Exists 2026-06-05 (authored this session) by Alpha
- UNTRACKED_WORK.md — Verified Exists 2026-06-05 (authored this session) by Alpha

## Paths verified nonexistent
- trackers/ (BEFORE this sprint) — Verified Nonexistent 2026-06-05 via `ls trackers/` → "No such file or directory" by Alpha (now created)
- UNTRACKED_WORK.md (BEFORE this sprint) — Verified Nonexistent 2026-06-05 via `ls UNTRACKED_WORK.md` → "No such file or directory" by Alpha (now created)

## Wirings expected
- None this sprint (mode wiring is T6).

## Wirings verified
- None currently recorded.

## Dependencies
- None blocking. Feeds T1 (templates) and T3/T4/T5/T6 (scaffold).

## Blockers
- None currently recorded.

## Risks
- Templates could drift from the spec field lists if the spec changes — mitigation: each template header cites its spec section. Likelihood: low · Impact: low.

## Decisions
- 2026-06-05 — Scaffold authored before the new TRACKER.md (T1) so T1 has concrete templates to fill.
- 2026-06-05 — T2 was marked Review Needed at authoring time pending validation + commit; on the 2026-06-05 reconciliation pass it was set Completed because the validator now exists + passes (12/12) and the scaffold landed in the Wave-1 commit.

## Open questions
- None currently recorded.

## Session log
### 2026-06-05 — Session 2026-06-05-tracker-scaffold (june-5)
- Agent(s): Alpha (docs/systems builder) · Mode: solo
- Work performed: Created the trackers/ tree; authored README, 10 templates, UNTRACKED_WORK.md (UW-001..003), E-TRACKER-001, and T1–T6.
- Files changed: see "Files actually changed".
- Paths changed: created trackers/ + 3 subdirs · Wirings changed: None
- Decisions: see Decisions.
- Issues discovered: cwd was a stale dead worktree → operated on canonical via absolute paths (logged UW-001).
- Definitions added/changed: None (deferred to T1)
- State change: (new) → Review Needed · Completion change: 0% → 90%
- Verification performed: pre-state (trackers/ + UNTRACKED_WORK.md absent) and post-state (all present) confirmed via ls; 32-ref allowlist + brief classification confirmed via grep.
- Validation run: None (validator is T4) · Validation result: Not run
- Next action: Run tracker validation once T4 exists; commit + regen manifests.
- Evidence/references: file listing under "Files actually changed".

### 2026-06-05 — Reconciliation pass (President)
- Agent(s): President · Mode: documentation/reconciliation
- Work performed: Set T2 Completed (100%) — the scaffold is on disk, committed in the Wave-1 commit, and now validated 12/12 by the tracker validator; checked off the two previously-deferred DoD items.
- Files changed: this sprint file
- Paths changed: none · Wirings changed: none
- Decisions: see Decisions section.
- Issues discovered: T2 had stayed Review Needed (90%) although its blocking deps (validator existence; commit) are now satisfied.
- Definitions added/changed: None
- State change: Review Needed → Completed · Completion change: 90% → 100%
- Verification performed: ls/Read over the scaffold; `node scripts/trackers/validate.js` → 12/12 PASS, exit 0
- Validation run: `node scripts/trackers/validate.js` · Validation result: 12/12 PASS, exit 0
- Next action: None (Completed).
- Evidence/references: scaffold on disk; validator 12/12.

## Change log
### 2026-06-05 — Reconciliation pass (President)
- Changed: T2 marked Completed (100%) — validator now exists + passes; scaffold landed in the Wave-1 commit.
- Reason: The two deferred DoD items (validation run; commit/regen) are now satisfied.
- Affected: this sprint file; TRACKER.md; E-TRACKER-001.
- Previous state: Review Needed, 90%.
- New state: Completed, 100%.

### 2026-06-05 — Session 2026-06-05-tracker-scaffold
- Changed: Created the entire tracker scaffold (dirs + 10 templates + README + UNTRACKED_WORK.md + epic + 6 sprints).
- Reason: Implement spec §33/§35 required files and §18 ledger; unblock T1.
- Affected: trackers/ tree, UNTRACKED_WORK.md, E-TRACKER-001, T1–T6.
- Previous state: No tracker scaffold existed.
- New state: Scaffold complete and present on disk; sprint Review Needed at 90%.

## Evidence log
### 2026-06-05 — Scaffold present on disk
- Evidence type: Existence confirmation
- Detail/location: `ls -la trackers/` shows epics/ sprints/ templates/; trackers/templates/ holds 10 templates; UNTRACKED_WORK.md at root.
- Result observed: All authored this session; pre-state confirmed absent.
- Verified by: Alpha · Supports: T2 DoD items (dirs, templates, ledger, epic, sprints).
- Remaining uncertainty: Automated validation has not run (T4); not committed/regenerated.

## Verification log
| Item | Should exist? | State | Where / wired where | Proof (cmd/inspection) | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| trackers/ tree | Yes | Verified Exists | repo root | `mkdir -p` + `ls -la trackers/` | 2026-06-05 | Alpha |
| 10 templates | Yes | Verified Exists | trackers/templates/ | authored this session | 2026-06-05 | Alpha |
| UNTRACKED_WORK.md | Yes | Verified Exists | repo root | authored this session | 2026-06-05 | Alpha |
| trackers/ (pre-sprint) | No (then) | Verified Nonexistent | repo root | `ls trackers/` → ENOENT | 2026-06-05 | Alpha |
| Tracker validator | Yes | Verified Exists | `scripts/trackers/validate.js` | selftest 33/33; live 12/12 PASS, exit 0 | 2026-06-05 | President |

## Current next action
None — sprint Completed. The scaffold is on disk, committed in the Wave-1 commit, and validated 12/12 by the tracker validator.

## Completion record
- Final state: Completed
- Percent completion: 100%
- Completion timestamp: 2026-06-05
- Definition of done used: see Definition of Done section above (spec §16/§37)
- Evidence of completion: `trackers/` tree + 10 templates in `trackers/templates/` + `trackers/README.md` + `UNTRACKED_WORK.md` + `trackers/epics/E-TRACKER-001-enforced-tracker-system.md` + `trackers/sprints/T1..T6` on disk (ls/Read on 2026-06-05); landed in the Wave-1 commit; validated 12/12 by `scripts/trackers/validate.js` (live run on 2026-06-05, exit 0).
- Session IDs / dates / agents: 2026-06-05-tracker-scaffold (creation) + 2026-06-05 reconciliation pass / 2026-06-05 / Alpha + President
- Parent epic: E-TRACKER-001
- Remaining follow-up items: None
- Related untracked work: UW-001 (worktree hazard), UW-002 (allowlist baseline), UW-003 (brief classification) in ../../UNTRACKED_WORK.md
- ../../TRACKER.md updated: Yes (reconciled 2026-06-05) · Roadmap reconciled: No (T5)
