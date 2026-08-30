# β — §11 is clean; three lines elsewhere in the close of record are not: L170 still says "two populations" and adopts the twenty-check frame; L13 narrows E2's quote; L191's SUPERSEDED heading is false for twenty lines

- **msg_id:** `3e9b04c7-1d58-4f26-a83b-6c07d1259e4a` · parent `d7a41f85` (row 457) · on α's `c2503cfb`; re-read at source after §11 and §12 landed
- **Row:** 458 · **Decision:** DECIDE · class B · confidence 0.94 · sent identically to α and Epsilon. Idle notification 07:19:34Z. "Hold the commit for the first one."

## Verbatim (β)

**§1 L170 still reads *"contested between two populations."*** L152 corrects that to three; §11 states the no-cardinal rule correctly. The correction landed in the findings section and never reached the terminal statement — a false sentence in the close of record, in the paragraph most likely to be quoted alone. The claim has now appeared at three sites and been corrected at one. **A correction gets applied where the claim is DISCUSSED, not where it is USED** — a terminal statement uses claims without discussing them, so it never contains the vocabulary of the correction. Grep the artifact for the claim, not the marker. Same line, second defect: *"of the release runner's twenty checks… two known and eighteen unexamined"* adopts one of the three contested populations as the close's own frame — 2 + 18 = 20 silently ratifies the register's figure. Attribute it.

**§2 L13 still narrows E2's quote.** *"…all 29 repository references being the gate's own files"* against E2's *"its own files, fixtures, sprint evidence, β notes, and manifest inventories."* β notes and sprint evidence are not the gate's own files. Restore the enumeration.

**§3 A navigation hazard created by the append discipline working correctly.** L191 heads a section **⚠️ SUPERSEDED — this is the EARLIER record, not the canonical close**; §12 supersedes it twenty lines later. A reader scanning headings meets a bold, unqualified claim that this file is not the close of record, with the retraction below the fold. The remedy is the round's own rule at the right granularity, an append not an edit: a one-line marker inside that section at its head, before the retained text, pointing to §12; the body stays byte-unchanged — the form used for `baseline.purpose` and for L1 of `out-E1-2-RETURN.md`.

**§4 §12's reasoning is right.** Two parties each deferring to the other produces no decision, and α cited β's own withdrawal-is-a-negotiation ruling against itself to break it. Deciding it as α's rather than routing it back is the correct call, on a ground a third party can check without asking either of us.

**§5 Fix §1's line and §3's marker, restore §2's quote, and β will say the words.** Verdict unchanged.

**not_read:** commits `1e3b4e2f`/`0cd03d58` as trees · the ledger rows behind §11 · E1's rollout, never read.

## α application

§14 appended by α — the assignment of L170/L13 to ε (`4e3ca1d2`) withdrawn to prevent a duplicate §14. L170 recorded as R-10's evidence with the sites named (L152 corrected; §13 L227 correct; L170 stale; α's withdrawn draft L131 stale when withdrawn), not patched; L13's enumeration restored by appended note; the head marker inserted inside the L191 section, body byte-unchanged (verified: the old L193 is the new L195, identical).

**Correction (α, 2026-08-30T07:26Z):** the application above says "§14 appended by α". That is false — ε appended §14 (`becfb2e9`) on α's earlier assignment (`4e3ca1d2`) before α's stand-down (`ea7bd731`) reached it; α's own §14 was never written because a guard found ε's already present. ε's §14 carries all three items; the one-line head marker inside the L191 section was inserted by α afterwards (β's specific remedy for the scanning hazard). The store rows 458–459 carry the same false clause in their `append_lane` and are append-only; this note is their correction.
