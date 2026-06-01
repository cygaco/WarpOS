# WarpOS 0.13.1 — 2026-06-01

## What's new since 0.13.0

- **Release-orchestrator fix (RI-003)** — `scripts/warpos/release-canonical.js` now regenerates the framework-manifest, the installed snapshot, and `_warpos/MANIFEST.json` immediately after the capsule build (stage 6), in dependency order, so the stage-7 release gates no longer red on manifest staleness (`BC-02` / `BC-05` / `framework_manifest`). Previously an in-canonical `/warp:release` required a manual 3-step regen + `--resume-from 7` on every run (hit during the 0.13.0 release); it is now a single clean command. The fix deliberately does NOT re-run `release-build` (that would re-snapshot the manifest into the capsule and re-stale it — the capsule self-reference loop).

## Breaking changes

- None.

## Schema changes

- None.

## Migrations

- None.

## Pinned commit

Captured at release-build time (recorded in release.json#commit after scripts/warpos/release-build.js runs).
