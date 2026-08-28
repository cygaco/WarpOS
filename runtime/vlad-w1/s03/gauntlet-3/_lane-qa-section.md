---

# YOUR LANE — `qa-reviewer` (BINDING)

Scope: **functional correctness + traceability + integrity.** You are the lane that reads the SHIPPED COPY
against the CODE and asks whether every sentence a user will read is true.

Worktree: `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine`. All paths below are relative to `engine/`.

## Your primary question, and the one that decides S2

`CUSTODY.md` is the single user-facing statement of what this engine PROVES and what it only ASSERTS. **Read
every claim string in it and decide, per claim, whether it is TRUE of the code at close.** Not whether it is
well-hedged, not whether it is bound by a lint — whether it is TRUE.

This is where the previous two rounds died, and both times the false sentence was the NEW one:
- Round 1's ordering claim was false; the fix narrowed it and the narrowed version was still false.
- Round 2's fix added a `node:` builtins clause that was false, self-contradictory, and covered by nothing.

So: **give the sentences that CHANGED this round your hardest reading, and read them under every process
shape and every reader interpretation, not just the flattering one.** A claim that is true only when the
reader supplies a qualifier the text does not state is a false claim.

The header of `CUSTODY.md` now makes a strong promise about what is bound byte-for-byte and what is not. Test
that promise directly rather than believing it:
- Take a paragraph the header says is bound. Reword it. Do the gates go RED? Which gate, and what does it
  say?
- Take a paragraph the header says is NOT bound. Does the header's list of what-is-not-bound actually match
  what the lint leaves unbound? An honest exclusion list that is itself incomplete is the same defect one
  layer out.
- **Add a new Asserted or Ceiling paragraph that is a flat falsehood.** The claim is that a new unbound
  paragraph is RED on sight. Verify it, do not assume it. Then delete a bound one and verify that direction
  too.
- Invert a disclosure that a user would rely on — for instance any statement about whether a control runs in
  a user's own install — into its opposite, and see whether every gate stays green. That exact inversion
  passed every gate last round.

Restore everything you mutate, and confirm `git status --porcelain` is clean at the end.

## Traceability

`npm run check:pointers` is RED BY DESIGN and is deliberately NOT part of `check:ship`. Do not treat its
non-zero exit as a defect. Do check:
- that `package.json#vladPointerLint`'s `currentState` and `owed` now agree with each other AND with the
  real output of the command — re-derive the counts yourself from a fresh run rather than reading either
  field. The two halves contradicted each other last round, with one prescribing exactly the regrouping the
  other forbade.
- that the one pointer representing missing WORK rather than name drift is still distinguishable from the
  drift population, and still red. If it has been made to resolve by adding scaffolding rather than by doing
  the work, that is a serious finding: it is the precise camouflage this sprint has corrected twice.

## Integrity and the suite

- Run `node --test "test/*.test.js"` and `npm run check:ship` yourself and report the real numbers. The floor
  is 294 passing; report pass/fail/skipped/todo exactly.
- Compare the test inventory against the previous round's commit `0732cd8`: `git diff 0732cd8..HEAD -- test/`.
  **Did any test title disappear, and was it replaced by something strictly stronger or something weaker?**
  Did any assertion loosen? Did a `t.skip()` or `.todo` appear anywhere? A suite that grew while quietly
  weakening an existing assertion is a regression the count will not show you.
- Any test whose oracle can silently become a no-op — a mutation that does not mutate, a fixture that is
  present but never evaluated, an assertion whose predicate cannot fail — is a finding even if it is green
  today. S4's whole bar is "observed RED", so a falsifier that CANNOT go red is a criterion failure, not a
  style note.

## THREE ASSERTIONS YOU MUST RESOLVE BY A READ, not by an envelope claim

Beta flagged the first two as load-bearing for S2; the third is load-bearing for S4. In each case a builder
or the conductor has ASSERTED something. **An assertion in an envelope is not the artifact. Open the file.**

1. **`engine/test/custody-runtime.test.js` does not contain a test node named
   `selfcheck-runs-on-user-machine`.** Read the file and confirm or refute. If it is absent, note which test
   nodes it DOES carry.
2. **`npm run check:pointers` classifies that pointer as `missing-NAME`, not `missing-file`.** Run it and
   read the classification. The distinction is the whole point: a missing NAME where the file exists means
   the work is missing, and it must not be laundered into the clerical drift population.
3. **The predecessor sprint's AC-8.4 mutation twin still exists and is still RED-CAPABLE.** The rule says
   "re-verified not cited", and it rides on S4. Bundle 10e's envelope claims it re-verified this, but
   `engine/test/custody-runtime.test.js` was NOT MODIFIED this round and carries no re-verification marker.
   **Mutate it yourself and observe it go red.** If you do not personally observe that, S4 is not satisfied
   on this point and you should say so.

If item 3 turns out to have been made to resolve by adding scaffolding rather than by doing real work, that
is a serious finding — it is the precise camouflage this sprint has corrected twice.

## S5 — re-adjudicate, do not carry

AC-8.6 has been DEFERRED to a named successor sprint since the last round, so gauntlet 2's "S5 holds" is
void and you are re-deriving S5 from the current surface. Two specific things to check:

- **A deferred item's disclosure must not silently go stale.** Any shipped sentence that binds AC-8.6's
  delivery to THIS sprint becomes false at close. Read the P3 Ceiling paragraph carefully for possessives or
  tense that assume delivery here.
- **Deferring the work does not defer the RESIDUAL.** Build-spec item 6 carried a CLASS-form residual — *no
  enforcer asserts the general property that every shipped control is invoked by some product-layer path* —
  and `CUSTODY.md` discloses only the INSTANCE (this one fixture is not wired into a user's install). S5
  allows the residual to be RECORDED rather than shipped, and the conductor has recorded it in
  `runtime/vlad-w1/s03/fix-attempt-2/ROUND-RECORD.md` §4. **Verify that record exists and says what it
  claims to say** — and form your own view on whether recording it there satisfies S5's "disclosure lives
  where the claim's reader is" for a shipped claim, or whether it needed to ship. That judgment is yours to
  state; α applies the rule.

## What you own on the S-criteria

You are the deciding lane for **S2** and **S5**, and a contributing lane for **S4**.
- **S2:** every custody claim on a shipped surface true at close. Shipped surfaces include `CUSTODY.md`,
  `package.json`'s shipped copy, and user-visible strings in `src/server-entry.js` and the driver.
- **S5:** every named residual travels to the recorded or shipped surface. Disclosure must live where the
  CLAIM's reader is — an internal note does not satisfy S5 for a shipped claim.
- **S4:** you can assess whether the falsifiers are present, committed, and structurally capable of going
  red. If you did not personally mutate one, say so — "the tests are green" is not evidence that a falsifier
  was observed RED, and reporting it as such is how S4 went unmeasured for two rounds.
