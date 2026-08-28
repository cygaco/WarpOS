---

# YOUR LANE — `backend-reviewer` (BINDING)

Scope: **code quality of the engine and its enforcers.** Traceability and shipped-copy integrity belong to
the qa lane; do not duplicate them. Your question is whether the CODE does what it says, and whether the
mechanisms introduced this round are sound rather than merely green.

Worktree: `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine`. All paths below are relative to `engine/`.

## DISPATCH NOTE — read this, it is about you

This lane was lost to a truncated mid-thought return TWICE in this sprint. Both times it had done substantial
real work; both times it read downstream as a dead lane and none of that work counted. **Budget your run so
that emitting the JSON is never the thing you run out of room for.** If you are going long, stop
investigating and emit what you have with honest `what_i_could_not_assess` entries. A narrower verdict that
arrives beats a thorough one that does not.

## What changed this round, in your scope

Four mechanisms landed. Review each as CODE, not as a claim:

1. **A second blanking policy on the shared lexer** — `scripts/checks/lib/strip-comments.js` gained an
   export that blanks string and template bodies as well as comments, and the invocation classifier and
   import-graph walk in `test/env-scrub.test.js` now route through it. The bug it closes: call-shaped text
   inside a comment satisfied a proof. Questions worth running: does the new export actually preserve length
   and position as the old one promises? Does blanking string bodies BREAK any consumer that legitimately
   needs the string's text — the import-specifier extractor in particular, which must still read real
   specifiers? Is there a shape where the new policy blanks REAL CODE (a mis-lexed span), which would fail
   the proof OPEN by hiding a real call? Both directions matter and only one of them is loud.

2. **A completeness rule in the claim lint** — `scripts/checks/custody-claim-lint.js` now DERIVES the
   bindable paragraph population from `CUSTODY.md`'s own structure each run instead of reading a hand-kept
   list. Questions: what exactly is the derivation's shape predicate, and what paragraph shapes fall outside
   it? A derivation that silently fails to see a paragraph is worse than a hand-kept list, because the list
   at least fails visibly. Does it fail closed when the file is malformed or when derivation yields zero?
   Can a paragraph be authored in a form that is user-visible but structurally invisible to the derivation?

3. **Full-history re-scrub** — `src/env-scrub.js` now deletes every previously-captured name on every call,
   not just the names in the current call, and `src/spawn-shim.js`'s choke-point comment claims this makes
   the guarantee a property of the MECHANISM rather than of the call sites. Questions: is that true as
   implemented? What is the cost and the re-entrancy behaviour at the spawn choke-point now that every call
   walks a growing set? Is there any path where a name enters the captured set but is not deletable, or
   where deleting a previously-captured name is WRONG? The claim moved from INSTANCE to CLASS this round —
   CLASS claims are the ones this sprint keeps getting wrong.

4. **Scan-root handling in the tautology lint** — `scripts/checks/no-tautological-assertions.js` had an
   environment variable that could redirect its scan root while composed into `check:ship`. Verify what it
   does now, and that a redirect cannot widen or escape, and that an absent or empty root is still an
   explicit non-zero rather than a quiet pass.

## The standing question that decides S3 in your scope

The A1 invocation assertion's guard is `if (canSpawn && !invokes)`. A previous round found this
**structurally exempts `src/server-entry.js`**, because its graph reaches only builtins classified safe, so
`canSpawn` is false for it and it can never be flagged on its own account — its coverage was incidental
rather than asserted. Check what this round did about that: was the classification widened so server-entry is
genuinely covered, or was the exemption merely disclosed? Either can be acceptable; a third possibility —
that it was neither fixed nor disclosed — is a finding. Verify by running, not by reading the comment.

Then attack the walker itself. It is a regex-based static import-graph walker with disclosed residuals
(aliased imports, re-bound references, confidently mis-resolved specifiers). Those are disclosed; a
re-confirmation of a disclosed residual is not a new finding. What IS a finding: a shape the walker
classifies wrongly that is NOT in its disclosed set, or a disclosed residual that turns out to be
INSTANTIATED on the shipped graph rather than theoretical. That exact distinction — a generally-disclosed
residual that was actually live on the shipped hot path — is what defeated the control last round.

## Evaluation-order claims

Both entry files carry comments about which modules evaluate before the scrub call. This class of sentence
has now been wrong twice. If those comments changed this round, verify them **by execution** — a
`node:module` load hook that instruments module bodies gives true evaluation order — under BOTH process
shapes: each entry as the process entry point, and each entry imported by the other. A sentence that is true
under one shape and unqualified is false.

Also check whether whatever standing test pins those sentences pins the WHOLE sentence or only a fragment.
A fragment-pin is how a false clause shipped with nothing asserting it last round.

## What you own on the S-criteria

You are a contributing lane for **S2** (source-comment claims and enforcer-behaviour claims) and **S3**.
Where you cannot reach S1, S4 or S5 within your scope, say `cannot-assess` — do not guess, and do not let
silence read as a pass.
