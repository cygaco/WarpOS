# QA Plan — scan:warpos-layer-diff — product-vs-dev-tooling layer diff report

**Sprint:** `SP-20260531-003`
**PRD:** `.claude/project/sprint/requirements/SP-20260531-003/prd.md`

## Smoke checks

- [ ] `node scripts/checks/warpos-layer-diff.js` prints 3 sections (product / dev-tooling / summary) and exits 0.
- [ ] `node scripts/checks/warpos-layer-diff.js --json` emits valid JSON (`product_layer[]`, `dev_tooling_layer[]`, `summary{}`).
- [ ] `_guides/DEV_SETUP_GUIDE.md` shows under PRODUCT LAYER (post-A reality).

## Per-story QA

### S-1 — script
- [ ] AC-1.1 (3 sections + exit 0), AC-1.2 (--json valid), AC-1.3 (_guides in product layer), AC-1.4 (missing manifest → clear non-zero error)
- [ ] Read-only: confirm the script writes NO files (no mutation).

### S-2 — skill
- [ ] AC-2.1 (`/scan:warpos-layer-diff` registered, frontmatter valid, points at the script)

### S-3 — regen + verify
- [ ] AC-3.1 (script + skill shipped; ship-coverage + framework-purity green)

## Cross-cutting QA

- [ ] Linters / path-lint pass
- [ ] BOTH manifests regenerated (BC-02/BC-05 not red)
- [ ] `scan:full` Tier 3 stays green
- [ ] COPY matches `copy.md` (section headers); INPUTS none beyond CLI flags (see `inputs.md`)

## External service QA

- [ ] No ESDs (none_expected); no `secret: true` values in tracked files.

## Documentation scaling

`documentation_scale: s/m` cut — small read-only feature.
