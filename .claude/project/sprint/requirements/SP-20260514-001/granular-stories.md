# Granular Stories — Harden WarpOS update pipeline

**Sprint:** `SP-20260514-001`
**High-level stories:** `high-level-stories.md`

Each `S-N` produces roughly one ticket.

## S-1 — Implement `scripts/warpos/lib/content-hash.js`

**As** a maintainer
**I want** a single module exporting `contentHash(buf|path)` (LF-normalized for text), `rawHash(buf|path)` (raw for binary), `hashMatches(long, short)` (prefix-tolerant), and `isTextAsset(dest)` (extension allowlist `.md .js .json .yaml .yml .ts .toml .txt`)
**So that** every caller computes hashes one way and we close the bug class at the source.

AC: `AC-1.1`, `AC-1.2`, `AC-1.3`.
Linked: `H-1`, `H-4`, `R-1`.

## S-2 — Replace inline `sha256File` callsites with `content-hash`

**As** a maintainer
**I want** every inline `sha256File` / `createHash('sha256')` in update.js, release-build.js, manifest-honesty.js, generate-framework-manifest.js, manifest guards replaced by calls into `content-hash`
**So that** hash semantics live in exactly one place.

AC: `AC-2.1`, `AC-2.2`.
Linked: `H-1`, `H-4`, `R-1`.

## S-3 — Emit full 64-char sha256 in capsule's framework-manifest

**As** the release author
**I want** `scripts/generate-framework-manifest.js` to write the full 64-char sha256 for every asset (no truncation to 12)
**So that** capsule manifests are unambiguous and downstream comparison is byte-for-byte.

AC: `AC-3.1`, `AC-3.2`.
Linked: `H-4`, `R-1`, `R-6`.

## S-4 — Store full 64-char installedHash in `framework-installed.json`

**As** a consumer
**I want** `update.js#snapshotInstalled` to always persist the full 64-char hash after a successful apply, while still reading 0.6.x truncated hashes during apply for back-compat
**So that** once a consumer rides the 0.7.0 transition, every subsequent compare is unambiguous.

AC: `AC-4.1`, `AC-4.2`, `AC-4.3`.
Linked: `H-1`, `H-5`, `R-1`, `R-6`.

## S-5 — Add `--operator-override <gate>` + `--override-reason <text>` to preflight

**As** the framework maintainer
**I want** the four narrow override flags + `--skip-preflight` collapsed into a single repeatable `--operator-override <gate-name>` plus a required `--override-reason <text>` (sprint:design Step 7 boundary: preflight only, not Class C classifier conflicts)
**So that** override is always explicit, named, and reasoned.

AC: `AC-5.1`, `AC-5.2`, `AC-5.3`.
Linked: `H-2`, `R-2`.

## S-6 — Add `framework_template` owner + transition rule

**As** a consumer-project owner
**I want** `framework/paths.registry.json` to support a `framework_template` owner value, and the update classifier in `update.js` to transition a file from `framework_template` → `project_owned` once the consumer has materially edited it (non-whitespace diff vs the capsule's version)
**So that** files like `_requirements/00-canonical/*.md` that hold real project content survive framework restructures.

AC: `AC-6.1`, `AC-6.2`, `AC-6.3`.
Linked: `H-3`, `R-3`.

## S-7 — Stop emitting `migrations/` in `framework-manifest.json#assets`

**As** the release author
**I want** `migrations/` files filtered out of `framework-manifest.json#assets[]` going forward, with migrations only referenced via `release.json#migrations[]`
**So that** consumer apply doesn't endlessly copy migration files that the `applied-migrations` gate then flags stale.

AC: `AC-7.1`, `AC-7.2`.
Linked: `H-1`, `R-4`.

## S-8 — Update `applied-migrations` gate to be capsule-aware

**As** a consumer
**I want** the gate to fail closed only when a migration dir exists AND target ≤ installed AND the migration is NOT in the capsule's `release.json#migrations[]` list
**So that** the gate stops false-flagging migrations that were correctly applied.

AC: `AC-8.1`, `AC-8.2`.
Linked: `H-1`, `R-4`.

## S-9 — Emit three new update events

**As** the maintainer
**I want** `content-hash-mismatch` (with `kind: lf_only | real_drift`), `operator-override-used`, and `ownership-transitioned` events emitted to `paths.eventsFile` via `lib/logger.js`
**So that** every override, every LF-only mismatch, and every ownership transition is traceable in `events.jsonl`.

AC: `AC-9.1`, `AC-9.2`, `AC-9.3`.
Linked: `H-2`, `H-3`, `R-5`.

## S-10 — Cross-version replay tests + UPDATE_PIPELINE docs

**As** a maintainer
**I want** an automated replay test bench that covers (a) 0.6.x → 0.7.0 (legacy prefix sha → new full sha), (b) 0.7.0 → 0.7.0 noop, (c) 0.7.0 → 0.7.0 with edited `framework_template` files, AND new docs at `_docs/sprint/UPDATE_PIPELINE.md` plus updated `_docs/sprint/CRASH_RECOVERY.md`
**So that** the bug class can't silently regress and the boundary is documented.

AC: `AC-10.1`, `AC-10.2`, `AC-10.3`.
Linked: `H-1`, `H-5`, `R-6`, `R-7`.
