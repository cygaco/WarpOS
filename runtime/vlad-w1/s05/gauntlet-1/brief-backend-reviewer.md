# DIAGNOSTIC GAUNTLET — BACKEND REVIEWER — S-VLADW1-05

You are the **backend-reviewer** lane. Scope: **code quality of the built mechanisms**. Traceability
and integrity belong to the qa lane; security to the security lane. Report anything you find outside
your scope, saying it is outside.

**⏱ HARD BUDGET.** Envelope BEFORE optional depth. A partial review returned beats a complete one
killed; mark unreached work `not-reached`.

**THIS IS THE DIAGNOSTIC ROUND.** Findings are **free information** — they cost the sprint nothing and
inform one fix attempt. **There is no reward for a clean report.** A clean report you cannot evidence
is worse than a messy one you can.

---

## THE SURFACE — pin it first

**Repo:** `C:/Users/Vlad/Desktop/Claude/Projects/vlad/.worktrees/engine-lane`, package root `engine/`.
**Pinned commit: `6c64021`.**

**FIRST ACTION:** `git -C "C:/Users/Vlad/Desktop/Claude/Projects/vlad/.worktrees/engine-lane" log --oneline -1`.
**If it is not `6c64021`, STOP and report the actual sha.** Name the sha on every finding.
**Read-only** — no commits, no edits, no test files.

**What was built:** M `3596c2d` emphasis fold (8) into `canonicalizeClaimText` with one disclosed
opt-out · N `1fb5b31` block-prefix class on the lead-in path · O `fbda0dc` `CONFUSABLE_FOLD`
case-closure + `tokenAlphabetDomain()` / `getTokenAlphabetCoverage()` · P/P′/P″ prose ·
Q `4d15e4b` the transform-description bind + backtick/tilde pins.

---

## THE QUESTIONS THAT MATTER MOST HERE

**1. WIRING, not just sufficiency.** The sprint's thesis is *"one transform, both sites."* A transform
that is *correct* but not *reached* is the original defect wearing a fix. **Trace the call graph
yourself**: which callers receive fold (8), which opt out, and is the opt-out list what the code
actually does rather than what its comment says? `resemblesBindableLeadIn` passes
`{ emphasisFold: false }` deliberately — **verify that is still the ONLY opt-out**, by grep and by
reading, not by trusting the comment.

**2. THE THIRD AND FOURTH EMPHASIS SITES.** Bundle M's inventory found `EMPHASIS_RUN` used twice
inside `resemblesBindableLeadIn` (opener and closing strip) and a fourth site, `BOLD_LEAD_IN` (~554),
which it **scoped out** as raw-text structural id-derivation rather than comparison-hiding.
**A scope-out is a claim.** Check it: can `BOLD_LEAD_IN` ever influence a comparison result?

**3. ORDER DEPENDENCE.** Bundle O found — by execution, before shipping — that entries added *after*
`CONFUSABLE_PATTERN` is constructed exist in the Map but never fire, because the regex is already
built. **Look for other order-dependent constructions of the same shape**: any derived structure built
from a mutable source where the derivation happens once. That class produced a silent no-op that
looked correct.

**4. THE CASE-CLOSURE COLLISION HANDLING.** O case-closes `CONFUSABLE_FOLD` by construction and
refuses to overwrite pre-existing keys (the `ν → v` case). **Is "never overwrite" right in every
direction?** Consider whether a derived entry that *should* win is being dropped, and whether the
emitted coverage report tells the truth about which entries came from the literal map vs the closure.

**5. THE NEW BIND'S MECHANISM.** Q extended the clean-fixture builder to partition keys by
**complement** (`!ceiling && !asserted`) rather than a third hand-typed list. **Is the complement
actually complete** — can a key exist that is neither, and is not picked up? And Q disclosed that
Rule 4b is a pure substring check, so appended text is invisible. **Confirm that ceiling by running
it**, and check whether anything else in the file relies on Rule 4b being stronger than it is.

**6. TEST QUALITY.** Several falsifiers are asserted to have been "observed RED." **Spot-check that
the tests fail when they should** — mutate the mechanism a test claims to pin and confirm the test
goes red. A test that cannot fail is the sprint's own subject.

---

## CONTEXT, NOT YOUR TARGET

- The four un-audited `src/`/`driver/` files were already read end to end by lane
  `d-mtew0q7m-70d95fa2` (122 claims: 64 true / 30 false / 28 cannot-determine). **Discharged — do not
  re-run it.** Your objective is the built mechanism.
- The `S06-Fnn` table in `CUSTODY.md` documents findings this sprint deliberately does not repair.
- The qa lane owns S5-4's near-miss re-derivation. **You do not need to duplicate it** — but if you
  build probes of your own and they disagree with the prose, that is a finding worth more than
  agreement.

---

## RETURN — plain text, as your final message. Do NOT write report files.

Verdict plus every finding with file, line, and what you ran.

**Required fields — an omitted field reads as UNKNOWN, never "nothing to report":**
- **`what_i_could_not_assess`**
- **`files_i_could_not_see`** — every file or region sampled rather than read end to end
- **`execution_proven`** — which claims you RAN vs reasoned about
- **`what_would_confirm_or_refute`**
- **`read_outside_the_quoted_region`** — when you rate a claim, state what you read **outside** the
  lines you quote. Three ratings in this sprint moved when someone finally opened the file — including
  one where the quotations were **exact** and the rating still changed, because the load-bearing fact
  sat 350 lines above the quoted region. **An excerpt is a frame, and a frame chosen by the person
  making the claim will tend to contain the evidence for it.**

**Say what THIS lane found, in your own name** — never "the lanes found." A later disclosure depends
on per-lane attribution, and a conductor already shipped one false sentence by rounding one lane up to
all lanes.
