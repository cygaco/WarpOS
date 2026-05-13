# Granular stories — Multi-sprint parallelism

**Sprint:** `SP-20260512-001`
**PRD:** `prd.md`
**High-level stories:** `high-level-stories.md`

Each granular story (`S-N`) becomes roughly one ticket. Acceptance criteria are testable Given/When/Then statements; full criteria live in `acceptance-criteria.md`.

---

## R-1 — Per-sprint state shape

### S-1 — Active-sprints registry

**As** any agent
**I want** a top-level `.claude/project/sprint/active-sprints.yaml` registry that lists every live sprint (id, title, lane, status, pointer to its subdir)
**So that** there is a single source of truth for "which sprints exist right now"

Acceptance criteria: `AC-1.1`, `AC-1.2`, `AC-1.3`.
Linked: `H-1`, `H-6`, `R-1`. Files: `schemas/sprint/active-sprints.schema.json` (new), `scripts/sprint/init.js`.

### S-2 — Per-sprint state subdirs

**As** a sprint helper writing tracker state
**I want** to write to `.claude/project/sprint/sprints/<SP-id>/current.yaml` and `…/progress.yaml`
**So that** two sprints' state shapes never collide on the same yaml file

Acceptance criteria: `AC-2.1`, `AC-2.2`.
Linked: `H-1`, `R-1`. Files: `scripts/sprint/init.js`, `scripts/sprint/paths.js`, schema descriptions in `schemas/sprint/current-sprint.schema.json` + `schemas/sprint/sprint-progress.schema.json`.

### S-3 — Loosen current-sprint schema constraint

**As** the schema author
**I want** `current-sprint.schema.json` to drop the "always exactly one current-sprint.yaml per downstream repo" claim and gain a `lane` field
**So that** the documented constraint matches the new per-sprint layout

Acceptance criteria: `AC-3.1`, `AC-3.2`.
Linked: `H-1`, `R-1`, `R-3`. Files: `schemas/sprint/current-sprint.schema.json`.

### S-4 — Migration script for SP-20260512-001

**As** the framework upgrade flow
**I want** `scripts/sprint/migrate-v0.2.js` to move the existing `current-sprint.yaml` + `sprint-progress.yaml` into `sprints/<SP-id>/`, write `active-sprints.yaml`, verify byte-equivalence on the moved fields, and prompt before deleting legacy files
**So that** the live SP-20260512-001 sprint survives the upgrade without silent data loss

Acceptance criteria: `AC-4.1`, `AC-4.2`, `AC-4.3`, `AC-4.4`.
Linked: `H-1`, `R-1`. Files: `scripts/sprint/migrate-v0.2.js` (new). Gate: `G-MIGRATION-VERIFY`.

### S-5 — Init template bugfix

**As** any user running `node scripts/sprint/init.js`
**I want** the rendered `current-sprint.yaml` to validate clean against `current-sprint.schema.json`
**So that** every downstream tracker starts in a valid state (today it fails 24 validation errors)

Acceptance criteria: `AC-5.1`.
Linked: `R-1`. Files: `framework/templates/sprint/init/current-sprint.yaml.tmpl`, `scripts/sprint/init.js`.

> Pre-existing bug discovered during /sprint:plan. Folding into this sprint so we don't land template fixes twice.

---

## R-2 — Sprint path resolution

### S-6 — `paths.js` per-sprint resolver

**As** any sprint helper
**I want** `scripts/sprint/paths.js` to expose `SPRINT.forSprint(id)` returning `{ current, progress, ralph, checkpoints, requirements, history }` and a `SPRINT.active()` returning the primary id from `active-sprints.yaml`
**So that** helpers never hardcode the singleton path again

Acceptance criteria: `AC-6.1`, `AC-6.2`, `AC-6.3`.
Linked: `H-2`, `R-2`. Files: `scripts/sprint/paths.js`.

### S-7 — `--sprint` flag end-to-end

**As** any agent or user invoking a sprint helper
**I want** every helper in `scripts/sprint/` (`plan.js`, `design.js`, `execute.js`, `release.js`, `ticket.js`, `issue.js`, `external-service.js`, `checkpoint.js`) to accept `--sprint <SP-id>` and fall back to `SPRINT.active()` when omitted
**So that** an agent can target a specific sprint without changing the tracker's active pointer

Acceptance criteria: `AC-7.1`, `AC-7.2`, `AC-7.3`.
Linked: `H-2`, `R-2`. Files: 8 helpers under `scripts/sprint/`.

### S-8 — Sprint command bodies document `--sprint`

**As** any agent reading `/sprint:plan|design|execute|release|status`
**I want** the skill bodies under `.claude/commands/sprint/` to document the `--sprint` flag, `--allow-overlap`, and how to switch the active pointer
**So that** the prose contract matches the helper contract

Acceptance criteria: `AC-8.1`, `AC-8.2`.
Linked: `H-2`, `R-2`, `R-8`. Files: 5 sprint command `.md` bodies + `paths.sprintReference`.

---

## R-3 — Sprint lane model

### S-9 — Plan Contract gains a `lane` field

**As** `/sprint:plan`
**I want** the Plan Contract schema to gain a top-level `lane` block (`type: default|worktree|branch`, `value: <path|name|null>`, `isolation_notes: string`)
**So that** a sprint's intended lane is declared at plan time and inherited by `/sprint:execute`

Acceptance criteria: `AC-9.1`, `AC-9.2`.
Linked: `H-3`, `R-3`. Files: `schemas/sprint/plan-contract.schema.json`, `scripts/sprint/plan.js`.

### S-10 — `/sprint:execute` honors `lane.type === "worktree"`

**As** the founder launching `/sprint:execute` on a worktree-lane sprint
**I want** Ralph to perform its act/test/checkpoint phases inside the lane's git worktree
**So that** two sprints making file changes on the same calendar day do not commingle commits

Acceptance criteria: `AC-10.1`, `AC-10.2`, `AC-10.3`.
Linked: `H-3`, `R-3`. Files: `scripts/sprint/execute.js`, `.claude/commands/sprint/execute.md`.

### S-11 — Worktree warm-up dispatch

**As** any agent about to spawn parallel work inside a fresh worktree
**I want** `/sprint:execute` (when `lane.type === "worktree"`) to dispatch one no-op warm-up agent before any real Ralph work
**So that** the documented "first parallel dispatch leaks to main repo HEAD" issue from `scripts/one-off-log-dispatch-issues.js` does not corrupt the lane's first commit

Acceptance criteria: `AC-11.1`.
Linked: `H-3`, `R-3`. Files: `scripts/sprint/execute.js`. Reference: `scripts/one-off-log-dispatch-issues.js` + `_docs/sprint/RALPH_LOOP.md`.

### S-12 — Routing concurrency block

**As** any sprint helper consulting routing policy
**I want** `sprint-routing.json` to grow a `concurrency: { max_lanes, default_lane, default_isolation }` block and `routing.js` to expose it
**So that** a single knob governs how many lanes can run simultaneously and what isolation is assumed by default

Acceptance criteria: `AC-12.1`, `AC-12.2`.
Linked: `H-3`, `R-3`. Files: `.claude/agents/00-alex/.system/policy/sprint-routing.json`, `scripts/sprint/routing.js`.

---

## R-4 — Conflict detection

### S-13 — `conflict-check.js` + integration

**As** any agent launching a new sprint or starting `/sprint:execute`
**I want** `scripts/sprint/conflict-check.js` to compute set-intersection of declared `affected_surfaces.surface` strings between the candidate sprint and every other active-and-executing sprint, returning `{ conflicts: [...], severity }`
**So that** I am told before I start work that another sprint is also planning to touch those files

Acceptance criteria: `AC-13.1`, `AC-13.2`, `AC-13.3`.
Linked: `H-4`, `R-4`. Files: `scripts/sprint/conflict-check.js` (new), `scripts/sprint/plan.js` (warn), `scripts/sprint/execute.js` (block unless `--allow-overlap`).

---

## R-5 — Append-singleton sprint-id tagging

### S-14 — Tag append singletons with `sprint_id`

**As** any agent appending to `paths.eventsFile`, `paths.decisionLedger`, `paths.betaEvents`, or `paths.sprintIssues`
**I want** every new row to carry a `sprint_id` field (or, for `issues.md` markdown blocks, a `[SP-…]` prefix on the appended heading)
**So that** cross-sprint forensics can `grep` by id without ambiguity

Acceptance criteria: `AC-14.1`, `AC-14.2`, `AC-14.3`.
Linked: `H-5`, `R-5`. Files: `scripts/hooks/lib/logger.js` (events tag passthrough), `scripts/sprint/issue.js`, decision-ledger appender(s), Beta event appender. Forward-compatible: existing rows without `sprint_id` keep their shape and are treated as `sprint_id: null`.

---

## R-6 — Sprint status surface

### S-15 — `/sprint:status` command

**As** the founder
**I want** `/sprint:status` to print, for every entry in `active-sprints.yaml`: id, title, lane, current_phase, last checkpoint path, resume_command, and (when in `executing` state) current_ticket + current_loop
**So that** I see at a glance what is in flight

Acceptance criteria: `AC-15.1`, `AC-15.2`.
Linked: `H-7`, `R-6`. Files: `.claude/commands/sprint/status.md` (new), `scripts/sprint/status.js` (new).

---

## R-7 — Hook compatibility

### S-16 — `sprint-tracker-guard.js` accepts new layout

**As** any tool writing to `.claude/project/sprint/sprints/<SP-id>/*.yaml`
**I want** the PreToolUse `sprint-tracker-guard.js` to validate the new layout's yaml against the same `warpos/sprint/<name>/v1` schemas without false-positive blocks
**So that** the guard's protection survives the layout change

Acceptance criteria: `AC-16.1`, `AC-16.2`.
Linked: `H-2`, `R-7`. Files: `scripts/hooks/sprint-tracker-guard.js`, `scripts/test-sprint-hooks.js` (extend test coverage).

---

## R-8 — Documentation surface

### S-17 — New + updated sprint docs

**As** any reader of `_docs/sprint/`
**I want** a new `LANES.md` and updated `OVERVIEW.md`, `CRASH_RECOVERY.md`, `FRAMEWORK_VS_DOWNSTREAM.md`, `MODE_RELATIONSHIP.md`, and `paths.sprintReference`
**So that** the doc layer reflects the new multi-sprint + lane model

Acceptance criteria: `AC-17.1`, `AC-17.2`.
Linked: `H-3`, `R-8`. Files: `_docs/sprint/LANES.md` (new), 4 existing `_docs/sprint/*.md`, `.claude/project/reference/sprint-workflow.md`.

### S-18 — ADR for multi-sprint lane architecture

**As** the framework's decision archive
**I want** a new `.claude/agents/00-alex/.system/policy/adr/NNNN-multi-sprint-parallel-lanes.md` capturing the lane model, isolation choice (worktree by default), and the deferred-coordinator decision
**So that** future maintainers know why the design is shaped this way

Acceptance criteria: `AC-18.1`.
Linked: `R-8`. Files: `paths.policy/adr/NNNN-multi-sprint-parallel-lanes.md` (new). Required by Beta `OPEN_ADR: true` flag.
