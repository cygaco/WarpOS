# Skills Map

Generated: 2026-04-17T04:05:37.518Z

| id | namespace | name | description |
|---|---|---|---|
| skill:beta:integrate | beta | integrate | Apply validated recommendations from beta mining into the judgment model |
| skill:beta:mine | beta | mine | Mine patterns from user behavior — prompts, decisions, skill chains, evolution cycles |
| skill:check:all | check | all | Run every check in parallel and produce one unified report — architecture, environment, references, requirements, patterns, system. One command for full project health. |
| skill:check:architecture | check | architecture | Architecture integrity — do the layers connect? agent system, cross-layer seams, documentation health |
| skill:check:environment | check | environment | Environment readiness and tooling quality — fast go/no-go or deep audit |
| skill:check:patterns | check | patterns | Cross-run intelligence and automation proposals — diagnose recurring patterns or propose prevention |
| skill:check:references | check | references | Cross-file reference integrity — broken links, orphans, stale SPEC_GRAPH edges |
| skill:check:requirements | check | requirements | Specification consistency, coverage, and drift — static audit, change-driven propagation check, or pending-drift review |
| skill:check:system | check | system | System inventory — enumerate every active WarpOS system, diff against manifest, report drift and gaps |
| skill:commit:both | commit | both | Commit locally then push to remote — full commit + push flow |
| skill:commit:local | commit | local | Stage and commit changes locally — smart message, no push |
| skill:commit:remote | commit | remote | Push current branch to remote — with safety checks |
| skill:fav:list | fav | list | Browse all saved favorite moments, grouped by category |
| skill:fav:search | fav | search | Search favorite moments by keyword |
| skill:fix:deep | fix | deep | Deep fix — Full diagnostic with automatic framework selection, 5 solutions, root cause analysis, and prevention |
| skill:fix:fast | fix | fast | Quick fix — Direct Investigation, no formal framework. Read error, find cause, fix it, verify. |
| skill:hooks:add | hooks | add | Design and create a new hook from a description |
| skill:hooks:disable | hooks | disable | Temporarily disable a hook |
| skill:hooks:friction | hooks | friction | Analyze friction points — find patterns that suggest missing hooks |
| skill:hooks:sync | hooks | sync | Copy hooks to WarpOS repo |
| skill:hooks:test | hooks | test | Test all hooks with synthetic payloads and measure execution time |
| skill:learn:combined | learn | combined | Combined learning — runs learn:conversation + learn:events in parallel, then deduplicates and reports |
| skill:learn:conversation | learn | conversation | Conversation learning — extract learnings from conversation, then review and maintain learning quality |
| skill:learn:events | learn | events | Mine the event log for learnings — patterns, anomalies, and insights from tool/prompt/spec/audit events |
| skill:learn:ingest | learn | ingest | Ingest external knowledge from files, links, or YouTube videos and apply learnings to the system |
| skill:maps:all | maps | all | Registry of all maps — shows every map, its source, last updated, and staleness |
| skill:maps:architecture | maps | architecture | App structure — routes, components, libs, how they connect |
| skill:maps:enforcements | maps | enforcements | Enforcement coverage — hooks, gates, gap analysis, open/closed gaps |
| skill:maps:hooks | maps | hooks | Hook wiring diagram — events, matchers, scripts, execution order |
| skill:maps:memory | maps | memory | Memory store relationships — who reads/writes each store, entry counts |
| skill:maps:skills | maps | skills | Skill dependency graph — namespaces, cross-references, data flow |
| skill:maps:systems | maps | systems | Systems manifest graph — dependencies, status, categories |
| skill:maps:tools | maps | tools | Tool registry — skills, hooks, external CLIs, API services, npm scripts, platform tools |
| skill:mode:adhoc | mode | adhoc | Enter adhoc team mode — Alpha + Beta + Gamma for collaborative feature development |
| skill:mode:oneshot | mode | oneshot | Initiate a oneshot build — launch Delta as standalone orchestrator for full skeleton runs |
| skill:mode:solo | mode | solo | Enter solo mode — just Alpha and the user, no agent team |
| skill:preflight:improve | preflight | improve | Update preflight passes based on gaps discovered during runs |
| skill:preflight:run | preflight | run | Pre-run workflow — 7 verification passes + branch creation with skeleton stubs |
| skill:qa:audit | qa | audit | Active full-codebase QA audit — systematically walks all 7 failure-mode personas |
| skill:qa:check | qa | check | Passive QA scan on recent git diff changes — checks for 7 failure-mode signatures |
| skill:reasoning:log | reasoning | log | Log a reasoning episode — record what framework was used, why, and what happened |
| skill:reasoning:run | reasoning | run | Reason through a problem or decision — auto-detects quick triage vs deep deliberation |
| skill:reasoning:score | reasoning | score | Score fix quality (0-4) and retroactively reclassify old fixes when new evidence appears |
| skill:redteam:full | redteam | full | Full red team audit — 11 personas across deterministic scanning + LLM reasoning. Finds auth bypasses, prompt injection, business logic abuse, attack chains. |
| skill:redteam:scan | redteam | scan | Quick red team scan — deterministic tools only (deps, routes, CVEs, secrets, config). Fast, no LLM reasoning. |
| skill:research:deep | research | deep | Real deep research — Gemini Thinking writes the brief, then OpenAI Deep Research API + Gemini Deep Research API + Claude multi-round search run in parallel |
| skill:research:simple | research | simple | Deep research pipeline — queries Claude, ChatGPT (Codex), and Gemini in parallel, saves reports, synthesizes, and applies learnings |
| skill:retro:code | retro | code | Scan git diff for code-level retro signals — bug fixes, new patterns, hygiene rules |
| skill:retro:context | retro | context | Scan conversation context for retro signals — bug reports, decisions, deferred items, UX feedback |
| skill:retro:full | retro | full | Full retro — context + git log + code diffs + cross-run analysis, all 9 categories |
| skill:session:checkpoint | session | checkpoint | Force an immediate session checkpoint save |
| skill:session:handoff | session | handoff | Generate a rich AI-analyzed handoff document (replaces /handoff) |
| skill:session:history | session | history | Browse recent session summaries from handoffs/ directory |
| skill:session:read | session | read | Read the cross-session inbox — see what other Alex sessions have been doing |
| skill:session:resume | session | resume | Load and display the last handoff or checkpoint — use after /clear or cold start |
| skill:session:write | session | write | Post a message to the cross-session inbox so other Alex sessions can see it |
| skill:skills:cleanup | skills | cleanup | Audit all skills for dead weight, duplicates, broken references, and namespace issues — then clean up |
| skill:skills:create | skills | create | Create a new skill from a description — supports simple, multi-phase, and parallel workflows |
| skill:skills:delete | skills | delete | Remove a skill (with backup) |
| skill:skills:edit | skills | edit | Edit an existing skill |
| skill:sleep:deep | sleep | deep | Full sleep cycle — all 6 phases: NREM consolidation, cleanup, replay, REM dreaming, repair, growth (~15-30 min) |
| skill:sleep:quick | sleep | quick | Light nap — NREM consolidation + glymphatic cleanup only (~5 min) |
| skill:ui:review | ui | review | Design system compliance audit — read-only check of components against the projects design-system docs |
| skill:warp:check | warp | check | Compare your WarpOS installation against the latest version — find stale, new, and missing items |
| skill:warp:health | warp | health | Verify WarpOS installation — checks every system, reports green/yellow/red with plain-English fixes |
| skill:warp:init | warp | init | Set up WarpOS in your project — clone the repo, run the installer, get started |
| skill:warp:sync | warp | sync | Update WarpOS from the latest version on GitHub |
| skill:warp:tour | warp | tour | Guided introduction to WarpOS — explains everything in simple language, no jargon |
