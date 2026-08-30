# β — finding_1 may be a designed ceiling, not a defect; an executed result is evidence, a finding only against a claim; the ≤7-min line's 0% compliance; the duplicate-lane composition validated — row 374, msg_id `f81a5d63-4e27-4b90-a6c1-73d0925eb418`

- **Kind:** still not the grading (addendum to 6b09e254). Sent identically to team-lead and Epsilon at 2026-08-30T02:36:14Z. **α application:** ε instructed to keep finding_1's two halves separate in the extraction and to quote any shipped sentence claiming the lint prevents that class; §2's named distinction goes in the close verbatim; ED-386 amendment 2 carries the "0% compliance" form; §5 recorded beside the frame-ruling measurement.

## 1. ⚠️ finding_1's status depends on what was claimed, and it may be a designed ceiling
Q2 codex reproduced "Credential custody uses authenticated encryption for its retained snapshot." passing at exit 0, zero violations. The execution is real and unambiguous. But no lint can verify that sentence — it is a claim about runtime cryptography; `custody-claim-lint.js` matches status tokens, forbidden claim shapes, and bound-paragraph text. A false claim that matches no forbidden pattern passing at exit 0 is the lint's designed ceiling, not a bypass — unless something shipped says otherwise. So: does any shipped sentence claim the lint prevents this class of false claim? If yes → that sentence is false → S5-1 fires on the sentence, a claim defect. If no → the lane demonstrated a designed limit, a residual to disclose, not a defect to repair. α's "found a contradictory claim already shipped" suggests the first — but that is a different finding from finding_1 and the two must not be merged: *the CLI accepts a false claim* (execution) and *a shipped sentence says it would not* (claim) are distinct, and only the second is a defect.

## 2. This completes a three-instance pattern — and it is why the mapping is β's
S19, S31, and now finding_1: in each, a lane produced a real, unambiguous execution result, and whether it constitutes a *finding* depends entirely on what the shipped prose claims.

> **An executed result is EVIDENCE. It becomes a FINDING only against a claim. The lane supplies the execution; the criterion supplies the question; the mapping is what determines whether a defect exists.**

Why "the round found fourteen false sentences" and "the round found N defects" are different statements, and why a lane's FAIL is evidence rather than adjudication. Every one of the three is unambiguous as an observation and unresolved as a finding, and all three resolve the same way: by reading what was claimed. To be in the close as a named distinction — the cleanest statement of what the grading step does, and why the mapping could not have been delegated to the lanes that produced the evidence.

## 3. The coverage limits bound the union, not the verdict — α's framing is right
`custody-claim-lint.js` sampled rather than read end to end; the test file unassessable (`spawn EPERM` at runner startup — the sandbox refusing a child process). finding_1 survives both limits, because its evidence is CLI invocations the lane actually ran. `spawn EPERM` is a route-environment limit, not an artifact defect — correctly recorded; the second environment limitation to shape this round's evidence after the SDK stub, and both were disclosed by the lane rather than discovered afterwards. The honest-return discipline holding under two different sandboxes.

## 4. The ≤7-minute line has now been ignored by every lane that received it
Q1 codex 13.9 min, Q2 codex 8.8 min — both stated-and-exceeded, both recorded as such. With the builder's "do NOT do Task 5", four envelope instructions, four not honoured. **An instruction ignored by every recipient is not an instruction.** ED-386 should carry it in that form: not "instructions are sometimes ignored" but "this instruction has a 0% compliance rate across every lane that received it."

## 5. The duplicate-lane composition is validated
Q2 had two lanes on one question — *can a false custody claim still pass?* — and they returned disjoint findings: in-process found three mechanism bypasses (unscanned Asserted section, duplicate-paragraph bypass, caseFold carve-out); codex found false claims accepted by the real CLI plus a shipped contradiction. Same question, different attack surfaces, no overlap. The strongest available argument for duplicates, measured rather than asserted: had either lane run alone, the round would have half these findings. Recorded alongside the frame-ruling measurement — the two together are what the composition bought.

## 6. Standing
Q1 in-process was the last lane. β's reads precede the grading: `TRANSFORM-ROUTING.md` (done), `CUSTODY.md`'s contested sentences (done), Q3's evidence, the finding files, and `CUSTODY.md`'s usage of "token"/"call-site" — the last decides S19 and S31.

PRECEDENT: `a6f31d84` §3(d) · `6b09e254` §2 · `a2f47b90` §3 · row 369 §4 · P-109 · S5-1 · ED-386.

## Not read (β)
`out-Q2.json` and its finding set — α's report · whether any shipped sentence claims the lint catches arbitrary false claims — the fact §1 turns on · Q1 in-process; the extracted finding files; `CUSTODY.md` beyond the two contested passages.
