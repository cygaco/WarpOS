# Acceptance Criteria — Polish public-facing repo surface for job-application audience

**Sprint:** `SP-20260519-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260519-002/prd.md`

> Each AC is a testable statement. The Plan Contract does NOT carry a `goal_verification` block, so the executable `verified_by:` gate is a no-op — but we still record honest verification methods.

## S-1 — Rewrite PROJECT.md to describe WarpOS

- **AC-1.1:** Given `PROJECT.md` after the S-1 commit, when I read the first three sections, then I see WarpOS framing (Alex agents, build modes, paths registry, sprint workflow) with zero references to Jobzooka, Bright Data, Next.js, React, or `src/lib/`.
  verified_by: not_applicable — visual read + `git grep -i "jobzooka\|bright data\|next.js\|react\|src/lib" PROJECT.md` returns 0 lines.
- **AC-1.2:** Given the new `PROJECT.md`, when `AGENTS.md` links to "Project-specific context", then the link resolves to a doc whose first paragraph identifies WarpOS (not another product).
  verified_by: not_applicable — manual link-follow + first-paragraph read.
- **AC-1.3:** Given downstream installs reference `PROJECT.md` via the shipped CLAUDE.md, when a consumer reads the new file, then it reads as a *template-by-example* — concrete enough to be useful, not so consumer-specific that it confuses someone using it as a starting point.
  verified_by: not_applicable — author review.

## S-2 — Update README.md version, counts, and audit catalog

- **AC-2.1:** Given `README.md` at sprint close, when I read the version line, then it shows `0.8.0` (matching `version.json#version`).
  verified_by: not_applicable — `grep "Version:" README.md` matches `node -p "require('./version.json').version"`.
- **AC-2.2:** Given `README.md` at sprint close, when I read the skill-count claim, then it matches the actual count (currently `139`) within a reasonable range (e.g. "~140").
  verified_by: not_applicable — actual count via `ls .claude/commands/ -R | grep '\.md$' | wc -l`.
- **AC-2.3:** Given `README.md` at sprint close, when I read the hook-count claim, then it matches `framework/hooks.registry.json#hooks.length` (currently `57`).
  verified_by: not_applicable — cross-check at commit time.
- **AC-2.4:** Given `README.md` at sprint close, when I expand the skill catalog `<details>` block, then every listed skill exists in `.claude/commands/` OR the table is replaced with a single line pointing to `/skills:list` and the file count.
  verified_by: not_applicable — author audit.
- **AC-2.5:** Given `README.md` at sprint close, when I scroll to the footer, then a "Last verified: YYYY-MM-DD" line is present.
  verified_by: not_applicable — visual check.

## S-3 — Delete WarpOS.md after inbound-reference check

- **AC-3.1:** Given a `git grep -l "WarpOS\.md\|WARP — The Machine"` run before deletion, when results return, then any non-trivial reference (in skills, hooks, agent specs) has been updated or the deletion is converted to a stub.
  verified_by: not_applicable — grep output recorded in ticket completion evidence.
- **AC-3.2:** Given `WarpOS.md` after sprint close, when I `ls` the repo root, then the file is absent (or, if S-3 chose the stub path, the stub is ≤10 lines and only points elsewhere).
  verified_by: not_applicable — `ls`.
- **AC-3.3:** Given `WarpOS.md` deletion, when I read the commit message, then it explains *why* deletion (not rewrite/rename) per C-3.
  verified_by: not_applicable — `git log --grep "WarpOS.md"`.

## S-4 — AGENTS.md cross-reference cleanup

- **AC-4.1:** Given `AGENTS.md` after S-1 lands, when I follow every `.md` link in it, then every link resolves to a file that exists and whose first paragraph matches AGENTS.md's described purpose for it.
  verified_by: not_applicable — manual link traversal.

## S-5 — Repo-root working-artifact cleanup

- **AC-5.1:** Given the repo root after S-5, when I `ls *.md` and ignore the in-scope auto-managed files, then `DUMP.md` is absent.
  verified_by: not_applicable — `ls DUMP.md` returns no such file; entry exists in `.gitignore`.
- **AC-5.2:** Given `DICTIONARY.md` after S-5, when I read it, then it contains at least 5 entries (current sprint vocabulary).
  verified_by: not_applicable — entry count.
- **AC-5.3:** Given `warpos-to-update.md` and `issues.md` after S-5, when I read the first 10 lines of each, then a `> **What this is.**` blockquote callout explains the file's role and `paths.json` binding.
  verified_by: not_applicable — visual read.

## S-6 — Fix version.json releasedAt + log recurring issue

- **AC-6.1:** Given `version.json` after S-6, when I read `releasedAt`, then the value is `2026-05-19` (matching RELEASES.md row for `0.8.0`).
  verified_by: not_applicable — `node -p "require('./version.json').releasedAt"` equals `"2026-05-19"`.
- **AC-6.2:** Given `paths.recurringIssuesFile` after S-6, when I `tail` the file, then a new entry exists describing why `release-canonical.js` skipped the field on the 0.8.0 cut.
  verified_by: not_applicable — `tail -5 .claude/project/memory/recurring-issues.jsonl` contains the entry.

## S-7 — USER_GUIDE.md targeted drift sweep (optional)

- **AC-7.1:** Given `USER_GUIDE.md` after S-7, when I scan the "5 Core Skills" table and the modes section, then every skill name referenced exists in `.claude/commands/`.
  verified_by: not_applicable — spot-check; if a real audit is needed, defer to a future sprint.
