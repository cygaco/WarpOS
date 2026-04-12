---
description: Enter adhoc team mode — Alpha + Beta + Gamma for collaborative feature development
---

# /mode:adhoc — Adhoc Team Mode

Enter adhoc team mode. Creates an agent team with Alpha (lead) + Beta (judgment) + Gamma (adhoc orchestrator). This is the default mode for development.

## When to use

- Building or iterating on individual features
- After a oneshot run, for fixing and polishing
- Any development work that benefits from a build/gauntlet cycle
- The default mode — if unsure, use adhoc

## Procedure

### Step 1: Verify team readiness

1. Confirm Beta agent file exists: `.claude/agents/alex/beta.md`
2. Confirm Gamma agent file exists: `.claude/agents/alex/gamma.md`
3. Confirm adhoc protocol exists: `.claude/agents/.system/adhoc/protocol.md`

If any are missing, warn and offer to continue in solo mode instead.

### Step 2: Create agent team

Create a team and spawn two teammates with specific names:

```
Create an agent team for adhoc feature development. Spawn two teammates:
- Name: "Beta (β)", agent type: beta
- Name: "Gamma (γ)", agent type: gamma
```

**Layer 1 (this team):** Alpha (lead) + Beta (judgment) + Gamma (orchestrator)
**Layer 2 (Gamma's subagents):** Builder, Evaluator, Security, Compliance, QA, Fix Agent, Auditor — spawned by Gamma as needed

### Step 3: Set mode context

Acknowledge the mode switch:

```
MODE: adhoc
Team: α (lead) + β (teammate) + γ (teammate)
Layer 1: Agent team — shared task list, direct messaging
Layer 2: Gamma spawns builder/evaluator/security subagents as needed
Build cycle: dispatch → gauntlet (eval + security + compliance + QA) → fix → report
```

### Step 4: Update heartbeat (if store exists)

If `.claude/agents/.system/oneshot/store.json` exists and has a heartbeat, update:
```json
{ "agent": "alpha", "workstream": "adhoc" }
```

### Step 5: Confirm

Report: "Adhoc team active. Alpha (lead) + Beta (β) + Gamma (γ). What feature are we working on?"
