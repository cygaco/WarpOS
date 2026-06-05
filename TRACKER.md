# WarpOS — Agent-System Rewrite TRACKER (interim)

> **What this is.** A persistent, per-task-state tracker for the **agent-system rewrite (ADR-0007)** initiative — the work of the last several days. The interim form of the roadmapped "epics-over-milestones + per-task tracker." Status is **verified against disk + git**, not claims (the audits that built this checked the actual files). Scope = the rewrite only; the broader framework backlog (0.16–0.18 milestones etc.) lives in `ROADMAP.md`.
>
> **Legend:** ✅ done & verified · 🟡 partial · ⬜ open/not-started · 🅿️ parked (deliberate) · 🔒 design-locked (deferred by decision)
>
> **State as of 2026-06-05 · `main` = `db0a778`** (E5–E8 ALL LANDED — the ADR-0007 rewrite is DONE; `/scan:cutover-completeness` GREEN, 61-ref cutover debt cleaned). Backup: `backup/pre-cutover-2026-06-04` (never delete).

---

## The picture in one line

**DONE.** E1–E8 are built, verified, and on `main` (`db0a778`). This session landed the whole remaining rewrite via three parallel sprints: **E5** (`_knowledge/` brain), **E6** (org-map→registry collapse + spec-tree witness), **E7** (ε sprint-runtime + ADR-0009 + ED-025/ED-022), **E8** (ED-026 cutover gate + ED-021) — then **cleaned the 61-ref cutover debt** so `/scan:cutover-completeness` is GREEN. Every gate green. The only genuinely-staged item: the ε per-agent **spawn** increment (documented in ADR-0009 as the named follow-on; the engine + invariants + both ED-closures are real on main today). **The agent-system rewrite is complete.**

---

## EPICS

### ✅ E1 — Org cutover (the foundation)
Department tree (`president/product/engineering/growth/_system/_org`) replaced the old mode-based tree; role-registry keystone; mode-agnostic workers; dispatched-reviewer independence invariant.
- [x] Dept-tree folder collapse — old `00-alex/01-adhoc/02-oneshot/03-managers/` deleted, verified gone
- [x] `role-registry.json` keystone (33 roles) — the single source of role identity/model/authority
- [x] Atomic rename + Tier-3 verbatim ports + cutover behind parity gates
- [x] **All 32/33 agent specs are REAL** (74–574 lines, no stubs) — the "managers are spec-only" fear is false; only ε is design-locked (→ E7)
- [x] ADR-0007 accepted
**Evidence:** cutover commits `09bac6f`→`9a132af`; `/scan:full` green at cutover.

### ✅ E2 — Phase D: sprint hook-point FRAMEWORK
The declarative registry + router that lets agents wire into sprint lifecycle steps.
- [x] `sprint-hook-points.json` (16 rows / 6 steps) + composition→agent-set router (`hook-points.js`)
- [x] `residency` field + `residencyOf()` (consumed at runtime)
- [x] `manager_consult` emitter wired into `full.js` (ED-022 emitter)
- [x] `scan:sprint-hook-coverage` (bidirectional enforcer) + ε liveness heartbeat
- [ ] ⬜ ε actually *running* the lifecycle → that's **E7** (deferred)
**Evidence:** `688b1e3`→`2e859d7`.

### ✅ E3 — v0.2: dispatch consumers derive from the registry  *(this session)*
The registry became the single source of truth for role→provider/effort/build_chain/kind.
- [x] `registry-roles.js` reader (providerMap/effortMap/buildChainRoles/… + `deriveOrFallback` loud fallback)
- [x] **Trap-A fix** — `scan:dispatch-routing-parity` anchors on the registry (non-vacuous), proven by a 9-case bite-test
- [x] Tier-1 sets (`BUILD_CHAIN`/`GEMINI`/`FLAGSHIP`) derive
- [x] Tier-3 maps (`catalog` provider+effort, `providers.DEFAULT_AGENT_PROVIDERS`, `org-roles.REMEDIATION_ROLES`) derive
- [x] Registry reconciliation (security-reviewer effort→high, stub-scaffold→null) — **ADR-0008**
- [x] CUT-SAFETY 0-regression verified vs git HEAD; scan-gated PASS; LANDED
**Evidence:** `ec3f249`,`b29d331`,`2202abf` (on `main`); ADR-0008.

### ✅ E4 — M1 §8: skill→agent resolution  *(this session)*
Skills resolve their persona from the registry at call time, never hardcode a role name.
- [x] `skill-hook-points.json` registry + `skill-hook-points.js` resolver + 8-case bite-test
- [x] `scan:skill-hook-coverage` enforcer, wired into `/scan:full`
- [x] Migrate the 8 `subagent_type`-literal skills (roadmap×4 + growth×4); `MIGRATION_PENDING` emptied
- [x] **M1-c tail** — register+migrate the 4 prose-dispatch skills (`ad-images`/`ad-video`/`angles`/`iterate`); fix 3 descriptive stale names (message-brief/spinup/playbook); broaden the enforcer (persona-stale-anywhere + bold-backtick-dispatch + `stale-ok` suppress); bite-test 14/14
- [x] final convergence: cleaned 6 bold-backtick persona lines in the earlier-migrated 4 growth skills — broadened gate GREEN (0 gaps), bite-test 14/14
**E4 is DONE** — every agent-calling skill (12 registered) resolves its persona from the registry; no skill names a persona as a hardcoded dispatch.
**Evidence:** `aa86338`,`f574a7e`,`2ac4c92`,`5c8377c` (on `main`); tail landing this session.

### ✅ E5 — M1-d: the `_knowledge/` layer  *(LANDED 2026-06-05 · `3f9470d`→`6dcd318`)*
The shared agent-grounding brain (ADR-0007): two-kind taxonomy (β DECIDE 0.86) — **library** (design) + **store** (audience, copy); `state` parked (per-sprint runtime, no canonical instance).
- [x] Directory shape decided (β-blessed) — `_knowledge/{design,audience,copy}` built; `_domain.json` per domain → generated `_knowledge/registry.json`
- [x] `scripts/knowledge/registry.js` — the domain-registry engine (generalizes `scripts/guides/registry.js`; deterministic, role-validated)
- [x] `/knowledge:integrate` skill — library via `<!-- knowledge:<domain> role:<role> -->` marker blocks per consumer spec; store via producer-ref + contract README; ledger `knowledge-integration.jsonl` (idempotent, read-before-write)
- [x] **M3 migration:** `_guides/design` (19 guides) → `_knowledge/design` (git mv + 137 ref-fixes incl. dead role names; 4 consumer marker blocks repointed); both manifest systems taught `_knowledge/`
- [x] `/knowledge:coverage` + `scripts/checks/knowledge-coverage.js` (fail-closed, pure `evaluate()` + 9/9 bite-test) wired into `/scan:full`; store READMEs (audience/copy) + lead wiring
- [x] Scan-gate PASS (independent agent, verified vs parent 11d54ec); ship-coverage GREEN; landed.
**Also fixed in-flight:** 2 latent ship gaps (`scripts/skills` unshipped, `TRACKER.md` unclassified) + a `/fix:deep` cutover-ref cleanup (3 dead-role slugs; RCA: the alias table masks staleness → ED-026 enriched).

### ✅ E6 — ED-024: org-map → registry structural collapse  *(LANDED 2026-06-05 · merge `0320e11`)*
- [x] Collapsed org-map's reporting-line roster into role-registry `dispatchable_by`; `scan:role-parity` now anchors on the registry, **witnessed by the independent on-disk spec tree** (spec-path encodes home/sub_home, frontmatter name:=role id) — NON-VACUOUS, proven by `role-parity.test` 30/30 (5 bite classes). The Trap-A discipline held. **ADR-0010**; ED-024 enforced.

### ✅ E7 — ε sprint-conductor RUNTIME  *(LANDED 2026-06-05 · merge `34213e2` · ADR-0009)*
- [x] Built the ε runtime (`scripts/sprint/epsilon-runtime.js`, 526L): a registry reader + lifecycle engine that resolves the matched agent-set at each hook-point + DERIVES each role's dispatch route from the registry (ADR-0008 pattern) + writes REAL completion records (replacing telemetry-only). Invariants enforced structurally (sole builder-dispatcher, author-consults can't dispatch, β at boundaries, self-gates via the override gate). DESIGN-LOCKED banner lifted.
- [x] **ADDITIVE** — wired into `full.js` behind `--epsilon`; default path BYTE-IDENTICAL (proven: `test-sprint-full` 156/156 + an ε-vs-script coverage-parity test).
- [x] **ED-025** closed (the can't-override-FAIL gate covers the ε/sprint path; ε self-gates via `assertNoFailOverride`). **ED-022** closed + proven E2E (UI sprint records the design-quality consult; non-vacuous).
- [ ] ⬜ **STAGED (ADR-0009 risk #4):** the literal per-agent SPAWN under `--epsilon-dispatch` — the runtime shapes+writes real records now; spawning each agent on its resolved route is the next increment. *The only honestly-deferred piece in the rewrite.*

### ✅ E8 — enforcer-debt hardening  *(rewrite-specific debt CLOSED 2026-06-05)*
- [x] **ED-023** — `adhoc-fail-override` REVIEWER_KEYS derives from the registry *(prior session)*.
- [x] **ED-026** — `/scan:cutover-completeness` (E8, merge `146108f`): greps RAW deleted-tree literals + renamed-away roles across the imperative layer + keystone registries, fail-closed, wired into `/scan:full`; checks raw literals NOT alias-resolved (the alias-table-masking insight, `L-2026-06-05`). **The 61 flagged stale refs were CLEANED** (`db0a778`) → gate GREEN. Both the enforcer-gap AND the live debt are closed.
- [x] **ED-021** — heavy-skill lean-return dispatch contract (`dispatch-route-guard.js#findHeavySkillAdvisory`, E8).
- [x] **ED-022 / ED-024 / ED-025** — closed by E7 (ε runtime) · E6 (org-map collapse) · E7. All `enforced` in the debt ledger.
Older framework debt (pre-rewrite, NOT rewrite blockers — ordinary backlog): ED-009, ED-010, ED-011, ED-012, ED-013, ED-014, ED-015, ED-017, ED-018, ED-019, ED-020, ED-027, ED-028 — all `open`; triage in future sessions.

### 🟡 Operational papercuts (RIs — not rewrite blockers)
- [ ] ⬜ **RI-001** — BC-02/BC-05 false-RED on Windows CRLF (high)
- [ ] ⬜ **RI-002** — fresh-minor release version-state refresh reds gates 6–7 (high)
- [ ] ⬜ **RI-004** — build-chain dispatch silent-death via harness reap (high)

---

## 🎯 FINAL SESSION — "blow everything out" target order

1. ✅ **E4 finished** + landed (prior).
2. ✅ **E5 — `_knowledge/` layer LANDED** (`6dcd318`, 2026-06-05) — directory-shape decided (β), `_knowledge:integrate` + coverage enforcer + M3 migration + store domains, scan-gate PASS.
3. ✅ **E6 — ED-024 LANDED** (`0320e11`) — org-map collapse + spec-tree witness (non-vacuous, 30/30 bite-test). ADR-0010.
4. ✅ **E7 — ε runtime LANDED** (`34213e2`, ADR-0009) — additive (default path byte-identical); ED-025 + ED-022 closed. One staged increment: per-agent spawn (ADR-0009 risk #4).
5. ✅ **E8 — ED-026 + ED-021 LANDED** (`146108f`) + the 61-ref cutover cleanup (`db0a778`) → `/scan:cutover-completeness` GREEN.

**🏁 The agent-system rewrite (ADR-0007, E1–E8) is COMPLETE on `main`.** Remaining = the ε per-agent-spawn increment (ADR-0009) + the older framework backlog (ED-009/010/… + the 3 RIs) — none are rewrite blockers; ordinary backlog for future sessions.

When E5–E7 close, the agent-system rewrite is **done** — and the durable form of this tracker (per the ROADMAP "epics-over-milestones" entry) becomes the standing planning instrument.

*Interim tracker authored 2026-06-05 (session 3), verified by two disk-level audits. Companion to `DUMP.md` (the prescriptive next-session handoff). This file is the durable burndown; DUMP is the execution brief.*
