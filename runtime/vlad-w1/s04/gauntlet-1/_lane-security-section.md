---

# YOUR LANE — `security_claude_hunter` (BINDING)

Scope: **attack the custody boundary.** You are the lane that tries to make a real child obtain a real
credential, and the lane that tries to make a green gate lie.

Worktree `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, commit `b9b8df3`. Paths
relative to `engine/`.

## THE INVARIANT YOU ARE BRIEFED TO FALSIFY

> **No control in this package is inert, and no shipped path can reach a child process with a credential
> the scan did not see. A caller cannot influence what the wrapper normalizes, and a claim cannot be
> inverted under green gates.**

**Prove that false.** Assume it is, and hunt for the shape that shows it. You are deliberately NOT given a
list of suspected weak points — a lane briefed on a path list inherits the brief's blind spots. You get the
invariant and the history.

## History — it tells you the SHAPE of this codebase's failures

Every round for three gauntlets, the repair produced a new defect **one layer out** from the thing it fixed:

- A control was **inert**: call-shaped text in a comment pre-satisfied its "a real call exists" half, so a
  bypass entry reached `child_process` with the suite green and a real child printing a real credential.
- The fix for that (a byte-for-byte claim bind) then **pinned two execution-falsified sentences**, so
  `check:ship` required a proven-false sentence to be present.
- The bind's own predicate **matched only an exact em-dash**, so five near-miss authorings shipped green.
- The lane before you defeated `auditedSpawn` through **caller-controlled `args.map`** on an `Array`
  subclass: the scan called `String()` once on a benign value, Node called `toString()` again inside
  `spawn()` on the secret, and the child's argv carried it while every gate was green.

**This build closed all four.** So the question is not "do the old bypasses still work" — it is **"what is
the NEXT shape of the same class?"** A transform closes a spelling family; it does not make a text matcher
structural. An indexed loop removes `.map` as a substitution point; ask what other property the caller still
controls.

## S4-2(c) is the mechanism most worth attacking

`canonicalizeClaimText` is a **named canonical transform** — case-fold, whitespace-collapse, dash-class
fold, compared on the rendered form. β refused a variant enumeration precisely because it closes a sample
rather than a class. **So: find a spelling the transform does not fold.** Homoglyphs, zero-width characters,
combining marks, alternative Unicode normalization forms, RTL marks, a full-width colon. If a status token
renders identically to a reader but does not canonicalize identically, the conflation check is defeated and
a claim can ship under the wrong PROVEN/ASSERTED label.

Note the doctrine that applies here: **normalize on match, and prefer NFKD over NFKC** where a decision
turns on visual equivalence.

## S4-1's boundary, which no mechanism can defend

**A green bind, a green lint and a green battery are not evidence that a sentence is TRUE.** If you find a
claim that is false while every gate is green, that is an S4-1 finding regardless of how healthy the
mechanisms look — and it is the finding this sprint family has been unable to stop producing.

## Grading discipline — as important as finding

- A bypass requiring a file that does not ship proves the **CONTROL is defeatable**, not that the package
  leaks. Say which. The lane before you graded its own strongest finding down for exactly this reason and
  was right to.
- A finding in a class already ceiling'd AND disclosed is a **re-confirmation**, not new — unless you
  execution-prove it against a green gate.
- Where you reason rather than run, mark `execution_proven: false` and say what you would have needed.

## Rules of engagement

Mutate freely; **restore completely**; confirm `git status --porcelain -- engine/` is empty before you emit
and say so. **Remove every probe file you create** — a leftover scratch file has broken this suite once
already by tripping the raw-child-process scan. **Redact any credential-shaped literal** in your report;
the decoys are synthetic but the repo's secret-guard refuses the shape and is right to.

**This lane was lost once to a truncated mid-thought return after ~66 tool calls, and that work counted for
nothing.** Budget so emitting the JSON is never what you run out of room for.

## What you own

Deciding lane for the leak question and contributing on **S4-2** and **S4-5**. The qa lane owns S4-1's full
sweep and the backend lane owns S4-2(d)'s battery re-run — do not duplicate either; anything you trip over
in passing is worth reporting anyway. Say `cannot-assess` where you could not look.
