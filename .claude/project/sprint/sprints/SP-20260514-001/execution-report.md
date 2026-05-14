# Sprint Execution Report — SP-20260514-001

**Title:** Harden WarpOS update pipeline — content-hash + sha256 un-truncation + operator-override + ownership transition
**Plan Contract:** `PC-20260514-0008`
**Documentation scale:** `l` (10 files including redteam + release plans)
**Mode:** adhoc
**Status at execute end:** `in_review` (10/10 tickets done; awaiting `/sprint:release` for 0.7.0 tag)
**Scope shipped:** GPT-5.5 items **1, 2, 3, 5, 6**. Item 4 (release/apply pipeline separation) deferred per Plan Contract `scope_variants.recommended`.

## Tickets

| Ticket | Type | Status | Linked AC |
|---|---|---|---|
| T-20260514-068 | feature | done | AC-1.1, AC-1.2, AC-1.3 (content-hash module) |
| T-20260514-069 | refactor | done | AC-2.1, AC-2.2 (callers refactored) |
| T-20260514-070 | feature | done | AC-3.1, AC-3.2 (capsule sha256 un-truncation) |
| T-20260514-071 | feature | done | AC-4.1, AC-4.2, AC-4.3 (consumer installedHash un-truncation) |
| T-20260514-072 | feature | done | AC-5.1, AC-5.2, AC-5.3, AC-5.4 (`--operator-override` + audit) |
| T-20260514-073 | feature | done | AC-6.1, AC-6.2, AC-6.3, AC-6.4 (framework_template ownership transition) |
| T-20260514-074 | refactor | done | AC-7.1, AC-7.2 (stop emitting migrations) |
| T-20260514-075 | feature | done | AC-8.1, AC-8.2 (capsule-aware applied-migrations) |
| T-20260514-076 | trace | done | AC-9.1, AC-9.2, AC-9.3 (three new event kinds) |
| T-20260514-077 | qa | done | AC-10.1, AC-10.2, AC-10.3 (replay bench + docs) |

## What landed

### R-1 — Hash semantics + back-compat
- New module `scripts/warpos/lib/content-hash.js` (~190 LOC with `--selftest`). Exports `contentHash` (LF-normalized for text), `rawHash` (raw for binary), `hashMatches` (prefix-tolerant), `isTextAsset` (extension allowlist).
- Five callsites refactored to use the module: `update.js`, `release-build.js`, `manifest-honesty.js`, `generate-framework-manifest.js`, `snapshot-installed.js`.
- Capsule `framework-manifest.json#assets[].sha256` now full 64-char. `.slice(0, 12)` dropped from `generate-framework-manifest.js`.
- Consumer `framework-installed.json#assets[].installedHash` now full 64-char.
- Pre-0.7.0 12-char prefix capsules remain readable via `hashMatches`.

### R-2 — Preflight override contract + audit log
- `scripts/warpos/preflight.js` gains `--operator-override <gate-name>` (repeatable) + `--override-reason "<text>"` (required, 8-500 chars trimmed).
- Unknown gate names rejected; full valid gate list printed.
- JSONL injection prevented structurally — `JSON.stringify` in `writeEnvelope` escapes control chars.
- Each accepted override emits `warpos.update.operator-override-used` with `{gate, reason, operator, ts, txId, gateStatusBefore}`.
- Legacy narrow flags (`--allow-stale`, `--force-fresh`, `--allow-version-drift`) kept for back-compat; do NOT emit the new audit event.

### R-3 — Asset ownership state machine
- Decision logged to `paths.decisionLedger` 2026-05-14 (Alpha-resolved Class C per no-pause directive; Beta-recommended): **automatic on any non-whitespace edit**. Reversible by future sprint.
- `framework/paths.registry.json` owner doc accepts `framework_template` and `project_owned`.
- `update.js` classifier branches:
  - `framework_template` + consumer non-whitespace edit → `LOCAL_CUSTOMIZED`; emits `ownership-transitioned`; survives future framework restructure.
  - `framework_template` + no consumer edit → falls through to normal framework flow.
  - Capsule-removed `framework_template`/`project_owned` paths → `DELETE_SAFE` (preserved), not `DELETE_CONFLICT`.

### R-4 — Migration loader contract
- `framework-manifest.json#assets[]` no longer ships migrations (`EXCLUDE_RELATIVE_PREFIXES` extended with `migrations/`).
- `applied-migrations` gate is capsule-aware: reads `framework/releases/*/release.json#migrations[]` and treats listed migrations as expected, not stale.

### R-5 — New event surface
Three new event kinds via `scripts/warpos/lib/update-events.js`:
- `warpos.update.content-hash-mismatch` — `kind: lf_only | real_drift`. Wired into classifier.
- `warpos.update.operator-override-used` — wired into `preflight.js`.
- `warpos.update.ownership-transitioned` — wired into classifier.

### R-6/R-7 — Back-compat + docs
- `scripts/warpos/replay-bench.js` — single driver covering 9 invariants (content-hash selftest, capsule un-truncation, consumer un-truncation, back-compat, manifest-honesty, applied-migrations, three preflight CLI contract checks). **9/9 pass.**
- `scripts/warpos/test-hash-back-compat.js` — verifies `hashMatches` accepts simulated 12-char prefix across all 549 framework assets.
- `_docs/sprint/UPDATE_PIPELINE.md` — three-phase pipeline map + hash semantics + ownership state machine + event surface + opt-in recovery tools.
- `_docs/sprint/CRASH_RECOVERY.md` — new `/warp:update recovery` section + new event kinds + opt-in recovery tools.

## Checks

```
PASS AC-1.* content-hash --selftest  (22/22 assertions)
PASS AC-3.1 framework-manifest.json sha256 length=[64]
PASS AC-4.1 framework-installed.json installedHash length=[64]
PASS AC-4.2 back-compat: hashMatches accepts simulated 12-char prefix
PASS AC-2.2 manifest-honesty after refactor  (549/549 framework assets)
PASS AC-8.1 applied-migrations gate capsule-aware
PASS AC-5.1 preflight rejects unknown gate name (exit 2)
PASS AC-5.3 preflight rejects missing --override-reason (exit 2)
PASS AC-5.3 preflight rejects too-short --override-reason (exit 2)

replay-bench: 9/9 pass
```

## Issues opened / deferred

- **Pre-existing tracker drift:** `SP-20260513-002` and `SP-20260513-005` have registry status `retrospected` but their per-sprint `current.yaml` status is still `releasing`. Caused a conflict-check false-positive against SP-20260514-001's update.js touch. Worked around via `--allow-overlap`; the override is logged to decision-ledger. Recommend a separate cleanup sprint to flip those statuses.
- **Item 4 (release/apply pipeline separation):** explicitly deferred per Plan Contract recommended scope. The content-hash centralization closes the bug class regardless; pipeline separation is theoretically correct but practically slower and out of scope.

## Beta verdict at design time

ESCALATE (confidence 0.82), resolved by Alpha per no-pause directive:
1. Ownership-transition trigger → automatic on non-whitespace edit (Beta-recommended); decision-ledger entry written before classifier code.
2. `install.ps1` hash audit → already uses `Get-FileHash` full 64-char; no patch needed. Documented in PRD "Pre-execute audits".
3. AC-5.4 (JSONL injection on `--override-reason`) → added; structurally prevented by `JSON.stringify` in `writeEnvelope`.

## Release boundary

WarpOS canonical version bump to **0.7.0** requires explicit user approval (push + tag per CLAUDE.md autonomy table). Consumer updates from 0.6.1 → 0.7.0 in `aiweb` and `jobhunter-app` should be exercised in dry-run mode first; the transactional wrapper makes them rollback-safe.

## Learning candidates

- **Centralizing hash semantics is high-leverage.** Five callsites consolidated to one module collapsed a multi-hour Windows-CRLF debugging class to a single read-path AC. Future audit: any other "every caller reinvents this primitive" patterns in the codebase?
- **`--operator-override <name>` is a better pattern than per-feature override flags.** Single unified flag + structured audit. Recommend applying to other gate-style helpers (e.g. linters with `--allow-foo`/`--allow-bar` patterns).
- **`framework_template` ownership transition** is novel — first time the framework cedes ownership of a path to the consumer. Worth a learning entry on when to apply this pattern vs `project` owner outright.
- **Tracker drift between active-sprints registry and per-sprint current.yaml** is a recurring failure mode. Consider a `/sprint:doctor` or a check hook that flags status divergence at write time.

## Next

`/sprint:release --sprint SP-20260514-001` (will request user approval for the 0.7.0 tag).
