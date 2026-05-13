# Acceptance Criteria — Harden /warp:update — preflight + transactional apply + postflight verify

**Sprint:** `SP-20260513-005`
**PRD:** `prd.md`

> Each AC is testable. Per-story. Given/When/Then.

## S-1 — Failure-mode mining deliverable

- **AC-S-1.1** — *Given* the sprint design phase is running, *when* the
  designer runs the mining step, *then* `.claude/project/sprint/sprints/SP-20260513-005/failure-mining.md`
  exists, lists at least 8 distinct failure signatures (F-1..F-8), each
  with at least one cited timestamped event or handoff line, and includes
  a coverage map mapping each signature to existing-vs-NEW `check:warpos-*`
  skills.

## S-2 — `scripts/warpos/preflight.js` composes 10 gates

- **AC-S-2.1** — *Given* preflight runs in dry-run mode, *when* all 10
  gates are green, *then* `runPreflight()` returns `{ok:true, gates:
  [10 entries], redCount:0}` AND a single TRACE event
  `warpos.update.preflight phase=preflight-summary ok=true` is emitted
  to `events.jsonl`.

- **AC-S-2.2** — *Given* preflight runs and `capsule-resolvable` returns
  red, *when* the operator invoked `--apply`, *then* `update.js` exits
  non-zero with COPY C-2 printed to stderr AND `runPreflight()` returns
  `{ok:false}` AND NO file in `targetRoot` is written.

- **AC-S-2.3** — *Given* preflight is yellow (e.g. `staleness`), *when*
  the operator passed `--allow-stale`, *then* preflight `ok:true`
  proceeds; *when* `--allow-stale` was NOT passed, *then* preflight
  `ok:false` blocks apply and prints the override flag in the
  remediation field.

## S-3 — NEW gate `check:warpos-capsule-resolvable`

- **AC-S-3.1** — *Given* the capsule `<v>` does not exist in REPO_ROOT
  or any sibling/manifest-hinted clone, *when* the gate runs, *then* it
  returns `status:red` with `reason` listing all searched paths AND
  `remediation` includes the exact `--source <abs-path>` command.

- **AC-S-3.2** — *Given* the capsule exists in `../WarpOS/`, *when* the
  gate runs, *then* it returns `status:green` AND `evidence.resolvedAt`
  is the absolute path to that capsule.

- **AC-S-3.3** — *Given* the capsule's `release.json` exists but is
  malformed JSON, *when* the gate runs, *then* it returns `status:red`
  with `reason="capsule release.json malformed"` AND does NOT throw an
  unhandled exception (gates must not crash preflight aggregator).

## S-4 — NEW gates: `version-quorum`, `install-baseline`, `migration-presence`

- **AC-S-4.1** — *Given* `version.json#version=0.5.0`,
  `framework-manifest.json#version=0.2.2`,
  `framework-installed.json#installedVersion=0.5.0`, *when*
  `check:warpos-version-quorum` runs, *then* it returns `status:red`
  with `evidence.disagreements` listing the per-source values AND
  `remediation` references the "version.json wins" trust order from
  CLAUDE.md.

- **AC-S-4.2** — *Given* `.claude/framework-installed.json` is missing,
  *when* `check:warpos-install-baseline` runs (without `--force-fresh`),
  *then* it returns `status:red` with `remediation` pointing at
  `install.ps1`.

- **AC-S-4.3** — *Given* the capsule's `release.json#migrations` lists
  `migrations/0.4.4-to-0.5.0/01-rename-paths.js` but the file does not
  exist in source, *when* `check:warpos-migration-presence` runs, *then*
  it returns `status:red` with `evidence.missing` listing that file.

## S-5 — Transaction wrapper: pre-apply snapshot

- **AC-S-5.1** — *Given* `--apply` is invoked with preflight green,
  *when* `transaction.begin(txDir, decisions)` runs, *then*
  `<txDir>/header.json`, `<txDir>/plan.json`, AND `<txDir>/snapshot.json`
  exist AND `snapshot.json` matches schema IN-2 with one entry per
  decision in categories {ADD_SAFE, UPDATE_SAFE, GENERATED_REBUILD,
  DELETE_SAFE} (i.e. only categories that will touch the disk).

- **AC-S-5.2** — *Given* an asset's pre-state exists at
  `<targetRoot>/<dest>`, *when* `transaction.begin()` records its
  snapshot entry, *then* `pre_state_sha256` matches
  `sha256(<targetRoot>/<dest>)` AND `backup/<dest>` exists with the
  identical content.

## S-6 — Atomic commit-or-rollback during apply

- **AC-S-6.1** — *Given* apply is mid-loop at decision #7 of 47, *when*
  `fs.copyFileSync` throws on decision #8, *then*
  `rollbackTransaction(txDir, targetRoot)` is invoked AND every file
  recorded in `snapshot.json` with `existed_pre_apply:true` is restored
  from `backup/<dest>` AND every `existed_pre_apply:false` entry
  whose `intended_action` already executed (decisions 1..7 ADD_SAFE)
  is `unlink`ed.

- **AC-S-6.2** — *Given* rollback completes successfully, *when*
  `result.json` is written, *then* `outcome="rolled-back"` AND
  `rollback.restoredCount + rollback.unlinkedCount = #(touched-files-pre-error)`
  AND the process exits with code 1.

- **AC-S-6.3** — *Given* rollback itself encounters an error (e.g.
  permission denied on a backup), *when* the failure occurs, *then* the
  process writes `<txDir>/diagnostics.log` with the rollback partial
  state, sets `outcome="rollback-partial"` in `result.json`, emits TR-3
  with `partial:true`, AND surfaces COPY C-7 with the partial-rollback
  warning.

## S-7 — `postflight.js` composes 5 checks + evidence package

- **AC-S-7.1** — *Given* commit completed, *when* `runPostflight()`
  runs, *then* all 5 checks in R-20 execute (in order), each producing a
  `{name, status, evidence}` record matching IN-3, AND
  `<txDir>/evidence/postflight.json` is written with the aggregate.

- **AC-S-7.2** — *Given* `path-resolution` returns red, *when* postflight
  emits TR-5, *then* `data.redCount >= 1` AND `data.operatorAction ===
  "review-then-decide"` AND the process exits 0 (postflight does NOT
  auto-rollback) UNLESS `--strict-postflight` was passed.

- **AC-S-7.3** — *Given* `--strict-postflight` was passed, *when*
  postflight surfaces any red, *then* the process exits non-zero AND a
  `--rollback <txId>` hint appears in stderr.

## S-8 — Postflight integrates `provider-smoke` (SP-002) as external check

- **AC-S-8.1** — *Given* `paths.providerSmokeSkill` is NOT registered in
  `.claude/paths.json` (SP-002 not yet shipped), *when* postflight runs,
  *then* the `provider-smoke` check records
  `status:"degraded" reason:"provider-smoke skill not yet shipped"` AND
  postflight `ok` is not affected (degraded is informational).

- **AC-S-8.2** — *Given* `paths.providerSmokeSkill` is registered AND
  resolves to a valid `node <script>.js` path, *when* postflight runs,
  *then* the script is spawned, its exit code is interpreted (0=green,
  non-zero=red), AND its stdout is captured into `evidence.stdout`
  (truncated to 4096 bytes).

## S-9 — Cross-version replay test bench (smoke)

- **AC-S-9.1** — *Given* a synthetic clean install fixture exists under
  `runtime/qa-warp-update/clean-0.1.2/` matching the 0.1.2 capsule,
  *when* `node scripts/warpos/test-cross-version-replay.js` runs, *then*
  it invokes `update.js --to 0.5.0 --apply` against the fixture AND
  asserts preflight ok, commit ok, postflight ok, AND exits 0.

- **AC-S-9.2** — *Given* the same fixture but `framework-manifest.json`
  is hand-mutated to claim `version=0.2.2` (version drift), *when* the
  test bench runs, *then* preflight fails with `version-quorum` red AND
  the test asserts `exit code === 1` (preflight blocked the apply).

## S-10 — `/warp:update.md` procedure update + troubleshooting

- **AC-S-10.1** — *Given* the updated `.claude/commands/warp/update.md`,
  *when* an operator reads the "Procedure" section, *then* it documents
  preflight phase (with the 10-gate list), transaction phase (with txDir
  location), postflight phase (with the 5-check list AND SP-002
  dependency annotation), AND the override flags
  `--allow-stale`, `--force-fresh`, `--strict-postflight`, `--rollback`.

- **AC-S-10.2** — *Given* the same file, *when* an operator reads the
  "Troubleshooting" section, *then* it includes one entry per failure
  signature F-1..F-9 from failure-mining.md, each with: symptom,
  diagnosis (which gate catches it), and remediation command.

## S-11 — Failure event schema + emission

- **AC-S-11.1** — *Given* a full `--apply` run with preflight red on
  `capsule-resolvable`, *when* the run completes, *then* exactly 11
  events are appended to `events.jsonl`: 10 per-gate `warpos.update.preflight`
  events + 1 aggregate `warpos.update.preflight phase=preflight-summary`
  event. No transaction events, no postflight events (apply was blocked
  before transaction.begin()).

- **AC-S-11.2** — *Given* a full `--apply` run with green preflight,
  commit, and red postflight, *when* the run completes, *then* the
  events emitted are: 10+1 preflight events, 1 transaction.start, 1
  transaction.commit, 5+1 postflight events (one per check + one
  aggregate), 1 evidence event. Total 19 events. All share the same
  `txId` field.
