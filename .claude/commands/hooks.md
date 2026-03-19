---
name: hooks
description: Develop, audit, and test Claude Code hooks — analyze friction, design hooks, wire them up
---

Develop Claude Code hooks for this project. Hooks are lifecycle scripts that run automatically on events like file edits, tool calls, and session start.

## Context

Hook config lives in `.claude/settings.json` under the `hooks` key. Hook scripts live in `.claude/hooks/`. Hooks receive JSON on stdin with `session_id`, `cwd`, `hook_event_name`, `tool_name`, `tool_input`, `tool_use_id`.

Exit codes: 0 = success, 2 = blocking error (stderr shown to Claude), other = non-blocking warning.

Available events: `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `UserPromptSubmit`, `Stop`, `SessionStart`, `SessionEnd`, `SubagentStart`, `SubagentStop`, `PreCompact`, `Notification`, `PermissionRequest`, `Setup`.

Matchers: case-sensitive, pipe-delimited (e.g. `Edit|Write`). Match against tool names: `Bash`, `Edit`, `Write`, `Read`, `Glob`, `Grep`, `Agent`, etc.

## Modes

### `/hooks` (no args) — Audit

1. Read `.claude/settings.json` and list all active hooks
2. Read each hook script in `.claude/hooks/` and summarize what it does
3. Check for issues: missing scripts, wrong paths, slow hooks (anything doing full-project scans)
4. Report a table:

| Hook | Event | Matcher | Script | Status |
| ---- | ----- | ------- | ------ | ------ |

### `/hooks friction` — Analyze friction points

1. Look at recent git history for patterns that suggest missing hooks:
   - Type errors introduced and fixed later → need typecheck hook
   - Formatting commits → need format hook
   - Accidental secret commits → need secret protection
   - Build failures from lint issues → need lint hook
2. Check what's NOT covered by current hooks
3. Suggest new hooks with priority ranking

### `/hooks add <description>` — Design and create a new hook

1. Parse the description to determine:
   - Which event (PreToolUse, PostToolUse, etc.)
   - Which matcher (Bash, Edit|Write, etc.)
   - What the script should do
2. Write the hook script to `.claude/hooks/`
3. Update `.claude/settings.json` to wire it in
4. Test it by triggering the relevant tool

### `/hooks test` — Test all hooks

1. For each hook in settings.json:
   - Craft a synthetic JSON payload matching what Claude Code would send
   - Pipe it to the hook script
   - Report exit code and any output
2. Measure execution time per hook (flag anything >100ms)
3. Report results table

### `/hooks disable <name>` — Temporarily disable a hook

1. Comment it out in settings.json (move to a `_disabled_hooks` key)
2. Report what was disabled

### `/hooks sync` — Copy hooks to WarpOS

1. Copy all `.claude/hooks/` scripts to `../WarpOS/.claude/hooks/`
2. Merge hook config from `.claude/settings.json` into `../WarpOS/.claude/settings.json`
3. Commit and push WarpOS with a descriptive message
4. Report what was synced

This is the same sync that `/warp-sync` does for hooks — use either command.
