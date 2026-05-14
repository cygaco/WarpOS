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

## Inputs

`/mode:adhoc [--turbo [--scope <csv>|all] [--ttl <duration>] [--reason "<text>"]]`

Without `--turbo`, the skill behaves as before. With `--turbo` and no further args, the per-mode default scope is applied (see Default turbo scope below). The standalone `/turbo` skill remains the canonical interface for ad-hoc adjustments after mode entry.

### Default turbo scope

`manifest-edit,write-jsonl,node-e-fs,worktree-ops` — config edits, jsonl audit writes, `node -e` file writes (LRN-9 anti-pattern reopened for batch work), and worktree operations for builder dispatch. No `push-to-main`, no `destructive-git`. TTL = 60m. Sibling skill: [`/turbo`](../turbo.md).

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

### Step 2: Create team and spawn teammates

**Prerequisite:** `.claude/settings.json` must set `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = "1"`.
If absent, /warp:health Section 3.5 flags it. Without the flag, `TeamCreate` and
`SendMessage` are not loaded — enable, restart Claude Code, re-run /mode:adhoc.

**Concrete tool calls — execute these directly, do not wrap them in prompt-style language:**

2.1 `TeamCreate(team_name: "<project>-adhoc", description: "...", agent_type: "alpha")`
- Convention: prefix with project slug (`warpos-adhoc`, `jobhunter-adhoc`, etc.) to
  avoid global-namespace collisions with sibling-project `adhoc` teams in `~/.claude/teams/`.
- If `TeamCreate` errors "team already exists" and you want a clean slate,
  `TeamDelete` first (only succeeds when current members are idle).

2.2 Spawn β as an in-process teammate. **Critical:** `team_name` and `name` are
required extra params on the Agent tool — they ARE accepted by the harness when
teams are enabled, even though the tool's documented schema in the prompt does
NOT list them. Pass them anyway. Validated 2026-05-14 (RT-006 +
L-2026-05-14-test-the-call-before-declaring-impossible).

```
Agent(
  subagent_type: "beta",
  team_name: "<project>-adhoc",
  name: "Beta (β)",
  run_in_background: true,
  prompt: "STARTUP DIRECTIVE — Acknowledge readiness via SendMessage to \"team-lead\", then go idle. Do NOT claim tasks.\n\nYou are Alex β. Joining team <project>-adhoc as \"Beta (β)\".\nLoad: .claude/agents/00-alex/beta.md, .claude/agents/00-alex/.system/policy/decision-policy.md, .claude/project/stage/current-stage.md\nSendMessage(to: \"team-lead\", summary: \"Beta online\", message: \"β online — ready for consultation.\")\nGo idle."
)
```

Success response:
```
Spawned successfully.
agent_id: Beta (β)@<project>-adhoc
name: Beta (β)
team_name: <project>-adhoc
```
The harness writes a `member` entry with `backendType: "in-process"` to
`~/.claude/teams/<project>-adhoc/config.json`.

2.3 Spawn γ the same way with `subagent_type: "gamma"`, `name: "Gamma (γ)"`,
and a parallel STARTUP DIRECTIVE prompt referencing
`.claude/agents/00-alex/gamma.md` + `.claude/agents/01-adhoc/.system/protocol.md`.

**Run 2.2 and 2.3 in parallel** (single message, multiple Agent tool calls) —
they're independent.

**STARTUP DIRECTIVE rationale:** the only repo-accessible lever to prevent
teammates from auto-claiming pending tasks. `claim_on_startup: false` is not a
harness setting today; prompt enforcement is what we have.

**Layer 1 (this team):** Alpha (lead) + Beta (judgment) + Gamma (orchestrator) — members of the team in `~/.claude/teams/<project>-adhoc/config.json`, addressable by name via SendMessage.
**Layer 2 (Gamma's subagents):** Builder, Evaluator, Security, Compliance, QA, Fix Agent, Auditor — spawned by Gamma as ephemeral subagents per feature; NOT team members, they exit on return.

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

### Step 7 (only when `--turbo` is passed): Apply turbo authorization

After all prior steps succeed, if the operator passed `--turbo`, invoke `scripts/turbo/apply.js` with the per-mode default scope merged with operator-supplied `--scope` / `--ttl` / `--reason`. Operator-supplied args win on every overlapping field.

```bash
node scripts/turbo/apply.js \
  --scope manifest-edit,write-jsonl,node-e-fs,worktree-ops \
  --ttl 60m \
  --reason "entered via /mode:adhoc --turbo"
```

If the operator passed their own `--scope`/`--ttl`/`--reason`, use those values instead of the defaults above.

## Recovery

- If `mode-set` succeeded but `turbo apply` failed: mode is active without turbo. Re-run `/turbo` manually with the same args (or different ones).
- If turbo was already active when you ran `/mode:adhoc --turbo`: `scripts/turbo/apply.js` overwrites the prior scope/TTL with the new one (no merge). Run `/turbo --status` first if you need to preserve what's already there.

## Built-in primitive limits (honest disclosure)

Phase 0 workstream I documented several harness behaviours we cannot fix
from inside the repo:

- **`TeamCreate --force-replace`** does not exist. The only way to refresh
  a defunct team is to recreate manually.
- **`SendMessage` IS available in the harness** — the Agent tool's spawn
  output returns a stable `agentId` and an explicit hint `Use SendMessage
  with to: <id> to continue this agent.` The remaining limitation is that
  the SendMessage **schema is not discoverable via ToolSearch keyword
  lookup** (`select:SendMessage` returns empty). Attempt the call anyway —
  it may resolve at use-time. The directive is: ToolSearch absence ≠
  harness absence; the spawn output is ground truth. (Validated
  2026-05-13: Beta agentId `ac69b6bf3df4747c3`, Gamma agentId
  `ad97643d7efe975f4` were both spawned with the hint in their output.)
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
