<!-- requirement-format-legacy -->
# High-Level Stories — Migration bootstrap script — convert existing WarpOS installs to _warpos/ architecture

**Sprint:** `SP-20260522-004`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260522-004\prd.md`

> High-level stories use the `H-N` id convention enforced by
> `scripts/hooks/requirement-format-guard.js`.

## H-1 — As a maintainer migrating Jobzooka, I run `node scripts/warpos/manifest/bootstrap.js --root <jobzooka>` and get a clean _warpos/ zone with a fresh MANIFEST.json, rewritten settings.json hook paths, and a green validate.js --strict attestation.

**As** the user
**I want** As a maintainer migrating Jobzooka, I run `node scripts/warpos/manifest/bootstrap.js --root <jobzooka>` and get a clean _warpos/ zone with a fresh MANIFEST.json, rewritten settings.json hook paths, and a green validate.js --strict attestation.
**So that** Rolling _warpos/ out to real products (Jobzooka, DreamTeam) becomes a single command instead of a multi-day manual migration. The new ownership/regeneration/validation system gets exercised under real load — which surfaces edge cases that canonical-only testing can't. Sprint 5 candidates after this (install/release reliability batch, Sprint 6 polish) all build on the assumption that _warpos/ exists in products.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-1`.

## H-2 — As a maintainer running /warp:setup on a pre-_warpos install, I'm prompted to bootstrap automatically (with --apply or --dry-run) rather than discover the gap days later.

**As** the user
**I want** As a maintainer running /warp:setup on a pre-_warpos install, I'm prompted to bootstrap automatically (with --apply or --dry-run) rather than discover the gap days later.
**So that** Rolling _warpos/ out to real products (Jobzooka, DreamTeam) becomes a single command instead of a multi-day manual migration. The new ownership/regeneration/validation system gets exercised under real load — which surfaces edge cases that canonical-only testing can't. Sprint 5 candidates after this (install/release reliability batch, Sprint 6 polish) all build on the assumption that _warpos/ exists in products.

Linked granular stories: see `granular-stories.md`.
Linked requirements: `R-2`.
