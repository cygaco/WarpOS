# S-OS-03 dry-run report — the exact change set the force-push would publish

> Prepared 2026-09-03 (session 54856530-26b0-4b30-b54e-f45962f38826) from **run two** on a fresh bare mirror of
> `cygaco/WarpOS` taken after `main` = `85530018`. **Nothing has been pushed.** This is the artifact the operator
> approves at gate G2. Every number below was produced by the commands named in the plan
> (`runtime/open-source/S-OS-03-rewrite-plan.md` § 6) and can be re-derived from the committed map files beside this report.

## 1. What changes, in one table

| Item | Before | After | Note |
|---|---|---|---|
| Commits, all refs | 1,905 | 1,905 | `--prune-empty never`: the graph shape is identical, 1:1 map |
| Commits re-imported (range `^de9ba8eb`) | 1,799 | 1,799 | 1,774 got new SHAs; 25 kept theirs (a side branch forked before the tag, no changed content) |
| Commits untouched by construction | 93 | 93 | everything reachable from the tag commit `de9ba8eb` (2026-05-01), incl. all four headline commits and the GitHub-signed `db6292e2` |
| Refs rewritten | 102 (61 branches + 41 tags, minus `pre-cleanup-snapshot`) | 88 moved, 14 kept | tags `v0.1.1`, `warpos@0.1.3`, `warpos@0.1.4` keep their SHAs; the other 38 tags keep their **names** and move |
| Files purged from all history | — | 9 paths (`removed-paths.txt`) | paid corpus dir, Confidential brief ×2 copies, 1.45 MB Codex transcript, 3 private planning docs |
| Strings replaced in all blobs | — | 20 rules (`rule-digests.txt`) | 14 sentence literals (email + verbatim prompts), 1 file-body stub (E-VLAD-001 plan), 5 word-level catch-alls |
| Commit notes (`refs/notes/commits`) | 8 notes on old SHAs | 8 notes remapped | `scripts/open-source/remap-notes.js` — dry-run: 8 remap, 0 orphan |
| `main` tip content diff | — | 1 file | `_planning/epics/E-VLAD-001.md` 19-line stub → 1-line stub (see § 4) |

## 2. Verification results (run two)

| Check | Result |
|---|---|
| `assert-evidence.js` on `main`: 4 headline commits + tag commit exist; `db6292e2` still signed; `warpos@0.1.4` → `de9ba8eb`; all ancestors of `main` | **OK** |
| Same ancestry check on every other branch (61) | **OK** on 60; the one FAIL is `fix/warpos-registry-update-release-coherence`, which forked on 2026-05-01 18:39, *before* the tag commit, so the tag is legitimately not its ancestor (not a rewrite defect) |
| Literal sweep: `git log --all -S<literal>` for all 20 rules | **0 commits** for 19; **2 commits** for rule 14 (`oh [expletive] dude`) — see § 3 |
| Word-stem + email regex over the tree of **every** commit | **367 commit:file hits, all the same single blob** — see § 3 |
| Purged paths: `git log --all -- <path>` for each of the 9 | **0 commits** for all 9 |
| Paid-corpus text (`FULL AI ADVERTORIAL PROCESS`) anywhere in any commit tree | **0** |
| Commit count before/after | 1,905 / 1,905 |

## 3. The one residual, and why it stays

Blob `09112cf7` is the β dossier file at its old path `.claude/agents/00-alex/.system/beta/beta-source-data.md`. It was
created by commit `6779f6e6` on **2026-05-01 13:44**, six hours *before* the tag commit, and it contains exactly one
mild line (`Colloquial when comfortable ("hunky dory", "oh [expletive] dude")`). Every later commit up to the ADR-0007 rename
reuses that identical blob object. A range-limited rewrite cannot change a blob that already exists inside the untouched
range without re-importing the commits that own it, which would change `de9ba8eb` and every headline SHA after
`db6292e2`. This is the trade-off already recorded in the epic ("Removing the β dossier from history would change the tag
SHA"). The 367 hits are that one object seen from 367 commits; the profane fragments the operator asked to remove
(the 2026-05-12..14 prompts, the email) are gone from every commit.

## 4. The exact `main` tip diff

```
 _planning/epics/E-VLAD-001.md | 19 +------------------
 1 file changed, 1 insertion(+), 18 deletions(-)
```
The 19-line stub written in S-OS-02 becomes the one-line stub the rewrite writes into **every** historical version of
that file (the same regex rule that blanks the private plan body in history). Nothing else on `main` changes: the
front-page cleanup already removed the strings and paths from the tip.

## 5. What the operator will see happen at execution (unchanged from the plan § 6)

1. Fresh bare mirror; the same command as run two (rules file + paths file + `--prune-empty never` + range).
2. `remap-notes.js --apply`; `assert-evidence.js` on the result must be OK with the sweep at 0 for rules 1–13, 15–20.
3. `git push --force --all` and `git push --force --tags` (the `pre-cleanup-snapshot` tag is deleted, not pushed).
4. Delete the public release `pre-cleanup-snapshot`; file the GitHub Support request to purge unreachable objects.
5. Fresh public clone → `assert-evidence.js` again; commit its output next to this report.
6. Local repo: reset every branch to origin; prune old objects. Downstream: `migrations/` notice + `/session:write`.

## 6. Files beside this report

- `commit-map.txt` — old SHA → new SHA for all 1,799 in-range commits (25 identical).
- `ref-map.txt` — old → new for all 102 refs.
- `first-changed-commits.txt` — the two range roots (`a97d2f76`, `b0b17bac`, both 2026-05-13 12:57).
- `removed-paths.txt` — the 9 purged paths.
- `rule-digests.txt` — SHA-256 + length of each rule's left side (the literals themselves are gitignored).
- `assert-evidence-dryrun2-main.txt` — the assertion output for run two.
- `diffstat-main.txt` — the `main` tip diffstat.
