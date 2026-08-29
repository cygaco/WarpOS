# S-VLADW1-04 — Retrospective

**Closed at honest state 2026-08-29. NOT released. 80%.**
Ruling: `runtime/vlad-w1/s04/gauntlet-2/ALPHA-RULING-S4-1-TO-S4-6.md` — **S4-1 FAILS · S4-2(c) FAILS ·
S4-3 HOLDS · S4-4 HOLDS · S4-5 HOLDS · S4-6 HOLDS.** Terminal applied verbatim: no fix attempt 2.
β confirmed the application at row 316 (`6e2d94af`). Surface left unmerged at `6a105f2`.
Successor: **S-VLADW1-05**.

## The headline lesson

> **Approval is not a truth check — no shipped claim without its attack.**

The confusable-fold calibration sentence was **recommended by β, approved by α, and reviewed by ε**. It is
false of the code. β graded its own recommendation as correctly false, declaring the conflict first and
running the position-swap: *"approval is not a truth check, and β's recommendation is worth exactly nothing
against the shipped bytes."*

Three faces signing a sentence is not evidence it is true. Only running the attack is.

## The two mechanisms behind it

**1. The coverage-granularity class (S4-1a / S4-1b / S4-1c).** A coverage claim stated at a coarser
granularity than the mechanism actually has.

- **S4-1a** — "the two scripts the fold DOES cover" asserts a **script-level closure over a letter-level
  sample**. `CONFUSABLE_FOLD` is a 56-entry map reaching 36 of 52 Latin skeleton letters; `Ceiling` needs
  `l`, `n`, `g` and the map has none of them. In-script Cyrillic U+04CF and Greek U+03B7 / U+03C4 authorings
  ship **GREEN** — reached by the "paste from mixed-script text" accident vector the paragraph itself names.
- **S4-1b** — "two escapes REMAIN" is false; a third class (ATX-heading-prefixed lead-ins, thirteen prefix
  shapes) is silently skipped. **The paragraph directly above it narrates its own predecessor being false
  for the same reason.**
- **S4-1c** — the "what is NOT bound, said plainly rather than generalised" enumeration omits the P1–P4
  clause headings; an inverted P2 heading ships green.

Three instances, one class. The successor is aimed at the class, not the three sentences.

**2. The beside-not-inside fold (S4-2(c)).** `canonicalizeClaimText` performs no markdown-emphasis fold, so
`**ASSERTED** — NOT VERIFIED` plants green inside the `## Proven` section — the real CLI counts it as a
fifth Proven claim and exits 0. Emphasis canonicalization **exists one function away**, in
`flattenForAssertionScan`. Bundle G's own comment says the two comparison sites *"share one defect, so they
must share one transform"* — the shared transform was applied, and the fold was implemented **beside** it.

**A comment stating an invariant is not an enforcer of it.** Found independently by two lanes that never saw
each other's work.

## What landed and held

Eight of the nine carried residuals plus AC-8.6, and they survived adversarial re-attack: refuse-not-skip
closing all seven near-miss authorings (controls firing the correct *distinct* rule); a rendered-form
transform catching 26 of 27 probed dimensions; the `args.map` door re-attacked with **twelve live-child
shapes for zero leaks**, `toString()` called exactly once; AC-8.6 with **RF-7 RED at runtime**, not
text/AST; a `createRequire` ban with a structural exemption and deliberately no suppression marker; the
suite grown **339 → 366** with every mutant no-op-guarded; and **S4-2(d) discharged twice independently**,
controls-first. Four of six criteria hold under α's own re-execution (33/33, 0 skipped).

## What the process got right

- **The diagnostic gauntlet paid for itself** — six defects found on a run that could not fire the terminal.
- **Lane independence produced the decisive finding twice.**
- **Builders refused conductor premises with evidence three times, and were right every time.** An
  unrefusable brief converts the author's error into shipped code.
- **ED-362's machinery worked.** The cross-family lane filed two HIGHs from a false Unicode belief, but
  marked both `execution_proven:false` and supplied the exact refuting command — refuted in two commands
  where the previous round's equivalent cost a fix bundle.
- **Refusing an exception clause at mint time was load-bearing**, and it only showed at the close: the
  single mechanism failure is precisely the defect a "mechanical failures only" carve-out would have been
  argued into.

## Where the conductor was the defect

Three briefs asserted "X is missing/required" from belief rather than a read (ED-363) — one cost a whole
dispatch cycle, and was avoidable because a prior builder had reported the same fact in a field that was
read and not acted on. An enforcement sweep was scoped to where the instance was rather than where the class
lives. Polling was narrated and then yielded, repeatedly, so α's watchers carried every wait. A mid-write
tree was read as clean once. And a commit message claimed a file met its line cap without measuring it —
corrected at a measured count, with the miss recorded **inside** the retro rather than quietly fixed,
because it is the smallest possible instance of this sprint's own finding.

## Carried to S-VLADW1-05

One transform for both sites with the emphasis fold inside it; refuse-not-skip on the lead-in path for every
prefix class; coverage stated as the mapped letter set (or a vendored table), never as "scripts closed";
escape counts replaced by named classes; the unbound description paragraph bound via the fixture builder.
Plus the standing discipline — **every shipped claim sentence drafted after the attack that would falsify
it, including sentences β recommends and α approves** — and a fresh β rule minted before any result exists.
`S4-1…S4-6` do not carry over.

## The line worth keeping

The rule was minted before results existed, refused an exception clause, and was then applied against work
its own authors wanted to pass — including β's own recommended sentence. That is the machinery working, and
the honest close is the product.
