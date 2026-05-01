# Private-to-Public Repo History Scrubbing

> Reference for the one-time-or-rare operation of taking a private dev repo public while removing references to internal names, paths, or partner/client identifiers.

## Source learning

LRN `2026-04-18` (line 108 of `paths.learningsFile`): "History-scrub via git-filter-repo for private-to-public repo transition: single-author + zero-fork scenario = low-risk."

## When this applies

- Repo is currently private (or public but contains internal-only artifacts)
- Single committer or all committers have been informed
- **Zero existing forks/clones outside your control** (mandatory — once you rewrite history, every clone diverges and merges become impossible)
- Scrub targets are deterministic strings (internal product names, partner names, paths like `/Users/<real-name>/`)

## Procedure

1. **Install git-filter-repo** (NOT `git filter-branch` — deprecated and slow):
   ```bash
   pip install git-filter-repo
   ```

2. **Inventory the strings to replace.** Grep the repo for every internal identifier and write a `replacements.txt`:
   ```
   OldInternalName==>PublicProductName
   /Users/personal-username/==>/Users/dev/
   client-x@example.com==>contact@example.com
   ```
   One replacement per line; left side is regex by default. Use `==>` separator.

3. **Run the rewrite on a fresh clone** (NEVER on the working repo — irrecoverable if wrong):
   ```bash
   git clone --bare /path/to/repo /tmp/repo-scrub.git
   cd /tmp/repo-scrub.git
   git filter-repo --replace-text /path/to/replacements.txt
   ```

4. **Audit before pushing.** Re-grep for every old string; fix the replacements and re-run if anything was missed:
   ```bash
   git log --all --source -p | grep -i "OldInternalName" && echo "STILL THERE — abort"
   ```

5. **Force-push to the new public remote.** `--force` is intentional here:
   ```bash
   git remote set-url origin git@github.com:public-org/public-repo.git
   git push origin --force --all
   git push origin --force --tags
   ```

6. **Notify any collaborators** that history changed; everyone re-clones.

## Risks

- **History rewrites are irrevocable** — any out-of-band clone diverges
- **GitHub caches the old SHAs in PRs/issues** — those references break; scrubbing won't fix them
- **GitHub Actions and Pages build histories** may need re-trigger
- **NEVER use this on a multi-contributor active repo** — coordinate a freeze first

## When NOT to use this

- Multiple active contributors with un-pushed local work
- Any chance of hidden forks/clones
- Need to preserve commit signatures (filter-repo invalidates GPG signatures)
- Just want to scrub the latest commit (use `git commit --amend` instead)

## See also

- `git-filter-repo` docs: <https://github.com/newren/git-filter-repo>
- LRN-2026-04-18 (line 108) — original validated learning
