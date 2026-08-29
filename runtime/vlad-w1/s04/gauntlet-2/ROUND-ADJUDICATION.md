# S-VLADW1-04 — GAUNTLET 2 — **THE QUALIFYING RUN** — CONDUCTOR ADJUDICATION

> ## RULING: `ALPHA-RULING-S4-1-TO-S4-6.md` (this directory)
> **α applied the rule verbatim: S4-1 FAILS · S4-2(c) FAILS · S4-3 / S4-4 / S4-5 / S4-6 HOLD.**
> **TERMINAL: NO RELEASE. No fix attempt 2.** `wt/S-VLADW1-01-engine` stays **unmerged at `6a105f2`** as
> the successor's surface. α re-executed the falsifier set independently at close —
> `alpha-s4-4-rf-execution.tap`, 33/33, 0 skipped. Successor: **S-VLADW1-05**.
>
> **This file does not decide anything.** It records what the lanes established and what the conductor
> verified. Where it and the ruling differ, the ruling governs.

Commit under review **`6a105f2`** on `wt/S-VLADW1-01-engine`. Fix attempt 1 = bundles G, H, I, J, K, L1, L2
over `b9b8df3`. Four lanes, four `ok:true` records, `gauntlet-verify` **PASS**
(`gauntlet-verify.txt`). **Tree clean at `6a105f2` after every lane** — conductor checked porcelain between
each; no lane left a mutation behind.

## Roster and liveness

| lane | dispatch_id | route | verdict |
|---|---|---|---|
| `qa-reviewer` | `d-mtdrp1ga-8f0780f5` | in-process Agent, opus, 697 s | **FAIL** |
| `backend-reviewer` | `d-mtds807m-7573a1ea` | in-process Agent, opus, 735 s | **FAIL** |
| `security_claude_hunter` | `d-mtdsrbfz-fd4297dc` | in-process Agent, opus, 747 s | **FAIL** |
| `security-reviewer` (agy) | `d-mtdr3too-bf3bec3a` | subprocess, antigravity, 162 s | **FAIL** — both HIGHs refuted |

**The agy row classifies `fb fell-back`** — it served on `gemini-3.1-pro-high`, not the pinned model. The
record is well-formed and the lane ran; the pin was not honoured. Recorded rather than covered by "PASS".

## Criteria as the lanes reported them

| | qa | backend | security | agy |
|---|---|---|---|---|
| S4-1 | **FAILS** | **FAILS** | holds | ~~FAILS~~ refuted |
| S4-2 | cannot-assess | **FAILS** | **FAILS** | ~~FAILS~~ refuted |
| S4-3 | holds | holds | holds | cannot-assess |
| S4-4 | holds | holds | holds | cannot-assess |
| S4-5 | cannot-assess | holds | holds | cannot-assess |
| S4-6 | **holds** | cannot-assess | cannot-assess | holds |

---

# THE FINDING THAT ORGANISES THIS ROUND

**Two new false sentences, and one fold implemented beside the shared transform instead of inside it.**

The diagnostic run's organising finding was *"all six HIGHs are false SENTENCES, not broken mechanisms."*
The qualifying run's is the same class **one layer out**: the fix attempt closed every gauntlet-1 finding,
discharged S4-2(d) twice, held four criteria, grew the suite 339 → 366 with every mutant guarded — **and
authored new false sentences about its own mechanisms while doing it.** Both were in prose the conductor
reviewed and passed, and one was the wording β recommended.

## Convergent finding 1 — S4-2(c), found INDEPENDENTLY by two lanes

`backend-reviewer` and `security_claude_hunter` never saw each other's work and reported the same defect.

`canonicalizeClaimText` performs **no markdown-emphasis fold**. Row 312 names emphasis canonicalization as
one of the four components of the rendered-form property. Emphasis canonicalization *does* exist in this
file — in `resemblesBindableLeadIn` and in `flattenForAssertionScan` — but **not on the status-token path**,
which runs the bare transform via `containsStatusToken`. So forms that render identically compare unequal:

    **ASSERTED** — NOT VERIFIED        GREEN
    *ASSERTED* — *NOT VERIFIED*        GREEN
    ASS**ERTED** — NOT VERIFIED        GREEN
    _ASSERTED_ — NOT VERIFIED          GREEN
    ASSERTED — NOT **VERIFIED**        GREEN
    ASSERTED — NOT VERIFIED            RED (control)
    **ASSERTED — NOT VERIFIED**        RED (control)

Execution-proven end to end: the security lane injected `### P1 custody — **ASSERTED** — NOT VERIFIED` into
a copy of the shipped document and the **real CLI exited 0**, counting it as a *fifth Proven claim* while
Rule 3 never saw the token. **Not within any disclosed ceiling** — `CUSTODY.md:85-88` scopes emphasis
canonicalization to lead-in resemblance only. **Mistake-reachable, not attacker-only:** the document's own
house style bolds status tokens (`CUSTODY.md:280` is `Status: **ASSERTED — NOT VERIFIED**`, which IS caught);
bolding one half is the neighbouring authoring and is not.

The sharpest part is bundle G's own comment: *"The status-token comparison and this resemblance test share
one defect, so they must share one transform."* **The shared transform was applied; emphasis was implemented
outside it; only one side got it.**

## Convergent finding 2 — S4-1, two DIFFERENT false sentences, both newly authored

- **qa — the confusable-fold calibration.** The fold is a 56-entry map reaching **36 of 52** Latin skeleton
  letters; `L R U b d f g h k l m n r t u z` are unmapped in *both* scripts, and the keyword `Ceiling` needs
  `l`, `n`, `g`. Controls first: plain-Latin authoring **EXIT=1**, mapped-Cyrillic (U+0435) **EXIT=1** —
  both fired. Then Cyrillic U+04CF, Greek U+03B7, Greek U+03C4 each **EXIT=0, 0 violations**, silently
  skipped rather than refused. The shipped prose says the two scripts are closed and the remainder is
  reachable only "ON PURPOSE" — but Greek ETA is reached by *"a paste from mixed-script text"*, **the
  accident vector that same paragraph names.**
- **backend — "two escapes REMAIN".** A third class is execution-proven: an ATX-heading-prefixed lead-in
  (`#### **Ceiling — …`), bolded and Latin-spelled, is silently skipped; thirteen prefix shapes in all. The
  byte-identical paragraph without the `####` goes RED. **The paragraph directly above it narrates the
  previous version of that same sentence being false for the same reason** — the fix corrected the instance
  and re-committed the class.

Both lanes applied going-in item 3's rule (*"a disclosure that is inaccurate… is a NEW finding, not a
re-confirmation"*) and both graded these NEW. The qa lane **declined to stack** its finding onto S4-6 as
well, calling that "the reshape the brief forbids in the inflating direction" — α concurred.

## What HELD, and it is most of the run

**S4-2(d) DISCHARGED TWICE**, independently, against the post-G predicate, controls-first, enlarged
population — 7/7 near-misses RED and both em-dash controls RED in each, with the controls firing the
*correct distinct rule*. Backend **disclosed and re-ran its own invalid first battery** (its probe body
lacked a closing `**`, so every row was refusing for the wrong reason) rather than reporting the bad rows.
**S4-3, S4-4, S4-5, S4-6 hold** across the lanes and under α's own re-execution. The security lane drove 12
live-child attack shapes at `auditedSpawn` and got **zero leaks**; the stateful `toString()` was called
exactly once (no TOCTOU re-read) and refused-container getters were invoked zero times. **No regressions**
in the test surface: zero test titles removed, zero assertions loosened, zero `t.skip`/`.todo` introduced.

## agy's two HIGHs — REFUTED by the conductor before grading (ED-362)

Both rested on one premise: *"U+200B is not a `Default_Ignorable_Code_Point`… it evaluates to `false`."*

    /\p{Default_Ignorable_Code_Point}/u.test("​")   ->  true      (agy predicted false)
    canon("Asse​rted")  === canon("Asserted")        ->  true
    resemblesBindableLeadIn("**Cei​ling — x")        ->  "Ceiling" (CANDIDATE, not skipped)

**The premise is false and the shipped sentence agy called false is TRUE.** Both findings are artifacts;
its `S4-1 FAILS` and `S4-2 FAILS` are withdrawn as unsupported. Its `S4-6 holds` and its three
`cannot-assess` entries stand.

**This is the ED-362 machinery working, not failing.** Second consecutive gauntlet in which this lane
produced a false HIGH from reasoning over excerpts — but this time it marked both `execution_proven: false`,
filled `files_i_could_not_see` precisely, and supplied the exact `what_would_confirm_or_refute` command.
**Cost: two commands. Gauntlet-1's equivalent cost a fix bundle.** And the refuting declaration sits at
`custody-claim-lint.js:191`, **inside** the 185-215 window the lane was given — so this was a factual belief
about Unicode, not a scope gap. The derived manifest is not what failed here.

## What is NOT owed to the successor

- The four disclosed residuals (confusable enumeration, comma separator, RT-2 NBSP, RT-8 rollup) were each
  checked against the code by at least two lanes and found TRUE, in CLASS form, on the shipped surface.
  They are re-confirmations and they bought silence legitimately.
- The J EXPECTED-BYPASS witness: three lanes judged its prose accurate and none filed it as a defect.
- Bundle I's args door: re-attacked and held; the `Array.isArray` LOAD-BEARING annotation is accurate and
  the security lane re-ran the exact premise that produced gauntlet-1's false HIGH, confirming D1's sentence.
