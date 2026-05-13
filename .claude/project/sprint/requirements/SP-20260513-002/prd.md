# PRD — WarpOS install/update provider smoke test + RCA

**Sprint:** `SP-20260513-002`
**Plan Contract:** `PC-20260513-0003`
**Status:** draft
**Documentation scale:** `m`

## Outcome

After install or update the operator knows immediately whether every required provider works; failures are diagnosed (not just reported) and fixed when possible without manual troubleshooting.

## Context

### Original Request

> If we don't already have it, a quick smoke test on warpos install and update to verify that all the models/providers work in a project, and if they don't, to do root cause analysis and fix it.

### Interpreted Intent

Wire the existing provider-health primitive into `/warp:install` and `/warp:update` lifecycles as a smoke gate; on red/yellow status, run an RCA that maps the failure status to a known root cause and applies an auto-fix when safe, else prints explicit remediation.

### Current Behavior

`scripts/warpos/provider-health-check.js` exists and is invoked by `/warp:health` and `/warp:setup`. It classifies green/yellow/red with one-line suggestions but does NOT run RCA or auto-fix. The script currently `process.exit(0)` unconditionally regardless of verdict (lines 93-97), so red findings cannot gate any lifecycle today. `/warp:update` has `postUpdateChecks` support per `framework/releases/*/release.json` but provider-smoke is not currently declared as one. There is no single failure-mode catalog mapping status codes to root causes + safe-fix flags.

### Desired Behavior

`scripts/warpos/provider-smoke.js` (new orchestrator) runs as a terminal step of `/warp:install` and `/warp:update` and is invokable standalone. It calls `probeAll` from `scripts/hooks/lib/provider-health.js`, then for each non-green status looks up a `root_cause` + `fix_recipe` + `safe_to_autofix` flag in a new `provider-failure-modes.json` catalog. Safe fixes run automatically; unsafe failures print explicit one-line remediation. Exit code 0 on green, 0 on yellow (warn), non-zero on red (block lifecycle). Every smoke run logs to `paths.eventsFile` as `type=provider-smoke`.

### Evidence-mined failure signatures (last 30 days)

| Signature | Source | Notes |
|---|---|---|
| `cli_missing` (codex, gemini) | `scripts/hooks/lib/provider-health.js` L227-239 | already classified; `which/where` fails |
| `auth_source_mismatch` (Gemini OAuth vs `GEMINI_API_KEY`) | L242-258; encoded in `provider-fallback.json#do_not_fall_back` | explicit do-not-auto-fix per policy |
| Windows cmd.exe stdin bug (codex idles on piped input) | LRN-2026-04-17-n + LRN-2026-04-30 binding-gap; `.claude/project/reference/cross-provider-dispatch.md`; `dispatch-route-guard` blocked 2x in `events.jsonl` (s-nguua4 mp1q2cm7/mp1q4gbb) | manifests as `provider_timeout` on probe |
| `stale_cli_registry` / `model_not_found` | L115-122; common with gemini-3.x rollout | suggestion already says "upgrade CLI" |
| `trusted_directory_required` (Gemini) | L102-114; observed in moketest (`GEMINI_CLI_TRUST_WORKSPACE=true` workaround at events mp1n3fyw) | safe to autofix via env-var wrapper |
| `quota_exhausted` / `free_tier_limit_zero` | L124-144 | not safe to autofix — user must wait or change tier |
| `auth_missing` | L146-156; L165-174 | safe to surface `login` recipe; user must run interactively |
| `provider_timeout` | L268-277 | retry once with backoff; if still red, surface |

(Mining note: `recurring-issues.jsonl` does not yet exist at `paths.recurringIssuesFile` — issues:log was scaffolded but no provider entries persisted. Catalog therefore seeded from `provider-health.js` statuses plus cross-provider-dispatch.md evidence.)

## Requirements

> Sprint-scope PRD. Uses `R-N` ids per `scripts/hooks/requirement-format-guard.js`.

- `R-1` — `provider-smoke` declared in every `framework/releases/*/release.json#postUpdateChecks` (forward) so `/warp:update` runs it as a terminal post-update check.
- `R-2` — `/warp:install` and `/warp:setup` call `node scripts/warpos/provider-smoke.js --providers <required>` as their final step before declaring install complete.
- `R-3` — Failure-mode catalog at `.claude/agents/00-alex/.system/policy/provider-failure-modes.json` (schema `warpos/provider-failure-modes/v1`) maps every `provider-health.js` status → `{ root_cause, fix_recipe, safe_to_autofix, remediation, fallback_allowed }`.
- `R-4` — RCA module `scripts/warpos/lib/provider-rca.js` exports `rca(probeResult) → catalogEntry`. Pure function, no I/O. Loads catalog once per process. Unknown status falls through to a default `unknown_error` entry.
- `R-5` — Auto-fix dispatcher `scripts/warpos/lib/provider-autofix.js` runs only entries with `safe_to_autofix: true`. After applying a fix it re-probes that provider once. If the re-probe is still non-green, do NOT loop — surface the original status and the fix attempt outcome. (Cycle prevention.)
- `R-6` — Every smoke run appends one event to `paths.eventsFile` via `lib/logger.js` with `cat: "provider-smoke"`, `type: "smoke"|"rca"|"autofix"`, `verdict`, `provider`, `status`, `root_cause`, `autofix_applied`, `autofix_success`.
- `R-7` — Exit code semantics: `0` = all green, `0` = yellow-only (unless `--exit-on-yellow` passed), `2` = at least one red required-provider after autofix. `1` reserved for catalog-load failure / internal error.
- `R-8` — Cross-platform: smoke must not re-introduce the Windows cmd.exe stdin bug (LRN-2026-04-17-n / LRN-2026-04-30 binding-gap). All provider probes inside smoke go through `probeAll` from `provider-health.js` (which uses `execSync` with explicit `stdio: ["pipe","pipe","pipe"]` and timeout); smoke does NOT shell out to `codex exec` / `gemini -p` directly. The `dispatch-route-guard` hook continues to block any regressions.

## Non-Goals

- Installing provider CLIs for the operator (we surface the install command).
- Changing the operator's auth method (Gemini OAuth ↔ API key — never auto-switched; `auth_source_mismatch` is `safe_to_autofix: false` by policy).
- Continuous monitoring (this is a smoke test invoked at install/update boundaries, not a watchdog).
- Cross-provider feature parity.

## Affected Surfaces

| Surface | Evidence Level |
|---|---|
| `scripts/warpos/provider-health-check.js` | verified_from_repo |
| `scripts/hooks/lib/provider-health.js` | verified_from_repo |
| `scripts/warpos/update.js` (postUpdateChecks loop) | verified_from_repo |
| `.claude/commands/warp/setup.md` | verified_from_repo |
| `.claude/commands/warp/update.md` | verified_from_repo |
| `.claude/agents/00-alex/.system/policy/provider-fallback.json` | verified_from_repo |
| `.claude/agents/00-alex/.system/policy/provider-failure-modes.json` (NEW) | proposed |
| `scripts/warpos/provider-smoke.js` (NEW) | proposed |
| `scripts/warpos/lib/provider-rca.js` (NEW) | proposed |
| `scripts/warpos/lib/provider-autofix.js` (NEW) | proposed |
| `framework/releases/*/release.json#postUpdateChecks` | verified_from_repo |

## Cross-sprint coupling — SP-20260513-005 (harden /warp:update)

SP-20260513-005 (PC-20260513-0006) hardens `/warp:update` with transactional preflight/postflight/rollback. SP-002 publishes `provider-smoke` as a stable, composable postflight step. SP-005 will COMPOSE the smoke gate into its postflight chain — must reuse SP-002's CLI surface (`node scripts/warpos/provider-smoke.js --json --providers <list>`) and exit-code semantics unchanged. SP-002 will NOT add transactional rollback; that is SP-005's responsibility. Coupling contract: SP-002 promises a JSON output schema (`{ verdict, results[], rca[], autofixes[] }`) that SP-005's rollback decision tree can consume.

## External Service Dependencies

`status: none_expected` (confirmed). All providers are already integrated; this sprint exercises existing connections, doesn't add new ones. See `.claude/project/sprint/external-services/` for ESD records — none required.

## Approval Boundaries

See Plan Contract `approval_boundaries`:
- Modifying release-gate fixtures / `postUpdateChecks` — affects release flow (touches every `framework/releases/*/release.json`).
- Auto-fix could overwrite operator-customized auth — guardrail = `safe_to_autofix: false` on every auth-mutating recipe.

## Linked Artifacts

- Plan Contract: `.claude/project/sprint/plan-contracts/PC-20260513-0003.yaml`
- High-level stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\high-level-stories.md`
- Granular stories: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\granular-stories.md`
- COPY: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\copy.md`
- INPUTS: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\inputs.md`
- TRACE: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\trace.md`
- Acceptance criteria: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\acceptance-criteria.md`
- QA plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\qa-plan.md`
- Redteam plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\redteam-plan.md`
- Release plan: `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\release-plan.md`
