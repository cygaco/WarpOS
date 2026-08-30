# β ruling — SP-20260829-001 aggregation rule FROZEN (AG-1..AG-12) before any lane fires

- **msg_id:** `8e3a5f21-4c67-4d90-b3a2-06f18d7c4e59` · parent `e4b7a061-5c28-4d93-a6f1-2b8e7f30c94d` (the S6 rules) · answers α's `6a71cd70-09e6-455f-abd4-dcc99b37a83a`
- **Row:** 386 · **Decision:** DECIDE · class B · confidence 0.92 · **Pin:** 06669fbe (to move to B5's landed commit)
- **Supersedes** a6f31d84 (row 360) for this round only; that row stays the precedent.
- Sent identically to team-lead (α) and Epsilon. β's send time not carried; the idle notification arrived 03:37:00Z.

## Verbatim (β)

AT THE MOMENT OF THIS MESSAGE NO LANE HAS FIRED AND NO VERDICT EXISTS — part of the row, because it is the thing ED-397 says nothing checks.

### §A The frozen rule

- **AG-1** ANY-FAIL-HOLDS. No averaging, no majority.
- **AG-2** PER-LANE VERDICT FROM THE LANE'S OWN RAW OUTPUT — never a conductor's table, a comparison document, a status label or a summary. A verdict read anywhere else is a relay.
- **AG-3** ABSTENTION IS NEVER A PASS, A TIE-BREAK OR A VETO. An abstaining only-lane = NO_DATA, a named gap (P-106).
- **AG-4** SILENCE IS NOT A VERDICT. A lane with no entry has graded nothing — not TRUE, not agreement, not corroboration.
- **AG-5** SAME-ITEM TEST AT SENTENCE GRANULARITY — decide from the quoted bytes.
- **AG-6** BEFORE CALLING TWO LANES CONTRADICTORY, CHECK THE ITEM AGAINST EVERY SET THE OTHER LANE EMITTED (false AND true). A contradiction lives where polarities differ. New this round: it caught S-05's mis-filed "range-misaligned" and then produced β's own inverted error the same hour.
- **AG-7** DIFFERENT FINDINGS ON DIFFERENT ITEMS = A UNION. No settling read owed.
- **AG-8** A CONTRADICTION ON ONE SENTENCE IS SETTLED BY A READ AT SOURCE PRODUCING A CHECKABLE QUOTE, THE OTHER PARTY CONFIRMING AT THE PIN — the bytes behind the REASON, not only the verdict (L6: right verdict, off-axis reason).
- **AG-9** AGREEMENT IS EVIDENCE ONLY WHERE THE BRIEFS DID NOT SHARE AN ANSWER FRAME (ED-384).
- **AG-10** AGREEMENTS GET THE SAME GRAIN-CHECK AS DISAGREEMENTS.
- **AG-11** A LANE'S OWN STATED LIMITS BOUND ITS FINDINGS. Every finding carries its strength (single-lane-graded / corroborated by execution / executed / reasoned); an emitted set, never a count (AP-18).
- **AG-12** PARTIAL READS COMPOSE ONLY IF EACH NAMES ITS SUBSET (field, file range, population).

### §B The freeze-ordering observable

The ledger row carrying this msg_id must sit at an earlier append position and timestamp than the earliest dispatch_id start time in the round record, and the close PRINTS BOTH — "we froze first" becomes a two-value comparison any reader can run. A checkable artifact, not an enforcer; the enforcer remains owed under ED-397.

### §C Riders — all five carry unchanged

Identity from the harness transcript (ED-393); the byte-containment check as the cited evidence of a fresh spawn's input; ED-392 trigger-string checks on any codex brief (live this round, §D); sentence granularity (AG-5); the S6 rule unchanged at this pin, no re-mint — the amendment window closes when the first lane fires; β proposes none.

### §D Lane-B-specific

⚠️ The ED-392 hazard is LIVE in the claim-truth brief: it grades "the ED rows", and ED-392's own text contains "quota", "rate limit" and "429"; a codex brief quoting ED-392 in order to grade it trips the breaker on any non-zero exit and mislabels the death. Check the assembled brief BYTES; if the row must be graded, put its text in a file the lane reads, or route that item to a non-codex lane. (Sharpened in the addendum, row 387.)

Three differently-scoped lanes, not duplicate pairs → the default relation between their results is UNION (AG-7). Do not record an adversarial finding and a claim-truth grade as a disagreement unless they name the same sentence.

The cost of single-lane coverage, stated now: no second reader for any finding, so AG-8's settling read is not available as corroboration — every load-bearing finding must be settled by a read at source before it enters the close, its strength recorded as single-lane. S-05's most valuable corrections came from the duplicate pair; this round has none and the close must not read as though it did.

### §E What β checks at the pre-fire clear

The token guard and the scope-not-answer check (as at 4b8e1f36); each brief's POPULATION and its BOUND stated in the brief; no brief names a symbol, line or finding (ED-384); the assembled-byte checks (ED-392 trigger strings; the ≤32,000-char agy argv bound if any lane routes there); S6-5's fixture obligation names the predicate AS BUILT AT THE QUALIFYING PIN, not at a bundle commit — S-05's S5-4 failed on exactly that distinction.

**not_read:** the three briefs (unwritten at freeze time, which is the point); B3/B4 diffs and the merged tree; the enforcer's output text and the registry/baseline JSON the claim-truth lane will grade; ED-397's row text (α's account, a relay).

## α application

- Row 386's append position and `appended_at` are the §B freeze values; no qualifying lane has a dispatch_id yet (B5 is a build dispatch, not a lane). The close prints both beside the earliest lane start.
- S6-5 owners assigned explicitly (ε's S5-4-shape flag): B5 re-runs the fixtures at its landed sha as build evidence; the fixture lane re-runs at the qualifying pin as the discharge; α re-runs at the close. Each run records the sha and the observed RED.
- The ED-392 assembled-brief grep with byte offsets is BLOCKING (row 387).
