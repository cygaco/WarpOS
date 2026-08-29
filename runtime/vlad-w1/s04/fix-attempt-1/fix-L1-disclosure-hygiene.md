# Fix brief — bundle L1 — disclosure hygiene on the shipped surface

You are a **backend-fixer** working in the vlad engine worktree.

- **Worktree (your cwd):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **Branch:** `wt/S-VLADW1-01-engine`, already checked out at `5b9b757`. Do NOT branch, merge or push.
- **Package root:** `engine/`

## scopeContract

**allowedFiles**
- `engine/CUSTODY.md` — four specific places, named below with line numbers and quoted text
- `engine/scripts/checks/custody-claim-lint.js` — the `BOUND_PARAGRAPHS` canonical copy of the ONE
  paragraph you edit in task 2, and nothing else in the file
- `engine/test/custody-claim-lint.test.js` — the two residual-escape failure MESSAGES only (task 3b)

**forbiddenFiles**
- Every other paragraph of `CUSTODY.md`; every other part of the lint; every other test and assertion;
  everything under `src/`, `driver/`, `scripts/checks/spawn-env-allowlist.js`; anything under `.claude/`.
- **Do not touch P2's heading or the `Ceiling — half (b)'s raw-launch…` paragraph.** A separate bundle
  (L2) owns those and runs after you. Two editors of one file is the defect this sprint exists to close.

If something cannot be done inside that scope, do not widen it — report it in `what_i_could_not_do`.

## Provenance

These come from β's read of the tree (row 313) plus one item the conductor found. **Every premise below
carries its proof line**, because two briefs in this attempt asserted "X is missing/required" from belief
rather than from a read and were correctly refused by their builders. **You are entitled to refuse any
premise here with evidence** — that is a correct return, not a failure. Check them; do not inherit them.

β's flag 1 is NOT in your scope: it asked whether both paragraphs describing the transform were reconciled.
Verified already — bundle K rewrote the fold list at line 56, and line ~30's sentence ("a zero-width space
or a Cyrillic homoglyph sitting inside the keyword no longer hides it") is true of the code as built. No
work owed.

---

## Task 1 — internal process vocabulary must not ship, and the NOT-bound list must not under-promise

**Two edits, one commit. Both are unbound header prose** — proof: neither is a `**Ceiling —` or `**A<n> —`
lead-in, so `extractBindableParagraphs` does not derive them and neither has a `BOUND_PARAGRAPHS` entry.
Bundle K established this for the same region by editing it document-side alone and staying green.

**(a)** `engine/CUSTODY.md:48` currently reads:

> A rollup claim must be reviewed, not linted: **S4-1's** reviewer read is the actual control, and the
> linter never was that control.

`S4-1` is an internal criterion id from this sprint's release rule. **A user of this package cannot resolve
it.** Replace it so the sentence names the thing rather than the id — "human review is the actual control"
is the intended sense. Keep the rest of the sentence, including "and the linter never was that control".

**Proof that this is the only such site**, so you do not have to trust the claim: `grep -n "S4-[0-9]\|ED-[0-9]\|row 3[0-9][0-9]\|β" engine/CUSTODY.md`
returns exactly one hit, line 48. **Re-run that grep yourself after your edit** and report the output — if
it returns anything, fix it too; if it returns nothing, that is your evidence.

**(b)** `engine/CUSTODY.md:13` promises "What is NOT bound byte-for-byte, **said plainly rather than
generalised**:" and then enumerates: this preamble, the P1–P4 status/enforcer/proof-scope lines, the P1–P4
body prose, A1's `Live measurement` follow-on, and the commentary around A5. **The three numbered "limits of
this file's own checker" paragraphs are not in that list, and they are not bound** — proof: bundle K edited
`(3) NON-BREAKING SPACE` on the document side alone, moved no canonical copy, and the suite stayed 366/0
with `check:custody` exit 0.

The class clause that opens the sentence does cover them, so this is **ambiguous, not false** — but the
sentence chooses to enumerate, and an enumeration that omits three paragraphs (one of them the description
of the transform itself) is weaker than it promises to be. **Close it with ONE clause**: either add the
numbered-limit paragraphs to the list, or say the class governs and the list is illustrative. **Not both.**
Do not weaken the class clause. Do not touch the P1–P4 body-prose entry — it is load-bearing (a lane proved
three flat falsehoods ship green there, and that omission is named on purpose).

Verify after: the derived bindable population is unchanged (check it, do not assert it) and the suite passes.

---

## Task 2 — a count of surfaces, one sentence before the paragraph argues counts are unavailable

`engine/CUSTODY.md:184`, inside the preload Ceiling, reads:

> This residual is also named on **one INTERNAL surface**: `test/entry-bootstrap.test.js` …

and then the same paragraph closes with:

> … an exhaustiveness claim about disclosure surfaces is not available to a bound paragraph at all, because
> binding is what creates the second shipped copy.

The paragraph argues that counting disclosure surfaces is not something it can do, **and counts them one
sentence earlier.** Change the count to an indefinite — "on an INTERNAL surface" — leaving everything else,
including the whole closing argument and the `--import` live-demonstration sentence, exactly as it is.

**This paragraph IS BOUND.** Proof: `Ceiling — process-level preload evaluates before this package's own ESM
graph, scrub included.` is a key in `BOUND_PARAGRAPHS` in `scripts/checks/custody-claim-lint.js`. **So the
canonical copy must move in the SAME commit** or the bind goes RED — and it is supposed to. That is RF-4,
and this task is a live exercise of it.

**Observe RF-4 before you commit:** make the document edit WITHOUT the canonical edit, run the lint, confirm
it goes RED and report the exact rule names and output, then complete the pair and confirm green. A mutation
that prints green is a FAILED observation, not a pass. Never commit the document edit alone "to check".

**A related class you may find while you are here:** this is the same defect family H removed as a class
("only shipped place/surface"), which the lint now refuses inside bound paragraphs under the rule
`custody-claim-lint/only-surface-assertion` (`scripts/checks/custody-claim-lint.js:1394`). That rule matches
phrases, not counts, which is why this one survived. **If extending its family to cover a COUNT of surfaces
inside a bound paragraph is genuinely cheap and does not over-refuse, do it and prove both directions
(fires on the count; does not fire on legitimate prose). If it is not cheap, do NOT force it** — say so in
`what_i_could_not_do` and the count stays disclosed rather than mechanised. Do not damage the existing rule.

---

## Task 3 — two disclosures that read wrong to the person who would act on them

**(a) Calibrate the confusable disclosure.** In K's paragraph (around line 56-67) the confusable fold is
disclosed as an enumeration over Cyrillic and Greek, with Armenian, Cherokee, Coptic, Deseret and Lisu named
as evading it. That is accurate and stays. What is missing is the **calibration**: Cyrillic and Greek are
the scripts a homoglyph reaches by MISTAKE — a paste from mixed-script text, an editor substitution — while
the remainder is reachable essentially only by someone doing it deliberately. Add that mistake-vs-attacker
split so the ceiling reads as calibrated rather than as an open hole. **Do not claim the remainder is
closed, and do not claim the enumeration is complete.** One or two sentences.

**(b) The anti-staleness test must not read as "do not fix this."**
`engine/test/custody-claim-lint.test.js` around line 1338-1343 holds the two escapes named at
`CUSTODY.md:38-42` with a test that FAILS if either is ever closed. Its message currently ends:

> … the "unemphasised lead-in" escape named in CUSTODY.md's header is now STALE and must be rewritten

A maintainer who closes the gap sees a RED test and can reasonably read it as "closing this was wrong."
**Extend both escape messages** so they say the order of operations plainly: closing the gap is GOOD, and
what is owed is to update `CUSTODY.md`'s disclosure FIRST and then this test. Message text only — **do not
change what either assertion tests, and do not loosen a predicate.**

---

## How to work

1. **Run the attack, then write the claim.** Every sentence you ship is one you tried to break first.
2. **Commit after each task** — three commits. Task 2's pair lands as ONE commit by requirement.
3. **Gates before you finish**, each as its own command reading its real exit code, never piped through
   `tail`/`head` in a `&&` chain: the test suite from `engine/` — floor **366 pass / 0 fail** — and
   `npm run check:ship` — exit 0. If a failure is not yours, prove it (diff, `git show`) and say so.
4. **Never `--no-verify`. Never add an allowlist entry to get past a guard. Never reshape a command a guard
   denied.** If the doc-ref-integrity merge-guard denies your commit over pre-existing broken refs in
   `.claude/**` that are not yours: **STOP after ONE denial**, leave the work STAGED by path, and report it
   with the guard's output. The conductor verifies and lands it. That has happened to three builders this
   session; it is expected and it is not your failure.
5. **Never put a credential-shaped literal anywhere.** Labelled placeholders only.
6. **Halt at a task boundary, never mid-task.** A half-applied claim edit with no canonical edit is exactly
   the defect this sprint exists to close.

## Envelope — return as your final message

```json
{ "bundle": "L1", "ok": true|false, "commit": ["<sha>", "..."],
  "files_changed": ["..."],
  "suite": {"pass":0,"fail":0,"skipped":0,"todo":0},
  "check_ship_exit": 0,
  "internal_id_grep_after": "<the command and its FULL output>",
  "edits": [ {"task":"1a|1b|2|3a|3b","before":"<verbatim>","after":"<verbatim>"} ],
  "rf4_observation": {"command":"<exact>","mutation":"<what you left out>","result":"RED|GREEN","raw_output":"<the lines>"},
  "only_surface_rule_extended": "yes|no — <why; if yes, both directions proven>",
  "falsification_attempts": [
    {"claim":"<the exact sentence or premise>","attack_run":"<the command or probe you ran>","outcome":"HELD|FALSIFIED|CONFIRMED — <what happened>"}
  ],
  "premises_i_refused": ["<any premise of this brief you found false, with your evidence>"],
  "residuals_named": ["..."],
  "what_i_could_not_do": ["..."] }
```

One `falsification_attempts` entry per claim you shipped or relied on. An entry whose `attack_run` is a
description rather than something you ran is not an entry.
