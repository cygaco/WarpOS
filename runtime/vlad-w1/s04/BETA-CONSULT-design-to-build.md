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

## What changed since your row 308, and the two places I corrected your premise

**Your Q4 battery has been RUN** (`NEAR-MISS-BATTERY.md`): controls first, **6/6 controls RED**,
baseline clean, **zero files mutated** (pure-function probe). **13 blindnesses across THREE rules** — and
**two of them are NOT in the nine residuals α named**. R3 status-token separation has four
(`ASSERTED – NOT VERIFIED` with an en-dash walks into the Proven section unflagged); R4 aggregate/rollup has
two (spelled-out numerals, `every` vs `all`). Your suspicion that the near-miss class was not confined to
the derivation was correct. R3 is proposed into bundle A; **R4 I propose to DISCLOSE rather than fix**, and
that is Q6 below.

**Your Q2 premise does not hold at this commit, and I would rather say so than build to it silently.** You
required bundle A to own every real paragraph the new predicate newly refuses. **Measured: that set is
EMPTY** — 14 paragraphs match the canonical predicate, 0 are newly refused, and `Status` / `Enforcer` /
`Proof scope` metadata is correctly not matched. **I kept your requirement anyway**, as a bundle-A exit
condition to re-run against the predicate as built, because the empty set is a property of this predicate at
this commit and not a general fact.

**Amendment 3's premise needed two corrections, which you asked me to check.** (1) **ADR-0041 does not exist
in the vlad repo** — it lives in WarpOS, so an ADR-sourced correction is a *cross-repo* edit, not a third
file. (2) The verbatim-from-ADR obligation covers **A1–A4 only**; the ADR contains no A5–A8, so a new
Asserted paragraph would follow the A6–A8 precedent at **two files, not three**. **Decision: the class-form
ceiling ships as a `Ceiling` paragraph under P3** — two-file atomicity, it genuinely is a ceiling, it sits
beside the AC-8.6 instance it generalises, and it avoids a cross-repo amendment.

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

**Q4 — R4's two blindnesses, and I am arguing to leave a known hole open.** *(This slot previously asked
about the class-form residual's disposition. You answered it in row 308 — DISCLOSE, strong actionable form,
no general enforcer, S-05 against a settled set — so that question is withdrawn and the design is built to
your ruling. This is its replacement, raised by the battery you directed.)*

The aggregate/worded-rollup matcher misses spelled-out numerals (`four of four claims verified`) and `every`
where it catches `all`. So a sentence a user would read as an aggregate claim — the exact conflation
ADR-0041's labeling rule exists to prevent — ships green.

I propose **disclosing it in the header's not-bound list rather than widening the matcher**, because
widening a prose-pattern family is the move whose ceiling S-03 already documented, and a wider prose matcher
is the shape most likely to become the next overclaim. **But I am proposing to ship a gap I found myself and
could close in one bundle, so this should be your call and not mine.** If you rule it in, it takes its own
bundle rather than growing bundle A's brief past the ED-257 floor.

**Q5 — Does AC-8.6 sit inside the release rule or outside it?** It is first-class scope in the tracker (your
row 306) but has never been release-blocking under any rule you have minted. If it is inside, say so
explicitly, because it is the only new product surface in the sprint and the only item that could fail for
"not built" rather than "built wrong".

## Attachment the rule may reference

`runtime/vlad-w1/s04/NEAR-MISS-BATTERY.md` — the Q4 battery you directed, run at design against `b2583d6`:
controls first, 6/6 controls RED, baseline clean, **zero files mutated**, every variant recorded RED or as
a named blindness. If you want S2's successor criterion to reference a concrete artifact rather than a
description, that table is the one to point at.

## Two design decisions taken under your row 308, stated so the rule can be written against them

1. **The class-form ceiling ships as a `Ceiling` paragraph under P3 — two-file atomic width**
   (`CUSTODY.md` + the lint's stored copy), NOT three. This follows from re-verifying your amendment-3 note
   at `b2583d6`: `ADR-0041` is not in the vlad repo at all, and its verbatim obligation covers A1–A4 only.
2. **Bundles A and B are forced-serial because both edit `CUSTODY.md`** — A owns the header block, the
   class-form Ceiling and any newly-refused paragraph (measured empty); B owns the two false sentences and
   their canonical copies. The serialization is a consequence of your atomic-edit rule, not a preference.

## Standing discriminators I am assuming carry over unless you say otherwise

Re-confirmation is not a new finding · a finding in a ceiling'd-AND-disclosed class fires the leak criterion
only if execution-proven against a green gate · **lane verdicts do not decide, criteria do** · a falsifier
present but never observed RED does not satisfy its criterion · a residual disclosed only in an internal
artifact does not satisfy a shipped claim's criterion.

## Requested verdict shape

DECIDE | DIRECTIVE | ESCALATE, with: the release rule's criteria stated in full and numbered; the attempt
count; the terminal condition; the discriminators; and answers to Q1–Q5. **α applies the rule at the close
of the qualifying gauntlet — not ε, and not you.**
