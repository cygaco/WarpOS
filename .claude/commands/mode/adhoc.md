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

1. Confirm Beta agent file exists: `.claude/agents/00-alex/beta.md`
2. Confirm Gamma agent file exists: `.claude/agents/00-alex/gamma.md`
3. Confirm adhoc protocol exists: `.claude/agents/01-adhoc/.system/protocol.md`

If any are missing, warn and offer to continue in solo mode instead.

### Step 1.5: Write mode marker

Run the canonical mode-set CLI (validates the transition and writes the v2 marker schema):

```bash
node scripts/mode-set.js adhoc --by alpha
```

If the prior mode is `oneshot` with an `activeBuild`, the CLI refuses — halt the build first.

### Step 1.75: Classify any existing team state (Phase 0 workstream I)

Before spawning a new team, classify the current team state. The team
primitives (TeamCreate, SendMessage, maxTurns reap) live in the Claude
Code harness and are NOT directly inspectable from this repo — so this is
a checklist Alpha walks through with the user, not an automated probe.

Classification:

| State | Signal | Action |
|---|---|---|
| **fresh** | Team created this session, all teammates idle, no stale prompts | Reuse — go to Step 3 |
| **stale** | Team created hours ago, teammates have message backlog, prompts reference completed work | Refresh: send a "reset context" SendMessage to each teammate before continuing |
| **defunct** | Teammate(s) hit maxTurns and were reaped; SendMessage returns "agent exited" | Force-recreate: spawn fresh teammates with the same names |
| **unknown** | No clear signal | Treat as defunct — recreate is the safer default |

When in doubt, recreate. The cost of an extra spawn is far less than the
cost of dispatching a feature into a half-dead team.

### Step 2: Create agent team

Create a team and spawn two teammates with specific names:

```
Create an agent team for adhoc feature development. Spawn two teammates:
- Name: "Beta (β)", agent type: beta
- Name: "Gamma (γ)", agent type: gamma

Every teammate spawn prompt MUST include this directive verbatim:

  STARTUP DIRECTIVE — Do not claim tasks on startup. Acknowledge readiness
  with a single line, then wait for explicit assignment from Alpha.
  Pending tasks remain owned by Alpha until assigned.
```

The startup directive is the only repo-accessible lever for the
auto-claim suppression rule from Phase 0 — `claim_on_startup: false`
lives in the harness, not in this file. Prompt enforcement is what we
have. Document the limitation honestly.

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

If `.claude/agents/store.json` exists and has a heartbeat, update:
```json
{ "agent": "alpha", "workstream": "adhoc" }
```

### Step 5: Confirm

Report: "Adhoc team active. Alpha (lead) + Beta (β) + Gamma (γ). What feature are we working on?"

### Step 6: Touch the team marker (Phase 0 workstream I)

After confirmation, write a freshness marker:

```bash
date -u +%FT%TZ > .claude/runtime/.team-marker
```

`scripts/hooks/session-start.js` checks this marker on cold start. When
it is older than 24 hours, session-start emits a warning suggesting the
operator re-run `/mode:adhoc` to refresh classification.

## Built-in primitive limits (honest disclosure)

Phase 0 workstream I documented several harness behaviours we cannot fix
from inside the repo:

- **`TeamCreate --force-replace`** does not exist. The only way to refresh
  a defunct team is to recreate manually.
- **`SendMessage` to a maxTurns-reaped teammate** returns an error string
  but does not auto-respawn. Alpha must detect the failure and re-spawn.
- **`claim_on_startup: false`** is not a harness setting — the directive in
  Step 2 is prompt-level enforcement only.
- **Team task ownership** is ephemeral. Any work that must survive a team
  reap or session restart must be tracked in durable repo state
  (`.claude/agents/store.json`, `paths.decisionLedger`, or a feature's
  `_requirements/04-features/<feature>/PRD.md`), NOT in team-task
  metadata.

See `_docs/phase0/adhoc-primitive-limits.md` for the full inventory.

## Tracker source-of-truth rule

Future sprint work (e.g. anything `/sprint:design` writes) lives in
durable repo state — `_requirements/04-features/`, `.claude/project/`,
or designated tracker files — never in team-task ownership alone. Team
tasks are a coordination layer, not a record-of-decisions layer.
