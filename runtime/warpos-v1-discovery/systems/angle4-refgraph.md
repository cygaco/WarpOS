# Angle 4 (REFERENCE GRAPH) — /discover:systems (2026-07-09)

## Hubs
| slug | ref-count | what-system |
|---|---|---|
| logger-lib | 45 req (lib/logger) | event-emission spine — almost every script |
| paths-lib | ~123 req (4 aliases) | path-registry resolver |
| events-file | 50 (paths.eventsFile) | append-only event log — most-referenced key |
| learnings-file | 20 | semantic-memory store |
| decision-policy | 20 | autonomy/decision-rights authority |
| sprint-active-registry | 18 | live-sprint registry hub |
| maps-dir | 16 | relationship-graph store |
| current-stage 15 · beta-events 15 | | product-stage authority · β telemetry |
| decision-ledger | 14 | decision audit trail |
| agent-dispatch-guide 10 · dispatch-contract 7 req | | dispatch doctrine + enforcer |
| registry-roles | 14 req | org role registry loader |
| fixture-harness | 15 req | shared harness for scan/check suites |

Top skill hubs (inbound /ns:name): /scan:full (63), /sprint:full (55), /warp:update (47), /sleep:deep (46), /sprint:plan (40), /fix:deep (35), /warp:health (29), /sprint:retrospective (29).

## Clusters
- **memory-spine** — logger-lib + events-file + paths-lib + learnings-file + traces-file(10) + systems-file(6). Highest centrality.
- **sprint-runtime** — sprintActiveRegistry(18) + sprintProgress(9) + sprintTickets(8) + sprintRoot(7) + sprintCheckpoints(5) + /sprint:* skills. Second-densest.
- **decision-governance** — decisionPolicy(20) + currentStage(15) + betaEvents(15) + decisionLedger(14) + judgmentModel(4).
- **dispatch-fabric** — dispatch-contract + agentDispatchGuide + dispatchCompletionsFile(9) + registry-roles. NOTE lock/death split in Orphans.
- **scan-check-harness** — fixture-harness binds scan/check; /scan:full is fan-out root.
- **enforcement-loop** — enforcementDebt(5) + recurringIssuesFile(9) + specGraph(8).

## Orphans (zero real inbound; only self or auto-generated catalogs)
| file / key | evidence |
|---|---|
| scripts/celebrate.js | auto-catalog only, no caller |
| scripts/analyze-run12*.js, append-run12-learnings.js | run-12 one-offs, dead |
| scripts/one-off-*.js (~18) | identical catalog-only signature — orphaned one-shots |
| scripts/drift-*.js (~9) | drift-queue tooling appears abandoned — verify before reuse |
| fix-deep-trace-run09-cleanup.js, learn-conversation-2026-04-24.js | dated one-offs |
| paths.toolsFile, paths.reasoningFrameworks, paths.portfolioHome, paths.clonesRoot | 0 refs anywhere — orphan keys |
| paths.panelRegistry, paths.adminPanelRegistry | 0 each — panel system reads via other keys/literals |
| **paths.dispatchLocks, paths.dispatchDeathsFile** | **0 — dispatch fabric writes these by LITERAL path; keys decayed out of use though the system is alive. Registry-vs-usage drift.** |
| paths.sprintHookPoints, paths.skillHookPoints | 1 each — the known generated-only orphan pair |

Load-bearing note: the dispatchLocks/dispatchDeathsFile zero is genuine registry drift, not dead code — the live dispatch system writes by literal path, so the keys are decaying. Same class CLAUDE.md already flags for orgRoleRegistry/sprintHookPoints.
