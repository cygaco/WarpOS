# WarpOS canonical-side transaction — 2026-05-01

## Repo role
Canonical WarpOS framework repo.

## Branch
`fix/warpos-registry-update-release-coherence` (from main @ 25b1df8)

## Goal
Reconcile customizations promoted from product repo `jobhunter-app`, repair
architecture drift across paths/hooks/installer/update/release, cut release
0.1.2, then update the product repo from the new capsule.

## Phases
1. Run promote.js apply from jobhunter-app (4 MIGRATION_CANDIDATE files only).
2. Path-registry-driven installer (warp-setup.js).
3. Hook registry + scripts/hooks/build.js.
4. Strip stale `docs/05-features` references (use `paths.specsRoot`).
5. Path guard/lint strictness (cover JSON/TS/TSX/sh/ps1/yml).
6. Update engine: source-root, migration runner, post-update checks,
   transaction/rollback, MERGE_SAFE honesty.
7. Release capsule 0.1.2 + checksums + manifest sync.
8. /warp:sync becomes deprecated alias only.
9. Release-gates honesty (gate 3 reference_integrity).
10. Validation.

## Source repo
`C:/Users/Vladislav Zhirnov/Desktop/Claude/Projects/jobhunter-app`
(branch `warpos/update-from-canonical-release` @ c322a99)
