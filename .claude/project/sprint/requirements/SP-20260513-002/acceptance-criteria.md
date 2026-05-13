# Acceptance Criteria — WarpOS install/update provider smoke test + RCA

**Sprint:** `SP-20260513-002`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\prd.md`

> Each AC is a testable Given/When/Then statement. Linked from the
> granular story + the ticket that implements it.

## S-1 — Provider smoke orchestrator (`provider-smoke.js`)

- **AC-1.1** Given a clean install with all three CLIs present and authenticated, when `node scripts/warpos/provider-smoke.js` runs, then stdout shows `Provider Smoke — GREEN`, exit code is `0`, and one `type: "smoke"` event appended to `paths.eventsFile` with `verdict: "green"`.
- **AC-1.2** Given codex CLI absent on PATH, when `node scripts/warpos/provider-smoke.js --providers claude,openai,gemini` runs, then stdout shows `Provider Smoke — YELLOW (non-fatal)`, exit code is `0`, and the openai line shows `cli_missing` with the install-recipe remediation from `C-3`.
- **AC-1.3** Given codex authenticated session expired (probe returns `auth_missing`), when `node scripts/warpos/provider-smoke.js --probe list` runs against a required-provider list including openai, then stdout shows `Provider Smoke — RED (blocking)`, exit code is `2`, the failing line shows the `C-3` remediation, and a `type: "rca"` event records `root_cause` from the catalog.

## S-2 — `provider-smoke` declared in `postUpdateChecks`

- **AC-2.1** Given a project installed at WarpOS 0.5.0 and a newer 0.5.1+ capsule published whose `release.json#postUpdateChecks` contains `node scripts/warpos/provider-smoke.js --providers claude,openai,gemini`, when `/warp:update --to 0.5.1 --apply` runs and all providers are green, then update exits 0 and stdout shows `[N/N] post-update-check: provider-smoke` followed by GREEN.
- **AC-2.2** Given the same setup but openai is red (auth_missing), when `/warp:update --to 0.5.1 --apply` runs, then update exits non-zero, the smoke RED block from `C-2` is printed, and the failure is logged as a `type: "smoke"` event with `invoked_from: "update"`.

## S-3 — Failure-mode catalog v1

- **AC-3.1** Given `.claude/agents/00-alex/.system/policy/provider-failure-modes.json` exists and is valid against schema `warpos/provider-failure-modes/v1`, when the orchestrator loads it, then every status string emitted by `scripts/hooks/lib/provider-health.js` (10 statuses) is covered by a catalog entry.
- **AC-3.2** Given a corrupt or missing catalog file, when `node scripts/warpos/provider-smoke.js` runs, then orchestrator exits `1` (not 2) with stderr message `catalog_load_error: <reason>` and logs nothing to `paths.eventsFile` beyond the failure event.
- **AC-3.3** Given the catalog entry for `auth_source_mismatch`, when an `auth_source_mismatch` probe result is fed to RCA, then the returned entry has `safe_to_autofix: false` and `fallback_allowed: false` (matches `provider-fallback.json#do_not_fall_back`).

## S-4 — RCA module (`provider-rca.js`)

- **AC-4.1** Given a probe result `{ provider: "gemini", status: "model_not_found" }`, when `rca(probeResult)` is called, then it returns `{ provider, status, root_cause: "<from catalog>", fix_recipe, safe_to_autofix, remediation, fallback_allowed }` matching the catalog entry for `model_not_found`.
- **AC-4.2** Given a probe result with a status not in the catalog (e.g., `"never_seen_before"`), when `rca(probeResult)` is called, then it returns the catalog's `unknown_error` default entry with `safe_to_autofix: false` (no I/O, no throw).

## S-5 — Auto-fix dispatcher (`provider-autofix.js`)

- **AC-5.1** Given a catalog entry with `safe_to_autofix: true` (e.g., `trusted_directory_required`) and the orchestrator detects that status on gemini, when the autofix dispatcher runs, then the recipe executes, the provider is re-probed exactly once, and a `type: "autofix"` event records `applied: true` with the re-probe `success` flag.
- **AC-5.2** Given a catalog entry with `safe_to_autofix: false` (e.g., `auth_source_mismatch`), when the orchestrator hits that status, then the autofix dispatcher does NOT run the recipe, no `type: "autofix"` event is logged, and the operator-facing remediation from `C-3` is printed verbatim.
- **AC-5.3** Given `--no-autofix` is passed, when the orchestrator hits any non-green status (including `safe_to_autofix: true`), then no autofix recipe runs, stdout shows `Auto-fix skipped (--no-autofix)`, and the remediation block prints.

## S-6 — `/warp:install` and `/warp:setup` wire smoke as terminal step

- **AC-6.1** Given `/warp:setup` runs to completion on a fresh project with all providers green, when the final documented step executes, then `node scripts/warpos/provider-smoke.js --providers claude,openai,gemini` is invoked, the `C-5` block prints, and setup exits 0.
- **AC-6.2** Given `/warp:setup` runs and provider smoke returns RED, when setup completes its disk steps, then setup prints the `C-5` red block (telling operator the cause is fixable + install is on disk) and exits non-zero.

## S-7 — Events logging + log file path

- **AC-7.1** Given a smoke run with one yellow and one red provider, when smoke completes, then `paths.eventsFile` contains exactly: one `type: "smoke"`, one `type: "probe"` per provider, one `type: "rca"` per non-green provider, and zero-or-one `type: "autofix"` per RCA where `safe_to_autofix: true`.
- **AC-7.2** Given multiple smoke runs over time with the same `{ provider, status }` repeating ≥3 times in 7 days, when `/issues:scan` runs, then the recurring failure is surfaced as a candidate (no automatic issue creation; operator decides).

## S-8 — Cross-platform Windows stdin-bug guard

- **AC-8.1** Given the smoke orchestrator source code, when `grep -E "cat .* \| (codex|gemini)" scripts/warpos/provider-smoke.js scripts/warpos/lib/provider-*.js` runs, then it returns zero matches.
- **AC-8.2** Given an unrelated hook or skill author tries to add `cat foo | codex exec …` near a smoke surface, when the prompt is submitted, then `scripts/hooks/dispatch-route-guard.js` blocks the bash invocation (existing behavior — smoke must NOT introduce a bypass path).
