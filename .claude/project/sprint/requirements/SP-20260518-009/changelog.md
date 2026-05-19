# Changelog — SP-20260518-009 / RL-20260519-013

**Release:** Consolidate ROADMAP.md and WARPOS_ROADMAP.md
**Target:** internal-canary
**Date:** 2026-05-19

## Summary

The canonical WarpOS repo previously kept two roadmap files at root:

- `ROADMAP.md` — a 40-line scaffold-style template, left at canonical only as a reference to the convention (never shipped to consumers).
- `WARPOS_ROADMAP.md` — the real framework backlog (~516 lines).

This release collapses the convention to a single canonical `ROADMAP.md` (containing the framework backlog), with a short header HTML comment documenting the file's dual identity:

- In canonical WarpOS = framework backlog.
- In downstream consumer projects = consumer's product roadmap. Consumers receive a clean scaffold from `scripts/warpos/generate-roadmap-scaffold.js` (inline JS string, independent of canonical). `scripts/warpos/promote.js` excludes `ROADMAP.md` from canonical→product propagation, so a consumer's roadmap is never overwritten.

## Consumer impact

**Zero.** The scaffold generator (`scripts/warpos/generate-roadmap-scaffold.js`) was already independent of canonical's `ROADMAP.md` — it encodes the scaffold as an inline JS string. `promote.js` already excluded `ROADMAP.md` from propagation. The consolidation is invisible at the consumer boundary.

## Changes

### Files modified

- `ROADMAP.md` — content replaced with framework backlog; new dual-identity header HTML comment added at top (line 3).
- `scripts/warpos/promote.js` — `FRAMEWORK_PREFIXES` allowlist no longer lists `"WARPOS_ROADMAP.md"`; comment block rewritten to single-file convention.
- `scripts/paths/gate.js` — removed `"WARPOS_ROADMAP.md"` allowlist entry.
- `scripts/path-lint.js` — removed `"WARPOS_ROADMAP.md"` allowlist entry; updated comment for `"ROADMAP.md"` entry to "canonical framework backlog (consumer scaffold is generated, not propagated)".
- `scripts/phase0-verify.js` — rewrote two checks: "promote.js excludes ROADMAP files" → "promote.js excludes ROADMAP.md from propagation"; "WARPOS_ROADMAP.md exists" → "ROADMAP.md exists at repo root (canonical framework backlog)".

### Files deleted

- `WARPOS_ROADMAP.md` — content moved into `ROADMAP.md`.

### Files deliberately frozen (historical references)

- `_docs/phase0/{FINAL_REPORT,IMPLEMENTATION_PLAN,FINDINGS,CHANGELOG_0.3.0}.md`
- `framework/releases/0.4.0/changelog.md`
- `_docs/sprint/FINDINGS.md`

These document the prior two-file convention as historical fact and remain accurate as history.

## Verification

- `node scripts/phase0-verify.js` → GREEN (7/7 tests, 9/9 checks).
- `grep -rn WARPOS_ROADMAP scripts/` → zero matches.
- `grep -rln WARPOS_ROADMAP _docs/phase0 framework/releases _docs/sprint` → 6 frozen files unchanged.
- `ls ROADMAP.md WARPOS_ROADMAP.md` → only `ROADMAP.md` exists.
- `node scripts/warpos/promote.js` dry-run → no `ROADMAP.md` entries in propagation set, no missing-file errors.

## Rollback

`git revert <consolidation-commit>` restores `WARPOS_ROADMAP.md` and the prior `ROADMAP.md` scaffold. No data migration; no consumer impact to roll back.

## Migration

None required. No state change across the canonical→consumer boundary.

## Routing override

QA and redteam phase routing traces were not recorded for this sprint. Reason: `documentation_scale: s` deliberately skips the redteam-plan and full QA gauntlet for low-risk refactors with no security surface. The release was approved with `--allow-routing-gap` (logged to `paths.decisionLedger`).
