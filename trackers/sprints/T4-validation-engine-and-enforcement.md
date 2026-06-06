<!-- SPRINT TRACKER — spec §23. Linked from ../../TRACKER.md. Template: ../templates/SPRINT_TEMPLATE.md
     States (§19): Planned | Ready | Active | Blocked | Paused | Review Needed | Completed | Cancelled | Superseded -->

# T4 — Validation Engine + Enforcement

- **Sprint label and number:** T4
- **Title:** Validation engine + enforcement
- **Owner:** President
- **Parent epic:** [E-TRACKER-001](../epics/E-TRACKER-001-enforced-tracker-system.md)
- **Goal:** Build a runnable validation process (§28.7) that checks tracker consistency, definition consistency, path existence/expected-nonexistence, and wiring — and wire the start-of-work / end-of-work / completion gates (§28.2/§28.5/§28.6), so tracking is enforced rather than prose-only (§28).
- **Scope:** A runnable validator covering the §28.7 check list (missing tracker files, broken links, active items with no next action, completed-without-evidence, completed-below-100%, 100%-not-marked-completed, sprints without parent epics, undefined terms, definition drift, ambiguous state language, unverified/missing paths, missing wiring, blank sections, etc.); completion-gate enforcement (§28.6); failure handling (§28.8) so failures are fixed or tracked, never ignored. Validator must fail-closed / not lie-green.
- **Out of scope:** Mode-consultation wiring (T6); roadmap migration (T5); System Inventory/Matrix authoring (T3, but the validator checks them).
- **Current state:** Review Needed
- **Percent completion:** ~85% — The runnable, fail-closed validation engine IS built: `scripts/trackers/validate.js` (pure `evaluate()` core + thin FS reader + in-file bite-test) passes its selftest 33/33 and a live run on 2026-06-05 reports all 12 checks PASS (exit 0); the `/trackers:validate` skill (`.claude/commands/trackers/validate.md`) surfaces it. Held below 100% (Review Needed) because two follow-ups remain — see Current next action + Open questions.

## Definition of Done
- [x] A validator exists and is runnable (manually; automatically where possible) — §28.7 — `scripts/trackers/validate.js` + `/trackers:validate` skill
- [ ] It checks every item in the §28.7 list — PARTIAL: the 12 single-file checks are built; the cross-file checks (definition-drift, epics-missing-from-roadmap / roadmap-still-using-milestones, TRACKER↔roadmap↔epic↔sprint reconciliation, work-logs-with-no-session-ID, expected-nonexistence, modes-that-work-but-don't-consult-the-tracker, missing-enforcement-hooks) are deferred
- [ ] Completion gate (§28.6) blocks completion unless all conditions are met — not yet wired as a gate (the validator is runnable on-demand, not yet in a standing runner)
- [x] Validator fails closed (runner error → non-zero; malformed input → fail, not pass) — proven by selftest fail-closed cases (33/33) + exit-2-on-runner-error contract
- [ ] Validation failures are recorded and either fixed, added to a sprint/blocker, or logged to UNTRACKED_WORK.md (§28.8) — mechanism documented; not yet auto-wired
- [x] Validation has been run at least once and its result recorded in TRACKER.md header (§6) — run 2026-06-05 = 12/12 PASS; header `Last Validation: 2026-06-05`, `Validation Status: Passing`

## Related definitions
- Validator, Validation, Verification, Known gap, Completion, Definition of done — see ../../TRACKER.md.

## Tasks
- [x] Specify the validator's check list from §28.7 (single-file subset)
- [x] Implement the validator (runnable command) — `scripts/trackers/validate.js` + `/trackers:validate` skill
- [ ] Wire completion-gate enforcement (§28.6) — DEFERRED (standing-runner gate)
- [x] Test it fails closed (adversarial / false-green check) — selftest 33/33, incl. fail-closed cases
- [x] Run it; record result + failures — 12/12 PASS, exit 0 (2026-06-05); recorded in TRACKER.md header
- [ ] Add the deferred cross-file §28.7 checks — DEFERRED
- [ ] Wire `/trackers:validate` into the standing scan suite as an enforcement gate — DEFERRED

## Files expected to change
- A validator script + its registration
- TRACKER.md (validation status fields, §6)

## Files actually changed
- scripts/trackers/validate.js — 2026-06-05 (the engine)
- .claude/commands/trackers/validate.md — 2026-06-05 (the skill)
- TRACKER.md — 2026-06-05 (Last Validation / Validation Status set real on the reconciliation pass)

## Paths expected to exist
- scripts/trackers/validate.js; .claude/commands/trackers/validate.md

## Paths verified to exist
- scripts/trackers/validate.js — Verified Exists 2026-06-05 via ls/Read + `node scripts/trackers/validate.js` (selftest 33/33; live 12/12 PASS, exit 0)
- .claude/commands/trackers/validate.md — Verified Exists 2026-06-05 via ls/Read

## Paths verified nonexistent
- None currently recorded.

## Wirings expected
- Completion-gate enforcement (§28.6); start-of-work and end-of-work checks (§28.2/§28.5); the standing-runner enforcement gate for `/trackers:validate` — source files TBD.

## Wirings verified
- None currently recorded — the validator is runnable on-demand but is NOT yet wired into a standing runner / hook (deferred follow-up).

## Dependencies
- T1 (TRACKER.md structure) — satisfied. T3 (full System Inventory + Verification Matrix) would let the cross-file checks validate against a completed inventory, but the single-file engine already runs against the live TRACKER.md.

## Blockers
- None currently recorded.

## Risks
- A validator documented but not actually runnable would be a false-green enforcer (§28.7) — mitigation: prove it runs and lies-closed before marking done. Likelihood: medium · Impact: high.

## Decisions
- None currently recorded.

## Open questions
- Resolved: implemented as a standalone script (`scripts/trackers/validate.js`) surfaced by a `/trackers:validate` skill.
- Open: which standing runner is the enforcement gate's home (candidate `/scan:full`)?
- Open: should the completion gate (§28.6) be a hook (Stop) or a validator-invoked check?
- Open: how to structure the deferred cross-file checks (read the roadmap + epic + sprint files alongside TRACKER.md) without breaking the pure-`evaluate()` seam discipline?

## Session log
### 2026-06-05 — Reconciliation pass (President)
- Agent(s): President · Mode: documentation/reconciliation
- Work performed: Recorded that the validation engine + skill are built and passing; set T4 Review Needed (~85%); captured the two remaining follow-ups (enforcement-gate wiring + cross-file checks) as Next action + Open questions.
- Files changed: this sprint file
- Paths changed: none · Wirings changed: none (the validator is runnable on-demand; not yet wired into a standing runner)
- Decisions: Hold T4 at Review Needed, not Completed, until the gate + cross-file checks land.
- Issues discovered: T4 was Planned 0% although the engine already exists, passes its selftest 33/33, and runs 12/12 live.
- Definitions added/changed: None
- State change: Planned → Review Needed · Completion change: 0% → ~85%
- Verification performed: ls/Read + `node scripts/trackers/validate.js` (selftest 33/33; live 12/12 PASS, exit 0)
- Validation run: `node scripts/trackers/validate.js` + `--selftest` · Validation result: live 12/12 PASS, exit 0; selftest 33/33
- Next action: see Current next action.
- Evidence/references: scripts/trackers/validate.js; .claude/commands/trackers/validate.md.

## Change log
### 2026-06-05 — Reconciliation pass (President)
- Changed: T4 set Review Needed (~85%) — the validation engine + skill exist and pass; two follow-ups remain.
- Reason: The sprint file claimed Planned 0% while the engine is built and passing.
- Affected: this sprint file; TRACKER.md; E-TRACKER-001.
- Previous state: Planned, 0%.
- New state: Review Needed, ~85%.

### 2026-06-05 — Session 2026-06-05-tracker-scaffold
- Changed: Created T4 sprint stub.
- Reason: Seed E-TRACKER-001 planned sprints.
- Affected: trackers/sprints/T4-validation-engine-and-enforcement.md.
- Previous state: Did not exist.
- New state: Planned, 0%.

## Evidence log
### 2026-06-05 — Validation engine built + passing
- Evidence type: Existence + execution confirmation
- Detail/location: `scripts/trackers/validate.js` (engine); `.claude/commands/trackers/validate.md` (skill).
- Result observed: `node scripts/trackers/validate.js --selftest` → 33/33 bite cases pass; `node scripts/trackers/validate.js` → all 12 checks PASS, exit 0.
- Verified by: President · Supports: the "validator exists + runnable + fails closed + has been run" DoD items.
- Remaining uncertainty: cross-file §28.7 checks + the standing-runner enforcement gate are not yet built.

## Verification log
| Item | Should exist? | State | Where / wired where | Proof (cmd/inspection) | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| Tracker validator | Yes | Verified Exists | `scripts/trackers/validate.js` | selftest 33/33; live 12/12 PASS, exit 0 | 2026-06-05 | President |
| /trackers:validate skill | Yes | Verified Exists | `.claude/commands/trackers/validate.md` | ls/Read | 2026-06-05 | President |
| Completion-gate wiring (§28.6) | Yes | Missing But Required | standing runner (TBD) | not yet wired | 2026-06-05 | President |
| Cross-file §28.7 checks | Yes | Missing But Required | validator (TBD extension) | not yet built | 2026-06-05 | President |

## Current next action
Two follow-ups before Completed: (1) wire `/trackers:validate` into the standing scan suite as an enforcement gate; (2) add the deferred cross-file §28.7 checks — definition-drift; epics-missing-from-roadmap / roadmap-still-using-milestones; TRACKER↔roadmap↔epic↔sprint reconciliation; work-logs-with-no-session-ID; expected-nonexistence; "modes that perform work but don't consult the tracker"; "hooks that should enforce tracking but are missing".

## Completion record
- Final state: Not yet complete (Review Needed)
- Percent completion: ~85%
- Completion timestamp: n/a
- Definition of done used: see Definition of Done section above
- Evidence of completion: `scripts/trackers/validate.js` (selftest 33/33; live 12/12 PASS, exit 0 on 2026-06-05) + `.claude/commands/trackers/validate.md` on disk; TRACKER.md header validation fields set real.
- Session IDs / dates / agents: 2026-06-05 reconciliation pass / 2026-06-05 / President (engine built in the Wave-1 build session)
- Parent epic: E-TRACKER-001
- Remaining follow-up items: enforcement-gate wiring; deferred cross-file §28.7 checks
- Related untracked work: None
- ../../TRACKER.md updated: Yes (reconciled 2026-06-05) · Roadmap reconciled: No
