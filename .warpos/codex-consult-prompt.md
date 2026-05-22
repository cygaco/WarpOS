# Consult: WarpOS consumer update pipeline brittleness

You are reviewing a real production issue from a multi-hour session and need to propose a concrete plan. Be decisive and brief — the operator is frustrated with academic answers.

## What WarpOS is

WarpOS is a Node-based AI agent framework. A single **canonical** repo (`C:/Users/Vladislav Zhirnov/Desktop/Claude/Projects/WarpOS`) ships releases as **capsules** under `framework/releases/<version>/{release.json, framework-manifest.json, checksums.json, changelog.md, upgrade-notes.md}`. Two **consumer** repos (`aiweb`, `jobhunter-app`) install WarpOS into themselves and apply capsules via `node scripts/warpos/update.js --source <canonical> --target <consumer> --to <version>`.

The update pipeline has these layers:
1. **Preflight** — 10 gates (install-baseline, capsule-resolvable, version-quorum, manifest-honesty, staleness, path-resolution, structure-parity, applied-migrations, migration-presence, tracked-transients). Hard-red on any → refuse apply. Only 4 have override flags.
2. **Classify** — for each asset in `capsule/framework-manifest.json#assets`, compare local file sha256 against capsule sha256 and `framework-installed.json#assets[].installedHash`. Output 12 categories; Class C (MERGE_CONFLICT, DELETE_CONFLICT) escalates.
3. **Transaction** — `beginTransaction` snapshots + locks, apply writes, `commitTransaction` or rollback.
4. **Postflight** — 5 diagnostic checks (paths build, paths gate, hooks build, hooks test, provider-smoke).

## What happened this session

Operator asked: "get all three projects on the latest WarpOS version." Started at 0.5.0 canonical with 16 hours of uncommitted post-release work on `main` (5-sprint parallel delivery). What unfolded:

1. **Released 0.6.0** via `release-canonical.js`. Worked, but capsule's `checksums.json` immediately reported drift because stage-9 ff-merge to `main` invoked the git checkout smudge filter that converted capsule files LF→CRLF (Windows `core.autocrlf=true`). Fixed by manually pinning `release.json#commit` and re-running `release-build.js 0.6.0` (mirror of 0.5.0's known follow-up commit pattern).

2. **aiweb update (0.4.4 → 0.6.0): 77 MERGE_CONFLICTs surfaced.** Investigation: 75 were pure CRLF/LF drift — aiweb's working tree has CRLF (autocrlf), `installedHash` was computed against LF bytes at install time. Solution: wrote `lf-normalize-target.js` that strips CRLF→LF in-place where `sha256(stripCR(file)) === installedHash`. 75/77 cleared. The other 2 (redteam orchestrators) had MIXED line endings in canonical — strip-CR didn't produce an exact byte match. Force-copied from canonical.

3. **Preflight blocked apply** on `path-resolution` (10 runtime/generated paths point to non-existent files — gate is overly strict, doesn't skip `owner: runtime` or `owner: generated`), `structure-parity` (9 missing `_requirements/*` skeleton dirs that didn't exist in this consumer's vintage), `applied-migrations` (2 stale migration dirs). Fixed by `mkdir -p`, `touch` empty placeholders, `rm -rf` stale migrations.

4. **Manifest-honesty RED after migration cleanup**: framework-installed.json still had asset entries pointing to deleted migration files. Wrote `prune-installed-assets.js` to filter entries by regex on dest.

5. **Apply ran but reported "Update failed"** — classifier next run reported 516 Class C (!). Investigation: capsule's `framework-manifest.json#assets[].sha256` is intentionally truncated to 12 chars by `scripts/generate-framework-manifest.js:121` (comment says "12-char content hash for drift detection"). But `update.js:490` writes `installedHash: a.sha256 || localHash` — propagating the truncated 12-char hash into `framework-installed.json`. Then classifier's `localSha === installedHash` (64 char vs 12 char) is always false → everything is MERGE_CONFLICT.

6. **Fixed update.js** to use `hashMatches(longHash, shortHash) → longHash.startsWith(shortHash)` for both `targetSha` and `installedHash` comparisons. Also added `sha256FileLfNormalized()` fallback. Also fixed line-490 precedence to prefer `localHash` (full 64) over `a.sha256` (truncated 12).

7. **One stubborn MERGE_CONFLICT remained for version.json** because capsule manifest's sha256 was the LF hash but on-disk version.json (post stage-9 smudge) was CRLF. Required adding LF-normalization to the manifest-honesty check too.

8. **Applied-migrations gate re-blocks after apply** because apply re-copies the migration files (they're in the capsule's asset list as `kind: migration`), then the gate flags them stale, you delete them, apply re-copies them — infinite loop.

9. **--skip-preflight used twice** to break the loop. Apply committed cleanly both times (540 files updated, 0 errors). Postflight had 1 RED (applied-migrations) + 2 degraded (provider-smoke env-specific, warp-health script not present) but apply was already committed. Operator cleaned up stale migrations post-update.

10. **jobhunter-app update (0.1.2 → 0.6.0)** had additional twist: 19 DELETE_CONFLICT files turned out to be **real project content** the operator had filled into framework template dirs (`_requirements/00-canonical/CORE_BRIEF.md` = the actual product brief). Resolved by stripping those 19 entries from `framework-installed.json` (preserve files, untrack them) plus force-copying 17 framework MERGE_CONFLICTs plus deleting 4 stale migration scripts.

11. **One final twist**: jobhunter's `update.js` flagged itself MERGE_CONFLICT after force-copy because my mid-session fixes meant canonical's update.js had moved past the 0.6.0 capsule. Resolved by `git show 425570a:scripts/warpos/update.js > jobhunter/.../update.js` to restore 0.6.0-vintage.

12. **Final move**: committed the framework fixes to canonical `main` (no version bump) and direct-copied the 5 fixed files into both consumers' working trees. Skipped 0.6.1 because the release cycle itself has bugs being fixed.

## Current state

- canonical: 0.6.0 + 1 follow-up commit (cc2cfeb) with fixes, on origin/main, tagged warpos@0.6.0.
- aiweb + jobhunter-app: framework-installed.json says 0.6.0; working tree has canonical-main framework code.
- Operator wants: all 3 projects on "the latest" sustainably AND wants the update pipeline to STOP being a nightmare.

## The question for you

The operator's literal frustration: "you are making it hard to ship updates."

Look at the bug list. They're not random. They cluster:

- **A. Capsule + working-tree byte equivalence is fragile on Windows.** CRLF/LF + autocrlf=true means hashes computed at install time, stored in manifests, never match working tree hashes after the next git checkout. Both `update.js` classifier AND `manifest-honesty` AND `release-build.js#--check` ALL hit this. The fix has to live in the hash comparison layer, not in pre-update file shuffling.

- **B. The capsule sha256 truncation is a foot-gun.** 12-char drift detection is fine in isolation but propagates into `installedHash` via update.js:490, then never matches a freshly-computed 64-char sha. Either un-truncate, or make every comparison truncation-tolerant by contract.

- **C. Preflight gates have no overrides for legitimate states.** A consumer mid-recovery (partial apply, mid-cleanup) hits 3 RED gates with no `--allow-*` flag and has to use `--skip-preflight` (which the code itself calls "NOT recommended"). The gates need either (a) better overrides, (b) a "diagnostic" mode that surfaces all reds at once without blocking, or (c) smarter classification of "real blocker" vs "expected during update flow."

- **D. Apply re-copies files that postflight then flags as stale.** Migration files are shipped as framework assets in the manifest, copied by apply, then `applied-migrations` gate says "delete me" — but next apply re-copies them. Either migrations should not ship as framework assets, or the gate should exclude files that the current apply just wrote.

- **E. Real project content gets misclassified.** When a consumer fills `_requirements/00-canonical/*.md` with actual product briefs (because the framework shipped them as templates), and the framework later removes them, DELETE_CONFLICT is technically right but practically destructive. Framework needs an "ownership transition" concept (`framework_template` → `project_owned` on first edit).

Given all of this:

1. What's the right MINIMUM set of changes to the framework so the next consumer update doesn't reset into this nightmare? Be specific: which file, what change, what's the contract.

2. Should the truncated sha256 stay truncated (and every comparison handle prefix) or get un-truncated (capsule sha256 → full 64-char)? Pick one and justify.

3. Should preflight gates ship with an "I know what I'm doing" `--operator-override` flag that bypasses any single gate with audit logging, OR should each gate get its own narrower override? Pick one.

4. Is there a structural argument for SEPARATING the "release the canonical" pipeline from the "apply to consumer" pipeline so each can fail independently without re-poisoning the other? (Right now `release-canonical` + `update.js` share hash compute conventions, gate logic, registerExternalCheck, etc.)

5. The single most important change the operator should make in the next session to stop this from recurring. One sentence.

Output format:
- Verdict (1 sentence)
- 5 numbered answers, terse, no preamble
- Risks of your plan
- What you'd want to know that you don't

Do not summarize the situation back. Do not propose a 12-step migration. Pick the changes that pay for themselves on the first encounter and let the rest die.
