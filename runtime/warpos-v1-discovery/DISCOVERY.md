# WarpOS Deep Discovery — Master Synthesis
**Date:** 2026-07-09 · **Method:** 12 parallel read-only discovery agents, one per subsystem, each classifying every enforcement as MECH-NEUTRAL (fires for any helm) / MECH-CLAUDE (Claude harness only) / SCAN-ONLY (fires only if invoked) / PROSE (doc-only). Lane reports in `./lanes/`.
**Purpose:** ground the WarpOS-v1 rebuild (interop, WorkOrder→ResultEnvelope, SprintRoom, dispatch kernel, packs, helm-neutral enforcement) in verified current reality.

---

## 1. Executive verdict

WarpOS's enforcement **logic** is far more portable than its enforcement **triggers**. Roughly 80% of the enforcer estate is pure node scripts a GPT or Antigravity helm could run unchanged — but nearly 100% of the *triggers* are Claude-harness hooks or voluntary skill invocations. There is **no CI, no git hooks, no non-Claude trigger of any kind**. The rebuild's center of gravity is therefore not writing new checks — it's re-anchoring existing checks to chokepoints no mind can skip (git pre-commit/pre-push, CI, wrapper-internal gates, state-transition validators), plus closing a small set of genuinely missing enforcers (git↔ledger cross-check, β/ε participation, evidence-truth).

The single best subsystem is the **dispatch kernel** (already MECH-NEUTRAL with enforce-on defaults — the model for everything else). The single worst gap is **process integrity**: the sprint lifecycle, β consultation, and ε conducting are all bypassable today, and the tracker validator structurally cannot detect a lying tracker.

## 2. The estate by the numbers (verified)

- **87** non-test enforcer scripts in `scripts/checks/` + **53** scan skills (52 are thin wrappers over those scripts) + **29** bite-tests + **127** regression test files.
- **~80%** of enforcers are CI-runnable pure node with zero Claude dependency. **~10–12%** trigger via Claude hooks (but their logic is still node). Only the LLM-reasoning scans (patterns/coherence/requirements/privacy) are genuinely Claude-bound.
- **47** wired Claude hooks (settings.json ↔ hook-manifest verified in sync); **~14 orphaned enforcers** with no runner at all; the **entire bite-test + regression corpus has no standing runner**.
- **46 open** enforcement-debt entries (of 60).
- **134** path-registry keys → 5 generated views, currently in sync; **910** warn-tier literal-path violations latent.
- **34** roles in the registry (~24 claude / 9 openai / 1 gemini); parity scans green.
- **87** sprint registry entries vs **98** on-disk sprint dirs; **~30** zombie "releasing" sprints.
- **53,222-line / 17.2MB** monolithic events log, no rotation, O(file) reads.
- **231** skills (7 deprecated aliases, 8 vaporware epic:* stubs); 164 reference real scripts.

## 3. Cross-cutting findings (the patterns that repeat in every lane)

**F1 — The trigger monoculture.** Every mechanical trigger is Claude-shaped (PreToolUse/Stop/SessionStart) or voluntary (scan skills). No CI. No git hooks. `.git/hooks/` contains only samples — and `pre-commit-steps-check.js`, the repo's ONE git-native enforcer, was written but never installed. `paths/gate.js` even *claims* a CI workflow that does not exist (false-prose).

**F2 — Refuse-at-the-tool exists only in dispatch.** The dispatch wrappers carry real exit-2 gates (worktree isolation, shape door, contract-consult — all MECH-NEUTRAL, enforce-on by default). Nothing equivalent guards sprint phase transitions, ticket close, tracker edits, or release steps: sprint phase scripts are independently callable, the β gate lives only inside `full.js`, ε is default-OFF (`WARPOS_EPSILON_RUNTIME`), tickets close without evidence, TRACKER.md has no write-guard.

**F3 — Detectors exist; verdicts are advisory.** A recurring shape: the check is real, its teeth are disabled. `tracker-completion-gate` blocks only if `TRACKER_GATE_ENFORCE=1` (set nowhere). `security-pass-count` runtime stamps are report-only. `mode_profiles` narrowing is report-only. `epsilon-liveness`, `tracker-reality-drift`, `coverage-gate-scan`, `planning-principles` are report-only/fail-open. The mode-init banner is advisory. The ramp-to-blocking decisions were deferred and never made.

**F4 — Internal validity ≠ external truth.** The tracker validator's 20 checks never read git — the flagship "cross-file reconciliation" compares two hand-authored strings. The dispatch ledger has no commit↔record binding, and `cmdline_checksum` is forgeable (plain sha256, no signature). Evidence is checked for *presence*, never *truth*. A helm (any helm, including Claude) can claim false-GREEN and pass everything.

**F5 — Participation is not a recorded fact.** β verdicts exist only transiently (state resets per resume; events are write-mostly); ε has no lease; no WorkOrder/SprintRoom/lease primitive exists anywhere (verified by grep). "β consulted" and "ε conducted" are currently trust-based claims.

**F6 — Identity is prose, and root CLAUDE.md Alpha-poisons workers.** "You are Alex" loads into every headless `claude -p` worker; the only counterweight is the worker's own spec body. No binding-order resolver, no no-root-alpha-poison check exists. GEMINI.md absent; CODEX.md is a good hand-written shim proving the compiled-shim concept.

**F7 — Meta-enforcement rot.** Enforcers ship with passing tests that nothing re-runs (29 bite-tests + 127 regression files, no runner); ~14 enforcers have no invoker; learning-promotion is prose with an inert attestation trail; the systems manifest is degenerate (90 entries, 89 auto-filed "cognition"); maps are chronically stale (materialized inventory wrong by ~1,400 events). The system cannot currently notice its own enforcement decaying.

**F8 — Memory/judgment layer is 100% Claude-bound.** smart-context hardcodes the Anthropic API inside a UserPromptSubmit hook; there is no memory-recall path for any other helm. The session/turbo authorization layer (permissions.allow + decision:"approve") is Claude-only; the portable part is the policy data (`authorization.json`).

**F9 — Product-security packs are greenfield.** None of the v1 webapp/Supabase scanners exist (route-matrix, api-boundary, rls-coverage, live-rls-proof, demo-data-clean, env-separation: zero hits). Founder panel: app exists (template-generated), store + generator do not. Launch gates are checklist proxies, not proof gates.

**F10 — Live bugs found during discovery** (beyond the above): `handoff-live.js` claims Stop+SessionEnd wiring it doesn't have (crash-safety net INERT); no periodic checkpoint despite the skill referencing a timer; sprint registry drift (87 vs 98, 3 missing-subdir, 2 orphaned, ~30 zombies); `framework/templates` is a dead empty shell; guides enforcer exists but is unwired from scan:full; `state.js:73` still hardcodes scrapped role "qa"; stale worktree from harness lane found+cleaned this session (nothing scans harness worktrees); `_planning`↔`trackers` linkage is 16/19 unpopulated and unchecked; **WARPOS.md header claims 0.14.0 while the file it cites reads 0.17.0** (quorum blind spot proven live); **`warpos-structure-parity` FAILS live** (`_requirements/02-copy-system/` missing); every RELEASES.md summary except 0.9.0 is the literal "Fill in via release notes" placeholder; all 7 registered portfolio products are months behind canonical and no gate can see it.

**F11a — Skill USE is a dark doctrine (deep-dive 2026-07-09, post-synthesis).** CLAUDE.md § Skill Use describes a salience loop — "when SUGGESTED SKILLS appears, invoke at score ≥0.7; telemetry logs both suggestions and invocations; adherence is observable, drift is detectable." Verified reality:
- **The ranker has NEVER fired.** `SKILL_RANKER_ENABLED` is unset and dark-by-default (`smart-context.js:71`); **zero `phase=suggested` events exist in the entire events log**. The SUGGESTED SKILLS block has never once been emitted. The doctrine describes a feature that has never run.
- **Adherence is structurally unobservable.** `skill-adherence-report.js` exists but no scan/hook/CI invokes it (orphaned consumer), and with 0 suggestions ever, adherence_rate is 0/0 forever. The "drift is detectable" claim is PROSE.
- **Invocation-side telemetry IS live but narrow:** 184 `phase=invoked` events (2026-05-29→06-28), 183 agent-tool vs 1 user-slash. **Only 42 of 231 skills have ever been recorded invoked (18%)**; the operational core is ~20 lifecycle/logging skills (session:turbo 25, session:end 19, enforcement:log 17, sprint:full 16, mode:* 24). 189 skills have zero recorded invocations. Caveats: window starts 05-29; skills followed as procedure (not via the Skill tool) and subagent-run scan scripts don't log — undercounts, but the shape stands.
- **"Prefer existing skills when intent matches" has NO enforcer** — nothing detects re-deriving a procedure inline instead of invoking the matching skill (the exact drift ED-056 caught: a skill body re-ran certified work because prior-work lookup isn't wired into skill dispatch). `skill-weight.json` (ranker weights) is stale since 06-08 and consumed by nothing while the ranker is dark.
- **Rebuild needs:** (1) decide light-the-ranker vs delete-the-dead-half — a dark doctrine in CLAUDE.md is worse than either; (2) wire `skill-adherence-report` into the check registry/CI; (3) prior-work lookup in skill dispatch (skill bodies check "already done?" before re-running — retires ED-056 class); (4) usage-informed pruning of the 189 never-invoked skills (cross-check lane 04 dead-weight list); (5) mandatory machine-routable frontmatter (`reads`/`writes`/`namespace`) so a non-Claude helm can route intent→procedure; (6) move invocation logging into the delegated scripts themselves (helm-neutral) rather than only the PreToolUse hook.

**F11 — Release truth is regen-coincidence, not enforcement.** The version quorum reconciles 3 of ~8 version surfaces (the other 5 agreeing today is a side effect of the last regen — and WARPOS.md already drifted). Critical release gates honor `--skip <gate>` with no audit trail. Only the shipping manifest is commit-gated; the ownership manifest is release-gate-only (asymmetric). The distribution loop is one-way: downstream gap-flags flow upstream, but no enforcer watches whether downstream products ever receive updates.

## 4. Per-subsystem verdicts

| Subsystem | Core verdict | Keep | Biggest gap |
|---|---|---|---|
| Paths | KEEP core, replace triggers | registry→generator pipeline (GREEN) | zero helm-neutral triggers; false CI claim; 910 latent literals |
| Hooks | EXTRACT logic, keep as thin triggers | delegation pattern (merge-guard model) | embedded-logic guards die with harness; git-hook layer never installed |
| Dispatch | KEEP/EVOLVE (the model subsystem) | safe-spawn, coverage-gate, gauntlet-verify, breaker, contract | commit↔record cross-check; lease primitive; ledger signature; 3 provider-fact sources |
| Sprint | EVOLVE into SprintRoom | plan-contracts, checkpoints, evidence-bound record (`recordInProcessCompletion`) | all gates bypassable; β only in full.js; ε default-OFF; registry drift |
| Trackers | KEEP format, add external oracle | 20-check validator, TRACKER.md authority | zero git-awareness; evidence presence≠truth; gate env unset |
| Memory | KEEP stores, split events, enforce promotion | append-only JSONL + memory-guard; logLearning | 17MB monolith; promotion=prose; smart-context helm-lock |
| Skills | PROMOTE engines to CLIs, prune | 52 scan wrappers, sprint/warp engines | scan:full aggregator harness-locked; 8 vaporware epics; 7 dead aliases |
| Roles | MIGRATE to typed RoleSpecs | registry + class_derivation + parity harness | binding-order resolver absent; alpha-poison unchecked; spec bodies Claude-only |
| Checks | REGISTRY + runner + wire orphans | fail-closed maturity (vacuous-green rejection) | no check-manifest; 14 orphans; bite-tests unrun |
| Product | SHIP the missing scanners | spinup/lastmile/canon/readiness (real+tested) | security scanner class = 100% greenfield; panel store/generator |
| Session | DURABLE-STATE the lifecycle | mode.json single-writer; layered handoff design | handoff-live inert; no auto-checkpoint; no session-intent; turbo enforcement Claude-only |
| Release | KEEP pipeline, widen the oracle | scripted 11-stage pipeline; warpos-* scans; commit-time manifest guard | quorum checks 3 of ~8 version surfaces; `--skip <gate>` bypass; fleet staleness invisible (7/7 products behind); notes-placeholder unenforced |

## 5. The target enforcement architecture (what the rebuild builds)

**Layer 0 — one check registry.** `checks.registry.json`: `{id, script, policy_ref, trigger, blocking, fail_mode, bite_test, budget_ms}`. Everything below is generated from it. Kills: prose delegation tables, orphaned enforcers, silent-rot.

**Layer 1 — refuse at the tool (MECH-NEUTRAL runtime gates).** Extend the dispatch-wrapper pattern to every state mutation: sprint phase advance requires a durable β DecisionRecord (guard at the `fs.js` write chokepoint, not inside full.js); ticket close requires an evidence envelope; sprint create/advance requires an ε lease (new primitive: holder + expiry on progress.yaml/SprintRoom); TRACKER.md gets a write-guard; release steps read the gates. WorkOrder/ResultEnvelope formalize the wrapper boundary types.

**Layer 2 — detect at the ledger (bypass catchers).** Git↔ledger cross-check (records stamp produced commit SHA; validator reconciles git log ↔ ledger — catches raw-CLI and hand-building no matter who did it). Tracker-fidelity-vs-git (cited SHAs resolve; Active-0% items with landed commits flagged; evidence truth not presence). Signed/HMAC record checksums. Participation validator: every closed sprint shows ε lease + β records + envelopes per ticket + provider-diverse gauntlet stamps.

**Layer 3 — trigger at chokepoints no mind can skip.** Tracked git pre-commit/pre-push (`core.hooksPath`) running the fast registry checks; GitHub Actions CI running `scripts/scan/run-all.js` (new node driver replacing the Claude fan-out) + bite-test/regression runner + release gates. Claude hooks remain as the fast in-session path — one of three triggers, not the only one.

**Layer 4 — helm adapters.** Instruction compiler (AGENTS.md canonical + CLAUDE/CODEX/GEMINI shims + no-root-alpha-poison check); binding-order resolver (`resolveRole(ctx)`); memory-recall CLI (`warpos memory recall`) replacing smart-context's Anthropic-only injection; neutral pre-action gate reading `authorization.json`; agy/Antigravity adapter via the 11-touchpoint checklist (lanes/08 §New-provider).

## 6. Priority work items (rebuild backlog seeds)

**P0 — the trigger layer (unlocks everything):**
1. `scripts/scan/run-all.js` node driver + `checks.registry.json` (single source).
2. Tracked git pre-commit/pre-push via `core.hooksPath` (fast checks: secrets, NUL, paths gate, manifest parity, tracker validate).
3. GitHub Actions CI (full registry + bite-tests + regression corpus). Retires ED-033 + F7.

**P1 — process integrity (the operator's named invariants):**
4. β DecisionRecord + transition guard at the progress-write chokepoint (survives full.js bypass).
5. ε lease primitive + default-ON epsilon runtime.
6. Envelope-required ticket close (reuse `recordInProcessCompletion` bytes-derived ok).
7. Git↔ledger commit cross-check + signed records.
8. Tracker-fidelity-vs-git oracle + TRACKER.md write-guard + evidence-truth check.

**P2 — interop:**
9. Instruction compiler + no-root-alpha-poison + GEMINI.md + regenerate CODEX.md + `.codex/config.toml` hardening (currently danger-full-access!).
10. Typed RoleSpec migration (neutral core / binding block / harness-adapter block).
11. agy/Antigravity adapter (11 touchpoints) + headless-trust spike; lane DOWN via breaker until probe green; then flip `security-pass-count --strict`.
12. Memory-recall CLI; events split to dated dirs + rotation; promotion gate (validated-but-unimplemented learnings age out loudly).

**P3 — hygiene + product packs:**
13. Sprint registry reconcile/GC (87→98 drift, zombies); harness-worktree janitor; wire handoff-live; auto-checkpoint; session-intent artifact.
14. Wire the 14 orphaned enforcers via check-coverage; prune 7 aliases + 8 vaporware epics; regen maps event-driven.
15. Product security scanner class (rls/route-matrix/api-boundary/demo-data/env-sep — greenfield) + founder-panel store/generator + proof-based launch gates.
16. Truth/Release pack: widen version-quorum to all ~8 surfaces; ownership-manifest commit gate (symmetry); fleet-reconcile enforcer (portfolio staleness); release-notes honesty gate; close the `--skip` bypass (non-skippable critical gates or audit-logged reason); engine-sprint release lane (RI-001). Immediate fixes: WARPOS.md header 0.14.0→0.17.0, recreate `_requirements/02-copy-system/`.

## 6a. Systems discovery addendum (/discover:systems, 2026-07-09)

Six-angle system discovery (declarative/structural/behavioral/refgraph/convention/historical) ran post-synthesis — full rollup + angle reports in `systems/ROLLUP.md`. ~49 systems classified: **~22 Solid · ~10 Emergent · ~10 Ghost · ~7 Fragile**. Headline additions to the backlog:

**P1 addition — LOGGING REBUILD (operator directive 2026-07-09: "logging needs to be fixed — fine for small projects, now enormous"):**
Promote the logging charter from P2 to a named P1 workstream. Design (v1 packet doc 12 + measured reality):
- **Layout:** split the 17.2MB monolith into `_events/YYYY-MM-DD/<subsystem>.jsonl` (dispatch/hooks/sprint/session/release/panel/product) — one-shot migration script splits the existing log; old file archived, never mutated.
- **One writer, schema-validated:** logger.js v2 enforces `warpos/event/v1` at write time (fail-closed on malformed), replacing today's append-anything.
- **Rotation + compaction:** `events/compact.js`; unrotated-size budget check as a standing enforcer.
- **Materialized views:** maps/inventories regenerated FROM events (kills the chronic staleness class — inventory currently wrong by ~1,400 events).
- **Query CLI:** `warpos events query` — indexed reads replacing today's O(17MB) backwards scan; this is also the helm-neutral memory/recall surface post-smart-context.
- **Stream registry:** every log stream registered (owner, schema, rotation policy); an enforcer flags unregistered log files at the known roots — ends the "every subsystem invents its own log" pattern (team-guard-debug.log, CODEX-LOG.md, runtime/*.log all get registered or routed).

**P2 additions (interop/infra):**
- Rebuild the systems register (systems.jsonl is 90 skill-echoes naming ~0 systems); seed from ROLLUP.
- Repoint literal writers to decayed path keys (dispatchLocks/dispatchDeathsFile) + add missing root keys (trackers/, migrations/, _guides/, _knowledge/, _planning/).
- Register the codex-lane (.codex/ + CODEX-LOG.md) as a first-class provider system.
- Automate dual-manifest regen at the commit hook (the hottest co-commit edge — 196 in 90d — is pure bookkeeping tax).

**P3 additions (hygiene):**
- Scratch/archive GC policy: .warpos/ (11,244 files, largest dir in repo), runtime/ vs .claude/runtime/ dual-root unification, handoffs (97), gamma transcripts (100+), sprint-state accretion (2,379 files).
- Fix stale constitution text: AGENTS.md §Review Protocol (describes the retired 4-agent gauntlet), CLAUDE.md §Prompt Pipeline (smart-context now disabled), CLAUDE.md §Skill Use (ranker never fired).
- Add bite-tests for the 43/77 enforcers lacking one; reconcile the two test-naming conventions.
- Delete after verify: drift-*.js suite (~10 files), ~30 orphan one-off scripts, absent declared event fan-outs.
- **"Stores lag enforcers" anomaly:** cognitive-memory writes (learnings/traces/β-store) dormant 3–6 weeks while guards fire thousands/day — the learning loop stopped writing; revive via the promotion gate + memory CLI.

## 7. Lane report index

| # | Lane | File |
|---|---|---|
| 01 | Paths registry | `lanes/01-paths.md` |
| 02 | Hooks system | `lanes/02-hooks.md` |
| 03 | Sprint system | `lanes/03-sprint.md` |
| 04 | Skills library | `lanes/04-skills.md` |
| 05 | Memory/events/learning | `lanes/05-memory.md` |
| 06 | Trackers/epics/roadmap | `lanes/06-trackers.md` |
| 07 | Product pipeline | `lanes/07-product.md` |
| 08 | Dispatch kernel | `lanes/08-dispatch.md` |
| 09 | Roles/agents/instructions | `lanes/09-roles.md` |
| 10 | Checks/enforcement estate | `lanes/10-checks.md` |
| 11 | Session/mode lifecycle | `lanes/11-session.md` |
| 12 | Release/distribution | `lanes/12-release.md` |
