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

### Step 1: Write mode marker

Write `.claude/runtime/mode.json` so `smart-context.js` hook suppresses the team-mode / Beta-routing directive on subsequent prompts (solo = Alpha talks to user directly):

```js
const fs = require("fs");
const path = require("path");
const runtimeDir = path.join(".claude", "runtime");
fs.mkdirSync(runtimeDir, { recursive: true });
fs.writeFileSync(
  path.join(runtimeDir, "mode.json"),
  JSON.stringify({ mode: "solo", setAt: new Date().toISOString() }, null, 2) + "\n"
);
```

### Step 2: Set mode context

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
