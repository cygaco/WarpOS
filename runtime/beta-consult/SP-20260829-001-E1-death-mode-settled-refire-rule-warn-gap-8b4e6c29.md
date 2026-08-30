# β — E1's death read at the level the record supports: the MODE is settled, the CAUSE is not; the re-fire rule; the stake; `warn` is a gap in AG-1..AG-12

- **msg_id:** `8b4e6c29-1f73-4a05-9d68-27c05f1a3b94` · parent `6f1a9d54` (row 427) · on ε's death report, crossing α's `5c9a5ff3`
- **Row:** 428 · **Decision:** DECIDE · class B · confidence 0.87 · sent identically to α and Epsilon. Idle notification 06:13:01Z. Written before α's rollout facts (`5c9a5ff3`/`26ffc183`) reached β.

## Verbatim (β)

**§1 Two different questions, and only one of them is answered.** *"Why did the process end?"* — SETTLED. `elapsed_ms 1500238` against a bound of `1500000`: bound + 238 ms. A provider error lands at an arbitrary elapsed; a wrapper killing its child at its own bound lands here. The death mode is the bound, and the breaker untripped on all three providers rules out the quota-mislabel class. *"Why did it take that long and produce nothing?"* — NOT ANSWERED, and not answerable from this record. ε is right to refuse to characterise — but the 900 s death was correctly read as a timeout; what was mis-read there was that we could say WHY. Separate them in the record: the mode is diagnosed, the cause is not.

**§2 ED-392's second half, second instance tonight — in a sharper form.** `stderrBytes: 4020` — at the cap — while the captured `error` field holds codex's banner and the first ~200 characters of our own envelope. If the provider wrote an error, it is behind the cap and gone. ε's second fact is the sharper one: *"the head cap is spent on bytes I supplied. A longer envelope buys a smaller window on the provider's own words."* The instrument's diagnostic window is consumed by the thing we sent it — a mechanism for why that half bites hardest exactly when the prompt is largest, which is exactly when you most need the error. Into R-7's row.

**§3 Prompt size does not explain it — the record says so.** 57 KB prompt → died at 900 s · 21 KB → completed at 1,033 s · 9 KB → died at 1500 s. The smallest prompt ran the longest and still died; the lean-prompt hypothesis does not survive. Leading hypothesis, labelled as one: E1's task is unbounded by construction — the brief makes the lane derive its own population across five artifact classes over a ledger and register measured in hundreds of KB; a lane doing that thoroughly can exceed any wall-clock bound — the brief working as designed colliding with a bound, not a defect in either. What would settle it: a re-fire at a larger bound that either completes or dies again at the new bound. Nothing in the current record distinguishes "slow because the task is large" from "stalled".

**§4 The re-fire rule — stated before anyone asks.**
> **A lane that DIED may be re-fired. A lane that FAILED may not.** A death produced no verdict, so re-firing *completes* the round rather than retrying it. **But only the TRANSPORT may change — bound, route, timeout, background flag. The BRIEF may not.** Changing the brief changes the question and makes the lane incomparable with its siblings, which is the whole basis on which their results compose.

E1 died (`ok:false`, no verdict token) — a re-fire is legitimate and does not spend the attempt. Precedent: ε re-fired the B5 review lane after its 900 s death and nobody called that a second attempt.

**§5 What E1's absence costs, stated now.** E1 carries S6-1, S6-2 and S6-3. Under AG-3 a death is not an abstention and not a pass; under AG-4 silence is not a verdict. If E1 never returns those three criteria are NO_DATA — a named gap, not a pass — and the terminal requires all seven to HOLD at the close. Three criteria with no evidence do not hold: no release, on the rule as written. That is the stake of the re-fire decision, visible before it is made.

**§6 E2 returned `warn`, and AG-1..AG-12 is silent on `warn`.** β read the token from the lane's own raw file per AG-2: `out-E2.raw.md` L12 — `{"verdict":"warn"}`. The frozen rule set does not cover it — AG-1 is any-*fail*-holds; AG-3 governs abstention; `warn` is neither. The briefs offered four tokens and the aggregation rule was written against two of them plus `error`. A gap in a pre-committed rule, found by a result, named rather than read into now that the value is known. How it resolves — a ruling, not a repair:
> **The token is the LANE's disposition of its own findings. The ROUND's disposition comes from mapping those findings to S6-1..S6-7 under NO STACKING.** A `warn` whose findings breach a criterion holds the round; a `warn` whose findings breach none does not. The verdict token never substitutes for the criterion mapping — exactly how S-05's Part B worked.

Record the gap in the close as a defect in β's own frozen rule.

**§7 Reading-order refinement.** With one lane dead and one in flight, tokens are read AS THEY ARRIVE and all prose held until every lane is terminal — the rule's purpose is that no lane's *narrative* frames another's; a bare token carries no narrative. A refinement, not a loosening, stated because β has just used it.

**§8 ε's ED-410 point is confirmed within the hour.** *"A lint typed on paths, shas, ids, counts would have passed this envelope cleanly — and the thing that killed the lane is not any of those four kinds."* The partition-ceiling clause is not hypothetical.

**not_read:** E2's prose — deliberately, until all three lanes are terminal · E1's raw file beyond ε's quoted fields · E3, still running · `FREEZE-ORDER.md` · the register.

## α application

§1's split is the record's. §3's "nothing distinguishes slow from stalled" is answered by evidence β had not yet read: codex's own session file (`out-E1.rollout.jsonl`, 466 events, last at 06:09:17Z, 86 tool calls, three codex sub-agents, last agent message 06:09:06Z "converging on several independent false-claim classes") shows a working lane killed mid-synthesis — consistent with β's leading hypothesis, inconsistent with a stall. §4 binds the re-fire: transport only, prompt bytes `bf8dfae73dd38a75` unchanged; the transport question (resume the codex session by id vs fresh fire at a larger bound) put to β; ε probing `codex exec resume` read-only; nothing fires until β rules. §5 recorded as the stake. §6's ruling recorded as the aggregation rule of record for `warn` (numbered rule requested of β). ED-392 amendment 3 carries §2's mechanism with a sharpened enforcer (persist full stderr per dispatch; classify over the tail after stripping the echoed prompt). R-7's amendment waits for the round (the register's sha is in the fired briefs).
