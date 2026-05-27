---
description: Land the working branch — commit locally, push the branch, then merge it into the repo's default branch and push that too. The full commit→push→merge flow.
---

# /commit:land — Land the working branch to the default branch

Commits the working branch, pushes it, then completes the merge into the repo's default
integration branch (e.g. `main`). Successor to `/commit:both`, which stopped at push.

## Input

`$ARGUMENTS` — optional commit message hint (passed to the local commit step).

## Procedure

### Step 1 — Commit locally
Follow the full `/commit:local` procedure: assess state, stage, draft message, commit.
- If nothing to commit, check for unpushed commits / an unmerged branch — if there's still something to push or merge, continue; otherwise report "Nothing to do" and stop.

### Step 2 — Detect the default branch (never assume "master")
Resolve the integration branch from the remote, in order:
1. `git symbolic-ref --short refs/remotes/origin/HEAD` → strip `origin/` (e.g. `main`).
2. Fallback: `git remote show origin` → "HEAD branch".
3. Fallback: `main`.
Call it `$DEFAULT`. Record the current branch as `$BRANCH`.

### Step 3 — Push the working branch
Follow `/commit:remote`: pre-push checks, show what will be pushed, push `$BRANCH` to origin. Invoking `/commit:land` is the confirmation — no second prompt.
- If `$BRANCH == $DEFAULT`, there is no branch to merge: the push already updated the default branch. Skip Step 4, go to Step 5.

### Step 4 — Merge into the default branch
1. `git checkout $DEFAULT` then `git pull --ff-only origin $DEFAULT` to sync.
2. Merge `$BRANCH`: prefer fast-forward; if a FF isn't possible, `git merge --no-ff $BRANCH` with a clear merge message.
3. **Conflicts → STOP.** If the merge conflicts, do NOT force or auto-resolve: report the conflicted files, leave the repo on `$DEFAULT` mid-merge, and hand back to the operator.
4. Before pushing the default branch, ensure the gate is green — the commit hooks already ran in Step 1; if the repo has a `/check:all` (or equivalent) gate and this is a substantial change, run it. **Never push a broken default branch.**
5. `git push origin $DEFAULT`.
6. Return to `$BRANCH` (`git checkout $BRANCH`) so the session continues where it was — unless the operator asked to stay on `$DEFAULT`.

### Step 5 — Report
```
Committed: <hash> <message>
Pushed:    <N> commits → origin/$BRANCH
Merged:    $BRANCH → $DEFAULT (<ff|no-ff>)
Pushed:    origin/$DEFAULT @ <hash>
```
If a conflict halted Step 4, report the conflicted files and the resume path instead.

## Notes
- Pushing `$DEFAULT` is the one irreversible step. Per CLAUDE.md autonomy, push is "ask first" — **invoking `/commit:land` IS that authorization**.
- Does **not** delete `$BRANCH` (backup-branch safety; CLAUDE.md forbids deleting backup branches). Prune manually if desired.
- Supersedes `/commit:both`. The granular building blocks `/commit:local` and `/commit:remote` remain.
