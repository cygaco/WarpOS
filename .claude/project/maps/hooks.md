# Hooks Map

Generated: 2026-05-13T22:12:54.429Z

**57** hook scripts (52 registered, 5 orphan), **13** lib modules, **60** wiring entries.

## Wiring (event → matcher → hook)

### PostCompact

- `(no matcher)` → `compact-saver.js`

### PostToolUse

- `Bash` → `merge-guard.js`
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
- `Agent` → `build-transaction-boundary.js`
- `Agent` → `response-size-guard.js`
- `(no matcher)` → `session-tracker.js`

### PreToolUse

- `Bash` → `merge-guard.js`
- `Bash` → `memory-guard.js`
- `Bash` → `framework-manifest-guard.js`
- `Bash` → `path-registry-guard.js`
- `Bash` → `dispatch-route-guard.js`
- `Bash` → `sprint-approval-guard.js`
- `Edit|Write` → `memory-guard.js`
- `Edit|Write` → `secret-guard.js`
- `Edit|Write` → `foundation-guard.js`
- `Edit|Write` → `ownership-guard.js`
- `Edit|Write` → `store-validator.js`
- `Edit|Write` → `path-guard.js`
- `Edit|Write` → `step-registry-guard.js`
- `Edit|Write` → `extension-edit-guard.js`
- `Edit|Write` → `dependency-admission-guard.js`
- `Edit|Write` → `self-mod-governance.js`
- `Edit|Write` → `sprint-tracker-guard.js`
- `Edit|Write` → `requirement-format-guard.js`
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

- `(no matcher)` → `session-stop.js`

### SessionStart

- `(no matcher)` → `session-start.js`

### Stop

- `(no matcher)` → `retro-presence-check.js`
- `(no matcher)` → `session-stop.js`

### StopFailure

- `(no matcher)` → `session-stop.js`

### UserPromptSubmit

- `(no matcher)` → `smart-context.js`
- `(no matcher)` → `prompt-logger.js`

### git-pre-commit

- `(off-registry)` → `pre-commit-steps-check.js`

## All hook scripts

| Hook | Registered | Size | Modified |
|---|---|---|---|
| beta-gate.js | yes | 4190 | 2026-04-17T21:30:23.988Z |
| boss-boundary.js | yes | 3095 | 2026-05-03T19:46:50.932Z |
| build-transaction-boundary.js | yes | 3760 | 2026-05-01T04:37:06.323Z |
| build.js | no | 6730 | 2026-05-03T19:46:50.715Z |
| compact-saver.js | yes | 1268 | 2026-04-17T21:30:23.988Z |
| create-worktree-from-head.js | no | 4393 | 2026-04-17T21:30:23.990Z |
| cycle-enforcer.js | yes | 7254 | 2026-04-17T21:30:23.990Z |
| dependency-admission-guard.js | yes | 1300 | 2026-05-01T04:37:06.324Z |
| dispatch-route-guard.js | yes | 7405 | 2026-05-11T20:59:36.128Z |
| edit-watcher.js | yes | 29693 | 2026-05-03T19:46:50.933Z |
| event-contract.js | yes | 4048 | 2026-04-29T18:57:10.033Z |
| excalidraw-guard.js | yes | 951 | 2026-04-17T21:30:23.992Z |
| extension-edit-guard.js | yes | 4484 | 2026-05-02T02:38:18.834Z |
| format.js | yes | 996 | 2026-04-17T21:30:23.992Z |
| foundation-guard.js | yes | 2720 | 2026-04-17T21:30:23.994Z |
| framework-manifest-guard.js | yes | 10668 | 2026-05-11T21:12:13.012Z |
| gate-check.js | yes | 5053 | 2026-04-29T05:47:38.734Z |
| gauntlet-gate.js | yes | 8310 | 2026-04-29T05:49:41.894Z |
| learning-validator.js | yes | 6622 | 2026-04-17T21:30:23.994Z |
| lint.js | yes | 2777 | 2026-04-17T21:30:23.994Z |
| memory-guard.js | yes | 8726 | 2026-04-17T21:30:24.000Z |
| merge-guard.js | yes | 18340 | 2026-05-11T21:00:39.663Z |
| ownership-guard.js | yes | 3699 | 2026-04-29T05:47:40.874Z |
| path-guard.js | yes | 8938 | 2026-05-03T19:46:50.935Z |
| path-registry-guard.js | yes | 5451 | 2026-05-03T19:46:50.936Z |
| pre-commit-steps-check.js | yes | 8850 | 2026-05-03T19:46:50.936Z |
| prompt-logger.js | yes | 1900 | 2026-04-17T21:30:24.000Z |
| prompt-validator.js | yes | 6076 | 2026-04-29T07:16:03.307Z |
| ref-checker.js | no | 13704 | 2026-05-03T19:46:50.937Z |
| region-marker-guard.js | yes | 6302 | 2026-05-03T19:46:50.937Z |
| requirement-format-guard.js | yes | 7236 | 2026-05-11T21:18:39.855Z |
| response-size-guard.js | yes | 4716 | 2026-04-29T05:47:23.501Z |
| retro-presence-check.js | yes | 2815 | 2026-04-29T23:37:50.114Z |
| save-session-lint.js | yes | 2577 | 2026-04-17T21:30:24.000Z |
| scope-contract-guard.js | yes | 1758 | 2026-05-01T04:37:06.323Z |
| secret-guard.js | yes | 2883 | 2026-04-17T21:30:24.004Z |
| self-mod-governance.js | yes | 923 | 2026-05-01T04:37:06.324Z |
| session-start.js | yes | 17700 | 2026-05-11T21:20:29.460Z |
| session-stop.js | yes | 19140 | 2026-05-02T02:38:18.843Z |
| session-tracker.js | yes | 9491 | 2026-04-29T05:46:39.849Z |
| skill-catalog-regen.js | yes | 2181 | 2026-05-13T20:41:01.715Z |
| skill-counter.js | no | 3369 | 2026-05-02T17:31:41.040Z |
| skill-invocation-tracker.js | yes | 6872 | 2026-05-13T20:43:09.541Z |
| smart-context.js | yes | 33997 | 2026-05-13T21:07:06.507Z |
| spec-test-staleness.js | yes | 5627 | 2026-05-03T19:46:50.939Z |
| sprint-approval-guard.js | yes | 6158 | 2026-05-11T22:39:29.893Z |
| sprint-tracker-guard.js | yes | 10260 | 2026-05-11T22:39:09.280Z |
| step-hardcode-suggester.js | yes | 7337 | 2026-05-03T19:46:50.939Z |
| step-registry-guard.js | yes | 12054 | 2026-05-03T19:46:50.940Z |
| store-validator.js | yes | 16480 | 2026-04-29T05:49:13.765Z |
| systems-sync.js | yes | 7854 | 2026-04-17T21:30:24.006Z |
| team-guard.js | yes | 6657 | 2026-04-29T05:47:01.574Z |
| template-fillability.js | yes | 2939 | 2026-04-29T23:35:48.482Z |
| test.js | no | 12132 | 2026-05-03T19:46:50.740Z |
| typecheck.js | yes | 1743 | 2026-04-17T21:30:24.008Z |
| ui-lint.js | yes | 3396 | 2026-04-17T21:30:24.008Z |
| worktree-preflight.js | yes | 5343 | 2026-04-17T21:30:24.008Z |

## Lib modules

| Module | Size | Modified |
|---|---|---|
| banner.js | 4462 | 2026-04-22T05:49:15.963Z |
| concurrency-lock.js | 10962 | 2026-05-11T21:02:33.887Z |
| context-sources.js | 8286 | 2026-05-03T19:46:50.934Z |
| gate-schema.js | 3894 | 2026-04-29T05:48:00.921Z |
| logger.js | 15612 | 2026-05-12T23:11:21.600Z |
| mode.js | 2540 | 2026-04-29T18:58:58.761Z |
| paths.generated.js | 8028 | 2026-05-13T21:01:17.228Z |
| paths.js | 6081 | 2026-05-03T19:46:50.725Z |
| project-config.js | 4488 | 2026-04-29T05:50:17.120Z |
| provider-health.js | 10306 | 2026-05-11T21:08:20.670Z |
| providers.js | 23843 | 2026-05-12T06:58:28.992Z |
| role-aliases.js | 1904 | 2026-04-29T05:43:47.546Z |
| skill-telemetry.js | 5275 | 2026-05-13T20:42:22.196Z |
