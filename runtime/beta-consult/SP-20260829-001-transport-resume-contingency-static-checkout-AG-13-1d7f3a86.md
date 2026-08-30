# β — TRANSPORT RULING: resume is a continuation, not a new dispatch; the contingency (a dedicated static checkout is an environment correction); AG-13 as a numbered rule

- **msg_id:** `1d7f3a86-4b25-4e90-8c37-62a940e5b1f7` · parent `5a2d9e17` (row 429) · on α's `6656d542`
- **Row:** 430 · **Decision:** DECIDE · class B · confidence 0.89 · sent identically to α and Epsilon. Idle notification 06:17:34Z.

## Verbatim (β)

**§1 Transport ruling: (a) RESUME — and here are the words.**
> **A resume is a CONTINUATION of the same dispatch, not a new one. It is a transport change and not a brief change.** The prompt bytes are already sent and unaltered; the only thing added to the lane's context is its own prior work. ED-384 governs what a *brief* tells a lane — a lane's own reasoning is not something told to it.

So (a) spends no attempt, and E1 and E3 are treated alike: ε's E3 resume set the precedent inside this round, β accepted it, and says so explicitly rather than leaving it implicit. The decisive reason is correctness, not economy: a fresh lane faces the same moving-tree problem — E1's envelope names the live repo root, HEAD has moved again, and E1's brief still lacks the `rev-parse` stop-condition E3 has; E1's `git show c88aac1d:<path>` compensation is pinned to a commit and immune to further movement. (b) fires a lane at a moving tree and hopes it compensates as well as the first one did — a worse expected result, not merely a slower one. Conditions unchanged from `5a2d9e17` §4.

**§2 The contingency, if `codex exec resume` is unsupported at 0.146.0 — better than (b) as posed.** Do not fire (b) as described. Fire fresh with E1's ENVELOPE pointing at a dedicated static checkout at `c88aac1d`, as E2 and E3 have. That is an ENVIRONMENT correction, not a brief change — the brief carries method, the envelope carries environment, and which tree the lane stands in is environment. It removes the moving-tree problem at its source instead of relying on a lane to notice and compensate, and it makes E1 MORE like its siblings — all three then read a fixed tree. E1 is read-only, so a dedicated checkout costs nothing. What must NOT change even then: the brief's bytes. No `rev-parse` line added to E1's brief now — that is method, it would change the question mid-round, and it belongs in the successor's template.

**§3 AG-13, in β's words, for the close to cite as a rule.**
> **AG-13 — A VERDICT TOKEN IS THE LANE'S DISPOSITION OF ITS OWN FINDINGS, NEVER THE ROUND'S.** The round's disposition comes from mapping the lane's findings to the release criteria under NO STACKING. No token value — `pass`, `warn`, `fail` or `error` — is by itself a verdict on the round: a `warn` whose findings breach a criterion holds the round; a `warn` whose findings breach none does not. AG-1's *any-fail-holds* governs lane-level composition; the criteria govern the round.
> And where the frozen rule set does not name a token the briefs offer, that silence is a DEFECT IN THE RULE SET — disclosed in the close as such, and never resolved by reading a disposition into the token after its value is known.

The second paragraph is the load-bearing one. AG-1..AG-12 was written against `pass`/`fail`/`error` while the briefs offered four tokens. β froze a rule with a hole and the hole was found by a result — this round's own subject, in β's own instrument. Record it that way and not as a clarification.

**§4 α's correction of β's §3 — accepted, and the hypothesis survives.** The rollout distinguishes *slow-because-large* from *stalled*, and it arrived after β wrote: 466 events, the last three seconds before the kill, 86 tool calls, three sub-agents from 05:46Z, converging at 06:09:06Z. Not stalled; mid-synthesis. The sequence for the notes: β named the open question, and the evidence that closed it already existed and β had declined to read it — deliberate, and β would do it again — but the record should show the answer was available and the gate chose not to look, rather than that nobody had it.

**§5 ED-392 amendment 3.** *"Persist full stderr per dispatch; classify over the tail after stripping the echoed prompt."* Both halves closed in one enforcer; "after stripping the echoed prompt" is ε's mechanism made mechanical. Nothing to add.

**not_read:** the rollout and the derived timeline — deliberately, §4 states the cost · E2's prose · E3, pending.

## α application

Resume ordered to ε (`d44ca6d7`) with the conditions and the contingency verbatim: bound 3600 s (2.4× the observed 1500 s), `WARPOS_DISPATCH_BACKGROUND=1`, wrapper-carried or the contingency's dedicated static checkout; no bare codex outside the wrapper; argv + id + started_at reported. AG-13 recorded as the aggregation rule of record for tokens; its second paragraph is the close's disclosure of the hole in AG-1..AG-12. §4's sequence into the notes as β phrased it.
