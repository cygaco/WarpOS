# WarpOS Reliability + Agent-System Organization — PLAN (analysis only)

> Scope grew (operator 2026-06-07): this is now a **WarpOS reliability plan** — file discovery, file editing/application, tool-use, dispatch integrity, and **truly-isolated testing for everything** — with the agent-system org cleanup (E-SYSTEM-ORG-001) as its #1 concrete workstream. See §11 (tool-reliability test results) + §12 (the reliability reframe).

**Session:** 2026-06-07 · **Mode:** planning only (NO system changes this session) · **Owner:** President (α)
**Feeds:** `trackers/epics/E-SYSTEM-ORG-001` (TOP) + `trackers/epics/E-DISPATCH-INTEGRITY-001` (F-1/F-3 overlap)
**Cross-provider consult:** GPT-5.5 via `node scripts/dispatch-agent.js consult` (real dispatch; output `runtime/agent-system-plan/gpt55-consult-output.json`, ok:true, model gpt-5.5, 5.9s class)

> This is the frozen S-1 audit + the design for S-2…S-6 and three new items (N-1/N-2/N-3).
> Execution is a LATER session. Nothing here is built yet.

---

## NORTH STAR — the one question this whole plan answers (operator reframe 2026-06-07)

**What is the best DISPATCH SHAPE for each skill and each agent, throughout the operating system?**

Skills (§13) and agents (the dispatch-guide + N-1/N-2/N-3) are NOT two problems — they are the **same** problem at two granularities. Every unit of work (a skill run, an agent run) must be matched to the right shape, the wrong shape must be self-detecting, and the chosen shape must be PROVEN (runs §13.6 · pays+good §13.7 · really-dispatched-not-faked N-1).

### The dispatch-shape menu
| Shape | Mechanism | Cost to Alpha's context | When it's right |
|---|---|---|---|
| **Inline** | Alpha does it in-context | full (output lives in the conversation) | light work; needs the LIVE conversation; conversation-derived (e.g. `session:end` handoff) |
| **In-process Agent tool** | `Agent(subagent_type:…)` | HIGH — dumps full sub-output into the orchestrator | Claude-only research/Plan/β consult with SMALL returns; **BLOCKED for build-chain** (dispatch-guide §2.5) |
| **Bash subprocess — Claude** | `dispatch-claude.js` (bounded, reap-safe) / `claude -p --agent` | LOW — envelope only | build-chain Claude roles; heavy Claude **skills** (§13) |
| **Bash subprocess — cross-provider CLI** | `dispatch-agent.js` → `codex`/`gemini` | LOW — envelope | reviewers/security (model diversity; no self-grading) |
| **API** | `curl` (deep-research, GPT-Pro) | LOW — envelope | capabilities with **NO CLI only** (§3); never for routine dispatch (§N-2: availability ≠ authorization) |

### The decision rule (per unit — skill OR agent)
- **Inline** if it's light OR needs the live conversation.
- else **subprocess** (Claude via `dispatch-claude`, or cross-provider via `dispatch-agent`) if it RUNS headless (§13.6) AND pays+stays-good (§13.7).
- **API** only when no CLI exists for the capability.
- **In-process Agent tool** only for small Claude returns that genuinely need orchestrator context (research/Plan/β); never for build-chain.
- **Cross-provider** whenever the unit is independent review (the no-verdict-on-own-work invariant).

### Shared substrate (both skills + agents ride it)
Reap-safety (`dispatch-claude` bounding) · telemetry + `run_id` (N-1) · the lean-envelope contract (ED-021) · isolated testing (P5) · the Phase-0 dry-run (§14) · CLI-vs-API policy (N-2) · the shared auth-resolver (N-3).

So: **this is the "WarpOS dispatch-shape" system.** The agent-system org cleanup (E-SYSTEM-ORG-001) is its first concrete workstream (one source of truth for the dispatch rules); skill-routing (§13) is its second; N-1/N-2/N-3 + tool-use reliability are the enforcement + safety substrate.

---

## 0. What was read (honoring "read the entire tree")

**Read in full this session:**
`.claude/agents/.system.md` (1434 ln), `.system/frontmatter-guide.md`, `.system/guides/agent-dispatch-guide.md` (the orphan), `.system/guides/oneshot-token-guide.md`, `_system/learner.md`, `_system/stub-scaffold.md`, `_principles/base.md`, all 5 faces (`president/alpha|beta|gamma|delta|epsilon.md`), `president/.system/adhoc/protocol.md`, `president/.system/oneshot/protocol.md`, `president/.system/lexicon.md`, `president/.system/policy/decision-policy.md`, `president/.system/policy/adr/0007` + `0008`, `engineering/director-of-engineering.md`, `product/quality/qa-reviewer.md`, plus the canonical `.claude/project/reference/agent-dispatch-guide.md`, `_org/role-registry.json`, `scripts/dispatch-agent.js`, `scripts/hooks/lib/providers.js`, `.claude/commands/research/deep.md`.

**Verified via targeted grep (confirmed they reference the system docs / are blast-radius, not yet full-read):** `product/director-of-product.md`, `engineering/security/builder.md` (both cite `.system.md`).

**Verified NOT in this plan's blast radius (broad `.system|dispatch|api|.env` grep returned them clean):** the ~16 pure role-craft specs — `engineering/{frontend,backend}/{builder,fixer,reviewer}.md`, `engineering/security/{fixer,reviewer}.md`, the leads, `growth/*`, `product/{product-lead,design-lead}.md`, `product/quality/{design-quality,visual-review,test-runner}.md`. They are agent role definitions and don't touch the `.system`/dispatch-guide machinery.

---

## 1. The mess — full inventory (S-1 AUDIT, frozen)

There are **THREE** dotted "system" locations under `.claude/agents/`, not the one or two the operator named:

| # | Path | What it is | Disposition |
|---|------|------------|-------------|
| A | `.claude/agents/.system.md` (file, 1434 ln) | **OLD pre-ADR-0007 monolith** — "Dark Factory", a downstream product's examples, the retired 8-role model (Auditor/Evaluator/Compliance/QA/Fix Agent), old heartbeat + store schema, old gauntlet. BUT still carries live mechanism contracts (parallel gauntlet, snapshot-diff, circuit-breaker, escalation ladder, context-scoping) that δ/oneshot reference. | **Mine live mechanisms → focused doc; archive the rest (non-authoritative, excluded from spec-enumeration). De-dot.** |
| B | `.claude/agents/.system/` (folder) | `guides/agent-dispatch-guide.md` (**STALE ORPHAN**, 243 ln, 2026-04-28), `guides/oneshot-token-guide.md` (Delta context-budget guide — still useful), `frontmatter-guide.md` (frontmatter authoring ref — useful, stale role/model examples). | **Move into `_system/guides/`. De-dot.** |
| C | `.claude/agents/president/.system/` (folder) | **Far more load-bearing:** `oneshot/store.json` (live state machine), `policy/decision-policy.md`, `policy/current-stage.md`, `policy/adr/0000–0010 + INDEX`, `beta/` (judgment model + events + source data), `adhoc/protocol.md`, `oneshot/protocol.md`, `lexicon.md`. All wired via `paths.*` (`paths.decisionPolicy`, `paths.currentStage`, `paths.adrIndex`, `paths.policy`, `paths.oneshotStore`, `paths.betaEvents`) + a literal fallback in `dispatch-agent.js`. | **DEFER (GPT-5.5 + α agree).** Too load-bearing; de-dotting it couples doc cleanup to oneshot/runtime migration and risks breaking Delta. Separate, later sprint. |

### The proven forcing case — `agent-dispatch-guide.md` exists twice and has drifted

| Copy | Lines | Date | State | Pointed to by |
|------|-------|------|-------|----------------|
| `.claude/project/reference/agent-dispatch-guide.md` | 197 | 2026-06-05 | **CURRENT / canonical** (post-ADR-0007 roles, `dispatch-claude.js`, §2.5 in-process Agent contract, ED-021 lean-return) | `paths.agentDispatchGuide`, `session-start.js` banner, `CLAUDE.md`, `PROJECT.md`, `gamma.md`, `delta.md`, `dispatch-routing-parity` |
| `.claude/agents/.system/guides/agent-dispatch-guide.md` | 243 | 2026-04-28 | **STALE ORPHAN** (old role names builder/reviewer/redteam; dead models gemini-2.5-flash/gpt-5.4-mini; literally says `gemini-3.1-pro-preview` is a "ghost 404" — now contradicts the live registry where it is the default) | `_requirements/03-architecture/AGENT_GUIDE.md:45` ← **a real doc points readers at the STALE copy** |

Both `owner=framework` → **both ship downstream**. The maintained canonical sits in the *unintuitive* place; the stale copy squats in the *intuitive* agent-tree home. `scan:references` can't catch it (both exist → not a broken ref; it's **content drift**). The orphan still holds genuinely-useful operational detail the canonical lacks (headless env-key/auth table, concurrency caps, prompt-assembly/inlining rules, worktree/continuation patterns) → **merge then delete**, not "just delete".

### What `_system/` actually is (the operator didn't know)
`_system/` is the **mode-agnostic infra-agent home** (ADR-0007 `home:_system`). It holds two *dispatchable agent specs*:
- **`learner.md`** — the between-cycle "Auditor". After each oneshot/sprint cycle it reads reviewer/security/QA results + the bug/conflict datasets and **adjusts the environment for the next cycle** (lint/spec/hygiene changes, ADR drops for Class B). Provider openai/gpt-5.5. Dispatched by γ/δ/ε. *(Oneshot/sprint only — adhoc has no cycles.)*
- **`stub-scaffold.md`** — regenerates ONE skeleton stub file from the current feature spec when `/oneshot:preflight` Pass 7.9 detects signature drift. Stub only (no logic). Provider claude/sonnet. build_chain.

So `_system/` is the right de-dot target: it already holds the infra agent specs; the `.system/` reference docs join it under a `guides/` subfolder so they don't collide with the spec enumerator.

---

## 2. The three dispatch failures + the env issue — root causes

| # | Failure (operator's words) | Root cause | Fix item |
|---|----------------------------|------------|----------|
| (i) | **Skipping parts of the gauntlet** | (a) stale docs name the OLD reviewer roster (`reviewer/compliance/qa/redteam`) — a hardcoded `--roles` list silently collapses to the wrong expected set (registry `consumers_to_rewire` calls this "#1 silent-false-green"). (b) Deeper: `/sprint:full` can record *coverage* with **zero real dispatch** behind it (E-DISPATCH-INTEGRITY RC-2 "sprint theater"). | **N-1** (binding dispatch) + S-2 (de-stale the guide's roster) |
| (ii) | **Dispatching via API when CLI is intended** | No enforcer detects a raw provider-API call. The agent reaches for `curl`/SDK/`node -e fetch` when an API key exists, instead of the CLI wrapper. The CLAUDE.md "prefer existing skills / ground in truth" rules did **not** prevent it (E-AGENT-DISCIPLINE). | **N-2** (CLI-vs-API policy + scan + `dispatch-api.js`) |
| (iii) | **Dispatching agents into context (in-process Agent tool) not bash subprocess** | The guard hard-blocks build-chain roles via the Agent tool, BUT (a) **`alpha.md` never references the dispatch guide** — when α dispatches directly (solo / ad-hoc consults) there's no binding pointer; (b) the harness Agent-tool roster lists `frontend-reviewer`/`qa-reviewer`/`security-reviewer` as `subagent_type`s, making in-process dispatch of cross-provider roles *too easy* (and it silently runs a Claude clone, killing provider diversity). | **N-1** + add the guide pointer to `alpha.md` (and a guide-binding telemetry check) |
| (env-a) | **"If an API exists, assume API instead of CLI"** | Same as (ii) — API availability is read as API authorization. | **N-2** (policy line: "API availability NEVER implies API dispatch") |
| (env-b) | **"When doing an API dispatch, flat-out ignore the env keys"** | Keys are declared "missing" without opening `.env.local` (OpenAI) / `~/.gemini/.env` / `~/.gemini/oauth_creds.json` (Gemini). The deep-research scripts only read `process.env`+OAuth, so they *can* falsely report missing. | **N-3** (shared auth-resolver + verify-before-declaring-unavailable gate) |

---

## 3. CLI-vs-API — VALIDATED structure (operator's belief confirmed in code)

**Validated at the source level:**
- **Agent dispatch = CLI, always.** `dispatch-agent.js` → `runProvider()` (`providers.js`) shells out to **CLIs only**: `codex exec` (OpenAI), `gemini -p` (Gemini), native `claude`. Build-chain Claude roles go via `dispatch-claude.js` (bounded/reap-safe). The only env-key touch is injecting `GEMINI_API_KEY` so the *gemini CLI* can auth when there's no OAuth — and the code comment is explicit: the file key "must win ONLY for API-requiring tasks (e.g. `gemini-deep-research.js`)... CLI/gauntlet dispatch does NOT require the API."
- **API (direct HTTP) = exactly two cases:**
  1. **Deep-research pipeline** — `research/deep.md` hits the OpenAI Responses API (`o3-deep-research`/`o4-mini-deep-research`) + Gemini Interactions API (`deep-research-pro-preview-12-2025`) via `curl`, loading keys from `.env.local` + `~/.gemini/oauth_creds.json`. (Claude's leg uses the Agent tool + WebSearch, not an API.)
  2. **GPT-Pro / API-only models** — o3-pro / GPT-5.5-Pro have **no CLI**, so they must be API. (This is where `gptpro-suggestions.md` came from.)

**The policy (to be written into the consolidated guide), GPT-5.5's precise wording:**
> CLI is **mandatory** for agent dispatch. API is allowed **only** for provider capabilities unavailable through a CLI — deep research / background web search / GPT-Pro-style API-only models. **API availability never implies API dispatch.**

**Key locations (for N-3 / the guide's "where the keys live" table):**
| Key | Location(s) |
|---|---|
| `OPENAI_API_KEY` | `.env.local` |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY` | `.env.local`; gemini CLI also reads `~/.gemini/.env` |
| Gemini OAuth | `~/.gemini/oauth_creds.json` (CLI login; preferred for CLI dispatch) |
| Codex/OpenAI CLI auth | `codex login` (OAuth) or `OPENAI_API_KEY` (metered) |

---

## 4. The plan

### Decisions locked this session
- **D-1 (S-2 canonical home): MOVE the dispatch guide into the agent tree** → `.claude/agents/_system/guides/agent-dispatch-guide.md`, and repoint `paths.agentDispatchGuide` there. Matches the operator's intuition ("the most important doc in our agent system") + the epic framing + GPT-5.5. **Hard move, not a copy** — no same-basename redirect (that would defeat the new drift enforcer); a one-release migration note instead.
- **D-2 (S-3 scope): DE-DOT only `.claude/agents/.system/` + `.system.md` now; DEFER `president/.system/`** to a later, dedicated sprint (its blast radius = paths registry + oneshot store + ADRs + beta + ~10 delta scripts; coupling it here risks breaking Delta).
- **D-3 (`.system.md` handling): do NOT recreate an authoritative monolith.** Extract the still-live mechanism contracts into a focused `_system/guides/gauntlet-contract.md` (parallel gauntlet + snapshot-diff + circuit-breaker + escalation ladder + context-scoping), and archive the pre-ADR-0007 remainder as clearly-marked non-authoritative, **excluded from spec/dispatch enumeration**.
- **D-4 (duplicate-drift enforcer scoping): the detector must NOT fail legitimate per-pod duplicates** (`builder.md`, `fixer.md`, `reviewer.md` repeat by design across pods; `protocol.md` is adhoc+oneshot). Scope it to **framework-owned non-role docs** (same shipped basename, drifted content), via a path-pair allowlist. Split it out of `cutover-completeness` into its own scan.

### Sprints (E-SYSTEM-ORG-001)
- **S-1 — AUDIT** ✅ done (this doc, §1).
- **S-2 — Dispatch-guide consolidation (proven first fix).** Produce ONE canonical guide = current 197-ln content + folded-in still-useful orphan bits (env-key/auth table, concurrency caps, prompt-assembly/inlining, worktree/continuation), **de-staled to current roles/models**. Hard-move to `_system/guides/`. Repoint every consumer (see §5). Delete both old copies + their manifest entries. **Also add the guide pointer to `alpha.md`** (closes failure iii's missing-pointer).
- **S-3 — De-dot `.system/` + `.system.md` → `_system/`.** Move B's contents to `_system/guides/`; D-3 for `.system.md`; add `findAgentSpec` exclusions for `_system/guides` (or invert the resolver to prefer role-registry spec paths + frontmatter `name:` only); keep dispatchable specs only at `_system/learner.md` + `_system/stub-scaffold.md`. Both-layers (specs + scripts + manifests).
- **S-4 — Extend cutover-completeness** to also detect duplicate-doc drift — OR (preferred, per D-4 + GPT-5.5) ship it as a **separate** scan (S-6) and leave cutover-completeness on stale-rename-literals.
- **S-5 — (operator-scoped, defer)** canonical scrub + framework-boundary closure (E-BOUNDARY-001).
- **S-6 — Duplicate-doc-drift enforcer.** New `scripts/checks/duplicate-doc-drift.js`: for framework-owned non-role docs, flag two shipped files with the same basename and drifted content (path-pair allowlist for sanctioned dupes). Wire into `/scan:full` + release gates. A planted drifted dup must FAIL it.

### New items (dispatch integrity — overlap E-DISPATCH-INTEGRITY F-1/F-3)
- **N-1 — Make the dispatch guide BINDING (self-detecting when ignored).**
  - Add `run_id`/`phase_id` to dispatch records in BOTH `dispatch-agent.js` + `dispatch-claude.js`.
  - Before a gauntlet launches, write a `dispatch-plan.jsonl` row: expected roles, expected providers, pods touched, **guide hash**, roster source.
  - Extend `gauntlet-verify.js` (or new `dispatch-coverage-gate.js`): FAIL if any expected role lacks an `ok:true` completion for the same `run_id`; verify provider diversity from **actual** completion records; reject hand-authored "coverage" rows with no backing `dispatch-plan_id`.
  - Gate every "coverage complete" / sprint-phase / release transition on that verifier. (Kills "sprint theater" + skipped-reviewer + in-process-claim in one mechanism.)
  - Add the guide reference to `alpha.md` doctrine.
- **N-2 — CLI-vs-API policy + enforcer.**
  - Machine-readable allowlist: API only for deep-research + GPT-Pro/API-only models; everything else CLI.
  - New `scripts/checks/provider-api-policy.js`: scan `scripts/**`, `.claude/commands/**`, agent specs, docs for `api.openai.com`, `generativelanguage.googleapis.com`, `new OpenAI`, `responses.create`, raw `fetch(...)`/SDK calls **outside allowlisted files**.
  - Extend `dispatch-route-guard.js` (Bash matcher): block raw `curl`/`node -e`/`python -c` hitting provider APIs unless via an allowlisted wrapper.
  - New `scripts/dispatch-api.js`: the single wrapper for GPT-Pro/API-only dispatch — writes telemetry like the CLI path.
- **N-3 — Stop ignoring env keys (verify-before-declaring-unavailable).**
  - One shared **auth-resolver**: checks `process.env` → project `.env.local` → project `.env` → `~/.gemini/.env` → Gemini OAuth → Codex auth. Returns **source labels only, never values**.
  - Rewire `openai-deep-research.js` + `gemini-deep-research.js` to use it (today they can falsely report "missing").
  - Static scan: direct `process.env.OPENAI_API_KEY`/`GEMINI_API_KEY` reads outside the resolver/bridge FAIL.
  - Error messages must list checked sources ("OPENAI_API_KEY unavailable after checking env + .env.local"), never bare "not set".
  - **Key sources are plural — check ALL, and keep them IN SYNC.** A project may have `.env.local`, `.env`, both, or neither, PLUS an out-of-tree key-file override (`OPENAI_KEY_FILE` / Desktop file) and OAuth. The resolver must check the full precedence (override key-file → `process.env` → `.env.local` → `.env` → `~/.gemini/.env` → OAuth). **The bug is staleness/skew across sources:** a stale `.env.local` while the real key lives in an override is silent and lethal.
  - **Verify the key WORKS, don't just confirm it's PRESENT** — a present-but-invalid key reads as "set" yet 401s on first call (verify-before-declaring-available, the twin of verify-before-declaring-unavailable).
  - **Writing a key must be BOM-safe + leak-safe** — never via a PowerShell pipe (prepends a BOM → cryptic 401), never echoing the value to the transcript; use a standalone updater that strips BOM, writes UTF-8/LF, upserts into `.env.local` AND `.env`-if-present, and prints only length + filenames (pattern: `scripts/one-off/sync-openai-key.js`, built this session).
  - **LIVE EVIDENCE (2026-06-07):** hit this twice in one session — this repo's `.env.local` held an invalid `…QAkA` key; the morning's launch deep-research succeeded only because that session used the `OPENAI_KEY_FILE` Desktop override (`…p5sA`) and never synced `.env.local`; my run trusted the stale `.env.local` and 401'd. Root = exactly N-3 (real key elsewhere; default source stale). Fixed by syncing `.env.local` BOM-safe.

### Sequencing (GPT-5.5-refined; report-only → blocking)
1. Freeze inventory (this doc) — incl. manifests + downstream update behavior.
2. Build N-1/N-2/N-3/S-6 enforcers in **report-only** mode first.
3. Consolidate the guide content (S-2 merge).
4. Move the canonical path via `framework/paths.registry.json`, then **regenerate all generated path artifacts** (`paths.generated.js`, `paths.json`, `paths.schema.json`, `path-lint.rules.generated.json`).
5. Update hardcoded consumers that don't use `paths.*` (§5).
6. Delete obsolete managed copies + **regenerate BOTH manifests** (`generate-framework-manifest.js` + `warpos/manifest/build.js`).
7. Run `/scan:references`, `/scan:cutover-completeness`, `/scan:dispatch-routing-parity`, `/scan:role-parity`, `/scan:scan-coverage`, manifest honesty/ship checks, targeted tests.
8. Flip the new enforcers from report-only → blocking.

**Parallel-safe:** content merge, duplicate inventory, API/auth scan design, dispatch-telemetry design.
**NOT parallel-safe:** path move, generated-artifact regen, manifest regen, obsolete-file deletion (do serially).

---

## 5. Full blast radius + resolution

### Moving `agent-dispatch-guide.md` (project/reference → `_system/guides/`)
| Consumer | What | Resolution |
|---|---|---|
| `framework/paths.registry.json` (SOURCE) | `agentDispatchGuide` path + `docsToken` | Edit source, then `node scripts/paths/build.js` |
| `.claude/paths.json` · `scripts/hooks/lib/paths.generated.js` · `schemas/paths.schema.json` (**`const`!**) · `scripts/path-lint.rules.generated.json` | generated views | regenerate from source (don't hand-edit) |
| `_requirements/03-architecture/PATH_KEYS.md` | doc table | regenerate / update |
| `scripts/checks/dispatch-routing-parity.js` | hardcodes the path | repoint |
| `scripts/hooks/dispatch-route-guard.js` | prints the path | repoint |
| `scripts/hooks/session-start.js` | banner prints the path | repoint |
| `CLAUDE.md` · `PROJECT.md` · `gamma.md` · `delta.md` | prose path refs | repoint to `paths.agentDispatchGuide` |
| `_requirements/03-architecture/AGENT_GUIDE.md:45` | points at the **stale** copy | repoint to canonical |
| `_org/role-registry.json` `consumers_to_rewire` | names the project/reference path | update |
| `.claude/agents/.system/guides/oneshot-token-guide.md` | relative companion ref | make explicit via `paths.agentDispatchGuide` |
| `.claude/framework-manifest.json` · `framework-installed.json` · `_warpos/MANIFEST.json` | ship both copies | remove orphan + project/reference entries, add new; regen both manifests |
| Downstream products | already received BOTH copies | the update capsule must **delete** the obsolete managed destinations, not just add the new one |

### De-dotting `.system/` + `.system.md` → `_system/`
| Consumer | What | Resolution |
|---|---|---|
| `gamma.md:20` | reads `.claude/agents/.system.md` | repoint to the new focused doc(s) |
| `frontmatter-guide.md` | points to `.system.md` as "top-level spec" | repoint; also de-stale role/model examples |
| `engineering/director-of-engineering.md`, `engineering/security/builder.md`, `product/director-of-product.md`, `product/quality/qa-reviewer.md` | cite `.claude/agents/.system.md` | repoint to focused doc(s) |
| `oneshot/protocol.md` | reads `.claude/agents/.system/agent-system.md` + `.system/oneshot/compliance.md` (already partly stale paths) | reconcile during S-3 |
| `dispatch-agent.js` `findAgentSpec` DFS over `_system` | could pick up reference docs as specs | add `_system/guides` exclusion OR invert to role-registry-path + frontmatter `name:` only |
| `scripts/checks/role-parity-scan.js`, `cutover-completeness.allowlist.json`, `system/coherence.js`, `test-dispatch-config.js` | scan agent paths | re-check after move |
| manifests (×3) ship `.system/*` with IDs `agent..system.*` (double-dot artifact) | dest paths | move to `_system/...` + regen manifests |
| ~8 hooks w/ `.system` carve-outs (`smart-context`, `beta-gate`, `sprint-routing-guard`, `version-bump-guard`, `path-guard`, `paths/gate`, `sprint/paths`, `warpos/release-gates`) | mostly reference `president/.system` (DEFERRED) — verify none key on the top-level `.system/` being moved | audit each before S-3 |

### DEFERRED (president/.system/) — do NOT touch this session or in S-3
`paths.js` `LEGACY_FALLBACK_PATHS`, `dispatch-agent.js` oneshot-store fallback, `delta-*.js` (×~10), `oneshot-*.js`, `decision-policy`/`current-stage`/`adrIndex`/`betaEvents` consumers, beta.md/delta.md/epsilon.md startup reads. Tracked for a later dedicated sprint.

---

## 6. The full checklist — every problem the operator named

| # | Problem (operator's prompt) | Status this session | Resolves via | Enforcer |
|---|---|---|---|---|
| 1 | `.claude/agents` is a mess | Mapped (3 dotted locations + dup guide) | S-1…S-6 | S-6 drift scan + role-parity |
| 2 | `.system/` (guides + frontmatter-guide) → reconcile into `_system/` | Inventoried | S-3 | role-parity + manifest honesty |
| 3 | `_system/` (learner, stub-scaffold) — "what do these do?" | **Explained** (§1) | n/a | n/a |
| 4 | `.system.md` file → reconcile into `_system/` | Inventoried (old monolith) | S-3 / D-3 (extract+archive) | spec-enumeration exclusion |
| 5(i) | dispatch guide: skipping the gauntlet | Root-caused | N-1 + S-2 de-stale roster | dispatch-coverage-gate |
| 5(ii) | dispatch guide: API when CLI intended | Root-caused | N-2 | provider-api-policy + route-guard |
| 5(iii) | dispatch guide: in-process not subprocess | Root-caused (α has no pointer) | N-1 + guide ptr in alpha.md | route-guard §2.5 + coverage-gate |
| 6 | avoid `.`-prefixed names | Adopted as rule | S-3 (de-dot) + D-3 | cli.js skip-by-visible-`_`; drift scan |
| 7 | prose + enforcement for CLI vs API | Designed | N-2 + consolidated guide §CLI-vs-API | provider-api-policy |
| 8 | validate the CLI/API structure | **Validated in code** (§3) | n/a | test-dispatch-config + provider-api-policy |
| 9(a) | ".env: assume API because key exists" | Root-caused | N-2 ("availability ≠ authorization") | provider-api-policy |
| 9(b) | ".env: ignore env keys on API dispatch" | Root-caused | N-3 (auth-resolver + verify gate) | env-read static scan |
| 10 | read the entire tree | Done for the in-scope tree; rest grep-verified (§0) | n/a | n/a |
| 11 | gptpro-suggestions.md: ELI5 + approve/reject | ELI5 done; **decision pending** (§8) | new epic (operator's call) | tbd by decision |
| 12 | full blast radius + resolution | Mapped (§5) | applied per-item | cutover-completeness + manifest honesty |
| 13 | consult GPT-5.5 via proper dispatch | **Done** (real dispatch, §0) | integrated (§4–§5) | n/a |
| 14 | full checklist | **This table** | n/a | n/a |

---

## 7. GPT Pro suggestions (`gptpro-suggestions.md`) — separate workstream, operator decision pending
See §8 of the chat response. These harden the **end-user product** `_guides`/`_knowledge` + launch security — a different domain from the agent-system cleanup. Recommended as its own roadmap epic, posture = advisory-first with RED-tier-only hard stops (preserves vibe-coder speed). Awaiting operator approve/reject.

---

## 8. Not doing this session
- Any file move, rename, delete, manifest regen, or path-registry edit (planning only).
- `president/.system/` de-dot (deferred to its own sprint).
- E-DISPATCH-INTEGRITY F-1/F-2 full build (N-1 overlaps; the rest stays in that epic).

---

## 9. CORRECTIONS + ADDED SCOPE (operator clarifications, 2026-06-07)

### 9.1 CLAUDE.md ↔ alpha.md — the play (corrects the §2 failure-iii fix)
- **CLAUDE.md** = the ALWAYS-LOADED operating doc; it IS what makes the live session Alpha. Re-read in full: it has **no dispatch-guide pointer** in its body.
- **alpha.md** = NOT auto-loaded — an identity/role spec + reconstruction doc ("if CLAUDE.md is lost…"). A rule placed only here does NOT bind the live session.
- The live pointer comes from **`scripts/hooks/session-start.js`** (lines ~391–405): injects the "MANDATORY REFERENCE — Build-chain dispatch must use `dispatch-agent.js`… Full rules: `paths.agentDispatchGuide`" banner every session. So Alpha DOES get a pointer (I overstated "zero reference").
- **Why still ignored:** (a) banner says "build-chain", so an ad-hoc cross-provider **consult** doesn't read as in-scope; (b) ephemeral hook text, not durable doctrine; (c) surfaced, not BINDING.
- **CORRECTED FIX:** add a `## Dispatch` section to **CLAUDE.md body** (covers consults + reviewers, not only build-chain) + keep the hook + one-line ref in alpha.md + N-1 telemetry (the binding half). CLAUDE.md is the load-bearing home because it's the only always-loaded doc.

### 9.2 Dispatch issues THIS session + resolutions
- **GPT-5.5 consult "exit 0"** = `dispatch-agent.js` succeeded; envelope `ok:true, provider:openai, model:gpt-5.5, actualModel:gpt-5.5` → real run, real critique. `stderrBytes:2549970` = codex internal chatter captured in `runProvider`'s buffer (redirected stderr file = 0 bytes); benign, not corruption. No fix needed.
- **Glob false-negative (real tool hazard):** a targeted grep used `glob:{product,engineering,growth}/**/*.md` → "No matches found" (FALSE). The Grep tool does NOT brace-expand `{a,b,c}` — it silently matched nothing, masking blast radius. **Resolution (process):** never use brace-expansion globs in the Grep tool; use separate greps or a single dir path. (Candidate: a CLAUDE.md hygiene note.)

### 9.3 Expanded `.system.md` blast radius (corrects §1.A + §5 — found via the glob fix)
`.system.md` is cited as a **"role definition (Dark Factory model)"** by 8 live specs, not just gamma:
`president/gamma.md`, `engineering/frontend/builder.md`, `engineering/backend/builder.md`, `engineering/security/builder.md`, `engineering/security/security-lead.md`, `engineering/director-of-engineering.md` (×2), `product/quality/qa-reviewer.md`, `.system/frontmatter-guide.md`.
→ **D-3 must extract the still-live "Dark Factory model" + role-definition + gauntlet/circuit-breaker/snapshot-diff contracts into the focused `_system/guides/` doc(s) and repoint ALL 8 citers** (both-layers, worker specs included) before archiving the pre-ADR remainder.

### 9.4 NEW: Role rename + re-home (operator-directed — better names, fold into the company) — S-7
| Current | Problem | Proposed name | Proposed home | Rationale |
|---|---|---|---|---|
| `learner` (`_system`, tool, gpt-5.5) | generic; floating in `_system` | **`ops-analyst`** ✅ LOCKED | President's office (cross-functional ops) | reads all review/QA results + bug/conflict datasets, adjusts the shared environment between cycles; **grows beyond oneshot later** into a broader ops function (operator) |
| `stub-scaffold` (`_system`, tool, sonnet) | engineering infra mislabeled "system" | **`skeleton-builder`** ✅ LOCKED | `engineering/` (tool tier) | builds skeleton stubs = engineering infra utility; parallels the pod `*-builder` naming |
| `consult` + `advisor` (W-4 pseudo-roles, NOT in registry, openai) | two names for one thing, no home | **`cabinet`** ✅ LOCKED (one registered role) | President's office (outside counsel) | cross-provider second opinion from a different model; register properly with provider routing |
- Both-layers: registry keystone + spec files + `providers.js` freeform-role set + `dispatch-agent.js` `FREEFORM_ROLES` + manifests. Run `scan:role-parity` + `scan:dispatch-routing-parity` green after.
- Decided: names + homes all locked (above). Open execution detail: whether to keep `consult`/`advisor` as back-compat aliases of `cabinet` during the cutover (recommend yes, one release).

### 9.5 NEW SYSTEM — Launch-Readiness Checklist + Verifier ("Launch Console") — own epic
The unifier that turns the GPT Pro pack (risk tiers §3 + evidence pack/report §5 + build-time checks §7) into ONE founder-facing checklist the AI drives — answers the UX worry (guided, visible, not surprise-blocks).
- **Items** sourced from `_guides/registry.json` + risk-tier model (Green/Yellow/Red → required items).
- **AI-assisted completion** as the founder works (drafts policy, wires checks).
- **Panel** tracks progress (checkboxes, %, per-tier gates) → emits the go/no-go report + evidence pack.
- **Each checkbox carries a `verified_by` agent dispatch** — the differentiator: "verify" dispatches an agent that inspects code/evidence (RLS on? webhook signed? privacy↔SDK match?) and ticks/flags it. The item-7 hooks BECOME these verifiers, surfaced as checkboxes not opaque gates.
- **Builds on `bootstrap:lastmile`** (readiness audit → launch plan) as the persistent tracking+verify layer. Starts as a local skill (`/launch:checklist` + `/launch:verify` over `_launch/checklist.json`); visual panel = a later Master Console feature.
- Data model: `{id, guide_source, risk_tier, verified_by, status, evidence, last_verified_run_id}`. Verifier dispatch reuses N-1's `run_id`/completion-record machinery (no phantom green checkboxes — same liveness gate).

### 9.6 GPT Pro item 7 — detailed ELI5 + dev impact (reference)
- **Hooks** (fire per-feature in the FOUNDER'S build, not the framework): `rls-policy-guard` (new table → RLS on), `payment-webhook-guard` (payment code → signature verified), `secret-exposure-guard`, `privacy-declaration-diff` (policy vs SDKs), `dependency-license-scan`, `api-cost-kill-switch`, `accessibility-baseline`, `ai-provider-data-disclosure`.
- **Hidden fixtures** = planted bad examples (RLS-on-but-policy-allows-all; unsigned webhook) so an agent can't pass by reciting the checklist.
- **Diff-model review** = independent (cross-provider) reviewer for payments/auth/privacy/RLS/prompt-injection — we already do this internally; this extends it to the product.
- **Dev impact:** proportional to risk surface (brochure site ≈ 0 checks; payments+auth+AI app = many); advisory-first → WARN not block until a real launch gate where only RED hard-stops. Low-risk apps feel ~nothing; high-risk apps get caught before shipping a leak/exploit.

### 9.7 Updated sprint list (E-SYSTEM-ORG-001 + spinoffs)
- S-1 audit ✅ · S-2 guide consolidation (+ CLAUDE.md `## Dispatch` + alpha.md ref) · S-3 de-dot `.system/`+`.system.md` (repoint all 8 `.system.md` citers) · S-6 duplicate-doc-drift enforcer · **S-7 role rename/re-home** (learner→ops-analyst @ President's-office, stub-scaffold→skeleton-builder @ engineering, consult/advisor→cabinet @ President's-office).
- Spinoff epics (operator decision): **N-1/N-2/N-3 dispatch-integrity** (overlaps E-DISPATCH-INTEGRITY); **Launch-Readiness Checklist/Console** (new); **GPT Pro launch-hardening library** (new, posture-gated).

---

## 10. SESSION DECISIONS + TOOL-USE FINDINGS (operator answers, 2026-06-07)

### 10.1 Decisions locked
- **GPT Pro pack: FULL adoption** (all gates blocking — Yellow→founder sign-off, Red→expert-review, evidence-pack required to ship). The everyday-friction cost is accepted; mitigation = the Launch Console makes friction guided+visible, not opaque (§10.7). (Advisory-first was NOT chosen.)
- **Launch Console: its own epic**, local-first (skill → `_launch/checklist.json`) **+ adoption guidelines for Master Console** to render it as a hosted panel.
- **Role renames (ALL LOCKED):** `consult`/`advisor` → **`cabinet`** (President's outside counsel / cross-provider second-opinion panel); `learner` → **`ops-analyst`** @ President's office (cross-functional operations — **grows beyond oneshot later** into a broader ops function, per operator); `stub-scaffold` → **`skeleton-builder`** @ engineering (tool tier).
- **Sequencing: E-SYSTEM-ORG-001 (fix + organize the agent system) is #1.** Spinoffs after, in this rough order: dispatch-integrity (N-1/N-2/N-3) → Launch Console → GPT Pro library → Dispatch Console GUI refresh.

### 10.2 NEW S-8 — File usage-path trace (generalizes the CLAUDE.md↔alpha.md confusion)
For every file in the agent system (+ key framework files), classify its LOAD/USAGE path:
- **(a) auto-loaded every session** — CLAUDE.md; the `session-start.js`-injected banners.
- **(b) referenced-on-demand** — read only when an agent/skill/hook points to it (alpha.md, the guides, protocols, decision-policy).
- **(c) dispatch-resolved** — agent specs resolved by `findAgentSpec` / frontmatter `name:`.
- **(d) orphaned** — no loader, no referencer.
Output a usage-path map; orphans + mispointed refs become cleanup items. **This is the structural answer to "does anyone actually read this?"** Candidate enforcer: `scan:file-usage` flags agent-system files with zero inbound reference.

### 10.3 NEW — CLAUDE.md downstream propagation
The new CLAUDE.md `## Dispatch` + `## Tool Use` sections (and any doctrine change) MUST reach downstream products. CLAUDE.md is merged at install/update (`warp:setup` merges it; framework owns a base block, product appends its own). Verify: the framework-owned CLAUDE.md base ships in the manifest; the merge preserves product additions; `/warp:update` re-merges doctrine changes; downstream CLAUDE.md carries the current (version-stamped) framework doctrine block. Add a coverage check.

### 10.4 NEW S-9 — Dispatch Console GUI refresh (STALE)
`/models:router` deploys a server + opens the **Dispatch Console** in the browser to set role→provider→model→effort. It is **stale vs the ADR-0007 registry** (old roles/models). Audit + update it to read the role-registry keystone (33 roles, the new names incl. `cabinet` + the §10.4 renames), per ADR-0008 (consumers derive from the registry — no hand-maintained list). Goal: the GUI mirrors the live system.

### 10.5 TOOL-USE RELIABILITY — empirical test (operator-directed "test the tools")
Same query 6 ways vs `find` ground truth:
| Probe | Returned | Truth | Verdict |
|---|---|---|---|
| Grep `glob:{engineering,product}/**/*.md` + `path:.claude/agents` | 0 | 6 | ❌ FALSE NEGATIVE |
| Grep `glob:engineering/**/*.md` + `path:.claude/agents` | 0 | 5 | ❌ FALSE NEGATIVE |
| Grep `glob:**/*.md` + `path:.claude/agents` | correct | — | ✅ |
| Grep `type:js` + `path` | 5 | 5 | ✅ |
| Glob `**/*.{md,json}` | both exts | — | ✅ (Glob tool braces OK) |
| Glob `**/*.json` | 13 | 13 | ✅ |
**Root cause:** the Grep tool's `glob` is matched relative to CWD/full-path, NOT the `path` arg → any `glob` with a leading dir segment (`engineering/...` or `{a,b}/...`) silently matches nothing. **This is the false-negative class.** Glob TOOL braces are fine; the GREP `glob` param is the trap.
**Correct usage:** `path` to narrow + depth-agnostic `**/*.ext`; OR full CWD-relative glob (`.claude/agents/engineering/**/*.md`); OR Glob tool; OR specific subdir as `path`. NEVER a leading-dir-segment glob alongside a separate `path`.

### 10.6 Tool-use ENFORCEMENT design (operator: "enforcements for proper tool use")
1. **Doctrine:** add `## Tool Use` to CLAUDE.md (durable, always-loaded) — the known-bad patterns + correct forms, starting with the Grep-glob trap. (Propagates downstream per §10.3.)
2. **PreToolUse `tool-use-guard.js`:** intercept Grep/Glob calls; flag a Grep `glob` that starts with a literal dir segment (not `**`/`*`) or contains `{…}` while a `path` is set → warn + emit the corrected form. (Hooks see tool inputs — a real enforcer for the agent's OWN calls, which the operator has been burned by.)
3. **`scan:tools` self-test:** fixture with known answers (like this probe) re-runs the tool variants and FAILS on regression — catches the harness changing under us. Wire into `/scan:full`.
This triad turns "I trusted a tool that lied" into a self-detecting class.

### 10.7 Full-scope GPT Pro — friction handled by the Launch Console
Full adoption = strong gates. To keep it humane WITHOUT weakening gates: the Launch Console (§9.5) renders every required item as a checkbox with AI-assisted completion + per-checkbox agent verification, so the founder sees guided, visible progress instead of opaque blocks. "Full scope" + "Launch Console UX" = strong gates, humane experience.

### 10.8 Updated workstream map
**E-SYSTEM-ORG-001 (TOP):** S-1 audit ✅ · S-2 guide consolidation (+ CLAUDE.md `## Dispatch`) · S-3 de-dot (repoint all 8 `.system.md` citers) · S-6 duplicate-doc-drift enforcer · S-7 role renames (`cabinet` ✅; learner/stub-scaffold pending) · **S-8 file-usage trace** · **S-9 Dispatch Console GUI refresh** · CLAUDE.md downstream propagation · **tool-use enforcement triad (§10.6)**.
**Spinoff epics (after):** dispatch-integrity (N-1/N-2/N-3) · Launch Console (+ MC adoption guidelines) · GPT Pro launch-hardening library (FULL scope).

---

## 11. TOOL-USE RELIABILITY MATRIX — isolated-fixture results (operator: "test more routes")

Sealed fixture: `runtime/agent-system-plan/tooltest/` (5 `.md` incl. a dot-dir, 3 with `MARKER_A`; ground truth via `find`/`grep`; `rg 14.1.1` confirmed on PATH). Every discovery + edit route run against it:

### Discovery
| Route | vs truth | Verdict |
|---|---|---|
| Glob `**/*.md` | 5/5 (incl `.hidden/`) | ✅ traverses dot-dirs |
| Glob `**/*.{md,json}` (braces) | 6/6 | ✅ Glob braces work |
| Glob `alpha/**/*.md` (leading seg in pattern) | 2/2 | ✅ |
| Grep `glob:**/*.md` + `path` | 3/3 | ✅ |
| Grep `glob:alpha/**/*.md` + `path` | 0/2 | ❌ **FALSE NEGATIVE** |
| Grep `glob:{alpha,beta}/**/*.md` + `path` | 0/3 | ❌ **FALSE NEGATIVE** |
| Grep `path` into dot-dir | 1/1 | ✅ Grep reads dot-dirs |
| Grep `type:md` | 3/3 | ✅ |
| Grep recursive (no glob) | 3/3 | ✅ |

### Editing
| Route | Verdict |
|---|---|
| Edit unique `old_string` | ✅ |
| Edit ambiguous + `replace_all:false` | ❌ refused — **GUARDRAIL (good)**: "Found 2 matches" |
| Edit ambiguous + `replace_all:true` | ✅ all replaced |
| Edit `old_string` not in file (reconstructed from memory) | ❌ "String to replace not found" — **the real error class** |

### Conclusions
1. **The discovery false-negative = Grep `glob` with a leading-dir segment OR brace-list, combined with a `path` arg.** The Glob TOOL is reliable; the trap is the Grep `glob` param (matched vs CWD/full-path, not the `path` arg). Reproduced 2×.
2. **Dot-dirs are traversed by both tools** — the "dot-dirs get skipped" effect is at the AGENT layer + some WarpOS SCRIPTS (`startsWith(".")` skips), NOT the harness tools.
3. **The editing error = reconstructing `old_string` from memory** rather than copying from a fresh Read of the CURRENT file. The `replace_all` refusal is correct behavior.

### Behavioral rules → CLAUDE.md `## Tool Use` (durable, always-loaded; propagate downstream per §10.3)
- Grep: NEVER pair a leading-dir/brace `glob` with a separate `path`. Use `path` + depth-agnostic `**/*.ext`, OR a full CWD-relative glob, OR the Glob tool, OR a specific subdir as `path`.
- When a scoped search returns 0, re-run a second way before trusting the zero (false-negatives are silent).
- Before EVERY Edit, copy `old_string` from a fresh Read/Grep of the current file — never reconstruct from memory.
- Use `replace_all:true` only when you mean all occurrences; otherwise add surrounding context for uniqueness.

---

## 12. THE RELIABILITY REFRAME (operator-directed) — 5 pillars + isolated-testing mandate

The plan is now a **WarpOS Reliability epic**; the agent-system org cleanup is its first concrete workstream, not the whole thing.

- **P1 — File-DISCOVERY reliability.** (a) Harness tools — the Grep-glob trap (tested §11) → the tool-use triad (§10.6). (b) **WarpOS's OWN discovery code** — audit every `glob`/`readdir`/DFS in `scripts/**` (manifest walk, `findAgentSpec` DFS, path resolution, ship-coverage walk, install walk) for the SAME failure classes (leading-seg globs, dot-dir skips, case). The harness trap has code analogs; "tons of discovery problems throughout WarpOS" lives here.
- **P2 — File-EDITING/APPLICATION reliability.** (a) Agent Edit discipline (read-before-edit, §11). (b) **WarpOS's file-APPLICATION code** — install/apply, capsule unpack, CLAUDE.md merge, manifest `dest` writes, regen — the "application problems." Audit for partial writes, wrong-dest, dot-path mishandling, merge-clobber, non-idempotent apply.
- **P3 — Tool-use enforcement triad (§10.6).** CLAUDE.md `## Tool Use` + `tool-use-guard` PreToolUse hook + `scan:tools` self-test (seeded by the §11 fixture).
- **P4 — Dispatch integrity (N-1/N-2/N-3).** Already designed.
- **P5 — ISOLATED TESTING FOR EVERYTHING (hard mandate).** Every check / enforcer / gate runs against a SEALED fixture or capsule — never the live dev-repo state, which masks false-greens (the recurring bug class). Each new enforcer MUST ship with: (1) a sealed fixture (known inputs), (2) a known-answer assertion, (3) a **planted-violation case that MUST fail it** (no false-green), (4) fail-closed on runner error. Self-tests wired into `/scan:full` + release gates. **No enforcer ships without its isolated test.** This extends E-TEST-SUITE-001's per-sprint test mandate specifically to enforcers, and operationalizes ADR-0006 (sealed-capsule gate) + the E-MC-READINESS hardening-sim ("extremely isolated environment; every command + every flow"). The §11 `tooltest/` fixture is the reference pattern.

**Overlaps to route, not duplicate:** P1b + P2b (WarpOS's own file-IO audit) is a large analysis sprint that overlaps **E-MC-READINESS-ANALYSIS-001's hardening-simulation track** — run it AS that track's file-IO lane, in an isolated capsule, rather than a separate crawl.

**Structure:** Reliability = the parent epic. Children: E-SYSTEM-ORG-001 (org cleanup, #1) · dispatch-integrity (N-1/N-2/N-3) · tool-use triad · file-IO audit (via MC hardening-sim) · Launch-Console verifiers. Sequencing unchanged: **agent-system org cleanup first.**

**Enforcement debt (this session):** the tool-use triad + isolated-testing mandate are DESIGNED, not built (planning only) → log via `/enforcement:log` so they surface at `/enforcement:list` + `/scan:full` until built (per CLAUDE.md Policy & Enforcement Hygiene + the memory-write hook). **Logged ED-033** (2026-06-07, high).

---

## 13. NEW SYSTEM — Skill Execution Routing ("Alpha as god-dispatcher") + research:deep dispatch security

Operator goal: **heavy skills run OUTSIDE Alpha's context as subprocesses that report back a lean envelope** — Alpha becomes a lean orchestrator (god-level dispatcher), not a doer holding tens-of-thousands of tokens of skill output → manages long tasks without OOM. This is the GENERALIZATION (advice → system) of: ED-021 (lean-return advisory), the `oneshot-token-guide` tactics, and the `orchestrator-holds-envelopes-not-content` memory.

### 13.1 Grounding (verified this session)
- **The primitive EXISTS, the system doesn't:** `scripts/dispatch-claude.js` (bounded, reap-safe Claude subprocess) + `claude -p "/skill args"` + `scripts/portfolio/run.js` (runs a skill in a fresh subprocess). There is **no general skill-dispatcher** and **no weight classification**.
- **`session:end` is NOT subprocessed** (grep-verified — operator's belief corrected): it runs learn/mine/sleep → integrate → reconcile TRACKER → handoff → land **inline** = a prime candidate that currently bloats Alpha.
- **~12 skills already subprocess ad-hoc** (`scan:full`, `sprint:execute`, `portfolio:run`, `oneshot:*`, `bootstrap:*`, `models:check`, …) — but per-skill, not a systematic routing layer.

### 13.2 Design — Skill Execution Routing
1. **Weight classification.** Add frontmatter `execution: subprocess | inline | inline-required` to each skill; generate a `skill-weight` registry (mirror the existing `skill-catalog` generator). **Heavy/subprocess:** `scan:*`, `research:deep`, `qa:audit`, `redteam:full`, `sleep:deep`, `learn:deep`, `session:end|handoff|dump`, `maps:*`, big synthesis. **Light/inline:** status views, single edits, quick lookups. **inline-required:** skills that genuinely need Alpha's LIVE conversation context (so the router never wrongly ships them out).
2. **One dispatcher** `scripts/dispatch-skill.js` — runs a heavy skill via `claude -p "/skill args"` (bounded + reap-safe like `dispatch-claude.js`), captures full output to `runtime/skill-runs/<skill>-<id>.md`, returns a **lean envelope** (≤8 lines: verdict + counts + artifact path), and writes a completion record reusing **N-1's `run_id` machinery** (same `ok:true` liveness gate → no phantom "the skill ran" claims).
3. **Doctrine** → CLAUDE.md `## Dispatch`/`## Skill Use`: *Alpha holds envelopes, not content; a heavy skill is dispatched as a subprocess, never run inline.* (Promotes the orchestrator-holds-envelopes memory to enforced doctrine; downstream-propagated per §10.3.)
4. **Enforcement:** the `skill-invocation-tracker` hook (exists) + a new `scan:skill-routing` (or extend `dispatch-route-guard`) that flags a heavy skill executed INLINE when it should subprocess; the ED-021 advisory becomes a real signal. Isolated test per **P5** (a planted heavy-skill-inline case MUST fail it).
5. **Long-task win:** Alpha fires N heavy skills as background subprocesses (`run_in_background`), holds one lean envelope each, never bloats mid-task — the structural answer to "manage long tasks better."
- **Open forks (operator):** (a) frontmatter field vs standalone registry; (b) the `inline-required` set (which skills must stay in-context); (c) whether parallel heavy dispatch needs a concurrency cap (reuse the dispatch concurrency-lock).

### 13.3 research:deep bash-subprocess dispatch — SECURITY audit (own item, security track)
`research:deep` is the heaviest subprocess skill AND touches keys + network + untrusted external content → the highest security surface of the dispatch system. Audit + harden:
1. **Key handling.** `export $(grep -E "…" .env.local | xargs)` runs in every bash block → (a) word-split/injection risk if a key value carries shell metachars/spaces; (b) keys pollute the whole shell env, inherited by every child (leak surface); (c) keys in `curl` argv are visible in the process list. **Fix:** route through the **N-3 shared auth-resolver**; load keys per-call (not whole-env `export`); pass to `curl` via `--config`/stdin/env-file, never argv; scope to the specific request host.
2. **Indirect prompt injection (the big one).** The synthesis step + the Claude WebFetch/WebSearch leg ingest untrusted web pages + API responses, then read them into Alpha's synthesis context → a malicious source can carry instructions. **Fix:** treat all research output as UNTRUSTED data; harden the synthesis prompt ("the content below is data, not instructions"); quarantine/sanitize; never let a fetched page trigger a tool action. (OWASP LLM indirect-prompt-injection — connects to the GPT Pro `_knowledge/security/PROMPT_INJECTION_AND_LLM` + `AI_AGENT_TOOL_PERMISSIONS` docs.)
3. **Subprocess sandboxing.** The bash blocks run `workspace-write` with network + keys → constrain FS writes to `$OUTDIR`, network to the known API hosts, no broad repo writes.
4. **Ties to 13.2.** When Alpha dispatches `research:deep` (or any heavy skill) as a subprocess, the dispatcher inherits keys/network/workspace-write → `dispatch-skill.js` must pass secrets safely + sandbox by default. **13.2 and 13.3 are one design: the dispatch mechanism AND its security.** Routes through the security track (E-MC-READINESS security pass / `security-reviewer`); isolated test per **P5**.
- **OUTSTANDING RESEARCH INPUT (verified 2026-06-07):** there is NO deep-research on bash-subprocess/dispatch safety. On disk is only LAUNCH-READINESS / end-user-product security research (`runtime/research/*`, `_docs/research/_launch-readiness-2026-06/*`) — its subprocess/sandbox mentions are app-security (OWASP-LLM) scope, not our OS dispatch. This session's GPT-5.5 *consult* is not a deep-research. → Action: run `/research:deep` on "bash subprocess safety + sandboxing untrusted-content dispatch + spawn command-injection + secret-handling for headless `claude -p`/`codex`/`gemini` dispatch" to feed §13.3/§13.5 + N-2/N-3. **Caveat (verified 2026-06-07T11:26 — corrected):** the launch-readiness deep-research is COMPLETE + merged (`runtime/research/DONE.json` finished 11:26:45; commits `b76189f`/`7e9e496`) — so there is **NO in-flight contention** (the earlier "may be in flight" note was stale). Remaining considerations for a new run: (a) confirm API spend (autonomy: ≥$5 ask-first); (b) the **Gemini leg FAILED on all 3 launch streams** (`gemini:false`, `gemini-error.json`) — a standing Gemini quota/auth issue, so a new run's Gemini engine may also fail; OpenAI `o3-deep-research` was the reliable leg.

### 13.4 Placement
A new system under the Reliability umbrella (sibling to dispatch-integrity), tightly coupled to N-1 (`run_id` telemetry) and the security track. Sequencing: after the agent-system org cleanup (operator-confirmed #1); pairs naturally with N-1/N-2/N-3 since it reuses their dispatch-telemetry + auth-resolver + API-policy machinery.

### 13.5 FEASIBILITY CHECK ✅ (verified this session — operator-directed "check feasibility before committing")
Found + read the working subprocess-skill dispatcher: **`scripts/portfolio/dispatch.js`** (engine behind `/portfolio:run`). It PROVES the mechanism and is already security-hardened:
- `spawn("claude", ["-p","--agent","general-purpose","/skill args"], {cwd, env:{...,CLAUDE_PROJECT_DIR}, shell:false})` — argv-array (no shell injection), parent env never mutated, input gate (`SKILL_RE`+`SAFE_ARG_RE` refuse shell metachars — redteam SCENARIO-6 closed), TRACE telemetry, exit-code propagation.
- **Already has a `dryRun` mode** (`opts.dryRun` → probe + decide, never spawn) — the precedent for the §14 dry-run prestep.

**Verdict: FEASIBLE.** `dispatch-skill.js` = `portfolio/dispatch.js`'s spawn+security discipline + THREE additions:
1. **Capture-not-inherit:** portfolio:run uses `stdio:[ignore,inherit,inherit]` (pipes to terminal). The router must `pipe` → write full output to `runtime/skill-runs/<id>.md` → return a ≤8-line envelope (Alpha holds the envelope, not the content).
2. **Reap-safety (LOAD-BEARING caveat):** `portfolio/dispatch.js` has NO timeout/bound. A heavy skill is long-running; a raw `claude -p` from Alpha's non-TTY Bash gets auto-backgrounded + silently reaped (RI-004/ED-018 — confirmed by memory "build enforcers FOREGROUND; the harness auto-backgrounds long claude calls"). So `dispatch-skill.js` MUST bound like `dispatch-claude.js` (timeout + death record + non-zero exit on reap). Without it, heavy-skill dispatch re-hits the reap class.
3. **Completion record + `run_id`** (reuse N-1) → a phantom "the skill ran" is impossible.

**Caveats shaping the classification:**
- **`inline-required` is load-bearing:** a fresh subprocess has NO access to Alpha's live conversation → any skill that summarizes/uses THIS session (`session:end` handoff, `session:dump`, conversation-derived work) CANNOT be subprocessed. `session:end` is a MIX — learn/mine/sleep/TRACKER-reconcile are subprocess-able; the handoff is `inline-required`. Split such skills, don't route them wholesale.
- **Cost/latency:** each dispatch = a full fresh Claude session (model + context load) → worth it for genuinely heavy skills, wasteful for light → the weight classification is what makes it pay.

### 13.6 HARD REQUIREMENT — every subprocess-dispatched skill must be VERIFIED to work (operator-directed)
A skill may NOT be trusted as `execution: subprocess` until a real smoke dispatch PROVES it runs correctly headless. **No "assumed subprocess-able."** Precedent: `agents:test` (`scripts/agents/cli.js test` — a ≤200-byte ping smoke-dispatch per role, `ok`/FAIL, exit codes, token-free `--no-ping` resolve-only mode). Cautionary tale: the systems manifest's **119/119 entries stuck at `status:'untested'`** — auto-registration without validation rots the honesty signal; do NOT repeat it for skills.

**Mechanism — `skills:test`, the `agents:test` analog (new):**
- For each skill classified `execution: subprocess`, run a BOUNDED smoke dispatch (`dispatch-skill.js` with a ping / `--no-ping` resolve payload) and assert: **(a)** the subprocess spawns + returns within the timeout — **NO reap** (RI-004); **(b)** it actually invoked the NAMED skill (not a hallucinated no-op or wrong skill); **(c)** it returns a parseable lean envelope; **(d)** exit 0 + a backing completion record (`run_id`).
- **On pass:** stamp `subprocess_verified: {date, run_id}` in the skill-weight registry.
- **On fail (fail-closed):** the skill is NOT routed to subprocess — fall back to inline (or hard-flag) and surface the failure. An unverified skill is **never silently trusted** as subprocess-able.
- **`inline-required` skills correctly FAIL** a subprocess smoke test (no live conversation) — that failure IS the signal to keep them inline, not a bug. (So the smoke gate also auto-detects mis-classification.)
- **Re-validation (anti-rot):** skills + the harness drift, so `subprocess_verified` is invalidated on skill edit (via the `skill-catalog-regen` hook) and re-checked periodically (`/scan:full`). A stale stamp (skill changed since) reverts to unverified — no permanent "tested once, trusted forever."
- **Isolation (P5):** the smoke uses a ping / sealed payload so it does NOT trigger the skill's real side effects.
- **Wired into Phase 0 (§14):** the dry-run cannot pass while any `execution: subprocess` skill is unverified.

### 13.7 HARD REQUIREMENT — before finalizing subprocess dispatch per skill, prove it's WORTH IT + results are GOOD (operator-directed)
§13.6 proves a skill RUNS headless; §13.7 proves subprocessing it is actually beneficial. A skill is finalized as `execution: subprocess` only if BOTH axes pass — measured per-skill, never assumed:

**Axis 1 — token/context savings (the premise check).** A/B the ORCHESTRATOR-side cost: INLINE (full skill output enters Alpha's context) vs SUBPROCESS (only the ≤8-line envelope enters). `net_savings = inline_orchestrator_tokens − (envelope_tokens + dispatch_overhead)`, where overhead = the background-task notification + the envelope read + the completion-record check. Qualify only above a meaningful threshold (config: ≥N tokens AND ≥M% of inline cost). **Light skills whose output is already small save ≈nothing (envelope ≈ inline) → stay inline.** Measurement model = the `oneshot-token-guide` orchestrator-tokens-per-activity table. Record measured savings in the skill-weight registry.

**Axis 2 — result quality ("are the results good?").** Run the skill INLINE and SUBPROCESS on the same representative input; compare. A fresh subprocess lacks Alpha's live conversation, so some skills degrade. Score equivalence with an INDEPENDENT cross-provider judge (no self-grading — the diff-model-review pattern, GPT Pro §9.4). Pass = subprocess result ≥ inline quality (within tolerance). On fail: either keep inline, OR feed the missing context into the dispatch prompt and re-test (it may then pass — and the registry records what context it needs).

**Decision rule (fail-closed):** finalize `execution: subprocess` ONLY when BOTH hold — saves meaningful tokens/context AND results are as-good. Otherwise → `inline` (or `inline-required`). Stamp the registry: `{subprocess_verified (§13.6), tokens_saved, quality_verdict, context_needed?, measured_at, run_id}`.
- **Two-gate ladder:** §13.6 = *does it run?* · §13.7 = *is it worth it + good?* §13.7 depends on §13.6 (can't measure savings/quality until it runs).
- **Anti-rot + Phase 0:** re-measure on skill change; the Phase-0 dry-run (§14) can't pass while any `subprocess`-classified skill lacks a CURRENT savings+quality measurement.
- **Net effect:** subprocessing is applied where it genuinely buys context headroom WITHOUT quality loss — not as a blanket rule. Kills the failure mode where "dispatch everything" adds latency/cost/quality-loss for no token win.

This closes the loop: **classify (§13.2) → dispatcher (§13.5) → PROVE-it-runs (§13.6) → PROVE-it-pays-&-is-good (§13.7) → enforce (`scan:skill-routing`).** A skill *earns* `subprocess` status by passing a real smoke run AND a measured savings+quality gate; it is never just assigned it.

---

## 14. PRESTEP — Phase 0: Feasibility + Isolated Dry-Run Gate (operator-directed; gates ALL execution)

**No part of this plan executes until it has passed a per-item feasibility check + an isolated end-to-end dry-run.**

> **Timing (operator 2026-06-07): Phase 0 runs AT RUNTIME — it is the first step of the EXECUTION session, not a planning task.** The feasibility probes, blast-radius re-confirm, and dry-run all happen THEN, against live (sealed-copy) state. Planning does NOT need to pre-probe every item; the one feasibility check done during planning (§13.5 skill-dispatch) was only because it gated committing a NEW system to the plan. Everything else is a runtime prestep.

This is the §13.5 discipline applied to the WHOLE plan, and the P5 isolated-testing mandate applied to the plan itself. It directly answers the operator's recurring pain ("we haven't had a single clean WarpOS update ever", false-greens, reap surprises): those trace to executing against live state with no sealed rehearsal.

Phase 0 steps (run BEFORE any real change):
1. **Per-item feasibility probe** — for every item (S-2…S-9, N-1/N-2/N-3, Launch Console, Skill Routing, GPT Pro library), verify the mechanism is real + works: read the consumer, find the precedent, confirm the primitive (exactly as §13.5 did for skill-dispatch). Output: FEASIBLE / FEASIBLE-WITH-CAVEAT / BLOCKED + the caveat, per item.
2. **Blast-radius re-confirm** — re-run the §5 + §9.3 blast-radius greps CORRECTLY (no leading-dir/brace Grep globs — §11), so no consumer is missed (the false-negative class already bit this plan once).
3. **Isolated end-to-end dry-run** — simulate the whole plan in a SEALED copy (throwaway clone / capsule), NOT the live repo: do the moves/renames/repoints/regens there, run every gate against it (`scan:references`, `scan:cutover-completeness`, `scan:role-parity`, `scan:dispatch-routing-parity`, manifest honesty/ship, the new self-tests), and capture what BREAKS. Reuse existing dry-run primitives: `portfolio/dispatch.js` `dryRun`, `warp:update` (default dry-run), `manifest:migrate` (dry-run default).
4. **Dry-run report** — what each step WOULD do, predicted blast radius, predicted failures, ordered remediation. Reviewed (β + operator) before any real execution.
5. **Gate (fail-closed):** real execution starts ONLY after the dry-run is green, or every red has a named fix. A dry-run that can't complete BLOCKS execution.

**Dogfoods** P5 (isolated testing) + the E-MC-READINESS "analysis-first / frozen-target / simulate-before-change" philosophy, on this very plan. Phase 0 is the first thing an execution session does — before S-2.

---

## 15. PLANNING PRINCIPLES — distilled from this session (operator personal tracking)

Meta-principles for HOW we planned well (the how, not the what). Each is grounded in a real moment this session, so it's a check you can re-apply, not a platitude.

1. **Ground in truth; never plan from assumption.** Claims get validated in the code/files — CLI-vs-API was *confirmed in `providers.js`*, not assumed. "Stop assuming" is a planning rule, not just a coding one.
2. **Read the whole surface before judging it.** The full agent-tree read surfaced a THIRD dotted dir (`president/.system`) + 8 `.system.md` citers the original framing missed.
3. **Verify a mechanism before committing it to the plan.** The skill-dispatch feasibility read of `portfolio/dispatch.js` exposed the reap caveat that would have sunk a naive build.
4. **Test your tools; trust nothing silently.** The Grep-glob false-negative was caught by an isolated probe — and it had been hiding real blast radius.
5. **Find the FULL blast radius — with the RIGHT tools — and a resolution per item.** A false-negative search reads as "all clear"; re-confirm with a second method.
6. **Earn it, don't assign it.** A status (a skill being "subprocess-able") is proven by measurement — runs + pays + good — fail-closed; never granted by classification alone.
7. **Every policy needs a named enforcer — or logged debt.** Designed-not-built → `/enforcement:log` (ED-033), so the gap is visible at `/scan:full`, not forgotten.
8. **Isolated testing for everything.** Sealed fixtures/capsules + a planted-violation case that MUST fail — the only real defense against false-greens.
9. **Dry-run / simulate end-to-end before executing.** Rehearse in a sealed copy so issues surface before they hit live state (Phase 0).
10. **Get an independent, cross-provider second opinion on big calls.** GPT-5.5 caught the legitimate-duplicate-basename trap, the defer-`president/.system` call, and the `dispatch-api` wrapper.
11. **Defer the load-bearing/risky; sequence the safe-and-proven first.** Defer `president/.system` (deeply wired); do the dispatch-guide consolidation first (the proven forcing case).
12. **One source of truth; make the WRONG state self-detecting.** Registry-derived routing + a duplicate-drift detector for the gap `scan:references` structurally cannot see.
13. **Reframe to the real problem.** "Agent-system cleanup" → "the WarpOS dispatch-shape system" (skills + agents = one question).
14. **Surface taste/irreversible calls to the operator; decide the rest.** Renames surfaced for approval; corrections owned openly (the alpha.md↔CLAUDE.md fix); Class-A decided directly.
15. **Don't claim done without proof; report honestly.** Checked the filesystem before answering "did the research come back?" — answered "no," with evidence, not a guess. Corrected my own overstatement ("alpha.md has zero reference") once the hook proved otherwise.
16. **Persist the artifact so the work survives.** A plan rotting uncommitted under `runtime/` is itself a risk — reconcile into the tracker + commit.
17. **Scope checks to where they pay; push runtime work to runtime.** Feasibility/dry-run belong in the execution prestep (§14), not in planning — plan the gate, don't run it early.

> Candidates to promote into the durable Playbook (`/playbook:add`) once validated across another session: #1, #3, #4, #6, #8, #9, #10.

---

## 16. DISPATCH SECURITY + RELIABILITY HARDENING — from the deep research (o3, 2026-06-08)

Source: `runtime/research/dispatch-subprocess-safety/openai-report.md` (o3-deep-research, 4-phase, 221KB; read + synthesized via a lean-return sub-agent — dogfooding the dispatch-shape principle). Folds into the north-star dispatch system + N-1/N-2/N-3 + §13.

### 16.1 Confirms (research validates our design)
argv-array + `shell:false` baseline · stdin/file not argv for prompts (Windows ~32K cmdline limit; argv visible in `tasklist`) · least-privilege child `env` (never inherit full `process.env`) · no secrets in argv/prompts · BOM-safe writes · bounded timeout + kill + completion records (RI-004) · exit-0-with-empty-output = failure · subprocess as a blast-radius buffer · inline-when-cheap / delegate-when-heavy with a measured break-even · treat external input AND AI output as untrusted + least-tool sub-agents + human gate for destructive acts.

### 16.2 Corrects / Risks (our current approach is INSUFFICIENT — must fix)
- **`shell:false` is NOT injection-proof on Windows — CVE-2024-27980 (HIGH).** Node can auto-shell `.cmd`/`.bat`; our wrappers call `.cmd` shims (`claude`, npm tools) → injection re-opens. → pin a patched Node AND invoke via explicit `cmd.exe /c <ABSOLUTE-path>.cmd`.
- **PATH/PATHEXT hijack (MED):** bare-name `spawn('claude')` lets a planted `claude.cmd` earlier in PATH win → use ABSOLUTE binary paths / sanitize child PATH.
- **Safe-spawn ≠ safe ARGUMENTS (HIGH):** a whitelisted binary's own flags are weapons → the input-gate must **allowlist permitted subcommands/flags**, not merely refuse shell metacharacters.
- **`export $(grep .env.local | xargs)` is an INJECTION vector (HIGH):** a `.env` value like `KEY=$(cmd)` executes on shell-load → parse env IN-CODE (dotenv-style), never via shell `xargs`. (Confirms §13.3 + N-3; `research:deep` still does this — fix it.)
- **Stdout pipe backpressure hangs BOTH processes (MED-HIGH):** a full child stdout buffer blocks the child; a timeout masks it as "slow" → must DRAIN stdout/stderr (or `stdio:'ignore'`), not just bound time.

### 16.3 Adds (new high-leverage controls → `dispatch-claude.js` / `dispatch-agent.js` / `dispatch-api.js` / N-2 / N-3 / §13)
1. **Windows Job Objects (`JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`) (HIGH)** — if the orchestrator dies, children orphan and keep burning paid API; Windows does not auto-reap. Tie each dispatch to a Job → OS kills the whole tree on parent death. (PID-tracking cannot close this.)
2. **`taskkill /T /F /PID` tree-kill (HIGH)** — `child.kill()` kills only the top process; CLIs spawn their own children → tree-kill on timeout.
3. **Output secret-scanner/redactor on child stdout/stderr before log/return (MED)** — last-resort net for an injected key leak (pairs with the Master Console leak-scanner debt).
4. **Per-task/session token + $ budget circuit-breaker + fan-out cap (HIGH)** — denial-of-wallet (OWASP LLM10): injected "call the API per sentence." Our concurrency cap bounds CPU/parallelism, NOT dollars.
5. **Exponential backoff on 429/503 + concurrency BELOW the published limit (HIGH)** — naive retry amplifies throttling into self-DoS → `dispatch-api.js` + the CLI wrappers.
6. **Reject UNC / absolute-exe paths; never let the model choose the executable path (HIGH-impact / LOW-freq).**
7. **Force UTF-8 + normalize CRLF on stdin/file handoff (MED).**
8. **AppContainer / restricted-token / low-integrity child + network-egress allowlist (MED)** for any sub-agent that executes code or fetches untrusted web — FS confined to a scratch dir, egress denied except known API hosts (the OpenAI Code-Interpreter no-network model).

### 16.4 TOP 7 ACTIONS (plan-ready, ordered — weave into S-2/N-1/N-2/N-3 + §13 `dispatch-skill.js`)
1. Pin patched Node + switch `.cmd`-resolving dispatches to explicit `cmd.exe /c` with ABSOLUTE binary paths (CVE-2024-27980 + PATH hijack).
2. Add Job Object (kill-on-close) + `taskkill /T /F` tree-kill to the reap path; enforce stdout-drain to kill pipe-backpressure hangs.
3. Add per-task/session token+$ budget circuit-breaker + fan-out cap; wire denial-of-wallet into a scan enforcer.
4. Add exponential-backoff + sub-published-limit concurrency to `dispatch-api.js`.
5. Harden the auth-resolver: in-code dotenv parsing (no shell `xargs`) + an output secret-scanner/redactor on all child output.
6. Extend the input-gate from metachar-refusal to an allowlist of binary + permitted flags/subcommands; reject UNC/absolute-exe paths; normalize encoding/newlines.
7. Add FS-scratch + network-egress allowlist (Job Object / restricted token) for code-executing or untrusted-web sub-agents.

### 16.5 Notable sources
CVE-2024-27980 (Node Windows `.bat`/`.cmd` injection past `shell:false`) · CVE-2025-53372 (Node sandbox escape) · OWASP LLM Top 10 2025 (LLM01 injection / LLM05 output-handling / LLM06 excessive-agency / LLM10 denial-of-wallet) · Semgrep JS command-injection cheat sheet (argv + flag-allowlist) · Microsoft Job Objects / process-termination docs (the orphan-tree fix) · OpenAI Code Interpreter sandbox (untrusted-code reference model).

---

## 17. FINAL SYNTHESIS (post GPT-5.5 final review, 2026-06-08) — refines the above where they differ

GPT-5.5 (role: consult, `runtime/agent-system-plan/gpt55-final-review-output.json`) gave the final pass with the research folded in. Adopted corrections, in priority order. **Where this section differs from §13/§14/§16/N-1, this section wins.**

### 17.1 THE ONE THING (highest-leverage missing piece) — a machine-readable DISPATCH CONTRACT keystone
Not another guide — a **contract**, the dispatch analogue of `role-registry.json`. One machine-readable file: for each role/skill → `{ allowed dispatch shapes, allowed executable/tool ID, argv schema, cwd policy, file scope, env allowlist, secret-handling policy, timeout, budget (tokens+$), output policy (drain/redact/envelope), required fixtures, required reviewers, coverage obligations }`. **Every dispatcher (`dispatch-claude.js` / `dispatch-agent.js` / `dispatch-skill.js` / `dispatch-api.js`), the N-1 coverage gate, the Launch Console verifiers, and the drift scanners READ FROM IT.** This turns "dispatch shape" from doctrine into enforceable infrastructure — it is the keystone the whole north-star system hangs on. **Build it FIRST (it's a prerequisite, not a later item).**

### 17.2 Corrected hard-dependency sequence (refines §14 + "cleanup first")
"Agent-system cleanup first" holds ONLY for its NON-destructive parts (audit, doc consolidation, file-usage trace). **Do NOT do broad renames/deletes before the dispatch safety kernel + the contract exist.** Order:
1. **Safety kernel** — pin Node/tool versions; safe spawn (17.4) + auth-resolver (N-3) + in-code env parsing + output-draining.
2. **Sealed fixture harness** + the planted-violation convention (P5).
3. **The dispatch contract (17.1) + the run ledger** (N-1).
4. **Consolidate the dispatch docs + repoint CLAUDE.md** (S-2) — non-destructive.
5. **File-usage trace (S-8) BEFORE deleting/renaming anything.**
6. **Coverage gate + drift enforcers** (N-1, S-6).
7. **THEN** role renames (S-7), GUI refresh (S-9), skill routing (§13), earn-it tests, Launch Console.
- **Parallel-safe:** stale-doc citation audit, duplicate-doc inventory, fixture design, Launch Console checklist taxonomy, provider-auth inventory.
- **NOT parallel:** path-moves with role-renames; dispatch-guide deletion with coverage-gate work; skill-routing experiments before the safe wrapper exists.

### 17.3 §16 spawn-safety corrections (these SUPERSEDE §16.2/§16.4 #1)
- **`cmd.exe /c <abs>.cmd` is NOT sufficient** — it makes the shell boundary explicit but keeps `cmd.exe` arg-parsing risk. **Prefer resolving to a trusted native `.exe` / JS entrypoint and running `node.exe <ABSOLUTE-cli.js> ...args`;** allow `.cmd`/`.bat` ONLY through a tiny audited adapter with schema-validated args (pinned patched Node for CVE-2024-27980).
- **Resolve the absolute-path contradiction:** "use absolute paths" and "reject abs/UNC paths" both apply but to different inputs → **reject USER/MODEL-SUPPLIED executable paths; internally resolve trusted tool IDs → canonical absolute paths (`realpath`), verified to live under approved install roots.** The model never chooses the executable path.
- **Drain BEFORE redact (reorder):** stream-drain child stdout/stderr to a file FIRST (a full pipe buffer hangs the child; a timeout masks it as "slow"), THEN redact the envelope before it enters Alpha. Never dump raw subprocess output into Alpha by default. This precedes the secret-scanner.
- **Job Objects DEFERRED behind a day-one floor:** day-one = `taskkill /T /F` tree-kill + timeout + PID-tree logging + a **planted grandchild-kill fixture**. Job Objects (`KILL_ON_JOB_CLOSE`) become mandatory only if real testing shows paid subprocesses surviving parent death (native-binding cost otherwise).

### 17.4 N-1 coverage record schema (strengthened — a record's existence ≠ "covered")
A coverage record must carry: `plan_item_id` (stable), prompt/spec digest, command/tool identity, argv schema version, cwd, allowed file scope, exit code, **artifact digests** (proof the expected output was produced), reviewer/verifier result, and failure/waiver status. Without these the gate is new theater — backfillable, fakeable, and blind to whether the artifact actually appeared.

### 17.5 §13.7 earn-it test needs a fixed BENCHMARK PACK
"Does it save tokens / is it good" cannot be judged from ONE run (retries, summarization, review churn, stale-context failures hide the true cost). Require a small **replayable task set** with: baseline inline runs, subprocess runs, gold/human expectations, anonymized cross-provider judging, and explicit thresholds. **The cross-provider judge is for independent review / high-risk routing / calibration — NOT the sole quality oracle for every test.**

### 17.6 Phase-0 missing preconditions (add to §14)
1. **Self-test the gate with a planted violation** before trusting it.
2. **Prove kill/reap with a child AND a grandchild** process.
3. **Sealed clone must include relevant UNTRACKED files** (or explicitly record that the execution source is git-clean) — *note: this PLAN.md lives under `runtime/` and is untracked; a naive `git clone` dry-run would miss it.*
4. **Live bounded auth probe** (a minimal authenticated call), NOT mere env-var detection — *this is the exact bug we hit: the key was "present" but invalid.*
5. **Budget RESERVATION before dispatch**, not spend observed after.
6. **Confirm every enforcement script uses the wrapper path**, not ad-hoc shell.

### 17.7 Over-engineering CUTS / defers (keep momentum)
- **Defer** AppContainer / restricted-token / network-egress allowlisting **unless** a sub-agent executes untrusted code or browses hostile web (expensive Windows glue; not in the dispatch core).
- **Defer** the Dispatch-Console GUI refresh (S-9) until the registry/contract is stable.
- **Defer** broad role renames (S-7) unless they unblock routing (semantic cleanup, not safety).
- **GPT-Pro library = full scope (operator's call) but PHASED rollout** — start with the launch-readiness checks that map to actual high-risk release gates; expand from there. (Reconciles the operator's full-scope decision with GPT-5.5's "don't adopt all at once.")
- **Job Objects** = target, not a day-one blocker (see 17.3).

### 17.8 Net
The plan is execution-ready ONCE §17.1 (the dispatch contract) and §17.2 (the safety-kernel-first sequence) are honored. Build order: **contract + safety kernel + fixture harness → docs/CLAUDE.md → file-usage trace → coverage/drift → renames/GUI/routing/Launch Console.** Phase 0 (with the §17.6 preconditions) gates the first real change.
