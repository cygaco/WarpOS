# SP-20260725-001 — ED-286 citation-obfuscation defense: mechanism fix

- **Sprint label and number:** SP-20260725-001
- **Title:** ED-286 citation-obfuscation defense — mechanism fix (normalize-on-match) for `beta-verdict-citation-receipt.js`
- **Owner:** Alex ε (sprint conductor), under Alex α
- **Parent epic:** [E-DISPATCH-INTEGRITY-001](../epics/E-DISPATCH-INTEGRITY-001-agent-dispatch-integrity.md)
- **Goal:** Close the ED-286 citation-obfuscation bypass CLASS in `scripts/checks/beta-verdict-citation-receipt.js` by construction — normalize the detection text to its rendered form before matching — so that invisible, combining, and confusable character categories are covered by the mechanism rather than by an enumerated strip-list. <!-- doc-ref-ignore: the enforcer lands with SP-20260725-001 — it exists on sprint/SP-20260725-001-ed286-fix, not yet on this branch -->
- **Scope:** <!-- doc-ref-ignore: lands with SP-20260725-001 --> `scripts/checks/beta-verdict-citation-receipt.js` and its test suite `scripts/checks/beta-verdict-citation-receipt.test.js`. Detection-side normalization (NFKD decompose, then strip `\p{M}` / `\p{Cf}`, then fold blank-rendering code points), the receipt-id raw-validation path, character-reference decoding, and the UTF-16 index map that ties normalized match offsets back to raw offsets.
- **Out of scope:** Full CommonMark / HTML / named-entity render fidelity (requires a renderer; bounded by β as disclosed ceiling (h), tracked as ED-290). TR39 confusable-skeleton coverage (ED-289). Wiring the enforcer into any additional gate.
- **Current state:** Blocked — HALTED at the r12 terminal condition, pending an operator architecture decision.
- **Percent completion:** 90% — fix round r12 closed both prior HIGHs (verified: suite 132/132, live-corpus delta 0, both reproductions HARD, the composed index map survived 21 further attacks). The sprint is nonetheless halted: the r12 hunter found two NEW by-construction HIGHs, which fires the terminal condition β set when authorizing r12. The remaining 10% is not another fix round — it is an architecture decision only the operator can take.

## Definition of Done
- [ ] No by-construction character, entity, invisible, combining, or homoglyph bypass survives adversarial probing at the sprint commit.
- [ ] Every cited receipt is validated against the original raw text, so no transformation can mint a resolving `msg_id`.
- [x] The committed test suite passes and carries planted-red teeth for each closed bypass category.
- [ ] All registry-fixed gauntlet lanes return `pass` on one single commit.
- [ ] Remaining ceilings are disclosed in the code and logged as enforcement debt.
- [ ] Landed on `main` with manifests regenerated.

## Related definitions
- Verification, Evidence, Blocker, Completion — see ../../TRACKER.md

## Tasks
- [x] Replace the enumerated strip-set with NFKD decompose-then-strip normalization (the mechanism fix β ratified).
- [x] Build a UTF-16-unit-aligned index map from normalized offsets back to raw offsets.
- [x] Decode numeric and hexadecimal character references, including uppercase-X hex (r11).
- [ ] Anchor receipt validation to the raw occurrence rather than to value membership (open — security-reviewer HIGH).
- [ ] Separate the decoded render line from the original physical line so character-reference decoding cannot mint a raw receipt payload (open — backend-reviewer HIGH).
- [ ] Re-run the affected reviewer lanes on the fixed commit.

## Files expected to change
- `scripts/checks/beta-verdict-citation-receipt.js` <!-- doc-ref-ignore: lands with SP-20260725-001 -->
- `scripts/checks/beta-verdict-citation-receipt.test.js` <!-- doc-ref-ignore: lands with SP-20260725-001 -->

## Files actually changed
- `scripts/checks/beta-verdict-citation-receipt.js` — 2026-07-25 through 2026-07-26 (fix rounds r1–r11) <!-- doc-ref-ignore: lands with SP-20260725-001 -->
- `scripts/checks/beta-verdict-citation-receipt.test.js` — 2026-07-25 through 2026-07-26 <!-- doc-ref-ignore: lands with SP-20260725-001 -->

## Paths expected to exist
- `scripts/checks/beta-verdict-citation-receipt.js` <!-- doc-ref-ignore: lands with SP-20260725-001 -->
- `scripts/checks/beta-verdict-citation-receipt.test.js` <!-- doc-ref-ignore: lands with SP-20260725-001 -->

## Paths verified to exist
- `.worktrees/enforcer-cluster/scripts/checks/beta-verdict-citation-receipt.js` — Verified Exists 2026-07-27 via `ls -la` by Alex ε
- `.worktrees/enforcer-cluster/scripts/checks/beta-verdict-citation-receipt.test.js` — Verified Exists 2026-07-27 via `ls` by Alex ε

## Paths verified nonexistent
- None currently recorded.

## Wirings expected
- `beta-verdict-citation-receipt.js` — the β-verdict citation receipt enforcer, invoked as a standing check.

## Wirings verified
- None currently recorded. The sprint changes the enforcer's internals; it adds no new wiring.

## Dependencies
- `paths.betaEvents` as the receipt corpus. The file is gitignored, so it is absent inside the isolation worktree and the live-corpus delta claim cannot be reconfirmed from that checkout.

## Blockers
- HALTED at the terminal condition. The r12 hunter lane returned FAIL with two NEW by-construction HIGHs, and β's r12 authorization stated that a new char/entity HIGH surviving r12 is evidence the line-scanner architecture cannot close the class by construction. Next action to clear: an operator decision on the renderer-backed architecture change. There is no r13.

## Risks
- Round count / likelihood high / impact medium — the same bypass class has re-failed at a new entry point across multiple rounds. Mitigation: fix the shared root (occurrence-anchored raw validation over the undecoded line), not the next category.
- Disclosed ceiling drift / likelihood low / impact medium — render-fidelity gaps are non-blocking by β's ruling but must stay disclosed. Mitigation: ED-289 and ED-290 carry them.

## Decisions
- 2026-07-25 — Scope the fix as the MECHANISM fix (normalize-on-match), not the next enumerated category — β DECIDE B/0.90, msg_id `f1a4d7c9-3e82-4b56-a0d1-6c9e5b2f8a41`.
- 2026-07-26 — Record-honesty correction: the shipped transform is NFKD-decompose-then-strip, not NFKC, because NFKC recomposes and would leave a precomposed accent's combining mark unseparated — β close-out msg_id `562ba5b6-3e33-407c-aed7-e21e6f00a73e`.
- 2026-07-26 — β bounded-final DECIDE B/0.89 (canonical msg_id `42725f3a`): land if green, under the stop-condition that a NEW by-construction character or entity HIGH requires a fix, while a render-fidelity nuance inside disclosed ceiling (h) / ED-290 is covered and may ship.
- 2026-07-27 — ε adjudication: the gauntlet is NOT green. Both open HIGHs are new by-construction character/entity findings, so β's own stop-condition selects fix over ship. The sprint does not land.

## Open questions
- Whether fix round r12 proceeds as the single root fix or the sprint parks — owner: β, escalated through α.

## Session log
<!-- Append-only (§24). See SESSION_LOG_TEMPLATE.md for the full field set. -->
### 2026-07-27 00:15 UTC — Session 2026-07-26-sprint-resume
- Agent(s): Alex ε (conductor), Alex α (dispatcher) · Mode: sprint
- Work performed: Resumed the sprint mid-gauntlet. α fired the three GPT reviewer lanes against commit `b877096f`; ε verified lane liveness and adjudicated the returned verdicts.
- Files changed: None by ε. · Paths changed: None. · Wirings changed: None.
- Decisions: Adjudicated the gauntlet as FAIL; withheld the land.
- Issues discovered: Two independent HIGH findings sharing one root — a transformation mints the resolving `msg_id` payload before raw validation runs, and the raw check tests value membership rather than occurrence position.
- Definitions added/changed: None
- State change: Active → Blocked · Completion change: 85% → 85%
- Verification performed: `gauntlet-verify` over the three GPT roles from the worktree; verdict artifacts read directly. · Validation run: `node scripts/dispatch/gauntlet-verify.js --roles security-reviewer,qa-reviewer,backend-reviewer --since 2026-07-27T00:00:30Z` · Validation result: PASS (liveness), exit 0
- Next action: Route the round-12-versus-park decision to β, then author one unified fix brief covering both HIGHs.
- Evidence/references: `.worktrees/enforcer-cluster/runtime/gauntlet/SP-20260725-001/out/` (three verdict payloads); worktree completion ledger `.worktrees/enforcer-cluster/.claude/runtime/dispatch-completions.jsonl`

### 2026-07-27 01:40 UTC — Session 2026-07-26-sprint-resume (r12 round)
- Agent(s): Alex ε (conductor), backend-fixer, security_claude_hunter · Mode: sprint
- Work performed: β authorized r12 as the LAST round for the char/entity class (DECIDE B/0.89, msg_id `7c3f9e2a-5d41-4b8e-9a06-2f1c8d5b7e34`), correcting ε's "one root" framing to two INDEPENDENT bypasses. A fixer closed both and committed `93ae41ce`. ε then ran the hunter lane on that commit.
- Files changed: `scripts/checks/beta-verdict-citation-receipt.js` + its suite (by the fixer, in the worktree). None by ε. <!-- doc-ref-ignore: file lands with SP-20260725-001 sprint branch, absent here by design -->
- Decisions: HALTED the sprint at the terminal condition; withheld the land; recommended holding the three GPT lanes as spend without decision value, since the binding hunter lane already fails.
- Issues discovered: two NEW by-construction HIGHs — a clause-model receipt mint (`β DECIDE, msg_id real000betaruled` resolves via prefix truncation) and an NFKD fold that mints an ASCII word character, killing the word boundary and hiding the citation (1,831 of 1,943 swept code points).
- Definitions added/changed: None
- State change: Blocked → Blocked (halted at terminal condition) · Completion change: 85% → 90%
- Verification performed: suite run directly by ε (132/132); hunter verdict artifact read from disk; completion record written evidence-bound. · Validation run: `node scripts/checks/beta-verdict-citation-receipt.test.js` · Validation result: 132/132, exit 0 <!-- doc-ref-ignore: file lands with SP-20260725-001 sprint branch, absent here by design -->
- Next action: operator architecture decision via β's ESCALATE.
- Evidence/references: `runtime/gauntlet/SP-20260725-001/security_claude_hunter-r12-verdict.json`; completion record `d-ms2kzi2q-560162c7`

## Change log
### 2026-07-27 00:15 UTC — Session 2026-07-26-sprint-resume
- Changed: Sprint state recorded as Blocked; this tracker file created as the sprint's durable record.
- Reason: The sprint ran to fix round r11 and through a full gauntlet without ever being registered in the tracker system.
- Affected: `TRACKER.md`, `trackers/sprints/`, epic E-DISPATCH-INTEGRITY-001
- Previous state: Untracked — no tracker file, no TRACKER.md row, no ROADMAP entry, no `active-sprints.yaml` record.
- New state: Blocked, tracked, linked from `TRACKER.md`.

## Evidence log
### 2026-07-27 00:07 UTC — The three GPT gauntlet lanes ran and produced well-formed completion records
- Evidence type: Validation result
- Detail/location: `node scripts/dispatch/gauntlet-verify.js --roles security-reviewer,qa-reviewer,backend-reviewer --since "2026-07-27T00:00:30Z" --until "2026-07-27T00:12:00Z"` run with cwd set to the worktree → PASS, exit 0, three roles `ran` on openai/gpt-5.5
- Verified by: Alex ε · Supports: the gauntlet completed rather than silently died

### 2026-07-27 00:06 UTC — security-reviewer returned FAIL with a HIGH receipt-laundering finding
- Evidence type: Review note
- Detail/location: `.worktrees/enforcer-cluster/runtime/gauntlet/SP-20260725-001/out/security-reviewer-gpt.json` — HIGH at `beta-verdict-citation-receipt.js:501`; reproduction returns scanned=1, hard=0, soft=0 where the control returns HARD
- Verified by: Alex ε · Supports: DoD item "every cited receipt is validated against the original raw text" is NOT satisfied

### 2026-07-27 00:05 UTC — backend-reviewer returned FAIL with a HIGH character-reference finding
- Evidence type: Review note
- Detail/location: `.worktrees/enforcer-cluster/runtime/gauntlet/SP-20260725-001/out/backend-reviewer-gpt.json` — HIGH at `beta-verdict-citation-receipt.js:406`; character-reference decoding precedes raw receipt-payload validation
- Verified by: Alex ε · Supports: DoD item "no transformation can mint a resolving msg_id" is NOT satisfied

### 2026-07-27 00:07 UTC — qa-reviewer returned PASS
- Evidence type: Review note
- Detail/location: `.worktrees/enforcer-cluster/runtime/gauntlet/SP-20260725-001/out/qa-reviewer-gpt.json` — verdict `pass`, no findings, suite 119/119
- Verified by: Alex ε · Supports: the traceability and integrity scope

### 2026-07-26 22:15 UTC — The Claude hunter lane passed on the sprint commit
- Evidence type: Review note
- Detail/location: `.worktrees/enforcer-cluster/runtime/gauntlet/SP-20260725-001/security_claude_hunter-final-verdict.json` — verdict `pass`, 52 probes, `prior_highs_closed: true`, commit field `b877096f`
- Verified by: Alex ε · Supports: the adversarial security scope on the stable commit

## Verification log
| Item | Should exist? | State | Where / wired where | Proof (cmd/inspection) | Checked | By |
| --- | --- | --- | --- | --- | --- | --- |
| `beta-verdict-citation-receipt.js` | Yes | Verified Exists | `.worktrees/enforcer-cluster/scripts/checks/` | `ls -la` | 2026-07-27 | Alex ε |
| `beta-verdict-citation-receipt.test.js` | Yes | Verified Exists | `.worktrees/enforcer-cluster/scripts/checks/` | `ls` | 2026-07-27 | Alex ε |
| Sprint commit `b877096f` | Yes | Verified Exists | branch `sprint/SP-20260725-001-ed286-fix` | `git rev-parse HEAD` in the worktree | 2026-07-27 | Alex ε |
| Three GPT lane completion records | Yes | Verified Exists | worktree `dispatch-completions.jsonl` | `gauntlet-verify` exit 0 | 2026-07-27 | Alex ε |
| Signed origin-proof on the hunter ledger record | Yes | Exists But Incomplete | worktree `dispatch-completions.jsonl` | `gauntlet-verify` with the hunter role → `unsigned`, exit 1 | 2026-07-27 | Alex ε |

## Current next action
Escalate the renderer-backed architecture decision to the operator, via β, as a single recommendation. Do NOT open an r13. Carry into the escalation both the finding and its honest mitigation: HIGH-2 is the normalization mechanism defeating itself, but none of the 1,831 defeating code points are invisible or blank-rendering, so the attack is visible to a human reader and materially weaker than the r6/r7 invisible-class bypasses.

## Completion record
- Final state: Not yet complete
- Percent completion: n/a
- Completion timestamp: n/a
- Definition of done used: the Definition of Done above
- Evidence of completion: n/a — the gauntlet is red
- Session IDs / dates / agents: 2026-07-25 through 2026-07-27, Alex ε + Alex α + Alex β + the registry-fixed reviewer roster
- Parent epic: E-DISPATCH-INTEGRITY-001
- Remaining follow-up items: two open HIGH findings; ED-289 and ED-290 disclosed ceilings; the cross-session unsigned-record ceiling on the hunter lane (ED-231)
- Related untracked work: None
- ../../TRACKER.md updated: Yes · Roadmap reconciled: No
