---
description: Load and display the last handoff or checkpoint — use after /clear or cold start
user-invocable: true
---

# /session:resume — Reload Context

Load the most recent handoff or checkpoint and display it. Use when:
- You just ran `/clear` and lost context
- You started a new session and the auto-load didn't fire
- You want to see what the previous session was doing

## Procedure

### Step 1: Find the best context source

Check in priority order (stop at first hit):

1. `.claude/runtime/handoff.md` — most recent full handoff
2. `.claude/runtime/.session-checkpoint.json` — periodic checkpoint
3. `.claude/runtime/handoffs/` — most recent timestamped file
4. `.claude/.session-prompts.log.prev` — archived prompt log from last session

### Step 2: Display it

Show the contents with a header:

```
Loaded from: {source} ({age})
──────────────────────────────────
{content}
```

### Step 3: Summarize

After displaying, give a 2-3 line summary of what was happening and what the likely next steps are.

That's it — read, display, summarize. No writes.
