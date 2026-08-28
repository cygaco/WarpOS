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
