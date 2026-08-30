# ⚠️ enforce.js is GREEN in the working tree and RED on a clean checkout of the same commit

Measured by ε at `c88aac1d` (and identically at `973d2824`).

| where run | exit | result |
|---|---|---|
| the main working tree (dirty: ignored + untracked files present) | **0** | `19/20 runnable green, 0 NEW regressions — canonical clean` |
| a fresh detached worktree at the same commit, `git status --porcelain` = 0 | **1** | `FAILED: 3 regression(s)` — BC-02, BC-05, BC-28 |

## Root cause, single file

```
node scripts/checks/warpos-manifest-honesty.js   (clean checkout)
  FAIL [warpos-manifest-honesty] 1 drift issue(s) (1743 assets checked):
    - [missing] .claude/project/maps/system-coherence.graph.json
```

- `git check-ignore -v` → `.gitignore:44` — the file is **gitignored**.
- `git ls-tree -r HEAD` → **not tracked** at HEAD.
- It exists on this machine, dated 2026-07-24, so every gate run in this working tree finds it.

The installed manifest promises an asset that no clean checkout of the commit contains. BC-05 and
BC-28 follow from the same drift.

## What this does and does not mean

**Not introduced by this sprint.** The ignored file predates it by five weeks, and no bundle here
touched the manifest's asset list beyond the regular regeneration. **Out of every fix fence** — it is
pre-existing, and repairing it would change what a qualifying lane's gate run returns.

**But every `enforce.js exit 0` sentence in this sprint's commit messages is a claim about the tree it
was run in, not about the commit it is attached to.** Two landing commits carry that sentence
(`973d2824`, and the same procedure behind `c88aac1d`), and both are false read against a clean
checkout of themselves. Commit messages are immutable, so this is a record correction, not an edit.

This is the fifth member of the family β catalogued — `detector_sha` stamps the repo not the detector;
`K` counts a hidden predicate; `checked_repaired_count` is relative to cwd; an identifier read as an
address — and now **a release gate whose verdict depends on which tree the observer stood in.** It is
the only member of the family that governs whether the round's own pin is green.
