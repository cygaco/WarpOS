# Angle 1 (DECLARATIVE) — /discover:systems (2026-07-09)

Format: `slug | category | declared-where | evidence`

**Agent / orchestration**
- alex-agent-team | orchestration | manifest.agents, AGENTS.md, PROJECT.md | The 5 Alex faces α/β/γ/δ/ε
- build-agent-roster | orchestration | manifest.agents.build, AGENTS.md | builder/reviewer/fixer/qa-reviewer/security-reviewer/ops-analyst/skeleton-builder/test-runner/visual-review
- department-org-tree | orchestration | AGENTS.md, paths.orgRoleRegistry | president/engineering/product/growth/_system/_org
- role-registry | orchestration | AGENTS.md, paths.orgRoleRegistry | keystone role↔spec source of truth
- build-modes | orchestration | manifest.agents.modes, PROJECT.md | solo/adhoc/oneshot/sprint
- mode-lifecycle-hooks | orchestration | paths.modeLifecycleHooks/modeMarker | mode entry/exit hook points + mode marker
- review-gauntlet | quality | AGENTS.md §Review Protocol | 4-agent parallel gauntlet (evaluator/compliance/security/QA)
- beta-judgment-model | orchestration | CLAUDE.md, paths.judgmentModel/betaEvents | β DECIDE/DIRECTIVE/ESCALATE

**Dispatch**
- dispatch-kernel | dispatch | CLAUDE.md §Dispatch, PROJECT.md | CLI-mandatory cross-provider dispatch
- dispatch-route-guard | dispatch | PROJECT.md, CLAUDE.md | hook blocking raw provider Bash calls
- dispatch-contract | dispatch | CLAUDE.md | CLI-vs-API validator
- dispatch-completion-records | dispatch | paths.dispatchCompletionsFile/dispatchDeathsFile/dispatchLocks | completion/death/lock ledger
- provider-routing | dispatch | manifest.providers/agentProviders | claude/openai/gemini mapping + fallback
- provider-health-rca | dispatch | paths.providerSmokeSkill/providerRcaLib/providerAutofixLib/providerFailureModes | smoke + RCA + autofix
- orphan-reaper | dispatch | CLAUDE.md | reap-orphans.js (ED-039/RI-004)

**Sprint**
- sprint-runtime | sprint | manifest.features, AGENTS.md, paths.sprintRoot | ε registry-driven runtime (ADR-0009)
- sprint-lifecycle | sprint | PROJECT.md, sprint:* skills | plan→design→execute→release→retro + Plan Contracts
- sprint-tickets | sprint | paths.sprintTickets/sprintIssues | ticket + issue-ledger
- sprint-active-registry | sprint | paths.sprintActiveRegistry | multi-sprint parallel registry
- sprint-checkpoints | sprint | paths.sprintCheckpoints/sprintRalph | crash-safe Ralph-loop checkpoints
- sprint-hook-points | sprint | paths.sprintHookPoints | declarative phase hook registry
- sprint-full-autonomy | sprint | paths.sprintFullAutonomy/sprintRouting | bounded autonomy preset + routing policy
- beta-honesty-audit | sprint | paths.betaHonestyWaivers, scan:sprint-beta-honesty | β honesty enforcement

**Memory / learning**
- event-log | memory | CLAUDE.md, paths.eventsFile/toolsFile/skillUsageFile | append-only telemetry via logger.js
- learning-lifecycle | memory | CLAUDE.md, paths.learningsFile | semantic memory via /sleep
- traces | memory | CLAUDE.md, paths.tracesFile | reasoning-episode store
- systems-manifest | memory | CLAUDE.md, paths.systemsFile | systems inventory (degenerate — see note)
- recurring-issues | memory | paths.recurringIssuesFile, issues:* | repeat-pattern register
- enforcement-debt | governance | CLAUDE.md, paths.enforcementDebt | ED-NNN ledger
- decision-ledger | governance | paths.decisionLedger/providerTrace | Class-B/C decisions + provider trace
- relationship-maps | memory | paths.maps, maps:* | architecture/hooks/skills/systems graphs
- sleep-consolidation | memory | sleep:deep/quick | NREM/REM maintenance
- beta-mining | memory | beta:mine/integrate | behavior mining into judgment model

**Infra / config**
- paths-registry | infra | CLAUDE.md, PROJECT.md, paths.json | source→generated resolver
- path-guard | infra | PROJECT.md, CLAUDE.md | stale-literal warn hook + path-lint
- hooks-pipeline | infra | PROJECT.md, paths.hooks | hooks via hooks.registry.json
- smart-context | infra | CLAUDE.md §Prompt Pipeline | per-prompt Haiku enrichment (NOW DISABLED 2026-07-09)
- skill-catalog | infra | CLAUDE.md §Skill Use, paths.skillCatalog | salience-driven skills
- manifest | infra | manifest.json, paths.manifest | project identity card
- settings-derivation | infra | PROJECT.md | settings.json compiled from registry+defaults+local

**Governance / enforcement**
- scan-suite | governance | scan:* skills | ~60 parallel scans
- enforcer-doctrine | governance | CLAUDE.md §Policy Hygiene | "every policy needs a named enforcer"
- tracker-system | governance | trackers:*, TRACKER.md | enforced tracker (20 checks)
- roadmap-epics | governance | roadmap:*/epic:*, ROADMAP.md | epic-based roadmap
- contracts-validator | governance | paths.contractsValidator/contractsSchemas/contractsSpec | artifact-contract validation
- reasoning-frameworks | governance | CLAUDE.md §Reasoning, paths.reasoningFrameworks | classification + fix scoring

**Product / distribution**
- product-bootstrap | product | manifest.features, spinup/lastmile | idea→screen→paid
- portfolio-system | product | paths.portfolio*, portfolio:* | sibling-repo products
- warpos-distribution | product | warp:* skills, paths.frameworkRoot | canonical→installed capsule releases
- panel-gui-suite | product | paths.panelRegistry/adminPanelRegistry, panel:*/admin:* | browser cockpit panels
- model-router | product | models:*, paths.providerFallbackPolicy | Dispatch Console routing
- guides-library | product | _guides, guides:* | launch guides
- knowledge-library | product | knowledge:* | domain knowledge wiring
- etc-harness | product | paths.etcEvalPacks/etcDecisions, etc:* | skill/prompt eval harness
- karpathy-autoresearch | product | paths.karpathyRuns, karpathy:* | closed-loop optimization
- growth-suite | product | growth:* | angles→message→ads pipeline
- ingest-firewall | governance | scan:ingest-firewall, _docs/research | external-knowledge firewall
- reports-eli5 | product | report skill, paths.reportsDir | ELI5 reports

## Angle-1 source quality (honest)
1. **PROJECT.md is the single best declarative source** — names systems at the right granularity with counts; CLAUDE.md + AGENTS.md corroborate.
2. **paths.json (136 keys) is a strong implicit declaration** — clustering recovered ~20 under-emphasized systems, but declares storage not behavior.
3. **systems.jsonl is effectively worthless as a declarative source** — 90 entries, every name a verbatim skill description (per-skill auto-noise). Names ~0 distinct architectural systems. Treat as known-degenerate.
