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
2. **Falsifier RF-M1, pre-written — claimed over SEVEN, not eight.** Removing the emphasis fold from the
   shared transform turns **seven** R3 near-miss authorings GREEN. **Strikethrough was ALREADY RED
   as-is**, so the fix closes seven by design and one by accident. β wrote the seven-not-eight bound
   into S5-3; a test or a sentence claiming eight is a granularity falsehood and fires **S5-2**.
   Mutation logic in the committed test; no-op⇒FAIL guard.
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

1. **Widen the fold over a domain DERIVED FROM THE MODULE'S EXPORTED TOKENS AND KEYWORDS — not from
   "the letters `Ceiling` and `Asserted` need".** **β row 317 flagged my original wording as the class
   one more time, and it was right.** Measured: the exported tokens are `PROVEN` and
   `ASSERTED — NOT VERIFIED`, which with the `Asserted`/`Ceiling` keywords give a 22-letter alphabet.
   The fold covers `ACDEFINOPSTVeis` and is **missing `R d g l n r t` — seven letters.** Scoped to
   `Ceiling`+`Asserted` alone it would be missing only `d g l n r t` — **six** — so capital `R`,
   contributed by `PROVEN`/`VERIFIED`, would have been left unmapped while the emitted sentence read as
   honest. **An emitted set over a domain defined too narrowly is a false sentence one level down.**
   Read the domain from the module's own exports at build time, exactly as the battery reads the token
   "from the module's own export, never guessed".
   **Do NOT vendor a confusables table this sprint** (β, scope `recommended`): a vendored table has its
   own version and curated ceiling and merely relocates the discipline. If one is vendored later,
   **S5-2 applies unchanged — name the version and the ceiling.**
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

> **BUNDLE P'S ACCEPTANCE SHAPE IS S5-2(a)(b)(c). Every sentence you write is judged against all three,
> and S5-2 is scoped to EVERY coverage claim on the shipped surface — INCLUDING ENFORCER COMMENTS, not
> just `CUSTODY.md`.** β confirmed the class is NOT exhausted by the three known instances: the same
> shape is available in every `Proof scope` line, every A1–A8 paragraph and every enforcer header.
> **The sweep is the criterion** — there is no separate machinery and no list of three sites to fix.
>
> - **(a) EMITTED, never hand-typed.** Where the mechanism has an enumerable extension — a fold map, a
>   prefix set, a bound-paragraph key set — the coverage set in the sentence comes from that data.
> - **(b) THE FRAME NAMES THE UNIT.** Say *letters*, *prefix shapes*, *paragraph keys* — the unit the
>   mechanism actually enumerates. **Do not round up** to "scripts", "all", "the class", and **do not
>   round to a count**. This is the half that failed: β's S4-1a sentence had the DATA right and the
>   FRAME wrong.
> - **(c) CLOSURE IS ALMOST NEVER ADMISSIBLE.** A closure claim is allowed only if the mechanism closes
>   by a **named property** (a Unicode property, a structural invariant) or by an **emitted exhaustive
>   extension over an explicitly stated finite domain**. Otherwise **state the probed sample and refuse
>   the closure word.** A sample can prove a class OPEN; it can never prove one CLOSED.

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

### Bundle P, task 5 — DISCLOSE the un-audited surfaces (β row 318, amended S5-2 scope)

S5-2 applies **in full** to what this sprint authors or edits and to **all of `CUSTODY.md`**. For shipped
coverage claims in files the sprint does **not** touch, the requirement is **disclosure, not repair**.

State on the shipped surface that **`src/env-scrub.js`, `src/model-seam.js`,
`driver/host-free-driver.js` and `src/server-entry.js` carry custody prose no lane has read end to end**,
and that their coverage claims are therefore un-audited.

**This disclosure is itself a coverage claim, so S5-2(b) governs its frame** — β said so explicitly:
*"This is not 'we did not look, so it passes'."* Name the four files; do not round to "some files" or
"the rest of the package", and do not imply an audit that did not happen.

**Provenance of the four-file list, verified by the conductor rather than asserted** (β flagged it as
ε's, unchecked, and load-bearing in the rule): the **qa lane** names exactly those four verbatim in
`what_i_could_not_assess` — *"src/env-scrub.js, src/model-seam.js, driver/host-free-driver.js and
src/server-entry.js carry substantial custody prose in comments that I sampled rather than read end to
end."* The **backend lane** independently corroborates two of them (`env-scrub.js` header-and-greps only;
`server-entry.js` greps and the RF-7 region only). The **security lane does NOT say it** — see the
correction in the round record. The list is right; the conductor's original framing of it was not.

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
      discarded). Zero files mutated. **This is DESIGN evidence and does NOT discharge S5-4** — see below.
- [x] **β's release rule MINTED before any result existed** — row 317 `2f8c15e6`, S5-1…S5-7, ONE attempt,
      no exception clause. Carried into the tracker and `BETA-CONSULT-design-to-build.md`.

## S5-4 IS A LANE OBLIGATION — carried into the gauntlet briefs, not dischargeable here

**The design battery above does not discharge S5-4 and must never be cited as if it did.** β:

> **S5-4 — BATTERY RE-RUN BY A LANE, AGAINST THE PREDICATE AS BUILT.** Not by ε; population including
> every newly authored or edited paragraph; controls first. **The design battery is design evidence and
> does not discharge this.**

Every gauntlet brief written for this sprint must carry S5-4 as an owed obligation on the lane that holds
it, with the population defined as **every newly authored or edited paragraph** — not the twelve prefixes
and three homoglyphs the design battery happened to probe. Controls first; if the controls do not fire,
the lane reports `cannot-assess`, never a pass.

**`falsification_attempts` is NOT a criterion** (β made it a DoD item and standing discipline
deliberately — it is an envelope/process artifact, not a property of the shipped surface). It stays
mandatory in every envelope and is graded as process, never as a release gate.

## Diagnostic-lane SECONDARY objective (β row 318)

Point the diagnostic lanes at `src/env-scrub.js`, `src/model-seam.js`, `driver/host-free-driver.js` and
`src/server-entry.js`. **Findings there are free information for the successor and CANNOT grow this
sprint's scope or fire its gate** — say that in the briefs, so a lane neither suppresses a finding nor
inflates one into a criterion.

## The close must state the class's status honestly (amended TERMINAL)

Whatever the outcome: **this sprint fixes three known instances of a class whose size is unknown**, with
the four un-audited shipped surfaces named and carried to the successor. **A close that reads as "the
coverage-granularity class is closed" is the class one layer out, in the sprint that exists to end it.**
- [x] **Falsifiers pre-written** — RF-M1, RF-M2, RF-N1, RF-O1, RF-Q1, plus the atomicity observation.
- [x] **ED-363 environment block** stated at the top of the spec.
- [x] **Bundles ≤4 verified-run tasks each**, ordered so `CUSTODY.md` never has two editors.
- [ ] **β mints the fresh S5-n rule** — OWED at design→build, before any result exists.
- [ ] **Operator authorization for the build** — OWED, explicit and in-session.

## The record-trust gate

Nothing in this sprint adds a reader that trusts a record/field to gate an irreversible action; the
work is a text predicate and its prose. The gate is therefore **not applicable** and is recorded as
considered rather than skipped.
