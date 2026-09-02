# S-OS-03 — Targeted history rewrite: plan, findings, operator decisions

> E-OPEN-SOURCE-001 phase 3. Prepared 2026-09-02 (session 54856530-26b0-4b30-b54e-f45962f38826). **Nothing in this
> document has been executed.** No history has been rewritten; nothing has been force-pushed. Gate G2 (operator
> approves the exact diff) has not been reached.

## 1. What gets removed, and nothing else

Two classes of string, agreed 2026-09-02:

1. The operator's personal email address (one literal).
2. Ten verbatim profane prompt fragments (the β-mined operator quotes and their reuse in sprint docs).

The literals live in a **gitignored** rules file (`_private/rewrite/replace-rules.txt`, filter-repo `--replace-text`
format). They are never committed again. The public record identifies them by SHA-256 digest only:

| rule | sha256(literal) | length |
|---|---|---|
| 1 | 2a236c4341d636d679b416731a1f6ca527b2f38b70ff6a3bed33f6041f78eca0 | 27 |
| 2 | c5cc22e510e748f2801b81cb62116e5e346849513a76e7fd590c91fae4e9e228 | 100 |
| 3 | 21744d2eda70f167a3fa93324e338f071612747765edc589ab5a1debff91698f | 66 |
| 4 | ffe5cec20c4b8d0732076dbbb1d8c9a4004ff48187c5e762d02e5f4d1b15f7fd | 16 |
| 5 | bc46a96daa49430dce50e52eff59623b3e3a9c8938f25e1822cb40094693b4fa | 56 |
| 6 | ab3b7ee21d8c62c9479de4652b1519f5b2e47011af5caa57780581be89af3635 | 29 |
| 7 | 9b094ddf98756fe5e65f1dab7beb57476b13de0dd29fe1126410694b85d4e792 | 21 |
| 8 | 35c2b80f1671945e56d7fd63567a1a6955a998bf534fde4966b4f1a2161c74e0 | 33 |
| 9 | b0620e7cf966848387e4b53c6b1e93efee72a106d6e0a1719d63f61bb14845f2 | 22 |
| 10 | f9d8f4ee6231bac11120a4d56cc176be908a03f44be5c37c2e15dde0f57e12b3 | 17 |
| 11 | cac975e0b39886dbeedd3489daf7f26d457d4fe55e9d7672b9dff23d38d8cf50 | 11 |

Anyone holding the private mirror can recompute the table and confirm the rewrite touched exactly these strings.

Out of scope, unchanged: the operator's name in old Windows paths (~400 files), the β dossier commit `6779f6e6`,
every commit message, every author line.

## 2. Findings that shape the rewrite (verified 2026-09-02)

| Finding | Evidence | Consequence |
|---|---|---|
| Earliest tainted commit is `a97d2f76` (2026-05-13 12:57 -0700). Email enters at `6317650e` (2026-07-19). | `git log --all -S<literal>` per rule, oldest hit | Nothing before 2026-05-13 needs to change. |
| Tag `warpos@0.1.4` → `de9ba8eb` (2026-05-01 20:07). Headline commits are 2026-04-12..18. | `git rev-parse warpos@0.1.4^{commit}` | All evidence predates the first tainted commit by 12+ days. |
| **One GitHub-signed commit exists: `db6292e2` (2026-04-18, "Update README.md"), an ancestor of the tag commit and of every branch.** | `git cat-file commit db6292e2` has a `gpgsig` header; 1 of 1,924 commits | A whole-history rewrite re-imports every commit and DROPS that signature, changing `db6292e2`'s SHA and therefore the tag commit and everything after it. **The rewrite must be range-limited** so commits reachable from `de9ba8eb` (indeed everything before `a97d2f76`) are never re-imported. |
| Rewritten refs: every branch on origin (61) and every tag from `warpos@0.2.0` onward (they contain 2026-05-13+ history). Tags `warpos@0.1.0..0.1.4` are untouched. | `git ls-remote origin` | Tag names stay; their SHAs move for 0.2.0+. `pre-cleanup-snapshot` is excluded from the rewrite set (see § 4, decision B). |
| Only one GitHub Release exists (`pre-cleanup-snapshot`). There is no release for `warpos@0.1.4`. | `gh release list` | The tag's *own* GitHub-side timestamp is not independently attested; the anchors are the snapshot release (2026-09-02T18:51:40Z) + the private mirror + the fact that the tag's SHA survives the rewrite. |
| No Python, no Java on the operator machine. `git filter-repo` is not installed. | `python3 --version` → Windows Store stub; `java` not found | See § 3, tool choice. |
| 8 downstream products in the portfolio registry cloned this repo's history. | `~/.warpos/portfolio.json` | They must re-clone / `git fetch` + reset after the force-push; notice via `migrations/` + `/session:write`. |

## 3. Tool choice (operator decision A)

**A1 — git-filter-repo (recommended, industry-standard, what the epic names).** Needs Python 3 installed once:
`winget install Python.Python.3.12` then `pip install git-filter-repo`. α cannot install software on the operator's
machine; this is one operator command. The run is then:

```
git filter-repo --replace-text <clean-rules> --refs ^de9ba8eb --all   # partial: nothing reachable from the tag commit is touched
```
(`--refs` with a negative rev implies `--partial`: excluded ancestors keep their exact objects, so the signed commit,
the four headline commits and the tag are byte-identical by construction.)

**A2 — dependency-free fallback: `git fast-export ^de9ba8eb --all | node rewrite-stream.js | git fast-import`.**
Same partial range, same rules, a ~80-line Node script that rewrites blob payloads and fixes the `data <len>` headers.
Works today with nothing installed. Less credible to a skeptic ("home-made tool") and slower to review. α would write
and dry-run it; the assertion script (§ 5) is the same either way.

Recommendation: A1. The credibility of "we used the standard tool with these published rules" is worth one install.

## 4. Public-anchor dilemma (operator decision B)

The plan's anchor is a public GitHub Release on the pre-rewrite HEAD. **A public tag keeps the pre-rewrite objects
reachable, so the removed strings stay fetchable from the public repo through that tag** — the same objection that
ruled out Software Heritage. Also, GitHub retains force-pushed-away objects for a while regardless (they stay
addressable by SHA until GitHub's GC, and cached views may persist); GitHub's own guidance for removing sensitive data
is to force-push AND contact GitHub Support to purge cached references.

Options:

- **B1 (recommended):** after the force-push, delete the public release + tag `pre-cleanup-snapshot`; keep the
  private mirror as the untouched anchor, plus the captured release JSON (`runtime/open-source/anchor/`, GitHub's own
  `created_at`/`published_at`) and the mirror-repo JSON as the timestamp record; then ask GitHub Support to purge
  the unreachable objects. The strongest public proof of non-tampering is not the snapshot but the fact that
  `warpos@0.1.4` and the four headline commits keep their SHAs — anyone can check that the objects GitHub serves
  today are the objects the prior-art page cites, and the range-limited rewrite makes that true by construction.
- **B2:** keep the public snapshot release. The rewrite then only removes the strings from the *branch* history;
  they remain one `git fetch --tags` away. Honest to say so, but it makes the rewrite mostly cosmetic.

## 5. Verification (gate G2) — already built

`scripts/open-source/assert-evidence.js` (dependency-free) asserts on any clone: the four headline commits + the
tag commit + the signed commit exist as commits, the signed commit still carries its `gpgsig`, `warpos@0.1.4` →
`de9ba8eb`, all are ancestors of the ref under test, and (with `--strings`) `git log --all -S` finds zero commits for
every literal — reporting digests only. Run today on the working repo: evidence **OK**, sweep **FAIL on all 11**
(expected; the strings are still in history). That planted-positive run is the proof the sweep is not vacuous.

## 6. Runbook (not executed; every step below is what the operator will see before approving)

1. Operator: decision A (tool) + decision B (public anchor). If A1: install Python + filter-repo.
2. α: fresh **bare mirror clone** into scratch: `git clone --mirror <origin> rewrite-dryrun.git`.
3. α: strip comments from `_private/rewrite/replace-rules.txt` → clean rules file (still under `_private/`).
4. α: run the rewrite on the dry-run clone only (partial range `^de9ba8eb --all`).
5. α: `assert-evidence.js --repo rewrite-dryrun.git --ref <each branch> --strings <rules>` → must be OK on every ref.
6. α: produce **the exact diff for the operator**: (a) `git diff <old-HEAD> <new-HEAD>` per branch tip — expected to
   be ONLY the string replacements; (b) the old→new commit map (`filter-repo` writes `commit-map`; A2 writes the same
   from marks); (c) counts: commits rewritten / commits unchanged / refs moved. Saved to `runtime/open-source/rewrite/`.
7. **Operator approves the diff** (gate G2). Nothing is pushed before this.
8. α: `git push --force --all` + `git push --force --tags` from the dry-run clone (excluding `pre-cleanup-snapshot`
   per decision B), then re-run `assert-evidence.js` against a **fresh public clone**.
9. Commit the commit-map + digest table + assertion output to the repo (`runtime/open-source/rewrite/`).
10. Decision B1 follow-through: delete the public release/tag; file the GitHub Support purge request.
11. Downstream notice: `migrations/` entry + `/session:write` — the 8 products re-clone or `fetch` + `reset --hard`.
12. Local repo: `git fetch` + reset every local branch to origin; prune the old objects (`git gc --prune=now`).

## 7. Risks

- Any string variant not in the rules survives (e.g., a re-quote with different punctuation). Mitigation: the sweep in
  step 5 uses `-S` per literal AND the runbook adds a regex pass over the dry-run tree for the profane word stems
  before the diff is presented.
- The rewrite changes the SHAs of every commit from 2026-05-13 onward, including 37 `warpos@` release tags and the
  `pre-cleanup-snapshot` target. Tag *names* survive; downstream `warp:update` pins by version, not SHA (verify in
  step 6 against `scripts/warpos/update.js`).
- Force-push reads as tampering. Mitigation: the digest table, the commit map, and the byte-identical evidence set
  are all published; the provenance page states "eleven strings removed, first at 2026-05-13, nothing before
  2026-05-01 touched".
