# Class 5 — the ungraded delta, verified by two methods

E1 grades the **pin-time** copy of the residual register; the **close-time** register was graded
by no lane. The gap is not "the register" — it is three sentences, named here.

| copy | path | bytes | sha256 | entries |
|---|---|---|---|---|
| pin-time (what E1 reads) | `.claude/worktrees/enf-e1-claimtruth/runtime/enforcement-sweep/2026-08-29/S6-7-RESIDUALS.md` | 11294 | `5673b5c9f70c55d4` | 12 |
| close-time (graded by nobody) | `runtime/enforcement-sweep/2026-08-29/S6-7-RESIDUALS.md` | 15561 | `104c30da0bc8efce` | 14 |

## The delta is exactly three sentences

1. **R-13** — a suite class whose verdict depends on the kind of checkout it runs in (ED-408).
2. **R-14** — the installed manifest promises an asset no clean checkout carries, flipping a
   release gate (ED-409).
3. **The count sentence** — pin L90 `**Entries: twelve.**` against root L103
   `**Entries: fourteen.**`; the remainder of that sentence is byte-identical in both.

R-1 through R-12 are byte-identical between the two files.

## Two warrants, labelled

- **beta read both files in full** (its own words: a full read, not a machine diff) and reported
  R-1..R-12 identical, delta = R-13, R-14, count sentence.
- **The conductor ran a machine diff**: 1 removed line, 14 added lines, heading delta `12a13,14`.

Two independent methods, same answer. Neither is cited as the other.

## Why naming the payload matters

"The close-time register was graded by no lane" understates the gap. R-13 and R-14 carry the
round largest open coverage claim — *of the twenty checks the release runner covers, which read
a gitignored input? Two answered, eighteen unexamined* — and the delta includes a **count**, the
sentence class this round has most often found wrong. The successor item names these three
sentences, not "the register".

## A caveat that belongs with it

Line 3 of the pin copy reads, verbatim:

> `**Status: GRADED — inside lane E1's fifth class** ("the sprint's close-time residual register
> — the artifact the sprint emits to carry its residuals forward, under the sprint's evidence
> directory"). Its sentences are shipped claims and are gradeable as such.`

A pin-time file whose own status line calls itself the close-time register. It is false **of the
object E1 is reading**, and false because of where the lane was pointed — not because of anything
in the file as written. So: a class-5 finding of that shape is attributable to the envelope's
position and does not count against the shipped register; that attribution licenses nothing else,
and every other class-5 finding is E1's on its own terms under AG-2 and AG-11.

Related to the family of values whose meaning depends on where the reader stood — but distinct in
mechanism: the other members are values *computed* at read time, and this one is a
**self-description that travels with the artifact**, so no field exists to check.
