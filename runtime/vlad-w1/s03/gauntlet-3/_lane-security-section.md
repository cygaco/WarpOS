---

# YOUR LANE — `security_claude_hunter` (BINDING)

Scope: **attack the custody boundary.** You are the lane that tries to make a real child obtain a real
credential, and the lane that tries to make a green gate lie.

Worktree: `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine`. All paths below are relative to `engine/`.

## DISPATCH NOTE — read this, it is about you

This lane was lost once in this sprint to a truncated mid-thought return after roughly 66 tool calls. It had
done real work and it counted for nothing. **Budget so that emitting the JSON is never what you run out of
room for.** If you are going long, stop and emit with honest `what_i_could_not_assess` entries.

## THE INVARIANT YOU ARE BRIEFED TO FALSIFY

The sprint's central claim is:

> **No control in this package is inert. Every custody control fails when the thing it protects is removed,
> and no shipped graph can reach a child process without the credential scrub having actually run.**

**Your job is to prove that false.** Not to confirm it. Assume it is false and hunt for the shape that shows
it, because the last two rounds each found one and both times it was one layer out from where the fix landed.

You are deliberately NOT being given a list of suspected weak points, because a lane briefed on a path list
inherits the brief's blind spots. You get the invariant and the history; the search is yours.

## History you should have, because it tells you the SHAPE of this codebase's failures

- Round 2: the invocation control was INERT. `src/bootstrap.js` carries `initCredentialCustody(...)` inside a
  prose comment; the classifier matched raw source; bootstrap.js was on the mandatory hot path of both
  entries; so "a real call exists somewhere reachable" was pre-satisfied by a comment for every shipped
  graph. The bypass was an entry that imported bootstrap.js WITHOUT naming the scrub binding and reached
  child_process dynamically: the suite stayed green and a real child printed a real credential.
- The fix this round routes those matchers through a lexer that blanks comment AND string bodies, and commits
  that bypass as a fixture asserted to go RED.
- The pattern across three rounds: **a control built, verified in isolation, and not wired to the surface it
  protects.** Three instances in the predecessor sprint, and the fourth was inside the fix for the third.

So the question is not "does the old bypass still work" — it is **"what is the NEXT shape of the same
class?"** A lexer closes text-level confusion between code and prose. It does not make a text matcher
structural. Ask what a text matcher still cannot see.

## Grading discipline, which matters as much as finding

- A bypass that requires ADDING a file that does not ship proves the **control is inert (S3)**, not that the
  package leaks (**S1**). Last round's lane graded its own strongest finding down for exactly this reason and
  it was the right call — inflating it would have corrupted a criterion that was honestly met. Do the same.
- **S1 fires only on an execution-proven leak against a green gate**, on a path that actually ships.
- A finding in a class that is already ceiling'd AND disclosed is a re-confirmation, not a new finding —
  unless you execution-prove it against a green gate.
- Where you reason rather than run, mark `execution_proven: false` and say what you would have needed to run
  it. Do not launder inference into observation.

## S1 must be RE-ESTABLISHED, not cited

The rule is explicit that citing an earlier sprint does not satisfy S1. So:
- Re-run the committed TOCTOU battery and the earlier attack set. Confirm each attack asserts REFUSED **and**
  that its paired raw control actually proves an unguarded child DOES obtain the value. A refusal test whose
  control does not demonstrate the unguarded case proves nothing about the guard.
- Write at least one attack that is NOT already in the suite. The lane before you filed a novel carrier — a
  secret split across two benign-named env values, cut before the shape matcher's recognisable prefix, which
  the child reconstitutes — and correctly rated it LOW because it is not env-inheritance and needs a caller
  already holding the plaintext. That is the standard: novel, run, and honestly graded.

## The mechanism that changed under you this round

`src/env-scrub.js` now deletes every PREVIOUSLY-CAPTURED name on every call, not only the names passed in the
current call, and `src/spawn-shim.js`'s choke-point comment now claims this makes the guarantee a property of
the MECHANISM rather than of the call sites — a CLASS claim. CLASS claims are what this sprint keeps getting
wrong. Attack it: is there a name that enters the captured set but escapes deletion, a realm where the
captured set does not exist, an ordering where a credential is provisioned between the capture and the spawn,
or a caller shape that defeats it? And if the claim is true of the mechanism but the COMMENT overstates what
that buys a user, that is an S2 finding you should file even though it is not a leak.

## Rules of engagement

Mutate freely; restore completely; confirm `git status --porcelain` is clean at the end and say so. If you
create a probe entry or fixture, remove it — a leftover scratch file in this tree has already broken the
suite once this sprint by tripping the raw-child-process scan.

**Redact any credential-shaped literal in your report.** Use a placeholder. The decoys are synthetic and
never real secrets, but this repo's secret-guard refuses the shape and it is right to.

## What you own on the S-criteria

You are the deciding lane for **S1** and a contributing lane for **S3**. Where you cannot reach S2, S4 or S5,
say `cannot-assess` — silence reads as a pass and it is not one.
