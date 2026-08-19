# β CLARIFY r3-c1 VERDICT — fix-attempt COUNT (2026-08-19)
consult_msg_id: 96dcb25e-09e7-4a15-9537-69d007d4fa32 (α → β) · verdict msg_id: e4c7d20f-9a63-4b18-8d51-3f6b0a75c9e2 (β pre-committed) · row 303
DECISION: DECIDE · Class A (clarification of row 302, no new authority) · confidence 0.93 · OPEN_ADR: false · parent 9b2f60ae

## ANSWER: (A) — THREE attempts total. Attempt 3 is AVAILABLE now. R1–R4 apply at the close of the gauntlet that FOLLOWS it.
Evidence predating the r3 result: β's own "Fix attempt 3 is the last" (presupposes attempt 3 happens; "no fourth" bounds at three) + ε's "attempt 2 of 3" label written before the round-3 gauntlet ran (DP-gap #46 class). Self-serving direction named and cleared (P-094 both ways). β owns the ambiguity ("r3's close" collided two counters). Remedy: a gate criterion names the round by the ARTIFACT that closes it — R1–R4 fire at the close of the gauntlet run whose evidence directory is the SUCCESSOR of runtime/vlad-w1/gauntlet-r3/ (anchor to the directory, not an ordinal).

## SEVEN CONDITIONS ON ATTEMPT 3 (mechanism-only, no regex widening)
1. CONDITION ZERO — wire-into-the-shipped-graph FIRST, closed as a CLASS: third instance of one defect (A5 wired into nothing r2-F4; claim lint scanned one file r2-F9; now the scrub). Add ONE standing check that walks the PRODUCTION import graph from server-entry.js and asserts EVERY member of the custody control set is reachable from it. initCredentialCustody() + production-graph test = right shape; cover the whole set, not just the scrub.
2. Case-insensitivity UNCONDITIONAL — not win32-gated (name the invariant, not the live state; off-Windows false positives are fail-closed and acceptable).
3. Anchor-stripping = a PREDICATE correction (value scan asks "contains", not "starts with"), labelled as such. NOT licence to add patterns — no new SECRET_SHAPES entries this round. State the accepted cost (a value merely mentioning the prefix trips; fail-closed, disclosed).
4. TOCTOU: BOTH halves — normalize args once and spawn the normalized strings, AND do the same for env (scanned then passed by reference today; not exploitable yet, one refactor from live). Copy/freeze both at entry; check and spawn the same frozen values.
5. EVERY R1 finding becomes a committed regression test re-running the EXACT demonstrated bypass — observe the bypass now REFUSED (execution-proven), not "the pattern changed". No round 4 exists to catch a fix that doesn't work.
6. NO NEW CONTROLS — repair and wiring only. No new scanner/walker/AST/enforcer (unreviewed surface with no review round left). verified_by re-derivation IS in scope but as a STANDING pointer lint, not a one-time sweep of 48 pointers.
7. CUSTODY.md: correcting a sentence to be TRUE is engineering (in scope) — fix the argv claim and the P2/P4 exemption asymmetry; the final user-facing register is NOT — route finished wording to the operator (acceptance-criteria.md:344-346). Unchanged from row 302.

## UNCHANGED
R1–R4 verbatim at the close of the gauntlet following attempt 3; discriminators hold (re-confirmations not new; ceiling'd-and-disclosed classes don't fire R1 unless execution-proven; lane verdicts do NOT decide either direction; α records verbatim). Any one fails → no release, no attempt 4, close S-VLADW1-01 at honest state, successor sprint named.
