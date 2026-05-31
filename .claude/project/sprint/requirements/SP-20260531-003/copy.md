<!-- requirement-format-legacy -->
# COPY Requirements — scan:warpos-layer-diff — product-vs-dev-tooling layer diff report

**Sprint:** `SP-20260531-003`
**PRD:** `.claude/project/sprint/requirements/SP-20260531-003/prd.md`

> The only user-visible text is the report's section headers + summary line. Keep them plain-language so the split is obvious without docs.

## C-1 — report section headers (linked story `S-1`)

**Context:** Printed by `scripts/checks/warpos-layer-diff.js`.
**Text:**

> PRODUCT LAYER — framework-owned paths that SHIP to consumer products (N)
> DEV-TOOLING LAYER — framework-owned paths that do NOT ship (framework-internal) (M)
> SUMMARY — product: N · dev-tooling: M · total framework-owned: N+M

**Notes:** Plain language over jargon ("ship to consumer products" not "ASSET_DIRS-enumerated"). Exact wording may be tuned; the product/dev-tooling framing + counts are binding.
