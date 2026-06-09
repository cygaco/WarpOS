# Epic Plan: WarpOS Mode-Lifecycle Enforcement, Sprint Discipline, Dispatch-Shape Parallelism & Provider Readiness

> **Epic ID:** `E-LIFECYCLE-001`
> **Status:** Planned (this document is the durable plan; execution is a separate, approval-gated session set).
> **Source prompt:** `_planning/ingest/warpos-lifecycle.md`
> **Planning principles:** `_planning/principle.md` (the cleaned canonical doctrine this plan obeys).
> **Phase-0 evidence:** `runtime/agent-system-plan/lifecycle-phase0/{01-mode-session,02-team-lifecycle,03-hooks,04-dispatch,05-tracker-planning,06-providers}.md` (6 grounded read-only investigations, 2026-06-08).
> **Authored:** 2026-06-08 (adhoc mode, α + β consult + 6 parallel Phase-0 investigators). **β consult (5 calls) folded 2026-06-08** (logged to `paths.betaEvents`, `EVT-lifecycle-epic-decomp-2026-06-08`): 4 DECIDE — one epic (provider readiness = candidate split evaluated at Wave-4 kickoff, not pre-committed) · sequencing sound (W1 slips with W0, never around it) · design-10-build-2 with explicit fast-follow gating · provider detection = self-attestation + opt-in probe (reject infer-from-dispatch); + 1 ESCALATE (turbo) **resolved by operator: highest autonomy** (turbo auto-grants push/merge-to-main within the never-allowed hard ceilings).
> **Authority note:** `TRACKER.md` outranks this plan. When wired, `E-LIFECYCLE-001`'s state lives in `trackers/epics/E-LIFECYCLE-001-mode-lifecycle-enforcement.md` and `ROADMAP.md § Epics`.

---

## 1. Executive Summary

WarpOS keeps re-living one failure class: **mode and persistent-team correctness depends on the model remembering to follow prose.** Sprint mode "forgets" to stand up the team; a `/mode:` switch leaks the old team; dispatch shape is chosen by recall, not by a gate. The operator has corrected "where's the team?" / "where's epsilon?" repeatedly (2026-06-06, 2026-06-08), and the root cause is recorded as `RT-2026-06-08-dispatch-class-rca`. The fix is **mechanical, not documentary**: a single source of truth for mode→team→bindings, a fail-closed gate that blocks work until initialization passes, and self-detecting wrong-state checks.

**The good news (grounded in Phase 0): WarpOS already has both halves of the machine.**
1. A working **mode-aware PreToolUse blocker** — `scripts/hooks/team-guard.js` already reads `.claude/runtime/mode.json` and emits `{"decision":"block"}` before an `Agent` dispatch in sprint mode. That IS the `mode:init:gate` template; it just needs to be **generalized + registry-driven** instead of sprint-only/worker-only/hardcoded.
2. A working **declarative lifecycle-step registry** — `.claude/agents/_org/sprint-hook-points.json` already encodes `{role, step, condition, mode:"block"|"advisory"}` with a coverage enforcer. That IS the template for the ~20 "virtual" lifecycle events the harness can't fire natively (the harness event set is **closed at 8**: SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PostCompact, Stop, SessionEnd, StopFailure).
3. A working **dispatch permission matrix** — `.claude/agents/_org/dispatch-contract.json` is class-derived (auto-covers new roles) and the just-landed `scripts/dispatch/dispatch-shape.js` resolver (`SP-20260608-001`) self-detects shape mismatches. The new epic **extends** this with a parallelism axis; it does not reinvent it.
4. A **substantial provider-readiness stack** — `provider-health.js`, `provider-health-check.js`, `dispatch-readiness.js`, `auth-resolver.js`. Section H's gap is narrow: funding/subscription/CLI-latest checks + a **preferred-tier config** (greenfield).

**The reframe (principle 13):** this is not "fix sprint mode." It is the **WarpOS dispatch-shape operating layer** — modes, teams, lifecycle hooks, dispatch, sprint/epic/tracker state, planning artifacts, provider readiness, and session lifecycle as **one coherent layer**, governed by registries and gates, not memory.

**Headline reframes the plan is honest about:**
- "25 lifecycle hook events" → **2 real PreToolUse guards + ~23 virtual registry-driven events** logged to `paths.eventsFile`. The harness cannot mint custom hook events.
- "Build a dispatch matrix" → **extend `dispatch-contract.json`** (it exists).
- "Build provider readiness" → **layer funding/tier onto the existing health stack**.
- The single biggest new primitive is the **Mode-Lifecycle Registry** (`.claude/agents/_org/mode-lifecycle.json`) — the one source of truth that ends the hardcoded-in-3-places drift.

**Epic shape:** one epic, `E-LIFECYCLE-001`, **~12 sprints across 6 waves**, sequenced so every gate sits behind a proven source-of-truth prerequisite. Provider readiness (Wave 4) is the one cleanly-separable wave and may fast-follow as its own epic if it grows.

---

## 2. Phase 0 Findings: Current-System Compatibility and Blast Radius

> All findings are read-only-verified against canonical (not a worktree) on 2026-06-08, each confirmed by ≥2 methods for load-bearing absences. Full detail per surface in `runtime/agent-system-plan/lifecycle-phase0/0X-*.md`.

### 2.1 Repository Surface Map

| Path | What it controls | Matters because |
|---|---|---|
| `.claude/commands/mode/{solo,adhoc,oneshot,sprint}.md` | The 4 enterable mode skills | The behavior being hardened; all are model-run, advisory |
| `scripts/mode-set.js` | Canonical writer of the mode marker | The only mechanical touch on mode entry (advisory banner; exit 2 only on lock/activeBuild) |
| `.claude/runtime/mode.json` | **The mode source of truth** (`warpos/mode-marker/v2`) | Read by every gate; NOT yet a registered `paths.*` key |
| `scripts/hooks/lib/mode.js` (`getMode()`) | Shared mode reader | **Bug:** no `sprint` case → sprint falls through to `solo` |
| `scripts/hooks/team-guard.js` | PreToolUse `Agent` blocker; sprint hard-gate | The `mode:init:gate` template (DEFAULT-ON, fail-open, kill-switched) |
| `scripts/hooks/session-start.js` | Team-init directive + heartbeat writer + `.team-marker` | Injects the "stand up the team" directive (advisory, never blocks) |
| `scripts/checks/adhoc-team-hygiene.js` | W-21 `-N`-accretion / session-drift scan | Read-only stale-team detector (no kill) |
| `.claude/commands/session/end.md` | 10-phase wrap-up; Phase 9 team teardown | Teardown is **skill-prose, not a hook** |
| `scripts/turbo/apply.js` + `scripts/hooks/authorization-gate.js` | Turbo permission scopes → `permissions.allow` + TTL | The turbo profile to harden; classifier blocks `node-e-fs` |
| `.claude/agents/_org/dispatch-contract.json` | **The dispatch permission matrix** (class-derived) | Extend, don't reinvent |
| `scripts/dispatch/{dispatch-shape,dispatch-contract,coverage-gate,safe-spawn,auth-resolver}.js` | Shape resolver, contract validator, run-ledger gate, spawn kernel, key resolver | The dispatch spine the epic builds on |
| `.claude/agents/_org/sprint-hook-points.json` + `epsilon-runtime.js` | Declarative sprint lifecycle registry + runtime | The template for the virtual-event registry |
| `.claude/agents/_org/role-registry.json` | Roster keystone (33 roles, `residency` flags) | Has **no** mode→team roster map |
| `TRACKER.md` / `ROADMAP.md` / `trackers/` | The enforced tracking layer + epic/sprint files | Where this epic gets wired (validate.js = 20 checks) |
| `_planning/` (`ingest/plans/reviews/sources`) | Operator planning scratch | Wired only as ship-exclusion + read corpus; **no skill writes plans there** |
| `scripts/hooks/lib/{provider-health,providers}.js`, `provider-health-check.js`, `dispatch-readiness.js` | Provider status/health/readiness | The stack Section H extends |

### 2.2 Existing Mode System Map

- **Modes (verified):** `solo`, `adhoc`, `oneshot`, `sprint` at `.claude/commands/mode/`. All four share a shape: STOP-after-setup banner → `node scripts/mode-set.js <mode>` → TRACKER consult → confirm → optional `--turbo`. `adhoc`/`sprint` spawn a persistent team (α+β+γ / α+ε+β); `solo`/`oneshot` do not.
- **Source of truth:** `.claude/runtime/mode.json` (schema `warpos/mode-marker/v2`), single-writer `mode-set.js`. Full-mesh transition graph; refuses (exit 2) only on a held `lockOwner` or an `activeBuild` when switching out (overridable `--force`).
- **Gap:** mode-init is **purely a model-run skill** + an advisory stdout banner. **No pre-mode gate.** The only `SlashCommand|Skill` hook today is `skill-invocation-tracker.js` (telemetry-only). `lib/mode.js#getMode()` has no sprint case (drift). `mode.json` is referenced as a literal string, not a `paths.*` key.

### 2.3 Existing Lifecycle / Session System Map

- **Session start:** `session-start.js` injects a MANDATORY-team-init directive when `mode.json` says sprint/adhoc but the right team isn't live; warns on a >24h `.team-marker`. Advisory, never blocks. Survives `/clear`.
- **`/session:turbo`:** 6 scopes → curated `permissions.allow` patterns, additively merged + a TTL'd `authorization.json`; `authorization-gate.js` emits `decision:"approve"` on a scope match. Default scope `manifest-edit,write-jsonl,worktree-ops`, TTL 60m, 7-item safety floor. **No $-spend limit** (only a prose "≥$5/session" floor); **commit/merge ungranted; push opt-in only**. Classifier drops `node-e-fs` under `WARPOS_AUTO_MODE`.
- **`/session:end`:** 10-phase skill; **Phase 9 kills teams** (shutdown_request → TeamDelete → cleanup → verify); `--keep-teams` skips. Push is autonomy-gated. **This is skill prose — no `SessionEnd` hook touches `~/.claude/teams/`.**
- **Runtime state:** `.claude/runtime/{mode.json, authorization.json, settings-pre-turbo.json, .team-marker, .team-live-<sid>, .team-gate-hard, .team-gate-off}`.

### 2.4 Existing Persistent Team System Map

- **Definition/spawn/kill/verify:** teams are a **harness** primitive (`TeamCreate`/`TeamDelete`/`SendMessage`/`Agent(team_name,name)`). Repo limits documented in `_docs/phase0/adhoc-primitive-limits.md`: no `--force-replace`; `claim_on_startup` is not a setting (prompt-enforced only); `SendMessage` to a reaped teammate errors, no auto-respawn; task ownership is session-bound; `TeamDelete` can't kill a live process; **teams are machine-global, not per-project.**
- **Identity:** active team = the freshest `~/.claude/teams/*/config.json` by mtime — **GLOBAL, no project-slug filter.** Live member entries carry `agentType`/`name` (NOT `backendType`/`role` — the source prompt's assumed config shape is partly wrong).
- **Enforcement:** the S-12c hard readiness gate in `team-guard.js:264` blocks sprint-mode worker dispatch until an α+ε+β team is live. **DEFAULT-ON** (`hardGate = WARPOS_TEAM_GATE_SOFT !== "1"`; live `.team-gate-hard` present). Kill-switches: `WARPOS_DISABLE_TEAM_GATE` / `.team-gate-off`. Fail-open on error.
- **Source of truth for required-team-by-mode:** **HARDCODED + duplicated 3+ places** — `TEAM_MODES` in `session-start.js:535`, an inline ε-check in `team-guard.js:176`, and prose in each mode skill. **No registry.** This duplication is the structural root of the drift.
- **Detection gaps:** wrong roster → ε-presence check; stale → `adhoc-team-hygiene` (read-only, no kill); orphaned in-process zombie → acknowledged in prose, **no detector**; wrong-PROJECT team → **not detected** (global scan). No durable teardown/spawn/readiness record.
- **`mode:init:gate` as named in the prompt:** **verified absent** (grep hits only planning docs). The existing gate is sprint-only, worker-dispatch-only, and gates the wrong direction (stops worker dispatch, not `/mode:` entry or `/sprint:full` start).
- **⚠ Drift to reconcile:** epic E-SYSTEM-ORG-001 prose says S-12c "ships DEFAULT-OFF," but the shipped code, `team-guard-gate.test.js`, the code comment, and the live marker all say **DEFAULT-ON**. The plan reconciles this in `TRACKER.md` + the epic file.

### 2.5 Existing Hook System Map (the feasibility backbone)

- **Real harness hook events (GROUND TRUTH, closed set of 8, verified two ways):** `SessionStart · UserPromptSubmit · PreToolUse · PostToolUse · PostCompact · Stop · SessionEnd · StopFailure`. (PreCompact/SubagentStop/Notification are harness-recognized but unwired here.)
- **PreToolUse matchers wired:** `Bash`, `Edit|Write`, `Agent`, `Read|Grep|Glob`, `mcp__…Excalidraw__*`, `AskUserQuestion`, **`SlashCommand|Skill`**. **Only PreToolUse can DENY.**
- **Fail-closed mechanism:** house deny form = `{"decision":"block","reason":…}` on stdout + `exit(0)`; `{"decision":"approve"}` short-circuits downstream guards. Global posture is fail-OPEN (every guard try/catch → exit 0); fail-CLOSED is applied narrowly at the predicate where "permit" is the bug (e.g. `teamHeartbeatFresh` returns false on error). Harness also honors exit 2; WarpOS standardizes on the JSON form.
- **Feasibility verdict:** mode-switch interception **is real** (PreToolUse `SlashCommand|Skill` sees `/mode:*` before it runs and can block — caveat: only when invoked as a tool, not as handoff/DUMP text; the persisted-`mode.json` guards are the backstop). Dispatch-blockable-pre-init **is real and shipping** (`team-guard.js`). The remaining ~20 events must be **virtual** (`log()` to `eventsFile` against a declarative registry, cloning `sprint-hook-points.json`).

### 2.6 Existing Dispatch System Map

- **The matrix exists:** `dispatch-contract.json` — "the dispatch analogue of role-registry.json." 5-shape menu (inline · in-process-agent · subprocess-claude · subprocess-cross-provider · api), `defaults`, 7 `role_classes`, and `class_derivation` that auto-classifies any role from role-registry attributes (single-sourced). Validator `dispatch-contract.js` encodes the 3 operator-named failures (API-when-CLI, in-process-when-subprocess, skipped-coverage) with a hard role-registry backstop.
- **The resolver (new, SP-20260608-001):** `dispatch-shape.js` — `resolveShape(unit)` (agent→contract, skill→fail-closed earn-it, adhoc→5-rule decision) + `shapeMismatch()` self-detector + a `proven` flag (never a silent unproven subprocess).
- **Wiring status:** contract + shape consults are LIVE in both wrappers but **report-only** (need `WARPOS_DISPATCH_CONTRACT_ENFORCE=block`); `safe-spawn` is LIVE + fail-closed in production; `dispatch-contract.js validate` is in `/scan:full`. **`coverage-gate.js evaluate()` is built+tested but has NO live caller** (low-hanging wiring).
- **Mode restrictions:** `team-guard.js` (keyed off `mode.json`): adhoc = β/γ teammates only + build-chain is Gamma-only; oneshot/solo = unrestricted; sprint = HARD persistent-team gate. Complemented by route-guard §2.5 in-process build-chain block.
- **Parallelism:** only mechanical control = per-provider concurrency caps (gemini 3 / openai 10 / claude 32) via `concurrency-lock.js`. **No shared-file/worktree-collision detector. No under-dispatch detection** (confirmed absent two ways — greenfield).
- **Logging:** `dispatch-completions.jsonl` (coverage-gradeable: run_id/phase_id/shape/output_digest/argv_schema_version) + `dispatch-deaths.jsonl` + concurrency locks + provider-trace + `eventsFile` route-guard events.

### 2.7 Existing Sprint / Epic / Tracker System Map

- **Sprint:** `/sprint:full` chains plan→design→execute→release-prep→retro via `scripts/sprint/full.js` (shells per-phase skills). Phase 2 always halts (`tickets_pending`); adhoc halts at 4 β boundaries; hard ceilings (push/deploy/paid/migration/secret) never bypassable; Step 8b always writes a ROADMAP Shipped line + ledger row. `sprint-hook-points.json` = declarative role→step registry; adding an agent = editing a ROW.
- **Epic registration:** `/epic:*` skills **absent** (verified two ways). Epics live as `trackers/epics/E-<SEG>-<NNN>-<slug>.md` files (13 exist) + a `ROADMAP.md § Epics` entry + optional `TRACKER.md` entry. `validate.js` (20 binding checks) does NOT lint the epic file body; it enforces: the ID present in ROADMAP (check **n**, fail-closed via the `[trackers/epics/<id>.md]` link), and — only if `TRACKER.md` links the item — a `- **Current state:** <value>` bullet whose normalized state equals TRACKER's recorded state (check **r**).
- **The 20 checks:** single-file a–l (sections-present, no-blank-section, broken-links, active-tracker-files, active-next-action, completed-evidence, completed-100, hundred-completed, sprint-parent-epic, ambiguous-language, undefined-terms, required-paths) + cross-file m–t (roadmap-epic-based, epics-in-roadmap, modes-consult-tracker, work-log-session-id, expected-nonexistence, cross-file-reconciliation, hooks-enforce-or-tracked, definition-drift) + an advisory anti-deixis tier (report-only).
- **ROADMAP epic entry format:** `## Epics` → `### Active epics` / `### Planned epics`, each a `#### <ID> — <Title>` block with bullets: Goal · Priority+State+Completion · Epic tracker (link) · Related sprints · Dependencies/Rationale/Impact · Current next action · Related definitions. Tool = `/roadmap:add`.

### 2.8 Existing `_planning` Usage Map

- `_planning` exists with `ingest/`, `plans/`, `reviews/`, `sources/`. **Wired ONLY as:** (1) a ship-EXCLUSION boundary (`warpos-ship-coverage.js` MUST_NOT_SHIP, `walk-skip.js` walk-skipped, ADR-0005, closing ED-012) and (2) a read-only content corpus (`/guides:write --from-corpus`, `/learn:ingest`, product-lead cite). **NOT tied to TRACKER/epics/sprints/scans as a lifecycle store; no skill writes plans there** (`/sprint:plan` writes to `.claude/project/sprint/`). That is exactly why plans don't land there — it's manual operator scratch, invisible to manifest-driven systems.
- `_planning/ingest/` holds ingested external knowledge (the marketing corpus + INTENT/SYNTHESIS) and now `warpos-lifecycle.md` (the source prompt for this epic). `_planning/plans/` holds the **org/GTM "product-studio" expansion** planning (MASTERPLAN, FINAL-PLAN, ORG, MODES-RECONCILE, PONDER — a *different* epic: the cast, not the stage). This epic's §K confirms the absence and proposes `_planning/{epics,sprints,playbooks,decisions,research,archive}/`.

### 2.9 Existing Provider Initialization Map

- **Already exists:** `providers.js` (live dispatch bridge, OAuth-vs-key, strict downgrade, quota classify), `provider-health.js` (`probeProvider`/`probeAll` status classifier), `provider-health-check.js` + `provider-smoke.js` (+ rca/autofix; green/yellow/red, `--per-role` live ping, exit 0/2), `dispatch-readiness.js` (WI-04 static no-token CLI/model/effort/auth-tier table), `auth-resolver.js` (BOM-safe, value-free key resolver), `models/check.js` (model-id drift/ghost only).
- **Checked today:** CLI install (`<cli> --version`), auth presence (files+env), gemini folder-trust, API-key presence by name (value-free), model-id validity, live per-role reachability ping. Verdict model + exit-code contract already exist.
- **Missing vs T1/T2/T3:** API-key **funding ≥$20**, **subscription tier** (Max/Pro/Plus/AI Pro), **CLI-latest-version** comparison, **preferred-tier config** (greenfield, confirmed absent two ways), and treating **Claude as a fundable+sub-checked provider** (today it's "the harness, always ok"). Folder-trust covers gemini only.
- **Install hook-in:** `warp-setup.js:1044` does a presence-only informational provider check, never calling the health modules — the natural replacement point. Also `/warp:health`, `/warp:update` (tier-scoped), `/scan:environment`, bootstrap/portfolio first-run.

### 2.10 Compatibility Analysis

| Proposed change | Fits / Conflicts / New primitive | Disposition |
|---|---|---|
| Mode-lifecycle registry (mode→team/bindings/tier) | **New primitive**, but matches `_org/*.json` registry idiom | BUILD — Wave 0 keystone |
| Lifecycle-event registry + logger | **Extends** `sprint-hook-points.json` shape | BUILD by cloning the proven template |
| `mode:init:gate` generalization | **Extends** `team-guard.js` | EXTEND existing gate, registry-drive it |
| Mode-switch preflight guard | **Fits** PreToolUse `SlashCommand|Skill` seam | BUILD on the existing tracker hook seam |
| Mechanical teardown on switch/end | **New** (today skill-prose) | BUILD a `SessionEnd` hook + on-switch kill; keep `/session:end` skill as the rich path |
| Project-scoped team identity | **Conflicts** with global team scan | REDESIGN scan to slug-filter |
| Dispatch parallelism axis | **Extends** `dispatch-contract.json` + `dispatch-shape.js` | EXTEND |
| coverage-gate live wiring | **Fits** (built, untested-in-prod caller) | WIRE a live caller |
| Turbo $-limit + push grant | **Conflicts** CLAUDE.md Autonomy + classifier | OPERATOR-GATED policy change (see §22) |
| Provider tier engine | **Extends** the health stack | LAYER funding/tier + preferred-tier config |
| `_planning` as lifecycle store | **Conflicts** with current scratch-only wiring | RESTRUCTURE carefully (keep ship-exclusion) |
| `epic:` suite | **New** skill namespace | DESIGN all 10; BUILD `/epic:plan`+`/epic:fold` |

### 2.11 Full Blast-Radius Table

| Area | Files | Commands | Hooks | Tests | Docs | Runtime state | Risk | Mitigation | Required proof |
|---|---|---|---|---|---|---|---|---|---|
| Mode-lifecycle registry | new `_org/mode-lifecycle.json`, `lib/mode.js`, `mode-set.js`, both manifests | `/mode:*` | team-guard, session-start | new registry test + fix `getMode` sprint case | mode skills, AGENTS.md, CLAUDE.md | mode.json | Med | de-dup the 3 hardcoded sites into the registry atomically | one validator proves all readers resolve from the registry; planted wrong-roster fails |
| Lifecycle-event registry/logger | new `_org/mode-lifecycle-hooks.json`, `lib/lifecycle-events.js`, coverage enforcer | — | all lifecycle hooks log here | event-order + coverage fixtures | — | eventsFile | Low | additive; report-only first | planted out-of-order + missing-event fixtures caught |
| Mode-switch preflight | `scripts/hooks/mode-lifecycle-guard.js` (new), settings.json | `/mode:*` | new PreToolUse `SlashCommand\|Skill` | block/allow fixtures | mode skills | mode.json | **High** (blocks every mode switch) | additive + kill-switch + fail-open + bootstrap allow-list | dry-run sim per mode; planted "switch with live old team" blocks |
| mode:init:gate generalize | `team-guard.js`, registry | `Agent`/`Skill` dispatch | PreToolUse Agent | extend `team-guard-gate.test.js` | — | mode.json, team config | **High** | preserve sprint behavior; ramp report→block per mode | existing 32 gate tests stay green + new per-mode cases |
| Team lifecycle manager | new `scripts/teams/lifecycle.js`, `SessionEnd` hook, `adhoc-team-hygiene.js` | `/session:end`, `/mode:*` | new SessionEnd hook | teardown + orphan + resume fixtures | adhoc-primitive-limits | team config, `.team-live-*` | **High** (could kill wrong team) | **project-slug scope filter**; verify-terminated before proceed; never global kill | planted wrong-project team is NOT killed; orphan detected |
| Dispatch parallelism | `dispatch-contract.json`, `dispatch-shape.js`, `coverage-gate.js` caller | dispatch wrappers | route-guard | extend shape + coverage fixtures | dispatch-guide | completions ledger | Med | additive signal + report-only ramp | planted under-dispatch + shared-file-collision flagged |
| Turbo hardening | `turbo/apply.js`, `authorization-gate.js`, `session/turbo.md` | `/session:turbo` | authorization-gate | scope + spend fixtures | turbo.md, CLAUDE.md | authorization.json | **High** (push-to-main) | operator-gated default; safety floor; spend ledger | planted over-spend + unsafe-push blocked |
| `_planning` integration | `walk-skip.js`, ship-coverage, `/sprint:plan`, new `/epic:*` | `/sprint:plan`, `/epic:plan` | — | ship-exclusion stays green | ADR, tracker | — | Med | keep MUST_NOT_SHIP; add lifecycle wiring beside it | ship-coverage stays green; plan lands + links |
| `epic:` suite | new `.claude/commands/epic/*.md`, both manifests | `/epic:*` | — | skill-catalog parity | skills catalog | — | Med | design first; build 2 | `/epic:plan` produces a validate-passing epic file |
| Provider tier | new `provider-tier-check.js`, manifest/config | `/warp:{setup,health,update}`, `/scan:environment` | — | tier + planted-fail fixtures | DEV_SETUP, guides | preferred-tier config | Med | layer over health stack; value-free | planted under-tier blocks the selected tier |

### 2.12 Breakage-Risk Table

| Proposed change | Might break | Why | Detect | Prevent | Rollback |
|---|---|---|---|---|---|
| Mode-switch PreToolUse guard | All `/mode:*` switches | A fail-closed bug bricks mode entry | dry-run sim + canary session | fail-OPEN posture, kill-switch env, bootstrap allow-list | remove the settings.json hook line |
| mode:init:gate generalize | Sprint worker dispatch (working today) | Registry drift vs hardcoded behavior | keep `team-guard-gate.test.js` green | golden-snapshot the current sprint gate behavior first | revert to hardcoded path (kept behind a flag one release) |
| Mechanical teardown | Kills a team another project/session is using | Global team scan, no slug filter | planted wrong-project fixture | **slug-scope all kills**; verify-terminated | `--keep-teams` default for one release |
| Turbo push grant | Unsafe push to main | Broad self-grant + classifier conflict | spend ledger + authorization log | operator-gated default; never bypass hard ceilings | revert turbo scope set |
| `_planning` restructure | Ship-coverage / walk-skip | Moving files across the MUST_NOT_SHIP boundary | `warpos-ship-coverage.js` | keep exclusion rule; additive subdirs only | restore prior `_planning` layout |
| `getMode()` sprint fix | Any consumer relying on sprint→solo fallthrough | Behavior change | grep consumers; test each | audit all `getMode()` callers first | revert one-line change |

### 2.13 Unknowns and Required Follow-Up Reads (implementation preflight)

1. Live harness team-primitive semantics (`TeamCreate`/`SendMessage`/`TeamDelete`/reap, verify-terminated) — **dry-run only**, can't be read statically.
2. Whether PreToolUse `decision:"approve"` short-circuits LATER hooks vs ALL — affects authorization-gate ordering fix.
3. Whether `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is set in interactive sessions; exact harness broad-scope denial rules (observed behaviorally).
4. Whether a PreToolUse-on-`Skill` hook reliably intercepts `/mode:*` (matcher wired + tracker parses both shapes → strongly implies; capture a live payload).
5. Funding/subscription are likely NOT read-only CLI-detectable — confirm whether any provider exposes a value-free billing/entitlement probe.
6. `scripts/turbo/install-hook.js` role (unread); whether `/roadmap:add` auto-creates the epic tracker file.
7. `full.js` / `epsilon-runtime.js` internals re: where a `sprint:binding:verify` virtual event slots in.
8. UUID team dirs (`<sid>/inboxes`) vs named teams — semantics for the project-scope filter.

---

## 3. Problem Statement

WarpOS's mode/team/dispatch correctness is **enforced by the model's memory, not by mechanism.** Concretely:
1. Entering sprint/adhoc mode does not mechanically guarantee the correct persistent team is up before work proceeds (gate is sprint-only, worker-only, default-on but narrow).
2. A `/mode:` switch does not mechanically tear down the old team; non-`/session:end` exits leak teams; team scans are global, so the system can't even reliably tell which team belongs to this project.
3. Required-team-by-mode is hardcoded in 3+ places and already drifting (DEFAULT-ON vs prose DEFAULT-OFF).
4. Dispatch shape is now resolver-checked, but parallelism is ungoverned: no under-dispatch detection, no shared-file collision detection.
5. Turbo accelerates permissions but lacks a spend ceiling and a disciplined push grant, and conflicts with the autonomy table + classifier.
6. Provider readiness is health-checked but not tier-graded; there's no preferred-tier contract.
7. Plans don't persist to a durable, tracker-linked home; there's no `epic:` planning skill; planning principles live only in this prompt.

The result is a recurring, expensive failure class that documentation has repeatedly failed to fix. **Documentation alone is insufficient for mode/team correctness; core lifecycle behavior must be enforced by registries, hooks, gates, validators, or command wrappers.**

## 4. Goals

1. **One source of truth** for mode → required team → required bindings (sprint/epic/tracker/planning) → required provider tier → dispatch permissions: the **Mode-Lifecycle Registry**.
2. A **fail-closed `mode:init:gate`** that blocks dispatch/tool-use until the mode-init checklist passes — generalized across all modes, registry-driven, idempotent.
3. A **mechanical persistent-team lifecycle**: project-scoped spawn/verify/kill/teardown, orphan + stale detection, resume reconciliation, never relying on the model to remember.
4. A **lifecycle-event spine**: 2 real PreToolUse guards + a declarative virtual-event registry logged to `eventsFile`, with a coverage enforcer.
5. **Governed parallelism**: extend the dispatch matrix/resolver with a parallelism axis (under-dispatch + shared-file collision detection); wire `coverage-gate`.
6. **Disciplined turbo**: a spend ceiling + a safe commit/push/merge grant profile that still respects hard ceilings (operator-gated default).
7. **Tier-graded provider readiness** (T1/T2/T3) with a preferred-tier config, layered on the existing health stack.
8. A **durable planning system**: `_planning` as a tracker-linked lifecycle store + an `epic:` suite (design 10, build `/epic:plan`+`/epic:fold`) + canonicalized planning principles + an acceptance-criteria enforcement system.
9. **Earned statuses everywhere**: every "enforced/persistent/covered" claim backed by a planted-violation test.

## 5. Non-Goals

- Not inventing new harness hook events (impossible; the set is closed at 8).
- Not rebuilding the dispatch matrix, the provider health stack, or the tracker validator (extend them).
- Not building the org/GTM "product-studio" expansion (that is the separate `_planning/plans/*` epic — the cast, not the stage). This epic hardens the stage they run on.
- Not building all 10 `epic:` commands now (design all; build the load-bearing two).
- Not running any live provider auth/funding/trust mutation during planning (runtime/prestep only).
- Not changing the meaning of `/session:end`'s rich teardown (we add a mechanical backstop, not a replacement).

## 6. Design Principles

Governed by `_planning/principle.md` (17 cleaned canonical principles). The load-bearing ones for this epic: **#7 every policy names its enforcer**, **#11 sequence load-bearing work behind proven prerequisites then continue into it**, **#12 one source of truth + self-detecting wrong states**, **#6/#15 earn statuses / prove done**, **#13 reframe to the system layer**. This plan recommends promoting `principle.md` into canonical homes in Wave 5 (§8.11).

## 7. Target Architecture

```
                       .claude/runtime/mode.json   (mode SoT; warpos/mode-marker/v2)
                                 │ read by
   ┌─────────────────────────────┼──────────────────────────────────────────────┐
   │                             │                                                │
.claude/agents/_org/mode-lifecycle.json   ◄── THE KEYSTONE (Wave 0) ──►  .claude/agents/_org/mode-lifecycle-hooks.json
  per mode:                                                              declarative virtual-event registry
   - requires_team + roster (α+ε+β / α+β+γ / …)                          { event, when, mode:block|advisory,
   - requires sprint/epic/tracker/planning binding?                        payload_fields[] }  (clones sprint/hook-points.json)
   - required provider tier (T1/T2/T3)                                            │ logged via
   - dispatch permission profile (ref dispatch-contract.json)            scripts/hooks/lib/lifecycle-events.js → paths.eventsFile
   - teardown policy
        │ read by                                                                 │ coverage-enforced by
        ▼                                                                         ▼
  ┌───────────────────────────── ENFORCERS (mechanical) ──────────────────────────────┐
  │ REAL guard #1: mode-lifecycle-guard.js   PreToolUse(SlashCommand|Skill on /mode:*)  │  ← mode:switch:requested / preflight
  │ REAL guard #2: team-guard.js (generalized) PreToolUse(Agent/Skill dispatch)         │  ← mode:init:gate (fail-closed)
  │ Team lifecycle manager: scripts/teams/lifecycle.js + SessionEnd hook                │  ← kill/verify/teardown, slug-scoped
  │ Dispatch: dispatch-contract.json + dispatch-shape.js (+ parallelism axis)           │  ← shape + under/over-dispatch
  │ Turbo: turbo/apply.js + authorization-gate.js (+ spend ledger)                      │  ← permission profile
  │ Provider: provider-tier-check.js over provider-health.js                            │  ← tier readiness
  └────────────────────────────────────────────────────────────────────────────────────┘
        │ all emit virtual events + run-ledger records → paths.eventsFile / dispatch-completions.jsonl
        ▼
  Validators/scans: validate.js (tracker), /scan:full (dispatch-contract, lifecycle-coverage, ac-coverage), planted-violation fixtures
```

**Core idea:** every enforcer reads the **same registry**; wrong states are **self-detecting** because the registry is the single truth and the validators diff reality against it. The harness's 8 real events are used where they can block; everything else is a **virtual event** with the same auditability via `eventsFile`.

## 8. Scope Areas

### 8.1 Sprint Mode
Generalize the sprint hard-gate from hardcoded ε-check to registry-driven. Mode entry surfaces suggestions (ongoing sprint/epic → next planned → backlog) by reading TRACKER/ROADMAP. All non-trivial work tied to a sprint, all sprints to an epic — enforced by a `sprint:binding:verify` virtual event + the existing β-boundary halts. `/sprint:full` remains the default path; minor touch-ups allowed only with β/operator approval (logged). Parallel sprints permitted where the parallelism axis says safe.

### 8.2 Other Modes
Per-mode policy rows in the registry (JTBD, allowed/disallowed work, requires_team, bindings, tracker updates, parallel-allowed, implementation-allowed, teardown). **Solo retool:** "act as normal Claude — direct, flexible, agents-when-helpful — while still obeying WarpOS safety/protected-paths/permissions/tracker/dispatch discipline." Solo requires_team=false but is NOT a governance loophole (hard ceilings + protected paths still apply).

### 8.3 Mode Switching
One central path: PreToolUse guard on `/mode:*` → preflight (detect active team) → teardown-old (slug-scoped) → verify-terminated → init-new per registry → verify → persist state → ready. Idempotent (repeat `/mode:sprint` ≠ duplicate team). Fail-closed on the 15 enumerated failure conditions (§13).

### 8.4 Persistent Team Lifecycle
`scripts/teams/lifecycle.js`: project-scoped identity (slug filter on `~/.claude/teams/*`), spawn/verify/kill/teardown, duplicate prevention, orphan detection, durable readiness record (`.team-live-<sid>` + a state file), `SessionEnd` hook backstop, resume reconciliation. Answers the prompt's 12 team questions (§ findings 02).

### 8.5 Mode Lifecycle Hooks
2 real PreToolUse guards + ~23 virtual events in `mode-lifecycle-hooks.json` (full matrix in §13). Strict ordering; structured payloads (no secrets); fail-closed; logged in order; coverage-enforced; planted-violation tested.

### 8.6 Mode Initialization Checklist
The 14-item checklist (prev-team-down · target-resolved · policy-loaded · team-resolved · team-spawned · team-verified · dispatch-matrix-loaded · sprint/epic-loaded · tracker/planning-loaded · turbo/perms-loaded · provider-readiness · failures-reported · state-persisted · confirmation-after-pass). Enforced mechanically by the `mode:init:gate` (real guard #2), not narrated.

### 8.7 Agent Dispatch and Parallelism
Extend `dispatch-contract.json` with a mode-scoped permission profile + `dispatch-shape.js` with a **parallelism axis**: a new `shapeMismatch` finding for **under-dispatch** (safe-parallel work run serially) and **over-dispatch** (shared-file/worktree collision). Wire `coverage-gate.js` to a live caller. β influences dispatch via the existing decision protocol; decisions logged to the completions ledger.

### 8.8 Turbo Mode
**Operator decision 2026-06-08 (β-escalated Class C, resolved): "highest autonomy possible."** Turbo auto-grants the MAXIMUM autonomy short of the never-allowed hard ceilings: an operator-set spend ceiling (framework default $100, raisable per session — this session was $1000), commit, push, AND merge-to-main + branch ops, within the safety rails. A permission profile (auto / notice / confirm / never) still governs deps/auth/env/secrets/delete/migrate/deploy, with a spend ledger and a "resolve-don't-defer" β integration (β must not casually recommend deferring the core work in turbo — folds into the existing β-honesty Tier-4). The never-allowed ceilings stay never (sign-up/purchase, secret exposure, unauthorized destructive ops, backup-branch deletion). **Implementation constraint (the real work of S-LC-07):** the auto-mode classifier blocks a broad turbo SELF-grant even on an explicit operator grant (logged: `feedback_turbo_broad_scope_denied`) — so the auto-push profile must be delivered via an operator-declared DURABLE authorization (the `permissions.allow` / `/permissions:authorized` path), not a broad self-grant the classifier rejects. This deliberately overrides the standing CLAUDE.md "Push = Ask first" default for turbo sessions.

### 8.9 Epic Skill Suite
Design all 10 (`/epic:{plan,start,status,fold,split,close,review,acceptance,link,repair}`); build `/epic:plan` (epic equivalent of sprint planning → durable epic file + AC + sprint candidates + dependency/risk maps + tracker linkage) and `/epic:fold` (intelligently fold new info/scope/bugs into an existing epic with provenance + conflict detection, the 14-classification taxonomy). Full design in §8.9-detail of the source prompt; the suite consumes/produces `_planning/epics/` + `trackers/epics/`.

### 8.10 Provider Initialization
T1/T2/T3 tier engine over the existing health stack; preferred-tier config (greenfield); the flow (explain tiers → choose → save → check-only-selected → remediate → re-runnable); the permission matrix (§14). Funding/subscription detection method is the §22 operator call.

### 8.11 Planning Principles
Promote `_planning/principle.md` into canonical homes: the planning skill, `/epic:plan`, `/sprint:plan`, β judgment rules, the `_planning` epic/sprint templates, and a tracker/scan enforcer (`/scan:planning-principles` or a validate.js advisory) so a plan that omits enforcers/proof/blast-radius is flagged.

### 8.12 Playbook Suite
Today `/playbook:add` is judgment-doctrine (append a play to `playbook.md`), NOT executable protocols. Decision (taste, §22/23): keep playbooks as **reference procedures** (the low-risk default) with an optional later `/playbook:run` for executable protocols (launch-readiness, provider-setup, mode-switch, incident-response, retro loops). Plan the skill↔playbook↔mode↔epic↔sprint relationship; do not build the suite in this epic beyond the design.

### 8.13 `_planning` Integration
Restructure to `_planning/{ingest,epics,sprints,playbooks,decisions,research,archive}/` (additive; keep `plans/`, `reviews/`, `sources/`). Keep the MUST_NOT_SHIP / walk-skip exclusion. Wire `/sprint:plan` + `/epic:plan` to write here; make `/scan:*` + handoff aware; define the `_planning ↔ TRACKER ↔ epics ↔ sprints ↔ roadmap` source-of-truth relationship (TRACKER is authority; `_planning` holds the durable plan artifact an epic/sprint links to).

### 8.14 Acceptance Criteria System
Make every epic/sprint plan carry the 20 enforcement-criteria categories (§11). Extend `/sprint:design` + the new `/epic:plan` to require them; add a `/scan:ac-coverage` extension (the skill exists for verified_by linkage) + planted-violation fixtures so a plan can't silently omit them.

## 9. Proposed Epic Decomposition

**One epic: `E-LIFECYCLE-001` — WarpOS Mode-Lifecycle Enforcement, Sprint Discipline, Dispatch-Shape Parallelism & Provider Readiness.**

Rationale (principle 13): the spine — mode-lifecycle registry → lifecycle-event registry → `mode:init:gate` → team lifecycle manager — is shared by every area, so splitting fragments the source of truth. Provider readiness (Wave 4) is the one cleanly-separable workstream and may fast-follow as **`E-PROVIDER-TIER-001`** if it grows beyond one sprint.

**Relationship to existing epics (no overlap, explicit seams):**
- **E-SYSTEM-ORG-001** (dispatch-shape north star, ~99%) — *prerequisite*. This epic builds directly on its `dispatch-contract.json`, `dispatch-shape.js`, `safe-spawn`, `coverage-gate`. E-LIFECYCLE-001 is the named "NEXT epic" in the TRACKER header.
- **E-DISPATCH-INTEGRITY-001** (coverage-honesty) — *sibling*; its run-ledger precondition work pairs with Wave 2's coverage-gate wiring.
- **`_planning/plans/*` org/GTM "product-studio" epic** — *adjacent*; that is the cast (managers/marketing/design), this is the stage machinery. The mode-lifecycle registry + dispatch parallelism directly benefit it (work-modes, domain-aware dispatch).

## 10. Proposed Sprint Breakdown

> Sequenced per principle 11 (load-bearing behind proven prerequisites). `∥` = parallel-safe with. Each sprint carries its own DoD + planted-violation fixtures + the 20 AC categories (§11). Sprint IDs are illustrative (`S-LC-NN`); mint via `/sprint:plan` at execution.

### Wave 0 — Foundations / Single Source of Truth (must land first)
- **S-LC-01 — Mode-Lifecycle Registry (keystone).** Create `.claude/agents/_org/mode-lifecycle.json` (per-mode: roster, requires_team, bindings, provider tier, dispatch profile ref, teardown policy). De-duplicate the 3 hardcoded sites (`session-start.js TEAM_MODES`, `team-guard.js` inline ε-check, mode-skill prose) to READ the registry. Fix `lib/mode.js#getMode()` sprint case. Register `mode.json` as a `paths.*` key. Add a `mode-lifecycle-registry` validator (every reader resolves from the registry; planted wrong-roster fails). **Reconcile the DEFAULT-ON drift** in TRACKER + E-SYSTEM-ORG-001. Gates: new validator green + `team-guard-gate.test.js` stays green + regen both manifests. **Deps:** none. **∥:** S-LC-02.
- **S-LC-02 — Lifecycle-Event Registry + Logger + Coverage enforcer.** `.claude/agents/_org/mode-lifecycle-hooks.json` (the ~23 virtual events, cloning `sprint-hook-points.json`) + `scripts/hooks/lib/lifecycle-events.js` (logs to `eventsFile`) + a coverage enforcer in `/scan:full` (every declared event has an emitter). Report-only first. **Deps:** none. **∥:** S-LC-01.

### Wave 1 — Mechanical Lifecycle Gates (the meat)
> **β guard (2026-06-08, conf 0.90):** no W1 sprint begins until the W0 Mode-Lifecycle Registry is shippable. If W0 slips, W1 **slips with it, not around it** — building gates before their single source of truth exists produces exactly the spec-vs-code drift this epic is curing.
- **S-LC-03 — Mode-switch preflight guard (REAL guard #1).** `scripts/hooks/mode-lifecycle-guard.js` PreToolUse `SlashCommand|Skill` on `/mode:*` → preflight (detect active team, emit `mode:switch:requested/preflight`). Additive; fail-open; kill-switch; bootstrap allow-list. **Ramp report→block.** **Deps:** S-LC-01/02.
- **S-LC-04 — mode:init:gate generalization (REAL guard #2).** Generalize `team-guard.js` from sprint-only/worker-only to registry-driven for all modes; gate dispatch/tool-use until the 14-item checklist passes; idempotent (no duplicate teams). Golden-snapshot the current sprint behavior first. **Ramp per mode.** **Deps:** S-LC-01/02. **∥:** S-LC-03.
- **S-LC-05 — Persistent-Team Lifecycle Manager.** `scripts/teams/lifecycle.js` + `SessionEnd` hook backstop: **project-slug-scoped** spawn/verify/kill/teardown, duplicate prevention, orphan + stale detection (extend `adhoc-team-hygiene.js`), durable readiness record, resume reconciliation. Never global-kill. **Deps:** S-LC-01. **∥:** S-LC-03/04.

### Wave 2 — Dispatch & Turbo (build on the gates)
- **S-LC-06 — Dispatch matrix + parallelism axis + coverage-gate live wiring.** Extend `dispatch-contract.json` (mode-scoped permission profile) + `dispatch-shape.js` (parallelism findings: under-dispatch, shared-file/worktree collision). Wire `coverage-gate.js evaluate()` to a live caller (sprint/scan runtime). Report-only ramp. **Deps:** S-LC-01. **∥:** S-LC-07.
- **S-LC-07 — Turbo hardening.** Spend ledger + ceiling, the auto/notice/confirm/never permission profile, and the **highest-autonomy commit/push/merge-to-main grant** (operator decision 2026-06-08 — §8.8) delivered via a durable operator-declared `permissions.allow` profile (NOT a broad self-grant the classifier rejects), plus the β "resolve-don't-defer" integration. **Deps:** S-LC-01. **∥:** S-LC-06. **Gate:** RESOLVED — operator chose highest autonomy (turbo auto-push/merge within hard ceilings) on 2026-06-08.

### Wave 3 — Planning Producer & Epic Suite
- **S-LC-08 — `_planning` lifecycle integration + principles canonicalization.** Restructure `_planning/` (additive subdirs), keep ship-exclusion, wire `/sprint:plan` + handoff/scan awareness, define the SoT relationship. Promote `principle.md` into canonical homes + a planning-principles enforcer. **Deps:** none (but informs S-LC-09). **∥:** S-LC-06/07.
- **S-LC-09 — `epic:` suite (design 10, build `/epic:plan` + `/epic:fold`).** Build the load-bearing two; design the other 8. `/epic:plan` produces a validate.js-passing epic file + ROADMAP entry + AC; `/epic:fold` does provenance-tracked folding with conflict detection. **Deps:** S-LC-08, S-LC-01.

### Wave 4 — Provider Readiness (parallelizable; candidate fast-follow epic)
- **S-LC-10 — Provider-tier readiness system.** `scripts/warpos/provider-tier-check.js` over the health stack; preferred-tier config; T1/T2/T3 checks (funding/subscription/CLI-latest per §22 method); wire into `/warp:{setup,health,update}` + `/scan:environment` + bootstrap/portfolio first-run; the §14 permission matrix. **Deps:** none. **∥:** all of Wave 1–3.

### Wave 5 — Acceptance, Playbook, Pilot
- **S-LC-11 — Acceptance-criteria enforcement system.** Make epic/sprint plans carry the 20 AC categories; extend `/sprint:design` + `/epic:plan` + `/scan:ac-coverage`; planted-violation fixtures. **Deps:** S-LC-09.
- **S-LC-12 — Playbook design + dry-run simulation pilot + end-to-end validation.** Design the playbook suite (reference vs executable); run the full dry-run/simulation plan (§17) across all gates; one end-to-end mode-lifecycle pilot; capture defects → reconcile. **Deps:** S-LC-01..11.

## 11. Acceptance Criteria

Every epic/sprint plan in this epic must carry AC for these **20 categories** (the §8.14 system, derived from source §L): correct mode selection · correct mode switching · correct team teardown · correct team creation · correct team verification · correct lifecycle-hook firing · correct hook ordering · correct agent dispatch · correct sprint/epic binding · correct tracker linkage · correct planning-artifact persistence · correct provider readiness · correct safety gates · correct test strategy · correct fixture/holdout coverage · correct review requirements · correct completion proof · correct user-approval points · correct learning/persistence capture · correct blast-radius analysis.

**Mode-specific (source §A/§B), each with proof:** sprint-mode-with-no-team is caught (planted fixture blocks) · sprint-with-wrong-team kills+respawns · work-before-sprint-binding caught · work-before-epic-binding caught · tracker-not-updated caught · `/sprint:full` bypass without approval caught · serial-when-parallel-safe flagged · non-sprint work without β/operator approval caught.

**Team-lifecycle (source §C2 mode-hook AC), each with proof:** `/mode:sprint` no-team → spawns correct team · `/mode:sprint` wrong-team → kills wrong + spawns right · `/mode:solo` from sprint → kills sprint team · `/mode:adhoc` from sprint → kills sprint + inits adhoc · `/mode:sprint` twice → no duplicate · failed teardown blocks init · failed spawn blocks init · failed verify blocks dispatch · dispatch/tool-use before `mode:init:gate` impossible-or-caught · `/session:end` kills the project-scoped team · resume detects stale team · stale state repaired-or-blocks-with-recovery · hook events logged in order · payloads leak no secrets · planted-violation tests cover all of the above.

**Proof standard (principle 15):** each AC names its proof — a planted fixture that must fail, a real record (run_id + elapsed/bytes), a green/blocked exit code, or a captured event sequence. "Implemented" is never sufficient.

## 12. Enforcement Matrix (every policy → named enforcer)

| Policy | Enforcer | Mechanism | Ramp |
|---|---|---|---|
| Mode reads one source of truth | `mode-lifecycle-registry` validator + manifest regen | validator exits 1 on drift | blocking |
| Correct team up before work | `team-guard.js` generalized (`mode:init:gate`) | PreToolUse block | report→block per mode |
| Mode switch tears down old team | `mode-lifecycle-guard.js` + team lifecycle manager | PreToolUse + SessionEnd hook | report→block |
| Team kills are project-scoped | slug filter in `teams/lifecycle.js` | planted wrong-project fixture | blocking |
| Virtual lifecycle events fire in order | lifecycle-coverage enforcer in `/scan:full` | event-log diff | report→block |
| Dispatch shape correct | `dispatch-contract.js` + `dispatch-shape.js` | resolver + `/scan:full` | report→block (`ENFORCE=block`) |
| No under/over-dispatch | parallelism axis in `dispatch-shape.js` | new `shapeMismatch` finding | report-only first |
| Phase coverage backed by a record | `coverage-gate.js` live caller | run-ledger gate | blocking when wired |
| Turbo within safety profile | `authorization-gate.js` + spend ledger | scope match + ledger | blocking; operator-gated default |
| Provider tier met | `provider-tier-check.js` | exit 0/2 | blocking on selected tier |
| Plans persist + link | `_planning` lifecycle wiring + ship-exclusion | ship-coverage stays green | blocking |
| Epic file validates | `/epic:plan` emits a validate.js-passing file | validate.js 20 checks | blocking |
| Plans carry the 20 AC categories | `/scan:ac-coverage` extension | planted-omission fixture | report→block |
| Planning principles applied | `/scan:planning-principles` (or validate advisory) | doc lint | report-only first |
| **Any policy without an enforcer** | `/enforcement:log` → ED-### | visible at `/enforcement:list` + `/scan:full` | n/a |

## 13. Mode Lifecycle Hook Matrix

**Real (harness PreToolUse):**
| # | Event | Seam | Can block? |
|---|---|---|---|
| R1 | `mode:switch:requested` / `mode:switch:preflight` | PreToolUse `SlashCommand\|Skill` on `/mode:*` | Yes |
| R2 | `mode:init:gate` | PreToolUse `Agent`/`Skill` dispatch (generalized team-guard) | Yes (fail-closed) |
| R3 (partial) | `session:end:team-kill` | `SessionEnd` hook backstop | side-effect (kill), not a deny |

**Virtual (registry + `eventsFile`, modeled on `sprint-hook-points.json`):** `mode:teardown:before · team:persistent:kill:before/:after · mode:state:clear:before · mode:init:before · mode:policy:load · team:persistent:spawn:before/:after · team:persistent:verify · dispatch:matrix:load · sprint:binding:verify · epic:binding:verify · tracker:binding:verify · planning:artifact:verify · provider:readiness:verify · mode:init:after · mode:switch:after · session:end:before/:after · session:resume:stale-team-detect · session:resume:mode-state-reconcile`. Each: `{event, when, mode:block|advisory, payload_fields[]}`.

**Ordering (the central path):** `/mode:<t>` → R1 requested → preflight → teardown:before → kill:before → (slug-scoped kill) → kill:after → state:clear → init:before → policy:load → spawn:before → (spawn) → spawn:after → verify → dispatch:matrix:load → sprint/epic/tracker/planning/provider checks → **R2 init:gate** → persist → init:after → switch:after → ready. **No dispatch/tool-use/sprint/code work between mode-command receipt and passing R2**, except the lifecycle manager's own read-only ops.

**Payload (no secrets):** project/slug · session id · prev/target mode · existing/required team id · branch/worktree · sprint/epic id · tracker path+status · planning artifact path+status · provider tier state · turbo/perms state · actor · timestamp · dry-run flag · correlation id. Constructed in `lifecycle-events.js`; provider/turbo fields carry status labels only, never values.

**Fail-closed (the 15 conditions from source):** existing team can't be killed · old-team not verified-terminated · target mode unresolved · policy unloadable · required team unresolvable · team unspawnable · spawned identity ≠ target · dispatch matrix unloadable · sprint/epic/tracker/planning binding missing · provider readiness unmet · state unpersistable · event logging broken. Each → user-facing message + log event + recovery path + retry-safe? + approval-required? + revert-to-safe-mode?

## 14. Provider Permission Matrix

| Action | Class |
|---|---|
| Detect CLI install / version | Safe automatic check |
| Check auth status / folder trust (read-only files+env) | Safe automatic check |
| Check key NAME exists (value-free) | Safe automatic check |
| Check `.gitignore` covers `.env*` | Safe automatic check |
| Create `.env.example` / update `.gitignore` | Safe automatic scaffold |
| Log readiness state (labels only) | Safe automatic scaffold |
| Write preferred-tier config | Requires user confirmation (one-time choice) |
| Edit `.env` / `.env.local` | Requires user confirmation |
| Install CLIs | Requires user confirmation |
| Open auth pages / accept trust prompts | Requires external user action |
| Add funding / upgrade subscription | Requires external user action |
| Live API connectivity test (spends) | Requires user confirmation (spend-gated) |
| Print/log secret VALUES | **Never allowed** |
| Sign up / purchase / fund on user's behalf | **Never allowed** (CLAUDE.md Autonomy) |

## 15. Testing Strategy

- **Unit/fixture per primitive:** registry resolution, `getMode()` sprint case, gate block/allow, teardown slug-scope, event ordering, dispatch parallelism findings, turbo spend ledger, provider tier verdicts.
- **Keep-green guards:** existing `team-guard-gate.test.js` (32 cases) must stay green through the generalization (golden-snapshot first). validate.js 20/20 must stay green when the epic is wired.
- **Cross-provider review (principle 10):** the three highest-risk units (mode-switch guard, generalized init-gate, mechanical teardown) get a diff-model review (`dispatch-agent.js consult/reviewer`, non-Claude) before flip-to-blocking.
- **Earn-it (principle 6):** no enforcer flips to blocking until its planted-violation fixture proves it fails the violation.

## 16. Fixture and Planted-Violation Strategy

Sealed fixtures under `runtime/agent-system-plan/lifecycle-fixtures/` (walk-skipped). Planted cases (each with an expected failure mode — false-green is unacceptable): active sprint mode + no sprint team · sprint mode + adhoc team · mode says solo + sprint team exists · `/mode:sprint` while old-team kill fails · spawn returns success but wrong id · dispatch before init completes · tracker binding missing post-sprint-init · epic binding missing · provider tier insufficient · resume with stale team handle · duplicate team entries · hook log missing a required event · hook event out of order · payload includes a secret value · wrong-PROJECT team present (must NOT be killed) · safe-parallel work run serially (under-dispatch) · two agents on the same file (over-dispatch).

## 17. Dry-Run / Simulation Plan

Before any flip-to-blocking, simulate (no live mutation): mode-switch sim (each pair, incl. duplicate-call idempotency) · team-lifecycle sim (spawn/verify/kill/teardown/orphan/resume, on a **throwaway slug**) · lifecycle-hook ordering sim · sprint-init sim · provider-readiness sim (each tier, value-free) · tracker/planning-linkage sim · rollback sim (disable each enforcer, confirm clean fail-open). A canary interactive session runs each guard in report-only and inspects `eventsFile` before the ramp.

## 18. Tracker and `_planning` Persistence Plan

- **This plan:** `_planning/warpos-lifecycle-plan.md` (durable). Principles: `_planning/principle.md`.
- **Epic file:** `trackers/epics/E-LIFECYCLE-001-mode-lifecycle-enforcement.md` (created from `EPIC_TEMPLATE.md`, state Planned).
- **ROADMAP:** a `#### E-LIFECYCLE-001 — …` entry under `### Planned epics` (satisfies validate check **n**), linking the epic file.
- **TRACKER:** a Planned-epic entry consistent with the epic file's `Current state: Planned` (satisfies cross-file checks d/e/r). The TRACKER header's "NEXT epic" pointer already names this work.
- **SoT relationship:** `TRACKER.md` is authority; `ROADMAP.md § Epics` is the epic registry; `trackers/epics/<id>.md` is the per-epic detail; `_planning/<id>.md` (and future `_planning/epics/`) is the durable *plan artifact* an epic links to. Per-sprint plans land in `_planning/sprints/` once S-LC-08 wires it.
- **Reconciliation:** S-LC-01 fixes the DEFAULT-ON drift in TRACKER + E-SYSTEM-ORG-001 (a logged Change Log entry, not a silent edit).

## 19. Migration and Backward Compatibility

- **Additive-first:** every new registry/hook/enforcer ships report-only behind a flag/marker, then ramps. The current working sprint gate is golden-snapshotted before generalization and kept reachable behind a flag for one release.
- **`getMode()` sprint fix:** audit all callers first (some may rely on sprint→solo fallthrough); change is one line but behavior-affecting.
- **`_planning` restructure is additive** (new subdirs; existing dirs untouched; ship-exclusion preserved).
- **Turbo default change is opt-in** until operator sign-off (§22); the existing scopes keep working.
- **No backward-incompatible mode behavior** ships without an operator approval point (§22).

## 20. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Fail-closed bug bricks mode entry / dispatch | Global fail-OPEN posture + kill-switch env + bootstrap allow-list + canary report-only + dry-run sim |
| Mechanical teardown kills the wrong/another-project team | **Project-slug scope on every kill** + verify-terminated + planted wrong-project fixture + `--keep-teams` default one release |
| Registry generalization regresses the working sprint gate | Golden-snapshot + keep `team-guard-gate.test.js` green + per-mode ramp |
| Turbo push grant enables an unsafe push | Operator-gated default + hard ceilings never bypassed + spend/authorization ledger |
| "25 hooks" overreach (harness can't fire them) | Reframed to 2 real + virtual registry (already grounded) |
| `_planning` restructure trips ship-coverage | Keep MUST_NOT_SHIP; additive subdirs; ship-coverage stays green |
| Provider funding/subscription not detectable | Self-attestation default + optional opt-in probe (§22); never block on an undetectable signal |
| Scope sprawl (12 sprints) | Wave gating; provider readiness can fast-follow as its own epic |
| Policy without enforcer (the recurring class) | §12 matrix + `/enforcement:log` at write-time |

## 21. Rollback and Recovery Plan

Per enforcer: remove the settings.json hook line (guards), set the kill-switch env/marker (`WARPOS_DISABLE_TEAM_GATE` / `.team-gate-off`), or revert the registry to the prior hardcoded path (kept one release). The team lifecycle manager defaults to `--keep-teams` for one release so a teardown bug never orphans live work. Every ramp is report-only → blocking, so rollback = drop back to report-only. State is durable (`mode.json`, readiness record), so a crashed mid-switch reconciles on resume.

## 22. Human Approval Points

1. **Epic ID + title** (`E-LIFECYCLE-001`, this title) — naming is a taste/semi-irreversible call. *Recommend approve.*
2. **Turbo auto-push/merge + spend default** — **RESOLVED 2026-06-08 (operator: "highest autonomy possible"; β-escalated Class C).** Turbo auto-grants spend (default $100, operator-raisable; this session $1000) + commit + push + merge-to-main + branch ops, within the never-allowed hard ceilings. Delivered via a durable operator-declared `permissions.allow` profile (the classifier blocks a broad self-grant — `feedback_turbo_broad_scope_denied`), not a self-grant. This deliberately overrides the standing CLAUDE.md "Push = Ask first" default for turbo sessions. (Residual sub-call left to execution: the exact framework-default spend ceiling value — $100 baseline recommended.)
3. **Provider funding/subscription detection method** — **β-DECIDE 2026-06-08 (conf 0.84): (a) self-attestation as the default + (b) an optional opt-in billing-API probe; reject (c) infer-from-dispatch as default** (silently wrong on quota-exhaustion — succeeds once, fails under load). Operator-confirmable. Still open (source's own Q): T3 `Max 5x` vs a lower hobbyist Claude sub.
4. **Backward-incompatible mode behavior** — any mode whose *disallowed work* list would block something currently allowed (e.g. solo retool) needs sign-off before its gate flips to blocking.
5. **`epic:` public command names** — the 10-command suite names (`/epic:plan` … `/epic:repair`).
6. **Playbook direction** — reference-procedures (recommended) vs executable-protocols (`/playbook:run`).

## 23. Open Questions

1. Does PreToolUse `decision:"approve"` short-circuit later hooks vs all? (affects authorization-gate ordering + guard composition.)
2. Is a PreToolUse-on-`Skill` hook a reliable `/mode:*` interceptor for every invocation path (tool vs handoff-text)? Capture a live payload.
3. Is any value-free provider funding/entitlement probe available, or is self-attestation the only non-spend option?
4. Does `/roadmap:add` auto-create the epic tracker file, or is that manual?
5. Project identity for team scope: slug from cwd vs manifest vs team-name prefix — which is canonical across UUID team dirs?
6. Where exactly does `sprint:binding:verify` slot into `full.js` / `epsilon-runtime.js`?
7. Should provider readiness become its own epic (`E-PROVIDER-TIER-001`) now, or stay Wave 4?

## 24. Recommended Artifact Paths

- Plan: `_planning/warpos-lifecycle-plan.md` ✅ (this file)
- Principles: `_planning/principle.md` ✅
- Epic tracker: `trackers/epics/E-LIFECYCLE-001-mode-lifecycle-enforcement.md`
- Keystone registries: `.claude/agents/_org/mode-lifecycle.json`, `.claude/agents/_org/mode-lifecycle-hooks.json`
- New libs/hooks: `scripts/hooks/lib/lifecycle-events.js`, `scripts/hooks/mode-lifecycle-guard.js`, `scripts/teams/lifecycle.js`, `scripts/warpos/provider-tier-check.js`
- New skills: `.claude/commands/epic/{plan,fold,…}.md`
- Fixtures: `runtime/agent-system-plan/lifecycle-fixtures/`
- Phase-0 evidence: `runtime/agent-system-plan/lifecycle-phase0/0{1..6}-*.md`
- Future planning subdirs: `_planning/{epics,sprints,playbooks,decisions,research,archive}/`

## 25. Definition of Done

`E-LIFECYCLE-001` is Complete when, with proof for each: the Mode-Lifecycle Registry is the sole source of truth (all readers resolve from it; validator green; drift reconciled) · the `mode:init:gate` blocks work until init passes, for every mode, fail-closed, idempotent (planted fixtures caught) · mode switch + `/session:end` mechanically + project-scopedly tear down teams (wrong-project team survives a planted kill) · the lifecycle-event registry fires in order with no secret leakage (coverage enforcer green) · the dispatch parallelism axis flags under/over-dispatch + coverage-gate has a live caller · turbo enforces its spend ceiling + safety profile (operator-approved default) · provider tier readiness checks the selected tier (planted under-tier blocks) · `_planning` is a tracker-linked lifecycle store + `/epic:plan` emits validate-passing epics + `/epic:fold` folds with provenance · every epic/sprint plan carries the 20 AC categories (planted omission caught) · planning principles live in canonical homes with an enforcer · validate.js stays 20/20 + `/scan:full` blocking gates green · all §22 approval points resolved.

## 26. Implementation-Phase Preflight Checklist

Before Wave 0: confirm authorization for the session (commits/pushes/merges) · re-verify green baseline (`validate.js` 20/20 + `/scan:full`) · resolve §23 Q1/Q2/Q5 via live dry-run (capture a `/mode:*` PreToolUse payload; confirm `decision:"approve"` short-circuit semantics; pick the project-slug source) · audit all `getMode()` callers · golden-snapshot the current sprint gate behavior · confirm `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` · stand up the persistent team (the system's procedure) · `/sprint:plan` to mint S-LC-01 · obtain §22 operator decisions for any wave that needs them (W1 mode-behavior, W2 turbo) before those flips-to-blocking. **No flip-to-blocking before its planted-violation fixture is green.**

---

_End of plan. Authored 2026-06-08 by Alex α (adhoc) with a β consult and 6 parallel Phase-0 investigators. Execution is a separate, approval-gated session set — this document is the durable, reviewable plan the source prompt asked for._
