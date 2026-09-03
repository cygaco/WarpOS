# Notice: cygaco/WarpOS history was rewritten on 2026-09-03 (E-OPEN-SOURCE-001 S-OS-03)

Every branch and every tag from `warpos@0.2.0` onward has a new SHA. Tags `v0.1.1`, `warpos@0.1.3` and
`warpos@0.1.4` and every commit up to 2026-05-01 are unchanged. The graph shape is identical (1,905 → 1,905
commits); the map is in `commit-map.txt` beside this file.

## If you have a clone (the 8 portfolio products, any contributor)

Do NOT `git pull` — it will try to merge the old history into the new one. Do one of:

```
# simplest: re-clone
git clone https://github.com/cygaco/WarpOS.git

# or, keep your clone and hard-reset every tracking branch
git fetch origin --prune --tags --force
git checkout main && git reset --hard origin/main
# repeat for any other branch you track; then drop the old objects:
git reflog expire --expire=now --all && git gc --prune=now
```

Local-only branches that were based on old commits should be rebased onto the new history with
`git rebase --onto <new-base> <old-base>`; `commit-map.txt` gives old → new for every rewritten commit.

## Installed WarpOS copies in products (`_warpos/`, `.claude/framework-*.json`)

Nothing to do. `/warp:update` pins releases by file content hashes from the release capsules, not by git SHA
(`scripts/warpos/update.js` compares LF-normalized sha256 per asset). The `warpos@` tag NAMES are unchanged.

## What was removed (so nobody re-introduces it from an old clone)

- the operator's personal email (replaced with a placeholder) and verbatim profane prompt fragments in the β
  judgement-model files and two SP-20260513-005 docs;
- `_planning/ingest/` (a paid third-party course corpus), the Confidential brief `_docs/*-brief-v4.*` and its
  `_warpos/BASELINE/_docs/` copy, `runtime/enforcement-sweep/2026-08-29/qualifying/out-E1.rollout.jsonl`, and the
  three `_planning/vlad-*.md` private planning docs — purged from every commit.

If an old clone still has any of those paths, they will come back on a merge. Re-clone.

Questions: the epic tracker `trackers/epics/E-OPEN-SOURCE-001-master-console-open-source.md`.
