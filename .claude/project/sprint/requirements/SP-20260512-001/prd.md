# PRD — Multi-sprint parallelism for Sprint Workflow

**Sprint:** `SP-20260512-001`
**Plan Contract:** `PC-20260512-0001`
**Status:** designed
**Documentation scale:** `m`
**Scope variant:** `recommended` (per Beta DECIDE, confidence 0.82)

## Outcome

Founder can keep more than one independent piece of work in flight (e.g. a framework hardening sprint and a product feature sprint) without serializing them. Switching contexts costs a flag, not a teardown. When workstreams are truly independent (different surfaces, different worktrees), both can make progress on the same calendar day.

## Context

### Original Request

> A way to run multiple sprints in parallel.

### Interpreted Intent

Lift the single-active-sprint constraint baked into Sprint Workflow v0.1. Today there is exactly one `current-sprint.yaml` and one `sprint-progress.yaml`; every sprint helper reads/writes those singletons by file path. The user wants the sprint subsystem to support more than one sprint being alive at a time, and to let independent sprints execute concurrently in isolated lanes without stepping on each other's tracker state, git state, or downstream artifacts.

### Current Behavior

Sprint Workflow v0.1 enforces a single active sprint via two singleton yaml files (`paths.sprintCurrent`, `paths.sprintProgress`). `init.js` writes them; every helper in `scripts/sprint/` reads/writes them; the schema declares the constraint explicitly. There is no concept of "inactive sprint" beyond moving to `history/<sprint>/`, no concept of lanes, and no concurrency lock on sprint-state writes.

### Desired Behavior

WarpOS supports more than one sprint coexisting at any time. Two sprints can execute concurrently in isolated lanes (each lane scoped to a git worktree or to non-overlapping surfaces on the default lane). Provider dispatch locks already arbitrate shared rate limits. A conflict-detection check refuses to launch overlapping work without an explicit override. Append singletons (`issues.md`, `events.jsonl`, decision-ledger, beta events) tag every new row with `sprint_id` so cross-sprint forensics stay tractable.

## Requirements

> WarpOS sprint PRDs use `R-N` ids per `scripts/hooks/requirement-format-guard.js`.

- `R-1` — **Per-sprint state shape.** Replace the two singleton yamls with per-sprint subdirs (`.claude/project/sprint/sprints/<SP-id>/current.yaml` + `progress.yaml`) and a top-level `active-sprints.yaml` registry pointing at the live set.
- `R-2` — **Sprint path resolution.** Every sprint helper accepts `--sprint <SP-id>`. When omitted, falls back to the registry's primary entry. `scripts/sprint/paths.js` exposes `forSprint(id)` + `active()` resolvers.
- `R-3` — **Sprint lane model.** Each sprint declares a lane: `default` (current worktree), `worktree:<path>` (git worktree, reuses builder/oneshot isolation primitive), or `branch:<name>` (light isolation). `/sprint:execute` runs in the lane's worktree.
- `R-4` — **Conflict detection.** A static `affected_surfaces` overlap check refuses to launch a second sprint whose declared surfaces intersect with any currently-executing sprint's surfaces unless the user passes `--allow-overlap`. Runs at `/sprint:plan` (warn) and `/sprint:execute` (block).
- `R-5` — **Append-singleton sprint-id tagging.** New rows in `paths.eventsFile`, `paths.decisionLedger`, `paths.betaEvents`, and the YAML records under `paths.sprintIssues` carry a `sprint_id`. The human-readable `issues.md` ledger gains a `[SP-…]` prefix on each appended block.
- `R-6` — **Sprint status surface.** A new `/sprint:status` command lists every active sprint, its lane, status, last checkpoint, and resume command. Read-only.
- `R-7` — **Hook compatibility.** `scripts/hooks/sprint-tracker-guard.js` validates per-sprint subdir yamls with the same per-schema check it applies today, without false-positives on the new layout.
- `R-8` — **Documentation surface.** New `_docs/sprint/LANES.md`; updates to `OVERVIEW.md`, `CRASH_RECOVERY.md`, `FRAMEWORK_VS_DOWNSTREAM.md`, `MODE_RELATIONSHIP.md`, and `paths.sprintReference`. New ADR in `paths.policy/adr/` per Beta's `OPEN_ADR: true` flag.

## Non-Goals

- Do NOT change the sprint id format (`SP-YYYYMMDD-NNN` already supports multi-per-day).
- Do NOT introduce an always-on coordinator process. (That's the expanded variant; deferred.)
- Do NOT split `issues.md` into per-sprint files. Keep one human ledger; tag rows with sprint id.
- Do NOT touch modes (`solo`/`adhoc`/`oneshot`). Sprint is a layer above modes and stays orthogonal.
- Do NOT introduce cross-sprint dependency declarations (`sprint.requires: [...]`) — deferred.
- Do NOT replace the Beta primitive or add a second Beta agent. Lane awareness is a field on consultations, not a new agent.
- Do NOT promote framework changes to canonical or run `/warp:release` as part of this sprint — that comes after the feature lands.

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| `schemas/sprint/current-sprint.schema.json` | verified_from_repo |
| `schemas/sprint/sprint-progress.schema.json` | verified_from_repo |
| `schemas/sprint/active-sprints.schema.json` (new) | verified_from_repo |
| `schemas/sprint/plan-contract.schema.json` | verified_from_repo |
| `scripts/sprint/paths.js` | verified_from_repo |
| `scripts/sprint/plan.js`, `design.js`, `execute.js`, `release.js` | verified_from_repo |
| `scripts/sprint/ticket.js`, `issue.js`, `external-service.js`, `checkpoint.js` | verified_from_repo |
| `scripts/sprint/init.js` | verified_from_repo |
| `scripts/sprint/conflict-check.js` (new) | verified_from_repo |
| `scripts/sprint/status.js` (new) | verified_from_repo |
| `scripts/sprint/migrate-v0.2.js` (new) | verified_from_repo |
| `scripts/sprint/routing.js` | verified_from_repo |
| `.claude/agents/00-alex/.system/policy/sprint-routing.json` | inferred_from_repo |
| `.claude/commands/sprint/*.md` (5 files) | verified_from_repo |
| `.claude/commands/sprint/status.md` (new) | verified_from_repo |
| `scripts/hooks/sprint-tracker-guard.js` | verified_from_repo |
| `scripts/hooks/lib/logger.js` (sprint_id field) | verified_from_repo |
| `.claude/project/reference/sprint-workflow.md` | verified_from_repo |
| `_docs/sprint/*` (existing 12 + 1 new) | verified_from_repo |
| `.claude/agents/00-alex/.system/policy/adr/0002-multi-sprint-parallel-lanes.md` (new) | inferred_from_repo |

## External Service Dependencies

None expected. All work is in-repo.

## Approval Boundaries

- No production deploy, no paid service signup, no secrets, no PII, no destructive migration of user data.
- The migration of live `SP-20260512-001` to the new layout is destructive-adjacent (legacy files removed after verification). Migration script MUST request explicit user confirmation before deleting legacy files. See QA gate `G-MIGRATION-VERIFY`.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260512-0001.yaml`
- High-level stories: `high-level-stories.md`
- Granular stories: `granular-stories.md`
- COPY: `copy.md`
- INPUTS: `inputs.md`
- TRACE: `trace.md`
- Acceptance criteria: `acceptance-criteria.md`
- QA plan: `qa-plan.md`
- Redteam plan: `redteam-plan.md`
- Release plan: `release-plan.md`
