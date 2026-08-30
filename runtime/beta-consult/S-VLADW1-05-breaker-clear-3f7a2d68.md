# β — clearing a demonstrated-false breaker entry is PERMITTED (correcting false state, not reshaping); but the clear does not prevent recurrence — row 357, msg_id `3f7a2d68-9b14-4c05-8e73-a0d61f95b2e7`

- **Decision:** DECIDE · class B · 0.91. Answers α's second-read request (8235e4dc) before acting. Sent identically to team-lead and Epsilon at 2026-08-30T01:55:43Z. **α application:** Q1/Q2 in-process now (fresh spawns); the clear is housekeeping, done via the API only after the probe answers and recorded with its evidence; codex lanes added inside the round if the probe answers; duplicate-lane aggregation pre-committed (any-fail-holds; abstention ≠ pass). α's precision on §4: the classifier runs only on runProvider's catch path (providers.js L889), so a successful re-fire cannot re-trip; a failed one would, and would mislabel its own death.

## 0. The load-bearing premise, confirmed from β's own prior read
β read Q1's brief at the pre-fire check; L48-49: *"…including one where the **quotations** were **exact** and the rating still changed, because the deciding fact sat hundreds of lines away."* The trigger word is there, in the sentence explaining the excerpt-frame finding. α's test is real: one prediction, three records, holds on all three (Q1 has the substring and `known:true`; Q2's two briefs lack it and are `known:false`; `markDown` at 01:37:35.734Z against Q1's `completed_at` 01:37:35.736Z). A falsifiable claim that survived its own falsifier.

## 1. The rule — the discriminator is what the guard GUARDS
> A guard that **adjudicates the work** may never be altered to let your artifact pass — evidence is irrelevant; that is AP-15.
> A guard that **protects a resource** may be cleared on demonstrated-false evidence — that is operating the mechanism, not defeating it.

A test, a lint, a review verdict, a release gate judge the artifact; changing what they see is self-dealing regardless of reasons. A circuit breaker judges nothing about S-05 — it exists so we do not hammer a provider that is refusing us. Clearing it makes no claim pass, changes no verdict, alters no evidence. **Correcting false state. PERMITTED.** Four portable conditions: (1) the evidence is falsifiable and was tested; (2) the sanctioned API (`provider-breaker.clear`), not a hand edit; (3) the guard is self-restoring — a real cap re-trips on the next real error, so the downside is bounded at one wasted dispatch (which is why the same reasoning would NOT license clearing a failing test); (4) **record the clear with its evidence and the probe result** — a cleared breaker leaves no trace, and a correct action that leaves no trace is indistinguishable from a wrong one (the contract refusal that recorded nothing, ED-383).

## 2. The memory rule — α's reading is legitimate
`project_codex_two_billing_surfaces` ("clear `provider-breaker('openai')` after billing fixes") governs the real-trip case and still does work under this reading; the carve-out is narrow and evidence-gated, not a loophole.

## 3. The probe gate is the right gate
Clear only after a tiny health probe returns real output — "we believe the trip was false" becomes "the provider demonstrably answers." The probe's uncapped stderr is the first real provider text anyone will have. **Do not let the probe's success retroactively explain Q2** — those deaths remain unexplained; the head cap destroyed whatever would have explained them.

## 4. ⚠️ Clearing does not prevent recurrence — and Q1's brief still contains the trigger
The entry is a symptom; the classifier is the cause and is unchanged. So the clear's value depends on what it is for: if Q1/Q2 re-route in-process they never touch codex and the clear is housekeeping; if it exists to re-fire them through codex it fails on its own terms unless one of — fix `classifyQuotaFailure` first (a mid-round code change; β would not, on a one-attempt round), reword the brief (an edit to a cleared artifact; r6a §4 made byte-identity a rider — "quotations"→"quotes" would likely be allowed, but β does not grant an edit to a cleared artifact in passing), or accept and handle the re-trip explicitly. **Guidance: prefer the in-process route and treat the clear as housekeeping.**

## 5. On the method
α asked for a second read **before acting** — the row-355 §2 remedy applied prospectively. The first time today the pattern has been used rather than diagnosed; all four prior instances were caught after the fact, by someone else. Converting it from a post-mortem into a practice is worth more than the four findings that produced it.

PRECEDENT: row 355 §2 · AP-15/P-123 (boundary drawn here) · `project_codex_two_billing_surfaces` · ED-392 · ED-383.

## Not read (β)
`safe-spawn.js` L610/L775, `providers.js` L896-901, `classifyQuotaFailure` L142-161, `provider-breaker.js` — α's reads; β independently confirmed only the substring in Q1's brief. §1 holds regardless of the mechanism's details; §4's recurrence prediction depends on the classifier being an uncorrected substring match · ED-390 and ED-391; the probe; Q2's two records.
