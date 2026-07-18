# SP-20260718-002 — plan + composition (ε conductor record)

**Sprint:** D-1 second half — event COMPACTOR + MATERIALIZED STATE + query `--archive` read path.
**Conducted by:** Alex ε (teammate "Epsilon"), sprint mode, ADR-0009 runtime.
**Authoritative scope:** `RATIFIED-PLAN.md` D-1 [DIRECTIVE] + the MERGED SP-001 archive/rotate code on main + Phase 0's D7 retention classes (`.claude/kernel/`). Verify-don't-inherit: read the merged code, not stale assumptions.
**Precedes:** Phase 1 (routing + security truth). Lands "immediately after SP-001, separately" (operator D-1).

## THE CORE SAFETY INVARIANT (non-negotiable, from operator D-1 + Phase 0 CORE-4)
**Raw history is NEVER destroyed.** Compaction SUMMARIZES; it does not delete. Every rotated/compacted raw event MOVES to the archive tier (accessible + indexed), never unlinked. This sprint implements the RUNTIME side of the kernel contract's CORE-4 for the events subsystem. Data-integrity-critical → max_risk:high.

## Verify-don't-inherit findings (what exists vs what's NEW)
- SHIPPED (SP-001, on main): `archive.js` (move-to-archive tier `.claude/runtime/archive/` + append-only `index.jsonl` + collision-proof names F-ROT-1 + restore + path-containment), `rotate.js` (CAP_CLASSES + rotation), `retention.js` (cruft archiving), `log-sink-caps.js` (per-sink caps). The archive tier + index + restore drill (addendum B) are DONE — BUILD ON THEM.
- EXISTS: `scripts/events/cli.js` (tail + query over the LIVE events file); `/events:query` + `/events:tail` skills. Query works for LIVE events only.
- NEW (this sprint): the COMPACTOR (no compact.js), MATERIALIZED STATE (no scripts/state/), and the query `--archive` read path (cli.js query does NOT read the archive index).

## Composition
- `unit_types: [backend]` — 3 node scripts + tests/fixtures + a skill extension. No FE/UI.
- `max_risk: high` — the never-lose-raw-history invariant makes this data-integrity-critical; keeps qa+security gauntlet lanes binding + quality-lead at design.
- `domains: []`.

## Deliverables → exit-gate trace (seed for the traceability lane)
| # | Deliverable | Gate (mirrors Phase-0 G-discipline) |
|---|---|---|
| C1 | **Event compactor** `scripts/events/events-compact.js` (NOT compact.js — β rider #1, avoids collision with `scripts/hooks/compact-saver.js`; corrected at design, see design/build-spec.md) — folds old events into a summary + keeps a bounded raw TAIL; compacted raw MOVES to archive.js (never deleted). Design ruling (ε-ratified): whole-file-archive → reseed-a-bounded-tail (inherits rotate.js atomic-rename safety; no concurrent-append race). Idempotent, single-writer/non-racy (SP-001 lock pattern), fail-closed (any doubt → archive-not-delete). | GC-1: round-trip test proves EVERY raw event is archived+indexed (0 lost); restore-drill recovers raw; fail-closed on a mid-compaction crash (no partial loss) via the required `crashAfter` seam-abort hook. |
| C2 | **Materialized state** `scripts/state/materialize.js` — regenerates small state files ("what's running / what happened") from events; deterministic + idempotent (regenerable from events, never authoritative-over-events). | GC-2: materialize is deterministic (same events → same state) + idempotent; state matches the events; a corrupt state file is regenerated, not trusted. |
| C3 | **Query `--archive` read path** — extend `scripts/events/cli.js query` with `--archive` reading `archiveIndexPath` + archived raw logs; extend `/events:query`. Query-first reader discipline. | GC-3: a query `--archive` over archived history returns the archived events; live + archive together give complete history. |
| C4 | **Reader-discipline doctrine** — query-first (state files / events:query are the read path; full-log reads the exception). Doc + (if enforceable) a check or ED. | GC-4: doctrine documented; every policy names an Enforcer: or logs an ED. |
| — | Manifest regen (new scripts hash-tracked) + ED-ledger reconcile at release (ED-221 gitignored-ledger seam). | non-strict manifest validate exit 0; canonical ledger carries any cited EDs pre-merge. |

## Applied lessons from Phase 0 (SP-20260718-001)
- Pre-created worktree + savepointed builder (reap-with-savepoints = zero lost work).
- WARPOS_SPRINT_ID on all CLI dispatches; 2-family gauntlet (agy DOWN); sol→terra on security shapes.
- ED-221 gitignored-ledger seam: reconcile canonical ledger before merge (manual until its enforcer lands).
- Gauntlet disposition criterion pre-set (F2): does a non-malicious MISTAKE reach an IRREVERSIBLE outcome — here the irreversible outcome is LOST RAW HISTORY (a compaction/archive bug that unlinks or drops raw events is mistake-reaches-IRREVERSIBLE = must-fix, never dispositioned).
- β at the 4 boundaries (direct consults).
