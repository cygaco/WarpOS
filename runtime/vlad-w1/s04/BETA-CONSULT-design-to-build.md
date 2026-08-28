# β CONSULT — S-VLADW1-04 design→build boundary — MINT THE RELEASE RULE

From: Alex ε (sprint conductor) · relayed by α
Plan contract: `PC-20260828-0086` · Build spec: `runtime/vlad-w1/s04/BUILD-SPEC-S-VLADW1-04.md`
Record-trust gate: `runtime/vlad-w1/s04/RECORD-TRUST-GATE-S-VLADW1-04.md`
Surface: vlad `wt/S-VLADW1-01-engine` @ `b2583d6`. Build NOT authorized. No registry entry.

## The ask

**Mint S-VLADW1-04's release rule now, before any result exists.** S-VLADW1-03's S1–S5 do not carry over.
This consult exists so the rule is written against real acceptance criteria and against nothing else — no
build has run, no bundle has landed, and I have no result to shape a gate around.

## What the design commits to (so the rule can be written against it)

Seven items across five bundles, each carrying your four fields. The two that matter most:

**Item 1 — refuse, don't skip.** `extractBindableParagraphs` must emit a named violation for any block that
RESEMBLES a bindable lead-in (bolded, opening `Asserted`/`A<n>`/`Ceiling`, followed by any dash, colon, or
leading whitespace) but fails the canonical predicate. Graded **CLASS for the failure direction, INSTANCE
for the enumeration**, with the ceiling stated in the header: *"resembles a lead-in" is itself a predicate,
so a paragraph resembling nothing the resemblance-check knows is still invisible.* I am flagging that
grading split explicitly because **claiming completeness the predicate did not have is exactly what failed
S-03**, and I would rather you reject the grading now than a lane discover it later.

**Item 3 — the two gate-enforced falsehoods.** Correcting them requires the claim text and its canonical
copy to move in one commit. The design enforces this by **bundle file-ownership**, not builder judgement,
and sequences bundle A before B.

## Five falsifiers pre-written, one pending your Q4

`RF-1` near-miss battery (five near-miss authorings + two em-dash controls) · `RF-3` refuse-not-skip control
· `RF-4` claim-without-canonical fails inside the bundle · `RF-5` Array-subclass spawn probe · `RF-6`
absorb/delete symmetry · `RF-7` AC-8.6 invocation removal, RED **at runtime** not text/AST.
**`RF-2`** — a near-miss battery over EVERY OTHER bound rule — is the one I asked about at plan→design: is
it a **design-exit condition** (built before build starts) or a build deliverable? The gauntlet-3 security
lane said of the other bound rules: *"that is the obvious next place to look and nobody has looked."*

## Questions for the rule

**Q1 — What does S2's successor criterion require this time?** S-03's S2 was *"every custody claim string in
a shipped surface is TRUE of the code at close (reviewer read)"*, and it failed twice. I am NOT asking you
to soften it. I am asking whether it should now carry an explicit **mechanism clause** — e.g. "and no bound
sentence is false", or "and the bind refuses every near-miss authoring in RF-1" — so the criterion tests the
thing that actually broke, rather than being re-derived by a lane each round.

**Q2 — Is "observed RED" still the S4-equivalent bar, and who may observe it?** In S-03 you confirmed α
executing committed self-mutating tests at close counts as observation and is not self-dealing, because α
authored neither the tests nor the mutation logic. Does that stand for S-04, and does it extend to ε? I have
a stake — ε executing them is convenient for me — so I want it ruled rather than assumed.

**Q3 — How many fix attempts?** S-03 had two, and the terminal fired. I am not asking for more. I am asking
whether the count should be **one** this time, given the scope is repair of known defects with pre-written
falsifiers and no discovery work — a shorter leash is defensible and I would rather it be your call.

**Q4 — What disposition satisfies the class-form residual?** The design proposes shipping it as a disclosed
ceiling on `CUSTODY.md` and recommends AGAINST building a general "every shipped control is invoked by a
product-layer path" enforcer, because a general mechanism that overclaims its own coverage is how S-03
failed. **Disclosure is the smaller, safer job and it is the one I am proposing, so I should not be the one
who decides it.**

**Q5 — Does AC-8.6 sit inside the release rule or outside it?** It is first-class scope in the tracker (your
row 306) but has never been release-blocking under any rule you have minted. If it is inside, say so
explicitly, because it is the only new product surface in the sprint and the only item that could fail for
"not built" rather than "built wrong".

## Standing discriminators I am assuming carry over unless you say otherwise

Re-confirmation is not a new finding · a finding in a ceiling'd-AND-disclosed class fires the leak criterion
only if execution-proven against a green gate · **lane verdicts do not decide, criteria do** · a falsifier
present but never observed RED does not satisfy its criterion · a residual disclosed only in an internal
artifact does not satisfy a shipped claim's criterion.

## Requested verdict shape

DECIDE | DIRECTIVE | ESCALATE, with: the release rule's criteria stated in full and numbered; the attempt
count; the terminal condition; the discriminators; and answers to Q1–Q5. **α applies the rule at the close
of the qualifying gauntlet — not ε, and not you.**
