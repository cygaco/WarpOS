# BUNDLE F — anchor the self-relative deictic "this fix cycle"

Sprint S-VLADW1-04. **ONE fix attempt exists this sprint.** Bundles A–E have landed. You are the ONLY
builder running; `git status` under `engine/` should be clean when you start.

## Where you work
- **Worktree (cwd):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
  `wt/S-VLADW1-01-engine`. Commit here. Do NOT branch, push, or merge.

## Scope contract
**allowedFiles:** `engine/CUSTODY.md` · `engine/scripts/checks/custody-claim-lint.js` (canonical copies ONLY)
**forbiddenFiles:** everything else, including every test file and all of `engine/src/**` and
`engine/driver/**`. Stage only your two files by path; never `git add -A`.

**Do not change the lint's RULES.** You are moving canonical copies to match corrected prose, nothing else.

## The defect — third instance of one class this sprint

`CUSTODY.md` uses the self-relative phrase **"this fix cycle"** at seven sites: **lines 88, 98, 163, 264,
277, 298**, plus **"as of this writing" at 167**. The phrase means *the cycle that authored the sentence* —
but nothing in the text says which cycle that is, so **the referent shifts the moment a later cycle edits
the file**, and a sentence that was true when written silently becomes false.

**Lines 88 and 277 are the sharpest and come first:** they assert current CODE state (e.g. *"As landed in
this tree as of this fix cycle"*) under a phrase whose referent moves. That is a claim about the code
anchored to nothing.

This is the **third instance of the shifting-referent class in this sprint**: bundle B corrected a sentence
that mis-attributed an observation to "this fix cycle", and before that a plan-contract line was corrected
for a possessive ("the sprint's AC-8.6") that bound a deliverable to whichever sprint was reading it.
**Correct it as a class, not as seven separate typos.**

## Task 1 (the one verified-run task) — anchor or remove, all seven sites

For each site, choose by what the sentence is doing:

- **Asserting CODE state → ANCHOR** to something that does not move: a commit hash, or a dated sprint id
  (`S-VLADW1-04`, 2026-08-28). Start with **88 and 277**. "As landed in this tree as of this fix cycle"
  becomes a statement about a named commit or a named sprint, so a future reader can check it.
- **Mere narration → REMOVE** the deictic. If a sentence reads correctly without any temporal phrase, drop
  it rather than anchoring noise.

**Do not invent an anchor you have not verified.** If you anchor to a commit, confirm that commit actually
contains the state you are asserting (`git log`, `git show`). An anchor that is wrong is worse than a
deictic that is vague, because it looks checkable.

**ATOMIC:** every paragraph you touch has a canonical copy in the lint. **Both move in the same commit.**
Run **RF-4** and **observe it RED** by editing one side only, then restore — report the real output rather
than asserting atomicity held. That observation is the deliverable, not the assertion.

## Task 2 (report only — do NOT edit) — the rest of the family

`grep` `CUSTODY.md` for the sibling unanchored temporal deictics: **`currently`, `now`, `at present`,
`the latest`**, and anything else of that shape you notice.

**REPORT what you find in your envelope with line numbers and a one-line judgement each — and change
none of it.** Widening scope mid-bundle is how the atomicity defect gets manufactured, and the point of
this task is to size the remaining class honestly, not to close it.

## Discipline
- **Suite floor 331** (or higher after A–E), 0 fail / 0 skipped / 0 todo.
- **COMMIT after Task 1.** Task 2 is report-only and adds no commit.
- **NEVER offer a green gate as evidence that a sentence is TRUE.** A passing lint proves the text matches
  its stored copy — nothing about whether it is true of the code. Say what you read in the code.
- If anchoring reveals that a sentence is *false* rather than merely vague, **say so in your envelope** and
  do not quietly rewrite the claim's substance — that is a different bundle's decision.

## Verify — each as its OWN command, its own exit code (never pipe a gate through `tail` in an `&&` chain)

    cd engine
    node --test "test/*.test.js"
    npm run check:ship

## Envelope — FINAL message, JSON, nothing after it

    { "bundle": "F", "ok": true, "commit": "<sha>", "files_changed": ["..."],
      "suite": {"pass":0,"fail":0,"skipped":0,"todo":0}, "check_ship_exit": 0,
      "sites": [ {"line":88,"disposition":"anchored|removed","before":"...","after":"...","anchor_verified_how":"..."} ],
      "rf4_observed_red": "<the real output from editing one side only, then restoring>",
      "sibling_deictics_found": [ {"line":0,"phrase":"...","judgement":"..."} ],
      "any_sentence_found_FALSE_not_merely_vague": ["... or none"],
      "residuals_named": ["..."], "what_i_could_not_do": ["..."] }

Emit the envelope even if you stop early. **Committing beats finishing.** Commit message starts `fix(F):`.
