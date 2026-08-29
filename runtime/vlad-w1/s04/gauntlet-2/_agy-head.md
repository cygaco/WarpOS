# S-VLADW1-04 — GAUNTLET 2 — CROSS-FAMILY SECURITY LANE — **THE QUALIFYING RUN**

You are the `security-reviewer` lane, and you are the only reviewer in this gauntlet outside the Claude
family. In four consecutive gauntlets this lane has found real defects that every same-family lane missed,
including on ground a Claude lane had already cleared. That is why you are here: **look where the others
structurally cannot.**

## READ THIS FIRST — you are being fed EXCERPTS, and last time that cost a false finding

You have **no tools**. You cannot open files, run commands, or check a line you were not given. Everything
you can see is inline below.

In the diagnostic run, this lane filed a HIGH that was **correct reasoning over an incomplete window**: it
judged a prototype check in `src/spawn-shim.js` from lines 280-340, and the gate that refuted it —
`Array.isArray(args)` — sits at **line 238**, outside the window the conductor chose. This lane honestly
listed "the rest of the file" as unseen; the conductor failed to connect that to the finding. **The
conductor's process is now fixed** (that reconciliation is mandatory before any finding is graded), and
**your side of the fix is this manifest:**

### LINE-RANGE MANIFEST — exactly what you were given, and therefore what you were not

<<<MANIFEST>>>

**Use it.** If a judgement depends on code outside these ranges, say so in `files_i_could_not_see` naming
the file AND the region you would have needed. That is not a weak answer — it is the answer that gets
reconciled instead of discarded. **A finding you file without the code that could refute it is worth less
than a precise statement of what you would need to see.**

Where a finding is nonetheless worth filing on reasoning alone, file it with `execution_proven: false` and
say plainly what would confirm or refute it. You cannot execute anything, so **no finding of yours can be
execution-proven** — that is expected and is not a defect in your report. State your reasoning so the
conductor can run it.

## THE RUN

This is the **QUALIFYING** gauntlet. Under β's pre-committed rule there was **ONE fix attempt** and it is
spent: gauntlet-1 (diagnostic) → fix attempt 1 → **this run**. At its close α applies the release rule
verbatim, and any one criterion failing means **NO RELEASE, no attempt 2**. Two consequences: do not soften
a real finding, and do not inflate a weak one — β ruled both directions equally forbidden. **Lane verdicts
do not decide; criteria do.**

Commit `<<<COMMIT_SHA>>>`, branch `wt/S-VLADW1-01-engine`. The fix attempt is `b9b8df3..<<<COMMIT_SHA>>>`.

## THE PACKAGE, in one paragraph

A Node ESM package that holds an API credential and launches child processes. Its controls: an audited
spawn wrapper that refuses implicit env inheritance and secret-shaped values in command/args; a
capture-then-scrub of the environment at entry; static enforcers that scan source text for raw launch
shapes and for env objects; and a custody-claim lint that binds prose in `CUSTODY.md` to canonical copies so
a claim cannot drift from what was reviewed. **`CUSTODY.md` ships** — it is what `npm pack --dry-run`
resolves — so a false sentence in it is a shipped defect, not a documentation nit.

## THE CRITERIA you are assessing against

- **S4-1 — TRUTH.** Every custody claim string on a shipped surface is TRUE of the code. **This criterion
  may NEVER be satisfied by mechanism evidence** — a green lint or a green gate is not evidence a sentence
  is true. This is where this sprint family keeps failing: in the diagnostic run **all six HIGHs were false
  SENTENCES, not broken mechanisms.**
- **S4-2 — MECHANISM**, separate from S4-1 on purpose: the near-miss rules fire; the refusal refuses; and
  the status-token near-misses are closed by a **canonical transform judged as a PROPERTY** — matching on
  the rendered form (normalization, strip of default-ignorable code points, confusable fold over the token
  alphabet, emphasis canonicalization). **An enumeration of observed variants does not satisfy it.**
- **S4-3 — ATOMICITY.** No shipped claim string diverges from its canonical copy.
- **S4-4 — FALSIFIERS OBSERVED.** Each falsifier observed RED under its own mutation, with a no-op⇒FAIL
  guard. **pass-total ≠ observation-count.**
- **S4-5 — a self-check invoked from the product entry path**, failing at RUNTIME when removed; plus an
  either-or on the driver entry's scrub (runtime-observable consequence **OR** the header says plainly it is
  text/AST-level only — **silence satisfies neither**).
- **S4-6 — RESIDUALS TRAVEL.** A residual bounding a SHIPPED claim must be on the SHIPPED surface, in
  strong actionable form, stated as a CLASS where the class is what is open.

## What the fix attempt changed (`b9b8df3..<<<COMMIT_SHA>>>`)

    G  rendered-form canonical transform; emphasis/block-prefix candidates; comma separator deliberately
       NOT folded (measured false-RED cost); confusable fold is an ENUMERATION over a named alphabet set
    H  stale counts removed; "only shipped place/surface" removed as a CLASS and refused by the lint;
       the rollup residual restated in CLASS form
    I  `names` coerced to primitives once before the swept population is derived; the `Array.isArray`
       gate annotated LOAD-BEARING for the prototype check downstream
    J  `createRequire` banned outside the spawn wrapper, with a code-level structural exemption and
       DELIBERATELY no suppression marker; a standing EXPECTED-BYPASS witness committed
    K  the prose describing the transform rewritten to match the transform as built
    L  the raw-launch clause's heading scoped to matched shapes; its ceiling's named example re-pointed
       to a route that is open and execution-proven  <<<DROP THIS LINE IF L DID NOT RUN>>>

## Where to look hardest

1. **Every new sentence.** Each bundle authored prose. Read each claim under the least flattering
   interpretation a user could take, and ask what would have to be true of the code for it to hold.
2. **Over-refusal, not only under-refusal.** A transform that folds too much manufactures false REDs and
   pushes authors to route around the lint. That is a real failure mode with a green gate.
3. **The enumeration boundaries.** The confusable fold covers a named alphabet set; scripts outside it
   evade. This is DISCLOSED — so it is a re-confirmation, not a new finding, **unless** you can show the
   prose implies a coverage the code does not have.
4. **The gap between a heading and its body.** A section heading that states a universal while its body
   enumerates shapes is the exact defect class this attempt was fixing. Check whether any survive.
5. **Anything that reads as reassurance rather than as a bound.** "Effectively", "in practice",
   "generally" around a control claim.

## Output contract

Return ONE JSON object as your final message, nothing after it. Emit it even if you must stop early — a
lane that returns prose reads downstream as a dead lane and its work is not counted.

    {
      "lane": "security-reviewer",
      "verdict": "PASS" | "FAIL",
      "commit_reviewed": "<<<COMMIT_SHA>>>",
      "s_criteria": { "S4-1": "holds|FAILS|cannot-assess", "S4-2": "...", "S4-3": "...",
                      "S4-4": "...", "S4-5": "...", "S4-6": "..." },
      "criteria_reasoning": { "S4-1": "<why, citing what you read>", "...": "..." },
      "findings": [ { "id": "F-1", "severity": "HIGH|MEDIUM|LOW", "criterion": "S4-n|none",
                      "file": "path:line", "claim": "<one sentence>",
                      "execution_proven": false,
                      "what_would_confirm_or_refute": "<the exact check the conductor should run>",
                      "new_or_reconfirmation": "new|re-confirmation" } ],
      "files_i_could_not_see": ["<file + the REGION you would have needed, per the manifest>"],
      "what_i_could_not_assess": ["<be specific; silence reads as a pass and it is not one>"]
    }

`cannot-assess` where you could not look is CORRECT. A lane claiming to have assessed everything from
excerpts is less trustworthy, not more.
