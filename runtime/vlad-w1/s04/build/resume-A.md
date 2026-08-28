# RESUME — bundle A. Your work is on disk. FINISH AND COMMIT.

Your previous dispatch was killed at exactly 1200176 ms by a wrapper timeout. **That was infrastructure,
not a judgement on your work, and you did not fail.** The bound is raised for this run.

## What is already on disk, uncommitted, in your worktree

`C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch `wt/S-VLADW1-01-engine`,
HEAD still `b2583d6`. **545 insertions across exactly your three allowed files** — nothing was reverted:

    engine/CUSTODY.md                            +39
    engine/scripts/checks/custody-claim-lint.js  +190
    engine/test/custody-claim-lint.test.js       +321

**The conductor verified the core of it before writing this**, so you know what is already banked:
`canonicalizeClaimText(s, opts)` exists as a named exported transform, it is applied to BOTH sides of the
status-token comparison, and **there are zero hardcoded dash-variant token literals** — that is the
canonical-transform shape the rule requires, not a variant table. Do not redo it.

## Your job this run, in priority order

**1. COMMIT. This is the single most important action of the run.** The previous run died before
committing; that, and only that, is what was lost. If you do nothing else, commit what is on disk.

Before committing, run each as its OWN command and read its own exit code — never pipe a gate through
`tail` inside an `&&` chain:

    cd engine
    node --test "test/*.test.js"     # floor 318, 0 fail / 0 skipped / 0 todo
    npm run check:ship               # exit 0

Stage only your three files by explicit path. Never `git add -A`. Commit message starts `fix(A):`.

**2. Then finish whatever is incomplete**, checking your own work against the original brief at
`C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\runtime\vlad-w1\s04\build\fix-A-canonical-bind.md`
(read it — it is the contract). The tasks most likely to be unfinished, in the order they matter:

- **Task 6** — re-measure the newly-refused set against the predicate **as you built it**, including your
  own new Ceiling paragraph, and resolve anything it refuses **inside this bundle**. Report the count.
- **RF-1** (all seven near-miss authorings RED + both em-dash controls RED), **RF-3** (revert the refusal
  to `continue` → RED), **RF-4** (a claim edit without its canonical edit fails in your own run).
- The **observation artifacts**: mutation logic in the committed test, raw run artifact committed with its
  command line and sha, no-op⇒FAIL guard present, EOL-agnostic matching (`\r?\n`, never a bare `\n`).

**3. If you run short again, commit first and say plainly what is unfinished.** An honest partial with a
commit is worth far more than complete work that dies uncommitted. That is exactly what happened last run.

## Unchanged constraints

- **allowedFiles:** those three only. Everything else is forbidden — especially `engine/src/**`,
  `engine/driver/**`, and the two false sentences elsewhere in `CUSTODY.md` (the preload-Ceiling "not named
  on any other surface" sentence and the `opts.cwd`/`opts.stdio` attribution sentence). **A later bundle
  owns those. Do not touch them.**
- **Never offer a green gate as evidence that a sentence is TRUE.** A passing lint is not proof of claim
  truth. Do not write that in your envelope.
- Emit your JSON envelope as the last thing you do, in the shape the original brief specifies, **even if
  you had to stop early.**
