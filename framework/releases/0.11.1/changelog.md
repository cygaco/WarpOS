# WarpOS 0.11.1 — 2026-05-30

A **version-coherence + release-integrity hardening** release. No product-facing
feature changes; it makes the framework's own version/schema bookkeeping honest and
adds an enforcer so it stays that way.

## What's new since 0.11.0

- **`/scan:version-coherence` + `scripts/checks/version-coherence.js`** — a single
  enforcer that catches version/schema-label drift no gate caught before: (a) product
  version agreeing across **every** manifest (including `.claude/manifest.json#warpos.version`
  and `install.ps1`, which `/scan:warpos-version-quorum` does not check), (b) every schema
  family's authoritative declarations agreeing, (c) a broad sweep flagging any
  `warpos/<family>/vN` family carrying more than one version label. Wired into
  `/scan:full` (Tier 3) **and** the release gates (RED blocks a release).
- **Release engine hardened** (`scripts/warpos/release-canonical.js`): the version bump
  now also updates `.claude/manifest.json#warpos.version` and `install.ps1`'s version
  constant, and the release commit now stages the **full** release set (previously a
  narrow `git add` left those + regen artifacts uncommitted, producing version-incoherent
  release commits).
- **install.ps1 + snapshot-installed.js** now **derive** `pathRegistryVersion` from the
  source of truth instead of hardcoding it, so it can't drift from the schema again.

## Fixes

- **Path-registry schema label corrected v4 → v5.** `paths.json` already carried v5
  *content* (`_requirements/` + `_docs/` + the v5 root keys) but a stale **v4 label**,
  because `framework/paths.registry.json#version` was never bumped when the v5 content
  landed. Bumped the registry to 5; `paths/build.js` now stamps v5 consistently across
  `paths.json`, the validator (`schemas/paths.schema.json`), and `framework-installed.json`.
- **`framework-manifest/v1` stale fallback → v2** in `warp-setup.js`.
- **Product version aligned to 0.11.1** across `version.json`, `.claude/manifest.json`,
  `framework-manifest.json`, `framework-installed.json`, and `install.ps1`.

## Breaking changes

- None. The v4→v5 label correction matches the *existing* v5 content — no path values
  change, no migration is required.

## Schema changes

- `pathRegistrySchema` label corrected to `warpos/paths/v5` (reflects existing content;
  not a structural change). `framework-manifest` stays `v2`.

## Migrations

- None.
