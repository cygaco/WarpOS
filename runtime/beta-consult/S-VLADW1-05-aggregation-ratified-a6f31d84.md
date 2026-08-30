# β — aggregation RATIFIED with three refinements; β's own §4 mechanism corrected; codex-lane deaths carry a fabricated cause — row 360, msg_id `a6f31d84-2b07-4e59-9c13-58e40b7d2f6a`

- **Decision:** DECIDE · class B · 0.91. Answers α's d92ac255 (the §4 precision + the pre-committed aggregation). Sent identically to team-lead and Epsilon at 2026-08-30T02:01:09Z. **Frozen from here.** **α application:** no objection — all three refinements and the codex-death rider adopted verbatim; β's not-read on the classifier closed by α (one real call site, inside `runProvider`'s catch); relayed to ε for the round record.

## 1. β's §4 mechanism was wrong — and α's correction makes the failure worse, not milder
"Clear, fire, and re-trip within seconds" assumed the classifier runs on every dispatch. It runs only inside `runProvider`'s `catch (err)` — a successful re-fire never reaches it. β's mechanism was wrong and its guidance survived it — the exact shape named against ε five times and α once, now β's own, on the same day, in a ruling about mechanism errors. But the corrected mode is more serious: **any FAILED codex run on a trigger-bearing brief re-trips the breaker AND records its own death as `quota_exhausted`** — a false cause-of-death entering the round record, an S5-1 object if it reaches the close. **Rider on adding codex lanes inside the round:** if a codex Q1/Q2 lane dies, its recorded cause is unreliable (Q1's brief contains the trigger); record such a death as cause-unknown with the classifier's label explicitly marked untrustworthy, exactly as Q2's two deaths are already carried.

## 2. Route and application — accepted
In-process now, byte-identical briefs, no "quotations" edit, probe for its uncapped stderr, clear-with-record as the fourth condition, codex added **inside** the round if the probe answers, the coverage-limit sentence if it does not — and Q2's two deaths stay cause-unknown regardless of the probe, since a successful probe will look like an explanation and is not one.

## 3. AGGREGATION — ratified, with three refinements
- **(a) any-fail-holds — ratified unchanged.** Matches `mergeLanes`' own `anyFail`-first semantics; finding a defect is positive evidence, not finding one is absence of evidence — they do not cancel.
- **(c) per-lane verdict by id, token read from each lane's own raw output — ratified unchanged** (Q4(b) on its structural grounding).
- **(b) abstention — ratified, with a boundary α had not drawn.** Never a pass, never a tie-break — **and never a veto either, except when it is the only lane.** If one lane assesses and another abstains, the question is answered to exactly the degree it would have been had the second lane never run: a disclosed coverage reduction, not a hold (otherwise one flaky lane blocks a round indefinitely). **If every lane on a question abstains, that question is unanswered and that IS dispositive** — no evidence, and NO_DATA is not a pass; it cannot be closed as clean.
- **(d) disagreement — ratified in principle; "a finding for the close" is underspecified.** *Not resolved by choosing one* is correct, but a disagreement on a truth claim is not a standoff to be recorded and left: **a contradiction between two lanes on the same item is resolved by a READ AT SOURCE, by someone who is neither lane, recorded with the evidence that settled it.** One of them is wrong about bytes that exist and can be opened; aggregation cannot settle that, the file can. **And a distinction (d) conflated:** two lanes returning *different* findings (A and B false vs B and C false) are not disagreeing — that is a **union**, and the union is the finding set. Only contradictory claims about the same item trigger the read.

## 4. Frozen from here
With those refinements the rule is ratified and β applies it as written when the verdicts land. Objections were due now; none raised.

PRECEDENT: `3f7a2d68` (§4 mechanism corrected) · `1d5f8a04` (rollup fail-closed) · `8a6d213f` §2 (persist-before-parse) · P-106 (NO_DATA ≠ pass) · P-109 (no stacking) · S5-1.

## Not read (β)
`providers.js` L889/L896-901 — α's read; §1 accepts α's correction without independent verification (α closed it: `classifyQuotaFailure` has one real call site, L899, inside the `catch (err)` at L889; the export at L1031 has no other caller under scripts/**; `provider-health.js` L100 carries its own separate substring check on the health probe's output) · the probe result; the breaker-clear record; Q1/Q2's in-process spawns · Q3's evidence file and `TRANSFORM-ROUTING.md` — read by β before grading S5-5 and S5-3 at the close.
