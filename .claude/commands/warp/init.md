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

Ask the user (unless invoked with `--source <url>`):
- "Which WarpOS repo should I use?" (default: `https://github.com/cygaco/WarpOS.git`; forks are OK)

Check if the repo exists nearby:
1. Look for `../WarpOS/` relative to the project root
2. If not found, clone it: `git clone <source-url> ../WarpOS`
3. If clone fails (no access), tell the user they need an invite and how to request one

### Step 3: Run the installer

```bash
# --interactive enables the 5-question interview (project name, pitch, main branch, WarpOS URL).
# Without --interactive, the installer uses detection defaults.
node ../WarpOS/scripts/warp-setup.js . --interactive
```

Pass `--yes` instead to accept all defaults (fully non-interactive — useful in CI).

This will:
- Check prerequisites (Node 18+, Git, Windows)
- Detect project's tech stack and main branch (via `git symbolic-ref`)
- Detect available quality tools (prettier, tsc, eslint) — only register hooks whose tool is present
- Create `.claude/` directory structure
- Copy agents, skills, hooks, reference docs
- Generate `manifest.json` (with project.name, git.mainBranch, warpos.source)
- Generate `paths.json` (37+ keys — the single source of truth)
- Create `store.json`, empty memory stores
- Append runtime exclusions to `.gitignore` (managed block, idempotent)
- Register hooks in `settings.json` (only hooks with available tools)
- Create `CLAUDE.md` and `AGENTS.md`

### Step 4: Verify

Run `/warp:health` to make sure everything is set up correctly.

### Step 5: Get started

Suggest the user run `/warp:tour` for a guided introduction, or jump straight in with:
- `/fix:fast` to try fixing a bug
- `/maps:all` to generate project maps
- "Help me write a product brief" to start filling in requirements
