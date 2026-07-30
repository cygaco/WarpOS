# SP-20260725-001 — ED-286 citation-obfuscation defense: mechanism fix

- **Sprint label and number:** SP-20260725-001
- **Title:** ED-286 citation-obfuscation defense — mechanism fix (normalize-on-match) for `beta-verdict-citation-receipt.js`
- **Owner:** Alex ε (sprint conductor), under Alex α
- **Parent epic:** [E-DISPATCH-INTEGRITY-001](../epics/E-DISPATCH-INTEGRITY-001-agent-dispatch-integrity.md)
- **Goal:** Close the ED-286 citation-obfuscation bypass CLASS in `scripts/checks/beta-verdict-citation-receipt.js` by construction — normalize the detection text to its rendered form before matching — so that invisible, combining, and confusable character categories are covered by the mechanism rather than by an enumerated strip-list. <!-- doc-ref-ignore: the enforcer lands with SP-20260725-001 — it exists on sprint/SP-20260725-001-ed286-fix, not yet on this branch -->
- **Scope:** <!-- doc-ref-ignore: lands with SP-20260725-001 --> `scripts/checks/beta-verdict-citation-receipt.js` and its test suite `scripts/checks/beta-verdict-citation-receipt.test.js`. Detection-side normalization (NFKD decompose, then strip `\p{M}` / `\p{Cf}`, then fold blank-rendering code points), the receipt-id raw-validation path, character-reference decoding, and the UTF-16 index map that ties normalized match offsets back to raw offsets.
- **Out of scope:** Full CommonMark / HTML / named-entity render fidelity (requires a renderer; bounded by β as disclosed ceiling (h), tracked as ED-290). TR39 confusable-skeleton coverage (ED-289). Wiring the enforcer into any additional gate.
- **Current state:** Completed — SHIPPED WITH DISCLOSURE per the operator ruling of 2026-07-28. Not a clean completion: three Definition-of-Done items remain unmet by design and are carried as named debt (ED-296, ED-297). See the Completion record.
- **Percent completion:** 100% of the ruled scope. Fix round r12 closed both prior HIGHs (verified: suite 132/132, live-corpus delta 0, both reproductions HARD, the composed index map survived 21 further attacks). The r12 hunter then found two NEW by-construction HIGHs, firing β's terminal condition; β escalated a single recommendation — ship r12 as-is with both disclosed as named debt, no renderer, no r13 — and the operator adopted it. The sprint therefore closes with the bypass CLASS narrowed but not eliminated.

## Definition of Done
- [ ] No by-construction character, entity, invisible, combining, or homoglyph bypass survives adversarial probing at the sprint commit. — **NOT MET, disclosed.** Two survive: ED-296 (citation-boundary receipt mint) and ED-297 (fold-boundary detection kill). Both are documented in the enforcer header and carried as open debt.
- [ ] Every cited receipt is validated against the original raw text, so no transformation can mint a resolving `msg_id`. — **NOT MET, disclosed.** Validation is occurrence/span-anchored as of r12, but ED-296 mints a resolving receipt via prefix truncation when a real ledger id is a prefix of the forged token.
- [x] The committed test suite passes and carries planted-red teeth for each closed bypass category. — 132/132, re-verified from the clean `session/2026-07-25` tree after the merge.
- [ ] All registry-fixed gauntlet lanes return `pass` on one single commit. — **NOT MET, disclosed.** The Claude hunter lane returned FAIL on r12 (`93ae41ce`). The ship is an operator ruling over a red lane, not a green gauntlet.
- [x] Remaining ceilings are disclosed in the code and logged as enforcement debt. — the `IN-SCANNER DISCLOSED DEFECTS` block (commit `cefc549c`), deliberately separate from the NORMALIZATION CEILING (a)-(h) series; ED-296/297 logged and classified; ED-286 closed with both as carried residuals.
- [x] Landed with manifests regenerated. — landed on `session/2026-07-25` via merge `956c2c79`, the established route for sprint branches; **not** directly on `main`, which is fenced by `protected-ref-transaction`.

## Related definitions
- Verification, Evidence, Blocker, Completion — see ../../TRACKER.md

## Tasks
- [x] Replace the enumerated strip-set with NFKD decompose-then-strip normalization (the mechanism fix β ratified).
- [x] Build a UTF-16-unit-aligned index map from normalized offsets back to raw offsets.
- [x] Decode numeric and hexadecimal character references, including uppercase-X hex (r11).
- [x] Anchor receipt validation to the raw occurrence rather than to value membership (closed in r12 `93ae41ce`; the r11 security-reviewer HIGH is closed).
- [x] Separate the decoded render line from the original physical line so character-reference decoding cannot mint a raw receipt payload (closed in r12 `93ae41ce`; the r11 backend-reviewer HIGH is closed).
- [x] Re-run the affected reviewer lanes on the fixed commit — the Claude hunter ran on `93ae41ce` and returned FAIL with two NEW findings, which is what triggered the escalation and the ship-with-disclosure ruling.
- [x] Disclose the two surviving defects in the enforcer header as in-scanner defects, NOT as ceiling items (`cefc549c`).

## Files expected to change
- `scripts/checks/beta-verdict-citation-receipt.js` <!-- doc-ref-ignore: lands with SP-20260725-001 -->
- `scripts/checks/beta-verdict-citation-receipt.test.js` <!-- doc-ref-ignore: lands with SP-20260725-001 -->

## Files actually changed
- `scripts/checks/beta-verdict-citation-receipt.js` — 2026-07-25 through 2026-07-28 (fix rounds r1–r12, then the r12 disclosure header `cefc549c`)
- `scripts/checks/beta-verdict-citation-receipt.test.js` — 2026-07-25 through 2026-07-27 (119 → 132 tests)

## Paths expected to exist
- `scripts/checks/beta-verdict-citation-receipt.js`
- `scripts/checks/beta-verdict-citation-receipt.test.js`

## Paths verified to exist
- `scripts/checks/beta-verdict-citation-receipt.js` — Verified Exists 2026-07-28 on `session/2026-07-25` post-merge, via `node --check` + a 132/132 suite run by Alex ε
- `scripts/checks/beta-verdict-citation-receipt.test.js` — Verified Exists 2026-07-28 on `session/2026-07-25` post-merge, via direct execution by Alex ε

## Paths verified nonexistent
- None currently recorded.

## Wirings expected
- `beta-verdict-citation-receipt.js` — the β-verdict citation receipt enforcer, invoked as a standing check.

## Wirings verified
- None currently recorded. The sprint changes the enforcer's internals; it adds no new wiring.

## Dependencies
- `paths.betaEvents` as the receipt corpus. The file is gitignored, so it is absent inside the isolation worktree and the live-corpus delta claim cannot be reconfirmed from that checkout.

## Blockers
- CLEARED 2026-07-28 by operator ruling. The sprint had HALTED at the terminal condition: the r12 hunter lane returned FAIL with two NEW by-construction HIGHs, and β's r12 authorization stated that a new char/entity HIGH surviving r12 is evidence the line-scanner architecture cannot close the class by construction. β then FALSIFIED her own stated premise on re-examination — neither finding is renderer-class, so a renderer would fix neither — and escalated a single recommendation to ship r12 with both disclosed. The operator adopted it. No r13; no renderer ADR.
- Carried forward, not resolved: ED-296 and ED-297 remain OPEN against this enforcer. They are disclosed, bounded, and closable with machinery already in the file — they are not blockers on this sprint, but they are real open defects and a future round should close them.

## Risks
- Round count / likelihood high / impact medium — the same bypass class has re-failed at a new entry point across multiple rounds. Mitigation: fix the shared root (occurrence-anchored raw validation over the undecoded line), not the next category.
- Disclosed ceiling drift / likelihood low / impact medium — render-fidelity gaps are non-blocking by β's ruling but must stay disclosed. Mitigation: ED-289 and ED-290 carry them.

## Decisions
- 2026-07-25 — Scope the fix as the MECHANISM fix (normalize-on-match), not the next enumerated category — β DECIDE B/0.90, msg_id `f1a4d7c9-3e82-4b56-a0d1-6c9e5b2f8a41`.
- 2026-07-26 — Record-honesty correction: the shipped transform is NFKD-decompose-then-strip, not NFKC, because NFKC recomposes and would leave a precomposed accent's combining mark unseparated — β close-out msg_id `562ba5b6-3e33-407c-aed7-e21e6f00a73e`.
- 2026-07-26 — β bounded-final DECIDE B/0.89 (canonical msg_id `42725f3a`): land if green, under the stop-condition that a NEW by-construction character or entity HIGH requires a fix, while a render-fidelity nuance inside disclosed ceiling (h) / ED-290 is covered and may ship.
- 2026-07-27 — ε adjudication: the gauntlet is NOT green. Both open HIGHs are new by-construction character/entity findings, so β's own stop-condition selects fix over ship. The sprint does not land.
- 2026-07-27 — β ESCALATE C/0.88, msg_id `9f4e7b21-3c86-4d90-b7a5-1e2f8c60d43b`, supplemented by `3b8c5f47-2e91-4a06-8d73-c15e9f2a4b60` (C/0.89): a renderer fixes NEITHER finding, so the terminal condition's stated premise is falsified. Single recommendation — ship r12 as-is with both disclosed as named debt; no renderer; no r13; close ED-286. β also repaired her own two-way discriminator into three classes (mechanism / render-block / scanner-logic), which is what separates ED-297 (mechanism, terminal-relevant) from ED-296 (scanner-logic, not terminal).
- 2026-07-28 — OPERATOR RULING (AskUserQuestion, this session): SHIP r12 with disclosure. β's escalated recommendation adopted in full. ε executed the staged package.

## Open questions
- None open for this sprint. The r12-versus-park question was resolved by the 2026-07-28 operator ruling. The successor question — whether to spend a round closing ED-296/ED-297 — belongs to whichever sprint picks up those ids, not to this one.

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

### 2026-07-28 21:45 UTC — Session 2026-07-28-ship-execute
- Agent(s): Alex ε (conductor), under Alex α · Mode: sprint
- Work performed: Executed the staged SHIP-WITH-DISCLOSURE package on the operator ruling. Verified β's ESCALATE row `9f4e7b21` directly in `paths.betaEvents` before acting on the relayed ruling. Confirmed ED-296/ED-297 were already filed in the CANONICAL ledger (the worktree has no ledger file — it is gitignored there), correctly classified and deliberately NOT filed under ceiling (h). Applied the ratified disclosure block to the enforcer header, adapted to the file's `//` comment style, with explicit code points (U+00B9, U+1D43, U+FF3F) on the repro strings so the disclosure survives any encoding round-trip. Merged the sprint branch to `session/2026-07-25`. Appended the ED-286 closure record.
- Files changed: `scripts/checks/beta-verdict-citation-receipt.js` (header comment only, +39 lines). · Paths changed: None. · Wirings changed: None.
- Decisions: Recorded completion as SHIPPED WITH DISCLOSURE rather than as a clean completion, leaving three DoD items visibly unmet — the ship is an operator ruling over a red hunter lane, and a tracker that hid that would be the ED-292 documented-invariant class this sprint exists to prevent.
- Issues discovered: The merge brought in more than this sprint's stated scope — the branch is based on `dfb8b394` (SP-20260724-001's ED-239/056/033 enforcer cluster), which had never landed on the session branch. Landing A necessarily lands its base; cherry-picking would have broken the lineage the 132/132 suite was verified against. Surfaced to α rather than silently absorbed. Separately, `protected-ref-transaction` refused a `pack-refs` write to `refs/heads/main` (no-current-controller-fence) — noted, not worked around.
- Definitions added/changed: None
- State change: Blocked → Completed · Completion change: 90% → 100% of the ruled scope
- Verification performed: β ledger row read directly; suite run by ε from the CLEAN `session/2026-07-25` tree post-merge (not in-worktree, per the clean-state rule); `node --check` and a NUL-byte scan on the edited file; ledger re-parsed line-by-line after the append. · Validation run: `node scripts/checks/beta-verdict-citation-receipt.test.js` from the main tree · Validation result: 132/132, exit 0. Sibling suites landed by the same merge: `ed-register-reality-drift` 29/29, `enforcer-selftest-coverage` 15/15, both exit 0.
- Next action: Manifest triple, then hand the ED-296/ED-297 round to α for sequencing.
- Evidence/references: disclosure commit `cefc549c`; merge `956c2c79`; β `9f4e7b21-3c86-4d90-b7a5-1e2f8c60d43b` + `3b8c5f47-2e91-4a06-8d73-c15e9f2a4b60`; hunter verdict `runtime/gauntlet/SP-20260725-001/security_claude_hunter-r12-verdict.json`; completion record `d-ms2kzi2q-560162c7`

## Change log
### 2026-07-28 21:45 UTC — Session 2026-07-28-ship-execute
- Changed: Sprint state Blocked → Completed (shipped with disclosure); enforcer header gained the IN-SCANNER DISCLOSED DEFECTS block; ED-286 closed; sprint branch merged to `session/2026-07-25`.
- Reason: Operator ruling of 2026-07-28 adopting β's escalated single recommendation (`9f4e7b21`).
- Affected: `scripts/checks/beta-verdict-citation-receipt.js`, `TRACKER.md`, this tracker, `paths.enforcementDebt` (ED-286 closure), epic E-DISPATCH-INTEGRITY-001
- Previous state: Blocked at the r12 terminal condition, awaiting an operator architecture decision.
- New state: Completed with two named, disclosed, still-open residuals (ED-296, ED-297).

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
| β ESCALATE row `9f4e7b21` backing the ship ruling | Yes | Verified Exists | `paths.betaEvents` | direct read of the row + its `3b8c5f47` supplement before acting on the relay | 2026-07-28 | Alex ε |
| ED-296 / ED-297 filed and classified OUTSIDE ceiling (a)-(h) | Yes | Verified Exists | canonical `paths.enforcementDebt` | ledger parsed record-by-record; 2 records each, classes `SCANNER-LOGIC-CLASS-disclosed` / `MECHANISM-CLASS-disclosed` | 2026-07-28 | Alex ε |
| ED-286 closure record | Yes | Verified Exists | canonical `paths.enforcementDebt` | appended via Edit per the JSONL write guard; re-parsed 188/188 lines, 0 malformed; `ed-dup-id-lint` exit 0 | 2026-07-28 | Alex ε |
| IN-SCANNER DISCLOSED DEFECTS header block | Yes | Verified Exists | `scripts/checks/beta-verdict-citation-receipt.js` | `git show --stat cefc549c` (+39, comment-only); `node --check` exit 0; NUL-byte scan clean | 2026-07-28 | Alex ε |
| Suite green from the CLEAN tree, not in-worktree | Yes | Verified Exists | `session/2026-07-25` post-merge | `node scripts/checks/beta-verdict-citation-receipt.test.js` → 132/132, exit 0 | 2026-07-28 | Alex ε |

## Current next action
None for this sprint — it is closed. The successor work, for α to sequence: one round closing ED-296 (widen the CITATION_RE lookbehind to exclude digits and id punctuation; validate the FULL id token against the raw span) and ED-297 (assert word boundaries in RAW space via the existing norm→raw index map rather than in folded space). Both fix directions are already written into the enforcer header and need no new machinery.

## Completion record
- Final state: Completed — SHIPPED WITH DISCLOSURE. This is not a clean completion and should not be read as one: three Definition-of-Done items are unmet and marked so above.
- Percent completion: 100% of the ruled scope
- Completion timestamp: 2026-07-28 21:45 UTC
- Definition of done used: the Definition of Done above, with three items explicitly waived by operator ruling rather than satisfied
- Evidence of completion: disclosure commit `cefc549c`; merge `956c2c79` onto `session/2026-07-25`; suite 132/132 exit 0 re-run from the clean post-merge tree; ED-286 closure record appended to `paths.enforcementDebt`; β `9f4e7b21-3c86-4d90-b7a5-1e2f8c60d43b` + supplement `3b8c5f47-2e91-4a06-8d73-c15e9f2a4b60`; operator ruling 2026-07-28
- What the sprint actually bought: the citation-obfuscation bypass class went from an enumerated strip-list to a normalize-on-match MECHANISM (NFKD decompose-then-strip, composed decode∘normalize index map, occurrence/span-anchored raw receipt validation), closing the full invisible/control/mark/default-ignorable class, character-reference laundering, and the r11 value-membership laundering hole. Suite grew 119 → 132 with planted-red teeth per closed category. Live-corpus delta 0 throughout.
- What it did NOT buy: the class is narrowed, not eliminated. ED-296 and ED-297 remain open and exploitable at the described repros.
- Session IDs / dates / agents: 2026-07-25 through 2026-07-28, Alex ε + Alex α + Alex β + the registry-fixed reviewer roster + security_claude_hunter
- Parent epic: E-DISPATCH-INTEGRITY-001
- Remaining follow-up items: ED-296 and ED-297 (open, disclosed, closable with existing machinery); ED-289 and ED-290 disclosed ceilings; the cross-session unsigned-record ceiling on the hunter lane (ED-231)
- Related untracked work: The merge also landed SP-20260724-001's ED-239/056/033 enforcer cluster (`dfb8b394`), which was this branch's base and had not previously reached the session branch. Its suites pass on the merged tree (29/29 and 15/15).
- ../../TRACKER.md updated: Yes · Roadmap reconciled: No
