# WarpOS 0.9.0 — Install Pipeline Reliability Checkpoint

**Released:** 2026-05-23

## Theme

End-to-end install pipeline trust. Every install/update path now has:

- Snapshot rollback (filesystem-based, works on dirty repos)
- Dry-run gating (writes refused without explicit `--apply`)
- 5-scenario CI regression matrix (catches breakage in 18s)
- Per-file status reporting (`added` / `repaired` / `unchanged` / `conflict`)
- Idempotency (identical content → no copy, "unchanged" status)
- Versioned migrations (skip already-applied on retry)
- userModified tracking (operator customizations persist across updates)
- release-build refuses stale manifest (closes the ghost-files class at the source)
- `.claude/manifest.json` always-present + graceful absence handling in 4 callers

## Shipped this release

### SP-20260524-001 — Install fixture CI matrix
5-scenario regression test suite at `scripts/warpos/test-install-matrix.js`:

- **Scenario 1** — clean_install: warp-setup against empty fixture; assert `.claude/` framework files present + manifest sane + settings hooks block.
- **Scenario 2** — existing_install_upgrade: seeded install → cross-version dry-run; assert classifier walks transition + side-effect-free.
- **Scenario 3** — dirty_uncommitted_preserved: operator-edit a hook file → update refuses with Class C; assert edit untouched + apply refused.
- **Scenario 4** — multi_version_upgrade: dry-run chain N→N+1→N+2; no transactions written; capsule synth helper unit-tested.
- **Scenario 5** — user_overrides_preserved: settings.local.json + permissions overrides survive cross-version dry-run.

Meta-test injection mode (`--inject-regression <name>`) verifies the matrix actually catches regressions. 4 named injections: `delete_settings_json`, `break_framework_installed_version`, `strip_hooks_block`, `corrupt_settings_local`. All 4 caught by the matrix.

AC-10.2 boundary guard refuses injections targeting paths outside the active fixture root.

Wire-in: `paths.testInstallMatrix` registered. 5/5 scenarios pass in 18 seconds.

### SP-20260524-002 — release-build stale-manifest refusal + manifest cleanup

**T-183 closed:** `scripts/warpos/release-build.js` now runs `generate-framework-manifest.js --check` before snapshotting. Stale manifest → exit 2 with remediation. Bypass with `--skip-manifest-check` for emergency rebuilds.

**Manifest always-present:** confirmed warp-setup creates `.claude/manifest.json` at every install. 4 hardcoded callers (`scripts/agents/cli.js test --all`, `scripts/manifest/cli.js`, `scripts/dispatch/manifest-patch.js`, `scripts/delta-canonical-dispatch-smoke.js`) now emit actionable error messages naming `/warp:setup` as the fix. `manifest-patch.js#readManifest` upgraded to throw typed errors (MANIFEST_MISSING / MANIFEST_UNREADABLE / MANIFEST_INVALID) so callers can react instead of crashing on raw ENOENT.

### SP-20260524-003 — Per-file install status reporting + idempotency

`update.js#applyUpdateDecisions` now emits `perFile: [{dest, status, category}]` for every decision. Status enum:

- `added` — ADD_SAFE executed
- `repaired` — UPDATE_SAFE executed (content actually changed)
- `unchanged` — UPDATE_SAFE detected source == target byte-equality, copy skipped (idempotency optimization)
- `conflict` — MERGE_CONFLICT held, operator must resolve
- `deleted` / `delete_skipped` — DELETE_SAFE outcomes
- `local_only` / `local_customized` — operator-owned territory
- `delete_conflict` — was installed but locally missing
- `skipped` / `error` — fallthrough cases

Human CLI: prints `Apply: added=X repaired=Y unchanged=Z conflict=W ...` then a `Per-file:` section (top 20 interesting; `--verbose-files` for all).

JSON: `apply.perFile` round-trips through `commitTransaction` to `result.json` for downstream consumers.

### SP-20260524-004 — Versioned migrations + userModified tracking

**Versioned migrations:** `framework-installed.json` gains `migrationsApplied: string[]`. `migrations-loader.js#applyAll` accepts `ctx.alreadyApplied` set and skips already-applied ids (reason: `already_applied`). `update.js#runMigrations` reads the set from snapshot, writes `newlyApplied` back after success. Closes the "mid-chain failure re-runs successful migrations on retry" bug class.

**userModified tracking:** `framework-installed.json` gains `userModified: string[]` populated from classifier MERGE_CONFLICT + LOCAL_CUSTOMIZED decisions. Monotonic across runs (prior entries preserved; explicit reset path TBD via possible `/warp:reset-customization` CLI).

## Settings flip (out-of-batch, same release window)

Live canonical `.claude/settings.json` regenerated from layered sources via `compile.js`. 7 empty matchers normalized to `"*"` (verified semantically equivalent per Claude Code hook docs). 3 operator-local permissions unioned from `settings.local.json`. 4 provenance fields added. 51/51 settings tests pass.

## Pre-existing infrastructure verified

Two install-reliability items were already shipped pre-0.9.0 and re-verified this release:

- **SP-20260513-005** — Rollback snapshot for `/warp:update`. `scripts/warpos/transaction.js` writes pre-apply backups in `.warpos/transactions/<txId>/backup/`. R-31 atomic snapshot hash, R-32 active.lock, R-33 fast preflight re-run, R-34 override pass-through. Auto-rollback on apply failure. Manual `/warp:update --rollback <txId>` CLI.
- **SP-20260513-005** — `/warp:update --dry-run` gating. `update.js:741-847` — dryRun gate returns early before any apply / preflight / transaction begin.

## Cross-cutting findings

- **`_warpos/` install-model gap** — install matrix scenario 1 surfaced that `warp-setup.js` doesn't copy `_warpos/` to downstream products (it's a canonical-side framework source-of-truth zone). The layered settings compiler (which needs `_warpos/settings/defaults.json`) therefore doesn't run downstream — operators continue to edit `.claude/settings.json` directly there. Architectural question parked for future architecture sprint.
- **Cross-version --apply needs historical-source-tree fixtures** — capsules at version N expect source matching N; current source has drifted. Matrix scenarios 2, 4, 5 deliberately use dry-run for cross-version. Real cross-version --apply testing requires `git worktree` checkouts at historical tags — future-sprint extension.

## What's next (post-0.9.0)

- `/warp:update --dry-run + diff` enhancement (file-level diffs in preview, polish on top of existing dry-run)
- Maintainer canonical scrub orchestration (operator-scoped; create private WarpOS-as-product repo)
- `/sprint:full` Beta consultation honesty (design work needed)
- Spec-propagation closer
- team-guard tiered allowlist
- `--branch` default for installer

See ROADMAP.md for the full Sprint 11+ candidates list.
