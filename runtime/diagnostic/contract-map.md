# WarpOS Dispatch / Sprint-Runtime Contract Map

> Diagnostic produced 2026-06-06. Every contract point carries a `file:line` citation.
> "How dispatch is SUPPOSED to work" (the intended contract) + internal-consistency / contract-vs-disk gaps.

All paths absolute under `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\`.

---

## 1. The dispatch routing contract

### 1.1 Role → provider derivation (single source of truth = the role-registry keystone)

- **Keystone (source of truth):** `.claude/agents/_org/role-registry.json` — `_doc` declares it THE single source for role→{provider, model, effort, build_chain, kind, claude_pinned, residency, dispatchable_by} (`role-registry.json:3`). Each role row carries `provider`/`model`/`effort` (e.g. `qa-reviewer` provider openai/gpt-5.5/xhigh `role-registry.json:40`; `security-reviewer` provider gemini/gemini-3.1-pro-preview + openai 2nd pass `role-registry.json:57`).
- **The dispatch-side reader:** `scripts/dispatch/registry-roles.js` — derives every consumer's role list/map from the registry: `providerMap()` (`registry-roles.js:63`), `effortMap()` (`registry-roles.js:70`), `buildChainRoles()` = `build_chain:true` (`registry-roles.js:88`), `geminiRoles()` (`registry-roles.js:93`), `flagshipOpenaiRoles()` (`registry-roles.js:98`), `fixerRoles()` = `kind:fixer` (`registry-roles.js:103`), `reviewerGateKeys()` = `kind:reviewer` ∧ `binding_verdict` ∧ ¬`claude_pinned` (`registry-roles.js:114`), `deriveOrFallback()` loud-fallback wrapper (`registry-roles.js:127`).
- **Consumer (providers.js):** `getProviderForRole(role)` resolves manifest override → `DEFAULT_AGENT_PROVIDERS` → default `claude` (`providers.js:394-406`). `DEFAULT_AGENT_PROVIDERS` is registry-derived (`providerMap()` ∪ scrapped aliases ∪ W-4 advisor/consult) with a literal fallback (`providers.js:367-379`).
- **manifest override:** `manifest.agentProviders` overrides per-project (`providers.js:397`); agent-dispatch-guide also names it (`.claude/project/reference/agent-dispatch-guide.md:78-80`).
- **The role→provider table (human-maintained, parity-gated):** `.claude/project/reference/agent-dispatch-guide.md:84-99` (alpha/beta/gamma/delta + builders → claude; reviewers → openai; redteam/security-reviewer → gemini; design-lead → openai). `scripts/checks/dispatch-routing-parity.js` asserts this table + both code maps agree against the registry (`agent-dispatch-guide.md:80-82`).

### 1.2 dispatch-agent.js vs dispatch-claude.js

- **`scripts/dispatch-agent.js` — cross-provider CLI bridge (openai/gemini only).** Hard-refuses Claude roles → exit 2 with "dispatch natively via Agent tool or `claude -p --agent`" (`dispatch-agent.js:418-431`). Resolves provider (`:409`), honors role frontmatter `provider_model` unless `--provider`/`--model` override (`:526-535`), acquires a concurrency slot (`:487-517`), calls `runProvider` (`:536`), writes completion + death telemetry (`:622-664`), exits 0 on ok / 1 on fail-or-fallback (`:670`). Flags: `--provider`/`--model` (2nd GPT security pass) (`:365-370`), `--domain` (`:374`).
- **`scripts/dispatch-claude.js` — bounded Claude build-chain wrapper (RI-004/ED-018).** Owns builder/fixer/stub-scaffold Claude dispatch; makes a silent reap LOUD. `BUILD_CHAIN_ROLES` set (`dispatch-claude.js:72-78`). CRITICAL ISOLATION GATE: a build-chain role REQUIRES `-w` or a real linked-worktree `--worktree` — never canonical (`:139-167`). Bounds the inner `claude -p` with a timeout (default 20 min, `DISPATCH_BUILDER_TIMEOUT_MS`) (`:67`,`:194-197`). Reap classification order: timeout → spawn-fail → non-zero-exit → 0-byte-on-exit-0 (the ED-018 signature) (`:257-271`). ALWAYS writes a completion record (`ok` reflects reap) (`:289-305`) + a death record on reap (`:309-334`); exits 0 ok / 1 reap (`:350`). Reuses dispatch-agent's `recordCompletion`/`recordDeath`/`makeDispatchId`/`cmdlineChecksum` (`:58-64`).

### 1.3 Where completion records are written + what reads them

- **Completion ledger path:** `.claude/runtime/dispatch-completions.jsonl` — `recordCompletion` → `ledgerFile(PATHS.dispatchCompletionsFile, ".claude/runtime/dispatch-completions.jsonl")` (`dispatch-agent.js:153-161`). Anchored to `AGENT_ROOT = path.resolve(__dirname,"..")` via `canonicalFile()` so a worktree-cwd dispatch never writes to the worktree (ED-016 fix, `:46-98`).
- **Death ledger path:** `.claude/runtime/dispatch-deaths.jsonl` (`dispatch-agent.js:163-170`).
- **Concurrency slots:** `.claude/runtime/dispatch-locks/<provider>/` (`.claude/project/reference/agent-dispatch-guide.md:183-186`).
- **The reader (the enforcer):** `scripts/dispatch/gauntlet-verify.js`. Reads the completions JSONL (`gauntlet-verify.js:100-105`, `:165-193`); `verifyGauntlet({runId, roles, since, until})` classifies each required role as `ran` / `fell-back` / `ill-typed` / `failed` / `no-record` (`:234-484`). **Absence of an `ok:true` well-formed record = the death signal** (`:14-32`). BC-16 typed-success: `isWellFormedOkRecord` requires role+ok:true+provider+parseable-timestamp (`:136-146`); malformed/ill-typed/no-record all fail-CLOSED → exit 1; internal error → exit 2 (`:641-648`); empty roles list cannot vacuously pass (`:251-270`). No embedded runId — correlation is by `completed_at` time window (`:33-46`).
- **dispatch-claude.js record shape matches** `isWellFormedOkRecord` so a real build is greenable, a reap is `ok:false`→"failed" not ambiguous "no-record" (`dispatch-claude.js:286-305`). Backstop: builder in gauntlet-verify role set → no-record RED even if wrapper itself reaped (`dispatch-claude.js:24-28`).

---

## 2. The epsilon sprint-runtime contract (ADR-0009)

- **What ε is supposed to do (ADR-0009 Decision):** a registry-driven lifecycle engine `scripts/sprint/epsilon-runtime.js` that at each of six hook-points (plan→design→build→gauntlet→release→retro) (a) resolves the matched agent-set via the hook-point registry, (b) DERIVES each role's route from the role-registry keystone (no hardcoded route table — ADR-0008 pattern), (c) produces a REAL dispatch record per agent on the canonical ledger gauntlet-verify reads — replacing full.js's telemetry-only "consulted" stamp (`0009-epsilon-sprint-runtime.md:11`). Wired into full.js additively + gated (`--epsilon`/`--epsilon-dispatch`/`WARPOS_EPSILON_RUNTIME=on`); default script path unchanged (`:11`, `epsilon-runtime.js:42-56`).
- **Six lifecycle steps:** `LIFECYCLE = [plan,design,build,gauntlet,release,retro]` (`epsilon-runtime.js:68`). β boundaries (4): plan→design, design→build, gauntlet→release, release→retro (`epsilon-runtime.js:72-77`).
- **How it reads the hook-point registry:** `planStep` → `hookPoints.agentsForStep(step, composition, registry)` (`epsilon-runtime.js:170-207`); registry = `.claude/agents/_org/sprint-hook-points.json` (one row per `{role,step,condition,mode,order}`, `sprint-hook-points.json:24-48`); router `scripts/sprint/hook-points.js#agentsForStep` (`hook-points.js:117`), condition matching `matchCondition` (`hook-points.js:96-111`), role rows resolved from registry via `loadRoles` (`hook-points.js:58-61`).
- **Route resolution (DERIVED, the ADR-0008 reuse):** `resolveRoute(role, roles)` reads the registry row and maps: `build_chain:true`→`dispatch-claude`; claude+`claude_pinned`→`agent-tool`; claude+`kind:tool`→`claude-raw`; claude (managers/leads/dirs)→`claude-agent`; openai|gemini→`dispatch-agent`; no row→`unresolved` (`epsilon-runtime.js:109-144`; route table also in ADR-0009 `:46-55`).
- **What "REAL agent dispatch" means:** `--dispatch` mode REALLY spawns each agent (`spawnAgent`, `epsilon-runtime.js:436-473`). 3 CLI-routable routes shell out and capture real exit/output: `DISPATCH_AGENT`→dispatch-agent.js, `DISPATCH_CLAUDE`→dispatch-claude.js, `CLAUDE_RAW`→`claude -p --agent` (reap = 0-byte-on-exit-0 → ok:false, `interpretSpawn` `:419-429`). The 2 in-process routes (`CLAUDE_AGENT`, `AGENT_TOOL`) cannot be spawned from node → return `{spawned:false, reason:'requires-orchestrator'}` and write NO record (`:443-444`). `recordAgentDispatch` REFUSES to write without an explicit boolean spawn outcome (the fake-green guard, `:341-346`). (ADR-0009 Mitigation #4 documents the operator catching a prior fake-green where `ok:true` was stamped without a spawn — now fixed, `0009-epsilon-sprint-runtime.md:82`.)
- **What `record-inprocess` is:** the named path for the 2 in-process routes. ε-the-agent dispatches a manager/lead/design-quality via the harness `Agent(subagent_type:<role>)`, captures the returned envelope to a file, then `node scripts/sprint/epsilon-runtime.js record-inprocess --role <r> --step <s> --evidence <file>` writes the SAME completion record gauntlet-verify reads. `ok` is DERIVED from the evidence byte count (0-byte = reap → ok:false; missing evidence → REFUSE; CLI-route role → REFUSE wrong-tool) (`recordInProcessCompletion`, `epsilon-runtime.js:491-522`; CLI handler `:665-689`; contract in mode/sprint.md `:64-80`).
- **Two complementary record kinds:** `manager_consult` (COVERAGE — `hookConsult.emitStepConsults`, read by sprint-manager-consult + sprint-hook-coverage) AND completion record (LIVENESS — gauntlet-verify; absence = death) (`epsilon-runtime.js:526-561`; ADR `:56-58`).
- **Structurally-enforced invariants:** ε is sole builder-dispatcher (`canDispatchBuilders` true only at `build` step + build_chain, `:154-156`; `assertSoleBuilderDispatcher` `:251-261`); author-consults at `design` cannot dispatch (`assertConsultsCannotDispatch` `:267-278`); gauntlet roster is registry-fixed (`planStep` never augments, `:202-204`); a dispatcher CANNOT override a binding FAIL — `assertNoFailOverride` runs EPSILON_RESULT through `adhoc-fail-override.js#evaluate` fail-closed (ED-025, `:571-581`; ADR `:62-64`).
- **full.js wiring:** `emitPhaseConsults` runs `epsilonRuntime.conductStep` per step when `opts.epsilon`, with real records under `opts.epsilonDispatch` (`full.js:95-116`); flags `--epsilon`/`--epsilon-dispatch` + `WARPOS_EPSILON_RUNTIME` (`full.js:178-197`); `PHASE_TO_HOOK_STEPS` maps coarse full.js phases → fine lifecycle steps (execute=build+gauntlet) (`full.js:59-65`, mirrored `sprint-hook-points.json:5-13`).
- **β consultation:** owned by `full.js#maybeConsultBeta` (halt-and-bridge across the node seam — a spawnSync subprocess cannot reach SendMessage/Agent) (`full.js:650-871`; mode/sprint.md `:203-213`). ε defers β to α+β above it (`epsilon-runtime.js:40`).

---

## 3. The guard contract

### 3.1 dispatch-route-guard.js (PreToolUse Bash + Agent matcher)

**BLOCKS (hard block, `decision:"block"`):**
- Raw build-chain `claude -p --agent <build-role>` (checked BEFORE the canonical-prefix exemption, even in a compound command): `rawBuildChainClaudeRole` requires unquoted `claude` + `-p` + `--agent` tokens AND the `--agent` role ∈ `BUILD_CHAIN_ROLES` (`dispatch-route-guard.js:197-209`, `:317-325`). `BUILD_CHAIN_ROLES` derived from registry `build_chain:true` ∪ `{builder,fixer}` aliases, literal fallback `{builder,backend-builder,frontend-builder,fixer,stub-scaffold,security-builder,frontend-fixer,backend-fixer,security-fixer}` (`:117-137`).
- Pipe into a provider: `/\|\s*(codex|gemini|claude)\b([^|]*)$/` unless a SAFE tail (`:332-342`).
- Bare `codex exec`: `/\bcodex\s+exec\b/` not under the canonical prefix (`:347-353`).
- `gemini … -p`: `/(?:^|\s)-p\b/` in the gemini tail, not a SAFE tail (`:357-369`).
- Raw `claude -p` without `--agent <role>` and not a SAFE tail (`:373-389`).
- In-process **Agent tool** dispatch of a build-chain `subagent_type` (∈ `BUILD_CHAIN_ROLES`) → block, "use dispatch-claude.js" (the §2.5 context-lever gate) (`:497-515`).

**ALLOWS (never blocked):**
- `node scripts/dispatch-(agent|claude).js …` as the LEADING command of a segment (after optional `VAR=val`): `hasCanonicalDispatchPrefix` regex (`:81-91`, exemption `:344`).
- SAFE provider tails: `/^\s*(?:--version|--help|-h|-v|models?\b|auth\b|whoami\b|config\b|login\b|logout\b|completion\b)\b/` (`:78-79`).
- `claude -p … --agent <role>` for NON-build roles (documented fallback): `isClaudeAgentInvocation` `/\bclaude\s+-p\b[\s\S]*\B--agent\b/` (`:93-97`, fall-through `:386-389`).
- `WARPOS_PROVIDER_PROBE=1` one-shot probe escape hatch (logged) (`:52-72`); kill switch `WARPOS_DISPATCH_ROUTE_GUARD=off` (`:39`).
- Quote-aware: literal strings inside quotes are stripped (`stripQuoted` `:285-305`) and compound commands segment-split on UNQUOTED `;`/`&&`/`||`/`&`/newline (`splitSegments` `:220-263`) so a forbidden substring in a commit message / a piggy-backed segment is handled correctly.

**ADVISORY (non-blocking `additionalContext` warning):**
- `claude -p --agent` with `$(cat <file>)` argv (arg-length overflow) → suggest stdin `< file` (`findAdvisory` `:405-423`).
- ED-021 heavy-skill Agent dispatch without lean-return: `/scan:full`,`/research:deep`,`/redteam:full`,`/qa:audit` (`HEAVY_SKILLS` `:442-447`; `findHeavySkillAdvisory` `:463-479`; suppressed when `LEAN_RETURN_RE` matches `:455-456`).

**Fail-open** on parse errors / hook bugs (`:601-604`).

### 3.2 team-guard.js (PreToolUse Agent — adhoc two-tier)

- Only checks the **Agent** tool (`team-guard.js:71-73`). Always allows teammates β + γ (exact-match-after-normalize on name/type, `:36-37`, `:79-88`).
- In **adhoc** mode, BLOCKS build-chain `subagent_type` ∈ `GAMMA_ONLY_TYPES` (derived from `org-roles.js#gammaOnlyTypes()`, fail-safe literal `{builder,fixer,fix-agent,reviewer,evaluator,compliance,learner,auditor,qa,redteam,delta,frontend-builder,backend-builder}` — NEVER empty) (`:22-33`, `:164-175`).
- **oneshot** mode → allow all (Delta IS the orchestrator) (`:114-116`); **solo** → allow all (`:118-121`). Mode read from `.claude/runtime/mode.json` first, then adhoc heartbeat (`:96-156`). Debug log isolated in its own try/catch so an FS error can NEVER silently disable the guard (RT-013, `:48-68`).

---

## 4. ADR-0008 — consumers derive from the registry

- **Decision:** dispatch consumers — `catalog.js` (`DEFAULT_PROVIDER_PER_ROLE`, `DEFAULT_EFFORT_PER_ROLE`), `providers.js` (`DEFAULT_AGENT_PROVIDERS`), `dispatch-route-guard.js` (`BUILD_CHAIN_ROLES`), `org-roles.js` (`REMEDIATION_ROLES`), `state.js` (`GEMINI_ROLES`, `FLAGSHIP_OPENAI_ROLES`) — derive their role lists/maps from `.claude/agents/_org/role-registry.json` via `scripts/dispatch/registry-roles.js`, not hand-maintained copies (`0008-dispatch-consumers-derive-from-registry.md:11`).
- **Two reconciled conflicts (registry edited to current behavior):** `security-reviewer` effort null→`high`; `stub-scaffold` effort `medium`→`null` (`:11`, `:43-44`; reflected `role-registry.json:57`,`:67`).
- **Mechanism:** `deriveOrFallback(deriveFn, literal, label)` — derives, falls back LOUDLY to the literal on throw/empty (`registry-roles.js:127-143`). Guarded `require` in hook-feeding consumers (`try{require}catch{→literal}`, fail-open — see `providers.js:323-328`, `dispatch-route-guard.js:111-116`); catalog fails loud.
- **Scrapped back-compat aliases** (`builder,fixer,reviewer,compliance,qa,redteam`) deliberately NOT in the registry; UNIONed in via `SCRAPPED_PROVIDER_ALIASES`/`SCRAPPED_EFFORT_ALIASES` so old role names still route until a one-edit trim (`registry-roles.js:152-167`; ADR `:64`).
- **Anti-vacuity mitigation (TRAP-A):** `dispatch-routing-parity` checks each consumer + the doc against the REGISTRY (canonical), never derived-vs-derived (`:62`). Proven by `dispatch-routing-parity.test.js`.
- **CUT-SAFETY guarantee:** for a superset rewire the guarantee is "no existing route regresses," NOT "derived == literal" (registry is a superset carrying ADR-0007 manager/director roles the literals omit) (`:39`).

---

## 5. GAPS (contract-vs-disk + internal inconsistency + unenforced "should")

### G1 — TWO dispatch-guide copies that DIVERGE (largest gap)
- `.claude/agents/.system/guides/agent-dispatch-guide.md` (243 lines, mtime **2026-06-04**) vs `.claude/project/reference/agent-dispatch-guide.md` (197 lines, mtime **2026-06-06**). They are NOT regenerations of each other — different prose, different structure.
- The `.system` copy is the **STALER** one despite the framework-views-fresh discipline: "Last revised 2026-04-28 (post run-12)" (line 5), describes the **pre-ADR-0007 roster** (`builder/fixer/reviewer/compliance/qa/redteam/learner` as "All 7 build-chain roles", line 11), recommends `gemini-2.5-flash` + calls `gemini-3.1-pro-preview` a "ghost 404" (lines 49,73,92) — **contradicting** providers.js which DEFAULTS to `gemini-3.1-pro-preview` (`providers.js:197`) and the registry (`role-registry.json:57`).
- The `.project/reference` copy is the **NEWER, canonical** one: registry-derived routing table with the new roster (qa-reviewer/security-reviewer/design-lead), the dispatch-claude.js bounded-wrapper contract, the §2.5 + ED-021 Agent-tool gates. `paths.agentDispatchGuide → .claude/project/reference/agent-dispatch-guide.md` (`agent-dispatch-guide.md:10`) and dispatch-route-guard's block message points to the project/reference path (`dispatch-route-guard.js:571-576`). **The .system copy is an orphaned stale duplicate** — whichever layer treats `.system/guides/` as authoritative (agent specs loaded from `.system`) would read the wrong, pre-rewrite contract.

### G2 — `.system` guide cites the legacy `gemini-2.5-flash` + "ghost" pro-preview — directly contradicts live config
- `.system` guide lines 49/73/92 say default gemini = `gemini-2.5-flash` and the pro-preview is a 404 ghost. providers.js (`:189-197`) + role-registry (`:57`) + gamma.md (`:118`) all use `gemini-3.1-pro-preview` as the real default. Internal cross-spec contradiction (subset of G1 but worth flagging independently — it's a model-id contract drift that would silently downgrade security review if the stale guide is followed).

### G3 — ADR-0007's "silent false-green" list reads as a present-tense gap but is already fixed
- `0007-agent-system-org-rewrite.md:30` states `gauntlet-verify.js --roles reviewer,compliance,qa,redteam` "is hardcoded in both gamma.md/delta.md". On disk, gamma.md now builds a **derived** `$ROLES` (pod reviewers + qa-reviewer + security-reviewer, "DERIVED from the registry, never a hardcoded role list", `gamma.md:13`,`:266`,`:278`). The ADR text is a stale description of the pre-rewrite state — not a real disk gap, but a reader auditing from the ADR would mis-diagnose it as live. (registry `consumers_to_rewire` `role-registry.json:91` carries the same stale framing.)

### G4 — gauntlet-verify has NO embedded runId; correlation is purely time-window (self-documented weakness)
- `gauntlet-verify.js:33-46` + `:84-93`: the completion record schema carries no sprint/run id, so a verify is filtered only by the `since`/`until` wall-clock window (with a 24h future-skew clamp). The doc itself flags per-runId correlation as DEFERRED. This is a structural soundness gap: two concurrent sprints/gauntlets in the same window can cross-satisfy each other's roles. No named enforcer closes it — only the time clamp narrows the exploit.

### G5 — ED-024 (org-map.json reporting-line collapse) explicitly OPEN; role-parity still reads org-map.json
- `0008-…:15`,`:75` + `role-registry.json:3`,`:5`: the registry's `home/sub_home/dispatchable_by` are declared the single structural source, but `scan:role-parity` still reads `org-map.json`'s `domains{}` view — a known two-source split, ADR-0008 says it "does not perform that step." So a "should be single-sourced" reporting structure currently has a residual duplicate source; ED-024 is the named-but-open debt (enforcer exists for routing, NOT yet for the reporting-line collapse).

### G6 — full.js's `--epsilon` path is gated/opt-in and the default sprint path still emits telemetry-only consults (no liveness record)
- `full.js:95-116`: with `--epsilon` unset (the DEFAULT), `emitPhaseConsults` falls back to `hookConsult.emitStepConsults` — coverage-only `manager_consult`, NO completion record. ADR-0009 risk #3 names this directly: "the gated `--epsilon` path could bit-rot (untested) because the default path is the script one" (`0009-…:74`). So the "REAL agent dispatch" contract that mode/sprint.md advertises (`mode/sprint.md:8-13`,`:48-62`) only holds when the operator/`/sprint:full` actually passes `--epsilon-dispatch` (or `WARPOS_EPSILON_RUNTIME=on`); a bare `/sprint:full` is still telemetry-only. The wiring-equivalence test is the only guard against the gated path drifting.

### (No missing-file gaps found)
Every script/spec/agent path cited by the specs resolves on disk: registry-roles.js, catalog.js, org-roles.js, state.js, hook-points.js, hook-consult.js, adhoc-fail-override.js, sprint-manager-consult.js, dispatch-routing-parity.js, sprint-hook-coverage.js, concurrency-lock.js, prune-dead-locks.js, provider-trace.js, output-validator.js, the epsilon/dispatch-claude test files, all delta-* prompt scripts, and every agent spec referenced by the role-registry (`qa-reviewer.md`, `security/reviewer.md`, `frontend/builder.md`, `design-quality.md`, `learner.md`, epsilon/gamma/delta.md). `.claude/commands/sprint/full.md` + `execute.md` both exist.
