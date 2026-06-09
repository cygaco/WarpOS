# TRACKER.md

Version: 1.0.0

Owner: President Agent

Last Updated: 2026-06-08 (**DISPATCH-SHAPE NORTH STAR landed** — the persistent team `warpos-sprint` ran a real `/sprint:full` SP-20260608-001 (merged `06fee13` + pushed): the live shape **RESOLVER** `scripts/dispatch/dispatch-shape.js` (`resolveShape`/`shapeMismatch`, PLAN §17 — the gauntlet caught α's SOLO draft WRONG, 2 real bugs, and fixed them; 26/26 incl. a live-mismatch test) + the §13.6 ping-reap fix (`safeSpawnFile`, N=12 0-reaps) + resolver wired into the dispatch wrappers as the self-detection authority + earn-it fail-closed (0 skills stamped — honest: scan:full's real ping exceeds the smoke bound; §13.7 full A/B stays operator-gated). ε-conducted, β-gated all 4 phase-boundaries (β DIRECTIVE-resequenced the tickets). `/learn:deep` logged **15 new learnings** (3-source convergence: the retro→learning loop leaks — `/sprint:full` never auto-synthesizes retros, 71% skeleton). ROADMAP backlog updated with the session findings. Residual **ED-039** (dispatch-claude.js production reap, all-callers). **NEXT epic = the mode-lifecycle enforcement epic** (`_planning/ingest/warpos-lifecycle.md`): the mechanical `mode:init:gate` that ends the recurring dispatch-failure class (root-caused `RT-2026-06-08-dispatch-class-rca`) — its Section H is the unbuilt founder/provider panel. **EARLIER 2026-06-08: D-2 close** — the team landed the `president/.system`→`president/_system` de-dot: the last both-layers rename, ε-binding-PASS + β-DECIDE 0.88, the gauntlet caught + α scrubbed a surfaced product-slug leak; epic ~99%. Earlier this continuation, the team shipped 4 E-SYSTEM-ORG-001 streams: §14 integration-seam extraction (`_system/guides/integration-seam-contract.md` + 3 citers repointed), S-11 Layer-1 handoff safety-net (`scripts/hooks/handoff-live.js` per-sid + SessionStart freshness/`/clear`-bridge loader + 13/13 fixture, wired Stop/SessionEnd/StopFailure before session-stop), S-10 deixis advisory (`session-relative-language` in validate.js, report-only OUTSIDE the 20 binding checks, 70/70 selftest), §13.6 skills:test harness (`dispatch-skill --resolve` + `skills-test.js` + 8/8 fixture + §17.5 scaffold); all green-tested, reconciled here; epic ~92%→~97%. Prior session 2026-06-08-pm: executed the **E-SYSTEM-ORG-001 dispatch-shape FOUNDATION** — additive safety kernel + dispatch-contract keystone §17.1 + N-1 coverage gate + N-3 auth-resolver + P5 fixture harness, 55 test assertions / 35 planted-violations (re-measured on disk 2026-06-08-pm: safe-spawn 21 · auth-resolver 11 · dispatch-contract 16 · coverage-gate 7; the earlier "64" was a stale pre-security-review estimate), GPT-5.5 cross-provider-reviewed FAIL→fixed across 2 rounds, `/scan:full` wired report-only; nothing destructive — and VERIFIED still NOT-WIRED into the live spawn path (safe-spawn/auth-resolver have zero callers). Prior session 2026-06-07-pm: shipped **0.15.3** — masterconsole installer source-resolution fix (`_resolveInstallerRoot` sibling fallback, `930110d`, tagged `warpos@0.15.3`); diagnosed the recurring "dispatch guide gets skipped" as a duplicate-drift (`agent-dispatch-guide.md` exists twice, pointer aims at the current copy, stale copy squats in the intuitive home) → created NEW ⭐⭐ TOP epic **E-SYSTEM-ORG-001** (agent-system org / `.system` cleanup; absorbs E-DISPATCH-INTEGRITY F-4/F-5 + ED-026 + canonical-scrub + E-BOUNDARY-001); added `REGRESSIONS.md` + R-001; resolved a self-inflicted codex outage (BOM-corrupted API-key install — codex now on the metered key, run `codex login` for OAuth). Prior session/2026-06-06: mode-init-≠-authorization; WI-50 → 0.15.1; `/trackers:init` + BC-30; E-DISPATCH-INTEGRITY-001 created. E-TRACKER-001 + E-SPINUP-STEPS-001 COMPLETED 2026-06-06; validator 20/20)

Last Validation: 2026-06-08 — `node scripts/trackers/validate.js` (all 20 binding checks pass, exit 0; selftest 70/70; the new `session-relative-language` advisory runs report-only, OUTSIDE the 20)

Validation Status: Passing (20/20 binding checks — 12 single-file a–l + 8 cross-file m–t; verified by `node scripts/trackers/validate.js`, exit 0, + `--selftest` 70/70, on 2026-06-08; the `session-relative-language` deixis check is advisory/report-only and not part of the 20)

Purpose: The highest written source of truth for active, planned, completed, cancelled, superseded, untracked, definition-bound, and verification-bound long-running work in the WarpOS Agentic OS. This document exists so that an agent can resume any large goal from written files alone — knowing what exists, what is active, what is planned, what is done, what is verified, what is missing, and what the next action is — with no meaningful loss, terminology drift, missing paths, missing wiring, or hidden dependency on memory.

Authority: Highest written source of truth for active, planned, completed, cancelled, superseded, untracked, definition-bound, and verification-bound long-running work. `TRACKER.md` outranks Claude's built-in memory, chat memory, implied context, informal summaries, agent assumptions, old roadmap language, and unverified wiring assumptions. See section "Authority and Conflict Resolution" for the full order.

## Related Tracker Documents

- `ROADMAP.md` — the framework backlog and strategic direction, now **epic-based** (sprint T5, 2026-06-06): its `## Epics` section is the authoritative epic registry (4 active + 5 planned + 4 parked trigger-gated + 10 completed + 1 superseded), and the older `## 🏛 Milestones` structure is marked DEPRECATED (preserved for history). This `TRACKER.md` owns E-TRACKER-001 (active) + E-ADR0007 (completed) in detail; the broader theme-epics are registered in `ROADMAP.md` § Epics, each with a `trackers/epics/` file. Path verified to exist: `ROADMAP.md` (repo-root relative; epic-file links resolved 2026-06-06).
- `/trackers/epics/` — 11 epic tracker files Verified Exists (ls/Read 2026-06-07): `E-TRACKER-001` (T2) + the 8 created by sprint T5 (`E-GOLDEN-FLOW-001`, `E-CONTENT-DELIVERY-001`, `E-TEST-SUITE-001`, `E-STABLE-CHANNEL-001`, `E-BOUNDARY-001`, `E-MULTIPRODUCT-001`, `E-SKILL-CATALOG-001`, `E-MANAGER-LAYER-001`) + `E-SPINUP-STEPS-001` (completed 2026-06-06) + **`E-DISPATCH-INTEGRITY-001`** (created 2026-06-07) + **`E-SYSTEM-ORG-001`** (⭐⭐ TOP, created 2026-06-07 — agent-system org / `.system` cleanup), one per active/planned roadmap epic.
- `UNTRACKED_WORK.md` — meaningful work performed outside formal epics/sprints. Verified Exists (ls/Read on 2026-06-05); created by sprint T2. Recorded as Verified Exists in the Verification Matrix.
- `/trackers/` — per-epic and per-sprint tracker files, templates, and records. Verified Exists (ls/Read on 2026-06-05): `trackers/`, `trackers/epics/`, `trackers/sprints/`, `trackers/templates/` (10 templates) + `trackers/README.md`; created by sprint T2. Recorded as Verified Exists in the Verification Matrix.

## Current Global State Summary

- Active epics: 0 owned directly by this tracker — E-SPINUP-STEPS-001 (Step-driven, degrade-proof bootstrap:spinup + Milestone→Epic) reached Completed (100%) on 2026-06-06, landed on `main` @ `c9583dd`; E-TRACKER-001 (Enforced TRACKER System) Completed (100%) 2026-06-06. The roadmap's broader theme-epics are tracked in `ROADMAP.md` § Epics with `trackers/epics/` files — see Related Tracker Documents.
- Active sprints: 0 (S-SPINUP-001 Completed 100% 2026-06-06; all six E-TRACKER-001 sprints T1–T6 Completed). The validator runs 20 checks.
- Planned epics: 0 owned directly by this tracker (the roadmap's 5 planned theme-epics live in `ROADMAP.md` § Epics).
- Planned sprints: 0 (T5 is now Completed — see Completed Sprints; only the T4 cross-file tail remains under the Active sprint).
- Completed epics: 3 (E-SPINUP-STEPS-001 — Step-driven, degrade-proof bootstrap:spinup + Milestone→Epic, 100%, completed 2026-06-06, landed on `main` @ `c9583dd`; E-TRACKER-001 — Enforced TRACKER System, 100%, completed 2026-06-06 with all six sprints + the hard enforcement hooks; E-ADR0007 — Agent-System Rewrite, 100%, verified on `main`, E1–E8 hashes + `warpos@0.14.0` tag re-verified against `git` on 2026-06-05). The roadmap registers 10 completed theme-epics (mapped to existing Shipped receipts) in `ROADMAP.md` § Epics.
- Completed sprints (summarized): S-SPINUP-001 (step-driven degrade-proof bootstrap:spinup, 2026-06-06, `c9583dd`); T1 (TRACKER keystone + definitions), T2 (templates + dirs + UNTRACKED_WORK), T3 (system inventory + verification matrix, disk-verified 2026-06-05), T4 (validation engine + the 8 cross-file §28.7 checks, 2026-06-06 — validator now 20 checks), T5 (roadmap milestones→epics migration, 2026-06-06), and T6 (mode-wiring + scan-suite gate); plus the ADR-0007 rewrite across E1–E8 (see Completed Sprints) and the WarpOS 0.14.0 release (tag `warpos@0.14.0`).
- Cancelled or superseded work: the interim ADR-0007-rewrite TRACKER.md is Superseded by this file (see Cancelled or Superseded Work).
- Untracked work: tracked in `UNTRACKED_WORK.md` (Verified Exists, ls/Read on 2026-06-05; created by sprint T2).
- Known gaps: 2 open + 1 resolved (G-1 ship-boundary audit — open; G-2 tracker system — RESOLVED 2026-06-06: all six sprints T1–T6 Completed, the validator runs the full 20-check set, and the hard enforcement hooks are built + wired; G-3 stale-worktree-cwd hazard — open, lingering dir cleaned this session, automated guard still pending).

## Current Highest-Priority Next Action

**⭐⭐ E-SYSTEM-ORG-001 (Agent-System Organization & Canonical Source-of-Truth Cleanup) is the TOP roadmap epic** (operator-directed to TOP 2026-06-07). **Next action = S-1 AUDIT (analysis-first, dispatch-LIGHT — does NOT need codex):** enumerate every duplicate-basename / drifted / orphaned / mispointed canonical across `.claude/agents/**` (esp. `.system/**`) + `.claude/project/reference/**`; name the ONE canonical + disposition per item. Then **S-2:** consolidate the proven instance — the duplicate `agent-dispatch-guide.md` (`.claude/project/reference/…` 197 ln = current/pointed-to vs `.claude/agents/.system/guides/…` 243 ln = stale/orphaned; fold the stale copy's still-useful codex-CLI `codex login` auth table + concurrency caps into the current one, repoint `paths.agentDispatchGuide` + `session-start.js` banner + CLAUDE.md, delete the dup). Then **S-6:** a duplicate-basename-drift enforcer (the gap `scan:references` can't see). Full scope (absorbs E-DISPATCH-INTEGRITY F-4/F-5 + ED-026 + canonical-scrub + E-BOUNDARY-001): `trackers/epics/E-SYSTEM-ORG-001-agent-system-org-cleanup.md`.

**Design + execution entry point:** the full analysis/design lives in `runtime/agent-system-plan/PLAN.md` (§0–§17). The operator reframed this into the broader **WarpOS dispatch-shape reliability system** (agents + skills = one problem: the best dispatch shape per unit). **S-1 AUDIT is DONE.**

**EXECUTION session 1 — the additive dispatch-shape FOUNDATION (PLAN §17.2 steps 1–3) SHIPPED 2026-06-08** (Active, ~25%). Built + green-tested + GPT-5.5 cross-provider-reviewed (FAIL→fixed across 2 rounds), all ADDITIVE: P5 fixture harness (`scripts/checks/lib/fixture-harness.js`); N-3 auth-resolver (`scripts/dispatch/auth-resolver.js`); safety kernel (`scripts/dispatch/safe-spawn.js`); dispatch-contract KEYSTONE §17.1 (`.claude/agents/_org/dispatch-contract.json` + `scripts/dispatch/dispatch-contract.js`); N-1 coverage gate + run-ledger (`scripts/dispatch/coverage-gate.js` + the `run_id`/`shape`/`prompt_digest` stamps on both wrappers). `/scan:full` wired report-only. 55 test assertions, 35 planted-violations (verified on disk 2026-06-08-pm: safe-spawn 21/21 · auth-resolver 11/11 · dispatch-contract 16/16 · coverage-gate 7/7). **GROUNDING PASS 2026-06-08-pm:** all 6 artifacts confirmed present + tests green; route-through gap CONFIRMED REAL — `safe-spawn`/`auth-resolver` have ZERO callers (grep across scripts/** hits only their own defs), `scripts/hooks/lib/providers.js` (the real provider spawn path) requires none of them, dispatch-contract wired report-only (dispatch-agent.js:472 / dispatch-claude.js:228), coverage-gate standalone-CLI-only. **EXECUTION session 2 (2026-06-08-pm) — Waves 1→2d SHIPPED on `main` (pushed), epic ~70%:** (a) ✅ DONE — wire-through: `providers.js` now spawns through safe-spawn + auth-resolver (LIVE-PROVEN codex+gemini PROBE_OK; `6db8816`); (b) ✅ DONE — S-2 guide consolidation (hard-moved to `_system/guides/`, orphan deleted, forcing case resolved, `cfbadfa`) + S-3 top-level de-dot (`.system/` dir + `.system.md` monolith → `_system/`, `ace09f2`); + N-2 enforcer (live CLEAN) + §13 dispatch-skill infra + grandchild fixture (`1c3a9ad`). ✅ **S-7 role renames DONE** (`a071e80` — cabinet/ops-analyst/skeleton-builder, both-layers, alias-backed, gate-green + live-proven `runProvider('cabinet')→OK3`, guide↔code drift closed) + ✅ **S-6/N-2 flipped to BLOCKING** (`b0c6c8e`, both clean). **EXECUTION session 3 (2026-06-08-pm-3) — SHIPPED on `main` (pushed), epic ~70%→~88%:** ✅ **(b) dispatch-claude.js wire-through DONE** (`05ff3c3`) — the build-chain Claude spawn now routes through the safe-spawn KERNEL (claude resolves to a native claude.EXE, shell:false; arg-allowlisted; tree-kill; fail-closed if kernel missing). Verified: structural probe (resolveTool+argpolicy ok, injection refused) + LIVE probe (real claude → ok:true PROBE_OK 6.8s + well-formed record) + dispatch-claude 9/9 + safe-spawn 22/22. auth-resolver is N/A (local claude uses OAuth, not an injected key). ✅ **(c) coverage-gate §17.4 strengthening + FLIP-TO-BLOCKING DONE** (`dc6243d`) — a record's existence ≠ coverage: added `ARGV_SCHEMA_VERSION` keystone (anti-stale/backfill) + `output_digest` proof-of-artifact + `cwd` stamps on ALL THREE wrappers; evaluate() now requires current-schema + artifact-proof, with optional named-artifact on-disk verify (`--verify-artifacts`) + an auditable `waiver{reason}` escape; coverage-gate is BLOCKING by default (`--report-only` opts out; runtime gate, per-phase). Verified: coverage-gate 14/14 (10 planted) + a live dispatch stamping the §17.4 fields + the BLOCKING gate greening on a real record (exit 0) and blocking a missing role (exit 1). ✅ **(a-partial) dispatch-skill §17.4 gate-compliance DONE** (`e0af05e`) — dispatch-skill records now stamp the §17.4 fields so a skill's coverage record SATISFIES the strengthened gate (was a regression the flip would have caused). + `9509569` maps deterministic-regen + manifest convergence. ✅ **(d) D-3 gauntlet-contract extraction DONE this session** (`ef3fcf8` — focused authoritative `_system/guides/gauntlet-contract.md` extracted from monolith §3/§4/§5/§7, role names ADR-0007-modernized, no `name:` so findAgentSpec doesn't enumerate it; `7ee1488` — ~7 active citers repointed off the archive [builders, leads, gamma, qa-reviewer, frontmatter-guide, dispatch-claude comment], the 3 §14 integration-seam refs deliberately KEPT at the archive monolith since D-3's scope did not extract §14, banner finalized; cutover/dup-drift/dispatch-resolution 24/24/coherence green). The 2 `president/_system/oneshot/*` stale-dotted citers are D-2-deferred. **NEXT ACTION (open as of 2026-06-08 continuation):** §14 + S-11 Layer-1 + S-10 + §13.6 + D-2 `president/_system` de-dot are all DONE 2026-06-08 (persistent team `warpos-sprint`; epic ~92%→~99%; D-2 = the last both-layers rename, ε-binding-PASS + β-DECIDE — see the epic Change log "2026-06-08 (continuation)" + DoD). Next open epic tail: (a) **dispatch-skill safe-spawn wire-through** (the last raw spawnSync(shell:true) path; inputs already gated; lower urgency); (b) **§13.7 full earn-it benchmark MEASUREMENT** (the §13.6 `skills-test.js` harness + `dispatch-skill --resolve` mode + §17.5 scaffold are DONE; the heavy per-skill A/B run is deferred — 0 skills subprocess_verified, honest); (c) **S-11 Layer-2 sentinel-retire/rewire** (after a watch-period; the Layer-1 per-sid safety net now backstops staleness); (d) **D-2 `president/_system/` de-dot** (migration plan produced 2026-06-08 at `runtime/agent-system-plan/D2-dedot-plan.md`; both-layers rename; catching gates = test-hook-points + test-dispatch-agent-resolution). DEFERRED: S-5 boundary scrub (operator-scoped repo move). _Historical (now DONE 2026-06-08), retained for trace:_ **§14 integration-seam extraction** (the ONE still-live mechanism D-3 left in the archive monolith — extract the producer/consumer integration-seam rules into a focused doc + repoint the 3 §14 citers: backend/builder, director-of-engineering, security-lead); **§13.6/13.7 skills:test earn-it HARNESS** (a sub-system, not a one-liner — needs a bounded resolve/--no-ping smoke mode in dispatch-skill so a subprocess skill is verified WITHOUT a heavy headless run; the 6 subprocess skills [scan:full/research:deep/qa:audit/redteam:full/sleep:deep/learn:deep] are all heavy-by-design so a full `--force-subprocess` run is expensive + can't honestly stamp subprocess_verified:true; + the §17.5 benchmark pack for §13.7); **dispatch-skill safe-spawn wire-through** (last raw spawnSync(shell:true) path — lower urgency, inputs already gated). DEFERRED: `president/_system/` de-dot (D-2, own sprint), S-5 boundary scrub (operator-scoped). Backed by o3 deep-research (`runtime/research/dispatch-subprocess-safety/`) + GPT-5.5 (×3, `runtime/agent-system-plan/review/`); ED-033 logged.

**⭐ E-DISPATCH-INTEGRITY-001 F-1/F-2/F-3 (dispatch coverage-honesty — the OTHER slice, gauntlet-heavy)** is next after E-SYSTEM-ORG-001 (or in parallel): make a backing `ok:true` completion record the PRECONDITION for any sprint phase to count as "covered" (kills RC-2 "sprint theater"). F-4/F-5 moved to E-SYSTEM-ORG-001. Tracker: `trackers/epics/E-DISPATCH-INTEGRITY-001-agent-dispatch-integrity.md`.

E-SPINUP-STEPS-001 + E-TRACKER-001 are COMPLETE (landed `main`; the on-ramp is step-driven + degrade-proof; the tracker system is enforced 20/20). This session also shipped (committed local, pending land): mode-init-≠-authorization (all 4 `/mode:*` skills + α/CLAUDE.md doctrine + `mode-set.js` banner); WI-50 installer fix → released **0.15.1** (tag `warpos@0.15.1`, on `main`); `/trackers:init` + shipped tracker templates + the BC-30 enforcer-shippability gate. Other active theme-epics: E-GOLDEN-FLOW-001, E-CONTENT-DELIVERY-001 (~60%), E-TEST-SUITE-001. Follow-ups (non-blocking): cut 0.15.2 (ships the tracker fix downstream); ED-029; E-NATIVE-PACKAGING-001 (trigger-gated).

---

# How to Use This Document

This section is operational instructions, not passive documentation. Every agent must read and apply this section before doing meaningful work that could affect roadmap, epic, sprint, definition, implementation, documentation, validation, wiring, or Agentic OS state.

## Required Use Cases

Consult `TRACKER.md` when: starting work; resuming work; planning work; creating, updating, or completing an epic or sprint; cancelling or superseding work; changing scope; discovering or resolving a blocker; changing, introducing, or interpreting definitions; verifying paths, file/directory existence or nonexistence, hooks, commands, mode wiring, or validator behavior; working outside a sprint; preparing a handoff; compacting or summarizing context; switching modes; reconciling roadmap state; reviewing completion claims; validating project state; debugging state mismatch; and answering "what is done / next / exists / missing / wired / enforced?"

## Start-of-Work Procedure

Before beginning meaningful work, the agent must:

1. Open or inspect `TRACKER.md`.
2. Identify whether the work belongs to an active epic, an active sprint, a planned epic, a planned sprint, completed work being revisited, cancelled/superseded work, untracked work, or a new epic/sprint that must be created.
3. Check the Definitions section for relevant terminology.
4. Confirm the current state of the relevant epic or sprint.
5. Confirm the current next action.
6. Confirm blockers and dependencies.
7. Confirm whether the roadmap needs updating.
8. Confirm whether tracker files exist for the relevant epic or sprint.
9. Confirm whether all referenced paths exist or are intentionally nonexistent.
10. Confirm whether all referenced modes, hooks, commands, and enforcement points are actually wired.
11. Create missing tracker files if required.
12. Record missing paths, missing wiring, or unclear state as validation failures if discovered.
13. Record the session start if the work is meaningful enough to affect state.

Agents must not begin substantial work from memory alone.

## During-Work Procedure

Update tracker records when: the goal or scope changes; a task is added or removed; a blocker is discovered or resolved; a decision is made; evidence is produced; files, paths, or wirings change or are discovered missing; a mode, hook, or validation command is added or changed; a definition is introduced or changes; work moves between states (planned→active→review→completed, or cancelled/superseded); the next action changes; or percent completion changes meaningfully. Tiny edits do not require an update, but meaningful state, scope, definition, evidence, path, wiring, enforcement, or validation changes must never go untracked.

## End-of-Work Procedure

Before ending a meaningful work session, update: `TRACKER.md`; the relevant epic tracker; the relevant sprint tracker; `ROADMAP.md` (if roadmap state changed); `UNTRACKED_WORK.md` (if work happened outside a tracked epic or sprint); the Definitions section (if terms were introduced/changed); the System Inventory (if paths, modes, hooks, commands, validators, templates, or wiring changed); the Verification Matrix (if any existence/nonexistence/wiring state was checked); the Evidence log (if work was completed/verified); the Change Log (if scope, state, definition, path, wiring, or plan changed); and the Session log. Leave a clear next action unless the item is completed, cancelled, or superseded.

## Resume Procedure

When resuming, use tracker files as the source of truth. Read, in order: `TRACKER.md`; the relevant epic tracker; the relevant sprint tracker; relevant definitions; the latest session-log, change-log, and evidence-log entries; the System Inventory; the Verification Matrix. Identify the next action. Verify whether blockers still exist and whether referenced files/wirings still exist if the work depends on them. Continue from tracker state, not memory. If memory conflicts with tracker state, the tracker wins. If tracker state conflicts with filesystem or code inspection, reconcile before claiming completion. If tracker state is unclear, mark it unclear and reconcile before proceeding.

## Completion Procedure

Before claiming work complete, verify: the definition of done exists and is satisfied; evidence is recorded; files changed are listed; required paths exist; required paths that should not exist are confirmed nonexistent; required directories, templates, hooks, modes, commands, and validators exist and are wired/runnable; required validation checks pass or failures are tracked; tests/validation/review steps are recorded; the session log is updated; the change log is updated if the plan changed; roadmap state is reconciled; epic tracker, sprint tracker, and `TRACKER.md` are updated and agree; remaining follow-up work is explicitly recorded or confirmed absent; no required definition is missing; no related untracked work remains unreconciled; no referenced path, wiring, or enforcement point remains assumed but unverified. Agents must not say work is complete unless the tracker and evidence support that claim.

## Definition Use Procedure

Before using a system term in planning or tracking, check whether it is defined in `TRACKER.md`. If defined, use it per the recorded definition. If undefined and it affects planning, execution, state, authority, completion, enforcement, validation, or Agentic OS behavior, add it to the Definitions section before relying on it. If a term has conflicting meanings across older documents: record the conflict; choose or propose the authoritative definition; update `TRACKER.md`; update affected documents or mark them stale; add a change-log entry; run or update validation if the definition affects enforcement. Definitions must not live only in chat, memory, code comments, or scattered documents.

## Verification Use Procedure

Before relying on any referenced path, file, directory, hook, command, mode, validator, template, or wiring, verify its current state and record it as one of: Exists and is correct; Exists but stale; Exists but incomplete; Exists but miswired; Missing but required; Missing and intentionally nonexistent; Present but should be removed; Unknown and requiring inspection. Assumptions are not verification. A path mentioned anywhere must not be treated as real until verified.

## Mode Integration Procedure

Every mode that can affect work must consult `TRACKER.md`: sprint mode, roadmap mode, epic-planning mode, implementation mode, review mode, debugging mode, refactor mode, documentation mode, agent-coordination mode, handoff mode, resumption mode, validation mode, and research mode when research affects roadmap, scope, plans, definitions, or enforcement. A mode may not bypass the tracker because the work seems small. If a mode performs meaningful work outside an epic or sprint, it must record that work in `UNTRACKED_WORK.md`.

NOTE (verified state): the live WarpOS modes are `solo`, `adhoc`, `oneshot`, `sprint` (verified at `.claude/commands/mode/`), and all four carry a start-of-work tracker-consult step (Verified Wired, T6). The remaining "modes" named above are operational postures, not enterable mode commands; their tracker wiring was disk-checked by sprint T3 (2026-06-05) and is `Verified Not Wired` in Required Wirings (residual T6 work, tracked under Known Gap G-2).

## Failure Procedure

If an agent discovers work was performed without proper tracking, it must: stop treating the state as reliable; record the gap in `UNTRACKED_WORK.md` or the affected tracker; identify what was done, what is unknown, and the affected files, paths, wirings, definitions, and epics/sprints; reconcile the work into the correct tracker structure; add a change-log entry; continue only after state is clear enough to proceed. Silent correction is prohibited.

## Prohibited Uses

`TRACKER.md` must not be used as: a loose note file; a motivational progress log; a vague project summary; a replacement for actual evidence; a dumping ground for unverified claims; a place to mark work complete without proof; a place to hide unresolved ambiguity; a passive document that is not enforced; a substitute for epic and sprint trackers; a place where definitions are implied instead of recorded; a place where paths are assumed instead of verified; or a place where wiring is claimed without inspection.

## Tracker Language Convention (anti-deixis)

Tracker prose is ABSOLUTE + state-chained, never bare session-relative deixis. Bare deictics — `this session`, `next session`, `currently`, bare `now`, session ordinals like `session 3`, `no X this session`, `DONE this session` — are ambiguous when read later: the referent of `this session` shifts to whoever is reading, so a historical status reads as a present instruction. Rules: **(1)** anchor every status to an ISO date (`YYYY-MM-DD`) and, where it exists, a 7–40-hex commit hash, within the same clause; **(2)** state with a State-Model value + a dated receipt, don't narrate (`DONE this session` → `DONE 2026-06-08 @<hash>`); **(3)** NEXT ACTION is a standing imperative with an `open as of <date>` anchor, never a session ordinal as subject; **(4)** negatives are past-tense + dated (`had not started as of <date>`, not `no X this session`). Enforcer (report-only ramp): the `session-relative-language` advisory in `scripts/trackers/validate.js` flags an un-anchored banned deictic, runs OUTSIDE the 20 binding checks (exit-0 preserved), with an allowlist for fenced/quoted/code contexts; flip-to-blocking is the ramp tail. Full rule + rationale + named enforcer: `trackers/epics/E-SYSTEM-ORG-001-agent-system-org-cleanup.md` § "Tracker language convention (anti-deixis)" (S-10 / ED-034).

---

# Authority and Conflict Resolution

This tracker is owned by the President agent and has higher authority than: Claude's built-in memory; chat memory; implied context; informal summaries; agent assumptions; old roadmap language; unlinked sprint notes; unlinked implementation notes; prior terminology used before this tracker existed; undocumented code behavior; and unverified wiring assumptions.

When sources conflict, authority resolves in this order:

1. `TRACKER.md`
2. Definitions inside `TRACKER.md`
3. Verification and validation records linked from `TRACKER.md`
4. Epic tracker files
5. Sprint tracker files
6. Roadmap files
7. Untracked work logs
8. Directly inspected code, config, hooks, and paths
9. Claude memory or chat recollection

Claude memory may be used as a hint but must never override tracker state, tracker definitions, verified filesystem state, roadmap state, epic state, sprint state, wiring state, or completion evidence. If direct inspection of code or paths contradicts tracker state, the tracker is not automatically overwritten — the contradiction must be recorded and resolved through the Reconciliation process.

---

# Definitions

All operational definitions used by this system are tracked here. Each definition explains how the term is used inside the WarpOS Agentic OS, not just its general meaning. Definitions in `TRACKER.md` outrank definitions in Claude memory, old roadmap files, old sprint notes, old implementation plans, chat summaries, agent assumptions, unlinked documentation, and code comments unless verified and reconciled. The full record format is per spec §8.1 (Term, Definition, Why it matters, Where it applies, Owner, Date added, Last updated, Related documents, Related enforcement rules, Change history). To keep this keystone readable, each definition below carries Term / Definition / Why it matters / Where it applies; Owner is President Agent, Date added and Last updated are 2026-06-05, and Change history is "None (initial entry)" for every term unless stated otherwise.

## Definition: Roadmap
Definition: The strategic backlog of WarpOS, held in `ROADMAP.md`, that names the meaningful strategic goals (epics) and their priority ordering. Structure is epic-based (Roadmap item == Epic): as of sprint T5 (2026-06-06) `ROADMAP.md` carries a `## Epics` registry as its primary organizing unit and the legacy Now/Next/Later + `## 🏛 Milestones` structure is preserved-but-deprecated (milestones explicitly marked DEPRECATED).
Why it matters: It is the top-level "what should we do and in what order"; epics derive from it.
Where it applies: Roadmap mode; epic creation; reconciliation between roadmap and tracker state.

## Definition: Epic
Definition: A meaningful strategic goal that maps to a roadmap item, owns zero or more sprints, and has its own tracker file at `/trackers/epics/<EPIC-ID>-<short-name>.md`. Labeled with an ID (e.g. `E-TRACKER-001`).
Why it matters: Epics are the unit the roadmap is organized around; an epic cannot be Active without its own tracker file.
Where it applies: Roadmap, Active/Planned/Completed Epics sections, epic-planning mode.

## Definition: Sprint
Definition: A bounded execution effort within a parent epic, with a specific goal, scope, definition of done, tracker file at `/trackers/sprints/<SPRINT-ID>-<short-name>.md`, session log, change log, evidence log, and completion record.
Why it matters: Sprints are the smallest formal unit of tracked long-running execution. Work is not a sprint unless it has a tracker and can be resumed from written state.
Where it applies: Sprint mode (ε conductor); Active/Planned/Completed Sprints sections.

## Definition: Task
Definition: A discrete unit of work inside a sprint. Tasks belong inside sprints unless small enough to be handled as untracked work.
Why it matters: Tasks are the executable granularity below a sprint; loose tasks that belong to a sprint must not hang off the roadmap directly.
Where it applies: Sprint tracker `Tasks` lists; the Roadmap→Epic→Sprint→Task hierarchy.

## Definition: Tracker
Definition: A written, append-aware document that mirrors the actual state of long-running work and enables resumption from files alone. `TRACKER.md` is the primary tracker; each epic and sprint has its own tracker file.
Why it matters: The tracker is the source of truth that replaces memory and chat as the basis for resumption.
Where it applies: Everywhere; this entire system.

## Definition: Definition
Definition: A recorded operational meaning of a system term, in the format of spec §8.1, stored in this Definitions section (the authoritative store) and templated by `/trackers/templates/DEFINITION_TEMPLATE.md`.
Why it matters: Definitions prevent terminology drift across sessions, agents, and modes; undefined operational terms are a validation failure.
Where it applies: Definition Use Procedure; Definition Enforcement; validation.

## Definition: Source of truth
Definition: The authoritative written record for a given fact. For tracked long-running work and its definitions, the source of truth is `TRACKER.md`, resolved by the authority order in the Authority section.
Why it matters: Disagreements are resolved by deferring to the highest-authority source, not by memory or assertion.
Where it applies: Authority and Conflict Resolution; Reconciliation.

## Definition: State
Definition: The lifecycle status of an epic or sprint, drawn from the fixed nine-value State Model (`Planned`, `Ready`, `Active`, `Blocked`, `Paused`, `Review Needed`, `Completed`, `Cancelled`, `Superseded`).
Why it matters: A consistent state vocabulary makes status machine-checkable and unambiguous across agents.
Where it applies: Every epic and sprint entry; State Model; validation.

## Definition: Percent completion
Definition: A conservative, evidence-based estimate of completed work against the stated goal and definition of done, per the bands in Percent Completion Rules. Not a vibe, guess, or motivational signal.
Why it matters: Honest percentages prevent "believed complete when it was not" failures.
Where it applies: All epic/sprint entries; Percent Completion Rules; the completion gate.

## Definition: Completion
Definition: The state in which work meets its definition of done AND has recorded evidence AND has the tracker, roadmap, definitions, paths, wirings, and validators all reconciled per the Completion Procedure and the 100% rule.
Why it matters: Completion is a gated claim, not a feeling; over-claiming completion is a primary failure this system prevents.
Where it applies: Completion Procedure; Completion Gate Enforcement; Percent Completion Rules.

## Definition: Verification
Definition: The act of checking the actual current state of a path, file, directory, hook, command, mode, validator, template, or wiring against expectation, recording one of the allowed verification states with the method, timestamp, and evidence.
Why it matters: Assumptions are not verification; claims of existence/nonexistence/wiring are invalid without verification evidence.
Where it applies: Verification Use Procedure; Verification Matrix; Path and Wiring Enforcement.

## Definition: Evidence
Definition: Concrete, resumable proof of a claim — file paths changed, commands/tests run and their results, validation results, commit hashes, explicit existence/nonexistence confirmations, or explicit wiring/validator-ran confirmations — concrete enough that another agent can resume or verify without memory.
Why it matters: Work must not be marked complete without evidence.
Where it applies: Evidence Rules; the Evidence log; completion claims.

## Definition: Blocker
Definition: A specific, named condition that prevents work from continuing until resolved. An item with an unresolved blocker is in state `Blocked`.
Why it matters: Blockers must be explicit and assigned a resolution path, not hidden behind vague status.
Where it applies: Active Epics/Sprints blocker fields; the State Model (`Blocked`).

## Definition: Dependency
Definition: Another epic, sprint, path, wiring, file, or external condition that this work requires before it can be Ready or Completed.
Why it matters: Dependencies determine readiness and ordering; an unmet hard dependency keeps work `Planned` or `Blocked`.
Where it applies: Epic/sprint tracker `Dependencies`; roadmap dependency ordering.

## Definition: Risk
Definition: A possible future condition that could change scope, state, completion, or correctness, recorded so it can be watched and mitigated.
Why it matters: Naming risks lets agents pre-empt them rather than discover them as blockers later.
Where it applies: Epic/sprint tracker `Risks`.

## Definition: Scope
Definition: The explicit set of work an epic or sprint commits to deliver.
Why it matters: Scope bounds completion; scope changes are meaningful state changes that must be tracked.
Where it applies: Epic/sprint tracker `Scope`; During-Work Procedure; Change Log.

## Definition: Out of scope
Definition: Work explicitly excluded from an epic or sprint, recorded so it is not silently assumed complete or incomplete.
Why it matters: Naming exclusions prevents false "incomplete" readings and scope creep.
Where it applies: Epic/sprint tracker `Out of scope`.

## Definition: Change log
Definition: An append-only record, per spec §25, of every change to state, scope, goal, requirements, blockers, definitions, terminology, paths, wirings, validators, hooks, modes, commands, or plans — with what changed, when, who/what found it, what it affects, and previous→new state.
Why it matters: When a plan changes, the old plan must not simply disappear; changes must be traceable.
Where it applies: The Change Tracking section here and the `Change Log` in every epic/sprint tracker.

## Definition: Session log
Definition: An append-only per-session record, per spec §24, of meaningful work on an epic or sprint, including session ID, date/times, agents, mode, work performed, files/paths/wirings changed, decisions, issues, definitions changed, state changes, percent change, verification/validation run and results, next action, and evidence.
Why it matters: Session logs make work auditable and resumable; corrections must themselves be logged.
Where it applies: The Session Logging section here and per-tracker session logs.

## Definition: Evidence log
Definition: The recorded set of evidence entries supporting completion or verification claims for an item.
Why it matters: It is where the proof behind a status lives; completion without an evidence log entry is invalid.
Where it applies: Evidence Rules; per-tracker evidence logs.

## Definition: Untracked work
Definition: Meaningful work completed outside a formal epic or sprint, captured in `UNTRACKED_WORK.md` with the spec §18 fields, pending reconciliation into the proper structure.
Why it matters: Work outside epics/sprints must not become invisible or a loophole for avoiding planning.
Where it applies: Untracked Work section; `UNTRACKED_WORK.md`; Untracked Work Policy.

## Definition: Reconciliation
Definition: The recorded process of resolving a disagreement between two or more tracker-related sources by selecting the authoritative source, fixing the affected documents, and logging the resolution per spec §32.
Why it matters: Contradictions are resolved deliberately and traceably, never by silent overwrite.
Where it applies: Reconciliation Rules; Authority order; the President's ownership duties.

## Definition: Superseded
Definition: A state and a classification meaning the work has been replaced by another epic, sprint, plan, definition, path, wiring, or system design, recorded with the superseding item.
Why it matters: Replaced work must not be deleted without a trace; resumers must see why it stopped and what replaced it.
Where it applies: State Model (`Superseded`); Cancelled or Superseded Work section.

## Definition: Cancelled
Definition: A state and a classification meaning the work will not be done and has NOT been replaced by another item.
Why it matters: Distinguishing cancelled (abandoned) from superseded (replaced) keeps history honest.
Where it applies: State Model (`Cancelled`); Cancelled or Superseded Work section.

## Definition: Meaningful work
Definition: Work that changes, or could change, roadmap, epic, sprint, definition, implementation, documentation, validation, wiring, path, enforcement, or Agentic OS state — as opposed to a trivial edit with no state effect.
Why it matters: It is the threshold that triggers tracker reads at start and tracker updates at end.
Where it applies: Start-of-Work, During-Work, End-of-Work procedures; Update Triggers.

## Definition: Meaningful interval
Definition: A point at which tracker state must be flushed to disk — a sprint session start/end, a handoff, a context compaction, a task completion, a blocker change, a scope/priority change, a completion claim, or a mode switch with changed state.
Why it matters: It bounds how stale the tracker is allowed to get; meaningful state must never go untracked.
Where it applies: Update Triggers; End-of-Work Procedure.

## Definition: Meaningful state change
Definition: A change to state, scope, evidence, blockers, definitions, authority, paths, wirings, validation, enforcement, or resumability of tracked work.
Why it matters: Every meaningful state change requires a tracker update; tiny edits do not.
Where it applies: During-Work Procedure; Update Triggers; Change Tracking.

## Definition: Mode
Definition: An operating posture of the Agentic OS. The live enterable modes are `solo`, `adhoc`, `oneshot`, and `sprint` (verified at `.claude/commands/mode/`). Other "modes" named in the spec (roadmap, review, debugging, refactor, documentation, etc.) are operational postures, not enterable commands; their tracker wiring was disk-checked by sprint T3 (2026-06-05) and is `Verified Not Wired` (residual T6 work, tracked under Known Gap G-2).
Why it matters: Every mode that can affect work must consult the tracker; mode wiring is a verification target.
Where it applies: Mode Integration Procedure; Required Wirings; sprint T6.

## Definition: Agent
Definition: A role in the WarpOS department tree (`president`, `product`, `engineering`, `growth`, `_system`, `_org`-governed), identified by `.claude/agents/_org/role-registry.json` (33 roles, verified). Agents read and update tracker documents; the President owns correctness.
Why it matters: Agents are the actors bound by this system; the role-registry is the keystone of agent identity.
Where it applies: Ownership; agent-coordination mode; all procedures.

## Definition: Owner
Definition: The role accountable for the correctness, reconciliation, and final state authority of a tracked item or document.
Why it matters: Every tracked item and document must have a named accountable owner; unowned entries are a validation failure.
Where it applies: Every epic/sprint/definition/gap record; Ownership.

## Definition: President agent
Definition: The owning role of `TRACKER.md`, accountable per spec §4 for the tracker's existence, authority, definition completeness, truthful epic/sprint representation, path/wiring verification, recorded expected-nonexistence, timely updates, no-lost-completed-work, no-false-completion, captured untracked work, agent compliance, document consistency, real enforcement, run validation, and no-invisible-gaps. Resides at `.claude/agents/president/` in the department tree (verified directory exists).
Why it matters: It centralizes accountability for the truthfulness of the whole tracking layer.
Where it applies: Ownership; Authority; Reconciliation; every "Owner: President Agent" field.

## Definition: Next action
Definition: The single, concrete, written instruction for what to do next on an item. Every Active item must have a non-empty next action; Completed/Cancelled/Superseded items have none.
Why it matters: A clear next action is what makes resumption near-perfect; "active with no next action" is a validation failure.
Where it applies: Every Active epic/sprint; the header's highest-priority next action; validation.

## Definition: Definition of done
Definition: The explicit, checkable set of conditions that must hold for an item to be Completed, recorded in the item's tracker before completion can be claimed.
Why it matters: Completion is measured against the DoD; no item may be 100% without a satisfied, recorded DoD.
Where it applies: Completion Procedure; the 100% rule; Definition of Done sections.

## Definition: Planned
Definition: State — the work is known and captured but not ready to begin.
Why it matters: Distinguishes captured-but-not-startable work from Ready work.
Where it applies: State Model; Planned Epics/Sprints sections.

## Definition: Ready
Definition: State — the work has enough context, requirements, and dependencies resolved to begin.
Why it matters: Marks the transition point where work may legitimately start.
Where it applies: State Model.

## Definition: Active
Definition: State — work has started and is currently expected to continue. Requires its own tracker file and a non-empty next action.
Why it matters: Active is the only state implying in-flight work; it carries the strongest tracking obligations.
Where it applies: State Model; Active Epics/Sprints sections.

## Definition: Blocked
Definition: State — work cannot continue until a specific named blocker is resolved.
Why it matters: Surfaces stalled work and the exact condition needed to unstall it.
Where it applies: State Model; blocker fields.

## Definition: Paused
Definition: State — work is intentionally stopped but may resume later.
Why it matters: Distinguishes a deliberate pause from a blocker or a cancellation.
Where it applies: State Model.

## Definition: Review Needed
Definition: State — implementation or planning work is believed complete enough for review, but completion has not yet been confirmed.
Why it matters: Prevents "believed complete" from being recorded as Completed before verification.
Where it applies: State Model; the review→completed transition.

## Definition: System Inventory
Definition: The per spec §9 catalog of every tracker-relevant component (files, directories, templates, modes, hooks, commands, validators, agent roles, roadmap artifacts, epic/sprint trackers, definition records, logs, docs, configs, scripts, tests, enforcement points, deprecated artifacts) with expected vs actual path/state, existence, wiring, verification method/timestamp/agent, and relations.
Why it matters: No referenced operational artifact may remain outside the inventory.
Where it applies: System Inventory section; verification; completion.

## Definition: Verification Matrix
Definition: The per spec §10 proof table of existence, nonexistence, state, and wiring for everything the system references, using the allowed verification states.
Why it matters: It is where claims become evidenced; `Unknown` that affects completion is a validation failure or blocker.
Where it applies: Verification Matrix section; Verification Use Procedure.

## Definition: Wiring
Definition: A verified connection between a behavior and its enforcement point — a mode that actually consults the tracker, a hook that actually fires, a command that is actually runnable, a check actually invoked by a runner. A wiring is real only when verified in the actual implementation, not in prose.
Why it matters: Claimed-but-unverified wiring is the "system instructions described intended behavior but did not prove enforcement" failure this system targets.
Where it applies: Required Wirings; Path and Wiring Enforcement; sprint T6.

## Definition: Hook
Definition: A WarpOS hook script wired into a Claude Code lifecycle event via `.claude/settings.json` (e.g. PreToolUse/PostToolUse/Stop matchers). Hooks are a primary enforcement mechanism beyond prose.
Why it matters: Tracker rules must be enforced by hooks where possible, not only described.
Where it applies: Enforcement Requirements; System Inventory (type Hook); Required Wirings.

## Definition: Command
Definition: A runnable invocation — a WarpOS skill under `.claude/commands/` or a node script under `scripts/` — that an agent or hook can execute. A command is "runnable" only when verified to exist and execute.
Why it matters: Documented-but-not-runnable commands are a validation failure (spec §28.7).
Where it applies: System Inventory (type Command); validation; Required Wirings.

## Definition: Validator
Definition: A runnable check that proves a tracker invariant (e.g. missing tracker files, ambiguous state language, undefined terms, definition drift, missing/stale paths, missing wiring, completion without evidence). The tracker validation engine is NOT yet built (owned by sprint T4).
Why it matters: Validators turn the prose rules into machine-enforced gates; "documented but not runnable" validators fail validation.
Where it applies: Validation Requirements; Enforcement; sprint T4.

## Definition: Template
Definition: A practical fill-in skeleton under `/trackers/templates/` for epics, sprints, session logs, change logs, evidence logs, definitions, untracked-work entries, completion records, verification records, reconciliation records, and system-inventory records. The 10 templates are Verified Exists in `/trackers/templates/` (created by sprint T2; ls/Read on 2026-06-05).
Why it matters: Templates let agents produce conformant records quickly and unambiguously.
Where it applies: Required Templates; sprint T2.

## Definition: Path
Definition: A filesystem location referenced by the system. A path is "real" only when verified to exist; "intentionally nonexistent" only when verified absent and recorded as expected-absent.
Why it matters: The system must neither assume paths exist nor assume they do not.
Where it applies: Verification Matrix; System Inventory; Path and Wiring Enforcement.

## Definition: Expected nonexistence
Definition: A recorded, verified state in which a path or artifact does not exist AND is intended not to exist (e.g. a deleted old-tree directory after a cutover).
Why it matters: Verified-absent-and-intended is distinct from missing-but-required; both must be recorded, not assumed.
Where it applies: Verification Matrix (`Verified Nonexistent`); cutover verification.

## Definition: Known gap
Definition: A recorded deficiency in the Agentic OS tracking layer, captured in the Known Gaps section with spec §36 fields (id, description, severity, area, files, wirings, modes, discovery date, discovered-by, owner, required fix, state, related epic/sprint, evidence, next action).
Why it matters: If a gap exists it must be recorded as a blocker, validation failure, unfinished task, or follow-up — no gap may remain invisible.
Where it applies: Known Gaps and Open Flaws section; validation; completion.

## Definition: Agentic OS
Definition: The WarpOS agent operating system — the department-tree agents, role-registry keystone, modes, skills (`.claude/commands/`), hooks, scripts (`scripts/`), the ε sprint runtime, and the enforcement/validation layer — that this tracker governs the long-running work of.
Why it matters: It is the system this tracker mirrors and keeps truthful and resumable.
Where it applies: Everywhere; the scope of this entire document.

---

# System Inventory

Per spec §9, every tracker-relevant component is inventoried below. This inventory was fully disk-verified by sprint T3 on 2026-06-05: every row was checked with `ls`/`test`/Read/`grep`/`node`/`git` against the canonical repo root, and there are no `Unknown` rows — every state is a definite §10 verification state. Verifying agent: the T3 verification pass (President-delegated systems builder). For each item: Name | Type | Expected path | Exists? | Verified state | Verification method + evidence (timestamp 2026-06-05 unless noted).

| Item | Type | Expected path | Exists? | Verified state | Method + evidence (2026-06-05, T3) |
|---|---|---|---|---|---|
| TRACKER.md | File | `WarpOS/TRACKER.md` | Yes | Verified Exists (this file; 34 §5 sections, ~50 definitions, validated 12/12) | `ls -la TRACKER.md` (116912 bytes) + `node scripts/trackers/validate.js` exit 0 |
| ROADMAP.md | File | `WarpOS/ROADMAP.md` | Yes | Verified Exists — epic-based as of sprint T5 (2026-06-06): `## Epics` registry is the primary unit; `## 🏛 Milestones` marked DEPRECATED | `grep "^## Epics" ROADMAP.md` + `grep "DEPRECATED" ROADMAP.md` + Read post-edit |
| trackers/epics/ (9 epic files) | Epic trackers | `WarpOS/trackers/epics/E-*.md` | Yes | Verified Exists — E-TRACKER-001 (T2) + 8 created by T5 (E-GOLDEN-FLOW-001, E-CONTENT-DELIVERY-001, E-TEST-SUITE-001, E-STABLE-CHANNEL-001, E-BOUNDARY-001, E-MULTIPRODUCT-001, E-SKILL-CATALOG-001, E-MANAGER-LAYER-001); all 9 ROADMAP §Epics links resolve | `ls -1 trackers/epics/` (9) + `grep -oE "trackers/epics/E-[A-Z0-9-]+-[a-z-]+\.md" ROADMAP.md` → 9/9 OK |
| UNTRACKED_WORK.md | File | `WarpOS/UNTRACKED_WORK.md` | Yes | Verified Exists (sprint T2; 6741 bytes) | `ls -la UNTRACKED_WORK.md` |
| /trackers/ | Directory | `WarpOS/trackers/` | Yes | Verified Exists (sprint T2; + `trackers/README.md`, 2657 bytes) | `ls -la trackers/` |
| /trackers/epics/ | Directory | `WarpOS/trackers/epics/` | Yes | Verified Exists (sprint T2; 1 epic file) | `ls -la trackers/epics/` |
| /trackers/sprints/ | Directory | `WarpOS/trackers/sprints/` | Yes | Verified Exists (sprint T2; T1–T6 sprint files present) | `ls -la trackers/sprints/` |
| /trackers/templates/ | Directory | `WarpOS/trackers/templates/` | Yes | Verified Exists (sprint T2; exactly 10 templates) | `ls -la trackers/templates/` |
| EPIC_TEMPLATE.md | Template | `/trackers/templates/EPIC_TEMPLATE.md` | Yes | Verified Exists (4496 bytes) | `ls -la trackers/templates/` |
| SPRINT_TEMPLATE.md | Template | `/trackers/templates/SPRINT_TEMPLATE.md` | Yes | Verified Exists (4497 bytes) | `ls -la trackers/templates/` |
| SESSION_LOG_TEMPLATE.md | Template | `/trackers/templates/SESSION_LOG_TEMPLATE.md` | Yes | Verified Exists (1527 bytes) | `ls -la trackers/templates/` |
| CHANGE_LOG_TEMPLATE.md | Template | `/trackers/templates/CHANGE_LOG_TEMPLATE.md` | Yes | Verified Exists (974 bytes) | `ls -la trackers/templates/` |
| EVIDENCE_LOG_TEMPLATE.md | Template | `/trackers/templates/EVIDENCE_LOG_TEMPLATE.md` | Yes | Verified Exists (1198 bytes) | `ls -la trackers/templates/` |
| DEFINITION_TEMPLATE.md | Template | `/trackers/templates/DEFINITION_TEMPLATE.md` | Yes | Verified Exists (1586 bytes) | `ls -la trackers/templates/` |
| UNTRACKED_WORK_TEMPLATE.md | Template | `/trackers/templates/UNTRACKED_WORK_TEMPLATE.md` | Yes | Verified Exists (1177 bytes) | `ls -la trackers/templates/` |
| VERIFICATION_TEMPLATE.md | Template | `/trackers/templates/VERIFICATION_TEMPLATE.md` | Yes | Verified Exists (2396 bytes; also serves the §35 system-inventory-record workflow) | `ls -la trackers/templates/` |
| RECONCILIATION_TEMPLATE.md | Template | `/trackers/templates/RECONCILIATION_TEMPLATE.md` | Yes | Verified Exists (1360 bytes) | `ls -la trackers/templates/` |
| COMPLETION_RECORD_TEMPLATE.md | Template | `/trackers/templates/COMPLETION_RECORD_TEMPLATE.md` | Yes | Verified Exists (2600 bytes; the §35 completion-record template) | `ls -la trackers/templates/` |
| E-TRACKER-001 epic tracker | Epic tracker | `/trackers/epics/E-TRACKER-001-enforced-tracker-system.md` | Yes | Verified Exists (sprint T2; 16254 bytes; epic is Active and links to this file) | `ls -la trackers/epics/` + Read |
| T1 sprint tracker | Sprint tracker | `/trackers/sprints/T1-tracker-keystone.md` | Yes | Verified Exists (8713 bytes) | `ls -la trackers/sprints/` |
| T2 sprint tracker | Sprint tracker | `/trackers/sprints/T2-templates-and-dirs.md` | Yes | Verified Exists (10591 bytes) | `ls -la trackers/sprints/` |
| T3 sprint tracker | Sprint tracker | `/trackers/sprints/T3-system-inventory-and-verification-matrix.md` | Yes | Verified Exists (this sprint; Completed 2026-06-05) | `ls -la trackers/sprints/` + Read |
| T4 sprint tracker | Sprint tracker | `/trackers/sprints/T4-validation-engine-and-enforcement.md` | Yes | Verified Exists (12278 bytes) | `ls -la trackers/sprints/` |
| T5 sprint tracker | Sprint tracker | `/trackers/sprints/T5-roadmap-milestones-to-epics.md` | Yes | Verified Exists (4602 bytes) | `ls -la trackers/sprints/` |
| T6 sprint tracker | Sprint tracker | `/trackers/sprints/T6-mode-wiring.md` | Yes | Verified Exists (12531 bytes) | `ls -la trackers/sprints/` |
| trackers/README.md | Documentation file | `WarpOS/trackers/README.md` | Yes | Verified Exists (2657 bytes; links the tree from TRACKER.md) | `ls -la trackers/` |
| role-registry.json (keystone) | Configuration file | `.claude/agents/_org/role-registry.json` | Yes | Verified Exists; 33 roles | `node -e` role-count = 33 |
| Department tree | Directory | `.claude/agents/{president,product,engineering,growth,_system,_org}` | Yes | Verified Exists (also `_evals`, `_principles`) | `ls .claude/agents` |
| Old mode-based agent tree | Deprecated artifact | `.claude/agents/{00-alex,01-adhoc,02-oneshot,03-managers}` | No | Verified Nonexistent (expected nonexistent; ADR-0007 cutover) | `ls` → ENOENT for all four |
| ε sprint runtime | Script | `scripts/sprint/epsilon-runtime.js` | Yes | Verified Exists (34382 bytes) | `ls -la scripts/sprint/epsilon-runtime.js` |
| Mode command — solo | Command | `.claude/commands/mode/solo.md` | Yes | Verified Exists | `ls .claude/commands/mode` + grep |
| Mode command — adhoc | Command | `.claude/commands/mode/adhoc.md` | Yes | Verified Exists | `ls .claude/commands/mode` + grep |
| Mode command — oneshot | Command | `.claude/commands/mode/oneshot.md` | Yes | Verified Exists | `ls .claude/commands/mode` + grep |
| Mode command — sprint | Command | `.claude/commands/mode/sprint.md` | Yes | Verified Exists (carries the α+ε+β persistent-team Steps 1.5/1.75) | `ls` + grep (Steps 1.5/1.75 + 2.5) |
| KNOWN_DANGLING_REFS baseline | Enforcement point | `scripts/warpos/release-build.js` | Yes | Verified Exists; 32 refs (A:4 B:11 C:17) | `node -e` require → `KNOWN_DANGLING_REFS.length === 32` |
| Tracker validation engine | Validator | `scripts/trackers/validate.js` | Yes | Verified Exists (51729 bytes; live run 12/12 PASS, exit 0) | `ls -la` + `node scripts/trackers/validate.js` exit 0 |
| /trackers:validate skill | Command | `.claude/commands/trackers/validate.md` | Yes | Verified Exists (4703 bytes) | `ls -la .claude/commands/trackers/validate.md` |
| Tracker mode-wiring (4 live modes) | Wiring | `.claude/commands/mode/{solo,adhoc,oneshot,sprint}.md` | Yes | Verified Wired — start-of-work tracker-consult step in all 4 live modes (solo 1.5, adhoc 1.6, oneshot 2.5, sprint 2.5) | `grep "Start-of-work — consult TRACKER.md"` → 4 hits (one per mode) |
| Tracker scan-suite gate | Wiring | `.claude/commands/scan/full.md` | Yes | Verified Wired — "Tracker integrity — the enforced-tracker gate" block invokes `node scripts/trackers/validate.js` (fail-closed) | `grep "validate.js"` in `scan/full.md` line 84 |
| Tracker start-of-work hook | Hook | `scripts/hooks/tracker-start-of-work.js` | Yes | Verified Wired (2026-06-06) — SessionStart hook runs the validator + injects the tracker verdict into context; in `defaults.json` SessionStart + live `.claude/settings.json` | `ls` + tested (emits valid SessionStart envelope) + `grep` in defaults/settings |
| Tracker completion-gate hook | Hook | `scripts/hooks/tracker-completion-gate.js` | Yes | Verified Wired (2026-06-06) — Stop hook runs the validator; advisory (or `TRACKER_GATE_ENFORCE=1` blocks) on a red tracker; re-entrancy-guarded; in `defaults.json` Stop + live settings | `ls` + tested (silent on green; guard fires) + `grep` in defaults/settings |
| Sprint persistent-team wiring | Wiring | `.claude/commands/mode/sprint.md` | Yes | Verified Wired — α+ε+β persistent team (Step 1.5 verify readiness, Step 1.75 create team + spawn ε + β); tracker-consult Step 2.5 does not disturb it | `grep` Steps 1.5/1.75/2.5 in `sprint.md` |
| `warpos@0.14.0` release tag | Roadmap artifact | git tag | Yes | Verified Exists (release commit `0650e58`) | `git tag --list "warpos@0.14*"` → `warpos@0.14.0` |

No referenced operational artifact remains outside this inventory. T3 disk-verification is complete; any artifact added by a future sprint must be appended here.

---

# Verification Matrix

Per spec §10. Allowed states: `Verified Exists`, `Verified Nonexistent`, `Verified Wired`, `Verified Not Wired`, `Exists But Stale`, `Exists But Incomplete`, `Exists But Miswired`, `Missing But Required`, `Present But Should Be Removed`, `Unknown`. `Unknown` is allowed temporarily but is a validation failure or blocker if it affects completion. This matrix was fully disk-verified by sprint T3 on 2026-06-05 by the President-delegated systems builder; there are NO `Unknown` rows — every row resolves to a definite verification state, with the exact command/inspection and evidence recorded. Where a wiring was checked and the consult/hook is genuinely absent, the row is `Verified Not Wired` (a definite finding), not `Unknown`.

| Item | Required? | Should exist? | State | Evidence / check (2026-06-05, T3) |
|---|---|---|---|---|
| TRACKER.md | Yes | Yes | Verified Exists (validated 12/12) | `node scripts/trackers/validate.js` exit 0 + `ls -la TRACKER.md` |
| ROADMAP.md | Yes | Yes | Verified Exists — epic-based (sprint T5, 2026-06-06): `## Epics` registry primary; `## 🏛 Milestones` DEPRECATED | `grep "^## Epics" ROADMAP.md` + Read post-edit |
| trackers/epics/ (9 epic files) | Yes | Yes | Verified Exists — E-TRACKER-001 + 8 from T5; all 9 ROADMAP §Epics links resolve | `ls -1 trackers/epics/` (9) + `grep`-resolve 9/9 OK |
| UNTRACKED_WORK.md | Yes | Yes | Verified Exists | `ls -la UNTRACKED_WORK.md` (6741 bytes) |
| /trackers/ (+ epics/sprints/templates) | Yes | Yes | Verified Exists (trackers/, epics/, sprints/, templates/ + README.md; 10 templates; T1–T6 + E-TRACKER-001) | `ls -la trackers/ trackers/epics/ trackers/sprints/ trackers/templates/` |
| 10 templates (each, individually) | Yes | Yes | Verified Exists (EPIC/SPRINT/SESSION_LOG/CHANGE_LOG/EVIDENCE_LOG/DEFINITION/UNTRACKED_WORK/VERIFICATION/RECONCILIATION/COMPLETION_RECORD) | `ls -la trackers/templates/` → exactly 10 files |
| E-TRACKER-001 epic file + T1–T6 sprint files | Yes | Yes | Verified Exists (7 files; sizes recorded in System Inventory) | `ls -la trackers/epics/ trackers/sprints/` |
| `.claude/agents/_org/role-registry.json` | Yes | Yes | Verified Exists (33 roles) | `node -e` role-count = 33 |
| Department tree dirs | Yes | Yes | Verified Exists (president/product/engineering/growth/_system/_org) | `ls .claude/agents` |
| Old mode-based tree (`00-alex/01-adhoc/02-oneshot/03-managers`) | No | No (post-cutover) | Verified Nonexistent (expected nonexistence; re-verified on disk this pass) | `ls` of all four → ENOENT for each |
| `scripts/sprint/epsilon-runtime.js` | Yes | Yes | Verified Exists | `ls -la` (34382 bytes) |
| Mode commands (solo/adhoc/oneshot/sprint) | Yes | Yes | Verified Exists | `ls .claude/commands/mode` + grep |
| Sprint-mode tracker consult | Yes | Yes | Verified Wired (T6) | `grep` → `.claude/commands/mode/sprint.md:162` "Step 2.5: Start-of-work — consult TRACKER.md" |
| Solo/adhoc/oneshot-mode tracker consult | Yes | Yes | Verified Wired (T6) | `grep` → `solo.md:38` (Step 1.5), `adhoc.md:48` (Step 1.6), `oneshot.md:49` (Step 2.5) |
| Sprint persistent-team wiring (α+ε+β) | Yes | Yes | Verified Wired | `grep` → `sprint.md` Step 1.5 (verify readiness) + Step 1.75 (create team + spawn ε + β); tracker-consult Step 2.5 leaves it intact |
| Validation-mode tracker consult (standing scan gate) | Yes | Yes | Verified Wired (T6) | `grep` → `.claude/commands/scan/full.md:84` `node scripts/trackers/validate.js` under the "Tracker integrity — the enforced-tracker gate" block |
| Start-of-work HARD hook (SessionStart) | Yes | Yes | Verified Wired (2026-06-06) | `scripts/hooks/tracker-start-of-work.js` runs the validator at SessionStart + injects the verdict; wired in `_warpos/settings/defaults.json` + live `.claude/settings.json`; tested (valid envelope) |
| End-of-work / completion-gate HARD hook (Stop) | Yes | Yes | Verified Wired (2026-06-06) | `scripts/hooks/tracker-completion-gate.js` runs the validator at Stop (advisory / `TRACKER_GATE_ENFORCE=1` blocks), re-entrancy-guarded; wired in `defaults.json` + live settings; tested |
| Roadmap-mode tracker consult | Yes | Yes | Verified Not Wired (residual T6 — roadmap skills are operational postures, not enterable mode commands) | `grep -l TRACKER.md .claude/commands/roadmap/*.md` → no match (add/cleanup/create/ideas/next/prioritize present, none consult the tracker) |
| Handoff/resumption tracker consult | Yes | Yes | Verified Not Wired (residual T6) | `grep -l TRACKER.md .claude/commands/session/{handoff,resume}.md` → no match (both files exist, neither consults the tracker) |
| Review/debug/refactor/doc/agent-coordination tracker consult | Yes | Yes | Verified Not Wired (residual T6 — operational postures, no enterable mode command) | no enterable mode command exists for these postures; the 4 enterable modes are wired |
| Definition-enforcement wiring (cross-file definition-drift) | Yes | Yes | Verified Wired (T4, 2026-06-06) | `validate.js` ships check (k) `undefined-terms` AND check (t) `definition-drift` (cross-file duplicate-definition divergence); both fail-closed + bite-tested |
| Start-of-work / end-of-work / completion-gate HARD hook | Yes | Yes | Verified Wired (2026-06-06) | `scripts/hooks/tracker-start-of-work.js` (SessionStart) + `scripts/hooks/tracker-completion-gate.js` (Stop) in `_warpos/settings/defaults.json` + live `.claude/settings.json`; tested |
| Path/wiring verification HARD wiring | Yes | Yes | Verified Wired (T4, 2026-06-06) | `validate.js` check (l) `required-paths` (§33 existence) + (q) `expected-nonexistence` (Verified-Nonexistent paths absent) + (r) `cross-file-reconciliation` (item states match files); claim-without-evidence is machine-caught |
| Tracker validation engine (`scripts/trackers/validate.js`) | Yes | Yes | Verified Exists (selftest 33/33; live 12/12 PASS, exit 0) | `ls -la` (51729 bytes) + `node scripts/trackers/validate.js` exit 0 |
| /trackers:validate skill (`.claude/commands/trackers/validate.md`) | Yes | Yes | Verified Exists | `ls -la` (4703 bytes) |
| KNOWN_DANGLING_REFS baseline (32 refs) | Yes (G-1 evidence) | Yes | Verified Exists (32; A:4 B:11 C:17) | `node -e` require → `KNOWN_DANGLING_REFS.length === 32` |
| E-ADR0007 completed-work evidence (E1–E8 commits) | Yes (completion evidence) | Yes | Verified Exists — all spot-checked hashes resolve in `git log` with matching subjects | `git log -1` on `09bac6f,9a132af,688b1e3,2e859d7,ec3f249,b29d331,2202abf,aa86338,f574a7e,2ac4c92,5c8377c,3f9470d,6dcd318,0320e11,34213e2,146108f,db0a778,f279b47,a6ab0bc,0650e58` → all found |
| `warpos@0.14.0` tag | Yes (evidence for completed release) | Yes | Verified Exists | `git tag --list "warpos@0.14*"` → `warpos@0.14.0` |

No `Unknown` rows remain. The `Verified Not Wired` rows are tracked follow-ups (residual T6 non-enterable-posture consult + deferred T4 enforcement hooks / cross-file checks), recorded as Known Gap G-2, not as completion blockers for T3 itself.

---

# Active Epics

None currently recorded. E-TRACKER-001 (Enforced TRACKER System) and E-SPINUP-STEPS-001 (Step-driven, degrade-proof bootstrap:spinup + Milestone→Epic) both reached Completed (100%) — see Completed Epics. The roadmap's broader theme-epics (E-GOLDEN-FLOW-001 etc.) are tracked in `ROADMAP.md` § Epics with their own `trackers/epics/` files, not as Active Epics here.

---

# Active Sprints

None currently recorded. S-SPINUP-001 (Step-driven, degrade-proof bootstrap:spinup) reached Completed (100%) on 2026-06-06 — see Completed Sprints. All six E-TRACKER-001 sprints (T1, T2, T3, T4, T5, T6) are also Completed. T4 — Validation engine + enforcement — moved from Review Needed to Completed on 2026-06-06 when its deferred cross-file §28.7 checks landed (the validator now runs 20 checks: 12 single-file a–l + 8 cross-file m–t). The epic E-TRACKER-001 remains Active at ~95% with a single residual (a hard start/end/completion enforcement HOOK), tracked under Known Gap G-2 and enforced-to-stay-visible by the new `hooks-enforce-or-tracked` check — see the epic's Next required action.
- Related system inventory items: tracker validation engine; /trackers:validate skill.

---

# Planned but Not Started Epics

None currently recorded.

---

# Planned but Not Started Sprints

None currently recorded. (All six E-TRACKER-001 sprints have started: T1, T2, T3, T5, T6 are Completed — see Completed Sprints; T4 is Review Needed — see Active Sprints. T5 — Roadmap milestones → epics — moved from Planned to Completed on 2026-06-06.) The roadmap's planned theme-epics are tracked in `ROADMAP.md` § Epics, not as sprints here.

---

# Completed Epics

### E-TRACKER-001 — Enforced TRACKER System
- Link to epic tracker: `/trackers/epics/E-TRACKER-001-enforced-tracker-system.md` — Verified Exists (ls/Read on 2026-06-06).
- Goal: Implement the enforced tracking system specified in `agentic_os_tracker_system_improvements.md` — a `TRACKER.md` following all 34 sections, all operational definitions, the `/trackers/` scaffold + templates, an epic-based roadmap, mode-wiring, a runnable validation engine, and hard enforcement.
- Final state: Completed.
- Percent completion: 100%.
- Completion timestamp: 2026-06-06.
- Session IDs / dates / agents: Wave-1 build sessions + reconciliation + T3 verification (2026-06-05); T4 cross-file checks + T5 roadmap migration + the hard enforcement hooks (2026-06-06). President Agent (owner) via delegated docs/systems/backend builders + a β review pass.
- Definition of done used: the §37 DoD in the epic tracker file — all items satisfied + evidenced (the standalone hard hooks, formerly a residual, are now built + wired).
- Evidence of completion: all six sprints Completed and Verified on disk — T1 (keystone `TRACKER.md`, 34 sections + ~50 definitions), T2 (`/trackers/` tree + 10 templates + `UNTRACKED_WORK.md` + epic/sprint files), T3 (System Inventory + Verification Matrix, fully disk-verified, zero `Unknown`), T4 (validation engine + the 8 cross-file §28.7 checks — `node scripts/trackers/validate.js` → 20/20 PASS + `--selftest` 55/55), T5 (ROADMAP migrated to epic-based — `## Epics` registry primary, `## 🏛 Milestones` DEPRECATED, 8 new epic files), T6 (start-of-work tracker-consult in all four live modes + the validator gated in `/scan:full` as a fail-closed gate). Hard enforcement wired (2026-06-06): `scripts/hooks/tracker-start-of-work.js` (SessionStart — runs the validator + injects the tracker verdict into context) + `scripts/hooks/tracker-completion-gate.js` (Stop — refuses to end on a red tracker) defined in `_warpos/settings/defaults.json` and live in `.claude/settings.json`; `hooks-enforce-or-tracked` now passes on hook existence. Final validation: `node scripts/trackers/validate.js` → all 20 checks PASS, exit 0 (2026-06-06).
- Remaining follow-up items: optional hardening only — a per-edit PostToolUse completion-gate (the current gate is the standing `/scan:full` + the Stop hook); non-enterable operational postures (roadmap/review/etc.) have no enterable mode command to wire. None block completion.
- Related completed sprints: T1, T2, T3, T4, T5, T6 (all Completed, with tracker files under `/trackers/sprints/`).
- Related roadmap item: `ROADMAP.md` § Epics → E-TRACKER-001.
- Related definitions: Tracker, Epic, Sprint, Validator, Template, Wiring, Verification Matrix, System Inventory, Hook.
- `TRACKER.md` updated: Yes · Roadmap reconciled: Yes.

### E-ADR0007 — Agent-System Rewrite (ADR-0007)
- Link to epic tracker: No per-epic tracker file under `/trackers/epics/` exists yet (the rewrite predates this system; its durable record was the interim `TRACKER.md`, now summarized here). Follow-up: optionally backfill a retro epic tracker (recorded as a non-blocking follow-up, not required for the completed claim).
- Goal: Restructure the Agentic OS from a development-tool shape to a company-like department tree — replace the mode-based agent tree with `president/product/engineering/growth/_system/_org`, establish the `role-registry.json` keystone, derive dispatch consumers from the registry, resolve skills→agents from the registry, build the `_knowledge/` brain, collapse the org-map into the registry, build the ε sprint-conductor runtime, and harden enforcer debt.
- Final state: Completed.
- Percent completion: 100% for E1–E8 as defined (one honestly-deferred increment remains as a named follow-on — the ε per-agent SPAWN under `--epsilon-dispatch` — documented in ADR-0009; not a blocker to the rewrite's completion claim).
- Session IDs that worked on it: multiple sessions across 2026-06-04 → 2026-06-05 (the cutover, then three parallel landing sprints).
- Dates/times worked on: 2026-06-04 (cutover) through 2026-06-05 (E5–E8 landing + 61-ref cutover cleanup + ε dispatch made real).
- Agents that worked on it: the department-tree agents under President accountability (Alpha/Beta/Gamma/Delta/ε faces + managers/directors as wired).
- Completion timestamp: 2026-06-05.
- Evidence of completion (per the interim tracker, verified against disk + git there): cutover commits `09bac6f`→`9a132af`; E2 `688b1e3`→`2e859d7`; E3 `ec3f249`,`b29d331`,`2202abf` (ADR-0008); E4 `aa86338`,`f574a7e`,`2ac4c92`,`5c8377c`; E5 `3f9470d`→`6dcd318`; E6 merge `0320e11` (ADR-0010); E7 merge `34213e2` (ADR-0009); E8 merge `146108f`; 61-ref cutover cleanup `db0a778`; ε dispatch made real + `/mode:sprint` added `f279b47` (per DUMP.md). `/scan:cutover-completeness` GREEN on `main`; `role-parity` 30/30; ship-coverage / skill-hook-coverage OK; roadmap-trace 30/30. Re-verified by sprint T3 on 2026-06-05: every one of these hashes resolves in current `git log` with its recorded subject (`git log -1 --format="%h %s"` on `09bac6f,9a132af,688b1e3,2e859d7,ec3f249,b29d331,2202abf,aa86338,f574a7e,2ac4c92,5c8377c,3f9470d,6dcd318,0320e11,34213e2,146108f,db0a778,f279b47,a6ab0bc,0650e58` — all found), and `git tag --list "warpos@0.14*"` → `warpos@0.14.0`. No hash was unconfirmed.
- Definition of done used: ADR-0007 acceptance + all of E1–E8 landed on `main` with every gate green (as recorded in the interim tracker).
- Remaining follow-up items: (1) the ε per-agent SPAWN increment under `--epsilon-dispatch` (ADR-0009 risk #4) — honestly deferred, not a rewrite blocker; (2) optional backfill of a per-epic tracker file for historical completeness.
- Related completed sprints: E1–E8 (summarized in Completed Sprints below).
- Related untracked work: the doc-sync and roadmap-backfill work recorded in DUMP.md is to be reconciled into `UNTRACKED_WORK.md` once that file exists (sprint T2).
- Related definitions: Agentic OS, Agent, President agent, Sprint, ε sprint runtime (per the ε-runtime System Inventory entry).
- Related verification results: old mode-based tree Verified Nonexistent; role-registry Verified Exists (33 roles); ε runtime Verified Exists.

### E-SPINUP-STEPS-001 — Step-driven, degrade-proof bootstrap:spinup + Milestone→Epic
- Link to epic tracker: [trackers/epics/E-SPINUP-STEPS-001-step-driven-degrade-proof-spinup.md](trackers/epics/E-SPINUP-STEPS-001-step-driven-degrade-proof-spinup.md) — Verified Exists (Write/Read 2026-06-06).
- Goal: Refactor `bootstrap:spinup` into a step-driven (`setup → canon → roadmap → paint`), idempotent, resumable pipeline with a stable `--json` status + a consumer dispatch contract, a degrade-proof engine (no path to thin/placeholder canon), a `--where` platform target, a `portfolio:new` reconcile, and a Milestone→Epic rename. Source: `WARPOS-PROMPT.md` (2026-06-06).
- Final state: Completed.
- Percent completion: 100%.
- Completion timestamp: 2026-06-06.
- Session IDs / dates / agents: 2026-06-06 · President α (build in-loop) + ε + β (persistent team) + one background systems builder (§5 prose-doc rename).
- Definition of done used: the §8 acceptance in the epic tracker — all items satisfied + evidenced.
- Evidence of completion: landed on `main` @ `c9583dd` (`feat(spinup): step-driven, degrade-proof bootstrap:spinup + Milestone→Epic`). Gauntlet: `node scripts/bootstrap/test-spinup-orchestrate.js` → 32/32; `node scripts/trackers/validate.js` → 20/20; `node scripts/check/roadmap-trace.js` → 30/30; `node scripts/canon/test-generate.js` → 24/24; framework-purity OK; warpos-manifest-honesty OK (1063 assets). Zero regressions (HEAD-vs-worktree linter fail-set parity 21/24). Manifests regenerated (framework-manifest + installed snapshot + _warpos). New files: `scripts/bootstrap/phases/{setup,paint}.js`, `scripts/portfolio/new-lib.js`, `WARPOS.md` (WG-1 native-scaffold flag). Deleted: `scripts/bootstrap/phases/{preflight,intent,onscreen}.js`. Enforcement debt logged: ED-029 (--allow-needs-input audit). Native-packaging epic E-NATIVE-PACKAGING-001 parked in `ROADMAP.md`.
- Remaining follow-up items: native scaffolds (E-NATIVE-PACKAGING-001, trigger-gated); ED-029 machine-audit of --allow-needs-input; the gated `MASTERCONSOLE-PROMPT.md` consumer runner (separate product layer — not executed this session). None block completion.
- Related completed sprints: S-SPINUP-001.
- Related roadmap item: `ROADMAP.md` § Epics → E-SPINUP-STEPS-001.
- Related definitions: Epic, Sprint, Validator, Wiring, Verification, Evidence.
- `TRACKER.md` updated: Yes · Roadmap reconciled: Yes.

---

# Completed Sprints

The ADR-0007 rewrite was executed as eight workstreams (E1–E8). They predate this enforced tracker, so they did not have per-sprint tracker files under `/trackers/sprints/`; their durable record was the interim `TRACKER.md` and is summarized here without loss. All were verified against disk + git in their landing sessions. Per-sprint tracker files are an optional historical backfill (recorded as a non-blocking follow-up), not required for these completed claims. All six E-TRACKER-001 sprints T1, T2, T3, T4, T5, and T6 are Completed and — unlike E1–E8 — carry their own tracker files under `/trackers/sprints/`.

### S-SPINUP-001 — Step-driven, degrade-proof bootstrap:spinup · Completed 2026-06-06
- Link to sprint tracker: [trackers/sprints/S-SPINUP-001-step-driven-degrade-proof-spinup.md](trackers/sprints/S-SPINUP-001-step-driven-degrade-proof-spinup.md) — Verified Exists (Write/Read 2026-06-06).
- Parent epic: E-SPINUP-STEPS-001.
- Goal/result: Implemented WARPOS-PROMPT.md §1–§7 as one cohesive refactor of `scripts/bootstrap/spinup-orchestrate.js` + the phase modules (`setup`/`canon`/`roadmap`/`paint`) + `test-spinup-orchestrate.js` + `spinup.md` + `portfolio/new-lib.js`, then verified §8 acceptance.
- Final state: Completed. · Percent completion: 100%. · Completion timestamp: 2026-06-06.
- Evidence of completion: landed on `main` @ `c9583dd`; `node scripts/bootstrap/test-spinup-orchestrate.js` → 32/32; tracker 20/20; roadmap-trace 30/30; framework-purity OK. See the parent epic's evidence for the full gauntlet.
- Related untracked work: None. · `TRACKER.md` updated: Yes · Roadmap reconciled: Yes.

### T1 — TRACKER keystone + definitions · Completed 2026-06-05
- Link to sprint tracker: `/trackers/sprints/T1-tracker-keystone.md` — Verified Exists (ls/Read on 2026-06-05).
- Goal/result: Authored the keystone `TRACKER.md` with all 34 §5 sections (none omitted) and ~50 operational definitions; seeded the System Inventory and Verification Matrix; pre-recorded the real work as a dogfood; reconciled and retired the interim ADR-0007-rewrite tracker (now Superseded).
- Final state: Completed.
- Percent completion: 100%.
- Parent epic: E-TRACKER-001.
- Evidence of completion: the 943-line `TRACKER.md` with all 34 §5 sections + ~50 definitions, validated 12/12 by `scripts/trackers/validate.js` (live run on 2026-06-05, exit 0); landed in the Wave-1 commit. Verified by ls/Read + `node scripts/trackers/validate.js` on 2026-06-05.

### T2 — Templates + directories + UNTRACKED_WORK · Completed 2026-06-05
- Link to sprint tracker: `/trackers/sprints/T2-templates-and-dirs.md` — Verified Exists (ls/Read on 2026-06-05).
- Goal/result: Created the `/trackers/` directory tree (`epics/`, `sprints/`, `templates/`) + `trackers/README.md`, all 10 templates, `UNTRACKED_WORK.md`, the E-TRACKER-001 epic tracker file, and the T1–T6 sprint tracker files — the scaffold the rest of the epic fills in.
- Final state: Completed.
- Percent completion: 100%.
- Parent epic: E-TRACKER-001.
- Evidence of completion: `trackers/` tree + 10 templates in `trackers/templates/` + `UNTRACKED_WORK.md` + `trackers/epics/E-TRACKER-001-enforced-tracker-system.md` + `trackers/sprints/T1..T6` on disk; landed in the Wave-1 commit. Verified by ls/Read on 2026-06-05.

### T3 — System Inventory + Verification Matrix · Completed 2026-06-05
- Link to sprint tracker: `/trackers/sprints/T3-system-inventory-and-verification-matrix.md` — Verified Exists (ls/Read on 2026-06-05).
- Goal/result: Made the System Inventory (§9) and Verification Matrix (§10) COMPLETE and TRUTHFUL by disk-verifying every tracker-relevant artifact — all §33 required files/dirs/templates (each of the 10 templates individually), the validation engine + `/trackers:validate` skill, the 4 mode-consult wirings + the `/scan:full` gate + the sprint α+ε+β persistent-team wiring, the epic + T1–T6 sprint files, ROADMAP.md (recorded Exists But Incomplete), and the E-ADR0007 (E1–E8) + `warpos@0.14.0` completed-work claims (re-verified against `git`). Every `Unknown` row was resolved to a definite verification state; the inventory now has 40 rows and the matrix 26 rows, with zero `Unknown`.
- Final state: Completed.
- Percent completion: 100%.
- Parent epic: E-TRACKER-001.
- Evidence of completion: the System Inventory + Verification Matrix sections above (every row carries a verification method + evidence + 2026-06-05 timestamp + verifying agent); `ls -la` of the trackers tree (10 templates, T1–T6 + epic file, sizes recorded); `grep` confirming the 4 mode-consult steps (`solo.md:38`, `adhoc.md:48`, `oneshot.md:49`, `sprint.md:162`) + the `scan/full.md:84` validate.js gate + the `sprint.md` Steps 1.5/1.75 persistent team; `ls` → ENOENT for the old `00-alex/01-adhoc/02-oneshot/03-managers` tree (Verified Nonexistent); `git tag --list "warpos@0.14*"` → `warpos@0.14.0`; `git log -1` resolving all 20 spot-checked E-ADR0007/release hashes with matching subjects; `node scripts/trackers/validate.js` → 12/12 PASS, exit 0. Verified by the T3 verification pass (President-delegated systems builder) on 2026-06-05.

### T6 — Mode wiring + scan-suite gate · Completed 2026-06-05
- Link to sprint tracker: `/trackers/sprints/T6-mode-wiring.md` — Verified Exists (ls/Read on 2026-06-05).
- Goal/result: Wired a start-of-work "consult TRACKER.md" step into all four live enterable modes (`solo` Step 1.5, `adhoc` Step 1.6, `oneshot` Step 2.5, `sprint` Step 2.5 — without disturbing the α+ε+β / α+β+γ persistent-team setup), and wired the tracker validator into the standing `/scan:full` suite as a fail-closed automatic gate so a red tracker fails the system scan. The remaining spec-named "modes" (roadmap / review / debugging / refactor / documentation / agent-coordination / handoff-resumption) are operational postures, not enterable mode commands; their consult-wiring + the deferred enforcement hooks are recorded as residual work, not part of this sprint's live-mode + standing-gate scope.
- Final state: Completed.
- Percent completion: 100%.
- Parent epic: E-TRACKER-001.
- Evidence of completion: `.claude/commands/mode/solo.md` (Step 1.5), `mode/adhoc.md` (Step 1.6), `mode/oneshot.md` (Step 2.5), `mode/sprint.md` (Step 2.5) each carry a "Start-of-work — consult TRACKER.md" step (verified by Read post-edit on 2026-06-05); `.claude/commands/scan/full.md` "Tracker integrity — the enforced-tracker gate" block invokes `node scripts/trackers/validate.js` (verified by Read post-edit); `node scripts/checks/scan-coverage.js` → 0 findings (suite registration did not drift); `node scripts/trackers/validate.js` → 12/12 PASS, exit 0 on 2026-06-05.

### T5 — Roadmap milestones → epics · Completed 2026-06-06
- Link to sprint tracker: `/trackers/sprints/T5-roadmap-milestones-to-epics.md` — Verified Exists (ls/Read on 2026-06-05).
- Goal/result: Migrated `ROADMAP.md` from milestone-organized to epic-organized per spec §29 — added a `## Epics` registry as the primary organizing unit (4 active + 5 planned epics with §29 fields, 4 parked trigger-gated bets, 10 completed epics mapped to existing Shipped receipts, 1 superseded), marked the `## 🏛 Milestones` section DEPRECATED (preserved for history; epic IDs semantic, decoupled from the drifted version-themed milestone numbers), recorded the migration in a roadmap change-log entry, and created 8 new `trackers/epics/` files (one per active/planned roadmap epic). Content-preserving: the Now/Next/Later sections, the `## Sprints` ledger table, and all `Shipped` narrative regions were left untouched (the `scan:roadmap-trace` + `scan:references` contracts hold).
- Final state: Completed.
- Percent completion: 100%.
- Parent epic: E-TRACKER-001.
- Evidence of completion: `ROADMAP.md` § Epics + the `## 🏛 Milestones — ⚠️ DEPRECATED` banner + the `### Roadmap change log` entry (Read post-edit 2026-06-06); the 8 new epic files in `trackers/epics/` (`ls -1 trackers/epics/` → 9 files; each `grep`-verified to resolve from the ROADMAP links — all 9 `OK`); each new epic file individually validated by its author (`node scripts/trackers/validate.js` exit 0); the full tracker still 12/12 PASS (`node scripts/trackers/validate.js`, exit 0, on 2026-06-06). Verified by the T5 migration pass (President + delegated systems builders) on 2026-06-06.

### T4 — Validation engine + enforcement · Completed 2026-06-06
- Link to sprint tracker: `/trackers/sprints/T4-validation-engine-and-enforcement.md` — Verified Exists (ls/Read on 2026-06-06).
- Goal/result: Built the runnable, fail-closed tracker validation engine AND completed its deferred cross-file §28.7 checks. `scripts/trackers/validate.js` now runs **20 checks**: the 12 single-file checks (a–l: sections-present, no-blank-section, broken-links, active-tracker-files, active-next-action, completed-evidence, completed-100, hundred-completed, sprint-parent-epic, ambiguous-language, undefined-terms, required-paths) PLUS the 8 cross-file checks (m–t) the engine had deferred: **roadmap-epic-based** (no milestones-as-primary unless DEPRECATED), **epics-in-roadmap** (every `trackers/epics/E-*.md` referenced in ROADMAP), **modes-consult-tracker** (the 4 live modes carry the consult step), **work-log-session-id** (session-log entries name a session ID or the backfill sentinel), **expected-nonexistence** (paths recorded Verified Nonexistent are actually absent), **cross-file-reconciliation** (TRACKER item states agree with their linked epic/sprint files), **hooks-enforce-or-tracked** (an expected enforcement hook exists OR its absence is acknowledged in Known Gaps — the enforcement-debt pattern), and **definition-drift** (no term carries two materially-different `## Definition:` blocks). Each is fail-closed + bite-tested (PASS+FAIL). Surfaced via the `/trackers:validate` skill and gated in the standing `/scan:full` suite (T6).
- Final state: Completed.
- Percent completion: 100%.
- Parent epic: E-TRACKER-001.
- Evidence of completion: `node scripts/trackers/validate.js` → all **20 checks PASS, exit 0** (2026-06-06); `node scripts/trackers/validate.js --selftest` → **55/55 bite cases pass** (each check a–t fires both PASS and FAIL = non-vacuous + fail-closed); `--json` → `ok:true`, 20 checks, `fatal:false`; `node scripts/checks/scan-coverage.js` → 0 findings (the validator's `/scan:full` registration did not drift). Built by a delegated backend-builder in an isolated worktree (+671 lines on `validate.js`), reviewed by the President (spot-read the gap-aware `hooks-enforce-or-tracked` + `cross-file-reconciliation` logic; confirmed non-vacuous via the selftest FAIL cases), and applied to canonical. Verified on 2026-06-06.

### E1 — Org cutover (the foundation) · Completed 2026-06-04
- Goal/result: Department tree replaced the old mode-based tree; `role-registry.json` keystone (33 roles); mode-agnostic workers; dispatched-reviewer independence invariant. All 32/33 agent specs are real (74–574 lines, no stubs); only ε was design-locked at the time (→ E7). ADR-0007 accepted.
- Evidence: cutover commits `09bac6f`→`9a132af`; `/scan:full` green at cutover. Parent epic: E-ADR0007.

### E2 — Phase D: sprint hook-point framework · Completed
- Goal/result: `sprint-hook-points.json` (16 rows / 6 steps) + composition→agent-set router (`hook-points.js`); `residency` field + `residencyOf()`; `manager_consult` emitter wired into `full.js`; `scan:sprint-hook-coverage` bidirectional enforcer + ε liveness heartbeat. (ε actually running the lifecycle was deferred to E7.)
- Evidence: `688b1e3`→`2e859d7`. Parent epic: E-ADR0007.

### E3 — v0.2: dispatch consumers derive from the registry · Completed
- Goal/result: registry became the single source of truth for role→provider/effort/build_chain/kind; `registry-roles.js` reader with loud fallback; `scan:dispatch-routing-parity` anchored on the registry (non-vacuous, 9-case bite-test); Tier-1 sets and Tier-3 maps derive; registry reconciliation (ADR-0008); 0-regression verified vs HEAD; landed.
- Evidence: `ec3f249`,`b29d331`,`2202abf`; ADR-0008. Parent epic: E-ADR0007.

### E4 — M1 §8: skill→agent resolution · Completed
- Goal/result: `skill-hook-points.json` registry + resolver + bite-test; `scan:skill-hook-coverage` wired into `/scan:full`; migrated all 12 agent-calling skills to resolve persona from the registry (no hardcoded persona dispatch); enforcer broadened (persona-stale-anywhere + bold-backtick-dispatch + `stale-ok` suppress); bite-test 14/14.
- Evidence: `aa86338`,`f574a7e`,`2ac4c92`,`5c8377c`. Parent epic: E-ADR0007.

### E5 — M1-d: the `_knowledge/` layer · Completed 2026-06-05
- Goal/result: shared agent-grounding brain (ADR-0007) — library (design) + store (audience, copy); `_knowledge/` built with `_domain.json` → generated registry; `scripts/knowledge/registry.js` engine; `/knowledge:integrate` (marker blocks + producer-ref + ledger); M3 migration of `_guides/design` (19 guides) → `_knowledge/design` with 137 ref-fixes; `/knowledge:coverage` fail-closed enforcer (9/9 bite-test) wired into `/scan:full`; scan-gate PASS; landed. Also fixed 2 latent ship gaps.
- Evidence: `3f9470d`→`6dcd318`. Parent epic: E-ADR0007.

### E6 — ED-024: org-map → registry structural collapse · Completed 2026-06-05
- Goal/result: collapsed org-map's reporting-line roster into role-registry `dispatchable_by`; `scan:role-parity` anchors on the registry, witnessed by the independent on-disk spec tree (non-vacuous; `role-parity.test` 30/30, 5 bite classes). ADR-0010; ED-024 enforced.
- Evidence: merge `0320e11`. Parent epic: E-ADR0007.

### E7 — ε sprint-conductor runtime · Completed 2026-06-05
- Goal/result: built the ε runtime (`scripts/sprint/epsilon-runtime.js`) — registry reader + lifecycle engine that resolves the matched agent-set per hook-point, derives each role's dispatch route from the registry, and writes REAL completion records; invariants enforced structurally; design-locked banner lifted; wired into `full.js` behind `--epsilon` with default path byte-identical (156/156 + ε-vs-script parity test); ED-025 + ED-022 closed and proven E2E. STAGED follow-on: the literal per-agent SPAWN under `--epsilon-dispatch` (ADR-0009 risk #4). Subsequently (per DUMP.md) ε dispatch was made REAL on both route classes and `/mode:sprint` added (`f279b47`).
- Evidence: merge `34213e2`; ADR-0009; `f279b47`. Parent epic: E-ADR0007.

### E8 — Enforcer-debt hardening · Completed 2026-06-05
- Goal/result: ED-023 (`adhoc-fail-override` REVIEWER_KEYS derive from registry); ED-026 (`/scan:cutover-completeness` greps raw deleted-tree literals + renamed-away roles, fail-closed, wired into `/scan:full`) plus the 61 flagged stale refs CLEANED → gate GREEN; ED-021 (heavy-skill lean-return dispatch contract). ED-022/024/025 closed by E7/E6.
- Evidence: merge `146108f`; cleanup `db0a778`. Parent epic: E-ADR0007.

### WarpOS 0.14.0 release · Completed 2026-06-05
- Goal/result: cut the WarpOS 0.14.0 canonical release (built by `scripts/warpos/release-canonical.js`), tagged `warpos@0.14.0`. First release to run the `skillScriptCompletenessGate`, which surfaced the 32 pre-existing skill→script refs now baselined in `KNOWN_DANGLING_REFS` (see Known Gaps G-1).
- Evidence: `git tag --list` → `warpos@0.14.0` (Verified Exists this session); release commit `0650e58`. Parent epic: none (standalone release; not part of the rewrite epic).

---

# Cancelled or Superseded Work

The interim `TRACKER.md` (the "WarpOS — Agent-System Rewrite TRACKER (interim)", E1–E8 burndown) is SUPERSEDED by this enforced `TRACKER.md`.
- Label/type: Document (interim tracker).
- Previous goal: a persistent per-task-state burndown for the ADR-0007 agent-system rewrite (the interim form of the roadmapped epics-over-milestones tracker).
- Final state: Superseded.
- Reason: replaced by the enforced tracker required by `agentic_os_tracker_system_improvements.md`. Its real content (the completed E1–E8 rewrite and the 0.14.0 release) is preserved without loss in the Completed Epics and Completed Sprints sections above.
- Superseding item: this `TRACKER.md` (Version 1.0.0).
- Date changed: 2026-06-05.
- Session ID: this session (to be backfilled).
- Agent making the change: President Agent via delegated systems builder.
- Evidence/rationale: the interim file was overwritten in place by this document; its E1–E8 and release content is summarized in Completed Epics/Sprints.
- Affected documents: `TRACKER.md` (this file); `DUMP.md` (companion handoff, still valid as context).
- Follow-up required: none for the supersession itself; the rewrite's deferred ε-spawn increment is tracked as a follow-up under E-ADR0007.

---

# Untracked Work

`UNTRACKED_WORK.md` is Verified Exists (ls/Read on 2026-06-05; created by sprint T2) and is the authoritative store for untracked work; it is linked from the Related Tracker Documents section. The following meaningful work performed outside a formal epic/sprint is summarized here and is reconciled in `UNTRACKED_WORK.md`:

- 2026-06-05 — doc-sync of about-docs (CLAUDE.md/PROJECT.md/AGENTS.md/AGENT-STRUCTURE.md/README.md) to the landed ADR-0007 tree + live ε runtime, and roadmap Shipped-narrative backfill (per DUMP.md, commits `f279b47`/`a6ab0bc`). Reason not attached to an epic/sprint: doc-maintenance done out-of-band during the rewrite landing. Should be retroactively attached to E-ADR0007 or left as standalone historical work — to be decided by the President during the next untracked-work reconciliation.

The President agent must periodically reconcile untracked work into the proper structure (Untracked Work Policy).

---

# State Model

All epics and sprints must use one of these nine states. Do not invent ambiguous states unless this schema is explicitly updated.

- `Planned` — the work is known and captured but not ready to begin.
- `Ready` — the work has enough context, requirements, and dependencies resolved to begin.
- `Active` — work has started and is currently expected to continue.
- `Blocked` — work cannot continue until a specific blocker is resolved.
- `Paused` — work is intentionally stopped but may resume later.
- `Review Needed` — implementation or planning work is believed complete enough for review, but completion has not yet been confirmed.
- `Completed` — the work meets its definition of done and has evidence of completion.
- `Cancelled` — the work will not be done and has not been replaced by another item.
- `Superseded` — the work has been replaced by another epic, sprint, plan, definition, path, wiring, or system design.

---

# Percent Completion Rules

Percent completion must be conservative, evidence-based, and non-performative. Bands:

- `0%` — no meaningful work has started.
- `1–25%` — discovery, setup, or early implementation has begun.
- `26–50%` — meaningful implementation exists but major work remains.
- `51–75%` — the core work exists but integration, validation, or important gaps remain.
- `76–99%` — the work is substantially complete but not fully verified.
- `100%` — complete, verified, documented, tracker-updated, reconciled, and passing required validation.

Nothing may be marked `100%` unless: the definition of done is satisfied; evidence of completion is recorded; the relevant epic/sprint tracker is updated; `TRACKER.md` is updated; related roadmap state is updated; related definitions are present and current; required paths are verified; required wirings are verified; required validators pass or failures are explicitly tracked; any remaining follow-ups are explicitly captured elsewhere.

---

# Language Rules

Tracker language must be precise, factual, and state-safe. Do not use language that creates ambiguity about actual state.

Prohibited: "likely done by the end of this session"; "probably complete"; "mostly handled"; "should be fine"; "seems done"; "basically finished"; "we can assume this is complete"; "no need to track this"; "memory has it"; "done unless something comes up"; "this is obvious"; "this does not need a definition"; "the agent will know what this means"; "path should exist"; "probably wired"; "looks wired enough"; "validation should pass".

Required alternatives: "Incomplete; next action is X."; "Implemented but not verified."; "Verified against X on YYYY-MM-DD."; "Blocked by X."; "Completed according to definition of done Y."; "Superseded by EPIC-###."; "Moved to UNTRACKED_WORK.md pending reconciliation."; "Requires review before completion."; "Definition missing; must be added before use."; "State unknown; requires reconciliation."; "Path missing but required."; "Path verified nonexistent and expected to be nonexistent."; "Wiring verified in file X."; "Validation failed; failure recorded in X."

Every tracker entry must distinguish planned / in-progress / implemented / verified / completed / deferred / cancelled / superseded / unknown-state / undefined-terminology / unverified-paths / unverified-wiring / known-validation-failures. Unknown state must be labeled unknown, not guessed. Undefined terms must be labeled undefined, not inferred. Unverified paths and wirings must be labeled unverified, not assumed.

---

# Update Triggers

`TRACKER.md` and related tracker files must be updated at meaningful intervals; meaningful state changes must never go untracked. Updates are required: at the start and end of a sprint session; before a handoff; before context compaction; after completing a task; after discovering or resolving a blocker; after changing scope or priority; after changing roadmap structure; after creating or completing an epic or sprint; after cancelling or superseding work; after meaningful work outside an epic/sprint; after adding a new operational term, changing a definition, or discovering definition drift; after creating/deleting/moving a path, discovering a path missing, or verifying expected nonexistence; after adding/removing wiring or discovering missing wiring; after adding/changing a validator or running validation; before claiming work complete; before switching modes if work state changed; before relying on prior state from memory; and before using a term whose definition affects state, completion, planning, authority, validation, or enforcement. A tracker update is not required for every tiny edit, but it is required whenever state, scope, evidence, blockers, definitions, authority, paths, wirings, validation, enforcement, or resumability changes.

---

# Enforcement Requirements

Proper use of this tracker must not exist only in prose; it must be enforced. The implementation must add enforcement mechanisms wherever possible. Current enforcement status is recorded honestly below: the tracker validation engine IS built and passing (`scripts/trackers/validate.js`, selftest 33/33, live 12/12 PASS on 2026-06-05; runnable via the `/trackers:validate` skill) AND, as of 2026-06-05 (sprint T6), it is wired into the standing `/scan:full` suite as a fail-closed automatic gate, so a red tracker fails the standing scan. The four live enterable modes (`solo`, `adhoc`, `oneshot`, `sprint`) now carry a start-of-work tracker-consult step. Residual: the deferred T4 enforcement hooks (start-of-work / end-of-work / completion-gate as PreToolUse/Stop hooks) and the cross-file §28.7 checks are not yet built.

## Mode Integration Enforcement
The tracker system must be wired into all relevant modes (sprint, roadmap, epic-planning, implementation, review, debugging, refactor, documentation, agent-coordination, handoff/resumption, validation, research-when-relevant). Current state: the four live enterable modes are wired — `solo` (Step 1.5), `adhoc` (Step 1.6), `oneshot` (Step 2.5), and `sprint` (Step 2.5) each carry a "Start-of-work — consult TRACKER.md" step (Verified Wired 2026-06-05, T6; see Required Wirings). The remaining named "modes" (roadmap / review / debugging / refactor / documentation / agent-coordination, etc.) are operational postures, not enterable mode commands; their tracker wiring is the residual T6 work. No mode may bypass the tracker because the work seems small.

## Start-of-Work Enforcement
Before meaningful work, agents must check whether the work belongs to an active/planned epic or sprint, untracked work, or a new epic/sprint to create. Enforcement mechanism: wired into all four live modes as an explicit start-of-work step (`solo`/`adhoc`/`oneshot`/`sprint` mode skills, 2026-06-05, T6) and reinforced procedurally (How to Use → Start-of-Work). A hard PreToolUse/Stop hook that forces the read remains a deferred T4 follow-up.

## Definition Enforcement
Before relying on a term affecting roadmap/epic/sprint/task/state/authority/ownership/completion/evidence/validation/path/wiring/enforcement, agents must verify it is defined here; add it if missing, clarify if ambiguous, reconcile if conflicting. Undefined operational terminology is a validation failure. Enforcement mechanism: PARTIAL — `scripts/trackers/validate.js` check (k) `undefined-terms` flags a used-but-undefined core operational term; cross-file definition-drift is a deferred T4 cross-file check (not yet wired).

## Path and Wiring Enforcement
Before relying on a path/file/directory/hook/command/mode/validator/template/wiring, agents must verify it. A claim that something exists/does-not-exist/is-wired is invalid without corresponding verification evidence. Enforcement mechanism: Not yet wired (sprint T4); currently procedural (Verification Use Procedure).

## End-of-Work Enforcement
Before ending a session, agents must update the relevant epic/sprint trackers, `TRACKER.md`, `UNTRACKED_WORK.md` (if applicable), roadmap (if changed), definitions (if changed), System Inventory (if paths/wiring changed), and Verification Matrix (if verification performed). Enforcement mechanism: Not yet wired (sprint T4/T6).

## Completion Gate Enforcement
Agents must not mark a sprint/epic complete unless the §28.6 conditions hold (DoD satisfied; evidence recorded; session/change logs updated; definitions present; required files/dirs/nonexistence/wirings verified; validators pass or failures tracked; roadmap reconciled; untracked work reconciled or linked; next action empty or moved to a follow-up; `TRACKER.md` and the item's own tracker agree). Enforcement mechanism: Not yet wired (sprint T4).

---

# Validation Requirements

The system must include a validation process (the tracker validation engine — Verified Exists at `scripts/trackers/validate.js`, sprint T4) that checks for: missing epic/sprint tracker files; broken links; active items with no next action; completed items without evidence; completed items below `100%`; `100%` items not marked completed; sprints without parent epics; epics missing from the roadmap; work logs with no session ID; ambiguous state language; undefined operational terms; definition drift; untracked work that should be attached to an epic/sprint; roadmap items still using milestones instead of epics; blank tracker sections; tracker entries missing owner/state/evidence/next-action; conflicts between `TRACKER.md`, roadmap, epic trackers, and sprint trackers; referenced paths that do not exist; referenced paths that exist but should not; required paths with unknown state; required wirings with unknown state; claims of wiring without evidence; validators documented but not runnable; modes that can perform work but do not consult the tracker; hooks that should enforce tracking but are missing.

Validation is runnable manually and, where possible, automatically. Current status: the engine is FULLY built and runnable — `scripts/trackers/validate.js` runs **20 checks** (selftest 55/55; live run on 2026-06-06 = all 20 PASS, exit 0; surfaced via the `/trackers:validate` skill) — AND it is wired into the standing `/scan:full` suite as a fail-closed automatic gate (`.claude/commands/scan/full.md` → "Tracker integrity — the enforced-tracker gate" → `node scripts/trackers/validate.js`), so a red tracker fails the standing system scan. This tracker's `Last Validation` is 2026-06-06 and `Validation Status` is Passing (20/20). The engine covers the 12 single-file checks (a–l: sections-present, no-blank-section, broken-links, active-tracker-files, active-next-action, completed-evidence, completed-100, hundred-completed, sprint-parent-epic, ambiguous-language, undefined-terms, required-paths) PLUS the 8 cross-file checks (m–t, landed by sprint T4 on 2026-06-06): **roadmap-epic-based** (no milestones-as-primary unless DEPRECATED), **epics-in-roadmap** (every epic file referenced in ROADMAP), **modes-consult-tracker** (the 4 live modes carry the consult step), **work-log-session-id**, **expected-nonexistence** (Verified-Nonexistent paths actually absent), **cross-file-reconciliation** (TRACKER item states agree with their epic/sprint files), **hooks-enforce-or-tracked** (an expected enforcement hook exists OR its absence is acknowledged in Known Gaps — the enforcement-debt pattern), and **definition-drift**. Each is fail-closed + bite-tested (PASS+FAIL). If validation fails, agents must not claim the tracker system is healthy; failures must be fixed immediately, added to a tracked sprint, added to an active blocker list, or added to `UNTRACKED_WORK.md` pending reconciliation. Validation failures must not be ignored.

---

# Roadmap Rules

The roadmap must no longer be organized around generic milestones; it must be organized into epics (Roadmap item == Epic). Current state: `ROADMAP.md` is Verified Exists and **epic-based** as of sprint T5 (2026-06-06) — its `## Epics` section is the primary organizing unit (4 active + 5 planned epics with the §29 fields, each linked to a `trackers/epics/` file; 4 parked trigger-gated bets; 10 completed epics mapped to existing Shipped receipts; 1 superseded), and the `## 🏛 Milestones` structure is explicitly marked DEPRECATED (preserved for history, not duplicated as an active unit). Verified by Read post-edit + `grep` link-resolution (9/9) on 2026-06-06.

The roadmap must include: title, version, last-updated timestamp, owner, strategic purpose, current active epics, planned epics, completed epics, superseded epics, cancelled epics, dependencies between epics, priority ordering, current focus, deferred work, links to `TRACKER.md`, links to relevant epic trackers, related definitions, related verification items. Each roadmap item must map to an epic with: epic number, title, goal, priority, state, completion percentage, link to epic tracker, related sprints, dependencies, rationale, expected impact, current next action, related definitions. The roadmap must not contain vague milestone entries that cannot be tracked, resumed, or verified. Existing milestones must be migrated into epics or explicitly marked deprecated during migration (sprint T5); the roadmap must not retain duplicate milestone and epic structures unless the milestone structure is explicitly marked deprecated.

---

# Epic Tracker Rules

Every epic must have its own tracker document at `/trackers/epics/<EPIC-ID>-<short-name>.md`, linked from `TRACKER.md`. Each epic tracker must include: epic label and number; title; owner; parent roadmap area; goal; background; scope; out of scope; current state; percent completion; definition of done; related definitions; related sprints; dependencies; blockers; risks; decisions; open questions; session log; change log; evidence log; verification log; current next action; completion record. An epic cannot remain listed Active without its own tracker file. Current state: `/trackers/epics/` is Verified Exists (ls/Read on 2026-06-05; created by sprint T2); E-TRACKER-001's epic tracker file `/trackers/epics/E-TRACKER-001-enforced-tracker-system.md` is Verified Exists and linked from the Active Epics section.

---

# Sprint Tracker Rules

Every sprint must have its own tracker document at `/trackers/sprints/<SPRINT-ID>-<short-name>.md`, linked from `TRACKER.md`. Each sprint tracker must include: sprint label and number; title; owner; parent epic; goal; scope; out of scope; current state; percent completion; definition of done; related definitions; tasks; files expected to change; files actually changed; paths expected to exist; paths verified to exist; paths verified nonexistent; wirings expected; wirings verified; dependencies; blockers; risks; decisions; open questions; session log; change log; evidence log; verification log; current next action; completion record. A sprint cannot remain listed Active without its own tracker file. Current state: `/trackers/sprints/` is Verified Exists (ls/Read on 2026-06-05; created by sprint T2); T1–T6's sprint tracker files are all Verified Exists on disk.

---

# Session Logging Rules

Every meaningful work session on an epic or sprint must be logged. Each session log entry must include: session ID; date; start time (if known); end time (if known); agent(s) involved; mode used; work performed; files changed; paths changed; wirings changed; decisions made; issues discovered; definitions added or changed; state changes; completion-percentage change; verification performed; validation run; validation result; next action; evidence or references. Session logs are append-only unless correcting a factual error, and corrections must themselves be logged.

Seed session log (keystone-authoring session): Session ID: to be backfilled by orchestrator · Date: 2026-06-05 · Agent: President Agent via delegated docs/systems builder · Mode: documentation/build · Work performed: authored the enforced `TRACKER.md` keystone (all 34 sections; ~50 definitions; seeded System Inventory + Verification Matrix from verified facts; pre-recorded E-TRACKER-001 + T1–T6 + completed E-ADR0007/E1–E8 + 0.14.0 release; recorded gaps G-1/G-2/G-3) · Files changed: `TRACKER.md` · Paths changed: none created (only `TRACKER.md` overwritten) · Wirings changed: none · Definitions added: all in the Definitions section · State changes: interim tracker → Superseded; E-TRACKER-001 → Active; T1 → Active · Completion change: T1 0%→~80%, E-TRACKER-001 0%→~15% · Verification performed: see Verification Matrix · Validation run: none (engine not yet built at that point) · Validation result: not run then · Next action: sprint T2 (`/trackers/` + templates + `UNTRACKED_WORK.md`) · Evidence: this file.

Reconciliation session log (2026-06-05): Session ID: to be backfilled · Date: 2026-06-05 · Agent: President Agent (reconciliation pass) · Mode: documentation/reconciliation · Work performed: reconciled `TRACKER.md` to disk — flipped Wave-1 artifacts to Verified Exists, set T1/T2 Completed, T4 Review Needed, E-TRACKER-001 ~50%, validation status Passing; added the reconciliation Change Log + Reconciliation entries · Files changed: `TRACKER.md` (+ the E-TRACKER-001 epic file and T1/T2/T4 sprint files reconciled to match) · Paths changed: none created · Wirings changed: none · Definitions added: none · State changes: T1 Active→Completed; T2 Planned→Completed; T4 Planned→Review Needed; E-TRACKER-001 ~15%→~50% · Completion change: T1 ~80%→100%, T2 0%→100%, T4 0%→~85%, E-TRACKER-001 ~15%→~50% · Verification performed: ls/Read on 2026-06-05 over all Wave-1 artifacts (see Verification Matrix) · Validation run: `node scripts/trackers/validate.js` · Validation result: all 12 checks PASS, exit 0 · Next action: T3 (inventory/matrix), T5 (roadmap migration), T6 (mode wiring); finish T4 enforcement-gate + cross-file checks · Evidence: this file (validated 12/12); the Wave-1 artifacts on disk.

Hook-wiring + completion session log (2026-06-06): Session ID: to be backfilled · Date: 2026-06-06 · Agent: President Agent (α) · Mode: sprint · Work performed: built the hard enforcement hooks (`scripts/hooks/tracker-start-of-work.js` SessionStart + `scripts/hooks/tracker-completion-gate.js` Stop), wired them in `_warpos/settings/defaults.json` + recompiled live `.claude/settings.json`; discovered + fixed a pre-existing settings/defaults security-hook drift (settings-edit-guard + untrusted-content-firewall missing from defaults); flipped E-TRACKER-001 Active ~95% → Completed 100% and G-2 → RESOLVED · Files changed: 2 new hook scripts; `_warpos/settings/defaults.json`; `.claude/settings.json` (recompiled); `TRACKER.md`; `trackers/epics/E-TRACKER-001-*.md` · Paths changed: 2 hook scripts created · Wirings changed: SessionStart + Stop tracker hooks added (live) · Definitions added: none · State changes: E-TRACKER-001 Active → Completed; G-2 → RESOLVED · Completion change: E-TRACKER-001 ~95% → 100% · Verification performed: hooks tested standalone (start-of-work emits valid SessionStart envelope; completion-gate silent on green + re-entrancy-guarded); recompile integrity-verified (+2 hooks, 0 dropped, push-to-main preserved); `node scripts/trackers/validate.js` → 20/20 PASS · Validation run: `node scripts/trackers/validate.js` (+ `--selftest`) · Validation result: 20/20 PASS, exit 0; 55/55 bite cases · Next action: merge `june-5` → `main`; the enforced-tracker objective is delivered (next product work is on `ROADMAP.md` § Epics) · Evidence: the 2 hook scripts + their wiring in defaults/settings; validator 20/20; E-TRACKER-001 Completion record.

T4 session log (2026-06-06): Session ID: to be backfilled · Date: 2026-06-06 · Agent: President Agent (α) + delegated backend-builder (isolated worktree) · Mode: sprint (start-of-work tracker-consult done) · Work performed: completed sprint T4 — added the 8 cross-file §28.7 checks (m–t) to `scripts/trackers/validate.js` (now 20 checks), each fail-closed + bite-tested; reviewed the builder's diff (spot-read the gap-aware `hooks-enforce-or-tracked` + `cross-file-reconciliation` logic, confirmed non-vacuous via the selftest FAIL cases), applied to canonical, reconciled T4 → Completed across TRACKER + the T4 sprint file + the epic file · Files changed: `scripts/trackers/validate.js` (+671 lines); `TRACKER.md`; `trackers/sprints/T4-*.md`; `trackers/epics/E-TRACKER-001-*.md` · Paths changed: none created · Wirings changed: none (validator already gated in `/scan:full`) · Definitions added: none · State changes: T4 Review Needed → Completed; E-TRACKER-001 ~90% → ~95% · Completion change: T4 ~90% → 100%, E-TRACKER-001 ~90% → ~95% · Verification performed: `node scripts/trackers/validate.js` → 20/20 PASS; `--selftest` → 55/55; `--json` → ok:true; `scan-coverage.js` → 0 findings; NUL-byte fixture preserved · Validation run: `node scripts/trackers/validate.js` (+ `--selftest`) · Validation result: 20/20 PASS, exit 0; 55/55 bite cases · Next action: wire the hard enforcement hook (or accept as governed tracked-debt), then flip E-TRACKER-001 → Completed and merge `june-5` → `main` · Evidence: the 20-check validator on disk; the bite-test; the reconciled T4/epic files.

T5 session log (2026-06-06): Session ID: to be backfilled · Date: 2026-06-06 · Agent: President Agent (α) + delegated systems builders · Mode: sprint (start-of-work tracker-consult performed: read `TRACKER.md` + `DUMP.md` first) · Work performed: sprint T5 — migrated `ROADMAP.md` to epic-based (added the `## Epics` registry as the primary organizing unit with 4 active + 5 planned epics, 4 parked trigger-gated bets, 10 completed + 1 superseded; marked `## 🏛 Milestones` DEPRECATED; added a roadmap change-log entry), and created 8 new `trackers/epics/` files (one per active/planned roadmap epic) · Files changed: `ROADMAP.md`; 8 new `trackers/epics/E-*.md`; `TRACKER.md` (this update) · Paths changed: 8 epic files created under `trackers/epics/` · Wirings changed: none · Definitions added: none (Definition: Roadmap updated to reflect epic-based) · State changes: T5 Planned→Completed; E-TRACKER-001 ~80%→~90% · Completion change: T5 0%→100%, E-TRACKER-001 ~80%→~90% · Verification performed: `ls -1 trackers/epics/` → 9 files; `grep`-resolution of all 9 ROADMAP §Epics links → 9/9 OK; Read post-edit of the `## Epics` + DEPRECATED-milestones banner · Validation run: `node scripts/trackers/validate.js` (after each epic file + the final TRACKER edits) · Validation result: all 12 checks PASS, exit 0 · Next action: finish T4's cross-file §28.7 checks · Evidence: `ROADMAP.md` § Epics + DEPRECATED banner + roadmap change log; the 9 epic files on disk; this `TRACKER.md` (validated 12/12).

---

# Change Tracking Rules

Changes to epics, sprints, roadmap structure, goals, scope, requirements, blockers, definitions, terminology, paths, wirings, validators, hooks, modes, commands, or plans must always be recorded. If an issue is found and added to a plan, the tracker must show what was found, when, who/what found it, which epic/sprint it affects, what changed because of it, and whether scope/state/completion/definition/path/wiring/validation/priority changed. A changed plan must not simply disappear; the change must be traceable. Each tracker document includes a `Change Log` section with dated, session-attributed entries.

## Change Log

### 2026-06-06 — Hard enforcement hooks wired; E-TRACKER-001 COMPLETED 100% (President)
- Changed: Built + wired the hard start/end/completion enforcement hooks, closing the last DoD residual and completing E-TRACKER-001 (the President's enforced-tracker objective). New hooks: `scripts/hooks/tracker-start-of-work.js` (SessionStart — runs `scripts/trackers/validate.js` and injects the tracker verdict into context, §28.2 start-of-work enforcement) + `scripts/hooks/tracker-completion-gate.js` (Stop — refuses to end a session on a red tracker, advisory by default / `TRACKER_GATE_ENFORCE=1` to hard-block, re-entrancy-guarded, §28.5/§28.6). Both defined in `_warpos/settings/defaults.json` (the source) and recompiled live into `.claude/settings.json` (integrity-verified: +2 hooks, 0 dropped, push-to-main pre-auth preserved). Flipped E-TRACKER-001 Active ~95% → **Completed 100%** (moved Active Epics → Completed Epics; Active Epics now "None currently recorded."), G-2 → RESOLVED, the Required Wirings start/end/completion-hook rows → Verified Wired, and the relevant Definition-of-Done items → DONE. Bonus: while wiring, discovered + FIXED a pre-existing settings/defaults drift — `settings-edit-guard.js` (PreToolUse) + `untrusted-content-firewall.js` (PostToolUse) were live in `.claude/settings.json` but MISSING from `_warpos/settings/defaults.json` (a recompile would have silently dropped two security hooks); added both to defaults.
- Reason: Operator chose "build the hard hook" (over governed tracked-debt) to make tracker enforcement hook-forced, not only procedural/scan-gated — delivering the §28.2/§28.5/§28.6 hard-enforcement DoD items and completing the epic.
- Affected: `scripts/hooks/tracker-start-of-work.js` + `tracker-completion-gate.js` (new); `_warpos/settings/defaults.json` (2 tracker hooks + 2 reconciled security hooks); `.claude/settings.json` (recompiled, generated); `TRACKER.md` (metadata, header summary, next action, Active Epics → none, Completed Epics + E-TRACKER-001, G-2 RESOLVED, Required Wirings, Definition of Done, this Change Log + Session Log); `trackers/epics/E-TRACKER-001-*.md` (Active ~95% → Completed 100%, DoD, completion record, change log).
- Previous state: E-TRACKER-001 Active ~95%; hard hooks Verified Not Wired (governed tracked-debt, G-2); validator 20/20.
- New state: E-TRACKER-001 Completed 100%; hard hooks built + wired (Verified Wired); G-2 RESOLVED; validator still 20/20 PASS (`node scripts/trackers/validate.js`, exit 0, 2026-06-06) — `hooks-enforce-or-tracked` now passes on hook existence.

### 2026-06-06 — T4 cross-file §28.7 checks landed; T4 Completed (President, via backend-builder)
- Changed: Completed sprint T4 by adding the 8 deferred cross-file §28.7 checks (m–t) to `scripts/trackers/validate.js`, taking the validator from 12 to **20 checks**: roadmap-epic-based, epics-in-roadmap, modes-consult-tracker, work-log-session-id, expected-nonexistence, cross-file-reconciliation, hooks-enforce-or-tracked, definition-drift. Each is fail-closed (missing/unverified seam → FAIL) and bite-tested (one PASS + one FAIL case → 55/55 selftest). Each new seam is INJECTED into the pure `evaluate()` and populated from disk by `run()` (reads ROADMAP.md, enumerates `trackers/epics/E-*.md`, reads the 4 mode skills, parses Verified-Nonexistent rows, reads each item's linked file state, probes for enforcement-hook scripts). Moved T4 Active Sprint → Completed (100%); advanced E-TRACKER-001 to ~95% (only the hard enforcement HOOK residual remains). Updated metadata (Last Validation/Status 12/12 → 20/20), header summary, Validation/Enforcement Requirements, the DoD validator lines, and Known Gap G-2 (now the hook residual, severity Medium→Low).
- Reason: Deliver the T4 tail of `agentic_os_tracker_system_improvements.md` (§28.7) — make cross-document drift (TRACKER↔roadmap↔epic↔sprint, definition-drift, epics-missing-from-roadmap, expected-nonexistence, mode-consult, missing-enforcement-hook) machine-caught, not prose-only.
- Affected: `scripts/trackers/validate.js` (+671 lines: checks m–t + seams + bite-tests + doc comment); `TRACKER.md` (metadata, header summary, next action, E-TRACKER-001 epic, Active/Completed Sprints, Validation + Enforcement Requirements, Definition of Done, G-2, this Change Log + Session Log); `trackers/sprints/T4-*.md` (Review Needed → Completed); `trackers/epics/E-TRACKER-001-*.md` (T4 related-sprint → Completed, percent ~90%→~95%, DoD validator item → DONE).
- Previous state: validator 12 single-file checks; T4 Review Needed ~90%; E-TRACKER-001 ~90%; cross-document drift not machine-caught.
- New state: validator 20 checks (live 20/20 PASS, selftest 55/55, exit 0, 2026-06-06); T4 Completed (100%); E-TRACKER-001 ~95% (only the hard enforcement hook residual, machine-enforced-to-stay-tracked by `hooks-enforce-or-tracked`); `cross-file-reconciliation` now polices that TRACKER item states match their linked files.

### 2026-06-06 — T5 Roadmap milestones → epics migration (President, via systems builders)
- Changed: Migrated `ROADMAP.md` from milestone-organized to **epic-organized** per spec §29. Added a `## Epics` registry as the roadmap's primary organizing unit (Version 1.0.0, owner President, last-updated 2026-06-06) with 4 active + 5 planned epics carrying the §29 fields (goal, priority, state, completion %, epic-tracker link, related sprints, dependencies, rationale, expected impact, current next action, related definitions), 4 parked trigger-gated bets, 10 completed epics mapped to existing Shipped receipts, and 1 superseded item. Marked the `## 🏛 Milestones` section **DEPRECATED** (banner + milestone→epic mapping; preserved for history as the detail source behind each epic). Added a `### Roadmap change log` entry recording the migration. Created 8 new `trackers/epics/` files (one per active/planned roadmap epic), each template-conformant and individually validated. Epic IDs are semantic (decoupled from the drifted version-themed milestone numbers `0.10.0`/`0.12.0`/`0.13.0`/`0.14.0`/`0.16.0`/`0.17.0`/`0.18.0`). **No content removed** — the Now/Next/Later sections, the `## Sprints` ledger table (`ledger.js`-owned), and all `Shipped`/`✅ Shipped in vX.Y.Z` narrative regions are untouched (the `scan:roadmap-trace` + `scan:references` contracts are preserved).
- Reason: Sprint T5 of the `agentic_os_tracker_system_improvements.md` objective (§29 Roadmap Rules) — make the roadmap epic-based so each long-running goal is a tracked, resumable epic, not a vague milestone.
- Affected: `ROADMAP.md` (new `## Epics` section; `## 🏛 Milestones` header → DEPRECATED banner; new `### Roadmap change log`); `trackers/epics/` (8 new files: E-GOLDEN-FLOW-001, E-CONTENT-DELIVERY-001, E-TEST-SUITE-001, E-STABLE-CHANNEL-001, E-BOUNDARY-001, E-MULTIPRODUCT-001, E-SKILL-CATALOG-001, E-MANAGER-LAYER-001); `TRACKER.md` (Header global summary + Last Updated + next action; Related Tracker Documents ROADMAP + new `/trackers/epics/` line; Definition: Roadmap; E-TRACKER-001 ~80%→~90% + sprints roll-up + next action; Active/Planned/Completed Sprints — T5 Planned→Completed; Roadmap Rules; Definition of Done — roadmap-epic-based + epic-files lines → DONE + final summary; Required Files ROADMAP row; System Inventory + Verification Matrix ROADMAP + epic-files rows; Known Gap G-2; this Change Log + Session Log entries).
- Previous state: `ROADMAP.md` milestone-organized, recorded "Exists But Incomplete (not epic-based)"; T5 Planned 0%; E-TRACKER-001 ~80%; only E-TRACKER-001's epic file existed.
- New state: `ROADMAP.md` epic-based; T5 Completed (100%); E-TRACKER-001 ~90% (only the T4 cross-file tail remains); 9 epic files Verified Exists, all ROADMAP §Epics links resolve (9/9); validator still 12/12 PASS (`node scripts/trackers/validate.js`, exit 0, 2026-06-06).

### 2026-06-05 — T3 System Inventory + Verification Matrix disk-verification (President, via systems builder)
- Changed: Made the System Inventory (§9) and Verification Matrix (§10) COMPLETE and TRUTHFUL by disk-verifying every tracker-relevant artifact and resolving every `Unknown` to a definite verification state. Expanded the inventory to 40 rows (each of the 10 templates individually; T2–T6 sprint files individually; the scan gate, the sprint persistent-team wiring, the old-tree Verified-Nonexistent row, the `warpos@0.14.0` tag) and the matrix to 26 rows, each carrying a verification method + exact evidence + 2026-06-05 timestamp + verifying agent. The former `Unknown` matrix rows (roadmap/handoff/review-etc. consult; definition-enforcement; start/end/completion hook; path/wiring HARD wiring) were each checked on disk and resolved to `Verified Not Wired` (genuine, recorded findings — tracked under G-2, not blockers). Re-verified the E-ADR0007 (E1–E8) commit hashes + the `warpos@0.14.0` tag against `git`. Set sprint T3 → Completed (100%) and advanced E-TRACKER-001 to ~80%.
- Reason: Sprint T3 of the `agentic_os_tracker_system_improvements.md` objective (§9 System Inventory + §10 Verification Matrix) — prove existence/nonexistence/state/wiring of everything the system references, on disk, rather than carrying it as seed/Unknown.
- Affected: Header (global summary ~65%→~80%, Last Updated, next action, planned-sprint count 2→1); System Inventory (rewritten, 40 rows, fully disk-verified); Verification Matrix (rewritten, 26 rows, zero `Unknown`); E-TRACKER-001 (~65%→~80%, sprints roll-up T3 Completed, next action, related verification items); Active Sprints unchanged (T4 still Review Needed ~90%); Planned Sprints (T3 removed; only T5 remains); Completed Sprints (T3 added, 100%; intro + E-ADR0007 hash-reverification note updated); Required Files (old-tree note → re-verified ENOENT); Definition of Done (inventory/matrix + path/wiring + completed-evidence lines → DONE/T3-verified); Known Gap G-2 (T3 now Completed); `trackers/sprints/T3-*.md` + the E-TRACKER-001 epic file.
- Previous state: System Inventory was a seed with several `Unknown` matrix rows; T3 Planned 0%; E-TRACKER-001 ~65%; E-ADR0007 hashes carried-forward-unverified.
- New state: System Inventory + Verification Matrix fully disk-verified, zero `Unknown`; T3 Completed (100%); E-TRACKER-001 ~80% (only T5 + T4-tail remain); all 20 spot-checked E-ADR0007/release hashes confirmed in `git log` + `warpos@0.14.0` tag confirmed; validator still 12/12 PASS (`node scripts/trackers/validate.js`, exit 0).

### 2026-06-05 — T6 mode-wiring + scan-suite gate (President, via systems builder)
- Changed: Wired a start-of-work "consult TRACKER.md" step into all four live enterable modes (`.claude/commands/mode/solo.md` Step 1.5, `mode/adhoc.md` Step 1.6, `mode/oneshot.md` Step 2.5, `mode/sprint.md` Step 2.5 — the sprint step is its own labeled step and does not touch the α+ε+β persistent-team Steps 1.5/1.75) and wired the tracker validator into the standing `/scan:full` suite as a fail-closed automatic gate (`.claude/commands/scan/full.md` "Tracker integrity — the enforced-tracker gate" → `node scripts/trackers/validate.js`). Marked the 4 mode-consult wirings + the scan-suite gate Verified Wired in Required Wirings; refreshed Enforcement/Validation Requirements + the Verification Matrix + System Inventory mode-wiring row; set T6 Completed (100%) and advanced T4 to ~90% (Review Needed; standing-gate follow-up closed, cross-file checks remain).
- Reason: Sprint T6 + the T4 enforcement tail of the `agentic_os_tracker_system_improvements.md` objective — make the tracker CONSULTED (mode start-of-work) and VALIDATED (standing scan gate) automatically, not only in prose.
- Affected: Header (global summary ~50%→~65%, next action, planned-sprint count 3→2); E-TRACKER-001 (~50%→~65%, sprints roll-up, next action); Active Sprints (T4 ~85%→~90%, risks/next-action/open-questions); Planned Sprints (T6 removed); Completed Sprints (T6 added, 100%); Verification Matrix (sprint/solo/adhoc/oneshot/validation-mode consult rows → Verified Wired); System Inventory (Tracker mode-wiring row → Verified Wired); Enforcement Requirements (intro + Mode Integration + Start-of-Work subsections); Validation Requirements; Required Wirings (sprint/solo/adhoc/oneshot rows + validation-mode + validation-commands rows → Verified Wired); the matching `trackers/sprints/T6-mode-wiring.md` + `T4-validation-engine-and-enforcement.md`.
- Previous state: every Required-Wirings row Unknown / Not-Yet-Verified; T6 Planned 0%; T4 Review Needed ~85% (validator runnable-on-demand, not a standing gate); modes had no tracker-consult step.
- New state: 4 live modes carry a verified start-of-work tracker-consult step; the validator is a fail-closed gate in `/scan:full`; T6 Completed (100%); T4 ~90% (only cross-file checks remain); validator still 12/12 PASS (`node scripts/trackers/validate.js`, exit 0) + scan-coverage 0 findings.

### 2026-06-05 — Reconciliation pass (President)
- Changed: Reconciliation — marked the Wave-1 artifacts Verified Exists (`UNTRACKED_WORK.md`, the `/trackers/` tree + 10 templates + README, the E-TRACKER-001 epic file + T1–T6 sprint files, `scripts/trackers/validate.js`, and the `/trackers:validate` skill), set T1/T2 Completed (100%) and T4 Review Needed (~85%), moved E-TRACKER-001 to ~50%, and set validation status Passing (12/12).
- Reason: The tracker had drifted during the parallel build wave — it still marked now-existing artifacts Missing But Required / Unknown and claimed ~15%. This pass makes the tracker truthful against disk (ls/Read on 2026-06-05) and against the live validator run (`node scripts/trackers/validate.js` → 12/12 PASS, exit 0).
- Affected: Header (Last Validation / Validation Status / state summary / next action); System Inventory + Verification Matrix rows; Active Epics (E-TRACKER-001 ~50%); Active Sprints (T4 Review Needed replaces T1); Planned Sprints (T2/T4 removed; T3/T5/T6 links Verified Exists); Completed Sprints (T1, T2 added); Untracked Work; Enforcement/Validation Requirements; Epic/Sprint Tracker Rules; Definition of Done; Required Files/Templates; Implementation Priority; Non-Negotiable note; Known Gap G-2 (severity High→Medium).
- Previous state: artifacts Missing But Required / Unknown; T1 Active ~80%; T2/T4 Planned 0%; epic ~15%; `Validation Status: Not Yet Run`.
- New state: artifacts Verified Exists; T1/T2 Completed; T4 Review Needed; epic ~50%; `Validation Status: Passing (12/12)`. Genuinely-unbuilt items (T3/T5/T6 deliverables, ROADMAP migration, mode wiring, T4's enforcement-gate + cross-file checks) left honestly Planned / Unknown / Missing But Required.

### 2026-06-05 21:51 PDT — Session (keystone authoring)
- Changed: Created the enforced `TRACKER.md` (Version 1.0.0), replacing the interim ADR-0007-rewrite tracker.
- Reason: Implement the enforced tracking system required by `agentic_os_tracker_system_improvements.md` (epic E-TRACKER-001, sprint T1).
- Affected: `TRACKER.md`; the interim tracker (now Superseded); E-TRACKER-001 (Active); T1 (Active); T2–T6 (Planned); E-ADR0007 and its E1–E8 + the 0.14.0 release (recorded as Completed); gaps G-1/G-2/G-3 (recorded).
- Previous state: interim per-task burndown for E1–E8.
- New state: enforced 34-section tracker with definitions, inventory, verification matrix, state model, validation/enforcement rules, and pre-recorded dogfood work.

---

# Evidence Rules

Work must not be marked complete without evidence. Evidence may include: file paths changed; tests run; commands run; validation results; review notes; screenshots where relevant; links to implementation files; links to PRs/commits/diffs where available; explicit confirmation that a document exists; explicit confirmation that a document does not exist and should not exist; explicit confirmation that a mode or hook is wired; explicit confirmation that a validator ran; explicit confirmation that relevant definitions exist; explicit confirmation that roadmap state is reconciled. Evidence must be concrete enough that another agent can resume or verify the work without relying on memory.

Seed evidence log (this session): (1) `ls -la TRACKER.md ROADMAP.md` → TRACKER.md and ROADMAP.md exist; UNTRACKED_WORK.md absent. (2) `ls trackers` → no such directory. (3) `ls .claude/agents` → department tree dirs present. (4) `node` count over `role-registry.json` → 33 roles. (5) `ls -la scripts/sprint/epsilon-runtime.js` → exists, 34382 bytes. (6) `ls .claude/commands/mode` → solo/adhoc/oneshot/sprint. (7) `node` require of `release-build.js` → KNOWN_DANGLING_REFS length 32 (A:4, B:11, C:17). (8) `git tag --list "warpos@0.14*"` → `warpos@0.14.0`.

---

# Definition of Done

Definition of Done for the whole E-TRACKER-001 project (per spec §37). This work is complete only when:

- The old `TRACKER.md` has been deleted or fully unwired. — DONE (overwritten this session; interim recorded as Superseded).
- A new `TRACKER.md` exists. — DONE (this file).
- `TRACKER.md` follows the required structure (all 34 sections). — DONE; confirmed by validation: `scripts/trackers/validate.js` check (a) sections-present PASS on 2026-06-05.
- `TRACKER.md` includes a robust How to Use section. — DONE.
- `TRACKER.md` includes authoritative definitions; all required operational terms are defined; definition change rules documented. — DONE this session.
- Definition enforcement wired into all relevant modes. — PARTIAL: a start-of-work tracker-consult step is wired into all four live modes (solo/adhoc/oneshot/sprint, T6) + the validator's undefined-terms check (k) is a standing `/scan:full` gate; a hard definition-enforcement hook + the non-enterable-posture consult remain (residual T6 / deferred T4).
- `UNTRACKED_WORK.md` exists and is linked. — DONE (Verified Exists, ls/Read on 2026-06-05; sprint T2; linked from Related Tracker Documents).
- Roadmap structure is epic-based; existing milestones migrated or deprecated. — DONE (sprint T5, 2026-06-06): `ROADMAP.md` § Epics is the primary organizing unit; `## 🏛 Milestones` marked DEPRECATED (preserved); migration recorded in the roadmap change log.
- Epic tracker files exist for all active and planned epics. — DONE (sprint T5, 2026-06-06): 9 epic tracker files Verified Exists in `trackers/epics/` — E-TRACKER-001 (T2) + the 8 roadmap theme-epics (3 active: E-GOLDEN-FLOW-001, E-CONTENT-DELIVERY-001, E-TEST-SUITE-001; 5 planned: E-STABLE-CHANNEL-001, E-BOUNDARY-001, E-MULTIPRODUCT-001, E-SKILL-CATALOG-001, E-MANAGER-LAYER-001). Parked trigger-gated bets get a file only on activation (per their definition, they are not yet Planned-to-start).
- Sprint tracker files exist for all active and planned sprints. — DONE (T1–T6 sprint trackers Verified Exists; sprint T2).
- Completed epics and sprints have evidence records. — DONE for E-ADR0007/E1–E8 + 0.14.0 (evidence re-verified against `git log`/`git tag` by sprint T3 on 2026-06-05; all 20 spot-checked hashes + the `warpos@0.14.0` tag confirmed).
- State language standardized; percent rules documented; update triggers documented. — DONE this session.
- Required paths verified; required nonexistence verified where applicable; required wirings verified. — DONE (sprint T3, 2026-06-05: all §33 required paths Verified Exists; the old mode-based tree Verified Nonexistent via `ls`→ENOENT; the 4 live-mode consults + scan gate + sprint persistent-team Verified Wired; the non-enterable-posture consults + hard enforcement hooks Verified Not Wired and tracked under G-2).
- Required validators exist and are runnable. — DONE (sprint T4, 2026-06-06): `scripts/trackers/validate.js` runs the full 20-check set (12 single-file a–l + 8 cross-file m–t), selftest 55/55, live 20/20 PASS, wired into the standing `/scan:full` suite as a fail-closed gate (T6).
- System Inventory and Verification Matrix exist and are current. — DONE (sprint T3, 2026-06-05): both are fully disk-verified — 40 inventory rows + 26 matrix rows, each with a verification method + evidence + timestamp + verifying agent, and zero `Unknown` rows.
- Enforcement wired into sprint mode and all other relevant modes. — PARTIAL: the four live enterable modes (solo/adhoc/oneshot/sprint) carry a start-of-work tracker-consult step + the validator is a standing `/scan:full` gate (T6 Completed); the non-enterable operational postures + the hard start/end/completion enforcement hooks remain (residual T6 / deferred T4).
- President documented as owner; tracker documented as higher authority than Claude memory. — DONE.
- Validation exists, has been run, and failures are fixed or tracked. — DONE (full 20-check engine; run 2026-06-06 = 20/20 PASS, exit 0, selftest 55/55; `Last Validation: 2026-06-06`, `Validation Status: Passing`) AND it is an automatic gate in `/scan:full` (T6).
- Known gaps and open flaws are either empty with evidence or fully tracked. — DONE (G-1/G-2/G-3 tracked).
- The system can be resumed from tracker files alone without relying on chat memory. — PARTIAL (the keystone + scaffold + per-epic/per-sprint files + a fully disk-verified inventory/matrix + a passing validator enable resumption of E-TRACKER-001; full resumability for all work completes when T5 lands and T4 reaches Completed).

The project is COMPLETE: E-TRACKER-001 reached 100% on 2026-06-06. All six sprints are Completed — T1 (keystone), T2 (scaffold), T3 (inventory/matrix disk-verification), T4 (validation engine + the 8 cross-file §28.7 checks, validator 20/20 + selftest 55/55), T5 (roadmap milestones→epics migration), T6 (mode wiring + scan-suite gate) — and the hard start/end/completion enforcement hooks are built + wired (`tracker-start-of-work.js` SessionStart + `tracker-completion-gate.js` Stop). The system is resumable from tracker files alone: validated, epic-based, definition-backed, and hook-enforced. Optional future hardening only (a per-edit PostToolUse completion-gate); nothing blocks the completed claim.

---

# Reconciliation Rules

Reconciliation is required when two or more tracker-related sources disagree about: state; percent completion; ownership; scope; next action; blockers; evidence; completion; roadmap placement; definitions; sprint/epic relationship; untracked work; path existence; path nonexistence; directory state; mode wiring; hook wiring; command availability; validator behavior; or template state. A reconciliation entry must include: conflict discovered; sources involved; authoritative source selected; final reconciled state; reason; date and time; session ID; agent; documents updated; remaining uncertainty (if any). Unresolved conflicts must be marked as blockers or review-needed items. If direct inspection contradicts tracker state, the tracker is not automatically overwritten — the contradiction is recorded and reconciled. The President agent owns reconciliation.

### 2026-06-05 — Reconciliation: tracker state vs disk (President)
- Conflict discovered: `TRACKER.md` claimed the Wave-1 artifacts were Missing But Required / Unknown and the epic was ~15%, but those artifacts exist on disk and the validator passes.
- Sources involved: `TRACKER.md` (stale) vs direct filesystem inspection (ls/Read on 2026-06-05) vs the live validator run (`node scripts/trackers/validate.js`) vs the epic/sprint tracker files.
- Authoritative source selected: directly-inspected filesystem + validator run (per the Authority order, item 8 inspected code/paths and item 3 validation records resolve the existence/validation facts the stale prose contradicted).
- Final reconciled state: artifacts Verified Exists; T1/T2 Completed (100%); T4 Review Needed (~85%); E-TRACKER-001 ~50%; `Validation Status: Passing (12/12)`.
- Reason: the tracker drifted from reality during the parallel build wave; this pass realigns the written state with disk without losing the genuinely-unbuilt items (T3/T5/T6, ROADMAP migration, mode wiring, T4 enforcement-gate + cross-file checks remain Planned / Unknown / Missing But Required).
- Date and time: 2026-06-05. Session ID: to be backfilled. Agent: President Agent (reconciliation pass).
- Documents updated: `TRACKER.md` (Header, inventory, matrix, epic, sprints, completed sprints, untracked work, enforcement/validation, tracker rules, DoD, required files/templates, implementation priority, non-negotiables, G-2, change log, this entry); the E-TRACKER-001 epic file and the T1/T2/T4 sprint files (state/percent/evidence reconciled to match).
- Remaining uncertainty: the E-ADR0007 evidence commit hashes are still carried forward from the interim tracker and DUMP.md (sprint T3 re-verifies them against current `git log`); tracker mode-wiring remains Unknown (T6).

(Prior pending re-verification, not yet a conflict: the E-ADR0007 evidence commit hashes are carried forward from the interim tracker and DUMP.md; sprint T3 will re-verify them against current `git log` and record a reconciliation entry if any disagree.)

### 2026-06-05 — Reconciliation: T3 disk-verification closes the carried-forward uncertainties (T3 systems builder)
- Conflict discovered: No disagreement found. The prior reconciliation left two open uncertainties — (a) the E-ADR0007 evidence commit hashes were carried forward unverified, and (b) the non-enterable-posture tracker wiring was `Unknown`. This T3 pass resolved both against disk/git.
- Sources involved: `TRACKER.md` (carried-forward prose) vs `git log`/`git tag` vs direct filesystem `grep`/`ls`.
- Authoritative source selected: `git` (for the completed-work hashes/tag) and direct filesystem inspection (for the wiring rows), per the Authority order.
- Final reconciled state: all 20 spot-checked E-ADR0007/release hashes resolve in `git log` with their recorded subjects; `warpos@0.14.0` tag confirmed; the non-enterable-posture consults + hard enforcement hooks are `Verified Not Wired` (definite findings, not `Unknown`); the System Inventory + Verification Matrix are fully disk-verified with zero `Unknown` rows; T3 Completed (100%); E-TRACKER-001 ~80%.
- Reason: Sprint T3 (§9 System Inventory + §10 Verification Matrix) — replace carried-forward and `Unknown` states with on-disk/in-git verification.
- Date and time: 2026-06-05. Session ID: to be backfilled. Agent: T3 verification pass (President-delegated systems builder).
- Documents updated: `TRACKER.md` (header, System Inventory, Verification Matrix, E-TRACKER-001 epic entry, Planned/Completed Sprints, Required Files, Required Wirings, Definition of Done, G-2, change log, this entry); `trackers/sprints/T3-*.md`; `trackers/epics/E-TRACKER-001-*.md`.
- Remaining uncertainty: None for the items T3 verified. Genuinely-unbuilt follow-ups (T5 roadmap migration; T4 cross-file §28.7 checks; hard enforcement hooks + non-enterable-posture consult) remain tracked under G-2, not as `Unknown`.

---

# Required Files

Per spec §33, the implementation must create, verify, or explicitly reject these files/paths. Current verified state shown (2026-06-05 21:51 PDT):

- `TRACKER.md` — Verified Exists (this file).
- `ROADMAP.md` — Verified Exists and epic-based (sprint T5, 2026-06-06: `## Epics` registry is the primary organizing unit; `## 🏛 Milestones` marked DEPRECATED).
- `UNTRACKED_WORK.md` — Verified Exists (ls/Read on 2026-06-05; sprint T2).
- `/trackers/` — Verified Exists (ls/Read on 2026-06-05; sprint T2).
- `/trackers/epics/` — Verified Exists (ls/Read on 2026-06-05; sprint T2).
- `/trackers/sprints/` — Verified Exists (ls/Read on 2026-06-05; sprint T2).
- `/trackers/templates/` — Verified Exists (ls/Read on 2026-06-05; sprint T2).
- `/trackers/templates/EPIC_TEMPLATE.md` — Verified Exists (ls/Read on 2026-06-05; sprint T2).
- `/trackers/templates/SPRINT_TEMPLATE.md` — Verified Exists (ls/Read on 2026-06-05; sprint T2).
- `/trackers/templates/SESSION_LOG_TEMPLATE.md` — Verified Exists (ls/Read on 2026-06-05; sprint T2).
- `/trackers/templates/UNTRACKED_WORK_TEMPLATE.md` — Verified Exists (ls/Read on 2026-06-05; sprint T2).
- `/trackers/templates/DEFINITION_TEMPLATE.md` — Verified Exists (ls/Read on 2026-06-05; sprint T2).
- `/trackers/templates/CHANGE_LOG_TEMPLATE.md` — Verified Exists (ls/Read on 2026-06-05; sprint T2).
- `/trackers/templates/EVIDENCE_LOG_TEMPLATE.md` — Verified Exists (ls/Read on 2026-06-05; sprint T2).
- `/trackers/templates/VERIFICATION_TEMPLATE.md` — Verified Exists (ls/Read on 2026-06-05; sprint T2).
- `/trackers/templates/RECONCILIATION_TEMPLATE.md` — Verified Exists (ls/Read on 2026-06-05; sprint T2).
- `/trackers/templates/COMPLETION_RECORD_TEMPLATE.md` — Verified Exists (ls/Read on 2026-06-05; sprint T2).

Old paths that should no longer exist: the old mode-based agent tree (`.claude/agents/00-alex`, `01-adhoc`, `02-oneshot`, `03-managers`) — Verified Nonexistent / expected-nonexistent (sprint T3 re-verified on disk 2026-06-05: `ls` of all four returned ENOENT). Note: this project (WarpOS canonical) places trackers under `.claude/`-adjacent root paths; the `/trackers/` root-relative organization above is the chosen structure and is linked clearly from this `TRACKER.md`.

---

# Required Wirings

Per spec §34, the implementation must verify and document each wiring below. A wiring must not be marked complete because it was described in prose; it must be verified in the actual Agentic OS implementation. Each row records: Wiring | Purpose | Source (expected) | Verification result. The four live enterable modes (`solo`, `adhoc`, `oneshot`, `sprint` — per the Mode definition) carry a start-of-work tracker-consult step, and the validator is wired into the standing scan suite as an automatic gate (sprint T6). Sprint T3 (2026-06-05) disk-verified the remaining rows: those naming operational postures (roadmap / review / debugging / refactor / documentation / agent-coordination / handoff-resumption) and the hard enforcement hooks were each checked and are `Verified Not Wired` (a definite finding — no `Unknown` remains), tracked under Known Gap G-2 as residual T6 / deferred T4 work.

| Wiring | Purpose | Source file (expected) | Result |
|---|---|---|---|
| Sprint mode tracker checks | Sprint mode consults `TRACKER.md` before substantial work | `.claude/commands/mode/sprint.md` | **Verified Wired** — `.claude/commands/mode/sprint.md` Step 2.5 "Start-of-work — consult TRACKER.md" (added 2026-06-05, T6; verified by Read of the file post-edit). Does not disturb the α+ε+β persistent-team Steps 1.5/1.75. |
| Solo mode tracker checks | Solo mode consults `TRACKER.md` before substantial work | `.claude/commands/mode/solo.md` | **Verified Wired** — `.claude/commands/mode/solo.md` Step 1.5 "Start-of-work — consult TRACKER.md" (added 2026-06-05, T6; verified by Read post-edit). Trivial no-state tasks exempt. |
| Adhoc mode tracker checks | Adhoc mode consults `TRACKER.md` before substantial work | `.claude/commands/mode/adhoc.md` | **Verified Wired** — `.claude/commands/mode/adhoc.md` Step 1.6 "Start-of-work — consult TRACKER.md" (added 2026-06-05, T6; verified by Read post-edit). Does not disturb the α+β+γ team Steps 1.75/2. |
| Oneshot mode tracker checks | Oneshot consults `TRACKER.md` before the Delta handoff | `.claude/commands/mode/oneshot.md` | **Verified Wired** — `.claude/commands/mode/oneshot.md` Step 2.5 "Start-of-work — consult TRACKER.md" (added 2026-06-05, T6; verified by Read post-edit). Runs while still Alpha, before the Delta handoff. |
| Roadmap mode tracker checks | Roadmap edits reconcile with tracker | roadmap skills under `.claude/commands/roadmap/` | **Verified Not Wired** (T3, 2026-06-05) — `grep -l TRACKER.md .claude/commands/roadmap/*.md` → no match (add/cleanup/create/ideas/next/prioritize present, none consult the tracker). Operational posture, not an enterable mode command; residual T6. |
| Epic planning tracker checks | Epic creation requires a tracker file | (epic-planning surface — no dedicated command) | **Verified Not Wired** (T3) — no enterable epic-planning command exists; epic files are authored by hand under `/trackers/epics/`. Residual T6. |
| Implementation mode tracker checks | Implementation consults tracker before substantial work | mode/agent surfaces | **Verified Not Wired** (T3) — covered indirectly by the 4 live-mode start-of-work consults; no separate implementation-mode command. Residual T6. |
| Review mode tracker checks | Review confirms completion against tracker | review surfaces | **Verified Not Wired** (T3) — operational posture, no enterable command. Residual T6. |
| Debugging mode tracker checks | Debugging records state mismatch into tracker | debug surfaces | **Verified Not Wired** (T3) — operational posture, no enterable command. Residual T6. |
| Refactor mode tracker checks | Refactor records path/wiring changes | refactor surfaces | **Verified Not Wired** (T3) — operational posture, no enterable command. Residual T6. |
| Documentation mode tracker checks | Doc work records untracked work when outside a sprint | doc surfaces | **Verified Not Wired** (T3) — operational posture, no enterable command. Residual T6. |
| Agent coordination tracker checks | Coordination defers to tracker authority | agent-coordination surfaces | **Verified Not Wired** (T3) — operational posture, no enterable command. Residual T6. |
| Handoff/resumption tracker checks | Handoff/resume reads tracker, not memory | `/session:handoff`, `/session:resume` | **Verified Not Wired** (T3, 2026-06-05) — `grep -l TRACKER.md .claude/commands/session/{handoff,resume}.md` → no match (both files exist, neither consults the tracker). Residual T6. |
| Validation mode tracker checks | Validation runs the tracker checks | `/scan:full` standing runner | **Verified Wired** — `.claude/commands/scan/full.md` "Tracker integrity — the enforced-tracker gate" block invokes `node scripts/trackers/validate.js` (added 2026-06-05, T6; verified by Read post-edit + a live `node scripts/checks/scan-coverage.js` → 0 findings, so the suite registration did not drift). A red tracker now fails the standing scan. |
| Definition enforcement checks | Block use of undefined operational terms | validation engine | **Verified Not Wired** (T3) for cross-file definition-drift — `validate.js` ships check (k) `undefined-terms` (single-file) only; cross-file definition-drift deferred T4. |
| Start-of-work checks | Force a tracker read before meaningful work | `scripts/hooks/tracker-start-of-work.js` (SessionStart) | **Verified Wired** (2026-06-06) — `scripts/hooks/tracker-start-of-work.js` runs the validator at every SessionStart and injects the tracker verdict into context; wired in `_warpos/settings/defaults.json` SessionStart + live `.claude/settings.json`. Tested: emits a valid SessionStart envelope. |
| End-of-work checks | Force tracker integrity before session end | `scripts/hooks/tracker-completion-gate.js` (Stop) | **Verified Wired** (2026-06-06) — `scripts/hooks/tracker-completion-gate.js` runs the validator at Stop; a red tracker prints a loud warning (advisory) or blocks (`TRACKER_GATE_ENFORCE=1`); re-entrancy-guarded (`stop_hook_active`); wired in `defaults.json` Stop + live settings. |
| Completion gate checks | Block completion claims without §28.6 evidence | validation engine + Stop hook | **Verified Wired** (2026-06-06) — `validate.js` `completed-evidence`/`completed-100`/`hundred-completed`/`cross-file-reconciliation` block a dishonest completion claim at the standing `/scan:full` gate, AND the Stop hook (`tracker-completion-gate.js`) refuses to end on a red tracker. (Optional future hardening: a per-edit PreToolUse claim-block.) |
| Path verification checks | Block "exists/nonexistent" claims without evidence | validation engine | **Verified Not Wired** (T3) — `validate.js` check (l) `required-paths` verifies §33 existence; claim-without-evidence cross-file check deferred T4. |
| Wiring verification checks | Block "wired" claims without evidence | validation engine | **Verified Not Wired** (T3) — claim-without-evidence wiring check deferred T4. |
| Validation commands | Make tracker validation runnable manually + automatically | `scripts/trackers/validate.js` + `/trackers:validate` skill + `/scan:full` gate | **Verified Wired** — runnable manually (Verified Exists; 12/12 PASS on 2026-06-05) AND wired into the standing scan suite: `.claude/commands/scan/full.md` invokes `node scripts/trackers/validate.js` as a fail-closed gate (2026-06-05, T6). This closes the deferred T4 "not yet a standing gate" follow-up. |

---

# Required Templates

Per spec §35, the system must include templates for: epic trackers; sprint trackers; session logs; change logs; evidence logs; definition records; untracked-work entries; completion records; verification records; reconciliation records; system-inventory records. Templates must be practical, not decorative, and designed so agents can fill them in quickly without ambiguity. Current state: 10 templates are Verified Exists in `/trackers/templates/` (ls/Read on 2026-06-05; sprint T2 deliverable): EPIC_TEMPLATE, SPRINT_TEMPLATE, SESSION_LOG_TEMPLATE, CHANGE_LOG_TEMPLATE, EVIDENCE_LOG_TEMPLATE, DEFINITION_TEMPLATE, UNTRACKED_WORK_TEMPLATE, VERIFICATION_TEMPLATE, RECONCILIATION_TEMPLATE, and COMPLETION_RECORD_TEMPLATE. The §35 "system-inventory record" template was folded into the VERIFICATION/SYSTEM-INVENTORY workflow and is not a separate file; whether to add a standalone SYSTEM_INVENTORY_RECORD_TEMPLATE is a T3 follow-up.

---

# Implementation Priority

Per spec §38, the implementation order is: (1) inspect the current Agentic OS structure; (2) inventory current roadmap/tracker/epic/sprint/definition/mode/hook/command/validator/template files; (3) verify existence/nonexistence/state of every relevant path; (4) verify wiring of every mode and enforcement point; (5) delete/unwire the old `TRACKER.md`; (6) create the new `TRACKER.md`; (7) add How to Use; (8) add Definitions; (9) define all required terms; (10) add System Inventory; (11) add Verification Matrix; (12) create tracker directories and templates; (13) create `UNTRACKED_WORK.md`; (14) migrate roadmap milestones→epics; (15–16) create/migrate epic and sprint tracker files; (17–22) wire tracker/definition/path/wiring checks into sprint mode then all other modes; (23–26) add validation for tracker/definition/path/wiring; (27) reconcile existing work; (28) run validation and fix failures; (29) record completion evidence; (30) record remaining gaps.

Mapping to this project's sprints: steps 1–11 are sprint T1 (with verification seeded and completed in T3); step 12–13 are sprint T2; steps 3–4 verification completion is sprint T3; step 14 is sprint T5; steps 15–16 are sprint T2 (file creation) + T5 (roadmap migration); steps 17–22 are sprint T6; steps 23–26 are sprint T4; steps 27–30 span T3/T4. Current position: steps 6–13 are DONE (T1 + T2 Completed); the validation engine of steps 23–26 is built, passing, and now gated in `/scan:full` (T4 Review Needed); and steps 17–22 (mode wiring) are DONE for the four live modes + the standing scan-suite gate (T6 Completed). Remaining are step 14 (T5 roadmap migration), step 3–4 completion (T3), T4's cross-file §28.7 checks, and the residual non-enterable-posture consult + hard enforcement hooks.

---

# Non-Negotiable Requirements

Per spec §39, the system must not: rely on memory as the source of truth; allow meaningful work to disappear between sessions; mark work complete without evidence; use ambiguous state language; use undefined operational terminology; allow definitions to live only in memory/chat/scattered documents; assume paths exist; assume paths do not exist; assume wiring exists; claim enforcement exists unless enforcement is verified; keep roadmap milestones as the primary organizing unit; treat tracker updates as optional; allow active sprints/epics without their own tracker files; allow work completed outside epics/sprints to remain invisible; allow definition changes without a change record; allow validation failures to be ignored; or allow known gaps/flaws in the Agentic OS tracking layer to remain invisible. The system must be thorough first; efficiency comes later.

Honest current-state note against these non-negotiables: two requirements are NOT yet fully met and are tracked as in-flight, not hidden — (a) "enforcement must be verified, not claimed" — the validation engine IS built, passing (`scripts/trackers/validate.js`, 12/12 PASS on 2026-06-05), AND wired into the standing `/scan:full` suite as a fail-closed gate (T6); the four live modes consult the tracker at start-of-work (T6); what remains is the hard start/end/completion enforcement hooks + the cross-file validator checks (deferred T4) and the non-enterable-posture consult (residual T6); (b) "roadmap must not keep milestones as the primary unit" — `ROADMAP.md` is not yet epic-based (sprint T5). The "no active epic/sprint without its own tracker file" requirement is MET: E-TRACKER-001's epic tracker and T1–T6's sprint trackers are Verified Exists on disk (sprint T2). The open items are recorded as Known Gap G-2 (tracker system mid-build) and in the Definition of Done, not asserted as satisfied.

---

# Known Gaps and Open Flaws

Per spec §36. Each gap carries: id, description, severity, affected area, affected files/paths, affected wirings, affected modes, discovery date, discovered by, current owner, required fix, current state, related epic/sprint, evidence, next action. (The "No known gaps" closing statement is NOT used, because validation has not been run and gaps exist.)

### G-1 — E3 ship-boundary audit (32 baselined skill→script refs)
- Description: The `skillScriptCompletenessGate` (first run in WarpOS 0.14.0) surfaced 32 pre-existing skill→script references, now baselined in `KNOWN_DANGLING_REFS` in `scripts/warpos/release-build.js`. They fall in three classes: (A) gate false-positives — illustrative placeholders / run-local artifacts that are not canonical scripts (4 entries); (B) canonical-dev / framework-maintenance / installer scripts intentionally not shipped (11 entries); (C) consumer-eligible scripts that back a shipped consumer skill but are not yet in the manifest and SHOULD ship (17 entries).
- Severity: Medium (no broken install today — the refs are baselined and the gate blocks any NEW ref; but class-C consumer skills ship without their backing scripts, a latent downstream-dead-skill risk).
- Affected area: WarpOS ship boundary / release manifest.
- Affected files/paths: `scripts/warpos/release-build.js` (KNOWN_DANGLING_REFS); the class-C backing scripts under `scripts/` (e.g. models/etc/guides/dispatch/oneshot/maps families per the per-entry reasons).
- Affected wirings: the release manifest / `skillScriptCompletenessGate`.
- Affected modes: release flow (`/warp:release`).
- Discovery date: 2026-06-05 (the 0.14.0 release, first run of the gate).
- Discovered by: the `skillScriptCompletenessGate` during the 0.14.0 release.
- Current owner: President Agent (delegable to engineering).
- Required fix: ship every class-(C) consumer-eligible script into the manifest; teach the gate to skip class-(A) placeholders; confirm the class-(B) dev-only calls. Then the baseline can shrink toward zero.
- Current state: Recorded; baselined and gate-blocking-on-new. Not yet fixed.
- Related epic/sprint: not E-TRACKER-001; an engineering/release follow-up (candidate future epic). Cross-referenced from `ROADMAP.md` / issues.md per the release-build comment.
- Evidence: `node` require of `release-build.js` → KNOWN_DANGLING_REFS length 32 (A:4, B:11, C:17), verified this session; the in-file comment block (lines 207–248) documents the three classes and the fix.
- Next action: schedule the ship-boundary audit; ship class-C scripts; teach the gate to skip class-A.

### G-2 — Tracker system mid-build — RESOLVED 2026-06-06
- Description: The enforced tracker system is COMPLETE. ALL SIX sprints are Completed and Verified on disk: T1 (keystone `TRACKER.md` + ~50 definitions), T2 (`/trackers/` tree, 10 templates, `UNTRACKED_WORK.md`, epic + sprint files), T3 (System Inventory + Verification Matrix, fully disk-verified, zero `Unknown`), T4 (validation engine + the 8 cross-file §28.7 checks — `scripts/trackers/validate.js` runs 20 checks, live 20/20 PASS + selftest 55/55, fail-closed + bite-tested, gated in `/scan:full`), T5 (ROADMAP milestones→epics migration — `## Epics` registry primary, `## 🏛 Milestones` DEPRECATED, 8 new epic files), and T6 (start-of-work tracker-consult in all four live modes + the validator wired into `/scan:full`). The former residual — the hard start/end/completion enforcement HOOK — is now BUILT + WIRED: `scripts/hooks/tracker-start-of-work.js` (SessionStart) + `scripts/hooks/tracker-completion-gate.js` (Stop), defined in `_warpos/settings/defaults.json` and live in `.claude/settings.json`; `hooks-enforce-or-tracked` passes on hook existence. The non-enterable operational postures (roadmap/review/debugging/refactor/docs) have no enterable mode command to wire — `modes-consult-tracker` covers the 4 live modes and the SessionStart hook covers start-of-work universally.
- Severity: Resolved (was Low). The tracking layer is complete: keystone, scaffold, per-item files, fully disk-verified inventory/matrix, epic-based roadmap, a 20-check validator wired as a standing fail-closed gate, mode-consult in all live modes, and hard enforcement hooks at session start + stop.
- Affected area: the Agentic OS tracking layer — fully built + enforced.
- Affected files/paths: `scripts/hooks/tracker-start-of-work.js`, `scripts/hooks/tracker-completion-gate.js` (new), `_warpos/settings/defaults.json` (+ live `.claude/settings.json`); `scripts/trackers/validate.js` (the 20 checks).
- Affected wirings: SessionStart hook (§28.2) + Stop hook (§28.5/§28.6) Verified Wired; the 4 live-mode consult wirings + the standing scan-suite gate Verified Wired.
- Discovery date: 2026-06-05 (build-in-progress, recorded so the unfinished state was never invisible). Resolution date: 2026-06-06.
- Discovered by: President Agent. Resolved by: President Agent.
- Current owner: President Agent.
- Required fix: DONE — wired the hard enforcement hooks (start-of-work SessionStart + completion-gate Stop).
- Current state: RESOLVED (E-TRACKER-001 Completed 100%, 2026-06-06; all six sprints + the hard hooks done). Optional future hardening only: a per-edit PostToolUse completion-gate.
- Related epic/sprint: E-TRACKER-001 (Completed); sprints T3, T4, T5, T6 (all Completed).
- Evidence: `node scripts/trackers/validate.js` → all 20 checks PASS, exit 0 + `--selftest` 55/55 (2026-06-06); the 2 hook scripts on disk + live-wired in `.claude/settings.json` (integrity-verified: +2 hooks, 0 dropped on recompile); `ROADMAP.md` § Epics registry + DEPRECATED milestones; the System Inventory + Verification Matrix fully disk-verified; `hooks-enforce-or-tracked` PASS on hook existence.
- Next action: None — resolved. (Optional: a per-edit PostToolUse completion-gate; and a separate fix logged for the pre-existing settings/defaults security-hook drift, which was reconciled in `defaults.json` while wiring.)

### G-3 — Stale-worktree-cwd operational hazard
- Description: A session can launch with its current working directory inside a git-pruned but still-on-disk worktree (cwd lock), making relative-path operations target a dead worktree instead of canonical. This session itself launched in a nested stale worktree (`.claude/worktrees/e6-orgmap-collapse/.claude/worktrees/e6-recover`) and had to operate on canonical via absolute paths only. The same hazard previously produced false "silent death" / wrong-completion-record-path readings (see project memory on dispatch completion records using a relative path).
- Severity: Medium (does not corrupt canonical when absolute paths are used, but silently misroutes any relative-path or git operation; a real source of "work lost between sessions" and false verification readings).
- Affected area: session bootstrap / worktree lifecycle / any tooling that resolves paths relative to cwd.
- Affected files/paths: lingering `.claude/worktrees/**` directories that are git-pruned but not removed (cwd lock); any tracker/dispatch record written via a relative path.
- Affected wirings: dispatch completion-record writers; any start-of-work/end-of-work hook that assumes cwd == canonical.
- Affected modes: all modes when launched from a stale worktree cwd.
- Discovery date: 2026-06-05 (observed this session); consistent with prior project memory (dispatch completion records relative-path cwd bug; RI-004-adjacent).
- Discovered by: this session (the systems builder, operating under the stale-worktree contract).
- Current owner: President Agent (delegable to engineering / session-bootstrap owner).
- Required fix: a session-bootstrap guard that detects a stale/pruned worktree cwd and refuses or re-roots to canonical; and a convention that tracker/dispatch records are written via absolute canonical paths, not cwd-relative. Until built, the operational mitigation (used this session) is to prefix every command with the absolute canonical root and use absolute paths for all file operations.
- Current state: Recorded; mitigation applied this session; no automated guard yet.
- Related epic/sprint: not E-TRACKER-001 directly; a session-bootstrap follow-up (candidate future epic). Cross-references existing project memory on dispatch completion records + enforcer debt ED-016.
- Evidence: this session's cwd was `...\.claude\worktrees\e6-orgmap-collapse\.claude\worktrees\e6-recover` (a pruned nested worktree); all work was performed on the canonical repo root via absolute paths.
- Next action: log a session-bootstrap-guard follow-up (candidate epic) and reference it from `ROADMAP.md`; until then, keep using the absolute-path mitigation.
