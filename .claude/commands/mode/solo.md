---
description: Enter solo mode — just Alpha and the user, no agent team
---

# /mode:solo — Solo Mode

Enter solo mode. No agent team — just Alpha working directly with the user. Simple back-and-forth iteration.

## When to use

- Quick one-off tasks
- Debugging, exploration, research
- Tasks that don't need a builder/gauntlet cycle
- When you explicitly want to work without agents

## Procedure

### Step 1: Set mode context

Acknowledge the mode switch:

```
MODE: solo
Team: none — just Alpha + user
Orchestrator: none
Build capability: Alpha builds directly (no gauntlet)
```

### Step 2: Update heartbeat (if store exists)

If `.claude/agents/store.json` exists and has a heartbeat, update:
```json
{ "agent": "alpha", "workstream": "solo" }
```

If no store exists, skip this step.

### Step 3: Confirm

Report: "Solo mode active. Working directly — no agents, no gauntlet. What do you need?"
