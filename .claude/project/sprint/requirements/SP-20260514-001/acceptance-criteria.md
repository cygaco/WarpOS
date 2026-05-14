# Acceptance Criteria — Harden WarpOS update pipeline

**Sprint:** `SP-20260514-001`
**PRD:** `prd.md`

Each AC is testable. Tickets link back here via `--linked-ac`.

## S-1 — content-hash module

- **AC-1.1**: Given a text file (allowlisted extension) with CRLF line endings, when `contentHash(path)` is called, then it returns the same sha256 as the same file with LF line endings (LF-normalized before hashing).
- **AC-1.2**: Given a binary file (`.png`, `.zip`, etc.), when `rawHash(path)` is called, then it returns the unmodified sha256 of the raw bytes.
- **AC-1.3**: Given `hashMatches(full64char, prefix12char)`, when the prefix is the first 12 chars of the long hash, then it returns `true`; when not, `false`. When both are full 64-char, falls through to byte-equal.

## S-2 — Replace inline sha256 callers

- **AC-2.1**: Given a grep across the repo for `createHash\(['\"]sha256['\"]\)` or `sha256File`, when the sprint is done, then matches outside `scripts/warpos/lib/content-hash.js` resolve to fixtures, tests, or one-shot helpers (no production callsite computes sha256 inline).
- **AC-2.2**: Given each prior callsite (update.js, release-build.js, manifest-honesty.js, generate-framework-manifest.js), when re-run end-to-end, then output is byte-identical to a snapshot captured before the refactor (modulo the explicit un-truncation in S-3).

## S-3 — Capsule manifest full sha256

- **AC-3.1**: Given a fresh release built via `scripts/warpos/release-canonical.js`, when its `framework-manifest.json` is inspected, then every `assets[].sha256` is 64 hex chars.
- **AC-3.2**: Given a 0.6.x capsule with 12-char prefix sha256, when `update.js` reads it, then `hashMatches` accepts it for back-compat (until consumer rides 0.7.0 transition).

## S-4 — Consumer installedHash full sha256

- **AC-4.1**: Given a successful `/warp:update --apply` to 0.7.0+, when `framework-installed.json` is inspected, then every `installedHash` is 64 hex chars.
- **AC-4.2**: Given a 0.6.x consumer with prefix hashes already in `framework-installed.json`, when `/warp:update --apply` runs, then the manifest-honesty gate passes (back-compat read) and the post-apply write upgrades all hashes to full 64-char.
- **AC-4.3**: Given a consumer that has just upgraded to 0.7.0 once, when `/warp:update` is re-run, then no `content-hash-mismatch` event with `kind: lf_only` fires (steady state).

## S-5 — `--operator-override` flag

- **AC-5.1**: Given `preflight.js` invoked without `--operator-override` and with at least one red gate, when the command runs, then it exits non-zero and prints which gate failed.
- **AC-5.2**: Given `--operator-override <gate-name> --override-reason "<text>"`, when that single gate is the only red one, then preflight continues, and an `operator-override-used` event is appended to `paths.eventsFile` with `{gate, reason, operator, ts, txId}`.
- **AC-5.3**: Given `--operator-override` invoked WITHOUT `--override-reason`, when the command runs, then it exits non-zero with COPY C-2.
- **AC-5.4**: Given `--override-reason "<text with CR/LF/control chars>"` (Beta-flagged 2026-05-14: JSONL injection surface), when the audit event is written to `paths.eventsFile`, then CR / LF / backslash / quote are escaped per JSON spec; the resulting line parses cleanly via `JSON.parse`.

## S-6 — Ownership transition

- **AC-6.1**: Given `framework/paths.registry.json`, when read, then it accepts owner values `framework_owned`, `framework_template`, `project_owned`.
- **AC-6.2**: Given a file declared `framework_template`, when the consumer has made a non-whitespace edit relative to the capsule's version, then `update.js`'s classifier emits `ownership-transitioned` and treats the file as `project_owned` (no DELETE_CONFLICT on next framework restructure that drops the template).
- **AC-6.3**: Given a file declared `framework_template`, when the consumer has NOT edited it (or only whitespace diffs), then the classifier still treats it as `framework_template` (template stays template).
- **AC-6.4**: Given the ownership-transition trigger rule (decided 2026-05-14: **automatic on any non-whitespace edit**), when T-073 starts, then the rule is logged to the decisions ledger before any classifier code is written (so the trigger choice has a durable audit record).

## S-7 — Stop shipping migrations as assets

- **AC-7.1**: Given a 0.7.0+ capsule, when its `framework-manifest.json` is inspected, then `assets[]` contains zero entries with paths under `framework/migrations/`.
- **AC-7.2**: Given the same capsule, when its `release.json#migrations[]` is inspected, then every applicable migration is listed there.

## S-8 — `applied-migrations` capsule-aware

- **AC-8.1**: Given a consumer with `framework/migrations/<m>` on disk AND `<m>` listed in capsule's `release.json#migrations[]`, when `applied-migrations` gate runs, then it passes.
- **AC-8.2**: Given a consumer with `framework/migrations/<old>` on disk, target ≤ installed, AND `<old>` NOT in capsule list, then the gate fails closed with COPY C-5.

## S-9 — New update events

- **AC-9.1**: Given two text files that differ only in line endings, when `update.js` compares them, then a `content-hash-mismatch` event fires with `kind: lf_only` (informational; does not block).
- **AC-9.2**: Given an operator-override invocation, when preflight passes the named gate by override, then a single `operator-override-used` event is written (one per override per run).
- **AC-9.3**: Given a `framework_template` file the classifier promotes to `project_owned`, when apply runs, then an `ownership-transitioned` event is emitted with `{path, from: framework_template, to: project_owned, reason, ts}`.

## S-10 — Replay tests + docs

- **AC-10.1**: Given a fresh consumer working tree, when the replay test bench runs `0.6.x → 0.7.0 → 0.7.0 → 0.7.0 (with edited framework_template)`, then all three transitions complete with `exitCode === 0` and no Class C conflicts.
- **AC-10.2**: Given `_docs/sprint/UPDATE_PIPELINE.md`, when read, then it describes the three pipeline phases (preflight, transactional apply, postflight) and points to the override audit log, the ownership state machine, and the back-compat read path.
- **AC-10.3**: Given `_docs/sprint/CRASH_RECOVERY.md`, when read, then it references the new event kinds and how to use `lf-normalize-target.js` / `prune-installed-assets.js` as opt-in recovery (not load-bearing).
