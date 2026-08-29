# NEAR-MISS BATTERY — S-VLADW1-05 design phase — every bound rule, CONTROLS FIRST

**Run:** 2026-08-29, by ε, against vlad `wt/S-VLADW1-01-engine @ 6a105f2`.
**Zero files mutated.** The harness imports the shipped module and drives the **real matcher**; the
"FIXED" column applies the proposed transform to the INPUT rather than reimplementing the matcher.
Harness: `runtime/vlad-w1/s05/run-battery.mjs`.

> **Why the harness drives the real matcher.** The first draft of this battery reimplemented
> `statusTokenPattern` and **its own controls went GREEN** — it would have "proven" a fix that did
> nothing. A battery whose controls do not fire proves nothing about its near-misses, and one that
> reimplements the thing under test measures the reimplementation. Both were caught here, at design,
> which is the whole point of running it before the build.

## Result

    CONTROLS FIRST — 7 controls: AS-IS 7/7 RED, FIXED 7/7 RED     ← battery VALID in both columns
    R3 near-miss  GREEN as-is (the S4-2(c) gap): 7/8
    R3 near-miss  RED under FIX A:               8/8
    R1 S4-1b      GREEN as-is:                   12/12
    R1 S4-1b      RED under FIX B:               12/12
    R1 S4-1a      GREEN as-is:                   3/3
    R1 S4-1a      RED under FIX C:               3/3
    OVER-REFUSAL  still GREEN under the fixes:   6/6
    DISCLOSED     unchanged by the fixes:        1/1

## R3 — status-token separation (the S4-2(c) failure)

Token under test: `"ASSERTED — NOT VERIFIED"` (read from the module's own export, never guessed).

| kind | authoring | AS-IS | FIXED |
|---|---|---|---|
| **CONTROL** | exact token | **RED** | **RED** |
| **CONTROL** | whole token bolded | **RED** | **RED** |
| near-miss | bold on first half `**ASSERTED** — NOT VERIFIED` | GREEN | **RED** |
| near-miss | italic on both halves | GREEN | **RED** |
| near-miss | bold mid-word `ASS**ERTED**` | GREEN | **RED** |
| near-miss | underscore emphasis | GREEN | **RED** |
| near-miss | bold on second half | GREEN | **RED** |
| near-miss | code span `` `ASSERTED` `` | GREEN | **RED** |
| near-miss | bold on the separator | GREEN | **RED** |
| near-miss | strikethrough | RED | **RED** |
| disclosed-residual | comma separator | GREEN | GREEN (unchanged, correctly) |
| over-refusal | prose w/ comma | GREEN | GREEN |
| over-refusal | prose, words apart | GREEN | GREEN |
| over-refusal | prose, no adjacency | GREEN | GREEN |

**Strikethrough was already RED as-is** — one of the eight was closed by accident rather than by
design, which is worth knowing before someone claims the fix closed all eight.

## R1 — lead-in resemblance (S4-1b prefixes, S4-1a unmapped letters)

| kind | authoring | AS-IS | FIXED |
|---|---|---|---|
| **CONTROL** | `**Ceiling — x` plain | **RED** | **RED** |
| **CONTROL** | `**A9 — x` | **RED** | **RED** |
| **CONTROL** | `- **Ceiling — x` (already handled) | **RED** | **RED** |
| **CONTROL** | `> **Ceiling — x` (already handled) | **RED** | **RED** |
| **CONTROL** | `**Cеiling` Cyrillic e (mapped today) | **RED** | **RED** |
| S4-1b | `#`, `##`, `###`, `####`, `#####` | GREEN ×5 | **RED ×5** |
| S4-1b | `\|`, `<p>`, `"`, `(`, `[`, `Note: `, `•` | GREEN ×7 | **RED ×7** |
| S4-1a | Cyrillic PALOCHKA U+04CF → `l` | GREEN | **RED** |
| S4-1a | Greek ETA U+03B7 → `n` | GREEN | **RED** |
| S4-1a | Greek GAMMA U+03B3 → `g` | GREEN | **RED** |
| over-refusal | `## Proven` (a real heading) | GREEN | GREEN |
| over-refusal | prose using the keyword | GREEN | GREEN |
| over-refusal | `**Status:** PROVEN` | GREEN | GREEN |

**The over-refusal row matters as much as the near-miss row.** A prefix strip that made
`## Proven` a bindable candidate would be a worse defect than the one it fixes; it does not.

## The three fix shapes, validated

- **FIX A — S4-2(c).** Move the emphasis strip **inside** the one shared transform so every caller
  gets it, rather than beside it in `flattenForAssertionScan`. Closes 8/8 R3 near-misses with **zero
  over-refusal** and the disclosed comma residual untouched.
- **FIX B — S4-1b.** Extend refuse-not-skip on the LEAD-IN path to every block prefix, ATX headings
  included. Closes 12/12 with zero over-refusal.
- **FIX C — S4-1a.** Widen coverage to the letters the map lacks. Closes 3/3.

## What this battery does NOT establish — stated so nobody reads it as more than it is

1. **It does not prove the fixes are correct as implemented** — only that these transforms, applied
   to these inputs, produce these verdicts through the real matcher. The build must re-run it against
   the predicate **as built**, by a lane and not by ε, exactly as S4-2(d) required.
2. **FIX C's letter list is a sample, not a closure.** Ten letters were mapped here to demonstrate the
   shape. The sprint's own lesson forbids shipping a sentence that calls this "the scripts closed" —
   coverage must be stated as **the letter set actually mapped**, or a real confusables table vendored.
   **Three unmapped letters proven evadable does not tell us how many remain.**
3. **The prefix class is likewise a sample.** Twelve shapes were probed; the fix must be written as a
   class over block prefixes, and its disclosure must say so rather than counting.
4. It says nothing about S4-1c (the NOT-bound enumeration), which is a prose defect with no matcher.
