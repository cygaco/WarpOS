# FIX BRIEF — the ONE fix attempt — S-VLADW1-05 (rows 317/318)

You are a backend-builder on sprint S-VLADW1-05, after bundles M, N, O, P, P', P'' and Q landed.

**This sprint has ONE fix attempt. No second attempt, no exception clause.** If you run out of budget,
land what is complete and report the rest as not-reached. A partial fix landed and honestly reported
beats a complete one you cannot evidence.

**The attempt ENDS when the qualifying gauntlet fires** (β row 342, Q1). No bundle may be added after
its results exist. *"One more bundle to fix what qualifying found"* is attempt 2 wearing a bundle's
clothes — it is the most likely good-faith bypass, and it is refused in advance.

---

## ⚠️ RIDERS — β row 342 `5a7d0e93`, released by α (msg `c0362b82`). These BIND.

**R1 — Emit the list, never the count (AP-18).** Any exhaustiveness statement you write must emit its
members; a count is an exhaustiveness claim wearing a number. Write *"…with the exceptions named
below"* and then name them — never *"…with the 3 exceptions."* Any count must be derivable by the
reader from your list, not asserted by you. This caught β **and** α today, inside the very sentences
written to police it. My own census below states counts; that is a description of what I found, and
**you must not carry my counts into a shipped sentence.**

**R2 — The exact closure bar (Q3).** The inventory closes the **ROUTING** question over one file's
call sites at one sha. It does **not** close the **BYPASS** question. Two different classes, and the
provable one must not stand in for the unprovable one.

- ✅ Permitted: *"Every claim-text comparison in `custody-claim-lint.js` at `<sha>` routes through
  `canonicalizeClaimText`, except those named below."*
- ❌ Forbidden: *"the custody-claim bypass class is closed."*

Bypasses can still arrive from **outside this file**, from the transform's **own incompleteness**
(unmapped letters, unfolded scripts, the L/R/lower-case-`n` gaps), or from claim shapes **no check
recognises**. Pin any closure sentence to **this file and this sha**.

**R3 — You may not claim a mechanism you have not watched fail.** Applies to Task 5a specifically and
to every new mechanism generally. A new mechanism is how bundle Q introduced its own defect.

**This brief is scoped by an ENUMERATED INVENTORY, not by the defect list** (β row 340). The reason is
in §WHY, and it is the single most important instruction here: repairing only the defects the lanes
tripped over is how this sprint fails, because every previous round found one more call site.

---

## ENVIRONMENT — read before anything else (ED-363)

**Your process cwd is NOT the target repo.** Dispatch starts you in a WarpOS agent worktree. Expected;
this brief asserts no cwd.

- **TARGET REPO:** the `vlad` project's `engine-lane` worktree. **Its absolute path is supplied in the
  DISPATCH ENVELOPE prepended to this brief** — use that exact string, and do not reconstruct it.
  (Kept out of this file so the committed record carries no machine-specific path.)
- **TARGET BRANCH:** `wt/S-VLADW1-01-engine`. Do NOT branch, merge, or push. **Package root:** `engine/`

Plain single `git -C "<abs>"` commands; commit with `-F <abs msgfile>`; absolute paths. Never
`cd X && ...`, no heredoc commits, never pipe git through `tail`/`head`. The isolation guard refuses
command COMPLEXITY, not the cross-repo target — do not reshape a denied command; use a simpler
permitted form if the guard names one; if a plain `git -C` is still refused, STOP and report.

**Do not edit what you cannot commit.** If you cannot commit at all, make NO edits and halt.

**Gates, each as its OWN command with its real exit code read** — never piped through `tail`/`head`,
because a pipeline returns the tail's status and a red gate reads as green:

- suite from `engine/` — **a lane measured 398 pass / 0 fail at `6c64021`. Verify that yourself before
  you start and use what YOU measure**, not this number.
- `npm run check:ship` (exit 0)
- `node scripts/checks/custody-claim-lint.js` (exit 0)
- `check:pointers` exits 1 **by design**, outside `check:ship`, and is not a defect.

---

## SCOPE

**allowedFiles:**
- `engine/scripts/checks/custody-claim-lint.js` (the whole module — this round crosses the old
  per-bundle boundaries by design)
- `engine/CUSTODY.md`
- `engine/test/custody-claim-lint.test.js`

**forbiddenFiles:** everything else. Specifically **not** `engine/src/model-seam.js`,
`engine/src/spawn-shim.js`, `engine/src/env-scrub.js`, `engine/driver/host-free-driver.js`.
Task 5 corrects a *sentence about* `model-seam.js`; it does not touch that file.

**Never** `--no-verify`. **Never** add an allowlist entry to make your own change pass — if your edit
trips the lint, rephrase rather than suppress. **Never** place a credential-shaped literal anywhere;
labelled placeholders only. **Never** hand-edit a registry or progress file to make a gate pass.

---

## WHY THIS ROUND EXISTS, AND WHY IT IS SCOPED BY AN INVENTORY

The diagnostic round ran seven lanes. Two independent lanes, plus execution, established that the
sprint's own headline mechanism has a routing hole, and that a shipped coverage sentence is false.

**β row 340, verbatim on scope:** *"Every round finds one more call site that does not route through
the shared transform (S-03 -> S-04 -> S-05; inside S-05, M fixed two and the hunter found two more).
So the fix must not be scoped by the defect list — repair F1 and F2 as found and a fifth site surfaces
in the qualifying round, with no attempt 2."*

β also flagged one premise it could not check itself: whether the forbidden-claim family reaches the
transform by some other path. **It does not — settled at source, three ways:**

```
1369: function findForbiddenClaimHits(line) {
        for (const { id, pattern } of FORBIDDEN_CLAIM_PATTERNS) {
          const m = line.match(pattern);          <- matches the RAW line
```
- the function body contains **zero** references to `canonicalizeClaimText`
- all three call sites pass a raw line: **L1417**, **L1445** (`const line = lines[i]`), **L1493**
  (`lines[i]`)
- **L1415 canonicalizes the SAME line** in the SAME loop via `containsStatusToken`. The asymmetry is
  on one line of one function.

---

## TASK 1 — THE INVENTORY. Do this FIRST, and do not start Task 2 until it is written.

Produce, as a file in the repo (`engine/scripts/checks/TRANSFORM-ROUTING.md` or a comment block you
justify), an enumerated inventory of **every call site in `custody-claim-lint.js` that compares,
matches or scans claim text**, derived from the module's own call graph and exports — **not** from
what the lanes tripped over.

For each entry record: the function, its line, whether it routes through `canonicalizeClaimText`,
**with which options**, and **if it does not, why not**. The documented `emphasisFold:false` opt-out at
L848 is the one known legitimate non-routing case; there may be others (a byte-for-byte verbatim
comparison SHOULD not canonicalize — that is a justification, and it must be written down).

**A starting census is below. It is MINE, it is a starting point, and you must verify and extend it —
do not adopt it.** I state my derivation rule and its limits so you can see exactly what it misses.

> **My derivation rule:** every `function` declaration at column 0
> (`grep -n '^\(export \)\?function [a-zA-Z]'` -> 30 matches), cross-referenced against every
> occurrence of `canonicalizeClaimText(` (7 matches; L365 is the definition, L301 is inside a comment,
> leaving **5 real call sites**).
>
> **What this rule does NOT reach:** arrow functions, object methods, functions declared inside other
> functions, any dynamic dispatch, the separate `normalizeWhitespace` normalizer used by the binding
> rules, and every scanner living in a **different file** (the P1/P2/P4 scanners are not in this
> module). Each of those is a place my census would be silently empty.

**Routes through the transform — 5 sites, 4 functions:**

| site | function | options |
|---|---|---|
| L848 | `resemblesBindableLeadIn` | `{ caseFold: false, emphasisFold: false }` — the documented opt-out |
| L866 | `resemblesBindableLeadIn` (separator) | **defaults — fold ON.** Same function, two different alphabets |
| L1188 | `statusTokenPattern` | `opts` |
| L1209 | `containsStatusToken` | `opts` |
| L1618 | `flattenForAssertionScan` -> used by `findOnlySurfaceAssertion` | defaults |

**Does NOT route — every other claim-text-touching function my rule found:**
`findProvenClaimViolations` L444 · `findAssertedVerbatimViolations` L513 ·
`findCarrierNoteVerbatimViolations` L596 · `findParagraphBindingViolations` L1047 ·
`findBoundParagraphPresenceViolations` L1090 · `findDuplicateSectionViolations` L1249 ·
`findLabelSeparationViolations` L1274 · **`findForbiddenClaimHits` L1369** ·
`findOutOfSectionClaimViolations` L1392 · `findProvenProseClaimViolations` L1437 ·
`findShippedCopyClaimViolations` L1489 · `findPackageJsonClaimViolations` L1508 ·
`findOnlySurfaceAssertionViolations` L1660

**Do not read that second list as thirteen defects.** Several of those compare verbatim on purpose,
where canonicalizing would be wrong. The inventory's job is to make each one a **recorded decision**
instead of an accident. At least one — `findForbiddenClaimHits` — currently has no justification at
all, and that is Task 2.

**This inventory is also the only form in which a sentence like "every claim-text check shares one
transform" can be TRUE** (β row 340). If you cannot make that sentence true, do not write it.

---

## TASK 2 — F1 (CRITICAL, execution-proven). Route the forbidden-claim family through the transform.

**The finding, as run by the security lane against a green baseline** (lint exit 0, suite 398/0):

One sentence inserted twice into the CUSTODY.md preamble, differing only by **four U+200B**:
- control, plain ASCII -> **4 violations, exit 1** (`worded-rollup-conflation`, `guaranteed`,
  `cannot-leak`, `absolute-negation-of-access`)
- attack (`guarante<ZWSP>ed`, `re<ZWSP>ad`, `le<ZWSP>ak`, `verifi<ZWSP>ed`) -> **0 violations, exit 0**

**The two strings render identically** in every markdown viewer, on npm, and on GitHub.
`canonicalizeClaimText` **already returns the correct folded form** for the obfuscated input — the
check simply never calls it. Confirmed evading variants: ZWSP insertion, mid-word `**`, and Cyrillic
homoglyphs, across `guaranteed`, `cannot-leak`, `fully-proven-or-verified`, `independently-verified`.

Fix the routing, not the symptom. **Do not add ZWSP to a denylist** — that repairs one character of an
open class and leaves the class open.

**Watch the two-sided risk.** Canonicalizing before a forbidden-claim match will widen what matches.
A text matcher cannot distinguish a violation from a *description* of one, and `CUSTODY.md` describes
these very patterns. Expect new trips on the document's own prose and **rephrase rather than
suppress**. If canonicalizing a given site produces false matches you cannot rephrase away, that is a
finding — record it in the inventory with its reason; do not silently skip the site.

### ⛔ THE STRUCTURAL EXEMPTION IS BARRED (β row 343, `8b52f0a7`) — read this before you reach for it

When `CUSTODY.md`'s own prose trips the widened check, there is a third fix that will look principled
and is not: a **structural exemption** — skip fenced code blocks, skip quoted spans, skip anything
after a `>` — on the reasoning that *a description of a forbidden pattern is not an instance of one.*

**That reasoning is correct, and the fix creates a new invisible bypass immediately: put the forbidden
claim inside a code fence.** That is F1's own family, reappearing, authored by the fix for F1, in the
same round that closed it.

**So: any structural exemption may ship ONLY with its own observed falsifier** — a forbidden claim
placed *inside* the exempted construct must still be caught, and you must have watched that happen. If
you cannot produce that falsifier, the exemption does not ship. Your two legitimate options remain:
**rephrase** the prose, or **record the trip as a finding** in the inventory with its reason. Never a
per-instance allowlist entry, never a silent skip.

---

## TASK 3 — F2 (HIGH). The two emphasis alphabets.

`EMPHASIS_FOLD_PATTERN` (L351) is ``/[*_`~]+/g`` — **four** characters.
`EMPHASIS_RUN` (L798), the opener recogniser inside `resemblesBindableLeadIn`, is `/^[*_]+/` — **two**.
Because L848 opts out of the fold, the opener check is the only thing that sees emphasis, and it is
blind to half its own alphabet. `<b>`/`<strong>` fails from the other side: `BLOCK_PREFIX` strips the
tag, then the opener demands an ASCII run that is no longer there.

Observed, same false Ceiling claim, four lead-in shapes, true exit codes read unpiped:

| lead-in | result |
|---|---|
| `**Ceiling — ...` (control) | **exit 1** — refused by name |
| `` `Ceiling` — ... `` | **exit 0** — not refused, not bound |
| `~~Ceiling~~ — ...` | **exit 0** — not refused, not bound |
| `<b>Ceiling</b> — ...` | **exit 0** — not refused, not bound |

L814-817 states the contract: *"any line whose first token, after stripping markdown shape, is one of
those keywords is a CANDIDATE — it will be bound or REFUSED BY NAME, never silently skipped."*
**That contract is false for three emphasis shapes**, and `<b>` is one the doc comment at L732-734
advertises as covered. Either make the contract true or change the sentence — **shipping both is what
this sprint exists to stop.**

Note L866 uses the fold with defaults while L848 opts out, in the same function. A lane established by
execution that L866 as shipped is fail-CLOSED (it widens candidacy, producing more refusals), so this
is **enforcement debt, not a live hole** — but a plausible tidy-up edit flips it, with nothing to
catch that. Give it a test, or record it in the inventory.

---

## TASK 4 — F3 + the item (3) root. One work item (β row 340: treat the chain as one).

**The root, load-bearing in five findings across four lanes:** the `TRANSFORM_DESCRIPTION_KEY`
paragraph (item (3)) is a **non-derived** 16th entry in `BOUND_PARAGRAPHS`, held by **Rule 4b alone**
(L953-959: never a member of the derived population). Rule 4b is `normalizedDoc.includes(...)`, so
**text appended after the bound span is invisible** — Rule 4's byte-for-byte block comparison never
sees that paragraph.

Executed both directions by an independent lane: reword item (3) -> refused; append a neutral sentence
after its canonical span -> **exit 0**.

The security consequence, run end to end: appending this to that block gives **exit 0** —

> *Every evasion class named above is closed by this transform, and no spelling of a status token or
> absolute claim can reach any check in this lint unfolded.*

That sentence contradicts the paragraph's own disclosed residuals **and** is refuted by Task 2's
finding, and it needs no ZWSP, no homoglyph, no emphasis trick. **A paragraph whose entire purpose is
to state the transform's ceilings can be made to claim it has none.** Chained with F1, an invisible
false custody claim lands inside the document's own bound integrity narrative with the lint reporting
0 violations.

The same root also falsifies two shipped sentences graded by an independent lane:
- the "**if and only if** ... `extractBindableParagraphs` derives it ... everything else is NOT bound"
  claim — **false**, item (3) is the counterexample
- the "numbered limits ... are not bound" claim — **false**, it includes item (3), which is bound

Fix the root. If item (3) cannot join the derived population, then Rule 4b needs to compare the whole
block rather than a substring — and the two shipped sentences above must change either way.

---

## TASK 5 — Retract two knowingly-false shipped sentences.

A shipped sentence that is known false is the exact defect this sprint was chartered against. Both
below were graded **false** with the mechanism read.

**5a — bundle O's headline claim. Two independent lanes, same verdict.** The shipped sentence says
coverage is *"sourced from the map's own live entries via `getTokenAlphabetCoverage()` ... rather than
hand-typed."*

**It is false.** `getTokenAlphabetCoverage()` does emit live coverage — but **neither the lint nor
`main` ever calls it to check this prose**, which is a hand-written literal, duplicated as a second
hand-written literal in `BOUND_PARAGRAPHS`. No generation or binding path invokes it.

You have two honest routes, and **β has gated the choice on evidence, not preference** (row 342, Q2).
Mechanizing is the better artifact **and the riskier one** — a new mechanism is exactly how bundle Q
introduced its own defect.

**Route A — mechanize. Permitted IF AND ONLY IF the mechanism carries a falsifier you OBSERVED in this
round:** mutate the prose → the check refuses it; mutate the map → the check refuses it; **and a no-op
mechanism FAILS.** All three watched, with raw output in your envelope. **You may not claim a mechanism
you have not watched fail.** If you cannot produce that evidence, you do not get to ship the mechanism.

**Route B — reword.** Fully satisfies S5-1: describe the hand-maintained literal as what it is, and
**name the drift surface as a residual** so it travels to the successor by name. This is not the
lesser answer; it is the answer that does not invent a new mechanism under time pressure.

**Do not leave it as shipped.** Choose A or B, and say in the envelope which and why.

The neighbouring "the token alphabet is 15 letters ... derived, not asserted independently" sentence
fails the same way and travels with it. (The emitted domain **is** exactly those 15 letters, and
12-of-15 both-cases, lower-case `n`/Greek nu, and L/R-no-candidate all graded **true** — the data is
right; it is the *sourcing* claim that is false. Fix the claim, not the data.)

**5b — the S06-F01 mitigation sentence.** It ships rated MEDIUM on the stated ground that the defect is
*"currently unreachable in production (`createModelSession` has no production caller)."*

**That sentence is false, and I verified it at source myself.** `createModelSession` is the wrong unit.
The defect is in `resolveAuthMode` (`src/model-seam.js` L455-456), which **is** reached in production
twice, via `describeAuth` (L473-474): **`src/spawn-shim.js:253`** and **`driver/host-free-driver.js:288`**
— both live code lines. (The same grep also returns *comment* references at spawn-shim L17/L25 and
host-free-driver L243; do not count those.)

**The MEDIUM rating still stands, on a corrected reason you must write down:** neither production site
consumes the returned `mode`, and the other returned fields (`SECRET_SHAPES` L156, `ENV_DENYLIST` L269
derived from it, plus the two hooks) are frozen and mode-independent — so the silent default changes no
production behaviour. Rewrite the mitigation to say that. **Prose only; do not touch `model-seam.js`.**

**This correction is NON-NEGOTIABLE this round** (β row 342, Q5 — S5-1). It is not budget-permitting.

**Three binding constraints on the corrected text (β row 342, Q5):**

1. **Use the corrected reason, not the withdrawn one.** The rating rests on: neither production site
   consumes the returned `mode`; `SECRET_SHAPES` and `ENV_DENYLIST` are frozen and mode-independent.
   The words *"unreachable in production"* are **withdrawn** and must not appear as a ground.
2. **The throw branch is availability, not confidentiality — and I have settled the wording for you.**
   A `VLAD_AUTH_MODE` (L114) set to an unrecognized value makes `describeAuth()` throw at both sites:
   fail-closed at `spawn-shim:253` (before the spawn), and at `host-free-driver:363` inside a
   `child.stderr.on("data")` listener with no enclosing catch (the `try` at L368 does not enclose a
   listener). **I checked for a process-level handler: there are ZERO `process.on(` registrations in
   `src/` or `driver/`, and zero `uncaughtException`/`unhandledRejection` references in `src/`,
   `driver/` or `scripts/`. So the throw TERMINATES the process** — a loud crash, not a silent loss of
   redaction. The raw chunk is retained at L361 *before* redaction regardless, so nothing ships
   unredacted. **State it at that strength and no higher** — the dramatic reading (redaction silently
   disabled) is not what the bytes support, and my check's scope was `src/`, `driver/`, `scripts/`.
   **This finding TRAVELS to the successor (S5-7); it is not repaired here.** Record it, do not fix it.
3. **Attribution visible, not laundered.** The false mitigation was **β-authored**. The correction
   record must say so plainly. Do not write it as though the error had no author, and do not attribute
   it to the sprint generally. An unattributed correction is how a governance error becomes invisible.

The ambient-session question also travels to the successor (S5-7), unrepaired here.

---

## STANDING DISCIPLINE — binding

1. **Every shipped claim sentence is drafted AFTER the attack that would falsify it** — β-recommended
   and α-approved wording included. *"Approval is not a truth check."*
2. **No coverage claim at a coarser granularity than the mechanism has.** A claim naming "scripts" over
   a mechanism that maps **letters** is false even when its data is right. Watch "all", "every", "only",
   "never", "no other", "exactly", and a **count standing in for a set**. A closure claim is admissible
   only if the mechanism closes by a **named property** or an **emitted exhaustive extension over an
   explicitly stated finite domain**. **See R1 and R2 above — they are binding, not advisory.** R1: emit
   the members, never the count. R2: you may claim the ROUTING is closed over this file at this sha;
   you may **not** claim the BYPASS class is closed.
3. **Report behaviour, never a colour word** (β row 332). The sprint's design battery uses
   `R = (b) => b ? "RED" : "GREEN"` where the boolean is *the token was MATCHED* — so in that file
   **RED = caught, GREEN = evades**, the inverse of a test suite's habit. Write *"input X is not matched
   by `containsStatusToken`"* or *"the check does not fire"*, or give an exit code.
4. **Any population you derive is YOURS, not the class.** Emit it item by item, state the RULE by which
   you derived it, and state **what that rule does not reach.** I modelled this on my own census in
   Task 1; hold yourself to the same. "I tried a range of shapes" is not a frame.
5. **A comment stating an invariant is not an enforcer of it.**
6. **Every fix ships its own teeth.** A repair with no test that fails without it is not landed.
7. **Grep the PATTERN, fix all sites** — a class recurring one site over means the fix shape is wrong,
   not its coverage. That is the whole reason Task 1 precedes Task 2.
8. **You may refuse any premise in this brief with evidence** — including my census and including
   anything in §WHY. A refusal with a read attached is a CORRECT return, not a failed bundle. Two
   builders refuted figures marked "verified" on this sprint today and both were right.
9. **Halt at a task boundary, never mid-task.**

---

## ENVELOPE — required fields

A `falsification_attempts` array with one entry per claim you ship or rely on. **An entry whose
`attack_run` is a *description* rather than something RUN is not an entry.**

Plus the inventory itself, the exact sites you changed, and every gate's exit code read separately.

**These five fields are REQUIRED and are read downstream (ED-377). An omitted field is read as
UNKNOWN, never as "nothing to report" — an empty `files_i_could_not_see` must be an explicit,
deliberate empty, not an absent key:**

- **`what_i_could_not_assess`** — anything you could not judge, and why.
- **`files_i_could_not_see`** — every file or region you sampled rather than read end to end.
- **`execution_proven`** — which of your claims you RAN versus reasoned about. Separate them plainly.
- **`what_would_confirm_or_refute`** — for anything unsure, the specific check that would settle it.
- **`read_outside_the_quoted_region`** — **REQUIRED.** Whenever you rate a claim or assert a mechanism,
  state what you read **OUTSIDE** the lines you quote.

  **Why this field exists, and it bit the conductor this round.** My own diagnostic brief named
  `createModelSession` as the evidence for a mitigation. Three of four lanes then grepped **exactly
  that symbol** and confirmed it. The one lane whose brief did not name it found the defect — the
  mitigation was false (Task 5b). **An excerpt is a frame, and a frame chosen by the person making the
  claim will tend to contain the evidence for it.** Corroboration across lanes that share a frame is
  worth nothing. That is not carelessness; it is what excerpting *is*, and the person quoting is the
  least able to notice it.

  Usable: *"I read L440-471 and the constants at L97-102, and nothing else in that file."*
  Not usable: *"I read the relevant section."*
