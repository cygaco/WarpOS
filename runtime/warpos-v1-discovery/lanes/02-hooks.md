# Hooks System — Discovery Report (disc-hooks, 2026-07-09)

## Inventory (47 unique wired scripts in `.claude/settings.json`)

| Event / matcher | Scripts |
|---|---|
| **SessionStart** | session-start (banner/team-init), tracker-start-of-work |
| **UserPromptSubmit** | smart-context (Haiku memory-enrich, fail-open), prompt-logger |
| **PreToolUse Bash** | merge-guard, memory-guard, framework-manifest-guard, framework-purity-guard, path-registry-guard, dispatch-route-guard, sprint-approval-guard, authorization-gate, version-bump-guard |
| **PreToolUse Edit\|Write** | memory-guard, settings-edit-guard, secret-guard, foundation-guard, ownership-guard, store-validator, path-guard, sprint-routing-guard, step-registry-guard, extension-edit-guard, dependency-admission-guard, self-mod-governance, sprint-tracker-guard, requirement-format-guard, authorization-gate, lint-hook-output |
| **PreToolUse Agent** | build-transaction-boundary, scope-contract-guard, team-guard, worktree-preflight, gate-check, gauntlet-gate, cycle-enforcer, prompt-validator |
| **PreToolUse Read\|Grep\|Glob** | boss-boundary |
| **PreToolUse mcp Excalidraw** | excalidraw-guard |
| **PreToolUse AskUserQuestion** | beta-gate |
| **PreToolUse SlashCommand\|Skill** | skill-invocation-tracker, mode-lifecycle-guard |
| **PostToolUse Bash** | merge-guard (merge-verify), ledger-presence-guard |
| **PostToolUse Edit\|Write** | memory-guard, store-validator, path-guard, edit-watcher, event-contract, format, lint, typecheck, systems-sync, save-session-lint, template-fillability, learning-validator, ui-lint, step-hardcode-suggester, region-marker-guard, spec-test-staleness, skill-catalog-regen, memory-enforcement-guard |
| **PostToolUse Agent** | build-transaction-boundary, response-size-guard |
| **PostToolUse** (all) | session-tracker |
| **PostToolUse Web\*/mcp\*** | untrusted-content-firewall (injection scan, fail-open) |
| **PostCompact** | compact-saver |
| **Stop** | retro-presence-check, tracker-completion-gate, session-stop |
| **SessionEnd** | session-stop, session-end-team-teardown |
| **StopFailure** | session-stop |

**On-disk but NOT wired** (standalone/helper, not dead-disabled): `pre-commit-steps-check.js` (git-hook style, see Drift), `ref-checker.js` (spawned by merge-guard as advisory), `skill-counter.js`, `handoff-live.js`, `build.js`/`test.js` (hook-manifest tooling), `create-worktree-from-head.js`, `*.test.js`. **No `_disabled_hooks` section** in either settings file; settings.local.json only adds permission allows.

## Classification (logic-locus = helm-portability, the load-bearing axis)

- **Guards (block/warn):** all `*-guard`, merge-guard, secret-guard, dispatch-route-guard, gate-check, gauntlet-gate, cycle-enforcer, scope-contract-guard, team-guard, beta-gate, boss-boundary, sprint-approval-guard, authorization-gate, tracker-completion-gate, retro-presence-check.
- **Telemetry:** prompt-logger, skill-invocation-tracker, session-tracker, edit-watcher, ledger-presence-guard, format/lint/typecheck/ui-lint (advisory fix-forward).
- **Context-injector:** smart-context (the only one).
- **DELEGATING → helm-neutral core already exists** (hook is a thin trigger over a standalone `node` validator, re-runnable from git/CI): merge-guard → `scripts/checks/doc-ref-integrity.js --enforce`, `scripts/paths/gate.js`, `scripts/paths/build.js --check`, `scripts/hooks/build.js --check`, `scripts/requirements/gate.js` (`merge-guard.js:278-405`); tracker-completion-gate → `scripts/trackers/validate.js --json` (`tracker-completion-gate.js:52`); step-registry-guard shares schema with `pre-commit-steps-check.js` + `generate-steps-maps.js --check`.
- **EMBEDDED → dies with the Claude harness** (all check logic inline; nothing re-runs it for a GPT/Gemini helm): secret-guard (regex table `secret-guard.js:21-82`), dispatch-route-guard (exports fns but no non-hook caller), gauntlet-gate (reads store.json inline), beta-gate, scope-contract-guard, team-guard, cycle-enforcer, boss-boundary, ownership/foundation/memory/path guards.

## Top-10 must-survive a non-Claude helm + neutral equivalent

1. **secret-guard** → git pre-commit hook + CI secret-scan on staged diff (today Claude-Edit-only; a GPT helm writing files bypasses it entirely).
2. **dispatch-route-guard** → make the WorkOrder→dispatch kernel the ONLY path and refuse raw provider CLI *inside the wrapper*, not at a harness hook.
3. **merge-guard** (force-push / reset --hard / agent-merge gauntlet gate / backup-branch delete) → git pre-push + pre-commit hooks + branch protection.
4. **tracker-completion-gate** → already delegates to `trackers/validate.js`; wire as CI gate + pre-push (helm-independent today).
5. **gauntlet-gate / gate-check / cycle-enforcer** → encode as SprintRoom state-machine transition guards (validator refuses phase-advance without GATE_CHECK).
6. **sprint-approval-guard** (no deploy without approval_ref) → release-pipeline/CI deploy gate reading the approval ledger.
7. **framework-purity-guard / framework-manifest-guard** → `scan:framework-purity` logic as a CI job on PR.
8. **path-registry-guard / path-guard** → `paths/gate.js` + `build.js --check` already standalone → pre-commit + CI.
9. **untrusted-content-firewall** (injection scan on web/MCP output) → wrapper-internal ResultEnvelope sanitizer in the dispatch kernel (any helm ingesting tool output needs it; fail-open today).
10. **step-registry-guard** → its twin `pre-commit-steps-check.js` IS the neutral equivalent, but is not installed (see Drift) — install + CI.

## Drift & broken

- **settings.json ↔ hook-manifest.json: NO drift.** Same 47 wired hooks; `_compiledAt` 2026-06-10T02:45 aligns with manifest `updatedAt` 2026-06-10T13:54; every manifest `script` path verified present on disk.
- **BROKEN/UNWIRED (critical):** `pre-commit-steps-check.js` is designed to run from `.git/hooks/pre-commit`, but `.git/hooks/` holds ONLY `*.sample` files — no `pre-commit` installed (`core.hooksPath` = default `.git/hooks`). The single git-neutral enforcer in the repo is dormant; STEPS.json integrity is currently protected ONLY by the Claude harness hook. This is exactly the helm-neutrality hole the rebuild targets.
- **Weak failMode:** authorization-gate and untrusted-content-firewall are `fail-open` — a crash silently disables them. secret-guard / merge-guard / dispatch-route-guard are correctly `fail-closed`.

## Rebuild needs

1. Extract every EMBEDDED guard's logic into a standalone `node` validator (the merge-guard/tracker-gate delegation pattern) so each check has ONE helm-neutral core that the Claude hook, a git hook, and CI all call — the hook becomes a ~10-line trigger.
2. Install the git-hook layer: ship tracked `.git/hooks/pre-commit` + `pre-push` (or set `core.hooksPath` to a tracked dir) invoking the standalone validators — this is what fires for a GPT/Gemini helm that never touches Claude PreToolUse.
3. Move state-machine guards (gauntlet/cycle/gate-check/beta) into SprintRoom transition validation so enforcement is a property of the state object, not the Agent-tool call.
4. Fold dispatch-route-guard + untrusted-content-firewall INTO the dispatch kernel / ResultEnvelope — wrapper-internal, so no helm can route raw or ingest unsanitized tool output.
5. Add a CI pipeline running scan:full-class checks (purity, paths, references, tracker validate) on PR — the third leg none of the current hooks provide.
6. Flip authorization-gate + untrusted-content-firewall to fail-closed (or add a liveness check), and add a manifest↔settings↔on-disk drift test to CI (today it's true only by manual regen discipline).
