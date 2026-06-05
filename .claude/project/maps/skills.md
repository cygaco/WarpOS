# Skills Map

Generated: 2026-06-05T23:48:21.960Z

| id | namespace | name | description |
|---|---|---|---|
| skill:agents:list | agents | list | Enumerate every agent spec by mode and role. |
| skill:agents:test | agents | test | Smoke-dispatch one agent role (or all non-claude roles) with a tiny ping prompt. |
| skill:beta:integrate | beta | integrate | Apply validated recommendations from beta mining into the judgment model |
| skill:beta:mine | beta | mine | Mine patterns from user behavior — prompts, decisions, skill chains, evolution cycles |
| skill:bootstrap:lastmile | bootstrap | lastmile | Prototype → monetizable product. Drives the last mile: readiness audit → launch plan → roadmap/sprint injection → guided execution → launch-ready handoff. Picks practical defaults for vibe coders, asks only high-leverage questions, gates risky production actions behind human approval. The spinup sequel — spinup gets you on screen, lastmile gets you paid. |
| skill:bootstrap:ponder | bootstrap | ponder | Exploratory pondering of a project — surface tensions, patterns, JTBD drift, and one forcing question |
| skill:bootstrap:spinup | bootstrap | spinup | From just WarpOS to something on screen — one in-project command: intent (guided brief, or --clone a competitor) → canonical docs → roadmap with sprints → execute the first sprint until the core loop serves. The idea→screen on-ramp. |
| skill:check:all | check | all | [deprecated alias → /scan:full] Run every scan in parallel — a full system scan. Superseded by /scan:full in the check:→scan: namespace rename (SP-20260528-001). |
| skill:check:framework-purity | check | framework-purity | [deprecated alias → /scan:framework-purity] Refuse product-content leaks in canonical. Superseded by /scan:framework-purity in the check:→scan: namespace rename (SP-20260528-001). |
| skill:check:framework-views-fresh | check | framework-views-fresh | [deprecated alias → /scan:framework-views-fresh] Verify .claude views are byte-identical regenerations of _warpos sources. Superseded by /scan:framework-views-fresh in the check:→scan: namespace rename (SP-20260528-001). |
| skill:check:install | check | install | [deprecated alias → /scan:install] Verify a fresh WarpOS install. Superseded by /scan:install in the check:→scan: namespace rename (SP-20260528-001). |
| skill:commit:both | commit | both | [deprecated alias → /commit:land] Commit locally then push — superseded by /commit:land, which also merges the branch into the default branch. |
| skill:commit:land | commit | land | Land the working branch — commit locally, push the branch, then merge it into the repos default branch and push that too. The full commit→push→merge flow. |
| skill:commit:local | commit | local | Stage and commit changes locally — smart message, no push |
| skill:commit:remote | commit | remote | Push current branch to remote — with safety checks |
| skill:content:contra | content | contra | Create a Contra portfolio post with carousel images — write copy, design slides, render PNGs |
| skill:content:linkedin | content | linkedin | Create a LinkedIn post with carousel images — write copy, design slides, render PNGs |
| skill:discover:orphaned | discover | orphaned | Discover orphaned work — find every deferred, forgotten, or abandoned task across NEXT.md, runtime notes, branches, untracked files, TODOs, plans, ADRs, learnings, drift queue. Classifies and proposes concrete next actions. |
| skill:discover:systems | discover | systems | Multi-angle system discovery — find every system in a project by intersecting 6 discovery lenses, surface whats declared vs what actually exists |
| skill:docs:catalog | docs | catalog | Enumerate reference docs under _docs/ and paths.reference, with title/size/mtime. |
| skill:enforcement:list | enforcement | list | List open enforcement-debt entries — policies/conventions without an automated enforcer |
| skill:enforcement:log | enforcement | log | Record a policy/convention that has no automated enforcer — appends to paths.enforcementDebt |
| skill:etc:author | etc | author | Author or refine a skill/prompt in standard format, producing a sibling eval-pack for evaluation |
| skill:etc:eval | etc | eval | Evaluate a skill or prompt artifact against its eval-pack, emitting a validated decision_record |
| skill:events:query | events | query | Query the events log by type, time range, or regex match. |
| skill:events:tail | events | tail | Tail the events log — last N events with timestamp, type, and message. |
| skill:fav:list | fav | list | Browse all saved favorite moments, grouped by category |
| skill:fav:search | fav | search | Search saved favorite moments by keyword across category, title, and notes — find one specific moment you remember saving but cannot locate by category alone. |
| skill:fix:deep | fix | deep | Deep fix — Full diagnostic with automatic framework selection, 5 solutions, root cause analysis, and prevention |
| skill:fix:fast | fix | fast | Quick fix — Direct Investigation, no formal framework. Read error, find cause, fix it, verify. |
| skill:growth:ad-images | growth | ad-images | Turn an angle into native-ad image prompts (scene-first, no text/logo/product, --ar) and render them via Higgsfield (headless API; gated by higgsfield-spend-gate — <$5 autonomous, ≥$5 escalates). |
| skill:growth:ad-video | growth | ad-video | Turn an angle into a video ad (swipe→script→storyboard→image-to-video) and generate it via Higgsfield (headless API; gated by higgsfield-spend-gate). Video assembly/editing is out of scope. |
| skill:growth:advertorial | growth | advertorial | Write a long-form advertorial (pre-sell editorial) from a message brief — research → foundational docs → swipe → write → Chief coherence review. |
| skill:growth:angles | growth | angles | Mine untapped marketing angles from real customer voice (Amazon/Reddit/forums) — ≥3 evidence-backed alternates. Reuses research:deep. |
| skill:growth:iterate | growth | iterate | Iterate a winning creative/message against a conversion/engagement scalar — thin wrapper over karpathy:run + parallel variation fan-out. Data picks winners. |
| skill:growth:landing-page | growth | landing-page | Build a converting landing page from a conversion brief — conversion-hierarchy, scaffold component library, mobile-first. Reuses the content render path + scaffold. |
| skill:growth:message-brief | growth | message-brief | Distill the single winning message (the spine artifact) from an audience dossier + angles — contrast + depth, market promise inside the claims boundary. |
| skill:growth:product-finder | growth | product-finder | Find validated high-margin products for paid traffic — EQ-scored (Product×Ads×Funnel×LTV), SCALE/TEST/SKIP, with margin math. Reuses research:deep. |
| skill:guides:coverage | guides | coverage | Fail-closed enforcer for the _guides/ library — asserts every guide is anchored, the registry is fresh, every anchor is wired live into the bootstrap pipeline, and there are no orphan records or markers. The /guides analog of /scan:scan-coverage and /maps:coverage. |
| skill:guides:integrate | guides | integrate | Wire each _guides/ guide into the bootstrap pipeline (spinup/lastmile) at its declared anchor in its declared shape, and record every placement in .claude/project/maps/guide-integration.jsonl — idempotent, read-before-write, with prior-integration conflict detection. |
| skill:guides:organize | guides | organize | Audit and restructure the _guides/ launch-guide library — backfill the guide-anchor contract onto every guide, (re)generate _guides/registry.json, and flag structural drift — WITHOUT rewriting guide prose (thats /guides:write). The skills:cleanup analog for guides. |
| skill:guides:write | guides | write | Author a launch guide into _guides/ — grounded in the Mark Builds Brands methodology + the existing guides, in the right shape (walkthrough/checklist/notice), carrying the guide-anchor contract so /guides:integrate can place it in the bootstrap pipeline. |
| skill:hooks:add | hooks | add | Design and create a new hook from a description |
| skill:hooks:disable | hooks | disable | Temporarily disable a hook by moving it from settings.json into a `_disabled_hooks` section, with a one-step path to re-enable later. |
| skill:hooks:friction | hooks | friction | Analyze friction points — find patterns that suggest missing hooks |
| skill:hooks:test | hooks | test | Test all hooks with synthetic payloads and measure execution time |
| skill:issues:list | issues | list | List recurring system issues — bugs/regressions in the agent framework, hooks, skills, .claude/, scripts/ |
| skill:issues:log | issues | log | Record a new instance of a recurring system issue — appends to recurring-issues.jsonl, dedupes by title overlap |
| skill:issues:resolve | issues | resolve | Mark a recurring system issue resolved with a permanent fix summary |
| skill:karpathy:integrate | karpathy | integrate | Review a completed /karpathy:run and merge its winning artifact(s) into main — only command that touches the live codebase from a karpathy run. |
| skill:karpathy:run | karpathy | run | Karpathy autoresearch loop — plan a closed-loop experiment, review, then run autonomously in an isolated worktree. Optimize any editable artifact (agent spec, skill, hook policy) against a scalar metric. |
| skill:karpathy:status | karpathy | status | Read-only status dashboard for an active or completed /karpathy:run. Shows score curve, flag counts, cost burn, and stop-condition proximity without any side effects. |
| skill:knowledge:coverage | knowledge | coverage | Fail-closed enforcer for the _knowledge/ layer (the company brain, ADR-0007) — asserts the domain registry is fresh, every LIBRARY consumer is grounded by a marker block backed by a record, every STORE has its contract README + a producer reference, the design index hasnt drifted, and there are no orphan/phantom records or markers. The /knowledge analog of /guides:coverage and /scan:scan-coverage. |
| skill:knowledge:integrate | knowledge | integrate | Wire each _knowledge/ domain into its consumers in its declared shape — LIBRARY domains via a knowledge-marker block in every consumer agent spec, STORE domains via a producer-spec store reference + contract README — and record every placement in .claude/project/maps/knowledge-integration.jsonl. Idempotent, read-before-write, with prior-integration conflict detection. |
| skill:learn:deep | learn | deep | Deep learning — extracts from conversation + event log + retro/report files (oneshot retros, sprint retros, _reports) in parallel, deduplicates, reports |
| skill:learn:ingest | learn | ingest | Ingest external knowledge from files, links, or YouTube videos and apply learnings to the system |
| skill:learn:integrate | learn | integrate | Learning integrator — promote validated high-score learnings into actual system enforcement (hooks, rules, skills, agent specs, reference docs) |
| skill:linters:run | linters | run | Run every project linter (path-lint, lint-*, npm lint:*) and aggregate pass/fail. |
| skill:manifest:migrate | manifest | migrate | Migrate the manifest to a target WarpOS version. Dry-run by default; --apply to write. |
| skill:manifest:show | manifest | show | Print .claude/manifest.json (pretty by default, --json for compact). |
| skill:manifest:validate | manifest | validate | Validate the current .claude/manifest.json against the v1 manifest schema and report any drift, missing fields, or schema violations. |
| skill:maps:all | maps | all | Registry of all maps — shows every map, its source, last updated, and staleness |
| skill:maps:architecture | maps | architecture | App structure — routes, components, libs, how they connect |
| skill:maps:coverage | maps | coverage | Maps-suite self-inventory — asserts every /maps:* skill is registered in /maps:all, no dangling registry refs, no orphan map files, and surfaces stale maps. The /maps analog of /scan:scan-coverage. |
| skill:maps:enforcements | maps | enforcements | Enforcement coverage — hooks, gates, gap analysis, open/closed gaps |
| skill:maps:hooks | maps | hooks | Hook wiring diagram — events, matchers, scripts, execution order |
| skill:maps:memory | maps | memory | Memory store relationships — who reads/writes each store, entry counts |
| skill:maps:skills | maps | skills | Skill dependency graph — namespaces, cross-references, data flow |
| skill:maps:steps | maps | steps | Regenerate step tables in canonical docs from _requirements/00-canonical/STEPS.json — closes the last loop in the step-registry infrastructure. |
| skill:maps:systems | maps | systems | Render the systems manifest as a dependency graph — visualize which systems depend on which, their status, and their categories so you can audit coverage and drift at a glance. |
| skill:maps:tools | maps | tools | Tool registry — skills, hooks, external CLIs, API services, npm scripts, platform tools |
| skill:mode:adhoc | mode | adhoc | Enter adhoc team mode — Alpha + Beta + Gamma for collaborative feature development |
| skill:mode:oneshot | mode | oneshot | Initiate a oneshot build — launch Delta as standalone orchestrator for full skeleton runs |
| skill:mode:solo | mode | solo | Enter solo mode — just Alpha and the user, no agent team |
| skill:models:check | models | check | Audit configured dispatch models against the latest vendor catalogs — flag drift, deprecations, and dead (ghost) ids. --refresh deep-ingests the live vendor docs first. |
| skill:models:route | models | route | Route a specific command/role to a specific model — thin, validated wrapper over the Dispatch Console (provider/model/effort/fallback), with an atomic backup ring. |
| skill:models:router | models | router | Open the model router panel — ensure the catalog carries all the latest model options, then launch the Dispatch Console GUI (browser) so you can view/edit role→provider→model→effort visually. |
| skill:models:update | models | update | Update the dispatch catalog to the latest models — re-ingest vendor docs, migrate deprecated/shut-down ids, add new options, sync routing, and regenerate manifests. Beta-gated for default-model changes. |
| skill:oneshot:improve | oneshot | improve | Update preflight passes based on gaps discovered during runs. Modifies the check skills themselves. |
| skill:oneshot:preflight | oneshot | preflight | Pre-run preflight — branch creation + skeleton gut + 7-pass verification audit. Default = full setup+gut+audit. Args control surgical access. |
| skill:oneshot:retro | oneshot | retro | Post-run retrospective — context + git log + code diffs + cross-run analysis, all 9 categories. Default = full. Args control surgical access. |
| skill:oneshot:start | oneshot | start | Lightweight kickoff — verify ready-state and hand off to Delta. Does NOT run setup or destructive work; thats /oneshot:preflights job. |
| skill:paths:add | paths | add | Guided flow for adding a paths registry key. |
| skill:paths:convert | paths | convert | Guided flow for converting hardcoded literals to paths.* tokens. |
| skill:paths:coverage | paths | coverage | Report on documentation coverage for the paths registry — which path keys are documented in PATH_KEYS.md and which are missing prose, so docs stay honest with the registry. |
| skill:paths:doctor | paths | doctor | Validate path registry, generated artifacts, and path lint rules. |
| skill:paths:explain | paths | explain | Explain one paths registry key — show its resolved on-disk path, owner, kind, deprecation status, and human-readable docs so callers understand what it points to. |
| skill:paths:rename | paths | rename | Guided flow for renaming a paths registry key. |
| skill:permissions:authorized | permissions | authorized | Operator authorization — durably allow a blocked action by adding a scoped permissions.allow rule from a growing catalog of cases, then recompiles settings so it takes effect this session. |
| skill:playbook:add | playbook | add | Append a play to the Playbook (.claude/project/reference/playbook.md) — a named, example-anchored operating principle. Picks the right section, formats to match, appends without disturbing other plays. |
| skill:portfolio:list | portfolio | list | List all registered portfolio products — slug, path, WarpOS version, last commit, dirty count, current sprint. |
| skill:portfolio:new | portfolio | new | Scaffold a new product repo (sibling to WarpOS) with the framework installed and committed, then register it — local-only by default. Open it in its own session and create the GitHub remote yourself, or pass --github to also create+push a private repo. |
| skill:portfolio:open | portfolio | open | Open a registered portfolio product — print its path and a cd hint, or spawn a new terminal window with --spawn. |
| skill:portfolio:register | portfolio | register | Register an existing local repo as a portfolio product in ~/.warpos/portfolio.json. |
| skill:portfolio:run | portfolio | run | Run a skill against another portfolio product in a fresh Claude subprocess — never retargets the current session. |
| skill:portfolio:spinup | portfolio | spinup | From WarpOS, run the idea→on-screen on-ramp against a registered product: dispatches /bootstrap:spinup into the products repo. Thin wrapper over bootstrap:spinup (the real implementation). |
| skill:portfolio:status | portfolio | status | Portfolio dashboard — per-product WarpOS version, last commit, dirty count, current sprint, GitHub remote (parallel, 5s per-product timeout). |
| skill:portfolio:sync | portfolio | sync | Run /warp:update across every registered portfolio product sequentially. No fail-fast — failures captured in the final summary. |
| skill:qa:audit | qa | audit | Active full-codebase QA audit — systematically walks all 7 failure-mode personas |
| skill:qa:check | qa | check | Passive QA scan on recent git diff changes — checks for 7 failure-mode signatures |
| skill:reasoning:log | reasoning | log | Log a reasoning episode — record what framework was used, why, and what happened |
| skill:reasoning:run | reasoning | run | Reason through a problem or decision — auto-detects quick triage vs deep deliberation |
| skill:reasoning:score | reasoning | score | Score fix quality (0-4) and retroactively reclassify old fixes when new evidence appears |
| skill:redteam:full | redteam | full | Full red team audit — 11 personas across deterministic scanning + LLM reasoning. Finds auth bypasses, prompt injection, business logic abuse, attack chains. |
| skill:redteam:scan | redteam | scan | Quick red team scan — deterministic tools only (deps, routes, CVEs, secrets, config). Fast, no LLM reasoning. |
| skill:report.md:report | report.md | report | File an ELI5 report (sprint | milestone | session | checkpoint) into _reports/ — tl;dr first, plain language, watch-outs always |
| skill:research:deep | research | deep | Real deep research — Gemini Thinking writes the brief, then OpenAI Deep Research API + Gemini Deep Research API + Claude multi-round search run in parallel |
| skill:research:simple | research | simple | Deep research pipeline — queries Claude, ChatGPT (Codex), and Gemini in parallel, saves reports, synthesizes, and applies learnings |
| skill:roadmap:add | roadmap | add | Append a new entry to ROADMAP.md — picks section, formats consistently, preserves existing content |
| skill:roadmap:cleanup | roadmap | cleanup | Audit ROADMAP.md — detect completed items, stale entries, duplicates, hidden urgencies; propose a cleanup plan |
| skill:roadmap:create | roadmap | create | Bootstrap a product ROADMAP.md from the inputs a project actually has — prefers _requirements/00-canonical/* + a Director-of-PM lens when present, falls back to the competitor clone brief + PROJECT.md. Evidence-bound, MVP-core-loop first. |
| skill:roadmap:ideas | roadmap | ideas | Predict candidate roadmap entries across four evidence lenses (3 each = 12 ideas) — whole-roadmap, last-3-shipped, last-3-active, vision/canonical. Read-only; proposes only, pairs with /roadmap:add. Role-aware — consults the Product Lead (single-product) or Director of Product (strategic) for a real product lens. |
| skill:roadmap:next | roadmap | next | The 1-idea alternative to /roadmap:ideas — the single highest-leverage next roadmap entry (the role-appropriate product personas top pick — Product Lead for single-product, Director of Product for strategic) with a one-paragraph rationale. For just tell me the one thing. |
| skill:roadmap:prioritize | roadmap | prioritize | Role-aware roadmap prioritization — runs /roadmap:cleanup first, then consults the Product Lead (single-product) or Director of Product (strategic) to rank the open roadmap into a clear do-next order, and applies the ordering content-preservingly. |
| skill:scan:ac-coverage | scan | ac-coverage | Read-only audit of acceptance-criteria.md verified_by:- linkage across active sprints. |
| skill:scan:adhoc-fail-override | scan | adhoc-fail-override | Reject an adhoc dispatcher that overrode a binding reviewer FAIL — verdict-content check (the blind spot gauntlet-verifys presence-only check leaves open) |
| skill:scan:adhoc-team-hygiene | scan | adhoc-team-hygiene | Read-only probe for adhoc-team accretion — flags teams whose members carry a -N de-dup suffix or a stale leadSessionId (the W-21 cross-session duplicate-teammate bug). |
| skill:scan:architecture | scan | architecture | Architecture integrity — do the layers connect? agent system, cross-layer seams, documentation health |
| skill:scan:coherence | scan | coherence | Run the WarpOS system coherence graph across 15 drift types. |
| skill:scan:cutover-completeness | scan | cutover-completeness | ED-026 cutover gate — greps the IMPERATIVE layer + keystone registries for RAW deleted-old-tree literals (00-alex/01-adhoc/02-oneshot/03-managers) + renamed-away role names, fail-closed. Catches the staleness role-parity cant, because it checks raw literals NOT alias-resolved roles (the alias table masks cutover-incompleteness). |
| skill:scan:design-system | scan | design-system | Design system compliance check - scans UI code for raw colors, raw primitives, missing design docs, and component-library drift |
| skill:scan:dispatch-routing-parity | scan | dispatch-routing-parity | Assert the role→provider routing tables agree across providers.js, catalog.js, and the dispatch guide — fails if any role is routed inconsistently or a non-Claude role is undocumented. |
| skill:scan:docker-secrets | scan | docker-secrets | Dockerfile → .dockerignore secret-exposure check — flags secret files (.env, *.pem, credentials) that a broad COPY . / ADD . would bake into an image layer because .dockerignore doesnt exclude them. |
| skill:scan:environment | scan | environment | Environment readiness and tooling quality — fast go/no-go or deep audit |
| skill:scan:etc-harness | scan | etc-harness | Audit the /etc authoring+eval harness — fail-closed enforcer that rejects an invented authoring format (root etc.md, non-standard skill frontmatter) and any eval-pack or emitted decision_record that doesnt satisfy its contract (S0.4). The standing backstop to the harnesss own test suite. |
| skill:scan:framework-purity | scan | framework-purity | Refuse product-content leaks in canonical — scans for client slugs, maintainer abs paths, root-level _requirements/_docs/ (gated until scrub), and promote-relic reintroduction. |
| skill:scan:framework-views-fresh | scan | framework-views-fresh | Verify .claude/commands and .claude/agents are byte-identical regenerations of their _warpos/ sources — fails if any view is stale. |
| skill:scan:full | scan | full | Run every scan in parallel — a full system scan across project health, governance, and WarpOS distribution integrity — merged into one unified report. One command for full system health. |
| skill:scan:ingest-firewall | scan | ingest-firewall | Audit the ingest stores (_docs/research, _docs/imports, _docs/briefs, _docs/clones) for un-firewalled prompt-injection — the persistent fail-closed backstop to the real-time untrusted-content firewall hook (S0.6). Treats all externally-ingested content as DATA, never instructions. |
| skill:scan:install | scan | install | Verify a fresh WarpOS install — manifest, paths, agents, hooks, version, settings. |
| skill:scan:issues | scan | issues | Pattern-mine events.jsonl for repeat audit-block signatures — surface candidates for /issues:log |
| skill:scan:node-procs | scan | node-procs | Read-only diagnostic — list Node processes on the host with PID, start-time, working-set KB, and command. |
| skill:scan:patterns | scan | patterns | Cross-run intelligence and automation proposals — diagnose recurring patterns or propose prevention |
| skill:scan:privacy | scan | privacy | Pre-publish scan for personal data — credentials, emails, homedir paths, runtime files tracked by git. |
| skill:scan:references | scan | references | Cross-file reference integrity — broken links, orphans, stale SPEC_GRAPH edges |
| skill:scan:regressions | scan | regressions | Run the regression-seed suite — the 26 recurring bug classes from the 0.17.0 spec, made runnable. Reports per-class pass/fail/gap + catch-rate. Role-aware (consumer-only checks are n/a in canonical). |
| skill:scan:requirements | scan | requirements | Specification consistency, coverage, and drift — static audit, change-driven propagation check, or pending-drift review |
| skill:scan:roadmap-trace | scan | roadmap-trace | Assert every done/retrospected/released sprint has BOTH a Sprints-table ledger row AND a Shipped narrative entry in ROADMAP.md — closes the WG-16 narrative enforcement-debt left by /sprint:full Step 8b. |
| skill:scan:role-parity | scan | role-parity | The one check that owns role parity across the org map, the dispatch catalog, and team-guard — fail-closed enforcer (S1.1) so repartitioning agents by domain cant silently drift the registry. Built BEFORE the Wave-2 repartition it guards. |
| skill:scan:scaffold-coverage | scan | scaffold-coverage | Verify the WarpOS app scaffold (Next+Tailwind v4+shadcn/ui+Radix+Lucide) is complete and coherent — fail-closed enforcer for S0.3, so every scaffolded product ships a real component library, not vibe-coded raw elements. |
| skill:scan:scan-coverage | scan | scan-coverage | Scan-suite self-inventory — asserts every /scan:* skill is delegated by /scan:full or explicitly excluded (with a reason). Kills the dir↔aggregator drift class (the enforcer exists but isnt on the path gap full.md hit with ship-coverage). |
| skill:scan:skill-hook-coverage | scan | skill-hook-coverage | Bidirectional coverage of the skill hook-point registry — REVERSE (registry coherent vs role-registry) + FORWARD (every registered skill has a command file) + HARDCODE/STALE (two asymmetric checks — no skill body names a renamed-away management persona ANYWHERE, and no skill dispatches a current persona via subagent_type or bold-backtick prose instead of resolving it at call time) |
| skill:scan:sprint-beta-honesty | scan | sprint-beta-honesty | Audits Beta consultation honesty across post-cutoff /sprint:full runs (missing consults, placeholder verdicts, ESCALATE-without-halt) |
| skill:scan:sprint-hook-coverage | scan | sprint-hook-coverage | Bidirectional coverage of the sprint hook-point registry — FORWARD (every matched block-row has a manager_consult record per /sprint:full run) + REVERSE (registry structurally coherent against role-registry) |
| skill:scan:sprint-manager-consult | scan | sprint-manager-consult | Audits manager-consult coverage across post-cutoff /sprint:full runs — asserts the design-quality authority was consulted on every UI/app-design/web-design-touching sprint |
| skill:scan:system | scan | system | System inventory — enumerate every active WarpOS system, diff against manifest, report drift and gaps |
| skill:scan:timeline | scan | timeline | Reconstruct a build timeline from transaction, event, and provider logs. |
| skill:scan:version-coherence | scan | version-coherence | Verify version + schema-label coherence — product version agrees across ALL manifests (incl. the ones version-quorum misses) and every schema family carries a single consistent version label. Catches the 0.10.0→0.11.0 lag + paths-v4-on-v5-content drift classes. |
| skill:scan:warpos-applied-migrations | scan | warpos-applied-migrations | Detect already-applied WarpOS migration scripts left on disk in consumer projects |
| skill:scan:warpos-capsule-resolvable | scan | warpos-capsule-resolvable | Verify the capsule for /warp:update --to <v> is resolvable from REPO_ROOT, sibling clones, manifest.warpos.source, or framework-installed.json#source. |
| skill:scan:warpos-install-baseline | scan | warpos-install-baseline | Verify a WarpOS install baseline exists (.claude/framework-installed.json present, installedVersion ≠ 0.0.0) before /warp:update may proceed. |
| skill:scan:warpos-layer-diff | scan | warpos-layer-diff | Read-only product-vs-dev-tooling layer diff — lists which framework-owned paths SHIP to consumer products (product layer) vs which stay framework-internal and never ship (dev-tooling layer), with summary counts. Cross-references _warpos/MANIFEST.json (ownership) × .claude/framework-manifest.json (shipped). Informational, never a gate. |
| skill:scan:warpos-manifest-coverage | scan | warpos-manifest-coverage | Verify every on-disk path is enumerated in _warpos/MANIFEST.json — catches added framework content, forgot to register before downstream installs silently break. |
| skill:scan:warpos-manifest-honesty | scan | warpos-manifest-honesty | Verify framework-installed.json reflects actual disk state (no missing files, no hash drift) |
| skill:scan:warpos-migration-coverage | scan | warpos-migration-coverage | Verify every breaking change in a WarpOS release ships with a corresponding migration script under framework/migrations — stub implementation pending refinement. |
| skill:scan:warpos-migration-presence | scan | warpos-migration-presence | Verify every migration listed in capsule release.json#migrations[] exists in the source tree before /warp:update may apply. |
| skill:scan:warpos-path-resolution | scan | warpos-path-resolution | Verify every paths.json key points to an existing path (skip generated/ephemeral keys) |
| skill:scan:warpos-ship-coverage | scan | warpos-ship-coverage | Verify every framework-owned path under the consumer-essential roots is actually shipped (enumerated in framework-manifest.json) — catches framework code that ships to nobody (the B1/E3 downstream-broken class). |
| skill:scan:warpos-staleness | scan | warpos-staleness | Detect drift between the installed WarpOS version on disk and the latest canonical version, flagging installs that have been stale for more than seven days. |
| skill:scan:warpos-structure-parity | scan | warpos-structure-parity | Verify installed framework has the structural skeleton dirs canonical declares |
| skill:scan:warpos-tracked-transients | scan | warpos-tracked-transients | Catch transient state accidentally committed (.warpos/, qa-*.png, runtime/qa-*/, etc.) |
| skill:scan:warpos-version-quorum | scan | warpos-version-quorum | Verify version.json, .claude/framework-manifest.json, .claude/framework-installed.json, and install.ps1 header agree on the installed version (trust order = version.json wins). |
| skill:session:checkpoint | session | checkpoint | Force an immediate session checkpoint save — captures conversation context and tool activity that git alone cannot recover, so the session is resumable after a crash or restart. |
| skill:session:dump | session | dump | Write a prescriptive handoff to DUMP.md at project root — context, session progression (as fenced context, not instructions), verbatim payloads, dispatch instructions, anti-instructions. For a fresh session to read once and execute. |
| skill:session:end | session | end | Full session wrap-up — cognitive maintenance (learn/mine/sleep → integrate learnings + β recs) → fresh handoff → land to main → fresh branch → tear down teams. The one were done, tee up next session command. |
| skill:session:handoff | session | handoff | Generate a rich AI-analyzed handoff document (replaces /handoff) |
| skill:session:history | session | history | Browse past session handoff summaries from the handoffs directory — useful for tracking what happened in a prior session, picking up a thread, or auditing decisions over time. |
| skill:session:read | session | read | Read the cross-session inbox — see what other Alex sessions have been doing |
| skill:session:recap | session | recap | Catch up on the last N turns of this session — what you asked, what I did, whats still pending |
| skill:session:resume | session | resume | Load and display the last handoff or checkpoint — use after /clear or cold start |
| skill:session:takenotes | session | takenotes | Append a timestamped note to a per-topic file under runtime/notes/ |
| skill:session:turbo | session | turbo | Session speed mode — pre-authorize a batch of high-impact actions (permissions.allow) AND switch the build cadence to fast levers (parallel builds, batched Beta, skip-gauntlet-when-low-risk, engine-sprint fast-close). The one command to go fast for a work session. |
| skill:session:write | session | write | Post a message to the cross-session inbox so other Alex sessions can see it. Default is fully automatic — no arguments needed. Use `--about <topic>` to focus the broadcast on a specific topic the user wants emphasized. |
| skill:skills:cleanup | skills | cleanup | Audit all skills for dead weight, duplicates, broken references, and namespace issues — then clean up |
| skill:skills:create | skills | create | Create a new skill from a description — supports simple, multi-phase, and parallel workflows |
| skill:skills:delete | skills | delete | Remove a skill from .claude/commands with a backup, so it can be restored if the deletion turns out to be premature. |
| skill:skills:edit | skills | edit | Edit the body or frontmatter of an existing skill under .claude/commands — guided flow that preserves frontmatter contract and re-validates after the edit. |
| skill:sleep:deep | sleep | deep | Full sleep cycle — all 6 phases: NREM consolidation, cleanup, replay, REM dreaming, repair, growth (~15-30 min) |
| skill:sleep:quick | sleep | quick | Light nap — NREM consolidation + glymphatic cleanup only (~5 min) |
| skill:sprint:cost-gate | sprint | cost-gate | Toggle the /sprint:full cost-estimate halt on or off — turn off the heuristic spend gate when an operator spend posture is authorized, turn it back on to restore the guardrail. Controls only the sprint cost halt, never the hard ceilings or the real >$5 rule. |
| skill:sprint:design | sprint | design | Turn an approved Plan Contract into PRD, stories, COPY, INPUTS, TRACE, acceptance criteria, QA, red-team, release plan — then mint tickets. |
| skill:sprint:execute | sprint | execute | Execute the sprint via Ralph-style plan/act/test/review/record/checkpoint loops per ticket, with crash-safe progress, issue tracking, and approval-aware stop conditions. |
| skill:sprint:full | sprint | full | Single-invocation execution of the full sprint pipeline (plan→design→execute→release-prep→retro) under a bounded autonomy preset. Cannot bypass CLAUDE.md hard ceilings. |
| skill:sprint:plan | sprint | plan | Turn a brief plain-language request into a structured sprint plan and durable Plan Contract. Evidence-labeled, approval-aware, crash-recoverable. |
| skill:sprint:release | sprint | release | Prepare and execute a sprint release — final checks, approval, deploy gate, release notes, rollback prep, retrospective trigger. |
| skill:sprint:retrospective | sprint | retrospective | Synthesize a post-sprint retrospective from tracker artifacts — outcomes, friction, action items. Idempotent, fail-open, schema-validated. |
| skill:sprint:status | sprint | status | Read-only status view of every live sprint — shows id, lane, status, phase, last checkpoint, and the resume command for each in-flight sprint, and flags drift between paths.sprintActiveRegistry and on-disk sprints/. |
| skill:turbo.md:turbo | turbo.md | turbo | [alias → /session:turbo] Pre-authorize a session batch of high-impact actions via permissions.allow entries. Removes the keyboard cadence for repeat approvals. |
| skill:ui:review | ui | review | Design system compliance audit — read-only check of components against the projects design-system docs |
| skill:warp:check | warp | check | Compare your WarpOS installation against the latest version — find stale, new, and missing items |
| skill:warp:deprecate | warp | deprecate | Create a guarded WarpOS deprecation proposal for an agent, skill, hook, path, requirement, pattern, or generated file. |
| skill:warp:diff | warp | diff | Diff canonical WarpOS against an installed product — version/staleness, framework-file drift (stale vs locally-modified), coverage gaps, and skills/agents/hooks delta. Read-only; reports on the product, never edits it. |
| skill:warp:doctor | warp | doctor | Unified WarpOS diagnostic — runs every health check in one place. Like /warp:health but full-coverage. |
| skill:warp:flag | warp | flag | Flag a WarpOS framework/tooling gap from a downstream product — append a structured, canonical-consumable entry to this repos WARPOS.md so /warp:reconcile can verify and fix it upstream. |
| skill:warp:health | warp | health | Verify WarpOS installation — checks every system, reports green/yellow/red with plain-English fixes |
| skill:warp:md | warp | md | Tune CLAUDE.md with project-specific context — refresh the auto-generated project block from PROJECT.md, _requirements, manifest, README, and package scripts. Framework sections are never touched. |
| skill:warp:reconcile | warp | reconcile | Reconcile downstream-flagged WarpOS gaps into canonical — discover every products WARPOS.md, verify each gap @current, get a cross-provider root-cause lens, triage, drive the fixes, and record resolution canonical-side. |
| skill:warp:release | warp | release | Drive a full WarpOS release of the canonical clone from this product repo — promote, bump, regen, build capsule, run gates, commit, ff-merge to main, push, tag. One command, no cd into canonical. |
| skill:warp:setup | warp | setup | Set up WarpOS end-to-end — clone, install, merge CLAUDE.md, restart, verify. Safe to re-run; auto-detects and completes missing steps. |
| skill:warp:sync | warp | sync | Legacy alias for /warp:update that forwards to the canonical update flow so older references and muscle memory keep working until warpos@1.0.0; superseded by /warp:update. |
| skill:warp:tour | warp | tour | Guided introduction to WarpOS — explains everything in simple language, no jargon |
| skill:warp:uninstall | warp | uninstall | Completely remove WarpOS from a project — restores pre-install state from backup |
| skill:warp:update | warp | update | Update WarpOS in this project to a target release. Default = latest. Default mode = dry-run; pass --apply to execute. |
