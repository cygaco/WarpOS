---
description: Hook wiring diagram — events, matchers, scripts, execution order
---

# /maps:hooks — Hook Wiring Map

Visualize how hooks are wired: which events trigger which scripts.

## Input

`$ARGUMENTS` — optional flags:
- `--refresh` — re-scan settings.json + scripts/hooks/, rebuild `.claude/maps/hooks.jsonl` + `.claude/maps/hooks.md`
- `--terminal` — render as ASCII art (default)
- `--file` — write to `.claude/maps/hooks.txt`
- `--html` — write styled HTML to `.claude/maps/hooks.html`

## Procedure

### Step 1: Read sources

- `.claude/settings.json` — hook registrations (event, matcher, script path)
- `scripts/hooks/*.js` — actual script files on disk

### Step 2: Refresh (if `--refresh`)

- Every hook in settings.json has a script on disk
- No orphan scripts (on disk but not wired)
- Event names are valid Claude Code events
- Matcher patterns are syntactically correct
- Generate `.claude/maps/hooks.jsonl` + `.claude/maps/hooks.md`

### Step 3: Build graph

- **Event nodes**: UserPromptSubmit, PreToolUse, PostToolUse, etc.
- **Hook nodes**: each registered hook (script name)
- **Edges**: event → hook (with matcher label)
- **Orphans**: scripts not wired to any event
- **Execution order**: hooks within same event shown in registration order

### Step 4: Clear staleness

After writing output, clear the `hooks` entry from `.claude/maps/.stale.json` if it exists:
1. Read `.claude/maps/.stale.json`
2. Delete the `hooks` key
3. Write back (or delete file if empty)

### Step 5: Render

Example terminal:
```
UserPromptSubmit
  ├─▶ prompt-enhancer.js
  └─▶ context-enhancer.js

PreToolUse [Bash]
  └─▶ gate-check.js

PostToolUse [Edit,Write]
  ├─▶ edit-watcher.js
  └─▶ systems-sync.js
```
