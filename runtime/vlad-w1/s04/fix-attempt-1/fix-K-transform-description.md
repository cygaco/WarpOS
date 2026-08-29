# BUNDLE K — make the shipped description of the transform match the transform

Sprint S-VLADW1-04, **fix attempt 1 — there is no attempt 2.** Bundles G and H have landed; bundles I and J
may still be running on `src/**` and `scripts/checks/spawn-env-allowlist.js`. **One task.**

## Where you work
Worktree `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine`. Commit here. No branch, push, or merge. Paths relative to `engine/`.

**allowedFiles:** `engine/CUSTODY.md` (**the `canonicalizeClaimText` description ONLY**) ·
`engine/scripts/checks/custody-claim-lint.js` (**its canonical copy ONLY**)
**forbiddenFiles:** everything else, including all `src/**`, `driver/**`, every test file, and every other
paragraph of `CUSTODY.md`. Stage only your two files by path; never `git add -A`. Other bundles' files may
show modified in `git status` — **leave them.**

## The situation

Bundle G widened `canonicalizeClaimText` substantially. **The shipped sentence describing it was outside
G's allowed edit, so G left it and flagged it** — correctly refusing to reach outside its scope:

> *"`CUSTODY.md` … describes `canonicalizeClaimText` as folding only dash class + whitespace + case, which
> bundle G has now widened. That text is OUTSIDE Task 4's allowed edit, so I left it. It UNDERSTATES the
> transform's strength rather than overstating it, so it is stale in the safe direction — but it should be
> corrected in a follow-up with the scope to do so."*

Find it by CONTENT (line numbers move): the paragraph containing *"one named canonical transform,
`canonicalizeClaimText`, which folds the Unicode dash class to a single hyphen, collapses whitespace runs,
and folds case"*. It does not say "only", so it is **incomplete rather than false** — but a reader takes it
as the description of what the mechanism does, and an incomplete mechanism description on a shipped surface
is the exact shape this sprint keeps catching.

## THE TASK — rewrite it to what G actually built

State all of it, and state the limits as limits:

1. **NFKD normalization** — and it is NFKD rather than NFKC deliberately, because NFKD decomposes a
   precomposed character into base + combining marks so the marks can be removed; NFKC would recompose them.
2. **Default-ignorable code points stripped BY PROPERTY** (`\p{Default_Ignorable_Code_Point}`), not by a
   hand-list — ZWSP, ZWNJ, ZWJ, WJ, LRM/RLM, soft hyphen, variation selectors, BOM.
3. **Confusable fold over Cyrillic and Greek ONLY — and say plainly that this one IS an enumeration.**
   **Named residual, required:** Armenian, Cherokee, Coptic, Deseret and Lisu lookalikes **still evade**.
   (`**Ꮯeiling —` and `**Ceոling —` were both observed GREEN.) A property-driven fold would need a vendored
   Unicode confusables data file, which is out of scope. **Do not dress this up — the dash fold is
   property-driven and the confusable fold is not, and the difference matters to a reader.**
4. **Markdown emphasis and block-prefix canonicalization** — nested list-item/blockquote prefixes and
   indentation are stripped, and an emphasis run opened before OR closed around the keyword is canonicalized,
   before the lead-in is tested.
5. **Separator variance closed except comma/semicolon/period** — and say **why**: including the comma was
   MEASURED to refuse ordinary prose (*"the item is asserted, not verified"*), because the comma is what
   makes it a grammatical English contrastive clause. Name the **accepted false-RED cost**: bare adjacency
   *"asserted not verified"* in running prose now goes RED.
6. **Leave the NBSP sentence alone.** It says the whitespace fold tolerates a non-breaking space. **That is
   still TRUE** — verified: NFKD folds NBSP to a space, so an NBSP substitution still compares EQUAL and is
   still tolerated. Do not "fix" it.

## S4-6 — the enumeration residual must travel

Item 3's residual (the confusable fold is an enumeration; Armenian/Cherokee/Coptic/Deseret/Lisu evade) must
appear **on the shipped surface**, in this paragraph, where the claim's reader is — not only in a test
comment or the round record. That is the S4-6 obligation for this residual.

## The falsification rule — what the attack looks like for a DESCRIPTION claim

**You draft each sentence AFTER running the attack that would falsify it.** For a claim describing a
mechanism, **the attack is: mutate the transform so the named behaviour stops happening, and show the
described behaviour changes.** For example — to claim "default-ignorables are stripped", remove that step
and show a ZWSP variant flips from RED to GREEN; restore. If a clause of your description survives a
mutation that should have broken it, the clause is describing something that is not there.

Your envelope carries a `falsification_attempts` array: per claim, the attack run and its outcome.

## Atomicity
The paragraph is bound. **Its canonical copy in `custody-claim-lint.js` moves in the SAME commit.** Run
**RF-4** and observe it RED by editing one side only, then restore. Report the real output.

## Discipline
- **Suite floor is the current count** (≥351), 0 fail / 0 skipped / 0 todo.
- **NEVER offer a green gate as evidence that a sentence is TRUE.** A passing lint proves text matches its
  stored copy and nothing more — which is exactly why this bundle exists.
- If the suite fails in a file you do not own, re-run once; if it persists, **report rather than edit.**

## Verify — each as its OWN command, its own exit code

    cd engine
    node --test "test/*.test.js"
    npm run check:ship

## Envelope — FINAL message, JSON, nothing after it

    { "bundle": "K", "ok": true, "commit": "<sha>", "files_changed": ["..."],
      "suite": {"pass":0,"fail":0,"skipped":0,"todo":0}, "check_ship_exit": 0,
      "description_before": "...", "description_after": "<the exact shipped text>",
      "enumeration_residual_on_shipped_surface": "<the exact wording naming Armenian/Cherokee/etc>",
      "nbsp_sentence_untouched": true,
      "falsification_attempts": [ {"claim":"<clause>","attack_run":"<mutation>","outcome":"<flip observed>"} ],
      "rf4_observed_red": "<real output from editing one side only, then restoring>",
      "residuals_named": ["..."], "what_i_could_not_do": ["..."] }

Emit the envelope even if you stop early. **Committing beats finishing.** Commit starts `fix(K):`.
