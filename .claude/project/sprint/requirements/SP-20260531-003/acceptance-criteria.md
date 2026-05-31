<!-- requirement-format-legacy -->
# Acceptance Criteria — scan:warpos-layer-diff — product-vs-dev-tooling layer diff report

**Sprint:** `SP-20260531-003`
**PRD:** `.claude/project/sprint/requirements/SP-20260531-003/prd.md`

> No `goal_verification` block (small read-only feature). Verification = running the scan and inspecting output; the report is informational (exit 0 on success), so there is no fail-gate test.

## S-1 — Build scripts/checks/warpos-layer-diff.js

- AC-1.1: Given the two manifests exist, when `node scripts/checks/warpos-layer-diff.js` runs, then it prints **three sections** — PRODUCT LAYER (owner=framework AND shipped), DEV-TOOLING LAYER (owner=framework AND NOT shipped), SUMMARY (counts) — and exits 0.
  verified_by: not_applicable — output inspected in QA (3 sections present, exit 0)
- AC-1.2: Given `--json`, when run, then it emits valid JSON with `product_layer[]`, `dev_tooling_layer[]`, `summary{}`.
  verified_by: not_applicable — `warpos-layer-diff.js --json` piped to a JSON parser in QA
- AC-1.3: Given `_guides/DEV_SETUP_GUIDE.md` (shipped + owner=framework from SP-20260531-002), when run, then it appears under **PRODUCT LAYER**, not dev-tooling — confirming the diff reflects post-A reality (the reason B branched off A).
  verified_by: not_applicable — grep the report for `_guides` under the product-layer section in QA
- AC-1.4: Given a missing/unreadable manifest, when run, then it fails clearly (non-zero, names the missing file) rather than emitting a misleading empty diff.
  verified_by: not_applicable — `--root` of an empty dir in QA → clear error

## S-2 — Register the scan:warpos-layer-diff skill

- AC-2.1: Given `.claude/commands/scan/warpos-layer-diff.md`, when the skill catalog is read, then `/scan:warpos-layer-diff` is listed and its body points at `scripts/checks/warpos-layer-diff.js`; frontmatter is valid.
  verified_by: not_applicable — skill catalog + frontmatter check in QA

## S-3 — Regenerate BOTH manifests; verify scan:full stays green

- AC-3.1: Given the new script + skill, when BOTH manifests are regenerated, then `scripts/checks/warpos-layer-diff.js` and the skill are **shipped** (framework-manifest), and `scan:warpos-ship-coverage` + `framework-purity` stay green.
  verified_by: scripts/checks/warpos-ship-coverage.js (exit 0) — new script under scripts/checks (ASSET_DIR) + skill under .claude/commands ship
