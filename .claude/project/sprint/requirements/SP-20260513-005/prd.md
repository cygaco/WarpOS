# PRD — Harden /warp:update — preflight + transactional apply + postflight verify

**Sprint:** `SP-20260513-005`
**Plan Contract:** `PC-20260513-0006`
**Status:** designed
**Documentation scale:** `l`

## Outcome

Operator runs `/warp:update` on a downstream project and trusts the
outcome: either the update completes cleanly with structured evidence
(manifest honesty, path resolution, providers, structure parity), or it
stops before damaging anything and tells the operator exactly what to fix.

## Evidence base

This PRD is grounded in the failure-mode mining catalog at
`.claude/project/sprint/sprints/SP-20260513-005/failure-mining.md` (mined
from 7 handoff files and 954 update-keyword events over the past 30 days).
Eight distinct failure signatures (F-1..F-9) plus the meta-class F-10
(trust loss) drive the requirements below.

## Context

### Original Request

> I am scared to update other projects to newer versions because there is
> always issues and tons of troubleshooting. Harden updating.

### Interpreted Intent

Reduce the failure rate (and emotional cost) of `/warp:update` when
applied to downstream projects. Identify recurring failure modes from
session + event history, add preflight gates that prevent unsafe applies,
wrap the apply phase transactionally with rollback on any failure, and
verify the install postflight before declaring success.

### Current behavior

`scripts/warpos/update.js` was rewritten across 0.1.2 → 0.5.0 to fix
`sourceTreeRoot`, migrations execution, `postUpdateChecks` execution,
`MERGE_SAFE` semantics, and a transaction-record stub (lines 336-369).
Ten `check:warpos-*` skills exist as standalone diagnostics but are not
composed into the update lifecycle. The operator's verbatim experience
("<verbatim operator prompt withheld — profane>",
events.jsonl line 918, 2026-05-12) confirms the gates exist as skills
but are not gating the update.

### Desired behavior

`/warp:update` runs three phases:

1. **Preflight** — compose 10 `check:warpos-*` gates (7 existing + 3 NEW).
   Refuse to apply if any gate blocks. Print exact remediation per gate.
2. **Transactional apply** — extend the existing transaction stub.
   Pre-apply snapshot of every file that will be touched, apply, validate,
   commit-or-rollback on failure.
3. **Postflight verifier** — compose `/warp:health` rollup +
   `provider-smoke` (when SP-002 ships) + path-resolution +
   manifest-honesty + applied-migrations. Failures surface an evidence
   package; do not auto-rollback (postflight is diagnosis).

## Requirements

### Preflight gate composer

- **R-1** — `scripts/warpos/update.js` gains a `runPreflight(opts)` phase
  invoked before `applyUpdateDecisions()` in both dry-run and apply paths.
  Preflight runs 10 gates in fail-fast order. (covers F-1..F-8 per
  `failure-mining.md` coverage map.)

- **R-2** — Preflight gate `check:warpos-install-baseline` (NEW). Refuses
  apply if `framework-installed.json` is missing or version is `0.0.0` and
  `--force-fresh` was not passed. Surfaces COPY C-1. (covers F-4.)

- **R-3** — Preflight gate `check:warpos-capsule-resolvable` (NEW). Walks
  `[REPO_ROOT, ../WarpOS, ../warpos, manifest.json#warpos.source,
  framework-installed.json#source]` for `framework/releases/<v>/release.json`.
  If unresolvable, prints (a) the locations searched, (b) the available
  versions in each existing location, (c) the `--source <path>` fix.
  Surfaces COPY C-2. (covers F-1, partial F-2.)

- **R-4** — Preflight gate `check:warpos-version-quorum` (NEW). Cross-checks
  `version.json#version`, `.claude/framework-manifest.json#version`,
  `.claude/framework-installed.json#installedVersion`, and any script-header
  constants in `scripts/warpos/install.ps1`. If any two disagree, fail with
  a per-source value table. Surfaces COPY C-3. (covers F-3.)

- **R-5** — Preflight gate composition wraps `check:warpos-manifest-honesty`
  (existing) and exposes its findings in the unified preflight report.
  (covers F-3.)

- **R-6** — Preflight gate composition wraps `check:warpos-staleness`
  (existing). Refuses apply if installed-vs-canonical drift exceeds the
  staleness threshold AND `--allow-stale` was not passed. (covers F-3.)

- **R-7** — Preflight gate composition wraps `check:warpos-path-resolution`
  (existing) at preflight. Refuses apply if any `paths.json` key resolves
  to a non-existent path in current state. (covers F-6 pre-state.)

- **R-8** — Preflight gate composition wraps
  `check:warpos-structure-parity` (existing). Refuses apply if required
  framework skeleton dirs are absent. (covers F-7.)

- **R-9** — Preflight gate composition wraps
  `check:warpos-applied-migrations` (existing). Refuses apply if leftover
  migration scripts are present on disk from a prior partial apply.
  (covers F-5 cleanup side.)

- **R-10** — Preflight gate `check:warpos-migration-presence` (NEW). For
  each `release.json#migrations[]` entry in the requested capsule, verify
  the migration file exists in the source tree. Refuse apply if any are
  missing. Surfaces COPY C-4. (covers F-5 capsule-integrity side.)

- **R-11** — Preflight gate composition wraps
  `check:warpos-tracked-transients` (existing). Refuses apply if the
  capsule contains transient state patterns (`.warpos/`, `qa-*.png`,
  `runtime/qa-*/`). (covers F-8.)

- **R-12** — Preflight aggregator emits a single TRACE event
  `warp-update-preflight` (TR-1) with per-gate `{name, status, reason,
  remediation}` shape (see INPUT IN-1).

### Transactional apply

- **R-13** — `scripts/warpos/update.js` extends the existing transaction
  stub. Before any write, the transaction directory at
  `<targetRoot>/.warpos/transactions/<txId>/` records a manifest of every
  file that will be touched (write, delete, rename) — INPUT IN-2.

- **R-14** — Each touched file's pre-state is backed up to
  `<txDir>/backup/<rel-path>` (existing `backupFile` extended).
  For deletes, content is preserved. For new ADD_SAFE files, the backup
  manifest records `"existed_pre_apply": false` so rollback can `unlink`.

- **R-15** — Apply is wrapped in a try/catch. On ANY thrown error during
  copy/delete/migration: emit `warp-update-transaction-rollback` event
  (TR-3), invoke `rollbackTransaction(txDir, targetRoot)` which restores
  every backed-up file and `unlink`s every ADD_SAFE write that completed
  before the error, write `result.json` with `outcome:"rolled-back"`, and
  exit non-zero.

- **R-16** — Successful apply emits `warp-update-transaction-commit`
  (TR-2) with the transaction id and the per-category counts. The
  `result.json` records `outcome:"committed"`.

- **R-17** — Transaction id schema follows existing format
  (`<iso-ts>-warp-update-<basename(target)>`) — already implemented at
  `update.js:338-341`, retained.

- **R-18** — Rollback semantics are FILE-LEVEL, ADVISORY git-handling. The
  rollback restores files in `.warpos/transactions/<txId>/backup/`; it does
  NOT run `git reset`. The transaction's `ROLLBACK.md` advises operator
  on git-side remediation. (See `failure-mining.md` constraint #2.)

### Postflight verifier

- **R-19** — After successful commit, `update.js` invokes a
  `runPostflight(targetRoot, capsule)` phase. Failures DO NOT auto-rollback
  (postflight is diagnostic), but they surface the option `--rollback` for
  the operator.

- **R-20** — Postflight composes (in order):
  (a) `check:warpos-manifest-honesty` post-state
  (b) `check:warpos-path-resolution` post-state
  (c) `check:warpos-applied-migrations`
  (d) `provider-smoke` when SP-002's skill ships, recorded as
      `status:degraded reason:"provider-smoke skill not yet shipped"`
      otherwise
  (e) `/warp:health` rollup as the final overview

- **R-21** — Postflight emits a TRACE event `warp-update-postflight`
  (TR-4) and writes an evidence package
  (`<txDir>/evidence/postflight.json`) per INPUT IN-3.

### Failure event schema

- **R-22** — All emit events follow the shape defined in INPUT IN-1
  and TRACE TR-1..TR-6. Events go to `paths.eventsFile` via the standard
  `logger.js` helper. Categories: `warpos.update.preflight`,
  `warpos.update.transaction.start`, `warpos.update.transaction.commit`,
  `warpos.update.transaction.rollback`, `warpos.update.postflight`,
  `warpos.update.evidence`.

### Error messaging

- **R-23** — Every preflight gate failure prints (a) the gate name,
  (b) the failure reason in plain English, (c) the exact next command to
  run to remediate. See `copy.md` C-1..C-10.

- **R-24** — Failures NEVER print stack traces to stdout by default.
  Stack traces go to `<txDir>/diagnostics.log`. `--debug` prints them
  inline.

### Dry-run-by-default + safety

- **R-25** — Dry-run remains the default (matches existing `update.md`
  documentation). Preflight runs in dry-run too — operator sees what
  WOULD block before they `--apply`.

- **R-26** — `--apply` without preflight passing is refused (no
  `--skip-preflight` flag in MVP). Operator must remediate or pass
  explicit gate-specific overrides (`--allow-stale`, `--force-fresh`).

- **R-27** — Postflight failures are reported but do not block exit
  unless `--strict-postflight` is passed.

- **R-28** — No new env vars, no new external services, no new package
  dependencies. All gates are pure-Node + filesystem.

### Cross-version safety

- **R-29** — Cross-version replay: a single `/warp:update --to <v>` from
  versions where `(installedVersion, v)` skips intermediate capsules MUST
  still resolve and run the full migration chain. Validated by QA cross-
  version replay bench (S-9).

## Non-Goals

- Rewriting `update.js` from scratch (it was just rewritten in 0.5.0).
- Building a UI for updates.
- Auto-applying without operator consent.
- Removing dry-run-by-default behavior.
- Implementing a real three-way merge for `MERGE_CONFLICT` (separate
  sprint).
- Building the migration-replay test bench at full coverage (deferred per
  Plan Contract `expanded` scope; MVP ships a single cross-version smoke).
- Building a recurring-failure dashboard (deferred per Plan Contract).
- Implementing git-aware rollback (deferred — file-level + advisory only).
- Designing `provider-smoke` itself (SP-002's deliverable).

## Affected Surfaces

| Surface | Evidence Level | Notes |
|---|---|---|
| `scripts/warpos/update.js` | verified_from_repo | extend, do not rewrite |
| `scripts/warpos/migrations-loader.js` | verified_from_repo | read-only; verify presence |
| `scripts/warpos/release-gates.js` | verified_from_repo | gated extension via approval |
| `.claude/commands/warp/update.md` | verified_from_repo | procedure docs |
| `framework/releases/*/release.json` | verified_from_repo | `postUpdateChecks` declaration shape |
| `.claude/framework-installed.json` | verified_from_repo | per-machine snapshot |
| `.claude/commands/check/warpos-install-baseline.md` | NEW | preflight gate skill |
| `.claude/commands/check/warpos-capsule-resolvable.md` | NEW | preflight gate skill |
| `.claude/commands/check/warpos-version-quorum.md` | NEW | preflight gate skill |
| `.claude/commands/check/warpos-migration-presence.md` | NEW | preflight gate skill |
| `scripts/warpos/preflight.js` | NEW | preflight composer |
| `scripts/warpos/postflight.js` | NEW | postflight verifier |
| `scripts/warpos/transaction.js` | NEW or extracted | transaction wrapper |
| `.claude/project/events/events.jsonl` | verified_from_repo | TRACE sink |

## External Service Dependencies

Plan Contract `external_service_dependencies.status: none_expected`.
**None required.** See `.claude/project/sprint/external-services/` (empty
for this sprint).

## Approval Boundaries

Per Plan Contract `approval_boundaries`:

1. **Architectural change to the release/update flow** — Class B/C →
   approval AP-20260513-007 (transactional-apply architecture).
2. **Adding gates that could block legitimate updates** — false-positive
   risk surfaced in red-team plan; gate-by-gate override flags
   (`--allow-stale`, `--force-fresh`) mitigate. No separate approval.
3. **Rollback behavior — must itself be reversible** — file-level rollback
   keeps backups in `<txDir>/backup/` indefinitely; operator can re-apply
   from backup. Covered by AP-20260513-007.
4. **Touching `release-gates.js`** — Class B → approval AP-20260513-008
   (conditional — waived if implementation doesn't need to modify
   release-gates.js).

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260513-0006.yaml`
- Failure mining: `.claude/project/sprint/sprints/SP-20260513-005/failure-mining.md`
- High-level stories: `high-level-stories.md`
- Granular stories: `granular-stories.md`
- COPY: `copy.md`
- INPUTS: `inputs.md`
- TRACE: `trace.md`
- Acceptance criteria: `acceptance-criteria.md`
- QA plan: `qa-plan.md`
- Redteam plan: `redteam-plan.md`
- Release plan: `release-plan.md`
