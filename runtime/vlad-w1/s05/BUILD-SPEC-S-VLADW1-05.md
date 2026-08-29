# BUILD SPEC — S-VLADW1-05 — one transform, both sites

**Status: DESIGN COMPLETE, BUILD NOT AUTHORIZED.** No builder may be dispatched from this document
until the operator gives an explicit in-session word. The 2026-08-28 mandate is recorded as an
**override** of a plan-contract boundary and **does not carry** to this sprint.

- **Surface:** vlad `wt/S-VLADW1-01-engine` @ **`6a105f2`**, package root `engine/`
- **Predecessor ruling:** `runtime/vlad-w1/s04/gauntlet-2/ALPHA-RULING-S4-1-TO-S4-6.md`
- **Design battery, RUN:** `runtime/vlad-w1/s05/NEAR-MISS-BATTERY.md` (harness `run-battery.mjs`)
- **Release rule:** NOT YET MINTED. β mints a fresh **S5-n** rule at design→build, before any result
  exists. **S4-1…S4-6 do not carry over and must never be mis-cited into this sprint.**

---

## ENVIRONMENT BLOCK — read before anything else (ED-363)

**Your process cwd is NOT the target repo.** Dispatch starts you in a WarpOS agent worktree
(`…\WarpOS\.claude\worktrees\<name>`, branch `worktree-<name>`). That is expected. A previous bundle
halted on it, correctly, because its brief asserted a cwd the dispatcher does not establish.

- **TARGET REPO:** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **TARGET BRANCH:** `wt/S-VLADW1-01-engine`, already checked out. Do NOT branch, merge, or push.
- **Package root inside it:** `engine/`

**The command shape that works** — established by a bundle that landed three commits from exactly
this situation:

- Plain, single git commands with `-C` and an absolute path:
  `git -C "C:/Users/Vlad/Desktop/Claude/Projects/vlad/.worktrees/engine-lane" add engine/CUSTODY.md`
- Commit with a message FILE: `git -C "<abs>" commit -F "<abs msgfile>"` — never a heredoc.
- Read and edit by **absolute path**. `node`/`npm`: pass the absolute directory.
- **Never** `cd X && …`. **Never** pipe a git command through `tail`/`head`. **Never** a heredoc commit.

**The worktree-isolation guard refuses command COMPLEXITY, not the cross-repo target.** If a command
is denied, do **not** reshape it to slip past — but DO read the guard's message: if it names a simpler
permitted form, using that form is compliance, not tunneling. If a **plain** `git -C` command against
the target is still refused, STOP and report it with the output; the conductor lands the work.

**Do not edit what you cannot commit.** If you determine you cannot commit at all, make NO edits and
halt — a half-applied claim edit with no canonical edit is the defect this sprint family exists to close.

**Gates, each as its OWN command with its real exit code read** — never `gate | tail -1 && next`:
suite from `engine/` (**floor 366 pass / 0 fail**) and `npm run check:ship` (**exit 0**).
`npm run check:pointers` exits 1 **by design** and is outside `check:ship` — not a defect.

**Never `--no-verify`. Never add an allowlist entry to get past a guard. Never place a credential-shaped
literal anywhere** — labelled placeholders only.

---

## THE STANDING DISCIPLINE — binding on every bundle

1. **Every shipped claim sentence is drafted AFTER the attack that would falsify it.** This includes
   sentences β recommends and α approves. β, on its own recommendation being graded false:
   > *"approval is not a truth check, and β's recommendation is worth exactly nothing against the
   > shipped bytes."*
2. **No coverage claim at a coarser granularity than the mechanism has.** This is the class that failed
   S-VLADW1-04 three times (S4-1a script-vs-letter, S4-1b two-escapes-vs-thirteen, S4-1c
   enumeration-vs-headings). **State the letter set, not "the scripts". State the class, not the count.**
3. **A comment stating an invariant is not an enforcer of it.** If two sites must share a transform,
   something must FAIL when they stop sharing it.
4. **A text matcher cannot distinguish a violation from a description of one.** Prose naming a banned
   pattern trips the ban. Expect it; rephrase rather than suppress.
5. **You may refuse any premise in this spec with evidence.** That is a correct return, not a failed
   bundle. Every "X is missing / X is required" below carries its proof line; if a proof is wrong,
   say so and stop.
6. **Halt at a bundle boundary, never mid-bundle.**

Every envelope carries a **`falsification_attempts`** array with one entry per claim shipped or relied
on. An entry whose `attack_run` is a description rather than something that was RUN is not an entry.

---

## BUNDLES — each ≤4 verified-run tasks

### Bundle M — one transform, both sites (closes S4-2(c))

**allowedFiles:** `engine/scripts/checks/custody-claim-lint.js`; `engine/test/custody-claim-lint.test.js`
**forbiddenFiles:** `CUSTODY.md` (bundle P owns all prose), `src/`, `driver/`, everything else.

1. **Move the emphasis strip INSIDE the shared transform.** Today `canonicalizeClaimText` performs no
   emphasis fold and `flattenForAssertionScan` performs it one function away — so the status-token
   comparison never gets it. **Proof:** design battery R3, 7 of 8 near-misses GREEN as-is. Put the fold
   where every caller receives it, and make `flattenForAssertionScan` consume the shared transform
   rather than re-adding its own strip.
2. **Falsifier RF-M1, pre-written:** removing the emphasis fold from the shared transform turns the
   eight R3 near-miss authorings GREEN. Mutation logic in the committed test; no-op⇒FAIL guard.
   **Note before you write it: strikethrough was ALREADY RED as-is** — do not claim the fix closed it.
3. **Falsifier RF-M2, pre-written:** the two sites cannot silently stop sharing the transform — a test
   that FAILS if `containsStatusToken`'s input is not the shared canonical form. This is requirement 3
   of the standing discipline made mechanical, and it is the whole point of the bundle.
4. **Over-refusal check, both directions:** the three prose controls must stay GREEN, and the disclosed
   comma residual must remain GREEN and unchanged. Report both.

### Bundle N — refuse-not-skip on the lead-in path (closes S4-1b)

**allowedFiles:** `engine/scripts/checks/custody-claim-lint.js`; `engine/test/custody-claim-lint.test.js`
**forbiddenFiles:** as bundle M, plus bundle M's transform edit — N runs AFTER M lands.

1. **Extend the block-prefix strip to every prefix class on the LEAD-IN path**, ATX headings included.
   **Proof:** design battery R1, 12 of 12 prefix shapes GREEN as-is, 12 of 12 RED under the fix.
   Write it as a **class**, not as the twelve shapes probed.
2. **Falsifier RF-N1:** reverting the prefix strip turns the probed shapes GREEN. Guarded.
3. **Over-refusal, load-bearing:** `## Proven` must NOT become a bindable candidate, nor must prose
   using the keyword, nor `**Status:** PROVEN`. A prefix strip that swallows real headings is a worse
   defect than the one it fixes. Battery says GREEN under the fix; prove it again as built.

### Bundle O — confusable coverage stated at the granularity it has (closes S4-1a)

**allowedFiles:** `engine/scripts/checks/custody-claim-lint.js`; `engine/test/custody-claim-lint.test.js`
**forbiddenFiles:** as above.

1. **Widen the fold** — either vendor a Unicode confusables table or extend the map — so the letters
   `Ceiling` and `Asserted` need are reachable. **Proof:** the map reaches 36 of 52 Latin skeleton
   letters; `l`, `n`, `g`, `r`, `t`, `d` are among the missing, and three concrete evasions are
   execution-proven in the battery.
2. **Falsifier RF-O1:** the three proven evasions go RED, and reverting the widening returns them to
   GREEN. Guarded.
3. **Emit the coverage set from the DATA, not by hand.** Whatever the code covers, derive the covered
   letter set programmatically so bundle P's prose cannot drift from it. **This is the structural
   answer to the class that failed the predecessor** — a hand-written coverage sentence is exactly
   what went false three times.

### Bundle P — the prose, drafted after the attacks (closes S4-1a/b/c wording)

**allowedFiles:** `engine/CUSTODY.md`; the canonical copies in `custody-claim-lint.js` for any bound
paragraph edited (atomic, same commit).
**forbiddenFiles:** all mechanism code. P runs LAST, after M, N and O have landed and their coverage
sets exist.

1. **Rewrite the confusable disclosure to state the LETTER SET the code actually covers** — sourced
   from bundle O's emitted set, never hand-typed — and never as "the scripts closed". Delete the
   mistake-vs-attacker calibration framing; it was the false sentence.
2. **Replace every escape COUNT with a named CLASS.** "Two escapes remain" is the defect. A count is a
   property of the day it is read.
3. **Fix the NOT-bound enumeration (S4-1c):** it omits the P1–P4 clause HEADINGS and the section
   preambles, and an inverted P2 heading ships GREEN. Either complete the enumeration or state that
   the class governs and the list is illustrative — **not both**.
4. **Atomicity:** any bound paragraph edited moves with its canonical copy in the SAME commit.
   Observe the atomicity falsifier RED before committing, and report the raw output.

### Bundle Q — bind the transform's own description (successor-carried item 1)

**allowedFiles:** `engine/CUSTODY.md`; `custody-claim-lint.js` `BOUND_PARAGRAPHS`;
`engine/test/custody-claim-lint.test.js` (the clean-fixture builder).

1. **Extend the clean-fixture builder** so a paragraph that is neither `^Ceiling` nor `^A\d+$` can be
   bound. **Proof of why this is needed:** bundle K established that adding a `BOUND_PARAGRAPHS` entry
   today makes Rule 4b demand the text appear in a fixture built only from those two key shapes, so
   the "clean fixture lints clean" test would go RED. K escalated rather than fake it.
2. **Bind the transform's description paragraph**, with its own falsifier.
3. **Falsifier RF-Q1:** editing that paragraph without moving its canonical copy is RED.

---

## DESIGN EXIT CONDITIONS — met

- [x] **Near-miss battery RUN at design over every bound rule, controls first**, including the
      predicate **as it will be fixed**. 7/7 controls RED in both columns; the harness drives the real
      matcher rather than a reimplementation (the first draft's controls went GREEN and it was
      discarded). Zero files mutated.
- [x] **Falsifiers pre-written** — RF-M1, RF-M2, RF-N1, RF-O1, RF-Q1, plus the atomicity observation.
- [x] **ED-363 environment block** stated at the top of the spec.
- [x] **Bundles ≤4 verified-run tasks each**, ordered so `CUSTODY.md` never has two editors.
- [ ] **β mints the fresh S5-n rule** — OWED at design→build, before any result exists.
- [ ] **Operator authorization for the build** — OWED, explicit and in-session.

## The record-trust gate

Nothing in this sprint adds a reader that trusts a record/field to gate an irreversible action; the
work is a text predicate and its prose. The gate is therefore **not applicable** and is recorded as
considered rather than skipped.
