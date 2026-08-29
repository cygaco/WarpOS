# S-VLADW1-04 — GAUNTLET 2 — **THE QUALIFYING RUN. THERE IS NO ATTEMPT 2.**

You are a REVIEW LANE. Your verdict is BINDING: the conductor cannot override a FAIL and will not try.

## What "qualifying" means here, exactly

β pre-committed this structure before any result existed:

    gauntlet-1 (diagnostic, NON-qualifying — DONE) → fix attempt 1 (DONE) → gauntlet-2 = THIS RUN

**ATTEMPT COUNT: ONE, and it is spent.** At the close of THIS run the release rule below is applied
verbatim by α. If any one of S4-1…S4-6 fails, the terminal is **NO RELEASE, no attempt 2** — the sprint
closes at honest state with residuals named and the remainder handed to a named successor. There is
deliberately **no "mechanical failures only" exception clause**, because adjudicating mechanical-vs-truth at
the moment of maximum pressure to release is exactly where goalpost-moving lives.

Two things follow, and they pull in opposite directions on purpose:

1. **Do not soften.** This is the last look. A defect you round down here ships.
2. **Do not inflate.** The terminal is real, so a finding forced to fire it is as much a reshape as a
   finding suppressed to avoid it. β named both directions as equally forbidden. Grade against the
   criteria, not against the consequence.

You are not deciding release. **LANE VERDICTS DO NOT DECIDE, CRITERIA DO** — α applies the rule, not you,
not the conductor. Your job is to make the criteria assessable on evidence.

## The commit under review

**`6a105f2`** on branch `wt/S-VLADW1-01-engine`, worktree
`C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`. Verify with
`git -C <worktree> log --oneline -1` and report what you actually saw in `commit_reviewed`. If it does not
match, stop and say so rather than reviewing a different tree.

The diagnostic run reviewed `b9b8df3`. `git diff b9b8df3..6a105f2` is the fix attempt. Bundles:

    G  the rendered-form canonical transform (S4-2(c) as a PROPERTY), emphasis/block-prefix candidates
    H  counts removed; "only shipped place/surface" removed as a CLASS and refused by the lint;
       RT-8's rollup residual restated in CLASS form
    I  `names` coerced to primitives once before deriving the swept population; D1's narrowing claim
       probed over 15 shapes and the gate it leans on named LOAD-BEARING
    J  `createRequire` banned outside `src/spawn-shim.js`; the enforcer's ceiling stated in its own
       header; a standing EXPECTED-BYPASS witness committed, re-pointed to a route still open
    K  CUSTODY.md's description of the transform rewritten to match the transform as built
    L1 internal process vocabulary scrubbed from the shipped surface; the NOT-bound enumeration
       completed; a count of disclosure surfaces dropped from a paragraph that argues such counts
       are unavailable; the confusable disclosure calibrated (mistake-reachable vs attacker-only);
       the anti-staleness test's failure message told to say "update the disclosure, THEN this test"
    L2 P2's heading scoped to what half (b)'s body actually enumerates; that clause's bound ceiling
       re-pointed from the now-closed createRequire-alias example to the execution-proven
       process.binding("spawn_sync") route, with the standing fixture as its witness

**Conductor-measured at this commit, for you to CHECK rather than trust:** suite exit 0,
**366 pass / 0 fail / 0 skipped / 0 todo**; `npm run check:ship` exit 0; `npm run check:pointers`
exit 1 — **RED BY DESIGN**, deliberately outside `check:ship`.

## THE RELEASE RULE — β rows 309 (`e7a4b619`), 310 (`3a5f81c7`), 312 (`f2b71e58`)

**Numbering is deliberately S4-n, not S1–S5 — the predecessor sprint's rule must never be mis-cited into
this one.**

- **S4-1 — TRUTH, unconditioned.** Every custody claim string on a shipped surface (what `npm pack
  --dry-run` resolves) is TRUE of the code at close, established by **reviewer read**. Includes: the two
  previously-pinned false sentences CORRECTED, not merely unpinned; the what-is/is-NOT-bound block
  describing what the code does after item 1, incl. P1–P4 body prose; RT-8's rollup ceiling stated in CLASS
  form. **This criterion may NEVER be satisfied by mechanism evidence — a green bind, a green lint, a green
  battery are not evidence that a sentence is true.** This is the criterion the predecessor sprint died on
  twice, and every one of gauntlet-1's six HIGHs was an instance of it.
- **S4-2 — MECHANISM** (separate from S4-1 on purpose; never a conjunct of it).
  - (a) RF-1 RED for **all seven** R1 near-miss authorings plus **both** em-dash controls RED;
  - (b) RF-3 RED on reverting the refusal to `continue`;
  - (c) R3's status-token near-misses closed by a **NAMED CANONICAL TRANSFORM**, and **row 312 amended this
    to a PROPERTY, not a fold list**: satisfied by matching on the **RENDERED FORM** — normalization, strip
    of default-ignorable code points, confusable fold over the token alphabet, markdown-emphasis
    canonicalization. **An enumeration of the four observed variants does NOT satisfy this.** Judge the
    property, not whether the implementation matches any list of categories β once wrote.
  - (d) **the near-miss battery RE-RUN against the predicate AS BUILT, BY A GAUNTLET LANE AND NOT BY ε.**
    See the standing obligation below — this is owed AGAIN at this run and gauntlet-1's run does not carry.
- **S4-3 — ATOMICITY.** RF-4 observed RED: a claim edit without its canonical edit fails inside the owning
  bundle's own run, not at gauntlet. At close **no shipped claim string diverges from its canonical copy.**
- **S4-4 — FALSIFIERS OBSERVED.** RF-1, RF-3, RF-4, RF-5, RF-6, RF-7 present, committed, **each OBSERVED
  RED under its own mutation at this close**, every mutant carrying the no-op⇒FAIL guard.
- **S4-5 — AC-8.6 AT THE CAPPED SHAPE.** Invoked from the product-layer entry path; RF-7 RED **at runtime**,
  not text/AST, on removal of the invocation; `check:pointers` resolves
  `custody-runtime.test.js::selfcheck-runs-on-user-machine` instead of missing-NAME. Capped: one
  invocation, one named test. **Sub-clause, either-or:** the driver entry's scrub gains a
  runtime-observable consequence, **OR** the header states plainly that it is load-bearing only at
  text/AST level. Either satisfies; **silence does not.**
- **S4-6 — RESIDUALS TRAVEL.** Every field-4 residual in build-spec items **1–7**, plus the two
  design-phase findings deliberately NOT fixed (**RT-2's NBSP tolerance**, **RT-8's rollup blindness**),
  appears at close **on the surface where its claim's reader is**. A residual bounding a SHIPPED claim must
  be on the shipped surface; a purely internal residual may live in the round record. The class-form
  residual ships as a Ceiling paragraph under P3 in its **strong, actionable** form.

**BINDING NAME MAP (row 310) — the same objects under two names; the R3/R4 → RT-7/RT-8 offset is the trap:**
**R1 = RT-1** (derivation) · **R2 = RT-2** (carrier-note) · **R3 = RT-7** (status-token, governed by
S4-2(c)) · **R4 = RT-8** (aggregate/rollup, governed by S4-6 as a CLASS disclosure). Where the battery's
R-numbers and the record-trust gate's RT-numbers disagree, **the R-numbers are what the rule text means.**

**RF-2 is DISCHARGED AT DESIGN, is not a build deliverable, and is NOT in S4-4's falsifier set. S4-2(d) is
NOT its resurrection** — RF-2 tested the predicate *as specified*; S4-2(d) tests the predicate *as built*.
**"RF-2 passed" does not satisfy S4-2(d).**

**DISCRIMINATORS (both directions):** re-confirmation ≠ new finding · a finding in a
ceiling'd-AND-DISCLOSED class fires a criterion **only if execution-proven against a green gate** ·
**LANE VERDICTS DO NOT DECIDE, CRITERIA DO** · present-but-never-observed-RED fails S4-4; `NO_DATA` ≠ pass;
`t.skip()` ≠ pass · **pass-total ≠ observation-count — read the artifact per-test-description; the count of
DESCRIBED mutations must equal the count claimed** (a green suite total is not a count of observations) ·
a residual disclosed only in an internal artifact does not satisfy S4-6 for a shipped claim · **mechanism
evidence never satisfies S4-1** · raising the bar to avoid the terminal AND counting a re-confirmed defect
as new to force it are equally reshapes.

## Isolation

The three Claude lanes mutate the tree and run **SERIALIZED** — one at a time. The cross-family lane runs
alongside because it is served toolless-inline and mutates nothing. **Restore every mutation and confirm
`git status --porcelain -- engine/` is empty before you emit.** The next lane depends on it. The full
porcelain carries untracked `.claude/` session artifacts that are not yours — scope your check to
`-- engine/`.

## Going-in items — what the fix attempt already established

Disclosed so budget is not spent re-deriving. **None of these is cleared** — if you judge one differently,
say so, and say so loudly if you can prove it.

1. **Gauntlet-1's organising finding:** all six HIGHs were **false SENTENCES, not broken mechanisms**. The
   args door held under a real getter/`toString` probe (`getterCalls=1`, `toStringCalls=1`); absorb/delete
   was symmetric; refuse-not-skip caught every disclosed class. What failed was what was written about
   them — **in the sprint whose subject is claims being stronger than mechanisms.** Weigh that when you
   choose where to spend your read.
2. **Two of gauntlet-1's six HIGHs were ARTIFACTS of lane read-scope, not defects** (ED-362): the
   cross-family lane's "D1 accepts `Object.create(Array.prototype)`" was reasoned from an excerpt window
   that excluded the refuting `Array.isArray` gate; a same-family lane's "E's driver control has no mutant
   test" missed a test that existed. Four were real. **Consequence for you: if your envelope lists
   anything you could not see, the conductor is required to reconcile every finding that touches it before
   it is graded. Fill that field honestly — it is used, not filed.**
3. **Disclosed residuals of the fix itself, already on the shipped surface — re-confirmations, not new
   findings:** the transform's confusable fold is an **ENUMERATION over a named alphabet set**, and scripts
   outside it evade — this is stated as an enumeration, not hidden; separator variance is closed **except
   the comma**, whose measured false-RED cost was the reason; **RT-2's NBSP tolerance** remains open and its
   control fires correctly; **RT-8's rollup blindness** remains open by decision (row 309 Q6 — DISCLOSE,
   because a rollup claim must be reviewed, not linted, and S4-1 is the actual control).
   **A residual counts as a re-confirmation ONLY if its shipped disclosure is TRUE and in CLASS form; a
   disclosure that is inaccurate, instance-form, or on the wrong surface is a NEW S4-1/S4-6 finding, not a
   re-confirmation.** Disclosure does not buy silence — check each of these disclosures against the code
   rather than accepting that it exists.
4. **A committed EXPECTED-BYPASS witness exists on purpose.**
   `engine/test/fixtures/J-expected-bypass/reflective-launcher.js` is SUPPOSED to get past
   `spawn-env-allowlist.js`, and its test asserts the scanner finds nothing there. It launches a real child
   through `process.binding("spawn_sync")` with a **labelled placeholder, never a credential**. Do not
   file it as a defect and do not "fix" it. **Do** judge whether the prose that describes it is true.
5. **A builder self-disclosed a process flag:** bundle J's commit was denied by the doc-ref-integrity
   merge-guard over 83 **pre-existing** broken refs in `.claude/` docs; it verified none were its own and
   re-ran the identical command, which succeeded. No `--no-verify`, no allowlist entry, no reshaped
   command — and it flagged it rather than banking it. Recorded here rather than smoothed over.

## STANDING OBLIGATION — S4-2(d), owed AGAIN at this run

β row 312: **bundle G changed the predicate, so gauntlet-1's battery run does not carry.** A run against a
pre-fix predicate cannot discharge a criterion evaluated against the predicate as built. The re-run is owed
**by a lane, not by ε** — the conductor authored the design the battery validates, which is why the re-run
was put in a lane in the first place (P-097: the author must not also be the judge).

Assigned to the lane whose section says so. Its population must include **bundle A's newly-authored
class-form paragraph** plus **ZWSP / homoglyph / emphasis / prefix variants** — not only the original seven.
**Controls first:** if the controls do not go RED, the run proves nothing about the near-misses and must be
reported as `cannot-assess`, not as a pass.

## Rules of engagement

1. **Execution beats reasoning.** A finding you ran carries `execution_proven: true` and the real output.
   One you reasoned to carries `execution_proven: false` and says so. Do not blur them. At a qualifying
   close the difference decides whether a finding can fire a criterion at all.
2. **Grade by what is PROVEN, not by what is alarming.** If a bypass needs a file that does not ship, that
   proves a CONTROL is defeatable, not that the package leaks. Say which.
3. **A finding no other lane filed is not thereby wrong.** The cross-family lane has found real defects
   that every same-family lane missed in four consecutive gauntlets.
4. **Read the sentences, not only the code.** S4-1 can only be established by reading shipped prose against
   what the code does. A lane that reviews only mechanisms leaves the decisive criterion unassessed — and
   `cannot-assess` on S4-1 is not a pass for it.
5. **Emit your JSON as the very last thing, even if you must stop early.** A lane that does real work and
   returns prose instead of JSON reads downstream as a dead lane and its work is not counted. If you are
   running long, cut scope and emit.

## Output contract

Return ONE JSON object as your final message, nothing after it:

    {
      "lane": "<your role>",
      "verdict": "PASS" | "FAIL",
      "commit_reviewed": "<sha you verified with git>",
      "worktree_clean_at_finish": true,
      "s_criteria": { "S4-1": "holds|FAILS|cannot-assess", "S4-2": "...", "S4-3": "...",
                      "S4-4": "...", "S4-5": "...", "S4-6": "..." },
      "criteria_reasoning": { "S4-1": "<why, citing what you read or ran>", "...": "..." },
      "findings": [ { "id": "F-1", "severity": "HIGH|MEDIUM|LOW", "criterion": "S4-n|none",
                      "file": "path:line", "claim": "<one sentence>",
                      "execution_proven": true, "evidence": "<the real output>",
                      "new_or_reconfirmation": "new|re-confirmation" } ],
      "going_in_items_adjudicated": [ {"item": 1, "judgement": "..."} ],
      "regressions_from_the_fix_attempt": ["<defects G-L introduced, or 'none found'>"],
      "files_i_could_not_see": ["<paths or regions outside your read scope — THIS FIELD IS RECONCILED>"],
      "what_i_could_not_assess": ["<be specific; silence reads as a pass and it is not one>"]
    }

`cannot-assess` where you genuinely could not look is CORRECT and expected. A lane claiming to have assessed
everything is less trustworthy, not more. **`criteria_reasoning` is required for every criterion you did not
mark `cannot-assess`** — a bare verdict word cannot be applied by α at the close.
---

# YOUR LANE — `qa-reviewer` (BINDING)

Scope: **functional correctness + traceability + integrity.** You are the lane that reads the SHIPPED COPY
against the CODE and asks, sentence by sentence, whether it is TRUE.

Worktree `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine`, commit `6a105f2`. Paths relative to `engine/`.

## You are the deciding lane for S4-1, and S4-1 is the criterion this sprint family keeps dying on

The predecessor sprint failed its truth criterion **twice**. This sprint's diagnostic gauntlet found **six**
HIGHs and every single one was a false SENTENCE rather than a broken mechanism. The fix attempt corrected
five of them. **Assume there is a seventh, and assume the fix attempt authored it** — every bundle in G–L
wrote new prose onto the shipped surface, and new prose is where this failure lives.

**S4-1 may NEVER be satisfied by mechanism evidence.** The lint being green means the text matches its
stored copy — it says *nothing* about whether the text is true of the code. Establish truth by reading the
code and say what you read. **If your report cites a passing gate as evidence that a sentence is true, you
have failed the criterion you are judging.**

Read every claim string on the shipped surface — what `npm pack --dry-run` resolves. Give the sentences
this fix attempt CHANGED your hardest reading, under every interpretation a reader could take, not the
flattering one. In particular the prose authored by **K** (the transform's description) and by **H** (the
counts removal, the class-form refusal, the RT-8 restatement).

**Specific things to test rather than assume:**
- **K's description of the transform must match the transform AS BUILT.** Read
  `canonicalizeClaimText` in `scripts/checks/custody-claim-lint.js` and then read the paragraph that
  describes it. Every step the prose names must exist; every step the code performs that changes matching
  behaviour must be named or bounded. The confusable fold is an **ENUMERATION over a named alphabet set** —
  the prose must say so, and must not read as though the class is closed. Try to find a script the prose
  implies is covered and the code does not cover.
- **The separator/comma residual.** Separator variance is closed except the comma. Verify that is still
  true of the code, and that the prose says it in a form a reader can act on.
- **H's "only shipped place/surface" removal was a CLASS removal.** Grep for survivors in any wording —
  "the only", "nowhere else", "sole", "exclusively". A class removed in one spelling is not removed.
- **The header's what-is/is-NOT-bound block.** It promises to say plainly what is not bound. Is that list
  complete, including P1–P4 body prose? **Mutate a substantive body sentence into a flat falsehood and see
  whether anything goes red.** Restore it afterwards.
- **Invert a disclosure a user would rely on** — any statement about whether a control runs in their
  install — and see whether the gates stay green. That exact inversion shipped green in the predecessor.

## S4-6 — and one question β left explicitly open for you

**β row 312 could not read the RT-8 disclosure and flagged it: it may name the INSTANCES rather than the
CLASS. Row 309 ruled that naming only the two instances "would itself be a false disclosure."** Bundle H
restated it. **You resolve this by READ, and it is load-bearing: if it names instances, S4-6 FAILS at this
close.** The required form is the class — that the rollup rule matches a named lexical family, that it does
not detect semantically equivalent rollups in other wordings, and that **no enumeration of wordings will
close it: a rollup claim must be reviewed, not linted.** Quote what you actually find, verbatim, in your
evidence.

Also check that **RT-2's NBSP tolerance** travels to the surface where its claim's reader is, and that every
field-4 residual for build-spec items 1–7 is present. **A residual bounding a SHIPPED claim must be on the
SHIPPED surface** — presence in a round record does not satisfy S4-6 for it.

## Traceability

`npm run check:pointers` is **RED BY DESIGN** and deliberately outside `check:ship`. Do not treat its
non-zero exit as a defect and do not try to make it green. Do check that
`custody-runtime.test.js::selfcheck-runs-on-user-machine` RESOLVES, and that any count-bearing field
agrees with a **fresh run you re-derive yourself** rather than with what the field says. Bundle H removed
stale counts from `package.json#vladPointerLint` — verify no count-shaped claim was reintroduced anywhere
by G–L, and that any that remains is either re-derived-true or restated as an invariant.

## Integrity and the suite

- Run the test suite and `npm run check:ship` yourself, **each as its own command with its own exit code
  read** — never piped through `tail`/`head` in a `&&` chain. Report the real numbers.
- `git diff b9b8df3..6a105f2 -- test/` — **did any test title disappear, and was it replaced by
  something strictly stronger or something weaker?** Did any assertion loosen? Did a `t.skip()` or `.todo`
  appear? A suite that grew while quietly weakening an existing assertion is a regression no count shows.
- **`pass-total ≠ observation-count`.** For S4-4, read the mutant tests **per-description**: the count of
  DESCRIBED mutations must equal the count claimed. A green suite total is not six observations.
- Any test whose oracle can silently become a no-op — a mutation that does not mutate, a fixture present but
  never evaluated, an assertion whose predicate cannot fail — is a finding even if green today.

## What you own

Deciding lane for **S4-1** and **S4-6**; contributing on **S4-3** and **S4-4**. Say `cannot-assess` where
you could not look; silence reads as a pass and it is not one. Fill `files_i_could_not_see` — it is
reconciled against your findings, not filed.
