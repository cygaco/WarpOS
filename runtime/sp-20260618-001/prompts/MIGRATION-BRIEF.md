# SP-20260618-001 — Templates-Migration Brief (E-CONTENT-DELIVERY-001)

## What this sprint does
Migrate the WarpOS framework templates from their current home `framework/templates/`
(9 subdirs, 108 files) to the ownership-taxonomy end-state home `_warpos/templates/`,
build `_warpos/BASELINE/`, extend seed-zones with provenance, and confirm install
update-parity — so the ownership manifest (`_warpos/MANIFEST.json`) and the shipping
path converge, killing the recurring "downstream ships a box with missing parts" class.

## Ground-truth state (verified 2026-06-18, NOT inherited from a 12-day-stale tracker)
- **DoD#1 — OPEN (the migration):** `_warpos/templates/` and `_warpos/BASELINE/` are
  confirmed ABSENT. `_warpos/` currently holds only `MANIFEST.json` + `settings/`.
  `framework/templates/` exists with exactly 9 dirs: app-scaffold (45 files), sprint (30),
  canonical (12), lastmile (8), product-clone (4), portfolio (3), product-bootstrap (3),
  product-import (2), report (1). Total 108 files.
- **DoD#2 — DONE & GREEN (do NOT rebuild):** `scripts/checks/warpos-ship-coverage.js`
  runs exit 0 over 1689 paths, 0 hard_gaps / 0 info_gaps / 0 boundary_violations,
  0 dangling seeded_from, KNOWN_DANGLING_SET empty (zero-tolerance).
- **DoD#3 — CAPABILITY OPEN:** Fresh install must seed `_requirements/` + `_docs/` with a
  provenance note, not bare `.gitkeep`. NOTE name-collision: `scripts/warpos/views/populate-source.js`
  EXISTS but mirrors framework VIEW source (.claude/commands/agents/reference) into a
  product `_warpos/` — it is NOT the seed-zone-provenance capability. The epic scope says
  EXTEND it (or add a sibling) for seed-zones. File exists; capability does not.
- **DoD#4 — ~DONE (confirm-only):** `scripts/warpos/test-install-matrix.js` scenario 2
  (existing_install_upgrade) calls `scripts/checks/warpos-structure-parity.js` post-update,
  which is the single-source `REQUIRED_DIRS` list (24 skeleton dirs incl. `_requirements/*`
  and `_docs`). The parity GUARANTEE is enforced; a literal REQUIRED_DIR loop inside the
  matrix is not present. Verify/tighten only unless a gap shows.

## The load-bearing risk (binding safety contract)
`_warpos/` is allowlisted KNOWN_NOT_SHIPPED in `warpos-ship-coverage.js` (line 77:
"product-generated source mirror, not shipped from canonical"). A NAIVE `git mv` of
`framework/templates` → `_warpos/templates` would make the migrated templates fall under
that not-shipped prefix and STOP SHIPPING — re-creating the exact "downstream ships 0
templates" class this epic exists to kill.

The migration MUST be ONE ATOMIC CHANGE:
1. Carve `_warpos/templates/` explicitly OUT of the `_warpos/` not-shipped prefix in
   ship-coverage.js (so it stays a shipped asset).
2. Repoint `ASSET_DIRS` + the `{ src: "framework/templates", kind: "template" }` entry in
   `scripts/generate-framework-manifest.js` (lines ~165, ~277) to the new home.
3. Flip the two pre-wired `seeded_from` points in `scripts/warpos/manifest/build.js`
   (lines ~198, ~216 — both annotated "flip to _warpos/templates once built").
4. Add any resulting dangle to KNOWN_DANGLING_SET as an EXACT string (not a prefix) with
   a reason tying it to SP-20260618-001.
5. Update the 9 regression tests that HARDCODE `framework/templates/...` paths.
6. Update the live `.claude` wirings (7 commands, 1 agent) + the 2 paths registry files
   (`framework/paths.registry.json` is the SOURCE — edit there, then regen; never the
   generated `.claude/paths.json`).
7. Regen BOTH manifests (the LAST step before commit, or BC-02/BC-05 + ship-coverage red).
8. Run `warpos-ship-coverage.js` AFTER repoint and BEFORE deleting the old
   `framework/templates` copy. Any new hard_gap / info_gap / dangle / boundary_violation =
   BLOCKING fix-cycle; do NOT delete the old copy until GREEN.
9. Run `test-install-matrix.js` scenario 2 to confirm structure-parity post-update.

## Composition + sequence
- Risk: HIGH (shipping-layer, downstream blast radius, can silently re-break the bundle).
- 3 backend units, backend-first, U1 must land before U2:
  - U1 — templates-migration (the atomic cutover above).
  - U2 — provenance-seeding (extend the seed path for `_requirements/` + `_docs/`).
  - U3 — update-parity confirm/tighten.
- No UI / frontend / security-hardening / copy units.
