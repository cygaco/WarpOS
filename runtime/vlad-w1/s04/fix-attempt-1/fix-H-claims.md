# BUNDLE H — make five shipped sentences true, and refuse the class that made one of them false

Sprint S-VLADW1-04, **fix attempt 1 — there is no attempt 2.** Bundle G has landed; you are serial after it
and depend on its transform. HEAD is G's last commit.

## Where you work
Worktree `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine`. Commit here. No branch, push, or merge. Paths relative to `engine/`.

**allowedFiles:** `engine/CUSTODY.md` · `engine/package.json` (**the `vladPointerLint` block ONLY**) ·
`engine/scripts/checks/custody-claim-lint.js` (canonical copies + Task 2's new rule) ·
`engine/test/custody-claim-lint.test.js`
**forbiddenFiles:** everything else — all `src/**`, `driver/**`, other tests, and **`package.json`'s
`files` / `scripts` / dependencies / version** (bundles I and J are running in parallel; a change to `files`
silently changes the scanned ship set). Stage only your files by path; never `git add -A`.

## THE PROCESS RULE — the reason this bundle exists

**You draft each shipped claim sentence AFTER running the attack that would falsify it. No claim without
its attack.** Your envelope carries a `falsification_attempts` array: per claim, the attack run and its
outcome. A diagnostic gauntlet found **six HIGH findings, every one a false sentence written before anyone
tried to break it.** Four of them are yours to fix. Do not add a fifth.

---

## TASK 1 — `package.json#vladPointerLint`: remove the live counts

It says *"RED by design: 33/48 resolve, 15 do not"* and that AC-8.6 *"must stay red until the work lands"*.
**We landed it; the real numbers are 34/48 and 14.** `package.json` **ships** (12.6 kB in `npm pack
--dry-run`) and is **absent from the entire `b2583d6..b9b8df3` diff** — bundle C updated the non-shipping
test that pins the counts and never the shipped copy.

**Remove the live counts from shipped copy and point at `check:pointers` as the source of truth.** The
document's own rule, already stated elsewhere in this repo, is that **a number is a property of the day it
is read.** Keep the field's *meaning* — that the lint is red by design and deliberately outside
`check:ship` — and drop the figures that rot.

**If you judge a count must stay**, then a committed test must pin the SHIPPED `package.json` text against
the resolver's live output so it cannot drift silently. Removing is preferred; pinning is the fallback.
Say which and why.

## TASK 2 — "the only shipped place": remove the CLASS, then refuse it

`CUSTODY.md:148` says *"among SHIPPED surfaces this document remains the only place the residual is named"*.
**False:** `scripts/checks/custody-claim-lint.js` ships (72.7 kB) and holds the Ceiling verbatim in its
canonical-copy store.

**And it is false BY CONSTRUCTION, which is the real finding:** S4-3's atomicity requirement guarantees
every bound claim paragraph exists in **at least two** shipped files — the document and the lint's canonical
copy. **So any "this document is the only place/surface X is named" assertion about a BOUND paragraph is
necessarily false.**

1. **Remove that assertion everywhere it occurs** — grep the family, do not fix only line 148. Its
   predecessor was corrected once already and the replacement was still false.
2. **Add a lint rule that REFUSES the family** — an assertion of the shape *only (shipped )?(place|surface)*
   inside a bound paragraph — so it cannot be re-authored. Give it a **near-miss battery, controls first**,
   on G's transform (emphasis, ZWSP, homoglyph, spacing variants).
3. **Do not over-refuse.** The phrase is legitimate outside bound paragraphs and in prose that is not making
   that assertion. Verify the real document stays clean: `check:ship` exit 0.

## TASK 3 — two more false sentences

- **`CUSTODY.md:148`** says `test/entry-bootstrap.test.js` *"points back to this Ceiling by name"*. It
  points back **by description**; grep for the Ceiling's lead-in in that file returns zero. Correct it. The
  neighbouring `--import` and "one INTERNAL surface" claims are TRUE — leave them.
- **The self-check's real ceiling does not travel.** `CUSTODY.md:199-201` implies the AC-8.6 start-up
  self-check verifies a control is *"still present or still passing"*. It does neither: executed,
  `runCustodySelfCheck(undefined, Object.create(null))` returns `{"ok":true,...}` — **its green is equally
  consistent with a correct scrub, an absent scrub, and a machine that never held a credential.**
  `src/server-entry.js:374` states this plainly, **but only in a code comment.** S4-6 requires the residual
  to travel **to where the claim's reader is** — move it into `CUSTODY.md`. (You may not edit
  `server-entry.js`; you are moving the disclosure, not the code.)

## TASK 4 — RT-8's disclosure must name the CLASS, not the instances (β row 312)

`CUSTODY.md:33-40` currently discloses the rollup blindness with **instance wording** — *"a spelled-out
numeral, or the word `every`, passes it"*. β ruled that naming only the observed instances **is itself a
false disclosure**. Rewrite it in class form, carrying this substance:

> the rollup rule matches a named lexical family (digit-form counts, `all`); it does not detect semantically
> equivalent rollups in other wordings, and **no enumeration of wordings will close this — a rollup claim
> must be reviewed, not linted.** S4-1's reviewer read is the actual control.

**Do not widen the matcher.** β ratified disclosure precisely because widening enumerates an unbounded
family (`each`, `the entire set`, `100% of`) and manufactures false coverage.

---

## Discipline
- **Suite floor is G's count** (≥339), 0 fail / 0 skipped / 0 todo.
- **COMMIT AFTER EACH TASK.** Four tasks, four commits expected.
- Every claim paragraph you touch moves **with its canonical copy in the same commit**; run **RF-4** and
  observe it RED by editing one side only, then restore.
- **NEVER offer a green gate as evidence that a sentence is TRUE.**
- Bundles I and J are editing `src/` and `scripts/checks/spawn-env-allowlist.js` in parallel. Their files
  will show modified in `git status`. **Leave them.** If the suite fails in a file you do not own, re-run
  once; if it persists, report rather than edit.

## Verify — each as its OWN command, its own exit code

    cd engine
    node --test "test/*.test.js"
    npm run check:ship
    npm run check:pointers

`check:pointers` is **RED BY DESIGN** — report its counts, do not try to make it green.

## Envelope — FINAL message, JSON, nothing after it

    { "bundle": "H", "ok": true, "commit": "<sha list>", "files_changed": ["..."],
      "suite": {"pass":0,"fail":0,"skipped":0,"todo":0}, "check_ship_exit": 0,
      "task1": {"route":"removed|pinned","why":"...","shipped_text_after":"..."},
      "task2": {"occurrences_found":0,"all_removed":true,"new_rule":"...","battery":"controls first + variants","over_refusal_check":"..."},
      "task3": {"points_back_after":"...","selfcheck_ceiling_moved_to_CUSTODY":"<the exact text>"},
      "task4_rt8_class_form": "<the exact shipped wording>",
      "falsification_attempts": [ {"claim":"...","attack_run":"...","outcome":"..."} ],
      "rf4_observed_red": "<real output from editing one side only, then restoring>",
      "residuals_named": ["..."], "what_i_could_not_do": ["..."] }

Emit the envelope even if you stop early. **Committing beats finishing.** Commits start `fix(H):`.
