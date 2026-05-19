# QA Plan — Consolidate ROADMAP.md and WARPOS_ROADMAP.md

**Sprint:** `SP-20260518-009`
**PRD:** `prd.md`

Sprint v0.1 QA plan. Honored by `/sprint:execute` (mid-sprint checks) and `/sprint:release` (final QA gate). Diff-model review on QA is declared in `paths.sprintRouting` (`qa.diff_review: true`) but is fail-open when no second-vendor reviewer is configured.

## Smoke checks

- [ ] `node scripts/phase0-verify.js` exits 0 from repo root.
- [ ] `grep -rn WARPOS_ROADMAP scripts/` returns zero matches.
- [ ] `grep -rln WARPOS_ROADMAP _docs/phase0 framework/releases _docs/sprint` returns the historical files unchanged (same set as pre-sprint).
- [ ] `test -f ROADMAP.md && test ! -f WARPOS_ROADMAP.md` succeeds.

## Per-story QA

### S-1 — Rename WARPOS_ROADMAP.md → ROADMAP.md

- [ ] AC-1.1 verified — only `ROADMAP.md` exists at repo root.
- [ ] AC-1.2 verified — new `ROADMAP.md` contains framework backlog sections (spot-check headings: "Known issues / 0.1.5 backlog", "Shipped in v0.2.0", "Phase 1 — Ship-week hardening").
- [ ] AC-1.3 verified — top of `ROADMAP.md` has the new dual-identity header HTML comment; obsolete prior header + footer are gone.
- [ ] AC-1.4 verified — `git log --follow --diff-filter=R -- ROADMAP.md` shows the move (git rename detection).

### S-2 — Live-code reference cleanup

- [ ] AC-2.1 verified — zero `WARPOS_ROADMAP` matches under `scripts/`.
- [ ] AC-2.2 verified — `promote.js` FRAMEWORK_PREFIXES contains only `"ROADMAP.md"`; comment block reflects single-file convention.
- [ ] AC-2.3 verified — `paths/gate.js` line ~300 no longer has the WARPOS entry.
- [ ] AC-2.4 verified — `path-lint.js` line ~286 no longer has the WARPOS entry.

### S-3 — phase0-verify.js rewrite

- [ ] AC-3.1 verified — promote-literal check now asserts only `"ROADMAP.md"`.
- [ ] AC-3.2 verified — file-existence check is either removed or rewritten to `ROADMAP.md exists` (commit message records the choice).
- [ ] AC-3.3 verified — `node scripts/phase0-verify.js` exits 0.

### S-4 — End-to-end smoke

- [ ] AC-4.1–AC-4.5 verified per the explicit commands listed in `acceptance-criteria.md#S-4`.

## Cross-cutting QA

- [ ] Path-lint passes (no new path-literal violations introduced).
- [ ] `git status` clean except for the four edited files + the renamed `ROADMAP.md` (post-content move).
- [ ] No new console errors / warnings when running any of the touched scripts.
- [ ] Historical references in frozen docs left byte-for-byte identical (use `git diff` to confirm).
- [ ] DUMP.md NOT touched (out of scope; transient).

## External service QA

N/A — no ESDs identified for this sprint.

## Documentation scaling

This plan is the `documentation_scale: s` cut. Red-team and release-plan files are intentionally skipped at this scale. The reasoning:

- **Red-team:** This sprint touches docs and four allowlist entries; no security surface, no auth, no data flow. No adversarial review needed.
- **Release-plan:** Treated as a chore-class change that ships with the next normal canonical release (versioned through `/warp:release`). No special release choreography required.
