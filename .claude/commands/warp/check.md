---
description: Compare your WarpOS installation against the latest version — find stale, new, and missing items
---

# /warp:check — Check WarpOS Status

Compare your project's WarpOS installation against the latest version in the WarpOS repo.

## Procedure

### Step 1: Find WarpOS repo

Check for `../WarpOS/` relative to the project root. If not found, tell the user to run `/warp:init` first.

### Step 2: Compare files

For each category, compare your project's files against WarpOS:

| Category | Your project | WarpOS repo | What to compare |
|----------|-------------|-------------|-----------------|
| Agents | `.claude/agents/` | `../WarpOS/.claude/agents/` | File list + content diff |
| Skills | `.claude/commands/` | `../WarpOS/.claude/commands/` | File list + content diff |
| Hooks | `scripts/hooks/` | `../WarpOS/scripts/hooks/` | File list + content diff |
| Reference | `.claude/project/reference/` | `../WarpOS/.claude/project/reference/` | File list |
| CLAUDE.md | `./CLAUDE.md` | `../WarpOS/CLAUDE.md` | Content diff |
| AGENTS.md | `./AGENTS.md` | `../WarpOS/AGENTS.md` | Content diff |

### Step 3: Classify each file

For each file, classify as:
- **SYNCED** — identical in both locations
- **STALE** — WarpOS has a newer version
- **CUSTOMIZED** — your version differs (you changed it)
- **NEW** — exists in WarpOS but not in your project (added since install)
- **LOCAL** — exists in your project but not in WarpOS (you created it)

### Step 4: Report

```
WarpOS Check
════════════

  Agents:    12 synced, 2 stale, 0 new
  Skills:    58 synced, 3 stale, 5 local
  Hooks:     25 synced, 0 stale
  Reference: 5 synced
  Docs:      CLAUDE.md customized, AGENTS.md synced

  Recommendations:
  - Run /warp:sync to update 5 stale files
  - 5 local skills found (yours to keep)
```
