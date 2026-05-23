# Upgrading to WarpOS 0.9.0

## TL;DR

This is the **install pipeline reliability checkpoint** release. Every install/update path now has snapshot rollback, dry-run gating, per-file status reporting, idempotency, versioned migrations, userModified tracking, manifest-staleness refusal at release time, and a CI matrix that catches regressions in 18 seconds.

No breaking changes for downstream products. No migrations. Apply via standard `/warp:update --to 0.9.0`.

## Per-file pipeline changes

Two new fields appear in `.claude/framework-installed.json` after the upgrade:

- **`migrationsApplied: string[]`** — list of migration ids that have successfully run against this install. Future `/warp:update` runs skip already-applied ids (no more re-running successful migrations after a mid-chain failure on retry).
- **`userModified: string[]`** — list of paths the classifier flagged as operator-modified (MERGE_CONFLICT or LOCAL_CUSTOMIZED). Monotonic across runs.

These are additive. Pre-existing installs upgrade cleanly — the fields populate on first apply after 0.9.0 and grow monotonically from there.

## New CLI flag

`/warp:update --verbose-files` (and the underlying `scripts/warpos/update.js --verbose-files`) — print every per-file entry including `unchanged` files. Without the flag, output is truncated to the top 20 "interesting" (non-unchanged) entries.

## Release-build behavior change

`scripts/warpos/release-build.js <version>` now refuses to snapshot a stale `framework-manifest.json`. If you maintain canonical and forget to regenerate the manifest before building a capsule, the build will exit 2 with:

```
release-build refuses to snapshot a stale framework-manifest.json:
  framework-manifest.json is stale — run: node scripts/generate-framework-manifest.js
Remediation: run `node scripts/generate-framework-manifest.js` then re-run release-build.
Bypass (emergencies only): re-run with --skip-manifest-check.
```

This closes the post-`warp:promote` ghost-files class at the source: shipping a capsule with a stale manifest no longer compiles.

## Settings.json regeneration (canonical-only)

Canonical-side `.claude/settings.json` is now compiled from `_warpos/settings/defaults.json + .claude/settings.local.json` via `scripts/warpos/settings/compile.js`. Downstream products (whose installs don't ship `_warpos/`) continue to use the hand-maintained `.claude/settings.json` path — the layered model is canonical-only today. The compile.js path is wired into `/warp:setup` + `/warp:update` for products that DO have `_warpos/` (typically the canonical-maintainer side).

## Manifest absence handling

Four scripts that previously crashed on missing `.claude/manifest.json` now exit gracefully with actionable error messages pointing at `/warp:setup`:

- `scripts/agents/cli.js test --all`
- `scripts/manifest/cli.js`
- `scripts/dispatch/manifest-patch.js`
- `scripts/delta-canonical-dispatch-smoke.js`

`scripts/dispatch/manifest-patch.js#readManifest` now throws typed errors (`MANIFEST_MISSING` / `MANIFEST_UNREADABLE` / `MANIFEST_INVALID`) so callers can react programmatically.

## Recommended post-upgrade actions

1. Run the install matrix once after upgrade to verify your environment:
   ```
   node scripts/warpos/test-install-matrix.js
   ```
   Expected: 5/5 pass in ~20 seconds.

2. If you maintain canonical and have local edits to framework files, the upgrade will populate `framework-installed.json#userModified` with their paths. No action needed — the file persists across future updates.

## Rollback

If anything goes wrong, the standard 0.8+ rollback path still applies:
```
node scripts/warpos/update.js --rollback <txId>
```
where `<txId>` is in the apply report.
