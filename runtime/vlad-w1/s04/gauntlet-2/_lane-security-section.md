---

# YOUR LANE — `security_claude_hunter` (BINDING)

Scope: **attack the controls.** You are the lane that tries to make the mechanisms fail, in a package whose
entire subject is a held credential and the claims made about it.

Worktree `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine`, commit `6a105f2`. Paths relative to `engine/`.

## The distinction that decides how your findings are graded

**"This CONTROL is defeatable" and "this PACKAGE leaks" are different claims.** If your bypass needs a file
that does not ship, or a caller nobody makes, you have proven the first, not the second. Say which, in
every finding. A finding that blurs them cannot be applied by α at the close, and this is the close.

**A finding fires a criterion only if it is execution-proven against a green gate.** Reasoned findings are
welcome and must carry `execution_proven: false`. Do not blur them — at a qualifying close the difference
decides whether the finding can fire a criterion at all.

## Attack these specifically

1. **The args/env door on `auditedSpawn`** (`src/spawn-shim.js`). The diagnostic run established it holds
   under a plain array with an index getter and a stateful `toString` (`getterCalls=1`,
   `toStringCalls=1` — read once, no TOCTOU re-read). Bundle I then changed how the swept population is
   derived (`names` coerced to primitives once, in `src/env-scrub.js`) and annotated the `Array.isArray`
   gate at the top of the D1 path as **LOAD-BEARING**. **Re-attack the door as it stands now** — a change
   to how a population is derived is exactly where a closed door reopens. Try array-likes, proxies,
   prototype-polluted shapes, getters that count, and values that stringify differently on the second read.
2. **The scrub's ordering guarantee.** `src/env-scrub.js` captures then scrubs; the entries claim that in
   either process shape (`src/server-entry.js` as entry, or `driver/host-free-driver.js` importing it)
   nothing that could inherit the secret runs before the scrub **that process actually performed first**.
   **Attack the ordering**, not the wording: find something that evaluates first and can see the value.
3. **The transform** (`canonicalizeClaimText` in `scripts/checks/custody-claim-lint.js`). It is a control
   over what a document may claim. Two directions: (a) author a claim that SHOULD be refused and get it
   past the transform; (b) find a legitimate authoring the transform now falsely REFUSES — an
   over-refusing gate pushes authors to route around the lint, which is a security failure of a different
   shape. The confusable fold is an **enumeration over a named alphabet set** and the comma separator is
   deliberately not folded; both are disclosed, so a finding there fires a criterion only if you
   execution-prove something the disclosure does not cover.
4. **The ban J added and the witness it ships.**
   `engine/test/fixtures/J-expected-bypass/reflective-launcher.js` is a **standing EXPECTED-BYPASS witness**
   — it is SUPPOSED to get past `spawn-env-allowlist.js`, and its test asserts the scanner finds nothing
   there. **Do not file it as a defect and do not fix it.** Do attack around it: is there a route that is
   both open AND reaches a shipped path? And judge whether the prose describing what the enforcer covers is
   true given that witness exists.
5. **The credential-shaped-value refusal in `auditedSpawn`** (command and args at spawn time). Try to get a
   secret-shaped value to a child by a route that refusal does not see.

**Never put a real credential anywhere.** Use labelled placeholders, as the shipped witness does. If you
create any probe file, delete it and confirm `git status --porcelain -- engine/` is empty before you emit.

## Read the prose too, where it is a security claim

A false sentence about a control is a security defect in this package, not a documentation nit. **S4-1 may
never be satisfied by mechanism evidence** — if a paragraph says a class is closed and you can open it, that
is your finding, and it is a HIGH regardless of how green the gates are. Give the fix attempt's new prose
(bundles G, H, J, K, L) an adversarial reading: every bundle in this attempt authored claims, and the
diagnostic run's organising finding was that **all six of its HIGHs were false sentences, not broken
mechanisms.**

Note this precedent honestly rather than as encouragement: in the diagnostic run, **two of six HIGHs turned
out to be artifacts** of a lane reasoning from a read window that excluded the refuting code. **Before you
file, read the whole file around the code you are judging**, not the region you first landed in. If you
still could not see something, put it in `files_i_could_not_see` — that field is reconciled against your
findings before any of them is graded.

## What you own

Deciding lane on the **mechanism** half of **S4-2** and contributing on **S4-1** wherever a shipped sentence
describes a control. Also judge **S4-5**'s either-or: the driver entry's scrub either gained a
runtime-observable consequence, **or** the header states plainly that it is load-bearing only at text/AST
level. **Silence satisfies neither** — check which one is actually there and say so.

Say `cannot-assess` where you could not look; silence reads as a pass and it is not one.
