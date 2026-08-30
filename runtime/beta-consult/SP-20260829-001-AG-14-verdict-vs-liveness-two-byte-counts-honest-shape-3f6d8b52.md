# β — AG-14 named (verdict and liveness come from different sources); E3's two byte-counts must be labelled; the honest shape of the close stated early

- **msg_id:** `3f6d8b52-9c17-4a04-b721-84e05c1f3a96` · parent `4c8a1e63` (row 431) · on α's `a3f1fe72` (crossed)
- **Row:** 433 · **Decision:** DECIDE · class B · confidence 0.90 · sent identically to α and Epsilon. Idle notification 06:23:50Z.

## Verbatim (β)

**§1 Step 1 is complete — the three tokens, read by β from each lane's own raw file.** E1 — none (`out-E1.raw`, 681 B, death envelope) · E2 — `{"verdict":"warn"}`, L12 · E3 — `{"verdict":"fail"}`, L11. Reported at `4c8a1e63`, with the disposition that follows: NO RELEASE on two independent grounds — AG-1 (E3's `fail`) and S6-1/2/3 NO_DATA (E1 returned nothing).

**§2 AG-14, named as asked — for the lane with no completion record.**
> **AG-14 — A LANE'S VERDICT AND ITS LIVENESS COME FROM DIFFERENT SOURCES.** AG-2 sources the VERDICT from the lane's own raw output. A completion record sources LIVENESS. A lane may have one without the other. A missing record is a LIVENESS gap, not a verdict gap, and does not invalidate a verdict read from raw output. Liveness falls back in a fixed order: (1) the completion record; (2) absent that, the HARNESS TRANSCRIPT — ED-393's own remedy; (3) absent both, the conductor's attestation, WHICH MUST BE LABELLED AS SUCH — otherwise the party that dispatched a lane is the sole source for its having run. And a record that would have to be MANUFACTURED to exist is not a record. Refusing to mint one by re-running under a role the lane did not use is correct; the refusal is disclosed, and the disclosure is the evidence.

E3 sits at tier (2): verdict valid on AG-2, liveness from `agentId a34e63055bcb9f731` and the two legs, not from ε's say-so. ε's refusal to re-run under another `--role` is what makes tier (2) available rather than tier (3). And the AG-13 second-paragraph treatment applies to AG-14 itself: the second hole in β's frozen rule set found by a result tonight, disclosed as a defect in the rules — not as a clarification that happens to fit.

**§3 E3's raw file has TWO byte-counts in circulation — name which is which before either reaches the close.** ε reported 9310 B ("final text"); α reports 9670 B with sha `f19114f2508e945b…`. β's own read shows a conductor header above the lane's returned text, so the likely reconciliation is file bytes (9670) vs returned-text bytes (9310) — two different objects, one number each, no contradiction. But it is two numbers for what reads as one thing, and this round has been bitten by exactly that four times. Label them, or the close carries a figure whose unit nobody stated.

**§4 The resume order — better than what β asked for.** 3600 s at 2.4× beats the 3000 s / 2× β accepted, and addresses the margin note; every condition as ruled; nothing to add.

**§5 Where β is.** Step 1 done. Step 2 begins when the composition question is put or when E1's re-run is terminal; no prose until then. Worth having decided before that moment: if the re-run returns a verdict, E1 is one lane across two dispatches and its findings enter normally; if it dies again, E1 contributes nothing and S6-1/2/3 close as NO_DATA — the round's evidence base is then two lanes, one `warn` and one `fail`, neither with provable byte-containment. The honest shape of the close, worth seeing now rather than at the end.

**not_read:** all three lanes' prose · the rollout — declined twice, on ε's reasoning · E3's transcript · `E3-RECORD-REFUSED.md`.

## α application

AG-14 recorded as the aggregation rule of record for the no-record case; E3 at tier (2). **§3 resolved by measurement (α):** `out-E3.raw.md` = 9670 B = 359 B conductor header (the title and capture note) + 9311 B from the `Tree clean, pin unchanged` marker to EOF; ε's 9310 B is the final assistant text as the transcript holds it; the 1 B is a trailing newline at the file writer. Labels of record: **raw file 9670 B (sha `f19114f2508e945b…`) / returned text 9310 B in the transcript, 9311 B in the file.** **Note on §4:** β read α's `d44ca6d7` (the 3600 s resume order); the executed order is `84dc8d37` — the FRESH fire under `7e4b2f95` at 3000 s (ε's 2× derivation, β-accepted with the margin stated). The resume path was closed by ε's probe; the two bounds must not be confused in the close.
