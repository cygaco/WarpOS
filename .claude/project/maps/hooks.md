# Hooks Map

Generated: 2026-06-10T00:19:58.299Z

**74** hook scripts (64 registered, 10 orphan), **17** lib modules, **75** wiring entries.

## Wiring (event → matcher → hook)

### PostCompact

- `*` → `compact-saver.js`

### PostToolUse

- `Bash` → `merge-guard.js`
- `Bash` → `ledger-presence-guard.js`
- `Edit|Write` → `memory-guard.js`
- `Edit|Write` → `store-validator.js`
- `Edit|Write` → `path-guard.js`
- `Edit|Write` → `edit-watcher.js`
- `Edit|Write` → `event-contract.js`
- `Edit|Write` → `format.js`
- `Edit|Write` → `lint.js`
- `Edit|Write` → `typecheck.js`
- `Edit|Write` → `systems-sync.js`
- `Edit|Write` → `save-session-lint.js`
- `Edit|Write` → `template-fillability.js`
- `Edit|Write` → `learning-validator.js`
- `Edit|Write` → `ui-lint.js`
- `Edit|Write` → `step-hardcode-suggester.js`
- `Edit|Write` → `region-marker-guard.js`
- `Edit|Write` → `spec-test-staleness.js`
- `Edit|Write` → `skill-catalog-regen.js`
- `Edit|Write` → `memory-enforcement-guard.js`
- `Agent` → `build-transaction-boundary.js`
- `Agent` → `response-size-guard.js`
- `*` → `session-tracker.js`
- `WebFetch|WebSearch|mcp__.*|ListMcpResourcesTool|ReadMcpResourceTool` → `untrusted-content-firewall.js`

### PreToolUse

- `Bash` → `merge-guard.js`
- `Bash` → `memory-guard.js`
- `Bash` → `framework-manifest-guard.js`
- `Bash` → `framework-purity-guard.js`
- `Bash` → `path-registry-guard.js`
- `Bash` → `dispatch-route-guard.js`
- `Bash` → `sprint-approval-guard.js`
- `Bash` → `authorization-gate.js`
- `Bash` → `version-bump-guard.js`
- `Edit|Write` → `memory-guard.js`
- `Edit|Write` → `settings-edit-guard.js`
- `Edit|Write` → `secret-guard.js`
- `Edit|Write` → `foundation-guard.js`
- `Edit|Write` → `ownership-guard.js`
- `Edit|Write` → `store-validator.js`
- `Edit|Write` → `path-guard.js`
- `Edit|Write` → `sprint-routing-guard.js`
- `Edit|Write` → `step-registry-guard.js`
- `Edit|Write` → `extension-edit-guard.js`
- `Edit|Write` → `dependency-admission-guard.js`
- `Edit|Write` → `self-mod-governance.js`
- `Edit|Write` → `sprint-tracker-guard.js`
- `Edit|Write` → `requirement-format-guard.js`
- `Edit|Write` → `authorization-gate.js`
- `Edit|Write` → `lint-hook-output.js`
- `Agent` → `build-transaction-boundary.js`
- `Agent` → `scope-contract-guard.js`
- `Agent` → `team-guard.js`
- `Agent` → `worktree-preflight.js`
- `Agent` → `gate-check.js`
- `Agent` → `gauntlet-gate.js`
- `Agent` → `cycle-enforcer.js`
- `Agent` → `prompt-validator.js`
- `Read|Grep|Glob` → `boss-boundary.js`
- `mcp__claude_ai_Excalidraw__*` → `excalidraw-guard.js`
- `AskUserQuestion` → `beta-gate.js`
- `SlashCommand|Skill` → `skill-invocation-tracker.js`

### SessionEnd

- `*` → `handoff-live.js`
- `*` → `session-stop.js`

### SessionStart

- `*` → `session-start.js`
- `*` → `tracker-start-of-work.js`

### Stop

- `*` → `retro-presence-check.js`
- `*` → `handoff-live.js`
- `*` → `session-stop.js`
- `*` → `tracker-completion-gate.js`

### StopFailure

- `*` → `handoff-live.js`
- `*` → `session-stop.js`

### UserPromptSubmit

- `*` → `smart-context.js`
- `*` → `prompt-logger.js`

### git-pre-commit

- `(off-registry)` → `pre-commit-steps-check.js`

## All hook scripts

| Hook | Registered | Size | Modified |
|---|---|---|---|
| authorization-gate.js | yes | 8520 | 2026-05-30T01:25:39.579Z |
| beta-gate.js | yes | 9095 | 2026-06-08T20:28:50.013Z |
| boss-boundary.js | yes | 3145 | 2026-06-04T22:57:13.997Z |
| build-transaction-boundary.js | yes | 3760 | 2026-05-30T01:25:39.580Z |
| build.js | no | 6528 | 2026-05-30T01:25:39.580Z |
| compact-saver.js | yes | 1232 | 2026-05-30T01:25:39.581Z |
| create-worktree-from-head.js | no | 4250 | 2026-05-30T01:25:39.581Z |
| cycle-enforcer.js | yes | 7071 | 2026-05-30T01:25:39.582Z |
| dependency-admission-guard.js | yes | 1300 | 2026-05-30T01:25:39.583Z |
| dispatch-route-guard.js | yes | 26061 | 2026-06-08T05:38:13.758Z |
| edit-watcher.js | yes | 29693 | 2026-05-30T01:25:39.583Z |
| event-contract.js | yes | 4048 | 2026-05-30T01:25:39.585Z |
| excalidraw-guard.js | yes | 920 | 2026-05-30T01:25:39.585Z |
| extension-edit-guard.js | yes | 4361 | 2026-05-30T01:25:39.585Z |
| format.js | yes | 2397 | 2026-05-30T01:25:39.586Z |
| foundation-guard.js | yes | 2636 | 2026-05-30T01:25:39.586Z |
| framework-manifest-guard.js | yes | 10668 | 2026-05-30T01:25:39.586Z |
| framework-purity-guard.js | yes | 5253 | 2026-06-04T21:24:41.660Z |
| gate-check.js | yes | 5636 | 2026-06-08T05:38:13.758Z |
| gauntlet-gate.js | yes | 8464 | 2026-06-05T01:45:08.445Z |
| handoff-live.js | yes | 10556 | 2026-06-08T18:42:03.651Z |
| handoff-live.test.js | no | 8603 | 2026-06-08T18:42:17.088Z |
| learning-validator.js | yes | 6416 | 2026-05-30T01:25:39.587Z |
| ledger-presence-guard.js | yes | 6991 | 2026-06-05T01:45:08.446Z |
| lint-hook-output.js | yes | 1964 | 2026-05-30T01:25:39.593Z |
| lint.js | yes | 2684 | 2026-05-30T01:25:39.594Z |
| memory-enforcement-guard.js | yes | 3339 | 2026-05-30T01:25:39.594Z |
| memory-guard.js | yes | 14402 | 2026-06-07T03:35:59.239Z |
| merge-guard.js | yes | 25427 | 2026-06-09T00:41:40.597Z |
| ownership-guard.js | yes | 4504 | 2026-06-04T22:57:14.000Z |
| path-guard.js | yes | 8945 | 2026-06-08T20:28:50.013Z |
| path-registry-guard.js | yes | 5451 | 2026-05-30T01:25:39.597Z |
| pre-commit-steps-check.js | yes | 8602 | 2026-05-30T01:25:39.597Z |
| prompt-logger.js | yes | 1843 | 2026-05-30T01:25:39.597Z |
| prompt-validator.js | yes | 6390 | 2026-06-08T05:38:13.758Z |
| ref-checker.js | no | 13294 | 2026-06-05T01:45:08.446Z |
| region-marker-guard.js | yes | 6097 | 2026-05-30T01:25:39.598Z |
| requirement-format-guard.js | yes | 7236 | 2026-05-30T01:25:39.599Z |
| response-size-guard.js | yes | 5564 | 2026-06-08T05:38:13.758Z |
| retro-presence-check.js | yes | 2833 | 2026-06-05T01:45:08.447Z |
| save-session-lint.js | yes | 2487 | 2026-05-30T01:25:39.600Z |
| scope-contract-guard.js | yes | 4536 | 2026-06-04T22:57:14.001Z |
| secret-guard.js | yes | 2786 | 2026-05-30T01:25:39.600Z |
| self-mod-governance.js | yes | 923 | 2026-05-30T01:25:39.601Z |
| session-start-teaminit.test.js | no | 4665 | 2026-06-08T19:49:48.192Z |
| session-start.js | yes | 30063 | 2026-06-10T00:04:52.691Z |
| session-stop-sentinel.test.js | no | 5847 | 2026-06-08T22:03:39.609Z |
| session-stop.js | yes | 19907 | 2026-06-08T22:01:59.750Z |
| session-tracker.js | yes | 9491 | 2026-05-30T01:25:39.602Z |
| settings-edit-guard.js | yes | 4852 | 2026-06-04T21:24:41.661Z |
| skill-catalog-regen.js | yes | 2181 | 2026-05-30T01:25:39.602Z |
| skill-counter.js | no | 3369 | 2026-05-30T01:25:39.603Z |
| skill-invocation-tracker.js | yes | 6872 | 2026-05-30T01:25:39.603Z |
| smart-context.js | yes | 34063 | 2026-06-05T01:45:08.448Z |
| spec-test-staleness.js | yes | 5448 | 2026-05-30T01:25:39.604Z |
| sprint-approval-guard.js | yes | 6158 | 2026-05-30T01:25:39.604Z |
| sprint-routing-guard.js | yes | 9608 | 2026-06-08T20:28:50.013Z |
| sprint-tracker-guard.js | yes | 15870 | 2026-05-30T01:25:39.605Z |
| step-hardcode-suggester.js | yes | 7087 | 2026-05-30T01:25:39.605Z |
| step-registry-guard.js | yes | 12054 | 2026-05-30T01:25:39.606Z |
| store-validator.js | yes | 16480 | 2026-05-30T01:25:39.606Z |
| systems-sync.js | yes | 7605 | 2026-05-30T01:25:39.607Z |
| team-guard-gate.test.js | no | 11806 | 2026-06-09T00:41:40.599Z |
| team-guard-sprint.test.js | no | 6605 | 2026-06-09T00:41:40.599Z |
| team-guard.js | yes | 17839 | 2026-06-10T00:04:52.692Z |
| template-fillability.js | yes | 2939 | 2026-05-30T01:25:39.607Z |
| test.js | no | 11730 | 2026-05-30T01:25:39.608Z |
| tracker-completion-gate.js | yes | 3400 | 2026-06-07T03:35:59.240Z |
| tracker-start-of-work.js | yes | 3901 | 2026-06-07T03:35:59.240Z |
| typecheck.js | yes | 1688 | 2026-05-30T01:25:39.608Z |
| ui-lint.js | yes | 3311 | 2026-05-30T01:25:39.609Z |
| untrusted-content-firewall.js | yes | 3144 | 2026-05-31T00:20:57.240Z |
| version-bump-guard.js | yes | 7695 | 2026-06-08T20:28:50.013Z |
| worktree-preflight.js | yes | 5180 | 2026-05-30T01:25:39.610Z |

## Lib modules

| Module | Size | Modified |
|---|---|---|
| banner.js | 4392 | 2026-05-30T01:25:39.588Z |
| concurrency-lock.js | 10962 | 2026-05-30T01:25:39.589Z |
| context-sources.js | 8286 | 2026-05-30T01:25:39.589Z |
| gate-schema.js | 3894 | 2026-05-30T01:25:39.589Z |
| injection-patterns.js | 2949 | 2026-05-31T00:23:04.879Z |
| logger.js | 16632 | 2026-06-08T20:28:50.013Z |
| mode-lifecycle.js | 6175 | 2026-06-10T00:04:52.690Z |
| mode.js | 2944 | 2026-06-10T00:04:52.691Z |
| oneshot-store.js | 2337 | 2026-06-08T21:07:45.656Z |
| paths.generated.js | 10807 | 2026-06-10T00:04:52.691Z |
| paths.js | 6608 | 2026-06-05T01:45:08.446Z |
| project-config.js | 4488 | 2026-05-30T01:25:39.591Z |
| provider-health.js | 10306 | 2026-05-30T01:25:39.592Z |
| providers.js | 41222 | 2026-06-08T05:23:57.530Z |
| role-aliases.js | 3333 | 2026-06-08T05:23:57.530Z |
| skill-telemetry.js | 5275 | 2026-05-30T01:25:39.593Z |
| untrusted-content.js | 2482 | 2026-05-31T00:20:08.687Z |
