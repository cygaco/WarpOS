---
description: Set up WarpOS in your project — clone the repo, run the installer, get started
---

# /warp:init — Install WarpOS

Set up WarpOS in the current project. This is the entry point for new users.

## Procedure

### Step 1: Check if already installed

Look for `.claude/manifest.json` in the project root.

If it exists and has `warpos.installed: true`:
- Report "WarpOS is already installed in this project."
- Suggest `/warp:health` to verify everything works.
- Stop.

### Step 2: Find or clone WarpOS

Check if the WarpOS repo exists nearby:
1. Look for `../WarpOS/` relative to the project root
2. If not found, clone it: `git clone https://github.com/cygaco/WarpOS.git ../WarpOS`
3. If clone fails (no access), tell the user they need an invite and how to request one

### Step 3: Run the installer

Run the WarpOS installer:
```bash
node ../WarpOS/scripts/warp-setup.js .
```

This will:
- Check prerequisites (Node 18+, Git, Windows)
- Detect your project's tech stack
- Create the `.claude/` directory structure
- Copy agents, skills, hooks, and reference docs
- Generate manifest.json and paths.json
- Create store.json for the build system
- Register hooks in settings.json
- Create CLAUDE.md and AGENTS.md

### Step 4: Verify

Run `/warp:health` to make sure everything is set up correctly.

### Step 5: Get started

Suggest the user run `/warp:tour` for a guided introduction, or jump straight in with:
- `/fix:fast` to try fixing a bug
- `/maps:all` to generate project maps
- "Help me write a product brief" to start filling in requirements
