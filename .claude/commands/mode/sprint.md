---
description: Enter sprint mode — ε (Alex Epsilon) conducts the full sprint lifecycle (plan→design→build→gauntlet→release→retro) via the registry-driven runtime, with REAL agent dispatch.
---

# /mode:sprint — Sprint Mode

Enter sprint mode. The active face is **ε (Alex Epsilon)** — the sprint deliver-face. ε
conducts the full lifecycle (**plan → design → build → gauntlet → release → retro**) by
reading the declarative hook-point registry: at each step it resolves the matched agent-set
under the sprint's composition, derives each role's dispatch route from the role-registry
keystone (ADR-0008), and **really dispatches** them — a real completion record per agent on
the canonical ledger `gauntlet-verify` reads (ADR-0009). Adding an agent to a sprint = adding
a registry row; ε is never edited.

> Sibling of `/mode:adhoc` (α+β+γ, single features) and `/mode:oneshot` (δ, skeleton builds).
> Sprint mode is for roadmap-sequenced, full-lifecycle work across all the manager + worker roles.

## The sprint team — persistent core + on-demand roster

Sprint mode runs a small **persistent coordination team** (spawned on mode entry, exactly
like adhoc's α+β+γ) plus an **on-demand hook-point roster** that ε dispatches per phase.

**Persistent team (the standing core — these three are always present):**
- **α (Alpha)** — lead / orchestrator (the session).
- **ε (Epsilon)** — the sprint **conductor and dispatch controller**: reads the hook-point
  registry, resolves each step's agent-set, derives each role's route from the role-registry
  keystone, and really dispatches. (ε is to sprint mode what γ is to adhoc mode.)
- **β (Beta)** — process judgment, consulted at the four phase boundaries
  (plan→design, design→build, gauntlet→release, release→retro).

**On-demand roster (NOT persistent — ε dispatches each at its registry hook-point, per
`.claude/agents/_org/sprint-hook-points.json`):**

| Step | Roles ε dispatches |
|---|---|
| plan | director-of-product, product-lead |
| design | product-lead, director-of-engineering, design-lead, quality-lead, copy-lead |
| build | frontend-builder, backend-builder, security-builder |
| gauntlet | frontend-reviewer, backend-reviewer, qa-reviewer, security-reviewer, visual-review, design-quality |
| release | qa-reviewer |
| retro | learner |

The **Director of Product** (and every other director / lead / builder / reviewer) is
**domain judgment at its hook-point, not a standing member** — directors give domain
judgment, β gives process judgment, and ε never replaces them. Adding or removing one of
these is a single registry row in `sprint-hook-points.json`; the persistent team never changes.

## What's REAL — both dispatch halves (honest scope — ADR-0009 Mitigation #4)

- **CLI-routable roles — REAL via the node runtime:** ε dispatches build-chain **builders**
  (`dispatch-claude.js`), cross-provider **reviewers** (`dispatch-agent.js` → GPT/Gemini), and
  claude-raw tools (`claude -p --agent`). The completion record reflects the **real** spawn
  outcome (a reap = 0-byte-on-exit-0 → `ok:false`); `recordAgentDispatch` refuses to write
  without a real boolean outcome (the fake-green guard). Proven: real `gpt-5.5` + `gemini-3.1-pro-preview`
  dispatches through ε wrote real completion records (315s / 107s wall-clock, real output bytes).
- **In-process roster — REAL via ε-the-agent + the Agent tool (Increment B):** managers/leads/directors
  (`claude-agent`) and the Claude-pinned `design-quality`/`visual-review` (`agent-tool`) CANNOT be
  spawned by a node process — only the harness Agent tool can. So ε-the-agent dispatches them via
  `Agent(subagent_type: <role>)`, captures the returned envelope to a file, and records with
  `record-inprocess --evidence <file>` — whose `ok` is **derived from the real Agent-return bytes**
  (0-byte = reap → `ok:false`; no evidence = REFUSE, no record). Proven: a real `product-lead`
  Agent-tool spawn → evidence-bound record (`via:epsilon-agent`, 514 real bytes + `evidence_sha`).

### The in-process conduct loop (ε-the-agent)

For each plan entry whose route is `claude-agent` / `agent-tool` (the ε runtime returns these as
`spawned:false, reason:requires-orchestrator` — it cannot spawn them from a node process):

1. Dispatch via the harness Agent tool: `Agent(subagent_type: <role>, prompt: <step prompt>)`.
2. Capture the agent's returned envelope to a file (e.g. `.claude/runtime/epsilon-prompts/<sprint>-<step>-<role>.return.txt`).
3. Write the completion record:
   ```bash
   node scripts/sprint/epsilon-runtime.js record-inprocess \
     --sprint <id> --role <role> --step <step> --evidence <file> [--elapsed-ms <n>]
   ```

NEVER write the record without the Agent's real return — `record-inprocess` REFUSES on missing
evidence and records `ok:false` on a 0-byte return. The record is the same `ok:true` liveness
`gauntlet-verify` reads (absence = the lane silently died), so an in-process reviewer lane is
gated exactly like a CLI reviewer lane.

## Inputs

`/mode:sprint [--turbo [--scope <csv>|all] [--ttl <duration>] [--reason "<text>"]]`

### Default turbo scope

`manifest-edit,write-jsonl,worktree-ops` — config edits, jsonl audit writes, and worktree
operations for builder dispatch. No `push-to-main`, no `destructive-git`. TTL = 60m. (`push-to-main`
is opt-in only, per CLAUDE.md autonomy.)

## Procedure

### Step 1: Write mode marker

Run the canonical mode-set CLI (validates the transition and writes the v2 marker schema):

```bash
node scripts/mode-set.js sprint --by alpha
```

If the prior mode has an `activeBuild` or a different `lockOwner`, the CLI refuses and prints
why — halt the active build first, or pass `--force` (logs the override).

### Step 1.5: Verify team readiness + reconcile any existing team

Confirm the persistent-team specs exist:
- `.claude/agents/president/beta.md` (β)
- `.claude/agents/president/epsilon.md` (ε)
- `.claude/agents/president/alpha.md` (α)

Then reconcile any existing team (avoid the `-N` accretion bug, W-21): run the read-only
probe `node scripts/checks/adhoc-team-hygiene.js`. If a same-named member from a dead session
exists, `SendMessage {type:"shutdown_request"}` it **before** spawning. Cleanup =
`shutdown_request`, NEVER edit `config.json`. Classify fresh / stale / defunct exactly as
`/mode:adhoc` Step 1.75 does; when in doubt, recreate.

**Prerequisite:** `.claude/settings.json` must set `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = "1"`
(else `TeamCreate`/`SendMessage` are not loaded — `/warp:health` §3.5 flags it).

### Step 1.75: Create the persistent team + spawn ε + β

**Concrete tool calls — execute directly, do not wrap in prompt-style language:**

1. `TeamCreate(team_name: "<project>-sprint", description: "Sprint mode persistent team — α lead + ε conductor + β judgment", agent_type: "alpha")`
   - Prefix with the project slug (`warpos-sprint`, etc.) to avoid `~/.claude/teams/` collisions
     with sibling-project teams. If "team already exists" and you want a clean slate, `TeamDelete` first (members must be idle).

2. Spawn ε + β as in-process teammates **in parallel** (single message, two Agent calls).
   `team_name` and `name` ARE accepted by the harness when teams are enabled even though the
   Agent schema doesn't list them — pass them anyway. Each gets a STARTUP DIRECTIVE: acknowledge
   readiness via `SendMessage(to:"team-lead")`, then go idle, do NOT auto-claim tasks.

   ```
   Agent(subagent_type: "epsilon", team_name: "<project>-sprint", name: "Epsilon (ε)",
     run_in_background: true,
     prompt: "STARTUP DIRECTIVE — SendMessage readiness to \"team-lead\", then go idle; do NOT claim tasks.\nYou are Alex ε, the sprint conductor joining <project>-sprint as \"Epsilon (ε)\".\nLoad: .claude/agents/president/epsilon.md + scripts/sprint/epsilon-runtime.js + .claude/agents/_org/sprint-hook-points.json.\nSendMessage(to:\"team-lead\", summary:\"Epsilon online\", message:\"ε online — ready to conduct.\")\nGo idle.")

   Agent(subagent_type: "beta", team_name: "<project>-sprint", name: "Beta (β)",
     run_in_background: true,
     prompt: "STARTUP DIRECTIVE — SendMessage readiness to \"team-lead\", then go idle; do NOT claim tasks.\nYou are Alex β joining <project>-sprint as \"Beta (β)\".\nLoad: .claude/agents/president/beta.md + .claude/agents/president/.system/policy/decision-policy.md.\nSendMessage(to:\"team-lead\", summary:\"Beta online\", message:\"β online — ready for boundary consultation.\")\nGo idle.")
   ```

**Layer 1 (persistent team):** α (lead) + ε (conductor) + β (judgment) — members in
`~/.claude/teams/<project>-sprint/config.json`, addressable by name via SendMessage.
**Layer 2 (ε's hook-point roster):** directors / leads / builders / reviewers / learner —
dispatched ephemerally by ε per the hook-point registry; NOT team members, they exit on return.

### Step 2: Set mode context

Acknowledge the mode switch:

```
MODE: sprint
Team: α (lead) + ε (conductor/dispatch) + β (judgment) — persistent; directors/leads on-demand at hook-points
Conductor: ε (Alex Epsilon) — the sprint deliver-face
Lifecycle: plan → design → build → gauntlet → release → retro (registry-driven)
Dispatch: REAL — CLI routes via the node runtime (builders + cross-provider reviewers); in-process roster (managers/leads/design-quality) via ε-the-agent + the Agent tool (record-inprocess)
β: consulted at the four phase boundaries (plan→design, design→build, gauntlet→release, release→retro)
```

### Step 2.5: Start-of-work — consult TRACKER.md

Before running the sprint (substantial long-running work), read `TRACKER.md` (spec §7.2 / §28.1) and determine whether this sprint belongs to an **active** epic/sprint, a **planned** one, **untracked** work, or a **new** epic/sprint that must be created. Confirm the relevant epic/sprint's current state, next action, blockers, and that its `/trackers/` file exists; create a missing tracker file before starting. The sprint must not begin from memory alone; meaningful work outside a tracked epic/sprint is recorded in `UNTRACKED_WORK.md` (§7.9). (This is the tracker-consult step only — it does not alter the α+ε+β persistent-team setup in Steps 1.5/1.75.)

### Step 3: Run the sprint

Sprint mode is driven by **`/sprint:full`** (the orchestrator that chains the five phases under a
bounded autonomy preset) — it invokes the ε runtime for dispatch:

```bash
/sprint:full "<request>" [--autonomy conservative|moderate|aggressive] [--mode adhoc|solo]
```

Or drive the ε runtime directly:

```bash
node scripts/sprint/epsilon-runtime.js plan    --sprint <SP-id> [--json]   # resolve the per-step dispatch plan
node scripts/sprint/epsilon-runtime.js conduct --sprint <SP-id> --dispatch # conduct + REALLY dispatch (CLI routes)
node scripts/sprint/epsilon-runtime.js record-inprocess --sprint <SP-id> --role <r> --step <s> --evidence <file>  # record an in-process Agent-tool spawn
```

### Step 4: Update heartbeat (if store exists)

If `.claude/agents/store.json` exists and has a heartbeat, update:
```json
{ "agent": "epsilon", "workstream": "sprint" }
```

### Step 5: Confirm

Report: "Sprint mode active. ε conducts the lifecycle; CLI-routable agents dispatch for real via
the node runtime, the in-process roster dispatches via ε-the-agent + the Agent tool (evidence-bound
`record-inprocess`). Run `/sprint:full \"<request>\"` to start a sprint."

### Step 6 (only when `--turbo` is passed): Apply turbo authorization

After `scripts/mode-set.js sprint` exits 0, if the operator passed `--turbo`, invoke
`scripts/turbo/apply.js` with the per-mode default scope merged with operator-supplied args
(operator args win on every overlap):

```bash
node scripts/turbo/apply.js --scope manifest-edit,write-jsonl,worktree-ops --ttl 60m --reason "entered via /mode:sprint --turbo"
```

## Recovery

- If `mode-set` succeeded but `turbo apply` failed: mode is active without turbo. Re-run `/turbo` manually.
- If a sprint is mid-flight, `/sprint:full --resume` continues it; the mode marker is independent of sprint progress.

## Reference

- Conductor spec: `.claude/agents/president/epsilon.md`
- Runtime: `scripts/sprint/epsilon-runtime.js` (+ `epsilon-runtime.test.js`)
- Orchestrator: `/sprint:full` (`scripts/sprint/full.js`)
- ADR: `0009-epsilon-sprint-runtime.md` (Mitigation #4 = real dispatch — both the CLI-route + in-process increments)
