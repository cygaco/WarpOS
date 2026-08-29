# S-VLADW1-04 — GAUNTLET 1 — **DIAGNOSTIC RUN, NON-QUALIFYING**

You are a REVIEW LANE. Your verdict is BINDING: the conductor cannot override a FAIL and will not try.

## THIS RUN IS DIAGNOSTIC. Read what that changes.

Under β's pre-committed structure there is **ONE fix attempt** this sprint:

    gauntlet-1 (THIS RUN — diagnostic, NON-qualifying) → fix attempt 1 → gauntlet-2 = the QUALIFYING run

**Nothing you find here fires the terminal.** This run exists so the single fix attempt is spent on real
defects rather than on guesses. That has two consequences for how you should work:

1. **Report everything, including what you are unsure about.** A finding you would suppress at a qualifying
   close because it might be noise is exactly what this run wants — it can be investigated and dismissed
   cheaply now, and cannot be at the close.
2. **Do not grade generously because "it is only diagnostic."** A defect you soften here survives into the
   qualifying run, where there is no recovery. The kindest thing you can do is be hard now.

## The commit under review

**`b9b8df3`** on branch `wt/S-VLADW1-01-engine`, worktree
`C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`. Verify with
`git -C <worktree> log --oneline -1` and report what you actually saw in `commit_reviewed`. If it does not
say `b9b8df3`, stop and say so rather than reviewing a different tree.

Base was `b2583d6` (the predecessor's close). `git diff b2583d6..b9b8df3` is the change set. Bundles:

    A  canonicalizeClaimText + refuse-not-skip + class-form Ceiling + RF-1/RF-3/RF-4
    B  two gate-enforced false sentences corrected, text + canonical copy atomically
    C  AC-8.6 — one self-check, one named test, RF-7 RED at runtime
    D  args.map scan door closed (indexed loop, no method lookup) + RF-5
    E  absorb/delete one derived population + RF-6, and S4-5 route (a)
    F  self-relative deictic "this fix cycle" anchored or removed; a false attribution corrected
    F′ the AC-8.6 paragraph made true after C landed it; four code-state deictics anchored

**Conductor-measured at this commit, for you to CHECK rather than trust:** suite exit 0, **339 pass / 0 fail
/ 0 skipped / 0 todo**; `npm run check:ship` exit 0; `npm run check:pointers` exit 1 — **RED BY DESIGN**,
deliberately outside `check:ship`, 34/48 resolve.

## THE RELEASE RULE — β rows 309 (`e7a4b619`) + 310 (`3a5f81c7`), pre-committed before any result existed

**Numbering is deliberately S4-n, not S1–S5 — the predecessor's rule must never be mis-cited into this
sprint.** The qualifying run is gauntlet-2, not this one, but you assess against these criteria so the fix
attempt is aimed correctly.

- **S4-1 — TRUTH, unconditioned.** Every custody claim string on a shipped surface (what `npm pack
  --dry-run` resolves) is TRUE of the code at close, established by reviewer read. **This criterion may
  NEVER be satisfied by mechanism evidence — a green bind, a green lint, a green battery are not evidence
  that a sentence is true.**
- **S4-2 — MECHANISM** (separate from S4-1 on purpose). (a) RF-1 RED for **all seven** near-miss authorings
  plus both em-dash controls; (b) RF-3 RED on reverting the refusal to `continue`; (c) the status-token
  near-misses closed by a **NAMED CANONICAL TRANSFORM** — case-fold + whitespace-collapse + dash-class fold
  on the rendered form — **an enumeration of the four observed variants does NOT satisfy this**; (d) the
  near-miss battery **RE-RUN against the predicate AS BUILT, by a gauntlet lane and not by ε**, population
  including bundle A's newly-authored class-form paragraph.
- **S4-3 — ATOMICITY.** RF-4 observed RED: a claim edit without its canonical edit fails inside the owning
  bundle's own run. At close no shipped claim string diverges from its canonical copy.
- **S4-4 — FALSIFIERS OBSERVED.** RF-1, RF-3, RF-4, RF-5, RF-6, RF-7 each OBSERVED RED under its own
  mutation, every mutant carrying the no-op⇒FAIL guard.
- **S4-5 — AC-8.6 AT THE CAPPED SHAPE.** Invoked from the product-layer entry path; RF-7 RED **at runtime**,
  not text/AST; `check:pointers` resolves `custody-runtime.test.js::selfcheck-runs-on-user-machine`. Capped
  at one invocation + one named test. **Either-or:** the driver entry's scrub gains a runtime-observable
  consequence, OR the header states plainly it is load-bearing only at text/AST level. **Silence does not
  satisfy it.**
- **S4-6 — RESIDUALS TRAVEL.** Every field-4 residual in build-spec items 1–7, plus the two design-phase
  findings deliberately NOT fixed (**RT-2's NBSP tolerance**, **RT-8's rollup blindness**), appears at close
  on the surface where its claim's reader is.

**BINDING NAME MAP (row 310) — these are the same objects under two names, do not mis-apply them:**
**R1 = RT-1** (derivation) · **R2 = RT-2** (carrier-note) · **R3 = RT-7** (status-token, governed by
S4-2(c)) · **R4 = RT-8** (aggregate/rollup, governed by S4-6 as a CLASS disclosure).

**RF-2 is DISCHARGED AT DESIGN and is NOT in S4-4's falsifier set. S4-2(d) is a SEPARATE obligation** — a
lane's re-run against the predicate as built. **"RF-2 passed" does not discharge S4-2(d).**

**DISCRIMINATORS (both directions):** re-confirmation ≠ new finding · a finding in a ceiling'd-AND-disclosed
class fires a criterion only if execution-proven against a green gate · **LANE VERDICTS DO NOT DECIDE,
CRITERIA DO** · present-but-never-observed-RED fails S4-4; `NO_DATA` ≠ pass; `t.skip()` ≠ pass ·
**pass-total ≠ observation-count — read the artifact per-test-description; the count of DESCRIBED mutations
must equal the count claimed** · a residual disclosed only in an internal artifact does not satisfy S4-6 for
a shipped claim · **mechanism evidence never satisfies S4-1** · raising the bar to avoid the terminal AND
counting a re-confirmed defect as new to force it are equally reshapes.

## Isolation

The three Claude lanes mutate the tree and run **SERIALIZED** — one at a time. `security-reviewer` (agy)
runs alongside because it is served toolless-inline and mutates nothing. **Restore every mutation and
confirm `git status --porcelain -- engine/` is empty before you emit.** The next lane depends on it. Note
the full porcelain carries ~41 untracked `.claude/` session artifacts that are not yours — scope your check
to `-- engine/`.

## Known going-in items — reported by builders, NOT yet adjudicated

These are disclosed so you do not spend budget rediscovering them. **They are not cleared** — if you judge
one differently, say so.

1. **F′ DEVIATION:** it edited bundle A's class-form Ceiling, which its brief told it not to contradict.
   Reason given: bundle C had falsified two clauses inside it, and leaving them would have made `CUSTODY.md`
   assert both "AC-8.6 has landed" and "it has not landed" **while the lint stayed green**. It claims a
   minimum reconciling change preserving class-form force. **Judge whether that is true.**
2. **C SCOPE EXCEPTION:** it edited `test/verified-by-resolver.test.js`, outside its allowedFiles, because
   that file pins the resolver's real-tree counts and asserts AC-8.6's pointer is unresolved — mechanically
   incompatible with landing AC-8.6. Isolated in commit `2a28a6a` so it can be reverted alone.
3. **A latent trap (F′):** the Rule 4 mutant test depends on a **hand-wrapped line break** in the
   `opts.cwd` Ceiling. Any future re-wrap breaks a test a doc-scoped bundle cannot edit.
4. **Unidentified anchor (F′):** the commit in which the `opts.cwd` value was actually observed riding
   through remains unnamed; F′ **declined to invent a checkable-looking anchor**.

## Rules of engagement

1. **Execution beats reasoning.** A finding you ran carries `execution_proven: true` and the real output.
   One you reasoned to carries `execution_proven: false` and says so. Do not blur them.
2. **Grade by what is PROVEN, not by what is alarming.** If a bypass needs a file that does not ship, that
   proves a CONTROL is defeatable, not that the package leaks. Say which.
3. **A finding no other lane filed is not thereby wrong.** The cross-family lane has found real defects all
   same-family lanes missed in three consecutive gauntlets.
4. **Emit your JSON as the very last thing, even if you must stop early.** A lane that does real work and
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
      "findings": [ { "id": "F-1", "severity": "HIGH|MEDIUM|LOW", "criterion": "S4-n|none",
                      "file": "path:line", "claim": "<one sentence>",
                      "execution_proven": true, "evidence": "<the real output>" } ],
      "going_in_items_adjudicated": [ {"item": 1, "judgement": "..."} ],
      "regressions_from_this_build": ["<defects THIS sprint's bundles introduced, or 'none found'>"],
      "what_i_could_not_assess": ["<be specific; silence reads as a pass and it is not one>"]
    }

`cannot-assess` where you genuinely could not look is CORRECT and expected. A lane claiming to have assessed
everything is less trustworthy, not more.
---

# YOUR LANE — `backend-reviewer` (BINDING)

Scope: **code quality of the engine and its enforcers.** Claim truth belongs to the qa lane; do not
duplicate it. Your question is whether the MECHANISMS this build introduced actually do what they say.

Worktree `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, commit `b9b8df3`. Paths
relative to `engine/`.

## YOU OWN S4-2(d) — THE BATTERY RE-RUN. This is your headline deliverable.

β assigned this to a **gauntlet lane and explicitly NOT to ε**, citing P-097: *bundle A controls both the
artifact and the thing judging it*, and ε designed the predicate. ε ran a battery at design time and again
after bundle A as a **sanity check** — **that does not discharge this obligation, and neither does RF-2**
(discharged at design, not in S4-4's set).

**Re-run the near-miss battery against the predicate AS BUILT**, controls first. Requirements:

- **Population MUST include bundle A's newly-authored class-form Ceiling paragraph** — the one beginning
  *"**Ceiling — this package does not verify that its controls are invoked in YOUR install.**"* A controls
  its own artifact and its own judge, so that paragraph is precisely the one an independent lane must test.
- **Controls first.** A rule whose control does not fire proves nothing about its variants. Report the
  control result per rule; a row with a dead control is void.
- Cover **every bound rule**, not only the derivation: **RT-1** derivation, **RT-2** carrier-note binding,
  **RT-7** status-token separation, **RT-8** aggregate/rollup.
- Method note: `lintCustodyStatement(content)` is a pure function — you can probe with in-memory strings and
  mutate nothing. That is how ε ran it; you are free to choose differently, but if you mutate the tree,
  restore it.

Report, per rule: control RED? each variant RED or a **named blindness**. ε's design-phase run found 13
blindnesses across three rules and, after bundle A, 2 remaining — both deliberately disclosed. **Verify that
independently. If you find a blindness ε's battery missed, that is the most valuable finding available in
this run.**

## The mechanisms to review as CODE

1. **`canonicalizeClaimText`** (`scripts/checks/custody-claim-lint.js`). β required a **named canonical
   transform**, not an enumeration: *"an enumeration of the four observed variants does NOT satisfy this."*
   Read it. Is it applied to BOTH sides of every token comparison? Is there any hardcoded dash-variant
   literal anywhere? What does the transform NOT fold, and is that ceiling stated in the header?
2. **Refuse-not-skip.** The old `continue`-on-non-match is the sprint's headline defect. Does the new code
   REFUSE by name? **And check the over-refusal direction** — `Status`, `Enforcer`, `Proof scope` are
   P-clause metadata and must NOT become violations.
3. **The `args.map` door** (`src/spawn-shim.js`). D replaced the caller-controlled `.map` with an indexed
   loop performing no method lookup. Verify by reading: can a caller still influence normalization through
   `Symbol.iterator`, `constructor[Symbol.species]`, a getter on `length`, or an index accessor? D claims
   0 widenings across 14 container shapes — **test that claim, do not accept it.**
4. **Absorb/delete symmetry** (`src/env-scrub.js`). E claims both loops now iterate one derived population.
   Verify, and check the deletion population did not widen beyond names this module captured.
5. **AC-8.6's self-check** (`src/server-entry.js`). Is RF-7's RED genuinely at RUNTIME rather than text/AST?
   Remove the invocation and see what actually fails and why.

## Standing questions worth your budget

- **The walker's disclosed residuals** (aliased imports, re-bound references, computed member access) are
  disclosed; a re-confirmation is not a new finding. **A disclosed residual INSTANTIATED on the shipped
  graph IS one** — that exact distinction defeated the control in the predecessor's gauntlet-2.
- **Going-in item 3:** the Rule 4 mutant test depends on a hand-wrapped line break. Confirm or refute, and
  judge whether it is a latent false-green.

## Emit the JSON. This lane specifically has form.

This lane's family was lost to truncated mid-thought returns three times across the predecessor's gauntlets
— each time it had done substantial real work and none of it counted. **Budget so that emitting the JSON is
never what you run out of room for.** If you are running long, stop investigating, cut scope, and emit with
honest `what_i_could_not_assess` entries.

## What you own

Deciding lane for **S4-2** (including (d), the battery re-run) and contributing on **S4-3**, **S4-4**,
**S4-5**. Say `cannot-assess` where you could not look.
