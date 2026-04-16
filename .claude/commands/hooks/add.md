---
description: Design and create a new hook from a description
user-invocable: true
---

# /hooks:add — Create a New Hook

Takes a description of what the hook should do and:

1. Parses the description to determine:
   - Which event (PreToolUse, PostToolUse, etc.)
   - Which matcher (Bash, Edit|Write, etc.)
   - What the script should do
2. **Check execution order** — Read `.claude/maps/hooks.jsonl` and find all hooks registered for the same event+matcher. Display the current chain with execution order. Show where the new hook will be inserted. If the new hook is fail-closed, warn: "This hook will block all subsequent hooks in the chain on failure." This is advisory — does not block creation.
3. Writes the hook script to `scripts/hooks/`
   - If the hook needs file path comparison or PROJECT resolution, import from shared utilities:
     ```js
     const { PROJECT, relPath } = require("./lib/paths");
     ```
   - NEVER copy-paste PROJECT/relPath patterns inline — always use `lib/paths.js`
4. Updates `.claude/settings.json` to wire it in
5. Tests it by triggering the relevant tool

## Usage

`/hooks:add block writes to .env files` → creates a PreToolUse hook on Edit|Write that rejects .env edits
