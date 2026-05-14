# PRD — Enforce sprint routing policy

**Sprint:** `SP-20260514-002`
**Plan Contract:** `PC-20260514-0009`
**Status:** ready_for_execution
**Documentation scale:** `m`

## Outcome

Every sprint artifact carries a durable routing-trace row recording which `model_class` actually drafted it and (where required) which second-vendor model diff-reviewed it. Sprint commands cannot finalize an artifact without that trace. Violations fail at write-time with an actionable message instead of being discovered at retrospective.

## Context

### Original Request

> The routing policy for reviewers, gauntlets, etc in sprints is aspirational, not enforced. Fix that.
> THen proceed through all sprint steps without me!

### Current Behavior (verified_from_repo)

- `paths.sprintRouting` declares per-phase `model_class` + `diff_review` for 8 phases.
- `scripts/sprint/routing.js` loads/validates the policy but exposes only `phase <name>` and `validate` commands.
- Grep of `scripts/sprint/{plan,design,execute,release,retrospective}.js` shows zero runtime references to routing — only `retrospective.js` mentions it in a docstring.
- Grep of `.claude/commands/sprint/*.md` shows zero references to `routing`, `model_class`, or `diff_review`.
- Result: the policy is decorative. Drift is undetectable until retro.

### Desired Behavior

- A new `routing.js record` subcommand writes a schema-validated row to `paths.sprintDecisions/routing-trace.jsonl` at every artifact-finalization boundary.
- A new `routing.js check` subcommand verifies a matching trace exists for a given phase/artifact/sprint.
- A new `routing.js coverage` subcommand summarizes per-phase coverage for a sprint and powers the release gate.
- A new `scripts/hooks/sprint-routing-guard.js` blocks `Edit|Write` on sprint artifact paths when no matching trace row exists — honoring an `enforcement.mode: warn|block` knob in the policy (defaults `warn` for soft-rollout).
- Every sprint script calls `routing.js record` at the moment it writes its artifact.
- Each sprint skill body documents the contract.
- Closed/retrospected sprints are exempt; the hook is fail-open when the policy file is missing.
- Single-vendor sessions never hard-fail diff-review — `record` emits `evidence: single_vendor_session` and logs to `paths.decisionLedger`.

## Requirements

- **R-1** routing.js MUST expose `record`, `check`, `coverage` subcommands. Each MUST be self-documented via `--help` and exit with stable codes (0 success, 1 contract violation, 2 bad usage, 3 missing prereq).
- **R-2** Trace rows MUST be append-only JSONL at `paths.sprintDecisions/routing-trace.jsonl`, one row per artifact finalization. Schema `warpos/sprint/routing-trace/v1` at `schemas/sprint/routing-trace.schema.json`.
- **R-3** `record` MUST validate that the supplied `provider:model` belongs to the declared `model_class` for the phase. On mismatch: exit 1 with a fix-up message naming the valid providers for the class.
- **R-4** `record` MUST honor diff_review fallback: when a second vendor is unavailable, write evidence `single_vendor_session`, append a row to `paths.decisionLedger`, and exit 0. Single-vendor users MUST NOT be blocked.
- **R-5** `scripts/sprint/plan.js` MUST call `routing.js record --phase planning` after writing the Plan Contract.
- **R-6** `scripts/sprint/design.js` MUST call `routing.js record --phase design` after writing the requirements bundle.
- **R-7** `scripts/sprint/execute.js` MUST call `routing.js record --phase execution` per ticket finalize AND `--phase qa` / `--phase redteam` per gauntlet pass.
- **R-8** `scripts/sprint/release.js` MUST call `routing.js coverage --sprint <id>` and refuse release (exit non-zero) when any required phase lacks a trace. Optional phases (e.g. `docs_sync`) MUST NOT block release.
- **R-9** `scripts/sprint/retrospective.js` MUST call `routing.js record --phase retrospective` after writing `retro.yaml`.
- **R-10** `scripts/hooks/sprint-routing-guard.js` MUST run on `PreToolUse Edit|Write`, MUST resolve sprint artifact paths via `paths.sprintRoot`, and MUST block writes to a Plan Contract YAML / requirements bundle / retro.yaml / release record when no matching trace row exists — UNLESS `sprint-routing.json#enforcement.mode === "warn"`, in which case it emits a soft warning and proceeds.
- **R-11** A new top-level key `enforcement` in `sprint-routing.json` MUST be added: `{ "mode": "warn" | "block", "rolled_out_at": "<iso8601>", "soft_rollout_until": "<iso8601>" }`. Default at ship time: `mode=warn`, `soft_rollout_until=` ship_date + 7d. When `soft_rollout_until` < now and mode is still `warn`, `/warp:health` MUST surface a yellow advisory.
- **R-12** Sprint skill md files (plan, design, execute, release, retrospective) MUST each gain a `## Routing enforcement` section pointing operators at the CLI surface and explaining the soft-rollout default.
- **R-13** The guard hook MUST exempt sprints with `status: closed` or `status: retrospected` (no retroactive backfill).
- **R-14** The guard hook MUST be fail-open when `paths.sprintRouting` is missing — preserves the policy file's own documented "delete to disable" affordance.

## Non-Goals

- Implementing actual second-vendor diff-review dispatch from sprint scripts. This sprint records the *result*; real dispatch via `runProvider` is deferred.
- Backfilling routing traces for closed sprints (SP-20260512-001 through SP-20260514-001).
- Changing the model_classes list in `sprint-routing.json`.
- Adding cost/token telemetry to trace rows (deferred to follow-up).
- Replacing the sprint-routing.json file with a different schema.

## Affected Surfaces

| Surface | Evidence | Notes |
|---|---|---|
| `.claude/agents/00-alex/.system/policy/sprint-routing.json` | verified_from_repo | Add `enforcement` block; additive — no schema bump per the file's own notes. |
| `scripts/sprint/routing.js` | verified_from_repo | Add `record`, `check`, `coverage` subcommands. |
| `scripts/sprint/plan.js` | verified_from_repo | Call `record --phase planning` after writePlanContract. |
| `scripts/sprint/design.js` | verified_from_repo | Call `record --phase design` after bundle write. |
| `scripts/sprint/execute.js` | verified_from_repo | Call `record --phase execution/qa/redteam` per ticket/gauntlet. |
| `scripts/sprint/release.js` | verified_from_repo | Call `coverage` as gate. |
| `scripts/sprint/retrospective.js` | verified_from_repo | Call `record --phase retrospective` after retro write. |
| `scripts/hooks/sprint-routing-guard.js` | new | New PreToolUse Edit\|Write hook. |
| `.claude/settings.json` | verified_from_repo | Register guard in PreToolUse Edit\|Write chain. |
| `schemas/sprint/routing-trace.schema.json` | new | New schema. |
| `.claude/commands/sprint/{plan,design,execute,release,retrospective}.md` | verified_from_repo | Add `## Routing enforcement` sections. |
| `.claude/project/sprint/decisions/routing-trace.jsonl` | new | New append-only log. |

## External Service Dependencies

None.

## Approval Boundaries

- Adds an entry to `.claude/settings.json` PreToolUse Edit|Write chain. Reversible by removing the entry.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260514-0009.yaml`
- High-level stories: `high-level-stories.md`
- Granular stories: `granular-stories.md`
- COPY: `copy.md`
- INPUTS: `inputs.md`
- TRACE: `trace.md`
- Acceptance criteria: `acceptance-criteria.md`
- QA plan: `qa-plan.md`
- Redteam plan: `redteam-plan.md`
- Release plan: `release-plan.md`
