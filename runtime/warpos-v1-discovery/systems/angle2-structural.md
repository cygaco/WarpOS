# Angle 2 (STRUCTURAL) — /discover:systems (2026-07-09)

Format: `slug | category | root-path(s) | #files | what-it-is`

**Dispatch & agents**
- dispatch-kernel | dispatch | scripts/dispatch/ | 38 | dispatch engine — state/save/safe-spawn/breaker/timeout/auth-resolver, each paired .test.js
- dispatch-gauntlet-verify | dispatch | scripts/dispatch/{gauntlet-verify,reap-orphans,prune-dead-locks}.js | 6 | liveness/record verification
- dispatch-console-gui | gui | scripts/dispatch/{gui,cli-preview,catalog}.js | 4 | browser Dispatch Console
- agent-roster | agents | .claude/agents/** | ~40 | dept-tree agent specs
- agent-principles | agents | .claude/agents/_principles, _org/role-registry.json | few | principle base + bijection keystone
- agent-memory | state | .claude/agent-memory/{epsilon,beta} | 30 | per-face persistent memory

**Hooks & guards**
- hooks-system | hooks | scripts/hooks/ | 79 | lifecycle hooks
- hooks-lib | hooks | scripts/hooks/lib/ | 18 | logger, paths.generated, concurrency-lock, injection-patterns
- guard-mesh | enforcement | scripts/**/*guard*.js | 42 | write-time guards

**Scan / checks / enforcement**
- checks-library | enforcement | scripts/checks/ | 124 | ⚠️ FLAT DUMPING GROUND (124 loose files)
- warpos-distribution-checks | enforcement | scripts/checks/warpos-*.js | 17 | install/manifest/capsule integrity
- dispatch-contract-checks | enforcement | scripts/checks/dispatch-*.js | 6 | CLI-vs-API + routing parity
- enforcement-debt-registry | governance | paths.enforcementDebt | 1 | ED-### ledger

**Skills**
- skills-library | skills | .claude/commands/ | ~350 | /namespace:skill catalog
- skills-tooling | skills | scripts/skills/, scripts/etc/ | 6 | authoring + eval harness

**Sprint runtime & state**
- sprint-runtime | sprint | scripts/sprint/ | 42 | epsilon-runtime + hook-point registry
- sprint-state-store | state | .claude/project/sprint/ | **2379** | ⚠️ MASSIVE accretion — checkpoints 496 / tickets 371 / requirements 700 / plan-contracts 164 / releases 67
- sprint-history-archive | archive | .claude/project/sprint/{history,sprints,full-reports} | ~500 | per-sprint reports
- ralph-loop-store | state | .claude/project/sprint/ralph/ | 43 | loop progress

**WarpOS distribution**
- warpos-tooling | warpos | scripts/warpos/ | 39 | release/capsule/manifest backends
- warpos-release-archive | archive | framework/releases/ | ~200 | snapshots 0.1.0→0.17.0
- path-registry-build | build | framework/paths.registry.json + scripts/paths/ | 4+ | source→generated
- registry-manifests | build | framework/*.registry.json | 4 | hooks/panel/admin-panel/paths registries
- warpos-shipping-source | warpos | _warpos/ | 358 | templates + BASELINE + EXAMPLES
- migrations-system | migrations | migrations/ | 9 | versioned upgrade scripts
- schemas-system | schemas | schemas/ | 32 | JSON schemas
- install-bootstrap | build | install.ps1, version.json | 2 | fresh-install entrypoint

**Portfolio / products / bootstrap**
- portfolio-system | portfolio | scripts/portfolio/, scripts/products/ | 21 | multi-product suite
- bootstrap-spinup | bootstrap | scripts/{bootstrap,canon,scaffold}/ | ~16 | idea→on-screen
- bootstrap-lastmile | bootstrap | scripts/bootstrap/lastmile/** | ~23 | prototype→monetizable
- requirements-tooling | bootstrap | scripts/requirements/ | 12 | requirement authoring/validation
- admin-panel-suite | gui | scripts/{admin,panel,cockpit}/ | 7 | founder admin + readiness cockpit
- roadmap-gui | gui | scripts/panel/ | 3 | roadmap board

**Research / learning / reasoning**
- research-harness | research | scripts/research/ | 8 | multi-provider deep research
- learning-system | learning | scripts/learn/ + learningsFile | 4+ | learn:deep/ingest/integrate
- sleep-cycle | learning | scripts/*sleep*.js | 4 | consolidation passes
- karpathy-autoresearch | research | karpathy + worktrees | few | closed-loop optimization
- reasoning-traces | learning | tracesFile + reasoning-frameworks.md | few | episode log + router
- dreams-store | learning | .claude/dreams/ | 9 | REM-dream artifacts

**Build engines**
- oneshot-delta-engine | build | scripts/delta-*.js + oneshot* | 30 | skeleton-build state machine
- preflight-audit | build | scripts/preflight*.js | 9 | pre-run audit

**Observability / memory / state (unglamorous)**
- event-log | logging | .claude/project/events/ | 4 | append-only event log
- project-maps | observability | .claude/project/maps/ | 27 | relationship graphs
- session-inbox | coordination | session:read/write files | few | cross-session bus
- handoffs-archive | archive | .claude/runtime/handoffs/ | **97** | ⚠️ accumulated handoffs — DUMPING GROUND
- epsilon-prompts-store | state | .claude/runtime/epsilon-prompts (57) + runtime/epsilon-prompts (17) | 74 | ⚠️ SPLIT across two roots
- checkpoints-store | state | .claude/project/sprint/checkpoints/ | 496 | crash-recovery checkpoints

**⚠️ DUMPING GROUNDS**
- dot-warpos-scratch | scratch | .warpos/ | **11244** | ⚠️ HIDDEN MEGA-DUMP (largest dir in repo) — dispshape/dt/regauntlet-prompts, ingest-scratch, planning, test-fixtures + 24 .err/17 .patch/50 .json at root
- runtime-scratch | scratch | runtime/ | 1000s | ⚠️ 40+ sprint-scoped subdirs (sp001-gauntlet 84, scan-runs 54, sp-teams-migration 43)
- runtime-root-clutter | scratch | runtime/_ed*.js, *.log, s-pf-*, sp-*.err | ~40 | ⚠️ loose one-off scripts + probe/review debris
- gamma-scratch | scratch | .claude/runtime/.gamma-*.txt | 100+ | ⚠️ per-build gamma transcript dumps
- codex-scratch | scratch | .codex/, CODEX-LOG.md (91KB), CODEX.md | 3 | codex config + 91KB append-only log at root
- runtime-notes | scratch | runtime/notes (48) + .claude/runtime/notes (2) | 50 | ⚠️ SPLIT across two roots
- root-md-sprawl | docs | ./*.md | 30 | ⚠️ TRACKER(212KB)/ROADMAP(379KB)/NOTAGAIN/DISPATCH-ERRORS + a dozen WARPOS-*.md at root

**Docs / knowledge / reference**
- reference-docs | docs | .claude/project/reference (21), _docs (116) | 137
- guides-system | docs | _guides/ (25) | 25
- knowledge-system | docs | _knowledge/ (72) | 72
- requirements-canon | docs | _requirements/ | 66
- planning-docs | docs | _planning/ | 56
- reports-dir | reports | _reports/ | 24
- warpos-v1-charter | docs | WarpOS-v1/ | 24 | frozen spec pack

**Trackers / governance**
- enforced-tracker-system | governance | trackers/ (38), TRACKER.md, scripts/trackers/ | 40
- epic-system | governance | scripts/epic/, commands/epic (10) | 13
- roadmap-system | governance | ROADMAP.md, roadmap:* | few
- drift-detection | enforcement | scripts/drift-*.js | 10 | drift-queue scanners

**Testing / fixtures**
- test-suite | testing | tests/ (136), scripts/test-*.js (23), *.test.js | 160+
- fixtures-system | testing | fixtures/ (23) + checks fixtures + tooltest | 30+
- contracts-fixtures | testing | scripts/contracts/fixtures/ | 6

**Misc infra**
- turbo-system | config | scripts/turbo/ | 5
- models-router | config | scripts/models/, scripts/panel/ | 5
- paths-tooling | build | scripts/paths/ | 4
- arbitration-system | dispatch | scripts/arbitration/ | 3
- patterns-lib | reference | patterns/ | 6

**3 structural signals:**
1. `.claude/runtime/` and `runtime/` are PARALLEL scratch roots — same system class split across both; any single-root inventory undercounts.
2. `.warpos/` (hidden, 11,244 files) is the largest dir in the repo, pure scratch/fixtures — easy to miss.
3. Two biggest tracked accretion points: `scripts/checks/` (124 flat) and `.claude/project/sprint/` (2,379 files).
