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

1. **Store exists:** `.claude/agents/02-oneshot/.system/store.json` — if not, warn that a fresh store is needed
2. **Protocol exists:** `.claude/agents/02-oneshot/.system/protocol.md`
3. **Phase graph exists:** `.claude/manifest.json` has `build.phases` and `build.features` populated (this is the canonical phase graph; there is no separate task-manifest file)
4. **Skeleton stubs exist:** for each feature in `store.features`, confirm the files listed in `features[<name>].files` exist and are skeleton stubs (check against `store.knownStubs`)
5. **Foundation passes:** Run the build command from project-config to verify the skeleton compiles

If any check fails, report what's missing and stop. Do NOT launch Delta into a broken environment.

### Step 2: Write mode marker

Run the canonical mode-set CLI. Oneshot takes a lock — `lockOwner` is `delta` and `activeBuild` is the current store branch:

```bash
node scripts/mode-set.js oneshot --by alpha --lock-owner delta --active-build "$(git rev-parse --abbrev-ref HEAD)"
```

The lock blocks transitions until Delta halts and clears it (Delta writes `--lock-owner ""` on halt). If a stale lock blocks you, halt the build first or pass `--force`.

### Step 3: Set mode context

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
