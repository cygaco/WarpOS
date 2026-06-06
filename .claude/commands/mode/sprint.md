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

## What's REAL today vs the next increment (honest scope — ADR-0009 Mitigation #4)

- **REAL (landed, tested, proven):** ε dispatches the **CLI-routable** roles for real —
  build-chain **builders** (`dispatch-claude.js`), cross-provider **reviewers** (`dispatch-agent.js`
  → GPT/Gemini), and claude-raw tools (`claude -p --agent`). The completion record reflects the
  **real** spawn outcome (a reap → `ok:false`); `recordAgentDispatch` refuses to write without a
  real outcome (the fake-green guard). Proven: a real `gemini-3.1-pro-preview` dispatch through ε
  wrote a real 19.3s completion record; structural assertions in `epsilon-runtime.test.js` §7.
- **NEXT INCREMENT (named, not faked):** the **in-process** roster — managers/leads (`claude-agent`)
  and the Claude-pinned `design-quality`/`visual-review` (`agent-tool`) — cannot be spawned by a
  node process (only the harness Agent tool can). ε returns `requires-orchestrator` for them
  honestly (no record). Dispatching those via ε-the-agent (`--epsilon-dispatch` of the in-process
  roster) is the next step. Until then, those consults are surfaced for α / the orchestrator.

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

### Step 2: Set mode context

Acknowledge the mode switch:

```
MODE: sprint
Conductor: ε (Alex Epsilon) — the sprint deliver-face
Lifecycle: plan → design → build → gauntlet → release → retro (registry-driven)
Dispatch: REAL for CLI routes (builders + cross-provider reviewers); in-process roster = next increment
β: consulted at the four phase boundaries (plan→design, design→build, gauntlet→release, release→retro)
```

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
```

### Step 4: Update heartbeat (if store exists)

If `.claude/agents/store.json` exists and has a heartbeat, update:
```json
{ "agent": "epsilon", "workstream": "sprint" }
```

### Step 5: Confirm

Report: "Sprint mode active. ε conducts the lifecycle; CLI-routable agents dispatch for real,
in-process roster surfaces for the orchestrator. Run `/sprint:full \"<request>\"` to start a sprint."

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
- ADR: `0009-epsilon-sprint-runtime.md` (Mitigation #4 = the real-dispatch increment + the next step)
