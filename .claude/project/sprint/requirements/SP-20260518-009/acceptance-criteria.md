# Acceptance Criteria — Consolidate ROADMAP.md and WARPOS_ROADMAP.md

**Sprint:** `SP-20260518-009`
**PRD:** `prd.md`

Each AC is a testable statement. The Plan Contract does NOT carry a `goal_verification` block, so `verified_by:` linkage is NOT required by the sprint:design gate (SP-20260518-007 convention). Verification is described in `qa-plan.md`.

## S-1 — Rename WARPOS_ROADMAP.md → ROADMAP.md (content move)

- **AC-1.1:** Given the repo at HEAD after this story, when `ls ROADMAP.md WARPOS_ROADMAP.md` runs, then `ROADMAP.md` exists and `WARPOS_ROADMAP.md` does not exist.
- **AC-1.2:** Given the new `ROADMAP.md`, when its content is inspected, then it contains the framework backlog sections from the prior `WARPOS_ROADMAP.md` (e.g., the "Known issues / 0.1.5 backlog", "Shipped in v0.x.y" blocks, and the "Phase 1–4" sections).
- **AC-1.3:** Given the new `ROADMAP.md`, when its top is inspected, then it contains a single short header HTML comment explaining the dual identity (canonical = framework backlog; consumer = product roadmap, scaffolded from `generate-roadmap-scaffold.js`, excluded from propagation by `promote.js`). The obsolete header comment AND the obsolete footer cross-link to `WARPOS_ROADMAP.md` are both absent.
- **AC-1.4:** Given the git history at HEAD, when `git log --follow --diff-filter=R -- ROADMAP.md` runs, then the consolidation commit appears with the file move attributable from `WARPOS_ROADMAP.md` (the scaffold delete + content rename should be recognizable as a move by git's heuristics).

## S-2 — Remove WARPOS_ROADMAP allowlist entries from live-code

- **AC-2.1:** Given the repo at HEAD after this story, when `grep -rn WARPOS_ROADMAP scripts/` runs, then there are zero matches.
- **AC-2.2:** Given `scripts/warpos/promote.js`, when its `FRAMEWORK_PREFIXES` list is read, then it contains `"ROADMAP.md"` and does NOT contain `"WARPOS_ROADMAP.md"`. The comment block above the entries reflects the post-consolidation reality (single-file convention, not the prior two-file convention).
- **AC-2.3:** Given `scripts/paths/gate.js`, when line ~300 is read, then the `"WARPOS_ROADMAP.md"` allowlist entry is absent. Other entries on neighboring lines remain.
- **AC-2.4:** Given `scripts/path-lint.js`, when line ~286 is read, then the `"WARPOS_ROADMAP.md"` allowlist entry is absent. Other entries remain.

## S-3 — Rewrite phase0-verify.js consolidation checks

- **AC-3.1:** Given `scripts/phase0-verify.js` after this story, when its checks list is inspected, then the prior check that asserted `promote.js` contains BOTH `"ROADMAP.md"` AND `"WARPOS_ROADMAP.md"` is replaced with one that asserts only the `"ROADMAP.md"` literal is present.
- **AC-3.2:** Given the same script, when the prior `WARPOS_ROADMAP.md exists` check is reviewed, then either (a) it is removed entirely OR (b) it is rewritten to `ROADMAP.md exists`. Either is acceptable; the choice is recorded in the commit message.
- **AC-3.3:** Given `node scripts/phase0-verify.js`, when it is run from repo root after all sprint edits, then it exits 0.

## S-4 — Smoke-verify consolidation end-to-end

- **AC-4.1:** `node scripts/phase0-verify.js` exits 0.
- **AC-4.2:** `grep -rn WARPOS_ROADMAP scripts/` returns zero matches.
- **AC-4.3:** `grep -rln WARPOS_ROADMAP _docs/phase0 framework/releases _docs/sprint` returns the historical files unchanged (file list and line counts identical to pre-sprint state). DUMP.md may or may not match — it is transient and out of scope.
- **AC-4.4:** `ls ROADMAP.md` succeeds; `ls WARPOS_ROADMAP.md` fails with "no such file" (exit non-zero).
- **AC-4.5:** A dry-run of the canonical propagation pipeline (manual invocation of the relevant `promote.js` entry point with `--dry-run` or equivalent) confirms `ROADMAP.md` is still excluded from canonical→product propagation and does not error on the missing `WARPOS_ROADMAP.md`.
