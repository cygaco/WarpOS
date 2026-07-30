# Reference Integrity Report — WarpOS 1.2.0 pre-release gate

- **Gate:** `reference_integrity` (`/scan:references`)
- **Run:** 2026-07-29, α (the manual gate is a slash skill; teammates cannot invoke it)
- **Tree:** `session/2026-07-25` @ `11fead50` + the staged 16-file release set (stage-7 re-run GREEN 18/0/0)
- **Scanner:** `node scripts/hooks/ref-checker.js --summary` — raw exit code **1** (permanent resting state; see the 1.1.0 report's exit-code note — verdict comes from Step-2 severity triage, not the raw exit)
- **Baseline:** `runtime/refscan-20260724/report.md` (1.1.0 gate, CLEAN at 385 raw canonical broken)

## Verdict: CLEAN

Zero release-blocking reference issues. Zero SPEC_GRAPH issues. Canonical-tree broken refs are
**388 vs the 1.1.0 baseline of 385**, with an IDENTICAL type distribution (bare-path 370 vs 368,
require 9 vs 9, json-path 7 vs 7, md-link 1 vs 1). No shipped skill/agent/script/canonical-doc
gains a broken LIVE dependency from this release's 16-file set. Cleared for the 1.2.0 mint.
Report-only; nothing fixed.

## Summary (raw vs canonical)

| Metric | Raw | Canonical-only (worktree noise excluded) |
|---|---|---|
| Files scanned | 32,315 | ~1.8k-class (baseline 1,776) |
| Broken references | 9,870 | **388** |
| Orphaned files | 30,773 | baseline-class (orphans never gate; line 418) |
| SPEC_GRAPH issues | **0** | **0** |

## The raw-vs-canonical gap, explained

The scanner walked **8 stale agent worktrees** (`.claude/worktrees/agent-*`, `.worktrees/*`), each a
near-full repo copy — 14,535 of the 45,898 report lines are worktree paths. Every worktree "finding"
is a duplicate of a canonical line or a copy of known-noise fixtures (`missing-script.js` /
`missing-tool.js` are seeded test fixtures, present per-worktree). Filtered file:
`runtime/refscan-20260729/broken-canonical.txt`. Worktree pruning is already queued in TRACKER;
candidate improvement (not a gate item): ref-checker should exclude worktree dirs from its walk.

## New-file check (this release's 16-file set)

Exactly ONE broken ref originates from a file new this sprint:
`.claude/commands/memory/verify.md:78 → scripts/foo.js` — a table cell whose content is literally an
EXAMPLE of a file-path claim ("file-path claim (`scripts/foo.js`, …)"). Prose example, not a live
dependency. ADR-0040, the INDEX row, the five runtime/beta-consult + sp002-invariants files, both
gate-script fixes, and the tracker edit introduce zero broken refs.

## Delta vs baseline

+3 raw canonical (385 → 388): +2 bare-path, +1 within archived-doc churn — one confirmed as the
verify.md prose example above; the remaining delta is inside the archived/noise-floor surface class
(NOISE:sprint-artifact / historical dot-dir layouts) documented in the 1.1.0 report's taxonomy.
No new Critical/High class appeared.

## Artifacts

- Raw scanner output: `runtime/refscan-20260729/raw-summary.txt`
- Canonical-only broken list: `runtime/refscan-20260729/broken-canonical.txt`
