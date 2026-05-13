# Skills Map

Generated: 2026-05-13T22:37:04.323Z

Total: **129** skills across **31** namespaces. 60 user-invocable.

## By namespace

### agents (2)

| Name | Description | Calls | Called by |
|---|---|---|---|
| list | Enumerate every agent spec by mode and role. | 0 | 0 |
| test | Smoke-dispatch one agent role (or all non-claude roles) with a tiny ping prompt. | 0 | 0 |

### beta (2)

| Name | Description | Calls | Called by |
|---|---|---|---|
| integrate | Apply validated recommendations from beta mining into the judgment model | 2 | 2 |
| mine | Mine patterns from user behavior — prompts, decisions, skill chains, evolution cycles | 4 | 2 |

### check (26)

| Name | Description | Calls | Called by |
|---|---|---|---|
| all | Run every check in parallel and produce one unified report — architecture, environment, references,  | 11 | 4 |
| architecture | Architecture integrity — do the layers connect? agent system, cross-layer seams, documentation healt | 6 | 7 |
| coherence | Run the WarpOS system coherence graph across 15 drift types. | 0 | 0 |
| design-system | Design system compliance check - scans UI code for raw colors, raw primitives, missing design docs,  | 0 | 0 |
| environment | Environment readiness and tooling quality — fast go/no-go or deep audit | 8 | 3 |
| install | Verify a fresh WarpOS install — manifest, paths, agents, hooks, version, settings. | 1 | 0 |
| patterns | Cross-run intelligence and automation proposals — diagnose recurring patterns or propose prevention | 8 | 5 |
| privacy | Pre-publish scan for personal data — credentials, emails, homedir paths, runtime files tracked by gi | 0 | 0 |
| references | Cross-file reference integrity — broken links, orphans, stale SPEC_GRAPH edges | 4 | 8 |
| requirements | Specification consistency, coverage, and drift — static audit, change-driven propagation check, or p | 7 | 10 |
| system | System inventory — enumerate every active WarpOS system, diff against manifest, report drift and gap | 6 | 2 |
| timeline | Reconstruct a build timeline from transaction, event, and provider logs. | 0 | 0 |
| warpos-applied-migrations | Detect already-applied WarpOS migration scripts left on disk in consumer projects | 0 | 0 |
| warpos-capsule-resolvable | Verify the capsule for /warp:update --to <v> is resolvable from REPO_ROOT, sibling clones, manifest. | 1 | 0 |
| warpos-install-baseline | Verify a WarpOS install baseline exists (.claude/framework-installed.json present, installedVersion  | 1 | 0 |
| warpos-manifest-honesty | Verify framework-installed.json reflects actual disk state (no missing files, no hash drift) | 1 | 1 |
| warpos-migration-coverage | Verify every breaking change in a WarpOS release ships with a corresponding migration script under f | 1 | 0 |
| warpos-migration-presence | Verify every migration listed in capsule release.json#migrations[] exists in the source tree before  | 1 | 0 |
| warpos-path-resolution | Verify every paths.json key points to an existing path (skip generated/ephemeral keys) | 1 | 0 |
| warpos-promote-coverage | Flag commits in the product repo that touched FRAMEWORK_PREFIXES paths but were never promoted to ca | 2 | 0 |
| warpos-promote-scope | Verify scripts/warpos/promote.js FRAMEWORK_PREFIXES list covers every framework-owned top-level dire | 0 | 0 |
| warpos-roundtrip | Verify that promoting changes from product to canonical and back to product preserves bytes (no sile | 1 | 0 |
| warpos-staleness | Detect drift between the installed WarpOS version on disk and the latest canonical version, flagging | 1 | 0 |
| warpos-structure-parity | Verify installed framework has the structural skeleton dirs canonical declares | 1 | 0 |
| warpos-tracked-transients | Catch transient state accidentally committed (.warpos/, qa-*.png, runtime/qa-*/, etc.) | 0 | 0 |
| warpos-version-quorum | Verify version.json, .claude/framework-manifest.json, .claude/framework-installed.json, and install. | 0 | 0 |

### commit (3)

| Name | Description | Calls | Called by |
|---|---|---|---|
| both | Commit locally then push to remote — full commit + push flow | 2 | 0 |
| local | Stage and commit changes locally — smart message, no push | 0 | 1 |
| remote | Push current branch to remote — with safety checks | 0 | 1 |

### content (2)

| Name | Description | Calls | Called by |
|---|---|---|---|
| contra | Create a Contra portfolio post with carousel images — write copy, design slides, render PNGs | 0 | 0 |
| linkedin | Create a LinkedIn post with carousel images — write copy, design slides, render PNGs | 0 | 0 |

### discover (2)

| Name | Description | Calls | Called by |
|---|---|---|---|
| orphaned | Discover orphaned work — find every deferred, forgotten, or abandoned task across NEXT.md, runtime n | 8 | 0 |
| systems | Multi-angle system discovery — find every system in a project by intersecting 6 discovery lenses, su | 5 | 2 |

### docs (1)

| Name | Description | Calls | Called by |
|---|---|---|---|
| catalog | Enumerate reference docs under _docs/ and paths.reference, with title/size/mtime. | 0 | 0 |

### events (2)

| Name | Description | Calls | Called by |
|---|---|---|---|
| query | Query the events log by type, time range, or regex match. | 0 | 0 |
| tail | Tail the events log — last N events with timestamp, type, and message. | 0 | 0 |

### fav (2)

| Name | Description | Calls | Called by |
|---|---|---|---|
| list | Browse all saved favorite moments, grouped by category | 0 | 1 |
| search | Search saved favorite moments by keyword across category, title, and notes — find one specific momen | 1 | 0 |

### fix (2)

| Name | Description | Calls | Called by |
|---|---|---|---|
| deep | Deep fix — Full diagnostic with automatic framework selection, 5 solutions, root cause analysis, and | 0 | 7 |
| fast | Quick fix — Direct Investigation, no formal framework. Read error, find cause, fix it, verify. | 2 | 4 |

### hooks (5)

| Name | Description | Calls | Called by |
|---|---|---|---|
| add | Design and create a new hook from a description | 0 | 0 |
| disable | Temporarily disable a hook by moving it from settings.json into a `_disabled_hooks` section, with a  | 0 | 0 |
| friction | Analyze friction points — find patterns that suggest missing hooks | 0 | 1 |
| sync | Copy validated hooks from this product repo into the canonical WarpOS clone so they can ride the nex | 2 | 0 |
| test | Test all hooks with synthetic payloads and measure execution time | 0 | 2 |

### issues (4)

| Name | Description | Calls | Called by |
|---|---|---|---|
| list | List recurring system issues — bugs/regressions in the agent framework, hooks, skills, .claude/, scr | 5 | 4 |
| log | Record a new instance of a recurring system issue — appends to recurring-issues.jsonl, dedupes by ti | 2 | 6 |
| resolve | Mark a recurring system issue resolved with a permanent fix summary | 2 | 3 |
| scan | Pattern-mine events.jsonl for repeat audit-block signatures — surface candidates for /issues:log | 5 | 1 |

### karpathy (3)

| Name | Description | Calls | Called by |
|---|---|---|---|
| integrate | Review a completed /karpathy:run and merge its winning artifact(s) into main — only command that tou | 2 | 3 |
| run | Karpathy autoresearch loop — plan a closed-loop experiment, review, then run autonomously in an isol | 4 | 2 |
| status | Read-only status dashboard for an active or completed /karpathy:run. Shows score curve, flag counts, | 3 | 1 |

### learn (3)

| Name | Description | Calls | Called by |
|---|---|---|---|
| deep | Deep learning — extracts from conversation + event log + oneshot retro files in parallel, deduplicat | 6 | 6 |
| ingest | Ingest external knowledge from files, links, or YouTube videos and apply learnings to the system | 2 | 2 |
| integrate | Learning integrator — promote validated high-score learnings into actual system enforcement (hooks,  | 3 | 6 |

### linters (1)

| Name | Description | Calls | Called by |
|---|---|---|---|
| run | Run every project linter (path-lint, lint-*, npm lint:*) and aggregate pass/fail. | 0 | 0 |

### manifest (3)

| Name | Description | Calls | Called by |
|---|---|---|---|
| migrate | Migrate the manifest to a target WarpOS version. Dry-run by default; --apply to write. | 0 | 0 |
| show | Print .claude/manifest.json (pretty by default, --json for compact). | 0 | 0 |
| validate | Validate the current .claude/manifest.json against the v1 manifest schema and report any drift, miss | 0 | 0 |

### maps (9)

| Name | Description | Calls | Called by |
|---|---|---|---|
| all | Registry of all maps — shows every map, its source, last updated, and staleness | 7 | 7 |
| architecture | App structure — routes, components, libs, how they connect | 0 | 2 |
| enforcements | Enforcement coverage — hooks, gates, gap analysis, open/closed gaps | 0 | 3 |
| hooks | Hook wiring diagram — events, matchers, scripts, execution order | 0 | 1 |
| memory | Memory store relationships — who reads/writes each store, entry counts | 0 | 1 |
| skills | Skill dependency graph — namespaces, cross-references, data flow | 2 | 2 |
| steps | Regenerate step tables in canonical docs from _requirements/00-canonical/STEPS.json — closes the las | 2 | 0 |
| systems | Render the systems manifest as a dependency graph — visualize which systems depend on which, their s | 0 | 3 |
| tools | Tool registry — skills, hooks, external CLIs, API services, npm scripts, platform tools | 1 | 1 |

### mode (3)

| Name | Description | Calls | Called by |
|---|---|---|---|
| adhoc | Enter adhoc team mode — Alpha + Beta + Gamma for collaborative feature development | 1 | 2 |
| oneshot | Initiate a oneshot build — launch Delta as standalone orchestrator for full skeleton runs | 0 | 4 |
| solo | Enter solo mode — just Alpha and the user, no agent team | 0 | 2 |

### oneshot (4)

| Name | Description | Calls | Called by |
|---|---|---|---|
| improve | Update preflight passes based on gaps discovered during runs. Modifies the check skills themselves. | 2 | 3 |
| preflight | Pre-run preflight — branch creation + skeleton gut + 7-pass verification audit. Default = full setup | 10 | 5 |
| retro | Post-run retrospective — context + git log + code diffs + cross-run analysis, all 9 categories. Defa | 9 | 8 |
| start | Lightweight kickoff — verify ready-state and hand off to Delta. Does NOT run setup or destructive wo | 6 | 3 |

### paths (6)

| Name | Description | Calls | Called by |
|---|---|---|---|
| add | Guided flow for adding a paths registry key. | 0 | 0 |
| convert | Guided flow for converting hardcoded literals to paths.* tokens. | 0 | 0 |
| coverage | Report on documentation coverage for the paths registry — which path keys are documented in PATH_KEY | 0 | 0 |
| doctor | Validate path registry, generated artifacts, and path lint rules. | 0 | 0 |
| explain | Explain one paths registry key — show its resolved on-disk path, owner, kind, deprecation status, an | 0 | 0 |
| rename | Guided flow for renaming a paths registry key. | 0 | 0 |

### product (1)

| Name | Description | Calls | Called by |
|---|---|---|---|
| bootstrap | Bootstrap a thorough product brief from a guided discussion — outputs MD/HTML (always) and DOCX (whe | 2 | 0 |

### qa (2)

| Name | Description | Calls | Called by |
|---|---|---|---|
| audit | Active full-codebase QA audit — systematically walks all 7 failure-mode personas | 0 | 1 |
| check | Passive QA scan on recent git diff changes — checks for 7 failure-mode signatures | 0 | 0 |

### reasoning (3)

| Name | Description | Calls | Called by |
|---|---|---|---|
| log | Log a reasoning episode — record what framework was used, why, and what happened | 3 | 2 |
| run | Reason through a problem or decision — auto-detects quick triage vs deep deliberation | 2 | 5 |
| score | Score fix quality (0-4) and retroactively reclassify old fixes when new evidence appears | 1 | 2 |

### redteam (2)

| Name | Description | Calls | Called by |
|---|---|---|---|
| full | Full red team audit — 11 personas across deterministic scanning + LLM reasoning. Finds auth bypasses | 1 | 0 |
| scan | Quick red team scan — deterministic tools only (deps, routes, CVEs, secrets, config). Fast, no LLM r | 0 | 0 |

### research (2)

| Name | Description | Calls | Called by |
|---|---|---|---|
| deep | Real deep research — Gemini Thinking writes the brief, then OpenAI Deep Research API + Gemini Deep R | 0 | 1 |
| simple | Deep research pipeline — queries Claude, ChatGPT (Codex), and Gemini in parallel, saves reports, syn | 0 | 1 |

### session (8)

| Name | Description | Calls | Called by |
|---|---|---|---|
| checkpoint | Force an immediate session checkpoint save — captures conversation context and tool activity that gi | 0 | 0 |
| handoff | Generate a rich AI-analyzed handoff document (replaces /handoff) | 1 | 1 |
| history | Browse past session handoff summaries from the handoffs directory — useful for tracking what happene | 1 | 1 |
| read | Read the cross-session inbox — see what other Alex sessions have been doing | 0 | 2 |
| recap | Catch up on the last N turns of this session — what you asked, what I did, what's still pending | 3 | 0 |
| resume | Load and display the last handoff or checkpoint — use after /clear or cold start | 0 | 3 |
| takenotes | Append a timestamped note to a per-topic file under runtime/notes/ | 0 | 0 |
| write | Post a message to the cross-session inbox so other Alex sessions can see it. Default is fully automa | 0 | 2 |

### skills (4)

| Name | Description | Calls | Called by |
|---|---|---|---|
| cleanup | Audit all skills for dead weight, duplicates, broken references, and namespace issues — then clean u | 8 | 1 |
| create | Create a new skill from a description — supports simple, multi-phase, and parallel workflows | 5 | 1 |
| delete | Remove a skill from .claude/commands with a backup, so it can be restored if the deletion turns out  | 2 | 0 |
| edit | Edit the body or frontmatter of an existing skill under .claude/commands — guided flow that preserve | 2 | 0 |

### sleep (2)

| Name | Description | Calls | Called by |
|---|---|---|---|
| deep | "Full sleep cycle — all 6 phases: NREM consolidation, cleanup, replay, REM dreaming, repair, growth  | 8 | 12 |
| quick | Light nap — NREM consolidation + glymphatic cleanup only (~5 min) | 2 | 2 |

### sprint (6)

| Name | Description | Calls | Called by |
|---|---|---|---|
| design | Turn an approved Plan Contract into PRD, stories, COPY, INPUTS, TRACE, acceptance criteria, QA, red- | 2 | 2 |
| execute | Execute the sprint via Ralph-style plan/act/test/review/record/checkpoint loops per ticket, with cra | 3 | 3 |
| plan | Turn a brief plain-language request into a structured sprint plan and durable Plan Contract. Evidenc | 3 | 4 |
| release | Prepare and execute a sprint release — final checks, approval, deploy gate, release notes, rollback  | 4 | 4 |
| retrospective | Synthesize a post-sprint retrospective from tracker artifacts — outcomes, friction, action items. Id | 3 | 0 |
| status | Read-only status view of every live sprint — shows id, lane, status, phase, last checkpoint, and the | 3 | 0 |

### ui (1)

| Name | Description | Calls | Called by |
|---|---|---|---|
| review | Design system compliance audit — read-only check of components against the project's design-system d | 0 | 0 |

### warp (13)

| Name | Description | Calls | Called by |
|---|---|---|---|
| check | Compare your WarpOS installation against the latest version — find stale, new, and missing items | 1 | 0 |
| deprecate | "Create a guarded WarpOS deprecation proposal for an agent, skill, hook, path, requirement, pattern, | 0 | 0 |
| doctor | "Unified WarpOS diagnostic — runs every health check in one place. Like /warp:health but full-covera | 9 | 2 |
| flag | "Append a framework-level update flag to the repo-local warpos-to-update.md ledger. Safe to run in p | 2 | 1 |
| health | Verify WarpOS installation — checks every system, reports green/yellow/red with plain-English fixes | 1 | 9 |
| promote | "Promote framework changes from a source product/instance repo into the canonical WarpOS clone. Alwa | 2 | 7 |
| promote-flags | "Drain the warpos-to-update.md flag ledger written by /warp:flag — mark entries promoted/blocked/def | 3 | 1 |
| release | "Drive a full WarpOS release of the canonical clone from this product repo — promote, bump, regen, b | 1 | 5 |
| setup | Set up WarpOS end-to-end — clone, install, merge CLAUDE.md, restart, verify. Safe to re-run; auto-de | 5 | 2 |
| sync | "Legacy alias for /warp:update that forwards to the canonical update flow so older references and mu | 2 | 3 |
| tour | Guided introduction to WarpOS — explains everything in simple language, no jargon | 13 | 1 |
| uninstall | Completely remove WarpOS from a project — restores pre-install state from backup | 3 | 1 |
| update | "Update WarpOS in this project to a target release. Default = latest. Default mode = dry-run; pass - | 5 | 8 |

## Cross-references

Top callers (skills that invoke the most others):

- `/warp:tour` → /fix:fast, /learn:deep, /maps:all, /maps:architecture, /mode:adhoc, /mode:oneshot, /mode:solo, /research:simple, /session:handoff, /session:read, /session:write, /sleep:quick, /warp:health
- `/check:all` → /check:architecture, /check:environment, /check:patterns, /check:references, /check:requirements, /check:system, /maps:all, /oneshot:preflight, /sleep:deep, /warp:doctor, /warp:health
- `/oneshot:preflight` → /check:architecture, /check:environment, /check:requirements, /mode:oneshot, /oneshot:improve, /oneshot:retro, /oneshot:start, /preflight:run, /preflight:setup, /run:sync
- `/oneshot:retro` → /check:patterns, /check:requirements, /issues:log, /oneshot:improve, /oneshot:preflight, /oneshot:start, /retro:code, /retro:context, /retro:full
- `/warp:doctor` → /check:all, /check:architecture, /check:references, /check:requirements, /hooks:test, /paths:lint, /warp:health, /warp:release, /warp:update
- `/check:environment` → /check:architecture, /check:references, /discover:systems, /hooks:test, /maps:all, /maps:enforcements, /sleep:deep, /warp:health
- `/check:patterns` → /fix:deep, /fix:fast, /hooks:friction, /issues:log, /learn:deep, /maps:enforcements, /oneshot:retro, /sleep:deep
- `/discover:orphaned` → /check:patterns, /check:requirements, /discover:systems, /issues:list, /learn:integrate, /oneshot:retro, /session:resume, /session:write
- `/skills:cleanup` → /dir:file, /maps:skills, /namespace:command, /namespace:skill, /overseer:review, /reasoning:log, /reasoning:trace, /skill:cleanup
- `/sleep:deep` → /beta:integrate, /beta:mine, /check:requirements, /issues:log, /issues:resolve, /reasoning:score, /skills:create, /sleep:quick

Top called (skills others invoke the most):

- `/sleep:deep` ← /beta:integrate, /beta:mine, /check:all, /check:architecture, /check:environment, /check:patterns, /check:references, /check:requirements, /check:system, /learn:deep, /reasoning:score, /sleep:quick
- `/check:requirements` ← /beta:mine, /check:all, /check:architecture, /discover:orphaned, /oneshot:preflight, /oneshot:retro, /session:handoff, /sleep:deep, /sleep:quick, /warp:doctor
- `/warp:health` ← /check:all, /check:architecture, /check:environment, /check:system, /warp:doctor, /warp:setup, /warp:tour, /warp:uninstall, /warp:update
- `/check:references` ← /check:all, /check:architecture, /check:environment, /check:requirements, /check:system, /discover:systems, /maps:steps, /warp:doctor
- `/oneshot:retro` ← /check:patterns, /check:requirements, /discover:orphaned, /issues:scan, /learn:deep, /oneshot:improve, /oneshot:preflight, /oneshot:start
- `/warp:update` ← /check:warpos-capsule-resolvable, /check:warpos-install-baseline, /check:warpos-migration-presence, /check:warpos-staleness, /check:warpos-structure-parity, /warp:doctor, /warp:promote, /warp:sync
- `/check:architecture` ← /check:all, /check:environment, /check:references, /check:requirements, /check:system, /oneshot:preflight, /warp:doctor
- `/fix:deep` ← /check:patterns, /fix:fast, /issues:list, /issues:log, /reasoning:log, /reasoning:run, /sprint:execute
- `/maps:all` ← /beta:mine, /check:all, /check:architecture, /check:environment, /check:references, /maps:steps, /warp:tour
- `/warp:promote` ← /check:warpos-promote-coverage, /hooks:sync, /warp:flag, /warp:promote-flags, /warp:release, /warp:sync, /warp:update
