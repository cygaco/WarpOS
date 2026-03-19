---
name: warp-init
description: Clone or refresh the WarpOS repo and verify the local link for /warp-sync
---

Initialize the WarpOS shared context repo locally so `/warp-sync` can push to it.

Steps:

1. **Check if already cloned** — look for `../WarpOS/` relative to the project root.
   - If it exists and is a git repo, do a `git pull` to refresh it.
   - If it exists but is NOT a git repo, warn the user and stop.
   - If it doesn't exist, clone `https://github.com/cygaco/WarpOS.git` into `../WarpOS/`.

2. **Verify repo health** — confirm the remote is `cygaco/WarpOS`, show current branch and latest commit.

3. **Check directory structure** — verify or create the expected WarpOS layout:
   ```
   WarpOS/
   ├── WARP.md              # Cross-product context, validated patterns, decisions
   ├── products/            # Product cards (one per Warp product)
   │   └── consumer-product.md
   ├── schemas/             # Canonical shared interfaces (DM manifest, Warp profiles)
   └── ai/                  # AI orchestration patterns, prompt templates
       └── patterns.md
   ```
   Create any missing directories or placeholder files.

4. **Report** — show the user what's at `../WarpOS/` and confirm `/warp-sync` is ready to use.
