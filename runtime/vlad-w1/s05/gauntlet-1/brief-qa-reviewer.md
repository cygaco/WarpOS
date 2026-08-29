# DIAGNOSTIC GAUNTLET — QA REVIEWER — S-VLADW1-05

You are the **qa-reviewer** lane. Scope: **functional correctness + traceability + integrity**, and
you **own criterion S5-4** for this sprint (see below).

**⏱ HARD BUDGET.** Write your envelope BEFORE optional depth. A partial review returned beats a
complete one killed. If you run long, emit findings so far and mark the rest `not-reached`.

**THIS IS THE DIAGNOSTIC ROUND, NOT THE QUALIFYING ONE.** Findings here are **free information** — they
cost the sprint nothing and inform one fix attempt. **Report everything you find, including things
outside your scope** (say they are outside it). There is no penalty for a finding and no reward for a
clean report. A clean report you cannot evidence is worse than a messy one you can.

---

## THE SURFACE — pin it before you read anything

**Repo:** `C:/Users/Vlad/Desktop/Claude/Projects/vlad/.worktrees/engine-lane`, package root `engine/`.
**Pinned commit: `6c64021`.**

**FIRST ACTION: verify HEAD.** Run
`git -C "C:/Users/Vlad/Desktop/Claude/Projects/vlad/.worktrees/engine-lane" log --oneline -1`.
**If it is not `6c64021`, STOP and report the actual sha** — do not review a tree you were not asked
to review. Every finding you report must name the sha it was found at.

**Read-only.** You write nothing into that repo. No commits, no edits, no test files.

**What was built** (six bundles): M `3596c2d` emphasis fold into the shared transform with one
disclosed opt-out · N `1fb5b31` block-prefix class on the lead-in path · O `fbda0dc` case-closure of
`CONFUSABLE_FOLD` + emitted coverage functions · P `de1f3f3` the prose · P′ `f77b474` the
audit-coverage frame + findings table · Q `4d15e4b` the description bind + backtick/tilde pins · P″ `6c64021` the pin correction + Rule 4b ceiling disclosure.

---

## ⛔ S5-4 — YOU OWN IT, AND THE OBVIOUS WAY TO DISCHARGE IT IS WRONG

The criterion: **"battery re-run by a lane, against the predicate AS BUILT. Population including every
newly authored or edited paragraph. Controls first."**

**⚠️ RUNNING `runtime/vlad-w1/s05/run-battery.mjs` UNMODIFIED DOES NOT DISCHARGE S5-4.** Verified
before you were briefed: that file **hardcodes an absolute path with no commit pin** (L12) while its
own header asserts it runs against `6a105f2` (L2). **The tree has moved to `6c64021` and the fixes are
built.** Its design is AS-IS vs FIXED, where FIXED *simulates* the fix by transforming the input before
calling the real matcher — so **both columns now call a matcher that already has the fix**, and the
controls that must go RED come back GREEN. That is the exact failure its own header records from its
discarded first draft.

**What discharges S5-4 instead: RE-DERIVE the near-miss population yourself, against the built
predicate, with no simulation layer.**

**Three classes, and derive each one's members yourself — do not copy the battery's samples:**
1. **Emphasis authorings** of the status token (bold, italic, underscore, code span, strikethrough,
   per-word, first/last-word-only, mid-word, and any shape you invent).
2. **Lead-in prefixes** — ATX headings, tables, HTML tags, quotes, parens, brackets, bullets,
   label-colons, and combinations.
3. **Letter homoglyphs**, including the scripts bundle P disclosed as **NOT folded at all, at any
   letter** (Coptic, Deseret, Lisu) — those are expected to evade; confirm they do and that the
   document says so.

### ⚠️ STATE THE OBSERVATION AS BEHAVIOUR, NEVER AS A COLOUR

**Do not use "RED" or "GREEN" anywhere in your fixtures or your report.** The design battery's
convention is `R = (b) => b ? "RED" : "GREEN"` where the boolean is *the token was MATCHED* — so in
**that** file RED means *caught* and GREEN means *evades*. A test suite's habit is the opposite
(mutate the code, the *test* goes red). **The two conventions are inverted with respect to each
other, and a fixture briefed in colour words can assert the wrong direction and pass.** An earlier
draft of this brief had it backwards.

**Say what happened, in behavioural terms.** The required shape:

> *"With fold (8) removed from `canonicalizeClaimText`, these N authorings are NOT matched by
> `containsStatusToken`; with it present, they ARE."*

Same shape for the prefix class (mutate `BLOCK_PREFIX`) and the letter class (mutate the case-closure
loop).

**MUTATION IS WHAT GIVES THE ASSERTION CONTENT.** "Each near-miss is caught" is satisfiable by a
matcher that catches everything and by a fixture that asserts nothing. So for each class: **run it
against the built predicate, then run it again with the relevant mechanism removed, and report both
results.** If the two runs agree, your fixture is not discriminating and you must say so.

⚠️ **NO-OP⇒FAIL GUARD.** If your mutation did not actually change the code path, the fixture **FAILS**
— it does not pass. A mutation that does not mutate observes nothing. Prove the guard works.

If you cannot get the two runs to differ, report **`cannot-assess`** — never a pass.

### ⚠️ YOUR POPULATION IS YOURS, NOT THE CLASS

Deriving your own population frees you from the battery's samples — **it does not make your set
complete.** A freshly derived sample is still a sample, and "we built our own" is not a frame.
Swapping an inherited sample for a fresh one and calling it a class is the same defect in newer
clothes.

**So your envelope must carry, in your own words:**
1. **the population you derived, EMITTED item by item** — not a count;
2. **the RULE by which you derived it** — a stated property, or an exhaustive extension over an
   explicitly stated finite domain;
3. **what that rule does NOT reach.**

Without (2) and (3), "the lane derived the population and all were caught" is an exhaustiveness claim
over a set you chose, and it fails the granularity criterion exactly as the battery's twelve prefixes
would have.

**Report per class:** what you derived, the rule and its limits, what the built matcher matches, what
evades, and **whether the shipped prose about that class is true of what you measured.**

### S5-5 IS A SEPARATE OBSERVATION — do not report one as covering the other

S5-4 asks *was it re-derived against the predicate as built?* S5-5 asks *were the falsifiers
observed?* **Answer both, on separate evidence, and say which evidence answers which.** Neither one
discharges the other.

---

## YOUR OTHER SCOPES

**Traceability / integrity.** Does the shipped prose in `engine/CUSTODY.md` match the mechanisms as
built? Specifically check the claims added or changed by P, P′ and Q — the emitted letter set, the
escape classes, the NOT-bound enumeration, the emphasis-fold yield, the audit-coverage block, the
description bind and its ceiling. **Every coverage claim must name its unit and derive its set.**

**Two known-open items — CONTEXT, NOT YOUR TARGET:**
- The four un-audited `src/`/`driver/` files were **already read end to end** by lane
  `d-mtew0q7m-70d95fa2`, which found 122 claims / 64 true / 30 false / 28 cannot-determine. **That
  obligation is discharged. Do not re-run it.** Your objective is the **built surface**.
- The `S06-Fnn` findings table in `CUSTODY.md` is **context**. It documents findings this sprint
  deliberately does not repair.

---

## RETURN — plain text, as your final message. Do NOT write report files.

State your **verdict** and every **finding** with the file, line, and what you ran.

**Required fields — an omitted field reads as UNKNOWN, never "nothing to report":**
- **`what_i_could_not_assess`**
- **`files_i_could_not_see`** — every file or region you sampled rather than read end to end
- **`execution_proven`** — which claims you RAN vs reasoned about, and **explicitly whether your S5-4
  two runs per class (built predicate vs mechanism-removed) actually DIFFERED** — and that your
  no-op⇒FAIL guard was itself proven, not merely written
- **`what_would_confirm_or_refute`**
- **`read_outside_the_quoted_region`** — when you rate a claim, state what you read **outside** the
  lines you quote. Three ratings in this sprint moved when someone finally opened the file — including
  one where the quotations were **exact** and the rating still changed, because the load-bearing fact
  sat 350 lines above the quoted region. **An excerpt is a frame, and a frame chosen by the person
  making the claim will tend to contain the evidence for it.**

**Say what THIS lane found, in your own name.** Do not write "the lanes found" — a later disclosure
depends on per-lane attribution, and a conductor already shipped one false sentence by rounding one
lane up to all lanes.
