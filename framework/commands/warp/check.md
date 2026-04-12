---
name: warp-check
description: Compare local state vs WarpOS repo — find stale, new, and missing items across all categories
---

Compare the current project state against the WarpOS repo at `../WarpOS/` and report what's stale, new, and what could be added.

## Steps

1. **Check WarpOS exists** — verify `../WarpOS/` is a git repo. If not, tell the user to run `/warp-init`.

2. **Diff each category** — for each category below, compare local vs WarpOS and classify items as:
   - **STALE**: exists in WarpOS but local version is newer (check file modification times, content diff)
   - **NEW**: exists locally but not in WarpOS (never synced)
   - **SYNCED**: exists in both, content matches
   - **ORPHAN**: exists in WarpOS but deleted locally

### Categories to check:

| Category             | Local Path                                               | WarpOS Path                         | What to compare                           |
| -------------------- | -------------------------------------------------------- | ----------------------------------- | ----------------------------------------- |
| **Hooks**            | `.claude/hooks/*.js`                                     | `.claude/hooks/*.js`                | Script content, settings.json hook config |
| **Skills** (shared)  | `.claude/commands/*.md`                                  | `.claude/commands/*.md`             | Skill files that are product-agnostic     |
| **Skills** (product) | `.claude/commands/*.md`                                  | `products/consumer-product/commands/*.md`   | Skill files that are consumer product-specific    |
| **CLAUDE.md**        | `CLAUDE.md`                                              | `products/consumer-product/CLAUDE.md`       | Full content diff                         |
| **Schemas**          | `src/lib/deus-mechanicus.ts`, `src/lib/warp-profiles.ts` | `schemas/`                          | Interface definitions only                |
| **AI Patterns**      | `src/lib/prompts.ts`                                     | `ai/patterns.md`                    | Prompt template summaries                 |
| **Product status**   | git log, constants.ts                                    | `products/consumer-product/status.md`       | Branch, steps, recent work                |
| **Hook config**      | `.claude/settings.json`                                  | `.claude/settings.json`             | Hook wiring                               |
| **Memory**           | `.claude/projects/*/memory/`                             | `products/consumer-product/memory-index.md` | Memory file index (not content)           |

3. **Surface opportunities** — scan the local project for things that COULD be added to WarpOS but aren't tracked yet:
   - **Environment configs**: `.env.example`, `tsconfig.json`, `next.config.*`, `package.json` scripts — could extract a project template
   - **CI/CD**: Any GitHub Actions, Vercel config, deployment scripts — could become shared infra patterns
   - **Test infrastructure**: Test harness patterns, QA suites, test data generators — could become shared testing framework
   - **UI component library**: `src/components/ui/` — could extract as shared component kit
   - **API patterns**: Rate limiting setup, auth middleware, error handling — could become shared API patterns
   - **Extension patterns**: `extension/` manifest, content scripts — could become shared extension template
   - **Documentation**: `docs/` folder, competitive analysis, BD docs — could become shared knowledge base
   - **Git hooks**: `.husky/`, pre-commit configs — could become shared git workflow
   - **Type definitions**: Shared types that aren't product-specific — could become shared type library
   - **Utility functions**: Product-agnostic utils (encryption, validation, formatting) — could become shared utils

4. **Report** — output a summary table:

```
## Sync Status

| Category | Synced | Stale | New | Orphan |
|----------|--------|-------|-----|--------|

## Items Needing Sync

| Item | Category | Status | Action |
|------|----------|--------|--------|

## Opportunities (could add to WarpOS)

| What | Source | Value | Effort |
|------|--------|-------|--------|
```

If the user says `/warp-check fix`, run `/warp-sync` to fix all stale/new items.
