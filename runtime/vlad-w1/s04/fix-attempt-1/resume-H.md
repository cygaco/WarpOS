# RESUME — bundle H. Your work is on disk. FINISH AND COMMIT.

Your previous dispatch was killed at exactly 1200186 ms by a wrapper timeout. **That was infrastructure,
not a judgement on your work.** The bound is raised for this run.

## What is already on disk, uncommitted

Worktree `C:\Users\Vlad\Desktop\Claude\Projects\vlad\.worktrees\engine-lane`, branch
`wt/S-VLADW1-01-engine`. **Task 1 is COMMITTED** (`26e72c7` — the rotting counts removed from
`package.json#vladPointerLint`). **324 insertions across your other three files are on disk, uncommitted:**

    engine/CUSTODY.md                            +35
    engine/scripts/checks/custody-claim-lint.js  +144
    engine/test/custody-claim-lint.test.js       +161

**Verified by the conductor before writing this, so you know what is banked:** the *"only place the residual
is named"* assertion is already **gone** from `CUSTODY.md` (grep returns 0). Do not redo that.

## Your job, in priority order

**1. COMMIT. This is the single most important action of the run.** The previous run died before committing;
that, and only that, was lost. Before committing, run each as its OWN command and read its own exit code —
never pipe a gate through `tail` in an `&&` chain:

    cd engine
    node --test "test/*.test.js"     # floor 351, 0 fail / 0 skipped / 0 todo
    npm run check:ship               # exit 0

Stage only your files by explicit path (`CUSTODY.md`, `scripts/checks/custody-claim-lint.js`,
`test/custody-claim-lint.test.js`, `package.json`). **Never `git add -A`.** Commit message starts `fix(H):`.
**Commit per task if more than one task's work is on disk** — that is what keeps a timeout cheap.

**2. Then finish what is incomplete**, checking your own work against the original brief at
`C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\runtime\vlad-w1\s04\fix-attempt-1\fix-H-claims.md` (read it —
it is the contract). Most likely outstanding, in the order they matter:

- **Task 2's refusing lint rule and its battery** — the rule that REFUSES the *only (shipped )?(place|
  surface)* family inside a bound paragraph, **controls first**, plus the over-refusal check (the real
  document must still be clean, `check:ship` exit 0).
- **Task 3** — `"points back to this Ceiling by name"` corrected, and the AC-8.6 self-check's real ceiling
  **moved into `CUSTODY.md`** (its green is equally consistent with a correct scrub, an absent scrub, and a
  machine that never held a credential — today that is disclosed only in a code comment).
- **Task 4** — RT-8's disclosure rewritten in **CLASS form**, not instance wording. Required substance:
  *"the rollup rule matches a named lexical family (digit-form counts, `all`); it does not detect
  semantically equivalent rollups in other wordings, and no enumeration of wordings will close this — a
  rollup claim must be reviewed, not linted."* **Do not widen the matcher.**

**3. If you run short again, commit first and say plainly what is unfinished.** An honest partial with a
commit beats complete work that dies uncommitted — that is exactly what happened last run.

## Unchanged constraints

- **allowedFiles** are the four named above. Everything else is forbidden — bundles G, I, J and a later K
  own the rest. Their files may show modified in `git status`; **leave them.**
- Every claim paragraph you touch moves **with its canonical copy in the same commit**; run **RF-4** and
  observe it RED by editing one side only, then restore.
- **NEVER offer a green gate as evidence that a sentence is TRUE.**
- **You draft each shipped claim sentence AFTER running the attack that would falsify it.** Your envelope
  carries the per-claim `falsification_attempts` array. **No claim without its attack.**
- Emit your JSON envelope last, in the shape the original brief specifies, **even if you stop early.**
