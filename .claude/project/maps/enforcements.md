# Enforcements Map

Generated: 2026-05-13T22:12:54.429Z

**57** hooks, **13** lib modules. **24** uncurated (added since last hand-curation on 2026-04-18).

## Coverage

- Total gaps tracked: 84
- Closed: 73
- Open: 11
- Open IDs: GAP-305, GAP-706, GAP-901, GAP-1103, GAP-1201, GAP-1204, GAP-1301, GAP-1302, GAP-1304, GAP-1305, GAP-1306

## Hooks

| id | matcher | phase | mode | registered | uncurated |
|---|---|---|---|---|---|
| beta-gate | AskUserQuestion | PreToolUse | fail-closed | yes |  |
| boss-boundary | Read|Grep|Glob | PreToolUse | fail-closed | yes |  |
| build-transaction-boundary | ? | ? | ? | yes | yes |
| build | ? | ? | ? | no | yes |
| compact-saver | (universal) | PostCompact | fail-open | yes |  |
| create-worktree-from-head | (universal) | WorktreeCreate | fail-closed | no |  |
| cycle-enforcer | Agent | PreToolUse | fail-closed | yes |  |
| dependency-admission-guard | ? | ? | ? | yes | yes |
| dispatch-route-guard | ? | ? | ? | yes | yes |
| edit-watcher | Edit|Write | PostToolUse | fail-open | yes |  |
| event-contract | ? | ? | ? | yes | yes |
| excalidraw-guard | mcp__claude_ai_Excalidraw__* | PreToolUse | fail-closed | yes |  |
| extension-edit-guard | ? | ? | ? | yes | yes |
| format | Edit|Write | PostToolUse | fail-open | yes |  |
| foundation-guard | Edit|Write | PreToolUse | fail-closed | yes |  |
| framework-manifest-guard | Bash (git commit) | PreToolUse | fail-closed | yes |  |
| gate-check | Agent | PreToolUse | fail-closed | yes |  |
| gauntlet-gate | Agent | PreToolUse | fail-closed | yes |  |
| learning-validator | Edit|Write | PostToolUse | advisory | yes |  |
| lint | Edit|Write | PostToolUse | fail-open | yes |  |
| memory-guard | Bash+Edit|Write | PreToolUse+PostToolUse | fail-closed | yes |  |
| merge-guard | Bash | PreToolUse+PostToolUse | fail-closed | yes |  |
| ownership-guard | Edit|Write | PreToolUse | fail-closed | yes |  |
| path-guard | Edit|Write | PreToolUse | advisory | yes |  |
| path-registry-guard | ? | ? | ? | yes | yes |
| pre-commit-steps-check | ? | ? | ? | yes | yes |
| prompt-logger | (universal) | UserPromptSubmit | fail-open | yes |  |
| prompt-validator | Agent | PreToolUse | mixed | yes |  |
| ref-checker | (CLI tool) | manual | advisory | no |  |
| region-marker-guard | ? | ? | ? | yes | yes |
| requirement-format-guard | ? | ? | ? | yes | yes |
| response-size-guard | ? | ? | ? | yes | yes |
| retro-presence-check | ? | ? | ? | yes | yes |
| save-session-lint | Edit|Write | PostToolUse | fail-open | yes |  |
| scope-contract-guard | ? | ? | ? | yes | yes |
| secret-guard | Edit|Write | PreToolUse | fail-closed | yes |  |
| self-mod-governance | ? | ? | ? | yes | yes |
| session-start | (universal) | SessionStart | fail-open | yes |  |
| session-stop | (universal) | Stop|SessionEnd|StopFailure | fail-open | yes |  |
| session-tracker | (universal) | PostToolUse | fail-open | yes |  |
| skill-catalog-regen | ? | ? | ? | yes | yes |
| skill-counter | ? | ? | ? | no | yes |
| skill-invocation-tracker | ? | ? | ? | yes | yes |
| smart-context | (universal) | UserPromptSubmit | fail-open | yes |  |
| spec-test-staleness | ? | ? | ? | yes | yes |
| sprint-approval-guard | ? | ? | ? | yes | yes |
| sprint-tracker-guard | ? | ? | ? | yes | yes |
| step-hardcode-suggester | ? | ? | ? | yes | yes |
| step-registry-guard | ? | ? | ? | yes | yes |
| store-validator | Edit|Write | PreToolUse+PostToolUse | fail-closed | yes |  |
| systems-sync | Edit|Write | PostToolUse | fail-open | yes |  |
| team-guard | Agent | PreToolUse | fail-closed | yes |  |
| template-fillability | ? | ? | ? | yes | yes |
| test | ? | ? | ? | no | yes |
| typecheck | Edit|Write | PostToolUse | mixed | yes |  |
| ui-lint | Edit|Write | PostToolUse | advisory | yes |  |
| worktree-preflight | Agent | PreToolUse | fail-closed | yes |  |

## Lib modules

| id | file | uncurated |
|---|---|---|
| banner | scripts/hooks/lib/banner.js | yes |
| concurrency-lock | scripts/hooks/lib/concurrency-lock.js | yes |
| context-sources | scripts/hooks/lib/context-sources.js | yes |
| gate-schema | scripts/hooks/lib/gate-schema.js | yes |
| logger | scripts/hooks/lib/logger.js | yes |
| mode | scripts/hooks/lib/mode.js | yes |
| paths.generated | scripts/hooks/lib/paths.generated.js | yes |
| paths | scripts/hooks/lib/paths.js | yes |
| project-config | scripts/hooks/lib/project-config.js | yes |
| provider-health | scripts/hooks/lib/provider-health.js | yes |
| providers | scripts/hooks/lib/providers.js | yes |
| role-aliases | scripts/hooks/lib/role-aliases.js | yes |
| skill-telemetry | scripts/hooks/lib/skill-telemetry.js | yes |
