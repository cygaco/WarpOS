---
name: warp-sync
description: Sync local state to WarpOS repo — product card, hooks, skills, schemas, CLAUDE.md, patterns
---

Sync the current product's state to the WarpOS repo at `../WarpOS/` (relative to the project root).

## Concurrency Safety

Multiple products may sync to WarpOS from different sessions. Follow this protocol:

1. **Pull before sync** — always `git -C ../WarpOS pull --rebase origin main` before making changes. This ensures you have the latest state from other products.
2. **Product-scoped files are safe** — anything under `products/{name}/` can't conflict with other products.
3. **Shared files need care** — `WARP.md`, `.claude/hooks/`, `.claude/commands/`, `schemas/`, `ai/patterns.md` could conflict if two products sync simultaneously.
4. **On push conflict** — if `git push` fails (another product pushed first), pull-rebase and retry once. If that also fails, create a branch `sync/{product}-{date}` and push there instead, then tell the user to merge manually.

## Steps

1. **Check WarpOS exists** — verify `../WarpOS/` is a git repo. If not, tell the user to run `/warp-init`.

2. **Pull latest** — `git -C ../WarpOS pull --rebase origin main` to get any changes from other products.

3. **Sync CLAUDE.md** — copy the project's `CLAUDE.md` to `../WarpOS/products/consumer-product/CLAUDE.md`. This is the canonical product context file.

4. **Sync hooks** — copy ALL `.claude/hooks/` scripts to `../WarpOS/.claude/hooks/`. Merge hook config from `.claude/settings.json` into `../WarpOS/.claude/settings.json`. Every hook goes — format, typecheck, lint, secret-guard, session-start, and any future ones.

5. **Sync skills** — copy ALL `.claude/commands/*.md` files. Product-specific skills (like `/qa`, `/step`, `/dm`) go into `../WarpOS/products/consumer-product/commands/`. Shared skills (like `/lens`, `/deploy`, `/status`, `/hooks`, `/handoff`, `/warp-init`, `/warp-sync`, `/warp-check`) go into `../WarpOS/.claude/commands/`.

6. **Sync schemas** — copy `src/lib/deus-mechanicus.ts` (interfaces only) and `src/lib/warp-profiles.ts` to `../WarpOS/schemas/`. Extract just the TypeScript interfaces, not implementations.

7. **Sync patterns** — if any new AI orchestration patterns exist (prompts in `src/lib/prompts.ts`), summarize them in `../WarpOS/ai/patterns.md`.

8. **Update product card** — update `../WarpOS/products/consumer-product/status.md` with:
   - Current branch and commit count
   - Recent commits (last 5)
   - Current step definitions from constants.ts
   - Updated timestamp

9. **Update WARP.md** — update the product table and any new validated patterns or decisions. When editing WARP.md, only touch your product's row in tables — don't rewrite other products' rows.

10. **Diff and confirm** — show the user what changed in WarpOS before committing.

11. **Commit and push** — commit all WarpOS changes with message: `sync(consumer-product): [summary]`. Push to origin/main. If push fails due to conflict, pull-rebase and retry. If still fails, push to `sync/consumer-product-YYYY-MM-DD` branch and tell the user.

12. **Surface opportunities** — scan for things that COULD be added to WarpOS but aren't tracked yet:

| What | Source | Value | Effort |
| ---- | ------ | ----- | ------ |

Check for:

- **Environment configs**: `.env.example`, `tsconfig.json`, `next.config.*` — project template potential
- **CI/CD**: GitHub Actions, Vercel config, deploy scripts — shared infra patterns
- **Test infrastructure**: Test harness, QA suites, test data generators — shared testing framework
- **UI components**: `src/components/ui/` — shared component kit
- **API patterns**: Rate limiting, auth middleware, error handling — shared API patterns
- **Extension patterns**: `extension/` manifest, content scripts — shared extension template
- **Documentation**: `docs/` folder, competitive analysis — shared knowledge base
- **Type definitions**: Product-agnostic types — shared type library
- **Utility functions**: Encryption, validation, formatting utils — shared utils

Only surface opportunities that don't already exist in WarpOS. Mark each with value (high/medium/low) and effort (high/medium/low).

Report what was synced and what opportunities were found.
