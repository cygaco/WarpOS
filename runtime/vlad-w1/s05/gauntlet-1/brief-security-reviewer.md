# DIAGNOSTIC GAUNTLET — SECURITY REVIEWER — S-VLADW1-05

You are the **security-reviewer** lane. Scope: the **custody / credential surface** and anything an
adversary or an accident could use to make a false custody claim true-looking.

**⏱ HARD BUDGET.** Your route is bounded. **Write your envelope BEFORE optional depth** — a partial
review returned beats a complete one killed. Mark unreached work `not-reached`. Do not polish.

**THIS IS THE DIAGNOSTIC ROUND.** Findings are **free information** — they cost this sprint nothing
and inform one fix attempt. **There is no reward for a clean report.** A clean report you cannot
evidence is worse than a messy one you can.

---

## THE SURFACE — pin it first

**Repo:** the `vlad` project's `engine-lane` worktree (absolute path supplied in the dispatch envelope), package root `engine/`.
**Pinned commit: `6c64021`** — **given to you, not for you to verify by command.**

**READ FILES FREELY — that is your primary instrument.** Use whatever your toolchain gives you to read
source. **Do not spend a tool call on `git log` to confirm the sha**: it is given above, one lane
already died in 11 seconds on that single instruction, and it is not worth a permission prompt your
route may not be able to answer.

**Corroborate the tree by CONTENT instead:** `engine/scripts/checks/custody-claim-lint.js` should
contain `EMPHASIS_FOLD_PATTERN`, `tokenAlphabetDomain` and a `TRANSFORM_DESCRIPTION_KEY` entry. If any
is missing, the tree is not what you were told — **say so and stop.**

⚠️ **IF YOUR ENVIRONMENT DENIES YOU FILE ACCESS, SAY SO AND RETURN THAT.** A previous lane on this
brief returned *"BLOCKED / NOT ASSESSED — the lane could not access local text files … I did not
substitute unverifiable conclusions for source evidence"*, and **that was the correct return.** An
honest "I could not read the source" is a usable result. A security verdict reasoned from a brief
rather than from bytes is not, and will be treated as a finding against the lane.

**⚠️ SAY WHAT YOU COULD NOT VERIFY.** Because you cannot execute, several things in this brief are
**assertions you are receiving, not facts you can check**: the sha, any test result, any claim that
something "was observed". **List every such item in `what_i_could_not_assess`.** A finding you reason
to from source is worth reporting; a finding that silently depends on an unverifiable assertion is
not. Distinguish them.

**Read-only** — no commits, no edits, no files written.

---

## WHAT THIS SPRINT CHANGED, and why a security lane should care

The sprint hardened a **claim lint** — a mechanism that decides whether a custody claim in
`engine/CUSTODY.md` is bound to, and consistent with, the code it describes. It:
- folded markdown emphasis into the shared canonicalisation so `**ASSERTED**` cannot plant a false
  status token (bundle M);
- widened the lead-in prefix class so heading/table/HTML/quote-prefixed claims are no longer silently
  skipped (bundle N);
- case-closed a homoglyph fold and made its coverage set **emitted** rather than hand-typed (bundle O);
- rewrote the prose so its coverage claims match the mechanisms (P / P′ / P″);
- bound the transform's own description paragraph (Q).

**The security question is not "is the lint pretty."** It is: **can a false custody claim still be
made to pass?** The lint exists so a shipped document cannot lie about what the code guarantees.

## THE ATTACKS WORTH RUNNING

1. **Can you author a custody claim that the lint accepts and that is FALSE?** That is the whole
   game. Try: emphasis shapes the fold does not reach (mid-word is a *disclosed* open residual —
   confirm it, and look for undisclosed siblings); homoglyph scripts outside the fold (Coptic, Deseret
   and Lisu are disclosed as unfolded — confirm, and find others); prefix shapes outside the new class;
   whitespace, zero-width and combining-mark tricks; anything that survives NFKD.
2. **Can you make a bound paragraph drift without detection?** Q disclosed that Rule 4b is a substring
   check, so **text appended after the bound span is invisible**. Confirm that, then push: how much
   meaning can be changed by appending only? Can a true bound sentence be turned false by what follows
   it?
3. **The opt-out.** `resemblesBindableLeadIn` deliberately opts out of the emphasis fold
   (`{ emphasisFold: false }`). **Is that opt-out abusable** — can input shaped for the opt-out path
   evade the token comparison on the other path?
4. **The credential surface itself.** `engine/src/env-scrub.js`, `src/model-seam.js`,
   `driver/host-free-driver.js`, `src/server-entry.js` carry custody prose and real behaviour. **A
   prior lane read them statically and found 30 false claims and 28 it could not determine** — see the
   `S06-Fnn` table in `CUSTODY.md`. **Those are DISCLOSED and this sprint does not repair them: they
   are not your target, and re-listing them is not a finding.** But if you can show one of the *28
   cannot-determines* is actually a live security defect — by execution — that is a real finding, and
   it is exactly what a static read could not do.
5. **`S06-F01` specifically**, as a worked example of the class: `model-seam.js` L446-452 claims an
   unrecognized auth mode *"FAILS CLOSED — refused, never silently defaulted"*, but an explicitly empty
   string falls through `||` to `DEFAULT_AUTH_MODE`. It is rated MEDIUM because the default is a fixed
   constant pointing at subscription, so **no input silently selects the api-key-bearing mode** — and
   it is recorded as **currently unreachable in production** (`createModelSession` has no production
   caller). **If you can refute either of those two mitigations, say so** — that would move the rating,
   and both were established by reading rather than by running.

## WHAT NOT TO SPEND TIME ON

- Re-reading the four files end to end — already done by lane `d-mtew0q7m-70d95fa2`; the finding table
  is in `CUSTODY.md`. Cite it, do not reproduce it.
- Re-deriving the near-miss battery — the qa lane owns S5-4.
- Style, naming, test coverage percentages.

---

## RETURN — plain text, as your final message. Do NOT write report files.

A **verdict** plus every finding: file, line, the exact input you constructed, and **what happened when
you ran it**. A security finding without a reproduction is a hypothesis; label it as one.

**Required fields — an omitted field reads as UNKNOWN, never "nothing to report":**
- **`what_i_could_not_assess`**
- **`files_i_could_not_see`** — every file or region you sampled rather than read end to end. Be exact:
  a later finding touching a region on this list gets re-verified before it is graded.
- **`execution_proven`** — which claims you RAN vs reasoned about. Separate them plainly.
- **`what_would_confirm_or_refute`**
- **`read_outside_the_quoted_region`** — when you rate a claim, state what you read **outside** the
  lines you quote. Three ratings in this sprint moved when someone finally opened the file — including
  one where the quotations were **exact** and the rating still changed, because the load-bearing fact
  sat 350 lines above the quoted region. **An excerpt is a frame, and a frame chosen by the person
  making the claim will tend to contain the evidence for it.**

**Say what THIS lane found, in your own name** — never "the lanes found." A later disclosure depends on
per-lane attribution, and a conductor already shipped one false sentence by rounding one lane up to all
lanes. **If a previous lane's finding is wrong, say that too** — two builders refuted figures marked
"verified" today and both were right.

---

## ⚠️ TWO BINDING ADDITIONS (β rows 331 / 332)

**1. REPORT BEHAVIOUR, NEVER A COLOUR WORD.** The sprint's design battery uses
`R = (b) => b ? "RED" : "GREEN"` where the boolean is *the token was MATCHED* — so in that file
**RED = caught, GREEN = evades**. A test suite's habit is the opposite (mutate the code, the *test*
goes red). **The two conventions are inverted**, and an earlier draft of a sibling brief had it
backwards. Write *"input X is not matched by `containsStatusToken`"* or *"the check does not fire"* —
never a bare RED/GREEN.

**2. ANY POPULATION YOU DERIVE IS YOURS, NOT THE CLASS.** If you construct a set of attack inputs,
emit them **item by item**, state the **RULE** by which you derived them (a stated property, or an
exhaustive extension over an explicitly stated finite domain), and state **what that rule does NOT
reach**. "I tried a range of shapes" is not a frame. An attack set without its derivation rule cannot
support any claim about what remains unreachable — and this sprint exists because a coverage claim
outran its mechanism.

**And an assertion needs content.** Normally I would ask you to run the mechanism with and without the
part you are testing. **You cannot execute, so do not pretend to.** Instead: **trace the code path by
reading**, and state your conclusion as a reasoned claim with the lines that support it — then put it
in `what_would_confirm_or_refute` as the run that would settle it. **A reasoned finding labelled as
reasoned is valuable. A reasoned finding phrased as if it were observed is the defect this sprint
exists to end.**
