# WarpOS — Agent-System Rewrite TRACKER (interim)

> **What this is.** A persistent, per-task-state tracker for the **agent-system rewrite (ADR-0007)** initiative — the work of the last several days. The interim form of the roadmapped "epics-over-milestones + per-task tracker." Status is **verified against disk + git**, not claims (the audits that built this checked the actual files). Scope = the rewrite only; the broader framework backlog (0.16–0.18 milestones etc.) lives in `ROADMAP.md`.
>
> **Legend:** ✅ done & verified · 🟡 partial · ⬜ open/not-started · 🅿️ parked (deliberate) · 🔒 design-locked (deferred by decision)
>
> **State as of 2026-06-05 · `main` = `5c8377c`** (+ uncommitted M1-c tail, landing this session). Backup: `backup/pre-cutover-2026-06-04` (never delete).

---

## The picture in one line

**~90% done.** The *plumbing* (org tree, registries, routing, enforcers, skill resolution) is built, verified, and on `main`. What's left is **one real build (E5 `_knowledge/`)**, **one parked refactor (E6 ED-024)**, **one design-locked runtime (E7 ε)**, and a **cluster of enforcer-debt items (E8)**.

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

### ⬜ E5 — M1-d: the `_knowledge/` layer  *(THE big build left)*
- [ ] ⬜ Decide the `_knowledge/{audience,copy,design,state}` directory shape (store does NOT exist yet — only named in the registry; `audience`+`copy` specified, `design`/`state` not)
- [ ] ⬜ `_knowledge:integrate` skill — generalize `/guides:integrate`'s machinery (anchor contract + registry + integration ledger + idempotent read-before-write)
- [ ] ⬜ Wire `_knowledge` into the consuming agent specs (research-lead→audience, copy-lead→copy, design-lead→design)
- [ ] ⬜ **M3 migration:** `_guides/design` (18 guides) → `_knowledge/design`
- [ ] ⬜ A `_knowledge` coverage enforcer (the `/guides:coverage` / `scan:scan-coverage` mold)

### 🅿️ E6 — ED-024: `org-map.json` → registry structural collapse  *(parked, own sprint)*
- [ ] 🅿️ Collapse org-map's reporting-line structural view into the registry (`dispatchable_by`)
- **Why parked (β):** Trap-A-class refactor of `scan:role-parity`'s OWN source — needs the independent-witness design settled upfront. **Low urgency:** the authoritative source (`dispatchable_by`) is already correct + the reporting enforcer already reads it; org-map is a harmless stale secondary view.

### 🔒 E7 — ε sprint-conductor RUNTIME  *(design-locked, deferred)*
- [ ] 🔒 Build the ε runtime: instantiate ε + spawn the manager agent-set at each hook-point (honoring `residency`), replacing the script-driven phases' telemetry-only "consulted" records with real dispatch
- [ ] ⬜ **ED-025** — extend the dispatcher-can't-override-FAIL gate to the ε/sprint `DELTA_RESULT` path (currently adhoc/γ only)
- [ ] ⬜ **ED-022** closure — the `ui_touched`→design-quality consult signal (emitter built; closure open)
- **Status:** sprints run **script-driven** today (`full.js` + the framework) — not blocking; ε-as-agent is the deferred enhancement. `epsilon.md` exists but is DESIGN-LOCKED.

### 🟡 E8 — enforcer-debt hardening
Rewrite-specific debt:
- [x] **ED-023** — `adhoc-fail-override` REVIEWER_KEYS derives from the registry *(closed this session; ledger flipped to enforced)*
- [ ] ⬜ **ED-026** — cutover-completeness gate (grep the imperative layer — scripts/paths/hooks/fixtures — for deleted-old-tree literals; fail closed)
- [ ] ⬜ **ED-021** — heavy-skill lean-return dispatch contract (orchestrators hold envelopes, not full sub-output)
- [ ] 🟡 **ED-022 / ED-025** — see E7 (sprint-path enforcers)
Older framework debt (pre-rewrite, lower priority): ED-009 (shared repo-role resolver), ED-010 (lifecycle phases 3–5 skill gap), ED-011 (retro auto-trigger), ED-012 (DEV_SETUP day-zero), ED-013, ED-014, ED-015, ED-017, ED-018, ED-019, ED-020 — all `open`; triage in the final session or defer to the framework backlog.

### 🟡 Operational papercuts (RIs — not rewrite blockers)
- [ ] ⬜ **RI-001** — BC-02/BC-05 false-RED on Windows CRLF (high)
- [ ] ⬜ **RI-002** — fresh-minor release version-state refresh reds gates 6–7 (high)
- [ ] ⬜ **RI-004** — build-chain dispatch silent-death via harness reap (high)

---

## 🎯 FINAL SESSION — "blow everything out" target order

1. **Finish E4** (the 6-line cleanup — likely landed before this session ends).
2. **E5 — `_knowledge/` layer** — the one real remaining build. Start with the directory-shape decision (β/operator), then `_knowledge:integrate`, then wiring + the M3 guides migration + the coverage enforcer.
3. **E6 — ED-024** — the parked org-map collapse, as its own scoped sprint (design the role-parity independent-witness first — Trap-A discipline).
4. **E7 — ε runtime + ED-025/ED-022** — the sprint conductor (biggest, most-deferred; needs the ADR written when built).
5. **E8 — ED-026 / ED-021** + triage the older EDs + the 3 RIs.

When E5–E7 close, the agent-system rewrite is **done** — and the durable form of this tracker (per the ROADMAP "epics-over-milestones" entry) becomes the standing planning instrument.

*Interim tracker authored 2026-06-05 (session 3), verified by two disk-level audits. Companion to `DUMP.md` (the prescriptive next-session handoff). This file is the durable burndown; DUMP is the execution brief.*
