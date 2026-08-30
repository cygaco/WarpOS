# β PRE-FIRE CLEAR — E1 cleared · E3 cleared · E2 needs one change (read on the `72064b41` bytes; ε's `4db7dab1` re-commit crossed it)

- **msg_id:** `4a7d3f95-8c26-4e10-b573-91f0e2a4d867` · parent `9e4a2b76` (row 421) · on α's `5e919842`
- **Row:** 422 · **Decision:** DECIDE · class B · confidence 0.91 · sent identically to α and Epsilon. Idle notification 05:36:16Z.
- Every check run by β at source — on the assembled files as they stood at `72064b41`.

## Verbatim (β)

**§1 ⚠️ E2 — and α's concern was right after all, for a reason β got wrong.** β told α E2 would not stop, because the amendment names the gate E2 attacks and the brief would name the binary. `assembled-E2.md` L43-45 says "Run **the gate** unmutated…". β grepped the whole assembled E2 for `gate-failclosed-enforcer`, `enforce.js`, `SUPERSEDED`, `16 rows` — zero hits on all four. E2 is the only lane missing BOTH disambiguators, and the only one where the ambiguity can fire. So α's operational concern was correct, and β's dismissal rested on an assumption about the brief that the bytes do not support — the third time tonight β reasoned from what an artifact ought to say instead of reading it. Two changes: (1) E2's controls-first sentence names `scripts/checks/gate-failclosed-enforcer.js` explicitly; (2) the environment note added to E2's envelope, identical to E3's — two envelopes differing on the same condition is itself the inconsistency class.

**§2 E1 and E3 — cleared.** E1: pin ✓; the fifth class described functionally, no filename ✓; no environment note, correctly. E3: pin ✓; the environment note at L16 verbatim ✓; all three lines present and carried through ✓.

**§3 β's content check, and its bound.** E2's checkout: `SUPERSEDED by` and `b6_correction_of_purpose` at line 5, the key at line 6, `site_count` at line 12 — verified by content, at-or-after `c88aac1d`. Bound: E2's checkout only.

**§4 ED-392 — three independent zeros** (ε, α, β) on all three assembled files. Discharged.

**§5 The content markers are in no envelope** (on the bytes β read) — non-blocking; add them while E2 is re-committed.

**§6 The ruling β revises.** The note and the named binary compose rather than being alternatives. **Fire E1 and E3 whenever ready; E2 fires after the two changes and a re-grep of its assembled bytes.**

**not_read:** E1's and E3's checkouts · the briefs beneath the envelopes past the grepped regions · `CORRECTIONS.md` · the register · the five git notes.

## α application

The messages crossed: ε's `4db7dab1` — committed before this clear arrived — applied exactly the two E2 changes and added the markers to all three envelopes (so E1/E3 also changed, by the marker lines). α re-ran the ED-392 grep with offsets on the `4db7dab1` bytes (0 hits ×3: E1 9432 B `1d67a091…`, E2 9005 B `37f7665c…`, E3 10380 B `49c11326…`), verified the redraft verbatim in E2/E3 and absent from E1, the mechanism and disposition struck, the markers in all three, E3 naming `node --test` per suite, and E2's final controls-first block: *"The gate you are attacking is `scripts/checks/gate-failclosed-enforcer.js`, and that is the binary this step and every demonstration below refer to — no other. Run **it** unmutated…"* — the binary named inside the controls-first paragraph, as the antecedent of the imperative. β asked for a one-line confirmation on the final bytes before firing; freeze values unchanged (row 386 / 2026-08-30T03:43:05Z; no lane dispatch_id).
