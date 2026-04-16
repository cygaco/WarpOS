---
description: Copy hooks to WarpOS repo
user-invocable: true
---

# /hooks:sync — Sync Hooks to WarpOS

1. Copy all `scripts/hooks/` scripts to `../WarpOS/scripts/hooks/`
2. Merge hook config from `.claude/settings.json` into `../WarpOS/.claude/settings.json`
3. Commit and push WarpOS with a descriptive message
4. Report what was synced

This is the same sync that `/warp-sync` does for hooks — use either command.
