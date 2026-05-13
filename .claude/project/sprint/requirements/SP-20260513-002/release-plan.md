# Release Plan — WarpOS install/update provider smoke test + RCA

**Sprint:** `SP-20260513-002`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\prd.md`

> Honored by `/sprint:release`. Lists the conditions under which the
> sprint may ship.

## Required to ship

- [ ] All `done` tickets meet their AC.
- [ ] All blocking issues are resolved, deferred, or explicitly accepted.
- [ ] PRD requirements R-1 through R-8 satisfied with evidence linked from tickets.
- [ ] COPY satisfied per `copy.md` (visual golden output snapshots match).
- [ ] INPUTS satisfied per `inputs.md` (validation tests pass for IN-1 through IN-6).
- [ ] TRACE entries fire as documented in `trace.md` (event-log assertions in S-7 tests).
- [ ] Acceptance criteria satisfied per `acceptance-criteria.md` (S-1 through S-8).
- [ ] QA plan passing per `qa-plan.md` (all 7 personas applied).
- [ ] Redteam plan passing per `redteam-plan.md` (RT-1 through RT-6).
- [ ] External service dependencies — none (confirmed).
- [ ] Required env vars — none added. `GEMINI_CLI_TRUST_WORKSPACE` consumed only inside an autofix recipe; never written to operator's profile.
- [ ] Release approval recorded in `approvals/`.

## Ship-gate scenarios (must all pass)

### Scenario A — Synthetic clean install + all green

- [ ] Fresh project dir, all three CLIs present + authenticated.
- [ ] `/warp:setup` runs to completion.
- [ ] Final smoke output is GREEN, exit 0.
- [ ] `paths.eventsFile` contains exactly one `type: "smoke"` event with `verdict: "green"`, three `type: "probe"` events, zero `type: "rca"`, zero `type: "autofix"`.

### Scenario B — Synthetic clean install with one red

- [ ] Fresh project dir, gemini CLI absent.
- [ ] `/warp:setup` runs.
- [ ] Smoke output is YELLOW (cli_missing is yellow per `provider-health-check.js` taxonomy) with explicit install command shown.
- [ ] Setup exits 0 (yellow non-fatal by default).
- [ ] Re-running with `--exit-on-yellow` exits 2.

### Scenario C — Drift install: update from 0.5.0 to 0.5.1 capsule with codex red

- [ ] Project at 0.5.0, simulate codex auth_missing.
- [ ] Publish a 0.5.1 capsule whose `release.json#postUpdateChecks` ends with `node scripts/warpos/provider-smoke.js …`.
- [ ] `/warp:update --to 0.5.1 --apply` runs.
- [ ] Update applies disk artifacts BUT the post-update smoke step returns RED, update exits non-zero, the C-2 RED message prints.
- [ ] (Optional — see SP-005 coupling) `/warp:update --rollback` reverts to 0.5.0.

### Scenario D — Catalog-poisoning attempt

- [ ] PR diff that flips an auth-mutating entry from `safe_to_autofix: false` to `true` is rejected by the catalog-lint unit test (RT-2 / RT-6).

### Scenario E — Windows stdin-bug regression

- [ ] AC-8.1 + AC-8.2 both pass on a Windows runner (or simulated via `process.platform = "win32"` mock + dispatch-route-guard).

## Release artifacts

- [ ] Changelog / release notes drafted — note that `/warp:install` and `/warp:update` now run provider smoke as their terminal step. Yellow is non-fatal by default; red blocks.
- [ ] Docs updated — `.claude/commands/warp/setup.md` and `.claude/commands/warp/update.md` reflect the new terminal step.
- [ ] Analytics/events updated — `paths.eventsFile` gets a new `cat: "provider-smoke"` category. `/maps:tools` registry refreshed to include the new orchestrator + lib files.
- [ ] Migration plan — none required (additive; no breaking change). Capsules ≥0.5.0 will be updated to include the smoke postUpdateCheck.
- [ ] Rollback plan — if a smoke run incorrectly blocks an update in the wild, operator can re-run `/warp:update --to <version> --apply --skip-postUpdateChecks` (existing flag in `update.js`; verify before ship). Forward fix is a catalog patch + capsule re-issue.

## Monitoring after release

- [ ] Watch `/check:patterns` for spikes in `cat: "provider-smoke" type: "smoke" verdict: "red"` events in the first 7 days after release.
- [ ] Watch for accumulation of `catalog_entry_key: "unknown_error"` `type: "rca"` events — indicates uncovered status. Each occurrence triggers a follow-up catalog patch.

## SP-002 ↔ SP-005 release coordination

SP-005 (harden /warp:update) is expected to ship AFTER SP-002 and to COMPOSE smoke into its postflight + rollback decision tree. SP-005 MUST consume `provider-smoke.js --json` output unchanged. If SP-005 needs a new field, SP-002's JSON schema (`warpos/provider-smoke/v1`) is bumped to v2 by SP-005, not by SP-002. SP-002 promises:

- Stable CLI: `--providers`, `--probe`, `--exit-on-yellow`, `--no-autofix`, `--json` (IN-1 through IN-5).
- Stable JSON schema: `{ verdict, results[], rca[], autofixes[], schema: "warpos/provider-smoke/v1" }`.
- Stable exit codes: 0 green, 0 yellow (unless --exit-on-yellow), 1 catalog/internal error, 2 red.

### Explicit overlap boundary (file-level)

Both SP-002 and SP-005 may touch `scripts/warpos/update.js` and `.claude/commands/warp/update.md`. The boundary is by **layer**, not by file:

- **SP-002 owns:** declaring `provider-smoke` as an entry in `framework/releases/*/release.json#postUpdateChecks` (R-1), and documenting the new terminal step in `.claude/commands/warp/update.md` user-facing prose (C-2 wording). SP-002 does NOT modify `update.js` core (the `runPostUpdateChecks` loop already exists and is reused unchanged).
- **SP-005 owns:** the transaction wrapper, preflight gate, postflight orchestrator chain, and rollback decision tree inside `update.js`. SP-005 may rewrite the post-update orchestration glue, but it MUST keep the per-check execution contract (`{ check, status, exitCode, stderr }`) and the `--json` consumption surface unchanged.
- **Merge protocol:** if SP-002 lands first, SP-005 rebases on top — its postflight chain composes the smoke entry as the terminal check. If SP-005 lands first, SP-002's `release.json` edits append to whatever postUpdateChecks shape SP-005 ships, provided the shell-string format is preserved. Whichever lands second runs `node scripts/warpos/release-gates.js` plus an end-to-end `/warp:update --to <next> --apply` on a synthetic capsule to confirm both paths still fire.
- **DO NOT in this sprint:** modify `runPostUpdateChecks`, `applyUpdateDecisions`, `writeTransactionPlan`, or any transaction/rollback function in `update.js`. Those are SP-005's lane. If a real bug is discovered in those functions during SP-002 execute, log it as a recurring issue (`/issues:log`) and surface to SP-005's queue instead of patching here.

## Approval

Production deploy requires explicit user approval per `CLAUDE.md#Autonomy`. Record the approval id in `releases/<id>.yaml#approval_ref`. Approval boundary 1 (release-gate fixture edits) and boundary 2 (auto-fix risk) explicitly named in PRD.

## Documentation scaling

Required for `documentation_scale: m | l | xl`. For xs/s, ship-gate may be a single block inside the QA plan.
