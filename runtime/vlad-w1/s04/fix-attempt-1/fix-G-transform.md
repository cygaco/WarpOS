# BUNDLE G — the canonical transform, widened to the classes that defeated it

Sprint S-VLADW1-04, **fix attempt 1 — and there is no attempt 2.** The next gauntlet is the QUALIFYING run.
HEAD `b9b8df3`. You are the only builder running; `git status --porcelain -- engine/` should be 0.

## Where you work
Worktree `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine`. Commit here. No branch, push, or merge. Paths relative to `engine/`.

**allowedFiles:** `engine/scripts/checks/custody-claim-lint.js` · `engine/test/custody-claim-lint.test.js`
· `engine/CUSTODY.md` (**Task 4's header sentence ONLY** — nothing else in the file)
**forbiddenFiles:** everything else. Stage only your files by path; never `git add -A`.

---

## THE PROCESS RULE FOR THIS ATTEMPT — read before anything else

**You draft each shipped claim sentence AFTER running the attack that would falsify it. No claim without
its attack.** Your envelope carries a `falsification_attempts` array: per claim, the attack you ran and its
outcome.

This is not ceremony. A diagnostic gauntlet just found **six HIGH findings and every single one was a false
sentence, not a broken mechanism** — each written before anyone tried to break it. Bundle A wrote *"the
lint refuses it by name when it RESEMBLES one — bolded, opening with an `A<n>`, `Asserted` or `Ceiling`
keyword"*, naming two escapes. **Three shapes that are bolded AND open with the keyword ship green.** The
sentence was true of the intent and false of the code.

---

## TASK 1 — Unicode: the transform is defeated one alphabet over

`canonicalizeClaimText` folds the `\p{Pd}` dash class, JS `\s`, and case. **It performs no Unicode
normalization and no confusable fold.** Execution-proven against a green gate:

| injected into the Asserted section | result |
|---|---|
| exact `PROVEN` (control) | **RED** `status-token-conflation`, exit 1 |
| `PRO\u200bVEN` (ZERO-WIDTH SPACE) | **GREEN**, exit 0 |
| `PR\u041eVEN` (CYRILLIC О) | **GREEN**, exit 0 |

Also evading: soft-hyphen `U+00AD`, ZWNJ `U+200C`, ZWJ, WJ, LRM `U+200E`, full-width forms, and for the
ASSERTED token the separators `~`, `|`, `U+30FC`. Note `/\s/.test('\u200b') === false` — that is the root.

**Build:** apply **NFKC**, **strip default-ignorable code points**, and a **confusable fold over the token
alphabet** (at minimum Cyrillic and Greek homoglyphs of the Latin letters used in `PROVEN`, `ASSERTED`,
`Ceiling`, `NOT VERIFIED`). **Apply to BOTH the status-token comparison AND the lead-in resemblance** — they
share the defect.

**Prefer NFKD-then-fold over NFKC where a decision turns on visual equivalence**, and say in the header
which you chose and why.

## TASK 2 — markdown emphasis and block prefixes

Three shapes are bolded, open with the keyword, and ship **GREEN** — outside both escapes the header names:

- `**Ceiling** — <claim>` (bold closed **around** the keyword): `RESEMBLANCE_KEYWORD` matches, then
  `rest.slice(0,1)` is `*`, which is not dash/colon/space, so `resemblesBindableLeadIn` returns null and
  **the line is silently skipped** — the exact fail-open Task 1 of bundle A was built to close.
- `- **Ceiling — <claim>` (list item) and `> **Ceiling — <claim>` (blockquote): the regex anchors on
  `^\s*\*\*` and a `- ` / `> ` prefix is not whitespace. Contrast: a two-space indent **is** caught, and its
  refusal text says *"must start at column 1 … and no leading whitespace"* — **indentation was considered
  and markdown block prefixes were not.**

**Build:** canonicalize markdown emphasis (strip `*`/`_` runs around the keyword) and permit a leading
list-item/blockquote prefix **before** testing the lead-in, so any line whose first token after stripping is
`A<n>`/`Asserted`/`Ceiling` is a **candidate → bound or REFUSED, never skipped.**

**Guard the other direction.** `Status`, `Enforcer`, `Proof scope` are P-clause metadata (12 lines) and must
NOT become violations. The real document must stay clean: `check:ship` exit 0 at the end.

## TASK 3 — separator variance (the same class from another direction)

Still GREEN with the Asserted token in the Proven section: `ASSERTED—NOT VERIFIED` (no spaces around the
dash), `ASSERTED: NOT VERIFIED`, `ASSERTED NOT VERIFIED`, `ASSERTED -- NOT VERIFIED`, `ASSERTED, NOT
VERIFIED`. The transform folds dash *class* and whitespace *runs* but not dash **count**, dash **absence**,
or **zero** whitespace.

**Close what you can close safely.** If collapsing separators to nothing would over-match ordinary prose and
produce false REDs, **do not force it** — narrow it, and **DISCLOSE the exact residual precisely** rather
than silently leaving it. A false RED erodes the gate as surely as a false green. Say which you did and why.

## TASK 4 — batteries controls-first, then rewrite A's header sentence to what they PROVE

Extend RF-1 and the status-token battery with, at minimum: the three emphasis/prefix shapes, ZWSP and
homoglyph variants, and the separator variants from Task 3. **Controls first — a rule whose control does
not fire proves nothing about its variants.** Every mutant carries the **no-op⇒FAIL guard**
(`assert.notEqual(mutated, original, …)`) and **EOL-agnostic matching** (`\r?\n`, never a bare `\n`).

**Then, and only then, rewrite `CUSTODY.md`'s header sentence about the resemblance class to state what
your battery actually proved** — including any escapes that remain, named. **Run the battery first, write
the sentence second.** That ordering is the whole point.

---

## Discipline
- **Suite floor 339**, 0 fail / 0 skipped / 0 todo. APPEND; never shrink.
- **COMMIT AFTER EACH TASK.** Four tasks, four commits expected.
- **NEVER offer a green gate as evidence that a sentence is TRUE.** A passing lint proves text matches its
  stored copy and nothing more.
- Any claim paragraph you touch moves **with its canonical copy in the same commit**; run RF-4.

## Verify — each as its OWN command, its own exit code (never pipe a gate through `tail` in an `&&` chain)

    cd engine
    node --test "test/*.test.js"
    npm run check:ship

## Envelope — FINAL message, JSON, nothing after it

    { "bundle": "G", "ok": true, "commit": "<sha list>", "files_changed": ["..."],
      "suite": {"pass":0,"fail":0,"skipped":0,"todo":0}, "check_ship_exit": 0,
      "transform": {"normalization":"NFKC|NFKD + why","ignorables_stripped":["..."],
                    "confusable_fold":"...","applied_to":["status-token","lead-in resemblance"]},
      "emphasis_and_prefixes": "<what is now a candidate; and the over-refusal check on Status/Enforcer/Proof scope>",
      "separator_variance": "<closed | narrowed + the exact residual disclosed, and why>",
      "batteries": {"controls_fired": "...", "variants_now_RED": ["..."], "variants_still_GREEN": ["..."]},
      "falsification_attempts": [
        {"claim":"<the shipped sentence you wrote>","attack_run":"<what you executed to falsify it>","outcome":"<result>"}
      ],
      "header_sentence_after": "<the exact text, written AFTER the battery>",
      "residuals_named": ["..."], "what_i_could_not_do": ["..."] }

Emit the envelope even if you stop early. **Committing beats finishing.** Commits start `fix(G):`.
