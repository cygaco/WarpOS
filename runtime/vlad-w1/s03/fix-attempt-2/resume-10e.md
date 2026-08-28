# RESUME — your previous dispatch was killed by infrastructure, not by anything you did

**Read this first, then read your brief.**

A previous dispatch of THIS EXACT bundle was killed at exactly 540000 ms by a wrapper timeout clamp. That
was an infrastructure bound, not a judgment on your work and not a failure you caused. The clamp has been
raised for this run.

**Your previous work is still on disk, uncommitted, in the worktree.** It was NOT reverted. Before you do
anything else:

1. `cd` to the engine directory and run `git status --porcelain` and `git diff` on the files your brief
   lists as yours. Read what you already wrote.
2. **Resume from there. Do not start over and do not rewrite what is already correct.** Finish the parts
   that are incomplete, verify, and COMMIT. The previous run died before committing — committing your
   finished work is the single most important thing you do this run.
3. Other builders are working in this same worktree at the same time, in other files. `git status` will
   show their files as modified too. **That is expected. Leave their files alone.** Stage only your own
   files, by explicit path. Never `git add -A`, `git add .`, or `git commit -a`.

If you created any temporary scratch files in the engine directory (for example `tmp-*.mjs`), delete the
ones you created before you finish. Scratch files left in the tree are picked up as untracked noise and
have to be cleaned by hand.

**Budget your time.** You have a 20-minute bound this run. Prioritise, in this order: (1) finish and commit
the core fix your brief names as the defect, (2) its RED-on-removal test observed actually going red,
(3) the secondary items. If you run short, commit what is finished and say plainly in your envelope what is
not done — an honest partial with a commit is worth far more than complete work that dies uncommitted.

**Emit your JSON envelope as the very last thing you do, and emit it even if you had to stop early.** A
run that does real work and then returns prose instead of the envelope reads downstream as a dead lane and
its work is not counted.

---

# YOUR BRIEF

Read it in full now:
# FIX BUNDLE 10e — the residual MEDIUMs, the scan-root seam, and falsifier F-5

You are a BUILDER on sprint S-VLADW1-03, fix attempt 2 — **the LAST fix attempt this sprint gets.**

## Where you work
- **Worktree (your cwd):** `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`
- **Branch:** `wt/S-VLADW1-01-engine` (already checked out; HEAD `0732cd8`). Commit here directly. Do NOT create a new worktree, do NOT branch, do NOT push.
- All engine paths below are relative to `engine/` inside that worktree.

## Scope contract
**allowedFiles (you may edit ONLY these):**
- `engine/package.json`
- `engine/scripts/checks/no-tautological-assertions.js`
- `engine/test/no-tautological-assertions.test.js`
- `engine/test/verified-by-resolver.test.js`
- `engine/test/custody-runtime.test.js`

**forbiddenFiles (another builder owns these RIGHT NOW — editing them corrupts the run):**
`engine/CUSTODY.md`, `engine/src/**` (ALL of it), `engine/driver/**`,
`engine/scripts/checks/custody-claim-lint.js`, `engine/scripts/checks/lib/strip-comments.js`,
`engine/scripts/checks/verified-by-resolver.js`, `engine/test/env-scrub.test.js`,
`engine/test/entry-bootstrap.test.js`, `engine/test/custody-static.test.js`,
`engine/test/custody-claim-lint.test.js`, `engine/test/spawn-shim.test.js`,
`engine/test/env-scrub-capture.test.js`.
If your fix seems to require a forbidden file, STOP and say so in your envelope instead of editing it.

**Note on `package.json`:** you own it, but ONLY the `vladPointerLint` block described below. Do not touch
`files`, `scripts`, dependencies, or version — other bundles' work depends on those staying exactly as they
are, and a change to `files` silently changes which files are derived as shipped entry points.

## Item 1 — `package.json#vladPointerLint` is self-contradictory (qa F-3, MEDIUM, criterion S2)

`currentState` was corrected to read "TEN clerical NAME drift + ONE missing WORK + FOUR missing FILES =
fifteen", and it carries an explicit warning that grouping AC-8.6 into the drift count "would recreate
exactly the camouflage that let AC-8.6 survive two corrections".

`owed`, on the adjacent line, still says: **"Repoint the eleven name-drift pointers"** — prescribing the
regrouping the corrected half explicitly forbids. Before fix attempt 1 this field was wrong-but-consistent;
after it, one half prescribes the camouflage the other half names. Fix `owed` so the two halves agree.

**Re-derive the numbers rather than trusting either half.** Run `npm run check:pointers` and count from its
real output. Correcting from a finding list instead of re-deriving from the source of truth is this
sprint's named recurring error, with three recurrences in the predecessor. If the real counts differ from
what `currentState` says, correct `currentState` too and say so.

Also (qa F-5, LOW): "TEN are clerical NAME drift (the substance exists under a different test-node name)"
is imprecise for at least three of the ten — `custody-runtime.test.js` holds only two test nodes, both
AC-8.4, so for those the remedy is **repoint file AND name**, not name alone. Make the wording precise.

## Item 2 — the `NO_TAUTOLOGY_SCAN_ROOT` scan-root redirect

`engine/scripts/checks/no-tautological-assertions.js` around lines 355-362 resolves its scan root as
`process.env.NO_TAUTOLOGY_SCAN_ROOT || DEFAULT_SCAN_ROOT`.

This check is composed into `check:ship`. An environment variable that redirects a ship gate's scan root is
a widening seam: a gate can be pointed at an empty or irrelevant directory and still exit 0, which is a
green light nobody earned — exactly the class bundle 9c was written to close when it made the lint go
`NO_DATA` and non-zero on an absent or empty root.

Remove the override, **or** make it strictly non-widening: it may only NARROW the scan to a path INSIDE the
engine root, never redirect outside it or above it, and a redirect that resolves outside must be a hard
error rather than a silent fallback. Whichever you choose, ship a test that observes the refusal.

Check whether anything actually consumes the override before removing it — grep the tree. If the test file
uses it to point the lint at fixtures, that is a legitimate consumer and the narrowing route is the right
one; say which you found.

## Item 3 — falsifier F-5, OBSERVED RED (release criterion S4)

**F-5:** a `verified_by` pointer naming a real FILE but a MISSING TEST NODE must go RED, and must be
**distinguishable** from a pointer naming a missing file. `engine/test/verified-by-resolver.test.js`
already exercises the resolver; what does not exist is a demonstration that the falsifier goes RED **under
its own mutation**. Build it: seed a pointer of each shape, run the resolver, and assert it reports
`missing-name` for one and `missing-file` for the other, distinctly. Observe it; quote the real output.
Beta's bar is present **AND** observed RED — a fixture that exists but has never been mutated does not
satisfy S4, and `NO_DATA` is not a pass.

## Item 4 — re-verify AC-8.4's mutant is still red-capable (criterion S4 carries the predecessor's R4)

`engine/test/custody-runtime.test.js` holds the AC-8.4 mutation twin. The release rule requires it to
**still exist and still be red-capable at close, re-verified rather than cited**. Run its mutation, observe
it go red, and quote what you saw. If it is no longer red-capable, that is a finding — report it, do not
quietly repair it into something weaker.

## Discipline
- **APPEND to test files. Never shrink the suite.** 294 passing is the floor: at least 294, 0 failures,
  0 skipped, 0 todo. A `t.skip()` or `.todo` in a falsifier position is itself the defect.
- Do NOT add the AC-8.6 self-check or the `selfcheck-runs-on-user-machine` test node. AC-8.6 is
  deliberately deferred this attempt and its absence is disclosed on the shipped surface. Adding scaffolding
  for it would make a pointer resolve to something that does not do the work — the exact camouflage the
  `currentState` note warns about.
- Every claim you write must be true of the code at close.

## CONCURRENCY — read this before you commit

THREE OTHER BUILDERS are editing this same worktree and this same branch RIGHT NOW, in files you are
forbidden to touch. Therefore:
- Stage ONLY your own allowed files, BY EXPLICIT PATH. NEVER `git add -A`, `git add .`, or `git commit -a` —
  any of those would sweep another builder's half-finished work into your commit.
- If `git commit` fails on an index lock, wait a moment and retry. That is contention, not corruption.
- `git status` will show files you did not touch as modified. That is expected, and is NOT yours to fix,
  clean, stash, or revert. Leave them alone.
- If the full suite fails in a file you do NOT own, re-run it once — you may have caught another builder
  mid-write. If it still fails, report it in your envelope rather than editing their file.

## Verify before you report (run these; quote the real output, not a summary of it)

    cd engine
    node --test "test/*.test.js"
    npm run check:ship
    npm run check:pointers

Suite must be >= 294 pass / 0 fail / 0 skipped / 0 todo; `check:ship` must exit 0.
`check:pointers` is EXPECTED to be non-zero (it is red by design and deliberately not in `check:ship`) —
report its real counts, do not "fix" it green.
Then commit on `wt/S-VLADW1-01-engine` with a message starting `fix(10e):`.

## Envelope — return this as your FINAL message, as JSON, with nothing after it

    {
      "bundle": "10e",
      "ok": true,
      "commit": "<sha>",
      "files_changed": ["..."],
      "suite": { "pass": 0, "fail": 0, "skipped": 0, "todo": 0 },
      "check_ship_exit": 0,
      "pointer_counts_rederived": "<the real check:pointers split you counted>",
      "scan_root_route": "removed | narrowed — and the refusal output you observed",
      "falsifier_F5_observed_red": "<the real resolver output, both shapes, distinctly>",
      "ac84_mutant_still_red": "<the real output you observed>",
      "residuals_named": ["..."],
      "what_i_could_not_do": ["..."]
    }
