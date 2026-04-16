---
description: Update WarpOS from the latest version on GitHub
---

# /warp:sync — Update WarpOS

Pull the latest version of WarpOS from GitHub and update your project's framework files.

## Procedure

### Step 1: Find WarpOS repo

Check for `../WarpOS/` relative to the project root. If not found, tell the user to run `/warp:init` first.

### Step 2: Pull latest

```bash
git -C ../WarpOS pull --rebase origin main
```

Report the new commit hash and any changes.

### Step 3: Compare versions

Read `../WarpOS/version.json` and compare with `.claude/manifest.json` warpos.version.

If versions match: "You're up to date."
If WarpOS is newer: show what changed and offer to update.

### Step 4: Update framework files

If the user confirms, copy updated files:
- `.claude/agents/` — agent definitions (skip files the user has customized)
- `.claude/commands/` — skills (skip user-created skills)
- `.claude/project/reference/` — framework reference docs
- `scripts/hooks/` — hook implementations
- `CLAUDE.md` and `AGENTS.md` — only if user hasn't customized them

For each file that exists in both locations:
- If the user's version is different from WarpOS, ask: keep yours, take WarpOS version, or skip

### Step 5: Update version

Update `.claude/manifest.json` warpos.version to match the new version.

Report what was updated.
