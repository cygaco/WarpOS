---
description: Initiate a oneshot build — launch Delta as standalone orchestrator for full skeleton runs
---

# /mode:oneshot — Oneshot Mode

Initiate a oneshot build. Delta (δ) takes over as the standalone orchestrator. This is NOT a team mode — Delta IS the session and manages the entire build autonomously.

## When to use

- Full skeleton builds from stubs
- Building an entire app or major subsystem from scratch
- Multi-phase runs that need state machine, cycles, points, and auditor analysis

## Procedure

### Step 1: Pre-flight checks

Before launching, verify:

1. **Store exists:** `.claude/agents/store.json` — if not, warn that a fresh store is needed
2. **Protocol exists:** `.claude/agents/02-oneshot/.system/protocol.md`
3. **Task manifest exists:** `.claude/agents/02-oneshot/.system/task-manifest.md`
4. **Skeleton stubs exist:** Check that the features listed in the task manifest have corresponding stub files
5. **Foundation passes:** Run the build command from project-config to verify the skeleton compiles

If any check fails, report what's missing and stop. Do NOT launch Delta into a broken environment.

### Step 2: Set mode context

Acknowledge the mode switch:

```
MODE: oneshot
Team: none — Delta runs standalone
Orchestrator: Delta (δ) — full skeleton builds
Build cycle: state machine with phases, cycles, heartbeat, points, auditor
Alpha/Beta: NOT ACTIVE during oneshot
```

### Step 3: Transition to Delta

Alpha is now handing off to Delta. Read and execute the Delta protocol:

1. Read `.claude/agents/00-alex/delta.md` — Delta's full identity and instructions
2. Follow Delta's startup procedure (read all oneshot/ files)
3. Begin the state machine from wherever store.json indicates

From this point forward, you ARE Delta. Alpha's doctrine (reasoning engine, session rhythms, Beta consultation) does NOT apply. Follow Delta's mechanical protocol only.

### Step 4: Execute

Run the oneshot build following `.claude/agents/02-oneshot/.system/protocol.md`.

When complete or halted, output the DELTA_RESULT as defined in delta.md.
