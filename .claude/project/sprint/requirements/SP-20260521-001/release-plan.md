# Release Plan — Portfolio Console + /portfolio:* Unification

**Sprint:** `SP-20260521-001`

## Pre-release gates

1. **All 12 tickets `done`.** `node scripts/sprint/ticket.js list --sprint SP-20260521-001 --status done` shows 12 rows.
2. **AC coverage 100%.** `node scripts/sprint/check-ac-coverage.js --sprint SP-20260521-001` reports green.
3. **QA plan all green.** Manual run-through of qa-plan.md QA-1..QA-12 + cross-cutting checks.
4. **Redteam stop-the-bus clean.** None of the 7 stop-the-bus signals tripped.
5. **Pre-rename grep-sweep verified.** `grep -r "/product:" --include="*.md" --include="*.json" --include="*.js" .` returns zero unexpected hits (Beta DEC-005 addendum mandate).
6. **Routing coverage.** `node scripts/sprint/routing.js coverage --sprint SP-20260521-001` reports green for plan/design/execute/qa/redteam phases.
7. **Beta release blessing.** Final pre-release consult — surface ticket count, ESDs satisfied, approval status, dogfood migration results.
8. **Approvals recorded.** All approvals from Plan Contract's `approval_boundaries` have status `approved` in `paths.sprintApprovals`.

## Release execution

1. **Bump WarpOS version.** Minor bump: `0.8.2` → `0.9.0`. Schema-changing keys + new skill family warrant minor.
2. **Run `/warp:release`.** Drives canonical clone release end-to-end (promote → bump → regen → build capsule → gates → commit → ff-merge → push → tag).
3. **`/portfolio:sync` against the dogfooded products.** Run sync against newly-adopted `dreamteams` + `companycam` siblings to verify the new framework version applies cleanly via `/warp:update`.
4. **Update RELEASES.md.** Append the sprint entry inline with the release.
5. **Update ROADMAP.md.** SP-20260521-001 row flips from `planning` → `closed` (auto by `scripts/sprint/ledger.js`).

## Post-release

1. **Run `/sprint:retrospective SP-20260521-001`.** Capture what worked, what surprised, what changes the convention for next time.
2. **Verify deprecation banner.** Open a fresh session, invoke `/product:bootstrap`, verify C-14 prints once.
3. **Monitor events log for 24h.** Watch for any `portfolio_*` events with unexpected payloads (especially TR-6 with `terminal_used: fallback_copyable` indicating spawn failures users hit in practice).

## Rollback plan

- **Pre-merge:** Plan Contract + design bundle + tickets are all reversible via `git revert <merge-sha>`.
- **Post-merge, pre-release:** revert canonical commits. No consumer impact.
- **Post-release:** The deprecation aliases preserve `/product:*` callers; no consumer breakage on rollback. If the new `/portfolio:*` family proves broken, revert canonical, cut a 0.9.1 patch removing the new skills, leave aliases in place.

## Release gates (auto)

- `release-gates.js` runs:
  - Reference integrity (manual gate — verify briefs/clones not committed under new gitignore).
  - Schema coverage (portfolio-registry schema must validate).
  - Capsule build (manifest must include 10 new skill files + scripts + schemas + templates).
- `framework-manifest-guard.js` runs on commit (catches missed asset inclusions).
- `path-lint.js` runs (catches stale literal paths in any new file).

## Deprecation timeline

- **v0.9.0 (this release):** `/portfolio:*` ships. `/product:*` aliases live, print banner.
- **v0.9.x:** Bug fix releases. Aliases stay.
- **v0.10.0 (target):** Aliases removed. Grep-sweep at release-prep verifies no consumer references remain via `/check:patterns` or similar discovery.

## Owner

- **Release commander:** Alpha (this session).
- **Beta consult:** required at each gate.
- **Push approval:** explicit user prose ("ship 0.9.0" or equivalent) — per CLAUDE.md `git push` red line.
