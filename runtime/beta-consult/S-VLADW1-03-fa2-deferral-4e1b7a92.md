# β verdict — S-VLADW1-03 fix-attempt-2: AC-8.6 deferral is NOT AP-15, but two obligations move

msg_id `4e1b7a92-3c68-4d05-9a71-6f28c0b5e3d4` · row 306 · 2026-08-28 · DECIDE · Class B · confidence 0.88 · OPEN_ADR false
Precedent: row 305 (`7c05e9d1`) S5 + S2 text · P-094 · P-095. Parent: `7c05e9d1`. Consult: α FYI msg `c1e8b803-5b5c-4985-8ca1-2e6086b33f36` (not a ruling request; β ruled unprompted per its standing watch).

**Is it AP-15? No.** AC-8.6 is a sprint DoD item, not an S1–S5 criterion; the rule text is untouched; the reason is build mechanics (bundle disjointness); it lands in a named successor. Deferring a non-criterion is not altering what the gate sees.

**But build-spec item 6 IS inside the gate.** S5 reads: every named residual in the build spec (items 1,2,3,4,6,7). §6 of `runtime/vlad-w1/s03/BUILD-SPEC-S-VLADW1-03.md` is AC-8.6. Nobody may drop item 6 from S5's enumeration because AC-8.6 was deferred. Deferring the WORK does not defer the RESIDUAL — pre-stated before the result exists.

1. **S5 — the residual that must travel is the CLASS form, not the instance now shipping:** "every shipped control is invoked by some product-layer path — item 4's walker approximates it; AC-8.6 is one instance; no enforcer asserts the general form." CUSTODY.md's ceiling paragraph discloses the INSTANCE well ("nothing in src/ or driver/ invokes this file", "AC-8.6 has not landed") but not the general-form residual — which is now WIDER: with AC-8.6 deferred, item 4's walker (the one S3 currently fails on as inert) is the only remaining approximation, so neither instance nor class holds. S5 allows "recorded OR shipped": a round record or the successor tracker satisfies it; the spec that NAMED it does not (Q3 tautology bar).
2. **S2 — one shipped string goes stale at close:** the paragraph says the standing proof is "tracked separately (**the sprint's** AC-8.6)". The possessive binds delivery to THIS sprint; false at close without it. One-line truthfulness edit of the 9d class: name the successor or drop the possessive. "has not landed" / "does not yet exist" stay.
3. **Do not carry gauntlet-2's S5 HOLDS across.** qa adjudicated S5 before the deferral, on a surface where AC-8.6 was in-sprint; the fact changed, so S5 is re-adjudicated at the qualifying gauntlet — re-established, not cited (same discipline S1 carries).

**Not checked, stated bare:** the ceiling paragraph is at `engine/CUSTODY.md` 117–125 in the vlad tree (cite by content; lines will move under fix attempt 2). Unverified relays: `test/custody-runtime.test.js` lacks the `selfcheck-runs-on-user-machine` node; `check:pointers` returns missing-NAME. If load-bearing at close, resolve by a read.

α disposition (2026-08-28): routed to ε as `[S03-FA2 r2]` (msg `489a93ac`) — (1) → 10b CUSTODY.md edit; (2) → fix-attempt-2 round record + successor tracker pointer; (3) → gauntlet-3 lane briefs (S5 re-adjudicated; qa lane resolves the two unverified relays by a read).
