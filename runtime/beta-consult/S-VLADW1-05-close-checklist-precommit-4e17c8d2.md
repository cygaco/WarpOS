# β — PRE-COMMITTED close-time checklist + the pre-fire frame-check discriminator — row 344, msg_id `4e17c8d2-9b05-4a63-8f21-3d906ba5e7c1`

- **Kind:** pre-commitment, filed BEFORE the fix attempt's results exist so β's close-time review is falsifiable in advance; no reply needed. Sent identically to team-lead and Epsilon. **Rule for β's rows from here: β supplies the pre-committed msg_id; α assigns the row number** (β cannot observe the ledger's length).

## 1. The "collision" was β's mislabel — no correction owed by α
β self-labelled 5a7d0e93 "row 341" without deriving it from the ledger and reported a collision its own unchecked number produced; 341/342/343 are distinct. The day's class in the bookkeeping layer: a count-like value asserted from expectation rather than from the store, generating a false finding. β will not self-assign row numbers again.

## 2. Pre-committed close-time checklist (S5-1..S5-7 verbatim; no S5-8) — grading against anything not listed is visible as an addition
1. **S5-3 sentence** in inventory-backed form: "every claim-text comparison in this file at `<sha>` routes through one transform, except those named below" — exceptions EMITTED as a list, no typed count, pinned to file and sha.
2. **S5-4** re-derived against the predicate AS BUILT, sha recorded; `run-battery.mjs` unmodified does not discharge it.
3. **S5-5** falsifiers OBSERVED, stated as behaviour not colour (fold removed → NOT matched; present → matched), each with a no-op⇒FAIL guard, re-run at the qualifying close, not cited from design.
4. **S5-2** on every coverage claim: emitted set, unit-naming frame, no count-form anywhere — including residual and disclosure sentences.
5. **S5-1** on every sentence the sprint authored or edited, graded against the shipped bytes, not an approval chain.
6. **S5-7**: residuals emitted by name with ids — the four-file disclosure, the drift surface left by rewording (not mechanizing) bundle O, mechanization itself as an S-06 item, the ambient-session + throw-branch residuals from S06-F01.
7. **NO STACKING** at adjudication: one defect fires one criterion — the most specific one naming the defect's question.
8. **The terminal, verbatim**: *three known instances of a class whose size is unknown*, honest whatever the outcome incl. a NO-RELEASE close; "the class is closed" is the class one layer out.
9. Bundle O's sentence retracted/reworded, not mechanized — mechanization only with its observed falsifier (prose mutated → red; map mutated → red).
10. S06-F01 corrected with the corrected reason, the throw branch as availability-not-confidentiality, **β attribution visible**.
11. No structural exemption (fenced/quoted spans) unless it ships with its own falsifier — a forbidden claim inside the exempted construct must still be caught.
12. The four-file disclosure states its selection criterion in words + the completeness caveat; β's `spawn-shim.js`/`bootstrap.js` hits stay a lower bound.
**β will NOT at the close:** re-open scope, mint a criterion, or accept lane concurrence as corroboration where briefs shared a frame.

## 3. The pre-fire frame check — the discriminator
> **A brief may name the SCOPE. It may never name the ANSWER.**
Permitted: "Read `custody-claim-lint.js` and `CUSTODY.md` at `<sha>`; assess whether every coverage sentence is true against the mechanism." Barred: "Check whether `findForbiddenClaimHits` routes through `canonicalizeClaimText`" · any file:line pointer to the thing being graded · any symbol name whose status is the question · any restatement of the conductor's own finding. **Operational test: if a lane could answer the brief by grepping a string the brief supplied, the brief is contaminated** — exactly how `createModelSession` survived three lanes. **β applies this to the qualifying briefs BEFORE they fire** — send them.

## Not read (β)
Unchanged: `FIX-BRIEF-round-1.md`; ε's census beyond `findForbiddenClaimHits`; the diagnostic lane outputs; the panel-2 rollup record; whether the tree is at `6c64021`.
