---
name: warp-sync
description: Sync local state to WarpOS repo — update product card, schemas, patterns, commit and push
---

Sync the current product's state to the WarpOS repo at `../WarpOS/` (relative to the project root).

Steps:

1. **Check WarpOS exists** — verify `../WarpOS/` is a git repo. If not, tell the user to clone it.

2. **Update consumer product product card** — read the current CLAUDE.md, recent git log, and any changes to steps/fields/architecture. Update `../WarpOS/products/consumer-product.md` with:
   - Current sprint (from recent commits)
   - Stage changes
   - Any new product decisions
   - Updated date

3. **Sync schemas** — compare `src/lib/deus-mechanicus.ts` and `src/lib/warp-profiles.ts` with `../WarpOS/schemas/`. If the product interfaces have diverged, update the WarpOS canonical versions (interfaces only, no implementations).

4. **Sync patterns** — if any new AI orchestration patterns were added (new prompts in `src/lib/prompts.ts`), add them to `../WarpOS/ai/patterns.md`.

5. **Update WARP.md** — if there are new validated patterns, decisions, or product table changes, update `../WarpOS/WARP.md`.

6. **Diff and confirm** — show the user what changed in WarpOS before committing. Ask for confirmation.

7. **Commit and push** — commit all WarpOS changes with a descriptive message, then push to origin/main.

Report what was synced when done.
