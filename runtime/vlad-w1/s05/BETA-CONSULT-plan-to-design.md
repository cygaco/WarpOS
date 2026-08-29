# β CONSULT — S-VLADW1-05 plan→design boundary — [S05 β-r1]

From: Alex ε (sprint conductor) · relayed by α · 2026-08-29
Tracker: `trackers/sprints/S-VLADW1-05-one-transform-both-sites.md` (the source of scope — **no plan
contract yet**; `plan.js` requires a registry entry and `add-sprint.js` repoints `primary`
unconditionally, so contract + registry mint together at build authorization. ED-365.)
Predecessor ruling: `runtime/vlad-w1/s04/gauntlet-2/ALPHA-RULING-S4-1-TO-S4-6.md` · your confirmation
row 316 (`6e2d94af`)
Surface: vlad `wt/S-VLADW1-01-engine` @ `6a105f2`, NOT merged. **Build NOT authorized. No registry entry.**

## Context you already have, stated once so the questions are readable

S-VLADW1-04 closed at honest state, not released, at 80%. **S4-1 and S4-2(c) FAILED.** Four criteria held,
S4-2(d) was discharged twice, the suite grew 339 → 366 with every mutant guarded — and the sprint still
failed, because the fix attempt **authored new false sentences about its own mechanisms**.

You graded one of them — your own row-313 recommended wording — as correctly false, with the conflict
declared and the position-swap run. Your line is the sprint's finding: *"approval is not a truth check, and
β's recommendation is worth exactly nothing against the shipped bytes."*

**The class, in your words:** a coverage claim stated at a **coarser granularity than the mechanism has**.
"The two scripts the fold DOES cover" asserted a script-level closure over a letter-level sample. Three
instances — S4-1a (script-vs-letter), S4-1b ("two escapes remain" vs thirteen prefix shapes), S4-1c (the
NOT-bound enumeration vs the P1–P4 headings). Plus S4-2(c): one fold implemented **beside** the shared
transform, in a file whose own comment says the two sites "must share one transform."

## Q1 — the scope variant. I recommend `recommended`, and my stake is that it is the smaller ask.

- **minimal** — S4-2(c) only: move the emphasis fold inside the shared transform. Closes the mechanism
  failure and leaves all three false-sentence instances standing.
- **recommended** — residual groups 1, 2, 3 (S4-1a, S4-1b, S4-2(c)) **plus** S4-1c and the successor-carried
  items: one transform for both sites, refuse-not-skip on the lead-in path for every prefix class, coverage
  stated at the granularity the code has, escape counts replaced by named classes, and the transform's own
  description bound.
- **expanded** — the above plus a vendored Unicode confusables table and a general enforcer over coverage
  claims.

**I recommend `recommended` and argue against `expanded`.** A vendored confusables table is a data-supply
problem wearing the costume of a fix, and a "general enforcer over coverage claims" is exactly the shape
that has now failed twice: a general mechanism that overclaims its own coverage. **My stake, declared:**
`recommended` is also the variant that makes my design battery sufficient rather than obviously
insufficient, so read my recommendation with that discount applied.

## Q2 — the unsafe assumption I am building on, and I want it named in the rule

**Three instances do not exhaust the coverage-granularity class.** I found S4-1a and S4-1b at gauntlet-2;
you re-classified S4-1c on a read. I have no reason to believe the fourth does not exist in a paragraph
nobody has attacked yet — `src/env-scrub.js`, `src/model-seam.js`, `driver/host-free-driver.js` and
`src/server-entry.js` all carry substantial custody prose that the qualifying gauntlet's lanes *sampled
rather than read end to end*, and every lane said so in `what_i_could_not_assess`.

So the honest statement of this sprint's scope is: **it fixes three known instances of a class whose size
is unknown.** I would rather the rule say that than have the sprint close claiming the class is closed —
which would be the class, one more layer out, in the sprint that exists to end it.

**My stake:** naming this makes my sprint harder to pass. I am asking for it anyway because the alternative
is the failure mode we have now hit three times.

## Q3 — does the class need its own criterion, or is a general truth criterion enough?

S4-1 was general ("every custody claim string is TRUE") and the class shipped **three times underneath it**.
A general truth criterion is satisfied by a reviewer reading sentences one at a time; the granularity defect
survives that read because each sentence *looks* true until you enumerate what the mechanism actually covers.

I think the rule wants a criterion that asks a different question — *for every coverage claim, is its stated
granularity the mechanism's own granularity?* — but I am not confident, and it is your call whether that is
a criterion or a discriminator inside the truth criterion. **My stake:** a separate criterion is one more
thing that can fail my sprint, so I am not asking for it out of self-interest.

## Q4 — how should the rule treat evidence from a SAMPLE?

My design battery proves three homoglyph evasions and twelve prefix shapes. **Neither is a closure**, and
the battery artifact says so in its own "what this does NOT establish" section. But the temptation at the
close will be to read "12/12 RED under the fix" as "the prefix class is closed", which is precisely the move
that produced S4-1b.

I want the rule to make that unavailable — some form of: *a criterion may not be satisfied by sample
evidence presented as closure; a claim about a class requires either an enumeration derived from the code or
an explicit statement that the covered set is what it is.* Bundle O in my spec already emits the covered
letter set programmatically so the prose cannot be hand-typed; you may want that as a requirement rather
than a design choice.

## Q5 — attempt count and structure.

S-04 ran diagnostic → one fix attempt → qualifying, and **the diagnostic paid for itself**: six defects
found on a run that could not fire the terminal. The difference this time is that **the three fix shapes are
already validated at design** — battery run, controls first, 7/7 RED in both columns, with the fixes proven
to close 8/8, 12/12 and 3/3 with zero over-refusal.

I am **not** asking for more attempts. I am asking whether pre-validated fixes change the structure — for
instance whether the diagnostic run is still worth its cost, or whether its budget is better spent on the
un-attacked prose surfaces named in Q2. **My stake is obvious and I will not pretend otherwise:** any
structure with fewer runs is easier for me. Weight that accordingly.

## The design exit condition, already met

**The near-miss battery is RUN, at design, over every bound rule, controls first, including the predicate
AS IT WILL BE FIXED.** `runtime/vlad-w1/s05/NEAR-MISS-BATTERY.md`, harness `run-battery.mjs`, zero files
mutated, reproducible from the in-repo path.

Two things I will state before you find them:
1. **My first harness reimplemented the matcher and its own controls went GREEN.** It would have "proven" a
   fix that does nothing. Discarded; the harness now drives the real matcher. In the artifact.
2. **Strikethrough was already RED as-is**, so FIX A closes seven of eight by design and one by accident.
   In the artifact.

## What I am NOT asking you to do

Mint the S5-n release rule. That is the **design→build** boundary and I will send it as `[S05 β-r2]` with
the build spec attached. This consult is the plan→design boundary only.

## Requested verdict shape

DECIDE | DIRECTIVE | ESCALATE per question, with the scope variant ratified or corrected, and the Q2
assumption either accepted as a stated limit of the sprint or rejected with what you want instead. If you
think Q3's criterion belongs in the rule rather than here, say so and I will carry it into the β-r2 consult
rather than pre-empting your rule text.
