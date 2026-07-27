# SP-20260725-002 — memory-verify: agent-memory integrity detector + gated apply

- **Sprint label and number:** SP-20260725-002
- **Title:** memory-verify — a read-only agent-memory integrity detector, a transactional gated executor, and the `/memory:verify` skill
- **Owner:** Alex ε (sprint conductor), under Alex α
- **Parent epic:** [E-SYSTEM-ORG-001](../epics/E-SYSTEM-ORG-001-agent-system-org-cleanup.md)
- **Goal:** Make agent-memory drift self-detecting. Ship a read-only structural detector over agent-memory stores, a separately gated executor that applies corrections as an all-or-nothing transaction, and a skill that runs the pair.
- **Scope:** `scripts/checks/memory-integrity.js` (detector, read-only), `scripts/checks/memory-apply.js` (gated executor), `.claude/commands/memory/verify.md` (skill), and the two test suites `memory-integrity.test.js` and `memory-apply.test.js`.
- **Out of scope:** Wiring the detector into `/scan:full` — deliberately deferred and logged as ED-287. Semantic judgement about memory CONTENT; the detector is structural.
- **Current state:** Active
- **Percent completion:** 80% — all three deliverables exist and both suites pass on the sprint commit, but the gauntlet is red with three open defects (two HIGH, one MEDIUM) plus one low. The remaining 20% is one bounded fix round and a re-review of the two affected lanes.

## Definition of Done
- [x] A read-only structural detector exists and cannot mutate a store.
- [x] The executor applies corrections as a backup → apply → rollback transaction, so a mid-flight failure leaves no partial apply.
- [x] The skill exists and invokes the pair.
- [x] Both test suites pass on the sprint commit.
- [ ] The detector rejects malformed frontmatter without false-greens.
- [ ] The executor never leaves a structurally invalid store on disk.
- [ ] All registry-fixed gauntlet lanes return `pass` on one single commit.
- [ ] Landed on `main`.

## Related definitions
- Validator, Verification, Evidence, Completion — see ../../TRACKER.md

## Tasks
- [x] Build the read-only detector with fail-closed parsing.
- [x] Make the executor a true all-or-nothing transaction with an in-memory byte-exact backup.
- [x] Add case-family canonicalization for store names and an index-accessibility pre-check.
- [x] Reject non-flat `metadata` mappings.
- [x] Linearize `decodeScalar` after a self-caught ReDoS.
- [ ] Treat an unquoted comment-only scalar as an absent value (open — qa-reviewer HIGH).
- [ ] Refuse to enter metadata-block mode when `metadata` carries a same-line scalar (open — qa-reviewer HIGH).
- [ ] Pre-validate a corrected body before mutation, or roll the transaction back on a fatal post-check (open — backend-reviewer HIGH, qa-reviewer MEDIUM).
- [ ] Sync the taxonomy list in the script header (open — qa-reviewer LOW).
- [ ] Re-run the qa and backend reviewer lanes on the fixed commit.

## Files expected to change
- `scripts/checks/memory-integrity.js`
- `scripts/checks/memory-apply.js`
- `.claude/commands/memory/verify.md`
- `scripts/checks/memory-integrity.test.js`
- `scripts/checks/memory-apply.test.js`

## Files actually changed
- `scripts/checks/memory-integrity.js` — 2026-07-25 through 2026-07-26
- `scripts/checks/memory-apply.js` — 2026-07-25 through 2026-07-26
- `.claude/commands/memory/verify.md` — 2026-07-26
- `scripts/checks/memory-integrity.test.js` — 2026-07-26
- `scripts/checks/memory-apply.test.js` — 2026-07-26

## Paths expected to exist
- `scripts/checks/memory-integrity.js`
- `scripts/checks/memory-apply.js`
- `.claude/commands/memory/verify.md`

## Paths verified to exist
- `scripts/checks/memory-integrity.js` — Verified Exists 2026-07-27 via `ls -la` by Alex ε
- `scripts/checks/memory-apply.js` — Verified Exists 2026-07-27 via `ls -la` by Alex ε
- `.claude/commands/memory/verify.md` — Verified Exists 2026-07-27 via `ls -la` by Alex ε
- `scripts/checks/memory-integrity.test.js` — Verified Exists 2026-07-27 via `ls` by Alex ε
- `scripts/checks/memory-apply.test.js` — Verified Exists 2026-07-27 via `ls` by Alex ε

## Paths verified nonexistent
- None currently recorded.

## Wirings expected
- `/memory:verify` skill → the detector and the gated executor.
- Detector → `/scan:full` lane registry — deliberately NOT wired; deferred and logged as ED-287.

## Wirings verified
- None currently recorded. The skill-to-script wiring is verified by the skill's own test path, not by a wiring ledger record.

## Dependencies
- The live agent-memory stores as the corpus the detector reads.

## Blockers
- Three open gauntlet defects — see the Verification log. Next action to clear: one fix brief covering all of them, then a re-review of the qa and backend lanes.

## Risks
- Partial fix / likelihood medium / impact medium — a brief covering only some of the named defects guarantees the omitted one re-fails on re-review. Mitigation: enumerate every finding with its file and line in one brief.
- Executor blast radius / likelihood low / impact high — the executor mutates real memory files. Mitigation: it stays gated behind an explicit apply flag, and the open HIGH is precisely about closing its last dirty-store path.

## Decisions
- 2026-07-26 — Defer the `/scan:full` wiring rather than widen the sprint; log the gap as enforcement debt ED-287.
- 2026-07-27 — ε adjudication: the gauntlet is FAIL. The two agy security lanes returned `pass`, but the qa and backend lanes returned binding FAILs, so the sprint does not land.

## Open questions
- None currently recorded.

## Session log
<!-- Append-only (§24). See SESSION_LOG_TEMPLATE.md for the full field set. -->
### 2026-07-27 00:15 UTC — Session 2026-07-26-sprint-resume
- Agent(s): Alex ε (conductor), Alex α (dispatcher) · Mode: sprint
- Work performed: Resumed the sprint mid-gauntlet. α fired the four-lane re-review against commit `a56978fc`; ε verified lane liveness and adjudicated the returned verdicts.
- Files changed: None by ε. · Paths changed: None. · Wirings changed: None.
- Decisions: Adjudicated the gauntlet as FAIL; withheld the land.
- Issues discovered: Two parser false-greens in the detector and one apply-safety gap in the executor.
- Definitions added/changed: None
- State change: Active → Active · Completion change: 80% → 80%
- Verification performed: `gauntlet-verify` over the three registry roles on the canonical ledger; verdict artifacts read directly. · Validation run: `node scripts/dispatch/gauntlet-verify.js --roles security-reviewer,qa-reviewer,backend-reviewer --since 2026-07-27T00:03:00Z` · Validation result: PASS (liveness), exit 0
- Next action: Author one fix brief covering all four named defects, then re-run the qa and backend lanes.
- Evidence/references: `runtime/gauntlet-SP-20260725-002/out/` (four verdict payloads)

## Change log
### 2026-07-27 00:15 UTC — Session 2026-07-26-sprint-resume
- Changed: This tracker file created as the sprint's durable record; state recorded as Active with a red gauntlet.
- Reason: The sprint ran to fix round r9 and through a full gauntlet without ever being registered in the tracker system.
- Affected: `TRACKER.md`, `trackers/sprints/`, epic E-SYSTEM-ORG-001
- Previous state: Untracked — no tracker file, no TRACKER.md row, no ROADMAP entry, no `active-sprints.yaml` record.
- New state: Active, tracked, linked from `TRACKER.md`.

## Evidence log
### 2026-07-27 00:08 UTC — All three registry gauntlet roles ran and produced well-formed completion records
- Evidence type: Validation result
- Detail/location: `node scripts/dispatch/gauntlet-verify.js --roles security-reviewer,qa-reviewer,backend-reviewer --since "2026-07-27T00:03:00Z" --until "2026-07-27T00:20:00Z"` → PASS, exit 0; the security role shows four records because the security review ran as two sequential parts
- Verified by: Alex ε · Supports: the gauntlet completed rather than silently died

### 2026-07-27 00:08 UTC — backend-reviewer returned FAIL with a HIGH apply-safety finding
- Evidence type: Review note
- Detail/location: `runtime/gauntlet-SP-20260725-002/out/backend-reviewer.json` — HIGH at `memory-apply.js:417`; a `correct` plan with a non-empty but structurally invalid body is written before the store is proven clean, and the post-check then exits 1 with `applied: true`
- Verified by: Alex ε · Supports: DoD item "the executor never leaves a structurally invalid store on disk" is NOT satisfied

### 2026-07-27 00:08 UTC — qa-reviewer returned FAIL with two HIGH parser false-greens
- Evidence type: Review note
- Detail/location: `runtime/gauntlet-SP-20260725-002/out/qa-reviewer.json` — HIGH at `memory-integrity.js:149` (a comment-only scalar passes as a real value) and HIGH at `memory-integrity.js:229` (`metadata` with a same-line scalar still satisfies a nested `type`), plus a MEDIUM restating the executor gap and a LOW taxonomy-sync miss
- Verified by: Alex ε · Supports: DoD item "the detector rejects malformed frontmatter without false-greens" is NOT satisfied

### 2026-07-27 00:07 UTC — Both agy security lanes returned PASS
- Evidence type: Review note
- Detail/location: `runtime/gauntlet-SP-20260725-002/out/security-reviewer-part1.json` and `security-reviewer-part2.json` — verdict `pass`, findings empty in both. Recorded with the ED-230 caveat that an `ok:true` antigravity record establishes liveness only, because the served model is not yet proven.
- Verified by: Alex ε · Supports: the security scope, at the disclosed evidence strength

## Verification log
| Item | Should exist? | State | Where / wired where | Proof (cmd/inspection) | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| `memory-integrity.js` | Yes | Verified Exists | `scripts/checks/` | `ls -la` | 2026-07-27 | Alex ε |
| `memory-apply.js` | Yes | Verified Exists | `scripts/checks/` | `ls -la` | 2026-07-27 | Alex ε |
| `.claude/commands/memory/verify.md` | Yes | Verified Exists | `.claude/commands/memory/` | `ls -la` | 2026-07-27 | Alex ε |
| Detector wired into `/scan:full` | No | Verified Nonexistent (and expected nonexistent) | `/scan:full` lane registry | deferred by decision; logged as ED-287 | 2026-07-27 | Alex ε |
| Four lane completion records | Yes | Verified Exists | canonical `dispatch-completions.jsonl` | `gauntlet-verify` exit 0 | 2026-07-27 | Alex ε |

## Current next action
Author one fix brief covering ALL four named defects — `memory-integrity.js:149`, `memory-integrity.js:229`, `memory-apply.js:417`, and the header taxonomy-sync miss — dispatch the fixer, then re-run the qa and backend reviewer lanes on the fixed commit.

## Completion record
- Final state: Not yet complete
- Percent completion: n/a
- Completion timestamp: n/a
- Definition of done used: the Definition of Done above
- Evidence of completion: n/a — the gauntlet is red
- Session IDs / dates / agents: 2026-07-25 through 2026-07-27, Alex ε + Alex α + the registry-fixed reviewer roster
- Parent epic: E-SYSTEM-ORG-001
- Remaining follow-up items: three open defects plus one low; ED-287 (`/scan:full` wiring deferred); the ED-230 served-model caveat on the antigravity lanes
- Related untracked work: None
- ../../TRACKER.md updated: Yes · Roadmap reconciled: No
