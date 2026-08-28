# FIX BUNDLE 10f — the coordinated bind edit, and finish the no-op guards

Small, surgical bundle. **The tree is RED right now and item 1 is what turns it green.** Do item 1 first,
verify, commit. Then item 2. If you run short on time, item 1 committed alone is a good outcome; item 2
half-done and uncommitted is not.

## Where you work
- **Worktree (your cwd):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **Branch:** `wt/S-VLADW1-01-engine`, HEAD `977ab14`. Commit directly. Do NOT branch, do NOT push.
- Paths below are relative to `engine/`. You are the ONLY builder running; `git status` should be clean.

## Scope contract
**allowedFiles:**
- `engine/scripts/checks/custody-claim-lint.js` (item 1 — ONE canonical string)
- `engine/test/no-tautological-assertions.test.js` (item 2)
- `engine/test/env-scrub.test.js`, `engine/test/verified-by-resolver.test.js` (item 2, only if a mutant
  there lacks the guard)

**forbiddenFiles:** everything else. In particular **do NOT edit `engine/CUSTODY.md`** — its text is
correct and is the thing the lint must be brought into step with, not the other way round. Do not edit
`src/**`, `driver/**`, `test/entry-bootstrap.test.js`, `test/custody-claim-lint.test.js`, `package.json`,
`.gitattributes`.

---

## Item 1 — REQUIRED: bring the canonical copy into step with CUSTODY.md

Bundle 10c made a deliberate one-word truthfulness edit to a bound Ceiling paragraph in `CUSTODY.md`:

    - is tracked separately (the sprint's AC-8.6); as of this writing that self-check does not yet exist in `src/`
    + is tracked separately (AC-8.6); as of this writing that self-check does not yet exist in `src/`

The possessive "the sprint's" bound AC-8.6's delivery to THIS sprint, and AC-8.6 has been deferred to a
named successor, so the possessive goes false at close. **The new text is correct and stays.**

That paragraph is bound byte-for-byte by `scripts/checks/custody-claim-lint.js`, whose canonical copy still
carries the old wording. The lint is therefore RED, in both directions, exactly as designed:

    [custody-claim-lint] RED custody-claim-lint/paragraph-not-verbatim: ceiling paragraph
      "Ceiling — this fixture is not wired to run automatically in a user's install." (line 137)
      does not match its canonical copy in BOUND_PARAGRAPHS byte-for-byte
    [custody-claim-lint] RED custody-claim-lint/bound-paragraph-missing: bound paragraph
      "Ceiling — this fixture is not wired to run automatically in a user's install."
      no longer appears verbatim in CUSTODY.md

**Your job: update that ONE canonical copy in `BOUND_PARAGRAPHS` so it matches the shipped text exactly.**
Change the possessive and nothing else — not the surrounding sentences, not any other paragraph, not the
rule logic. This is a coordinated two-file edit whose other half has already landed; you are completing it.

**Do not "fix" this by loosening the comparison, widening a tolerance, or removing the paragraph from the
bound set.** The bind working is the point — it caught a real unannounced change to a bound claim, which is
precisely the defect class this sprint exists to close. Making it quieter would destroy the thing that just
proved itself.

Afterwards these three tests must go green: "GREEN: the real, shipped CUSTODY.md lints clean", "A5 GREEN:
the worded-rollup and forbidden-claim patterns do not false-positive...", and "Rule 4 non-vacuity: the
derivation finds the real document's Asserted AND Ceiling paragraphs, and every one of them is bound".

---

## Item 2 — finish the no-op guards that bundle 10c started

A mutant test whose `.replace()` finds nothing silently mutates nothing and then "passes", proving zero.
The guard against it is an assertion that the mutation actually changed the text, e.g.

    assert.notEqual(mutated, original, "the <X> mutation must actually change the text");

10c added these throughout `test/custody-claim-lint.test.js` (done — do not revisit) but did **not** reach
the other three files. Specifically `test/no-tautological-assertions.test.js` has **none**.

For each of your three allowed test files:
1. Find EVERY mutant — anything that copies or rewrites source/fixture text and then asserts a detector
   goes RED. Search for `.replace(`, mutation helpers, and any "OBSERVED RED" test.
2. For each one, ensure the mutation is **EOL-agnostic** (a search literal containing a bare `\n` will not
   match a CRLF checkout — tolerate `\r?\n` or normalise before replacing) **and** carries the
   no-op ⇒ FAIL guard.
3. Report the FULL list you found and which you changed. **The count is the deliverable** — a previous
   enumeration of this was incomplete, which is why this item exists.

If a file genuinely has no mutants, say so explicitly rather than silently skipping it.

---

## Verify — run each as its OWN command and read its own exit code

    cd engine
    node --test "test/*.test.js"
    npm run check:ship

Do NOT pipe a gate through `tail`/`head` inside an `&&` chain — the pipeline's status is the last command's,
so a RED gate reads as green. Suite floor is **308** passing, 0 fail, 0 skipped, 0 todo; `check:ship` exit 0.

Commit with a message starting `fix(10f):`. Stage only your own files by explicit path; never `git add -A`.

## Envelope — your FINAL message, JSON, nothing after it

    {
      "bundle": "10f", "ok": true, "commit": "<sha>",
      "files_changed": ["..."],
      "suite": { "pass": 0, "fail": 0, "skipped": 0, "todo": 0 },
      "check_ship_exit": 0,
      "item1_canonical_updated": "<the exact before/after, and the three tests now green>",
      "item2_mutants_found": ["<every mutant, per file — the full list>"],
      "item2_mutants_changed": ["<the ones you guarded or made EOL-agnostic>"],
      "files_with_no_mutants": ["..."],
      "what_i_could_not_do": ["..."]
    }

**Emit the envelope even if you must stop early.** A run that does real work and returns prose instead of
JSON reads downstream as a dead lane. Budget for it.
