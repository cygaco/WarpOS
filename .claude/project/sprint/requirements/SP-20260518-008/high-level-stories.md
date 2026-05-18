# High-Level Stories — Hook & Process Hygiene

**Sprint:** `SP-20260518-008`
**PRD:** `prd.md`

## H-1 — No leaked Node processes on Windows during sprint runs

**As** a Windows developer running a long sprint,
**I want** the per-edit `format.js` hook to use one Node cold-start and clean up its child on timeout,
**So that** my session does not accumulate dozens of orphaned `node prettier` processes that bog down RAM.

Linked granular stories: `S-1.1`, `S-1.2`.
Linked requirements: `R-1`, `R-2`.

## H-2 — PreToolUse payload-shape regressions surface at write-time

**As** a framework maintainer,
**I want** a warn-only PreToolUse hook that asserts the `tool_input` shape per tool,
**So that** the next Claude-Code framework upgrade that renames a hook payload field shows up as a one-line stderr warning at the very first Edit/Write, not as silent behavior drift weeks later.

Linked granular stories: `S-2.1`, `S-2.2`.
Linked requirements: `R-3`, `R-4`.

## H-3 — One-command Node-procs diagnostic

**As** an operator debugging RAM pressure,
**I want** a `/check:node-procs` skill that lists every Node process with PID, start-time, working-set, and command,
**So that** I can see exactly which processes are alive and which look orphaned without having to remember `tasklist` or `ps` incantations.

Linked granular stories: `S-3.1`, `S-3.2`.
Linked requirements: `R-5`, `R-6`.

## H-4 — Documented `run_in_background` orphan pitfall

**As** an operator reading the canonical operational loop doc,
**I want** an explicit section on Windows process hygiene + when to use `Monitor` vs `Bash run_in_background`,
**So that** I do not orphan child processes by reaching for background flags in the Ralph test phase.

Linked granular stories: `S-4.1`, `S-4.2`.
Linked requirements: `R-7`, `R-8`.
