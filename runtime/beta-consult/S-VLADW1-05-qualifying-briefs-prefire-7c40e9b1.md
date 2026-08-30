# β — pre-fire check of the three qualifying briefs (Q1/Q2/Q3) — row 346, msg_id `7c40e9b1-25da-4f38-8e06-b1a37f052d94`

- **Decision:** DECIDE · class B · 0.92. β read all three briefs (not ε's summary). Sent identically to team-lead and Epsilon. **Blocking item §1.** α applied it (msg 7282742b): Q3 gets its own checkout at the pinned sha; independent tree check after Q3; Q1's two edits; sequence — no qualifying lane fires before the fix builder and task 5 land and β clears the amended briefs.

## 1. ⚠️ BLOCKING — Q3 mutates the worktree Q1 and Q2 read
All three briefs name the same tree (the vlad engine-lane worktree). Q3 L26–28 grants "you may mutate files in your working tree… must NOT commit… must restore the tree before you finish." Run concurrently, Q3's mutations are visible to Q1 and Q2 mid-read — a Q1 "this claim is false" could be Q3 having neutered the mechanism thirty seconds earlier, un-diagnosable after the fact. "Restore before you finish" does not cover it: the mutations exist throughout, and **a lane that dies mid-run restores nothing** (a lane died at the 900 s ceiling today). Pick before firing: **(a) Q3 gets its own checkout at the same pinned sha** (cleanest); or (b) strict serialisation (Q1/Q2 returned before Q3 starts). Either way verify the tree is clean at the pin after Q3 and before any output is graded — Q3's `tree_state_on_exit` is a self-report.

## 2. Q1 — one STRIKE (ε flagged it correctly)
Strike "Check that the thing a sentence says is checked is actually reached — a function that exists is not a function that is called": the failure mode it names is the one this round already fixes (bundle O's retraction); a grader steered there spends budget confirming a handled defect. Replacement, method not hypothesis: *"For each sentence, first state what would have to be true of the code for it to be true. Then verify that thing directly."*

## 3. ⚠️ Q1 — the one ε did not flag: the brief's own subject matter
L54–56 presents a CLOSED disjunction ("a claim can be false because A, because B, because C, or because D") as the space of ways a claim can be false — in a brief whose job is grading closure claims; the four map onto F1, F2 and the bundle-O sentence: the defect list generalised into a taxonomy presented as exhaustive. Fix: "…among other ways. These are examples, not the classes — a kind not listed here is exactly what this lane exists to find." (Q2's two-route split stays — a genuine dichotomy, both count.)

## 4. Q2 — CLEAN, ship
Artifact and question only; mechanism located by directory not file; `derivation_rule` required for any attack set; "a finding without a reproduction is a hypothesis"; the `git log` prohibition carrying the 11-second lane's lesson. One cosmetic incoherence (confirm the tree "by content" against a mechanism the brief never described) — drop or anchor; not blocking.

## 5. ε's scoping assumption is correct
The frame rule binds graders, not the fix builder. Refinement: the fix brief's pointer density is safe BECAUSE Task 1 forces an independent inventory before Task 2 — the inventory is the anti-pointer mechanism inside the pointed brief; drop it and "fix these N sites" fixes N and misses the N+1th. Keep Task 1 blocking.

## 6. B3's commit message — amend before merge
"all 8 registry site_ids" vs 11 defect rows across 7 files: sixth count-form instance; a commit message is hard to correct once merged; landing it as written ships a false sentence lane B authored, firing S6-1 at that sprint's close. B3 is fenced — amend now.

## 7. Affirmed
Task 5 as a separate dispatch AFTER the fix tasks — corrected sentences drafted after the attack that would falsify them — is ED-364 applied correctly.

PRECEDENT: row 344 §3 · rows 317/318 · AP-18 · AP-19 · P-115 · ED-363 · ED-364 · ED-366 · S6-1.

## Not read (β)
`FIX-BRIEF-round-1.md` (ε's summary) · the builder's in-flight output; B3's worktree; the registry rows behind 11-vs-8 · whether the three lanes are actually configured to share one worktree (§1 infers from the briefs naming the same path; if Q3's dispatch already isolates it, §1 is moot).
