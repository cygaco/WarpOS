# QUALIFYING LANE Q2 — adversarial. Can a false custody claim still pass? Artifact-only brief.

## THE ONE QUESTION

**Can you author a custody claim that `engine/CUSTODY.md`'s lint ACCEPTS and that is FALSE?**

That is the whole assignment. The lint exists so a shipped document cannot lie about what the code
guarantees. Your job is to make it lie.

## WHY THIS BRIEF NAMES NO TECHNIQUES

It would be easy to hand you a list of evasion shapes to confirm. That is exactly what this sprint has
learned not to do: on an earlier round, a brief named the symbol that supposedly proved a claim, and
**three lanes on three different providers each verified that symbol and each confirmed a claim that
was false.** The lane that had not been told where to look found the defect.

So this brief gives you the artifact and the question, and nothing else. **If you could satisfy this
brief by grepping a string it handed you, it would be broken.** Choose your own attack surface.

**Corollary you should apply to yourself:** whatever set of attacks you construct, you chose it. Say
how you chose it (below).

## THE SURFACE

**Repo:** the `vlad` project's `engine-lane` worktree — absolute path in the dispatch envelope above.
**Package root:** `engine/`. **Pinned commit:** given in the dispatch envelope.

The document is `engine/CUSTODY.md`; the mechanism that polices it is in `engine/scripts/checks/`.
Find it yourself and read it. **Read files freely — that is your primary instrument.**

**Read-only in the repo.** Build attack artifacts in your own scratch space. Never commit, never edit
the repo, never add an allowlist entry, never disable a check to observe what happens.

**Do not spend a tool call confirming the commit sha by `git log`** — it is given, and a lane on this
sprint died in 11 seconds on exactly that instruction. If you want to confirm the tree, do it by
**content**: read the mechanism and check it looks like what you were told you have. If it does not,
say so and stop.

## WHAT "FALSE" MEANS HERE

A claim is false if the document asserts a guarantee the code does not provide. Two distinct routes,
and both count:

1. **The lint does not fire on text that should trip it** — you get a false claim past the checker.
2. **The lint fires, but the claim it permits is still untrue of the code** — the mechanism polices a
   narrower thing than the sentence claims.

Route 2 is the easier one to miss and it is where this sprint's history lives.

## HOW TO REPORT AN ATTACK

For each: **the exact input you constructed**, where you put it, and **what happened when you ran it**
— as an exit code or as matched/not-matched, **never as a colour word.** (A helper in this sprint uses
a boolean meaning *matched*, so its "RED" means *caught* — the inverse of a test suite's habit. Bare
colour words are ambiguous here and are barred.)

**A security finding without a reproduction is a hypothesis. Label it as one.** A hypothesis honestly
labelled is valuable; a hypothesis phrased as an observation is the defect this sprint exists to end.

**If you cannot execute in your environment, say so and return that.** A previous lane returned *"I
could not access local text files … I did not substitute unverifiable conclusions for source
evidence"*, and **that was the correct return.** An honest "I could not run it" is usable. A verdict
reasoned from a brief rather than from bytes is not.

## RETURN — plain text, final message. No report files.

A verdict, plus every finding with its reproduction.

**Required fields — an omitted field reads as UNKNOWN, never "nothing to report":**

- `what_i_could_not_assess`
- `files_i_could_not_see` — every file or region sampled rather than read end to end
- `execution_proven` — what you RAN versus reasoned about, separated plainly
- `what_would_confirm_or_refute`
- **`read_outside_the_quoted_region`** — when you rate something, what you read OUTSIDE the lines you
  quote. Ratings on this sprint moved when someone finally read past the excerpt — including one where
  the quotations were exact and the rating still changed, because the deciding fact sat hundreds of
  lines away.
- **`derivation_rule`** — **required for any attack SET you construct.** Emit the members item by item,
  state the rule by which you derived them (a stated property, or an exhaustive extension over an
  explicitly stated finite domain), and state **what that rule does NOT reach.** "I tried a range of
  shapes" is not a frame, and an attack set without its derivation rule cannot support any claim about
  what remains unreachable. **This sprint exists because a coverage claim outran its mechanism** — do
  not repeat that in your own report.

Say what **this lane** found, in your own name — never "the lanes found". If you believe an earlier
finding or a premise here is wrong, say that too, with evidence.

**There is no reward for a clean report.** A clean report you cannot evidence is worse than a messy one
you can.
