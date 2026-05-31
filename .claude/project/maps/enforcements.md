# Enforcements Map

Generated: 2026-05-31T19:28:09.351Z

**63** hooks, **15** lib modules. **8** uncurated (added since last hand-curation on 2026-05-13T22:37:04.323Z).

## Coverage

- Total gaps tracked: 84
- Closed: 73
- Open: 11
- Open IDs: GAP-305, GAP-706, GAP-901, GAP-1103, GAP-1201, GAP-1204, GAP-1301, GAP-1302, GAP-1304, GAP-1305, GAP-1306

## Hooks

| id | matcher | phase | mode | registered | uncurated |
|---|---|---|---|---|---|
| authorization-gate | ? | ? | ? | yes | yes |
| beta-gate | AskUserQuestion | PreToolUse | fail-closed | yes |  |
| boss-boundary | Read|Grep|Glob | PreToolUse | fail-closed | yes |  |
| build-transaction-boundary | Agent | PreToolUse+PostToolUse | fail-open | yes |  |
| compact-saver | (universal) | PostCompact | fail-open | yes |  |
| create-worktree-from-head | (universal) | WorktreeCreate | fail-closed | no |  |
| cycle-enforcer | Agent | PreToolUse | fail-closed | yes |  |
| dependency-admission-guard | Edit|Write | PreToolUse | fail-closed | yes |  |
| dispatch-route-guard | Bash | PreToolUse | fail-closed | yes |  |
| edit-watcher | Edit|Write | PostToolUse | fail-open | yes |  |
| event-contract | Edit|Write | PostToolUse | advisory | yes |  |
| excalidraw-guard | mcp__claude_ai_Excalidraw__* | PreToolUse | fail-closed | yes |  |
| extension-edit-guard | Edit|Write | PreToolUse | advisory | yes |  |
| format | Edit|Write | PostToolUse | fail-open | yes |  |
| foundation-guard | Edit|Write | PreToolUse | fail-closed | yes |  |
| framework-manifest-guard | Bash (git commit) | PreToolUse | fail-closed | yes |  |
| framework-purity-guard | ? | ? | ? | yes | yes |
| gate-check | Agent | PreToolUse | fail-closed | yes |  |
| gauntlet-gate | Agent | PreToolUse | fail-closed | yes |  |
| learning-validator | Edit|Write | PostToolUse | advisory | yes |  |
| ledger-presence-guard | ? | ? | ? | yes | yes |
| lint-hook-output | ? | ? | ? | yes | yes |
| lint | Edit|Write | PostToolUse | fail-open | yes |  |
| memory-enforcement-guard | ? | ? | ? | yes | yes |
| memory-guard | Bash+Edit|Write | PreToolUse+PostToolUse | fail-closed | yes |  |
| merge-guard | Bash | PreToolUse+PostToolUse | fail-closed | yes |  |
| ownership-guard | Edit|Write | PreToolUse | fail-closed | yes |  |
| path-guard | Edit|Write | PreToolUse | advisory | yes |  |
| path-registry-guard | Bash (git commit) | PreToolUse | fail-closed | yes |  |
| pre-commit-steps-check | (git pre-commit) | git-pre-commit | fail-closed | yes |  |
| prompt-logger | (universal) | UserPromptSubmit | fail-open | yes |  |
| prompt-validator | Agent | PreToolUse | mixed | yes |  |
| ref-checker | (CLI tool) | manual | advisory | no |  |
| region-marker-guard | Edit|Write | PostToolUse | advisory | yes |  |
| requirement-format-guard | Edit|Write | PreToolUse | mixed | yes |  |
| response-size-guard | Agent | PostToolUse | advisory | yes |  |
| retro-presence-check | (universal) | Stop | advisory | yes |  |
| save-session-lint | Edit|Write | PostToolUse | fail-open | yes |  |
| scope-contract-guard | Agent | PreToolUse | fail-closed | yes |  |
| secret-guard | Edit|Write | PreToolUse | fail-closed | yes |  |
| self-mod-governance | Edit|Write | PreToolUse | advisory | yes |  |
| session-start | (universal) | SessionStart | fail-open | yes |  |
| session-stop | (universal) | Stop|SessionEnd|StopFailure | fail-open | yes |  |
| session-tracker | (universal) | PostToolUse | fail-open | yes |  |
| skill-catalog-regen | Edit|Write | PostToolUse | fail-open | yes |  |
| skill-counter | (universal) | UserPromptSubmit | fail-open | no |  |
| skill-invocation-tracker | SlashCommand|Skill | PreToolUse | fail-open | yes |  |
| smart-context | (universal) | UserPromptSubmit | fail-open | yes |  |
| spec-test-staleness | Edit|Write | PostToolUse | advisory | yes |  |
| sprint-approval-guard | Bash | PreToolUse | fail-closed | yes |  |
| sprint-routing-guard | ? | ? | ? | yes | yes |
| sprint-tracker-guard | Edit|Write | PreToolUse | mixed | yes |  |
| step-hardcode-suggester | Edit|Write | PostToolUse | advisory | yes |  |
| step-registry-guard | Edit|Write | PreToolUse | fail-closed | yes |  |
| store-validator | Edit|Write | PreToolUse+PostToolUse | fail-closed | yes |  |
| systems-sync | Edit|Write | PostToolUse | fail-open | yes |  |
| team-guard | Agent | PreToolUse | fail-closed | yes |  |
| template-fillability | Edit|Write | PostToolUse | advisory | yes |  |
| typecheck | Edit|Write | PostToolUse | mixed | yes |  |
| ui-lint | Edit|Write | PostToolUse | advisory | yes |  |
| untrusted-content-firewall | ? | ? | ? | yes | yes |
| version-bump-guard | ? | ? | ? | yes | yes |
| worktree-preflight | Agent | PreToolUse | fail-closed | yes |  |

## Lib modules

| id | file | uncurated |
|---|---|---|
| banner | scripts/hooks/lib/banner.js |  |
| concurrency-lock | scripts/hooks/lib/concurrency-lock.js |  |
| context-sources | scripts/hooks/lib/context-sources.js |  |
| gate-schema | scripts/hooks/lib/gate-schema.js |  |
| injection-patterns | scripts/hooks/lib/injection-patterns.js | yes |
| logger | scripts/hooks/lib/logger.js |  |
| mode | scripts/hooks/lib/mode.js |  |
| paths.generated | scripts/hooks/lib/paths.generated.js |  |
| paths | scripts/hooks/lib/paths.js |  |
| project-config | scripts/hooks/lib/project-config.js |  |
| provider-health | scripts/hooks/lib/provider-health.js |  |
| providers | scripts/hooks/lib/providers.js |  |
| role-aliases | scripts/hooks/lib/role-aliases.js |  |
| skill-telemetry | scripts/hooks/lib/skill-telemetry.js |  |
| untrusted-content | scripts/hooks/lib/untrusted-content.js | yes |
