# COPY Requirements — WarpOS install/update provider smoke test + RCA

**Sprint:** `SP-20260513-002`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\prd.md`

> COPY captures user-visible text and content expectations. Each entry
> is a concrete string the product will display, with context. Keep
> ids stable so tickets can link to specific copy blocks.

## C-1 — Smoke header + per-provider verdict line (linked story `S-1`)

**Context:** Top-level smoke output, printed by `scripts/warpos/provider-smoke.js` when not in `--json` mode. Three terminal states: GREEN, YELLOW, RED.

**Text:**

> ```
> Provider Smoke — GREEN
> ────────────────────────────────────────────────
>   ok  claude   ok           harness
>   ok  openai   ok           codex CLI 0.12.4, default model reachable
>   ok  gemini   ok           gemini CLI 0.49.1, default model reachable
> All required providers ready.
> ```
>
> ```
> Provider Smoke — YELLOW (non-fatal)
> ────────────────────────────────────────────────
>   ok  claude   ok
>   !!  openai   cli_missing  codex CLI not on PATH — fallback chain will route around
>   ok  gemini   ok
> Update may proceed. Run `/warp:health` for remediation.
> ```
>
> ```
> Provider Smoke — RED (blocking)
> ────────────────────────────────────────────────
>   ok  claude   ok
>   xx  openai   auth_missing root_cause=codex_session_expired
>   ok  gemini   ok
> Install/update aborted. See remediation above. Re-run after fixing.
> ```

**Notes:** Mirrors the existing `provider-health-check.js` ASCII style for visual consistency. Icons: `ok` / `!!` / `xx`. The `--json` mode emits `{ verdict, results, rca, autofixes }` with no human strings.

## C-2 — Post-update smoke result header (linked story `S-2`)

**Context:** Printed by `/warp:update` when it runs `postUpdateChecks`. Wraps smoke output.

**Text:**

> ```
> [4/4] post-update-check: provider-smoke
> ```
>
> followed by the C-1 block. On red:
>
> ```
> Post-update check failed: provider-smoke (red).
> Update applied to disk but providers are NOT verified. Run /warp:smoke after fixing the cause, or /warp:update --rollback to restore the previous capsule (SP-005).
> ```

**Notes:** The `--rollback` reference is forward-looking to SP-20260513-005. If SP-005 has not shipped at the time SP-002 lands, the message should say "Run `git checkout <previous-version>-installed` then re-install" instead — the design step should pick the live wording at execution time.

## C-3 — Per-status RCA remediation message (linked story `S-3`)

**Context:** Loaded from `provider-failure-modes.json#entries[*].remediation`. Printed immediately under the failing provider line. One short line per status. Catalog entries below; full canonical list in `R-3` requirement of PRD.

**Text:**

> ```
> cli_missing             → Install: npm i -g @openai/codex && codex login
> auth_missing            → Re-authenticate: codex login   (or)  gemini auth login
> auth_source_mismatch    → Pick one: unset GEMINI_API_KEY OR set auth.selectedType=api-key in ~/.gemini/settings.json
> model_not_found         → Upgrade CLI: npm i -g @google/gemini-cli@latest   (registry is stale)
> stale_cli_registry      → Same as model_not_found — upgrade CLI to refresh bundled model list
> quota_exhausted         → Wait for quota reset, or set provider_fallback policy
> free_tier_limit_zero    → Switch tier or fall back to claude/openai
> trusted_directory_required → Re-run with GEMINI_CLI_TRUST_WORKSPACE=true (one-shot) — auto-applied if safe
> provider_timeout        → Network / VPN / CLI version issue. Retried once automatically.
> unknown_error           → Inspect stderr in detail field; check `provider-health.js`
> ```

**Notes:** Strings are taken from the existing `provider-health.js` suggestions for continuity with `/warp:health`. Catalog v1 holds these verbatim; future revisions may localize.

## C-4 — Auto-fix notifications (linked story `S-5`)

**Context:** Printed when autofix dispatcher attempts a recipe.

**Text:**

> ```
> Auto-fix: gemini.trusted_directory_required → setting GEMINI_CLI_TRUST_WORKSPACE=true for this run
>   re-probe: ok
> ```
>
> on failure:
>
> ```
> Auto-fix attempted: gemini.trusted_directory_required
>   re-probe: still trusted_directory_required
>   remediation: Re-run with GEMINI_CLI_TRUST_WORKSPACE=true (one-shot) — auto-applied if safe
> ```

**Notes:** Re-probe runs exactly once; never loops. If `--no-autofix` is passed, the dispatcher prints a single line: `Auto-fix skipped (--no-autofix)` and falls through to remediation.

## C-5 — Install-terminal smoke result block (linked story `S-6`)

**Context:** Printed by `/warp:install` and `/warp:setup` at the very end of the happy-path sequence.

**Text:**

> ```
> [final] Provider smoke
> ```
>
> followed by the C-1 block. On red:
>
> ```
> Install completed disk steps but provider smoke is RED. Fix the cause(s) above, then re-run `/warp:smoke` to verify before starting work.
> ```

**Notes:** Install never auto-rolls-back on red (rollback is SP-005's scope); the file system is left in a usable state with an explicit instruction. Exit code propagates to the parent shell.
