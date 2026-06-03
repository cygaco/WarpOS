# Agent-Org + Sprint-Mode + Requirement-Pipeline — Consolidated Spec

**Status: DESIGN-LOCKED, NOT IMPLEMENTED** (operator directive: do not build). Consolidates + supersedes the conversation-trail notes `sprint-hook-points-design.md` + `project-layout-restructure.md` (kept for history; THIS is the source of truth). Date: 2026-06-02/03.

---

## ADR (proposed — file as framework ADR-0007 at build time)

- **Context.** The judgment layer (directors/leads/designers) was built + org-mapped but only HALF-wired into sprints — the recurring "contract claimed but never enforced" failure (manager specs name `sprint:design` as consumer but it consults none; `design-quality` authority had zero callers; ED-008 = registers claim gaps already fixed). Operator wants a real-company **org model** with a dedicated **sprint mode**, all-persistent for collaboration, with managerial/Greek dual-naming.
- **Decision.** Adopt the org + sprint-mode + requirement-pipeline + layout below. Ratified forks: manager-set **router** (not blanket consult); **DoE-as-orchestrator** (not read-only — Gamma pattern, independence preserved by the 3 guards); **all-persistent** residency (collaboration > ephemeral efficiency); **σ→ε** + consecutive Greek dual-naming; `_development/` layout + downstream migration plan.
- **Consequences.** Revises the mode system (adds sprint mode), the team topology, and agent naming; requires downstream migrations via `/warp:update`; the all-persistent residency + DoE-orchestrator get **re-ratified at build** (β has confirmed DoE-orchestrator; all-persistent pending build-time re-ratify). Independence principle now runs top-to-bottom.
- **Decisions are reversible** (display/title layer first; id-rename + structural moves later as migrations).

---

## 1. The org (final)

**Founder & CEO = the human operator** (vision, final authority, types into the terminal).

```
[ Founder & CEO = you ]
α  COO + System/Org Architect      runs the company for the CEO; cross-domain integrator; the operator's
│                                  seat; owns+evolves the SYSTEM itself (WarpOS→the framework; a product→
│                                  that product's dev-org + installed WarpOS + meta-config)
├─ β  Chief of Staff               to the CEO; gate (DECIDE/DIRECTIVE/ESCALATE); INDEPENDENT CHECK on the
│                                  COO; operator's proxy when away. Never dispatches builders.
├─ γ·δ·ε  Director of Project Management   ONE role, 3 mode-faces (γ adhoc · δ oneshot · ε sprint; one
│                                  active per mode). SOLE dispatcher; runs the lifecycle; reuses ONE toolkit
│                                  (dispatch-claude.js reap-guard, gauntlet-verify, integration phase,
│                                  fix-cycle — never forked). δ's face is AUTONOMOUS (no α/β above it).
├─ ζ  Director of Product
│     ├─ κ  Product Lead
│     ├─ λ  Research-Insight Lead
│     └─ μ  Product Designer (craft)
├─ η  Director of Engineering   → frontend/backend builders, reviewers (ephemeral workers)
├─ θ  Director of QA            → qa, test (ephemeral workers)
├─ ι  Director of Marketing
│     ├─ ν  Copy Lead
│     ├─ ξ  Growth Lead
│     └─ ο  Web-Conversion Designer
└─ π·ρ  design-quality · visual-review   (cross-domain design judges)
```

**Naming = `Greek letter / org-title`.** "Alex" + "Beta" RETIRE as names (α / COO, β / Chief of Staff). Consecutive α→ρ, tier-ordered (exec → orchestration → directors → leads/craft → judges) — *the progression IS the hierarchy*. γ/δ stay adhoc/oneshot (established; nothing moves); only new roles get new letters. Symbols are a DISPLAY layer over current internal ids → title layer FIRST, full id-rename later (migration discipline).

**The independence principle runs top-to-bottom:** CEO (human) → COO (α) gated by Chief-of-Staff (β) → directors → who-builds separated from who-judges. No agent approves its own work at any level.

## 2. Residency model (all-persistent)

One **all-persistent collaborating org** (supersedes the earlier spine+ephemeral model). Everyone resident → easy cross-talk (esp. Product Lead + Product Designer co-authoring). The **router survives but changes job: from "who to SPAWN" → "who gets ASSIGNED tasks this sprint"** (composition decides who's tasked; idle members available for collaboration). Independence guards are **residency-independent** (about who renders verdicts, not who's resident) → all preserved. Cost = coordination + W-21 accretion surface → mitigate with the team-hygiene guard + a size cap. (Idle in-process teammates don't burn tokens — they sleep until messaged.) **Re-ratify all-persistent at build** (revises the B′ ephemeral model DoE/β ratified).

## 3. Sprint mode (lifecycle + hook points)

- **Lifecycle:** `plan → design → build → qa → release → retro`. Each step = a **hook point**.
- **Declarative hook-point registry** — one row per attachment: `{role, step, condition (unit-type|risk|domain), mode (advisory|block), order}`. The DoPM (ε) reads it and engages agents by composition. (Modeled on `_guides/registry.json` + the integration ledger.)
- **Bidirectional coverage enforcer `scan:sprint-hook-coverage`** (baseline-dated): forward = every registry row whose condition matched left a telemetry record at its step (or a logged `/enforcement:log` debt); reverse = no orphan agent / no empty step. PLUS: an advisory/author row that emitted a *dispatch-completion* = violation.
- **Independence invariant:** *no agent renders a verdict on work it authored, AND the dispatcher cannot override the verdict.*
  - **Author-managers** (Product Lead κ authors PRD/stories/AC; DoE η rules build_spec shape/FE-BE split/seam) — ADVISE; never dispatch the verdict on their own work.
  - **DoPM (ε) / Director of Engineering (η) dispatch builders + reviewers** = the Gamma pattern (orchestrator, NOT judge — verdict belongs to independent reviewers). 3 guards, all Gamma-inherited: (1) never authors code/verdict (build_spec is Product-Lead-authored per schema); (2) **gauntlet roster + scope are registry-FIXED, not self-chosen** — ENFORCER: extend `dispatch-route-guard` so a DoE/DoPM build-chain dispatch must be registry-resolved, not a self-constructed reviewer list → non-zero exit otherwise; (3) verdict binding + `gauntlet-verify` telemetry, dispatcher cannot flip a FAIL.
  - **Review-managers** (DoQA θ, design-quality π) judge OTHERS' output → dispatching their review lane is contract-clean. (Pilot: keep review-lane dispatch orchestrator-owned; promote to self-dispatch only on demonstrated σ-queuing pain; `/enforcement:log` the gap with that named trigger.)
- **Builder-dispatch seam:** ε/DoPM (or η within the build phase) dispatches `frontend-builder`/`backend-builder` via the bounded wrapper. η DRAWS the FE/BE line (read-only); the orchestrator dispatches across it; the integration phase owns the seam; backend-first merge (inherited from gamma.md). NEVER background `claude -p --agent builder` (RI-004 reap) — foreground or harness-Agent.
- **γ/δ/ε relationship:** WRAP the machinery, not the agent — the three faces share one toolkit (the scripts), don't fork it. δ (oneshot) already runs the full lifecycle = ε's precedent.
- **W1 — cheapest first build (partly landed this session):** wire `design-quality-gate.js` into the gauntlet on UI units — Lane 1 (static) blocks, Lane 2 (judgment) advisory→baseline→block ramp. (`--lane2` flag + gamma wiring shipped in `ac56602`; the registry + general coverage scan are the follow-on.)

## 4. Requirement pipeline

- **Grounding (always-on; every authored artifact must satisfy):** canon (`00-canonical`: JTBD/Vision/Audience) + `_knowledge/` + the relevant PRD.
- **Authoring (design step):** Product Lead (κ) writes the PRD (R-N); κ + Product Designer (μ) co-author HL stories (H-N) · granular stories (S-N) · AC; **Product Designer makes a visual mockup + flow** (drives the build + gut-checks UI/UX; the design judges review the rendered result AGAINST it); Copy Lead (ν) writes COPY (C-N) from `_knowledge/copy`. All within `_requirements/_standards/` templates.
- **Build:** Director of Engineering (η) dispatches FE/BE builders + reviewers.
- **QA:** Director of QA (θ) dispatches qa/test (+ future test cases/suite).
- **Design judges:** design-quality (π) + visual-review (ρ) judge the rendered UI vs the mockup.
- **Enforcement spine:** `requirement-format-guard` (ids) + `scan:requirements` (consistency + the canon→feature→sprint VERTICAL chain) + `scan:ac-coverage` + the SP-20260518-007 goal-verification gate + `req-reviewer` (behavior↔req↔code↔test) + `scan:sprint-hook-coverage` (authorship) + `PRECEDENCE.json` (conflict order).

## 5. `_knowledge` (FOR THE AGENTS) vs `_guides` (FOR THE USER)

Axis = **who reads it**, not generic-vs-specific:
- **`_guides/` = FOR THE USER** — founder-facing launch guides (AUTH/PAYMENTS/DEV_SETUP), surfaced in bootstrap/lastmile. Unchanged.
- **`_knowledge/` = FOR THE AGENTS:**
  - `_knowledge/design/` — design PRINCIPLES (MIGRATE from `_guides/design/` — currently misfiled under the user umbrella; rewire the 4 design agents' `<!-- DESIGN-GUIDES -->` blocks).
  - `_knowledge/copy/` — copy PRINCIPLES + project copy knowledge (voice, hooks, customer language).
  - `_knowledge/audience/` — per-project audience dossiers (Research-Insight Lead output; segment-level, source-attributed, confidence-scored, NO PII). Requires making RIL's audience-mining REAL (design→reality).
  - `_knowledge/state/` — **living project STATE-OF-RECORD, updated every sprint + feature change** ("what the project IS now"). Distinct from canon: **canon = INTENDED (vision/JTBD, stable); state = ACTUAL (evolving).** Lets a new sprint ground in what exists; feeds a masterconsole cockpit. Staleness enforcer (state vs repo reality).
- **Adjacency (don't overlap):** `_requirements/01-design-system/` + `02-copy-system/` = the project's INSTANTIATED systems (tokens, components), NOT principles. Three homes: principles→`_knowledge/`, instantiated system→`_requirements/0{1,2}-*`, user guides→`_guides/`.

## 6. Layout restructure + downstream migration

```
_development/            ← engineering lifecycle (plain children — _ = top-level zone or meta-subdir; content = plain)
  requirements/          ← MOVED+RENAMED from root _requirements (intent: PRDs, stories, AC, canon)
  stack/                 ← NEW (foundation: frameworks/infra + architecture decisions/ADRs; absorbs 03-architecture)
  releases/              ← NEW (release ledger; sprint release-records FEED it)
_knowledge/  audience/ copy/ design/ state/    ← FOR THE AGENTS
_guides/     …                                  ← FOR THE USER
_docs/  _reports/                               ← unchanged
```

**Migration plan (one-way canonical→products via `/warp:update`):**
1. **Paths-registry-first** — callers use `paths.X`; a move = `paths.json` remap + physical `mv` + a literal-ref sweep (grep ALL old-literal occurrences across `.md`/`.json`/`.js`).
2. **One idempotent migration per change, ledgered** (applied-migrations ledger → applied once per product; products on 0.8.2–0.13.1 get the chain in order).
3. **Backward-compat window** — `paths.X` resolves old-OR-new during transition; flip canonical + shim one minor version, then remove.
4. **Sequence low→high risk:** M1 `_knowledge/` (additive) → M2 `_development/{stack,releases}` (additive) → M3 `_guides/design→_knowledge/design` (move + rewire) → **M4 `_requirements`→`_development/requirements` (highest blast radius — most-referenced path; do LAST, co-design with the unbuilt `_warpos/` source-of-truth migration so it isn't moved twice).**
5. **Per-migration validation gate:** `scan:install` + `scan:references` + `path-lint` + `scan:requirements`.
6. **Content-preserving downstream** (each product's own PRDs/canon are MOVED, never overwritten — product-overlay concern W-9).
7. **Coverage enforcer** `scan:warpos-migration-coverage`: a structural change shipped without a migration = RED.
- **This IS the first real exercise of the C-4 consumer-contract milestone** (dogfood the fresh-install/update path the way downstream hits it — the ED-008 systemic cure). Restructure + C-4 ship together.

## 7. Build sequencing (when greenlit — NOT now)

Build entry = the **"Wire-the-judgment-layer" follow-on**, sequenced **after S4 smart-canon** (the bootstrap golden-flow gate). Order: (a) the hook-point registry + `scan:sprint-hook-coverage` + the author-role read-only-frontmatter enforcer + the dispatch-route-guard caller-check (the cheapest structural guarantees); (b) the `_knowledge/` scaffold (M1); (c) the org dual-naming display layer; (d) the layout migrations M2→M4 under the C-4 milestone; (e) the all-persistent team + DoPM faces + re-ratify residency with DoE+β. W1 (design-quality gate) is partly landed. Write ADR-0007 at build start.
