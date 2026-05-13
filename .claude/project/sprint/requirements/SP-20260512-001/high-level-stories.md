# High-level stories — Multi-sprint parallelism

**Sprint:** `SP-20260512-001`
**PRD:** `prd.md`

## H-1 — Have multiple sprints open at once

**As** the founder
**I want** to start a second sprint while a first one is still open
**So that** I can hold two independent workstreams without finishing one before starting the other

Linked: `R-1`, `R-2`, `R-6`. Maps to granular stories `S-1`, `S-2`, `S-3`, `S-4`, `S-5`, `S-6`, `S-14`.

## H-2 — Switch between sprints by id, not by file teardown

**As** any agent or me
**I want** to address sprint commands with `--sprint <SP-id>`
**So that** I can plan, design, execute, ticket, or check on a specific sprint without globally swapping tracker files

Linked: `R-2`, `R-7`. Maps to granular stories `S-3`, `S-4`, `S-5`, `S-15`.

## H-3 — Execute two sprints concurrently in isolated lanes

**As** the founder running independent framework and product workstreams
**I want** each sprint to declare a lane (default / worktree / branch) and `/sprint:execute` to honor that isolation
**So that** Ralph loops on two sprints can run on the same calendar day without colliding on tracker state or git working tree

Linked: `R-3`, `R-4`. Maps to granular stories `S-8`, `S-9`, `S-10`, `S-11`, `S-12`.

## H-4 — Don't silently let two sprints corrupt the same files

**As** any agent about to launch a second concurrent sprint
**I want** a conflict-check that detects `affected_surfaces` overlap between live sprints
**So that** the system refuses to launch a colliding sprint unless I explicitly override with `--allow-overlap`

Linked: `R-4`. Maps to granular stories `S-12`.

## H-5 — Keep forensics tractable when multiple sprints write to the same log

**As** any agent reading `events.jsonl`, `issues.md`, the decision ledger, or Beta events
**I want** every new row to carry the sprint id it originated from
**So that** I can filter cross-sprint logs by sprint without disambiguating manually

Linked: `R-5`. Maps to granular stories `S-13`.

## H-6 — Recover an active sprint set after a crash

**As** any agent picking up a half-finished session
**I want** to read `active-sprints.yaml` to know which sprints exist, then `sprints/<SP-id>/progress.yaml` to know where each one stopped
**So that** I can resume the right sprint without guessing or accidentally resuming a paused one

Linked: `R-1`, `R-2`. Maps to granular stories `S-1`, `S-2`, `S-3`.

## H-7 — Get a one-glance view of all active sprints

**As** the founder
**I want** `/sprint:status` to print every active sprint, its lane, its phase, its last checkpoint, and its resume command
**So that** I never have to grep across `sprints/*/progress.yaml` to find out what is in flight

Linked: `R-6`. Maps to granular stories `S-14`.
