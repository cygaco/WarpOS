# PRD — Turbo as mode argument

**Sprint:** `SP-20260513-006`
**Plan Contract:** `PC-20260514-0007`
**Status:** designed
**Documentation scale:** `s`

## Outcome

Operator enters a mode and is immediately ready to drive a batch — no second command needed to remove the permission-prompt cadence for routine actions. The cross-skill composition is honest (turbo remains its own skill), and the safety floor inside `apply.js` + `authorization-gate.js` is unchanged.

## Context

### Original Request

> Make turbo.md an argument for modes (solo, adhoc, and oneshot).

### Interpreted Intent

Compose `/turbo` with each `/mode:X` skill so the operator can enter a mode AND pre-authorize batch actions in a single command (e.g. `/mode:adhoc --turbo`). The turbo argument optionally accepts the same `--scope` / `--ttl` / `--reason` knobs `/turbo` already has. Mode skill bodies invoke `scripts/turbo/apply.js` when the flag is present; behaviour without the flag is unchanged.

### Current Behavior

Three separate skills. Operator runs `/mode:adhoc`, then `/turbo` as two consecutive commands. Each is a distinct keyboard cadence. Turbo state lives in `.claude/runtime/authorization.json` + a `permissions.allow` merge in `.claude/settings.json`, both managed by `scripts/turbo/apply.js`.

### Desired Behavior

`/mode:<solo|adhoc|oneshot> [--turbo [--scope <csv>|all] [--ttl <duration>] [--reason "<text>"]]` enters the mode AND applies a turbo authorization in one command. Without `--turbo`, mode skills behave exactly as today (no regression). With `--turbo` and no further args, each mode supplies a sensible default scope appropriate to its workload. The standalone `/turbo` skill (`apply`, `--off`, `--status`) remains the canonical interface for ad-hoc adjustments after mode entry.

## Requirements

- `R-1` — **Per-mode default-scope policy** (solo / adhoc / oneshot). Defaults must match the typical workload of each mode and respect the safety floor in `apply.js` + `authorization-gate.js` (no `push-to-main` or other irreversible scopes auto-granted).
- `R-2` — **Skill-body CLI conventions** for documenting `--turbo` + pass-through args (`--scope`, `--ttl`, `--reason`) in all three `/mode:X` skill bodies.
- `R-3` — **Partial-state recovery** when `mode-set` succeeds but `turbo apply` fails. Mode is active; turbo is not. Operator gets a clear recovery instruction.
- `R-4` — **Cross-skill composition documentation.** `/turbo` skill body notes "also invoked by `/mode:X` when `--turbo` is passed".

## Non-Goals

- Refactoring `scripts/turbo/apply.js` or `scripts/mode-set.js`.
- Replacing `/turbo` as a standalone skill — operators still need it for ad-hoc batches outside mode transitions.
- Adding new scopes to the turbo scope vocabulary.
- Removing the safety floor or any safety check in `apply.js` or `authorization-gate.js`.
- Making `--turbo` on by default in any mode.
- Mode marker schema bump to record turbo provenance (deferred to a potential follow-up; recommended scope keeps turbo state independent of mode state).
- Auto-clear of turbo on mode exit (deferred for the same reason).
- `/turbo --status` provenance display ("started by /mode:X") — deferred to a follow-up (Beta-flagged 2026-05-14).

## Affected Surfaces

| Surface | Evidence | Touched |
|---|---|---|
| `.claude/commands/mode/solo.md` | verified_from_repo | yes — add Inputs + invocation |
| `.claude/commands/mode/adhoc.md` | verified_from_repo | yes — add Inputs + invocation |
| `.claude/commands/mode/oneshot.md` | verified_from_repo | yes — add Inputs + invocation (with policy note for Delta multi-hour runs) |
| `.claude/commands/turbo.md` | verified_from_repo | yes — Reference note only ("also invoked by /mode:X") |
| `scripts/turbo/apply.js` | verified_from_repo | no — code unchanged |
| `scripts/mode-set.js` | verified_from_repo | no — code unchanged |

## External Service Dependencies

None.

## Approval Boundaries

Per Plan Contract:

- Safety floor in `scripts/turbo/apply.js` remains the source of truth — this work must not bypass it.
- Per-mode default scope sets are a **Class B** technical decision per `paths.decisionPolicy` — propose, log to decision ledger, decide.
- Composition pattern (mode skill calls a sibling skill's `apply.js`) sets a precedent — Beta should sanity-check before commit.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260514-0007.yaml`
- High-level stories: `high-level-stories.md`
- Granular stories: `granular-stories.md`
- COPY: `copy.md`
- INPUTS: `inputs.md`
- TRACE: `trace.md`
- Acceptance criteria: `acceptance-criteria.md`
- QA plan: `qa-plan.md`
