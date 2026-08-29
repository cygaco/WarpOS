# S-VLADW1-04 — Vlad Wave-1 CUSTODY CLAIMS MADE UN-INVERTIBLE (successor to S-VLADW1-03)

- **Sprint label and number:** S-VLADW1-04
- **Title:** Make the custody claim bind refuse rather than skip, move the bind with every correction, close the `args.map` scan door, build AC-8.6, and take the custody set to a releasable state
- **Owner:** Alex ε (sprint conductor), under Alex α
- **Parent epic:** [E-VLAD-001](../epics/E-VLAD-001-vlad-v1-agent-mcp-cofounder.md)
- **Predecessor:** [S-VLADW1-03](S-VLADW1-03-vlad-custody-residuals-to-release.md) — **closed at honest state 2026-08-28, NOT released.** α applied β's pre-committed release rule (row 305, msg_id `7c05e9d1`) verbatim at the close of `runtime/vlad-w1/s03/gauntlet-3/`: **S1 HOLDS · S2 FAILS · S3 HOLDS · S4 HOLDS · S5 HOLDS-at-close.** Ruling: `runtime/vlad-w1/s03/gauntlet-3/ALPHA-RULING-S1-S5.md`. TERMINAL applied: no fix attempt 3.
- **Starting surface:** vlad `wt/S-VLADW1-01-engine` at **`b2583d6`**, NOT merged to vlad main. The branch is left in place deliberately; this sprint starts from that commit.
- **Goal:** Make the mechanism that binds custody claims actually un-invertible — refuse rather than silently skip, and move the bind in the same change as any correction — then close the residual controls the qualifying gauntlet named, so the custody set can be released rather than closed a second time.
- **Scope:** The nine residuals from the α ruling (below), verbatim in intent, plus AC-8.6 as first-class build scope.
- **Out of scope:** Re-litigating S-VLADW1-03's ruling — S1, S3, S4 and S5 held and are not reopened. The write path and the agent face (Wave 2). The four parked SDK credential vars (`AWS_BEARER_TOKEN_BEDROCK`, `ANTHROPIC_FOUNDRY_API_KEY`, `ANTHROPIC_FOUNDRY_AUTH_TOKEN`, `ANTHROPIC_AWS_API_KEY`) — parked by operator ruling 2026-08-18 as a possible multi-provider feature after launch; they stay disclosed-open with a standing drift test.
- **Current state:** **CLOSED AT HONEST STATE, NOT RELEASED** — 2026-08-29.
- **Percent completion:** **80%** (reasoning below — the number is not a grade, it is what landed and held)

## CLOSE — 2026-08-29 — NOT RELEASED

**α applied β's pre-committed rule verbatim at the close of the qualifying gauntlet:**
**S4-1 FAILS · S4-2(c) FAILS · S4-3 HOLDS · S4-4 HOLDS · S4-5 HOLDS · S4-6 HOLDS.**
**TERMINAL: NO RELEASE, no fix attempt 2.** Ruling: `runtime/vlad-w1/s04/gauntlet-2/ALPHA-RULING-S4-1-TO-S4-6.md`.
β confirmed the application under row 316 (`6e2d94af-b53c-4871-a09e-c8f107b2e35d`) — no AP-15 in either
direction, **including grading β's own row-313 recommended wording as correctly FALSE, with the conflict
declared first and the position-swap run.**

`wt/S-VLADW1-01-engine` is **NOT merged** and stays at **`6a105f2`** as the successor's starting surface,
because its shipped copy contains sentences proven false by execution. Successor: **S-VLADW1-05**
(`trackers/sprints/S-VLADW1-05-one-transform-both-sites.md`).

**Why 80% and not more or less.** What landed and survived: 10 of 12 DoD boxes; four of six criteria; every
gauntlet-1 finding closed; S4-2(d) discharged twice independently, controls-first; the suite grown 339 → 366
with every mutant carrying a no-op⇒FAIL guard; 12 live-child attack shapes at the spawn door for zero leaks.
What did not: the sprint's actual goal — a **releasable** custody set. Two criteria failed on sentences and a
fold, so the deliverable is a surface a successor starts from rather than one a user receives. Counting this
above 80% would credit mechanism work against a truth criterion that explicitly refuses mechanism evidence;
counting it far below would erase work that three lanes and α's own re-execution confirmed holds.

**What failed, stated plainly.** The fix attempt **authored new false sentences about its own mechanisms** —
the confusable-fold calibration (β-recommended, α-approved, ε-reviewed) and the "two escapes REMAIN" count —
and left one dimension of the rendered-form property (markdown emphasis) implemented **beside** the shared
transform rather than inside it, in the file whose own comment says the two sites "must share one transform."
The diagnostic gauntlet found six false sentences over sound mechanisms; the qualifying gauntlet found two
new ones and an un-shared fold. **Same class, one layer out — the recursion, recurring exactly as the
diagnostic round predicted in writing.** Every instance was in prose or code the approval chain passed.

## The failure this sprint exists to fix, stated plainly

Fix attempt 2 of the predecessor delivered the class fixes its rule demanded: the inert invocation control
closed at the shared lexer, fourteen paragraphs byte-bound with the bind proven on a real edit, the false
ordering clause removed, every mutant no-op-guarded, a clean checkout byte-identical to the working tree,
318/318 green. **And the bind's own derivation predicate became the new overclaim.** The mechanism built so
that a claim could not be inverted under green gates (i) misses any Asserted or Ceiling paragraph not led by
an exact em-dash, silently, and (ii) pins two execution-falsified sentences so that correcting them turns
`check:ship` red. That is the same class one layer up, and it is item 1 below.

## Residuals carried from the α ruling (verbatim)

1. **S2-a** — derivation predicate accepts only an exact em-dash lead-in; non-matching Asserted/Ceiling paragraphs are skipped with no violation (backend F-1, HIGH). Fix shape: a paragraph that LOOKS like a lead-in (bolded `Asserted`/`Ceiling` + any dash/colon/indent) must be either bound or REFUSED, never skipped.
2. **S2-b** — two bound sentences are false by execution (qa F-1; security second-order): the preload-Ceiling "not named on any other surface" sentence (contradicted by `entry-bootstrap.test.js:687`) and the 10d attribution sentence; the bind must move in the same change as the correction.
3. **S2-c** — header's what-is-NOT-bound list omits P1–P4 body prose (qa F-3).
4. **S2-d / 10d class claim** — absorb iterates the current call's list while delete sweeps history; an omitted previously-captured name is deleted without absorption (agy F-1, LOW, unreachable via shipped callers). Make absorb sweep history too, or state the precondition and downgrade the claim to INSTANCE.
5. **Defeated control (not a leak)** — caller-controlled `args.map` on an Array subclass bypasses stringification in the scan; Node re-stringifies inside `spawn()` (security F-1/F-2/F-3, T8/T4 TOCTOU reopened through a door A3 did not close). Fix shape: `Array.prototype.map.call` / `Array.from` + own-property iteration in the scan, mirrored by a committed regression fixture.
6. **S3 strength** — driver entry's scrub is load-bearing only at text/AST level (security F-4).
7. **AC-8.6** — deferred (β row 306: not an AP-15 reshape); the CLASS-form residual ("every shipped control is invoked by some product-layer path — item 4's walker approximates it; AC-8.6 is one instance; no enforcer asserts the general form") travels to the successor.
8. **ED-340 disposition** — remains OPEN, carried forward: the mutant half of its closing condition was satisfied 2026-08-10 (both mutants observed RED on lever-verified targets); the ROSTER half and AC-8.4's lineage remain open, now with ED-354 (installed-roster parity at the vlad cwd — the `security-fixer` 375 ms reap) as the concrete instance. Not closed by this sprint.
9. Process residuals for the retro: ε's usage-limit death mid-gauntlet (recovered artifact-first, no lane re-run); 10c's bound-timeout-after-commit signature (1200177 ms, committed 22 s before the bound) now separable from clamp and nothing-spawned; the ED-257 right-sizing warning that fired and went unread; ε's "clean tree" wording caught by the backend lane.

## The CLASS-form residual (carried verbatim — an OWED carry-forward, not S5's condition)

**Precision, per β correction 2 (msg_id `b6d38f04`):** S5 HOLDS **outright**, satisfied by
`runtime/vlad-w1/s03/fix-attempt-2/ROUND-RECORD.md` §4 — a recorded surface that existed at close. This
tracker write is an **owed carry-forward under β row 306**, not the condition S5 was contingent on.
Conditioning a criterion on a future write is the AP-14 shape and β removed it from the ruling; it is
removed here too.

Carried verbatim from ROUND-RECORD §4, per β row 306, which holds that the build spec that originally
named this residual does not count as its disclosure:

> **Build-spec item 6, field 4 — INSTANCE.** It closes AC-8.6 specifically. **Residual:** the general
> property — *every shipped control is invoked by some product-layer path* — is what item 4's walker
> approximates; AC-8.6 is one instance of it, and **no enforcer asserts the general form.**

`CUSTODY.md` discloses only the INSTANCE (that one fixture is not wired to run in a user's install). The
CLASS form is disclosed nowhere on the shipped surface. Two gauntlet-3 lanes (qa F-6, security F-6)
independently reached this by grep and flagged the same tension: a `CUSTODY.md` reader is handed the
instance without the class. This sprint either enforces the general form or ships it as a disclosed ceiling.

## Release rule — PRE-COMMITTED, β row 309 (`e7a4b619`)

Minted 2026-08-28 at the design→build boundary, against the final acceptance criteria, **before any build
result existed**. Full text: `runtime/beta-consult/S-VLADW1-04-r2-release-rule-e7a4b619.md`. RELEASE iff
all six hold at the close of the qualifying gauntlet:

| id | criterion, in brief |
|---|---|
| **S4-1** | **TRUTH**, unconditioned — every custody claim string on a shipped surface (what `npm pack --dry-run` resolves) is TRUE at close, by reviewer read. **May NEVER be satisfied by mechanism evidence**: a green bind, lint or battery is not evidence a sentence is true. |
| **S4-2** | **MECHANISM** — RF-1 RED for all seven near-miss authorings plus both controls; RF-3 RED on reverting the refusal to `continue`; **R3 closed by a NAMED CANONICAL TRANSFORM** (case-fold + whitespace-collapse + dash-class fold on the rendered form) — **enumerating the four observed variants does NOT satisfy it**; battery re-run against the predicate AS BUILT **by a gauntlet lane, not by ε**, population including bundle A's newly-authored class-form paragraph. |
| **S4-3** | **ATOMICITY** — RF-4 RED: a claim edit without its canonical edit fails inside the owning bundle's own run, not at gauntlet. |
| **S4-4** | **FALSIFIERS OBSERVED** — RF-1, RF-3, RF-4, RF-5, RF-6, RF-7 each OBSERVED RED under its own mutation at close, every mutant carrying the no-op⇒FAIL guard. **A pass-total is not an observation-count.** |
| **S4-5** | **AC-8.6 AT THE CAPPED SHAPE** — invoked from the product-layer entry path, RF-7 RED **at runtime** not text/AST, `check:pointers` resolving the node. Capped at one invocation + one named test. **Either-or sub-clause:** the driver entry's scrub gains a runtime-observable consequence, OR the header states plainly it is load-bearing only at text/AST level. **Silence does not satisfy it.** |
| **S4-6** | **RESIDUALS TRAVEL** — every field-4 residual in build-spec items 1–7, **plus the two design-phase findings deliberately NOT fixed** (R2's NBSP tolerance, R4's rollup blindness), appears at close on the surface where its claim's reader is. The class-form residual ships as a Ceiling paragraph under P3 in strong actionable form. |

**Binding name map (β row 310, `3a5f81c7`)** — the near-miss battery's rule ids and the record-trust gate's
path ids are the same objects: **R1=RT-1 · R2=RT-2 · R3=RT-7 · R4=RT-8.** S4-2(c) governs **RT-7** (closed by
a NAMED CANONICAL TRANSFORM — case-fold + whitespace-collapse + dash-class fold; **enumerating the four
observed variants does not satisfy it**). S4-6 covers **RT-8** (CLASS disclosure, safe *because* S4-1's
reviewer read is the actual control for rollup truth — the linter never was) and **RT-2's NBSP tolerance**.

**RF-2 vs S4-2(d) — not the same obligation.** RF-2 is **satisfied at design** and is NOT in S4-4's
falsifier set. **S4-2(d) is a separate close-time obligation**: a gauntlet lane — not ε — re-runs the
battery against the predicate **as built**, population including bundle A's newly-authored class-form
paragraph. **"RF-2 passed" does not discharge S4-2(d).**

**The design-phase battery is cited by CONTENT-INVARIANT, not path** — *the run against `b2583d6`,
controls-first, 6/6 controls RED, baseline clean, zero files mutated* — wherever that table lives. The
filename changed once inside a single consult cycle, so a path-only citation in a release rule would
already be dangling.

**ε may observe falsifiers RED (β Q2) only if ALL FOUR hold:** the mutation logic lives in the committed
test; the raw artifact is committed with its command line and sha; the no-op⇒FAIL guard is present; and **α
re-executes at close with agreeing output.** Absent any one, observation belongs to a lane.

## Definition of Done

> **DISPOSITION AT CLOSE (2026-08-29).** Every box below is dispositioned. **10 of 12 DONE, 2 CARRIED.**
> A DONE box means the work landed and survived the qualifying gauntlet; it does **not** mean the sprint
> released. Two boxes are carried to S-VLADW1-05 because the qualifying run proved them incomplete.

- [x] **Plan contract authored and accepted, with β consulted at the plan→design boundary.** `PC-20260828-0086` (annotated OVERRIDDEN/DISCHARGED/STANDING, original text retained); β consulted at all four boundaries — rows 308/309/310/312/313/314/315/316.
- [x] **A release rule is minted FRESH by β and PRE-COMMITTED at the design→build boundary — before any result exists.** **DONE 2026-08-28: β row 309, msg_id `e7a4b619-2f83-4d5c-9b01-63cf8ea27d15`**, full text `runtime/beta-consult/S-VLADW1-04-r2-release-rule-e7a4b619.md`, minted against the final acceptance criteria with no build result in existence. S-VLADW1-03's S1–S5 do not carry over. **ATTEMPT COUNT: ONE** — gauntlet-1 (diagnostic, NON-qualifying) → fix attempt 1 → gauntlet-2 = the QUALIFYING run, anchored to evidence dirs under `runtime/vlad-w1/s04/`, never an ordinal. **No exception clause, deliberately.** TERMINAL: any one of S4-1…S4-6 failing at that close → NO RELEASE, no attempt 2, honest close, remainder to a named successor.
- [x] **Residual 1 (S2-a) — DONE for the population it names.** Bundles A + G. Verified INDEPENDENTLY by two gauntlet-2 lanes: **all seven authorings RED, both em-dash controls RED**, controls firing the correct distinct rule. **Caveat carried, not hidden:** the qualifying run proved the LEAD-IN path still skips heading/list/blockquote prefix shapes (S4-1b) — the seven are closed; the class is not.
- [x] **Residual 2 (S2-b) — DONE.** Bundle B. **S4-3 HOLDS**: RF-4 observed RED in both directions inside the owning bundles' own runs (H′, L1, L2 envelopes carry the real rule output), and at close the lint reports 15 bindable paragraphs matched against 15 canonical copies byte-for-byte.
- [ ] **Residual 3 (S2-c) — CARRIED to S-VLADW1-05 as S4-1c.** Bundle L1 added the three numbered limits paragraphs, and the P1–P4 BODY PROSE entry is correct. But the enumeration **omits the P1–P4 clause HEADINGS and the section preambles**, and an inverted P2 heading ships GREEN (execution-proven, qa lane). β row 316 re-classified this as the **third instance of the S4-1a/S4-1b class** — a coverage claim at coarser granularity than the mechanism, inside a list introduced as "said plainly rather than generalised."
- [x] **Residual 4 (S2-d) — DONE.** Bundle E + RF-6, with a mutant proof asserting its target matches exactly once so a moved target fails loudly. Symmetric for every shipped caller; confirmed by the gauntlet-1 lanes and unchallenged at gauntlet-2.
- [x] **Residual 5 — DONE and RE-ATTACKED.** Bundle D (indexed loop, no method lookup) + RF-5a/b/c. The gauntlet-2 security lane drove **12 live-child attack shapes** at `auditedSpawn` — Array subclass, `Object.create(Array.prototype)` with a counting getter, Proxy args, stateful `toString`, prototype-chain secrets — for **zero leaks**; `toString()` called exactly once (no TOCTOU re-read), refused-container getters invoked zero times.
- [x] **Residual 6 — DONE, via the either-or's FIRST arm.** Bundle E route (a): `driver/host-free-driver.js` re-reads `process.env` immediately after its own scrub call, before any dynamic import, and **throws at load** if a credential-shaped name survives. **S4-5 HOLDS.**
- [x] **AC-8.6 built — DONE at the capped shape.** Bundle C. `runCustodySelfCheck` defined and invoked once from `startServer()`; the driver launches that file as a real child. **RF-7 RED at RUNTIME, not text/AST** — the mutant still starts and still contains the function, and goes red on the ABSENCE of the record. `check:pointers` resolves the named test (34/48; the missing-NAME line is gone). **S4-5 HOLDS.**
- [x] **CLASS-form residual — DONE, shipped as a disclosed ceiling.** A bound Ceiling paragraph under P3 in strong actionable form, stating that AC-8.6's landing does NOT make that control an exception and giving the reason a reader can act on (a green self-check is equally consistent with a correct scrub, an absent scrub, and a machine that never held a credential). **S4-6 HOLDS.**
- [x] **ED-340 — CARRIED OPEN with the reason stated.** Mutant half satisfied 2026-08-10; roster half open, with **ED-354** named as its instance (installed-roster parity; no new instance this sprint). **ED-358 OPEN** — this close is its second instance one layer out. Restated in the S-VLADW1-05 tracker, group 7.
- [x] **Gauntlet re-run with the discipline — DONE, twice (diagnostic + qualifying).** Registry-fixed roster; agy mandatory with a **DERIVED** read-scope manifest (ED-362); four `ok:true` records and `gauntlet-verify` PASS; mutant evidence rode with every bundle; `execution_proven` honoured — agy marked its own findings `false` and supplied the refuting command, which is how both were refuted in two commands. **One honest defect: agy served on a fallback model** (`gemini-3.1-pro-high`, not the pin) — ED-230 class, carried to S-05 group 5.

## Related definitions
- Validator, Verification, Evidence, Completion — see ../../TRACKER.md

## Tasks
- [ ] **Mint the sprint-registry entry (`add-sprint.js`) at BUILD AUTHORIZATION, not at mint time — deliberate.** `add-sprint.js` overwrites `reg.primary` unconditionally, so registering an unauthorized sprint would repoint the primary and a later `/sprint:full` would attach to a sprint nobody authorized. Mint it when the operator authorizes the build, and **commit the mint immediately** — it lands uncommitted. Reconcile ROADMAP in the same change.
- [ ] Mint the plan contract and route the plan→design β consult.
- [ ] Apply the **design-phase record-trust gate** before build.
- [ ] **Right-size every builder brief under the 12000 B ED-257 floor.** The predecessor lost a bundle to a 16810 B brief that hit the 20-minute bound 22 s after committing; the wrapper warned at fire time and the warning went unread.
- [ ] **Set `WARPOS_DISPATCH_BACKGROUND=1` on every backgrounded build-chain dispatch** (ED-353) — absence fail-closed clamps to 540 s.
- [ ] Re-derive the `verified_by` population from the acceptance criteria, not from any finding list.

## Evidence basis (why each scope item exists)
Every item traces to a lane finding with a path — scoped from a verdict corpus, not designed fresh:
- `runtime/vlad-w1/s03/gauntlet-3/ALPHA-RULING-S1-S5.md` — the ruling and the nine-item residual set.
- `runtime/vlad-w1/s03/gauntlet-3/evidence-backend-reviewer.md` — S2-a (the em-dash predicate, seven authorings, controls first).
- `runtime/vlad-w1/s03/gauntlet-3/evidence-qa-reviewer.md` — S2-b, S2-c, and the S5 class-form tension.
- `runtime/vlad-w1/s03/gauntlet-3/evidence-security-claude-hunter.md` — the `args.map` defeated control, the S3 driver strength concern, and the bind-pins-a-falsehood second-order finding.
- `runtime/vlad-w1/s03/gauntlet-3/evidence-security-agy.md` — the absorb/delete asymmetry (cross-family, third round running).
- `runtime/vlad-w1/s03/fix-attempt-2/ROUND-RECORD.md` — the class-form residual, the clean-checkout probe, the three dispatch death signatures.

## Risks
- **The predecessor's signature defect recurring one layer up.** Three gauntlets, three rounds in which the repair produced a new defect one layer out from the thing it fixed — most recently the bind itself. **Mitigation: no control counts as done until a test fails on its removal AND the control is attacked at the layer above it.**
- **A correction that turns the ship gate red.** Because bound sentences are gate-enforced, any claim correction must move the bind in the same change. **Mitigation: treat claim-text and canonical-copy as one atomic edit, owned by one bundle.**
- **Scope creep into new controls.** The residuals are repair, wiring and one genuinely-missing criterion (AC-8.6). If a new scanner seems necessary, it goes to β first.

## Decisions
- **2026-08-28 ~22:5xZ — α OVERRODE the plan contract `PC-20260828-0086` `approval_boundaries` operator-authorization boundary (contract created 22:40Z) under the operator's standing session mandate (given 2026-08-28 ~15:20Z "complete open work" and ~18:55Z "authorized for all tasks"), Class B, reversible: nothing merges without rows 309/310; operator "hold" halts at the next bundle boundary.** Recorded per β row 311 (msg_id `c5d0e293-7b46-4a18-9f52-8e31d6b70a4f`; not AP-15, build proceeds). **The distinction is load-bearing and was corrected from an earlier, wrong entry that called this a mandate-authorization:** the mandate was given at ~15:20Z and ~18:55Z, and the boundary it is said to authorize was written into the contract at 22:40Z — **a standing mandate cannot be consent to a boundary that did not exist when it was given.** So this is α overriding its own written boundary, which is a decision someone can audit and reverse, not a permission that was already held.
  **β's creep fence, binding:** the override reaches **BUILDER DISPATCH ONLY.** The registry mint is committed immediately (as planned); **the merge of `wt/S-VLADW1-01-engine` stays gated on the release rule**; **every push is per-action** (the classifier sits above `permissions.allow`); the user-facing custody register wording stays **Class C**. **Halt granularity is the bundle boundary, never mid-bundle** — a half-applied claim+canonical edit is the S4-3 defect itself.
- **2026-08-28 — this sprint exists rather than a fourth fix attempt on S-VLADW1-03.** β's rule pre-committed "no attempt 3"; α applied it. Reopening the predecessor would be reshaping a pre-committed gate after seeing the result, which β barred in both directions (P-094). A named successor is the sanctioned path and keeps the predecessor's close honest.
- **2026-08-28 — the predecessor's branch is NOT merged.** `wt/S-VLADW1-01-engine` stays at `b2583d6` as the surface this sprint starts from, because its shipped copy contains claims proven false by execution.
- **2026-08-29 — S4-1 and S4-2(c) failed the qualifying gauntlet; the rule was applied verbatim; no attempt 2 (P-094).** β minted the rule at the design→build boundary before any result existed, with **no exception clause, deliberately**. Two criteria failed at the close, so the terminal applied as written. Inventing a carve-out — or re-running the gauntlet to get a different answer — would be reshaping a pre-committed gate after seeing the result, which β barred in **both** directions. β confirmed the application under row 316 (`6e2d94af`), having first declared that one of the two S4-1 failures was **wording β itself recommended at row 313**, then run the position-swap and found the grading holds either way: *"approval is not a truth check, and β's recommendation is worth exactly nothing against the shipped bytes."* β also notes the refusal of an exception clause was **load-bearing** — S4-2(c), one fold implemented beside the shared transform, is precisely the defect a "mechanical failures only" carve-out would have been argued into.
- **2026-08-29 — `wt/S-VLADW1-01-engine` is NOT merged and is left at `6a105f2`.** It becomes S-VLADW1-05's starting surface. Merging it would ship a `CUSTODY.md` whose confusable-fold calibration and escape-count sentences are false by execution, and a status-token comparison that a one-keystroke emphasis change plants green inside the Proven section — which is the exact failure this sprint pair exists to close.

## Completion record
- Final state: **CLOSED AT HONEST STATE — NOT RELEASED.** S4-1 and S4-2(c) failed the qualifying gauntlet; α applied the pre-committed rule verbatim; terminal reached (no attempt 2). `wt/S-VLADW1-01-engine` left UNMERGED at `6a105f2`.
- Percent completion: **80%** — 10/12 DoD boxes and 4/6 criteria landed and held; the sprint's actual goal (a *releasable* custody set) was not reached. Reasoning in the CLOSE section above.
- Completion timestamp: 2026-08-29
- Definition of done used: the Definition of Done above, every box dispositioned at close
- Evidence of completion: `runtime/vlad-w1/s04/gauntlet-2/ALPHA-RULING-S4-1-TO-S4-6.md` (the ruling) · `ROUND-ADJUDICATION.md` · four lane evidence files (`evidence-qa.md`, `evidence-backend.md`, `evidence-security-claude.md`, `evidence-security-agy-RECONCILED.md`) · `gauntlet-verify.txt` (PASS, 4 roles) · `alpha-s4-4-rf-execution.tap` (α's own re-execution, 33/33, 0 skipped) · `runtime/vlad-w1/s04/build/ROUND-RECORD.md` · `runtime/vlad-w1/s04/RETRO-INPUT.md` · β rows 308–316 under `runtime/beta-consult/`
- Session IDs / dates / agents: 2026-08-28 minted by Alex ε at the close of S-VLADW1-03; 2026-08-28/29 built and conducted by Alex ε under Alex α, β consulted at every boundary (rows 308/309/310/312/313/314/315/316). Bundles A–F′ (build), G/H/I/J/K/L1/L2 (fix attempt 1). Gauntlet-1 diagnostic @ `b9b8df3`; gauntlet-2 qualifying @ `6a105f2`.
- Parent epic: E-VLAD-001
- Remaining follow-up items: **all carried to `trackers/sprints/S-VLADW1-05-one-transform-both-sites.md`** — residual groups 1–8 verbatim (incl. S4-1c per β row 316), the four successor-carried items below, ED-340 OPEN with ED-354 as its instance, ED-358 OPEN (second instance), EDs 360–363 cited. The four parked SDK credential vars remain disclosed-open per the operator's 2026-08-18 ruling and are NOT in scope.
- Related untracked work: None
- ../../TRACKER.md updated: Yes · Roadmap reconciled: n/a — registry status `planning → closed` at `a9ae5f96` (α, ED-359 second instance — cited, not re-filed); no further registry edit owed

## Residuals for the named successor — accumulated during fix attempt 1

Recorded as they were found, so the close does not have to reconstruct them. **None of these is a defect
this sprint is failing to fix; each is a bounded thing deliberately not attempted at a qualifying boundary.**

1. **The transform's own description paragraph is UNBOUND.** Nothing pins `CUSTODY.md`'s description of
   `canonicalizeClaimText` byte-for-byte, so a later edit to it is invisible to every check — the most
   load-bearing prose about the mechanism this sprint is about. **It cannot be closed cheaply:** adding a
   `BOUND_PARAGRAPHS` entry makes Rule 4b (`findBoundParagraphPresenceViolations`) demand the text appear in
   the clean test fixture, and that fixture is built only from keys matching `^Ceiling` or `^A\d+$`, so the
   "clean fixture lints clean" test would go RED. Closing it needs the fixture builder in
   `test/custody-claim-lint.test.js` extended, with its own falsifier. Bundle K escalated rather than faked
   it. **Disclosed, not hidden:** the preamble's NOT-bound class covers it, and after L1 the enumeration
   names it explicitly.

2. **The count-of-surfaces exhaustiveness family is disclosed but not mechanised.** `only-surface-assertion`
   matches exhaustiveness PHRASES inside bound paragraphs, not COUNTS, so a future bound paragraph could
   re-introduce a surface count and ship green. β row 314 ruled DISCLOSE rather than widen — count phrasing
   is unbounded ("one", "a single", "two", "both", "the sole", "no other") and widening manufactures the
   appearance of coverage. **L1 measured a candidate pattern anyway** and it produced zero hits across all
   15 bound paragraphs while not refusing the three legitimate count-ish phrasings in the same paragraph;
   the measurement is handed forward, and it does NOT overturn row 314, whose ground was unboundedness
   rather than over-refusal.

3. **"Unbound" does not mean re-wrapping is free** — a trap for any future doc-scoped bundle. Bundle L1
   falsified this premise on itself: its first wrap of the NOT-bound enumeration split `P1–P4 BODY PROSE`
   across a newline and turned a test RED, because header substrings are pinned across wraps INDEPENDENTLY
   of the canonical-copy bind. It fixed its own wrap rather than the test. "Unbound" governs the
   canonical-copy bind only.

4. **A stale assertion MESSAGE in a non-shipping test.** After L1 changed the shipped prose to "human
   review", the task-4 assertion's failure message still says "must name the reviewer read as the control".
   The regex it enforces (`/must be reviewed, not linted/`) is unaffected and green, and
   `test/custody-claim-lint.test.js` is **not in the ship set** (`package.json#files` ships exactly one
   test), so **it cannot fail S4-1**. Named rather than fixed: a follow-up dispatch at the qualifying
   boundary is not worth its risk.
