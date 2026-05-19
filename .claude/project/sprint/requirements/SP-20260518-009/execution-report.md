# Execution Report — SP-20260518-009

**Sprint:** `SP-20260518-009` — Consolidate ROADMAP.md and WARPOS_ROADMAP.md
**Plan Contract:** `PC-20260519-0013`
**Mode:** solo
**Documentation scale:** s
**Branch:** `sprint/SP-20260518-009`
**Executed at:** 2026-05-19

## Tickets

| Ticket | Story | Status | Evidence |
|---|---|---|---|
| T-20260519-123 | S-1 rename WARPOS_ROADMAP.md → ROADMAP.md | done | ROADMAP.md contains framework backlog + dual-identity header HTML comment; WARPOS_ROADMAP.md removed |
| T-20260519-124 | S-2 remove WARPOS_ROADMAP allowlist entries | done | `scripts/warpos/promote.js`, `scripts/paths/gate.js`, `scripts/path-lint.js` all cleaned; comment block in promote.js rewritten to single-file convention |
| T-20260519-125 | S-3 rewrite phase0-verify.js checks | done | `node scripts/phase0-verify.js` → GREEN, 9/9 checks pass, including new "promote.js excludes ROADMAP.md from propagation" and "ROADMAP.md exists at repo root" |
| T-20260519-126 | S-4 smoke-verify end-to-end | done | All 5 smoke checks (AC-4.1–4.5) pass |

## Smoke verification (from T-126)

| AC | Check | Result |
|---|---|---|
| AC-4.1 | `node scripts/phase0-verify.js` exits 0 | ✓ exit=0, GREEN |
| AC-4.2 | `grep -rn WARPOS_ROADMAP scripts/` zero matches | ✓ zero |
| AC-4.3 | Historical refs in `_docs/phase0/*`, `framework/releases/0.4.0/changelog.md`, `_docs/sprint/FINDINGS.md` unchanged | ✓ 4 + 1 + 1 = 6 files still match, untouched |
| AC-4.4 | `ROADMAP.md` present, `WARPOS_ROADMAP.md` absent | ✓ pass |
| AC-4.5 | `promote.js` dry-run: no ROADMAP entry in propagation set, no missing-file error | ✓ pass |

## Issues opened / deferred

None.

## Implementation notes

### AC-1.4 — git rename detection

AC-1.4 in `acceptance-criteria.md#S-1` aspirationally required the consolidation to appear in git history as a recognizable rename. In a single commit, git's rename heuristic does not detect this case (modify-and-delete pair where the destination filename already existed in the index). To satisfy the spirit of the AC, the release-time commit will be split into two:

1. Commit A: `git rm ROADMAP.md` only (removes the scaffold). HEAD now has no `ROADMAP.md`.
2. Commit B: `git mv WARPOS_ROADMAP.md ROADMAP.md` + add dual-identity header HTML comment. Git's rename detection sees this as a clean rename since the destination doesn't exist in HEAD.

The commit split decision is recorded here so `/sprint:release` (or the operator running `/commit:both`) can do the right thing. If the split is not feasible (e.g., the operator wants a single commit for the whole sprint), AC-1.4 should be marked `not_satisfied — accepted` and noted as cosmetic-only.

### AC-2.1 — cross-cutting AC verified at T-126, not T-124

AC-2.1 ("zero WARPOS_ROADMAP matches under `scripts/`") is a cross-cutting AC: T-124's scope was the 3 allowlist files (promote.js, paths/gate.js, path-lint.js); `phase0-verify.js` was T-125's domain. AC-2.1 was satisfied after T-125 completed (and verified by T-126 smoke check AC-4.2). The AC could be re-authored as either a T-126 AC or a sprint-level cross-cutting AC in a future sprint design pass.

### phase0-verify.js choice (per AC-3.2)

The prior `WARPOS_ROADMAP.md exists` check (line 97-99) was REWRITTEN to `ROADMAP.md exists at repo root (canonical framework backlog)` rather than removed entirely. Rationale: keep the spirit of asserting on-disk presence; the new check still catches accidental deletion of the canonical roadmap.

## Routing trace

Auto-recorded by `scripts/sprint/plan.js` (planning phase) and `scripts/sprint/design.js` (design phase). Execution-phase routing trace will be auto-recorded by `execute.js stop --reason completed` per ticket (already invoked for T-123 through T-126).

## Files touched

Added or modified in the working tree:

- `ROADMAP.md` — content replaced with framework backlog + dual-identity header HTML comment
- `WARPOS_ROADMAP.md` — deleted
- `scripts/warpos/promote.js` — removed `"WARPOS_ROADMAP.md"` from FRAMEWORK_PREFIXES; comment block rewritten
- `scripts/paths/gate.js` — removed `"WARPOS_ROADMAP.md"` allowlist entry on line 300
- `scripts/path-lint.js` — removed `"WARPOS_ROADMAP.md"` allowlist entry on line 286
- `scripts/phase0-verify.js` — rewrote lines 90-99 (literal check + existence check)

Untouched (frozen historical references):

- `_docs/phase0/{FINAL_REPORT,IMPLEMENTATION_PLAN,FINDINGS,CHANGELOG_0.3.0}.md`
- `framework/releases/0.4.0/changelog.md`
- `_docs/sprint/FINDINGS.md`
- `DUMP.md` (transient — out of scope)

## Next command

`/sprint:release`
