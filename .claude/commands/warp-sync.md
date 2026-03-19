---
name: warp-sync
description: Sync local state to WarpOS repo — product card, hooks, skills, schemas, CLAUDE.md, patterns
---

Sync the current product's state to the WarpOS repo at `../WarpOS/` (relative to the project root).

Steps:

1. **Check WarpOS exists** — verify `../WarpOS/` is a git repo. If not, tell the user to run `/warp-init`.

2. **Sync CLAUDE.md** — copy the project's `CLAUDE.md` to `../WarpOS/products/consumer-product/CLAUDE.md`. This is the canonical product context file.

3. **Sync hooks** — copy ALL `.claude/hooks/` scripts to `../WarpOS/.claude/hooks/`. Merge hook config from `.claude/settings.json` into `../WarpOS/.claude/settings.json`. Every hook goes — format, typecheck, lint, secret-guard, session-start, and any future ones.

4. **Sync skills** — copy ALL `.claude/commands/*.md` files to `../WarpOS/.claude/commands/`. Product-specific skills (like `/qa`, `/step`, `/dm`) go into `../WarpOS/products/consumer-product/commands/`. Shared skills (like `/lens`, `/deploy`, `/status`, `/hooks`, `/handoff`, `/warp-init`, `/warp-sync`) go into `../WarpOS/.claude/commands/`.

5. **Sync schemas** — copy `src/lib/deus-mechanicus.ts` (interfaces only) and `src/lib/warp-profiles.ts` to `../WarpOS/schemas/`. Extract just the TypeScript interfaces, not implementations.

6. **Sync patterns** — if any new AI orchestration patterns exist (prompts in `src/lib/prompts.ts`), summarize them in `../WarpOS/ai/patterns.md`.

7. **Update product card** — update `../WarpOS/products/consumer-product/status.md` with:
   - Current branch and commit count
   - Recent commits (last 5)
   - Current step definitions from constants.ts
   - Updated timestamp

8. **Update WARP.md** — update the product table and any new validated patterns or decisions.

9. **Diff and confirm** — show the user what changed in WarpOS before committing.

10. **Commit and push** — commit all WarpOS changes with a descriptive message, then push to origin/main.

11. **Surface opportunities** — after syncing, scan for things that COULD be added to WarpOS but aren't tracked yet. Report as a table:

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
