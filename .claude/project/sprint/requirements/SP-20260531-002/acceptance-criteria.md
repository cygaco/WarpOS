<!-- requirement-format-legacy -->
# Acceptance Criteria — _guides product-layer shipping + _planning reorg + ship-boundary enforcer

**Sprint:** `SP-20260531-002`
**PRD:** `.claude/project/sprint/requirements/SP-20260531-002/prd.md`

> No `goal_verification` block in PC-20260531-0059 (framework refactor + enforcer sprint), so the executable-cited-test gate is inactive. The standing verification for the ship-boundary is the extended `scripts/checks/warpos-ship-coverage.js` (fail-closed) surfaced in `scan:full` Tier 3; pure file-org ACs are verified by recorded completion evidence.

## S-1 — Create _guides/ and move DEV_SETUP_GUIDE.md into it

- AC-1.1: Given `DEV_SETUP_GUIDE.md` at repo root, when S-1 completes, then `_guides/DEV_SETUP_GUIDE.md` exists and no copy remains at the repo root.
  verified_by: not_applicable — directory listing recorded in completion evidence
- AC-1.2: Given references to the old root path may exist, when S-1 completes, then a repo-wide grep for `DEV_SETUP_GUIDE.md` shows no stale root-path references (refactor-hygiene rule).
  verified_by: not_applicable — grep sweep recorded in completion evidence

## S-2 — Register _guides/ in the shipping manifest

- AC-2.1: Given `_guides/` exists, when S-2 completes, then `_guides/**` is enumerated as shipped in BOTH `.claude/framework-manifest.json` and `_warpos/MANIFEST.json`.
  verified_by: scripts/checks/warpos-ship-coverage.js (must-ship allowlist; exit 0 on compliant state)

## S-3 — Mark _planning/ as canonical-only / excluded from shipping

- AC-3.1: Given `_planning/` is tracked, when S-3 completes, then `_planning/**` is NOT present in the shipped framework manifest (excluded from the product/consumer layer).
  verified_by: scripts/checks/warpos-ship-coverage.js (must-NOT-ship denylist; exit non-zero if any _planning path is shipped)

## S-4 — Reorganize _planning/

- AC-4.1: Given `_planning/` mixes plans/reviews/ingest/sources at its root, when S-4 completes, then files are grouped into clear subfolders with no content lost and moves done via `git mv` (history preserved).
  verified_by: not_applicable — directory listing + `git status` recorded in completion evidence; internal-only, no shipped surface

## S-5 — Extend warpos-ship-coverage.js with the fail-closed allow/deny boundary

- AC-5.1: Given a compliant state (`_guides/**` shipped, `_planning/**` not shipped), when `node scripts/checks/warpos-ship-coverage.js` runs, then it exits 0.
  verified_by: scripts/checks/warpos-ship-coverage.js (exit 0 on compliant state)
- AC-5.2: Given an injected violation (a `_planning/**` path added to ship, OR `_guides/**` removed from ship), when the enforcer runs, then it exits non-zero with a clear message — fail-closed, not warn-only.
  verified_by: scripts/checks/warpos-ship-coverage.js (exit non-zero on injected violation; exercised in QA)
- AC-5.3: Given `scan:full`, when run, then the boundary assertions appear under Tier 3.
  verified_by: not_applicable — scan:full Tier 3 output inspected in QA

## S-6 — Regenerate BOTH manifests; verify green

- AC-6.1: Given the dir + script changes, when S-6 completes, then BOTH manifests are regenerated and `scan:warpos-ship-coverage`, `scan:framework-purity`, and `scan:warpos-manifest-coverage` are all green.
  verified_by: not_applicable — scan:full (Tier 3 green) recorded in completion evidence
