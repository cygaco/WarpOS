# Sprint Hook-Points — declarative agent extension architecture

Operator directive (2026-06-02): "During sprints I want hook points for our agents.
When we write tickets, the designer should come in. A hook point for each step, so as
we add agents they can be easily wired in, and we can easily find gaps."

This is the GENERALIZED form of the (A) manager-set router + (B) event-contract that
β + DoP already approved as the "Wire the judgment layer" follow-on. It elevates the
narrow router into a first-class extension framework.

---

## 1. The problem today (why agents are hard to add)

The sprint pipeline invokes agents at HARD-CODED points:
- `sprint:design` = script-driven + a generic Beta review. It consults NONE of the
  managers that name it as their consumer (product-lead, DoE, product-designer, DoQA).
- The build gauntlet (Gamma) = a fixed set {reviewer, compliance, qa, redteam} + visual-review.
- Adding an agent = editing orchestrator prose in N places; there is no single place
  that says "who runs at which step." Result: orphans (DoE, product-designer,
  design-quality) sit unwired, and there is NO way to ask "which step has no agent?"
  or "which agent has no home?"

## 2. What's being built NOW (the first instances of the pattern)

1. **W1** — `design-quality` (the org's named design authority, previously uncalled)
   wired into the gauntlet hook point for UI units, with a ramp (advisory→baseline→block)
   and a telemetry record. The FIRST "an agent attaches at a sprint step" wiring.
2. **Router model (A)** — sprint-composition → manager-set: `product-lead + Beta` always;
   `DoE / product-designer / DoQA / design-quality` conditional by unit-type + risk.
3. **Enforcer** — baseline-dated `scan:sprint-manager-consult`: detects an applicable
   agent that did NOT run at its step (gap-finding, one direction).
4. **Event-contract (B)** — each `needs_orchestration` seam emits a typed event;
   consumers (cockpit buttons OR agents) attach declaratively, not by hard-code.

These are literally the first rows + first enforcer of the hook-point system below.

## 3. The generalization: named hook points + declarative registry + bidirectional coverage

**(a) Sprint lifecycle = ordered, NAMED steps, each a HOOK POINT:**
`plan → design (ticket-writing) → build → gauntlet → release → retro`

**(b) A declarative REGISTRY — one row per agent attachment:**
```
{ role, step, condition (unit-type | risk | domain), mode (advisory|block), order }
```
Adding an agent = adding a ROW, never editing the orchestrator. (Same shape the
`_guides/registry.json` + `guide-integration.jsonl` already use for guide→bootstrap
anchors — proven pattern, different surface.)

**(c) Orchestrator reads the registry** at each step and dispatches the registered
agents whose `condition` matches the sprint's composition; captures each result as a
telemetry record (mirrors `gauntlet-verify` / `dispatch-completions.jsonl`).

**(d) Coverage enforcer (`scan:sprint-hook-coverage`) asserts BOTH directions** — this
is the "easily find gaps" the operator wants, made self-detecting:
- forward: every agent declared for a step actually RAN (record) OR a logged debt →
  "this step is missing its agent."
- reverse: every agent is registered at some step / every step's declared agents exist →
  "this agent is ORPHANED" / "this step has NO agent."

## 4. Why it's cheap — three existing precedents already in the codebase

1. **guides:registry.json + guide-integration.jsonl + /guides:coverage** — the EXACT
   pattern (declarative anchor registry + integration ledger + fail-closed coverage
   enforcer), already shipped, for guides→bootstrap. Generalize to agents→sprint-steps.
2. **org-map.json** — already declares agent↔surface ownership (`is_named_design_authority`,
   each manager's named consumers). Half the registry already exists as data.
3. **systems-sync hook** — auto-registers new components on file edit (119/119
   auto-validated). The discovery/registration mechanism is already mechanized.

So the framework is small: (a) a sprint-hook-point registry (new, ~1 JSON file),
(b) the orchestrator reads it (sprint:design + gamma/delta), (c) the bidirectional
coverage enforcer (generalize `scan:sprint-manager-consult`). W1 + the router are the
first concrete rows.

## 5. The hook-point map (concrete)

| Sprint step (hook point) | Agents that register | Condition to fire |
|---|---|---|
| `plan` | director-of-product / product-lead | always (strategy/sequencing) |
| `design` (ticket-writing) | product-lead (authoring) · DoE (architecture/build_spec) · **product-designer (UX of stories)** · DoQA (QA plan) · copy-lead | UI→designer · code→DoE · risk≥med→DoQA · marketing→copy |
| `build` | builder / frontend-builder / backend-builder | by unit-type (FE/BE) |
| `gauntlet` | reviewer · compliance · qa · redteam · visual-review · **design-quality** | always + UI→visual-review/design-quality |
| `release` | release reviewers (diff-model) | always |
| `retro` | learner | oneshot |

## 6. The operator's example, walked through

"When we write tickets, the designer comes in" → the `design`/ticket-writing step is a
hook point; **product-designer registers there with condition `unit-type=UI`**. The
router dispatches it whenever the sprint has UI units. The coverage enforcer flags a UI
sprint whose tickets were written WITHOUT the designer's telemetry record. Add a brand-new
agent later (say a `data-modeler`) = ONE registry row at the step it belongs to; the
enforcer immediately knows, every sprint, whether it ran — and flags it the day it's
declared-but-never-fires or fires-with-no-home.

## 7b. Req-system ↔ sprint reconciliation (operator-flagged 2026-06-02 — ships WITH the hook-point registry)

The hook points are *where* req-types get authored; the req-system defines *what* flows and *how* it's enforced. Same project.

**Today's req system (mapped):**
- THREE un-connected scopes: **product** `_requirements/00-canonical/*` (CORE_BRIEF…GLOSSARY + FIELD_REGISTRY/PRECEDENCE/STEPS) · **feature/milestone** `_requirements/04-features/<feature>/` + the 11 numbered domains (`01-design-system`…`10-contracts`) · **sprint** `paths.sprintRequirements/<SP-id>/` (design.js-rendered bundle).
- TWO un-reconciled template homes: `_requirements/_standards/` (the human RULES — PRD_TEMPLATE, HIGH_LEVEL_STORIES, GRANULAR_STORIES, STORIES-COMMON, INPUTS_TEMPLATE, REVIEW_PROCESS) vs `framework/templates/sprint/requirements/*.tmpl` (the rendered SCAFFOLDS). Provenance-prefix-drift; end-state = `_warpos/templates/`.
- Req types + owners at the `design` hook: PRD (R-N)/H-N/S-N → product-lead · COPY (C-N) → copy-lead · INPUTS (IN-N)/TRACE (TR-N) → DoE · AC → product-lead+DoQA · qa-plan → DoQA · redteam-plan → redteam · tickets (T-N) minted from S-N.
- Enforcers that exist: `requirement-format-guard.js` (ids), `scan:requirements` (consistency/drift), `scan:ac-coverage` (verified_by), SP-20260518-007 goal-verification gate (AC needs verified_by:<test>), `req-reviewer` (behavior↔req↔code↔test), `pl-build-spec-enforcer.js`, `sprint-routing-guard.js`, `PRECEDENCE.json` (conflict order).

**Four reconciliation moves:**
1. **One template SoT** — consolidate `_requirements/_standards/` + `framework/templates/sprint/requirements/` → `_warpos/templates/`, + a conformance check that the scaffold IS the standard (kills the drift).
2. **Vertical traceability** — a sprint PRD `R-N` must link UP to a feature/canonical requirement (not invented fresh); extend `scan:requirements` to assert the canonical→feature→sprint chain, not just intra-sprint.
3. **Registry carries req-ownership** — each `design`-step registry row names the req-type its manager owns → coverage = "right author wrote the right artifact, conformant to template, traced up+down."
4. **One enforcement spine** — requirement-format-guard (ids) + scan:requirements (vertical chain) + scan:ac-coverage + goal-verification gate + req-reviewer (behavior↔req↔code↔test) + the NEW scan:sprint-hook-coverage (authorship) + PRECEDENCE.json (conflicts).

Sequencing: ships WITH the Wire-the-judgment-layer follow-on (both touch `sprint:design` + the template homes). The `_warpos/templates/` consolidation (move 1) also advances the broader source-of-truth migration.

## 7. Status / sequencing

- Landing THIS session (the first rows + one direction of the enforcer): W1
  (design-quality at the gauntlet hook) + the router's always-on product-lead+Beta.
- The full framework — the registry file + orchestrator-reads-registry +
  bidirectional `scan:sprint-hook-coverage` — is the **"Wire the judgment layer"
  follow-on** sprint (after S1-S5 + S4), per β + DoP. This note IS that follow-on's design.
- The deepest connection (DoP): every gap this session is "a contract claimed but never
  enforced." The hook-point registry + bidirectional coverage is the SYSTEMIC cure for
  that whole class on the agent↔sprint surface — not three fixes, one move.

## 8. mode:sprint persistent-team topology — RATIFIED B′ (DoE 0.85 + β DECIDE 0.87, 2026-06-02) — DESIGN LOCKED, NOT BUILT

Operator wants a distinct `mode:sprint` with a persistent team; asked "why not managers-as-dispatchers like Gamma?" DoE (director-of-engineering) ruled the fork; β ratified. `OPEN_ADR: true` — write an ADR when this is built. **Operator directive: do NOT implement yet.** This section is the locked design only.

### The dispositive fact
`schemas/contracts/build_spec.schema.json` declares the build_spec is **"Authored by the Product Lead"** with `owner_domain: engineering`. Author and owner are ALREADY split across two roles in canon. Option (A) "all managers self-dispatch like Gamma" collapses that → an agent that authors + dispatches + approves the same artifact = **self-approval**. Rejected.

### The principle (dispatch vs review)
The issue is never "dispatch + review" — it's **independence / skin-in-the-game**. Litmus: *does the dispatcher have a stake in the outcome it judges?*
- ✅ Orchestrator dispatches the work AND coordinates INDEPENDENT reviewers (Gamma today) — no authorship stake; verdict owned by independent, cross-model reviewers.
- ❌ An agent reviews work it AUTHORED (self-approval) — the line never crossed.
- ❌ An author/architect who made the construction decision then judges its realization ("a judge who chose the builder can't fail the build without indicting its own dispatch").
- ✅ A judge dispatches its review LANE on work it did NOT author (DoQA→qa on the builder's output).

### Persistent team = α + β + σ ONLY
Rule: **persistent iff it dispatches across MULTIPLE steps.** Only σ does. Everyone else is ephemeral-per-step (roster = the hook-point registry §3-6).
- **α** — lead/architect; integrates manager judgment; owns escalation.
- **β** — PROCESS judgment; **gate-at-phase-boundaries** (σ calls β at plan/design boundaries); β NEVER dispatches builders.
- **σ** — sprint-orchestrator (the γ-for-sprints); **sole builder-dispatcher + sole gauntlet-runner**; drives plan→design→build→gauntlet→release→retro; reads the registry; spawns specialists/reviewers.

### Tiers (tier = role × STEP, declared in the registry row's step+mode)
| Tier | Who | Lifetime | Dispatches? |
|---|---|---|---|
| Orchestrator | σ | persistent | YES — sole builder-dispatcher + gauntlet-runner |
| Author-consults | product-lead, DoE, product-designer, DoP, copy-lead | ephemeral (spawn→advise→die) | NO (structurally: `tools:[Read,Grep,Glob]`) |
| Review lanes | DoQA, design-quality, redteam | ephemeral (at gauntlet step) | review sub-agents only — **orchestrator-owned for the pilot** |
| Build/review sub-agents | frontend-builder, backend-builder, reviewer, compliance, qa, test-runner | per ticket/gauntlet | n/a |

### Seam rulings
- **Builder dispatch:** σ dispatches frontend-builder/backend-builder. DoE does NOT (read-only `tools` IS the enforcer). DoE draws the line (build_spec shape + FE/BE split + names the integration-seam owner); σ dispatches across it; the integration phase owns the seam; backend-first merge (inherited from gamma.md:178-191).
- **γ/δ: reuse the MACHINERY, not the agent (reconciles §8↔§9).** The DoE correction (§9) supersedes the earlier "σ wraps γ": **γ-the-agent is NOT a sprint-team member.** DoE absorbs γ's build-orchestration ROLE; what survives is γ's MACHINERY as scripts — `dispatch-claude.js` (reap-guard), `gauntlet-verify` (telemetry), the integration-phase logic, the fix-cycle — which DoE REUSES (don't fork them). γ-the-agent remains for ADHOC mode (feature iteration), its actual home. δ (oneshot) already runs the full lifecycle and is σ's precedent for skeleton runs.
- **Why β stays (independence, same principle as the DoE thread):** β is the always-on PROCESS/autonomy gate + escalation router — it provides α's INDEPENDENCE. Without β, α both makes AND gates its own orchestration/autonomy decisions = self-approval at the lead level (the exact violation the DoE thread forbids, applied to the orchestrator). β is persistent because it fires at every phase boundary regardless of sprint composition (it does NOT follow the managers' ephemeral-by-composition rule). β does NOT dispatch builders.
- **Persistent sprint team = α + β + σ** (γ OUT; managers ephemeral-by-composition). Open finer call (build-time, non-blocking): σ a dedicated agent vs α-plays-σ — dedicated σ-per-sprint + α-supervises-campaign is cleaner for many-sprints-against-a-roadmap; α-as-σ fine for single sprints. Rollback = remove σ, call γ/δ directly.

### The 4 enforcers (each rejects a violation at write/dispatch time)
1. **Author-managers can't dispatch** — `tools:[Read,Grep,Glob]` frontmatter (already true for DoQA/DoE/DoP) + a scan asserting no `03-managers/*` author-role carries Agent/Bash/Task. Structural guarantee (A) can't happen.
2. **Sole-dispatcher invariant** — extend `dispatch-route-guard` (PreToolUse) to assert the build-chain dispatch CALLER is σ/γ/δ, not a manager. Fail-closed.
3. **`scan:sprint-hook-coverage` (bidirectional)** — forward: every registry row whose condition matched produced a manager-consult record at its step (or logged debt); reverse: every dispatching/persistent role is registered, no step missing its declared agents.
4. **Advisory-row-that-dispatched detector (β Delta 2)** — a **PostToolUse hook** that fires when a tool call originates from an agent whose `org-map` tools array is `[Read,Grep,Glob]` (read-only classification, read at dispatch time) → block. This is the structural mechanism for "an advisory/author-consult that dispatched = the (A) regression."

### Deferred: review-manager self-dispatch (DoE 0.65 + β Delta 1)
No precedent in the codebase; the self-dispatch tier is NOT exercised anywhere (design-quality is dispatched by Gamma today, not self-dispatched). **Pilot posture:** keep review-lane dispatch ORCHESTRATOR-OWNED (σ dispatches the review sub-agents, as Gamma does now). `/enforcement:log` the gap with a NAMED promotion trigger: *"when ≥2 non-σ dispatches are blocked in a single sprint because σ-queuing introduced measurable latency, promote review-manager self-dispatch."* Promote only on that demonstrated pain ("start with 2, add roles on demonstrated pain").

### DoE's mind-changer (parked)
If DoE needs a throwaway **spike-builder** (build-to-learn) before writing the build_spec, do NOT give DoE dispatch — add a separate `spike` registry step the ORCHESTRATOR dispatches, with spike output explicitly non-shippable. Surface only if the pilot reveals the need.

### Status
DESIGN LOCKED by DoE + β. **Not built** (operator directive). Ships as part of the "Wire-the-judgment-layer" follow-on (after S4). Write an ADR (`OPEN_ADR: true`) at build time. Precedents: EVT-program-preclearance-beta-001 (author/approver separation), EVT-s0-1-hard-halt-merge-beta-001 (artifact-before-agent: agent:null for unbuilt roles).

## 8b. ORG-MODEL PIVOT (operator-proposed 2026-06-02, pending confirm — supersedes §8's residency model)

Operator is moving from "spine + ephemeral-by-composition" to **one all-persistent org that collaborates**, and from "Alex [greek-letter]" abstractions to **managerial titles**.

- **All-persistent org (not spine + ephemeral).** Everyone resident together → easier collaboration (esp. the Product Lead + Product Designer co-authoring). Cost is manageable: idle in-process teammates don't burn tokens (sleep until messaged); the real cost is coordination + W-21 accretion surface at ~10-12 members → mitigate with team-hygiene guard + size cap. **The router survives but changes job: from "who to SPAWN" → "who gets ASSIGNED tasks this sprint" (composition decides who's tasked; idle directors available for cross-talk).** The independence guards (§8/§9) are residency-INDEPENDENT (about who renders verdicts, not who's resident) → all preserved. REVISES the B′ ephemeral-managers model → re-ratify all-persistent at build.
- **σ → Director of Project Management** (runs the sprint lifecycle; peer director).
- **Names: DUAL-NAMING `Symbol / Title`** (operator likes it). Two-tier model:
  - **Executive/orchestration spine → dual-named** (Greek heritage + title): **Alex / CEO+OS-Architect · Beta / Chief of Staff · Gamma·Delta·Sigma / Director of Project Management.**
  - **Domain org → title-only** (no Greek): Director of Product/Engineering/QA/Marketing + leads/designers.
  - Guard-rails: (1) keep symbols as internal ids underneath (title layer FIRST; full id-rename later — anthropic→claude migration lesson). (2) "Alex" + "Beta" identities preserved.
- **The DoPM is ONE role with THREE mode-FACES** (sharing ONE toolkit — dispatch-claude.js reap-guard, gauntlet-verify, integration phase, fix-cycle; don't fork it):
  - **Gamma / DoPM — adhoc face** (single-feature build/gauntlet/fix)
  - **Delta / DoPM — oneshot face** (full skeleton runs) — the AUTONOMOUS face: runs with NO Alex/Beta above it, so it carries extra self-management apparatus (state machine, cycles, points, learner) because there's no governance layer to lean on.
  - **Sigma / DoPM — sprint face** (the roadmap lifecycle)
  - **Only ONE face is active per mode** (the mode selects it; never 3 DoPMs at once). Solo→no DoPM (just Alex); adhoc→Gamma face; oneshot→Delta face; sprint→Sigma face.
  - Net: the entire abstract-Greek layer collapses to **Alex (CEO) + Beta (Chief of Staff) + DoPM (one role, 3 mode-faces).**
- **The human operator = Founder & CEO** (vision, final authority, types into the terminal). **α = COO** (NOT CEO — operator correction "boom, it all makes sense"): runs the company day-to-day on the CEO's behalf. **β = Chief of Staff to the CEO** (gates, proxies the operator when away, independent check on the COO).
- **α's role = COO + System/Org Architect** (the 3 things no director can do): (1) cross-domain executive integrator (owns the whole product across all domains; resolves director conflicts or escalates); (2) the operator's seat/interface; (3) **owns + reshapes the system/org ITSELF** (self-modification, generalized — "runs the company AND shapes it"). CONTEXT-RESOLVES (operator note: "Architect of the OS" is WarpOS-only): in WarpOS-canonical = architect the framework/OS; in a downstream PRODUCT = architect/adapt THAT product's own dev-org + installed WarpOS + meta-config/project structure. Universal essence: Alex is the only seat that can reshape the company itself, not just run projects within it. (Maps to the dev-tooling-layer-vs-product-layer distinction — Alex owns the dev-tooling/meta layer in both; only its CONTENT differs.)
- **β = Chief of Staff** — the independent check ON the COO (α). Preserves the independence principle at the very top: α (COO) leads operations, β gates, neither approves its own call; the human CEO is the final authority above both.

**Naming = `Greek letter / org-title` — "Alex" and "Beta" RETIRE as names** (operator 2026-06-02: "keep the greek letters, drop the Alex; each agent is a greek letter / humanized org name"). Symbols are DISPLAY labels with internal ids underneath → do the title/display layer FIRST, full id-rename later (migration discipline; "You are Alex α" is woven through the framework). **LOGICAL PROGRESSION (operator-required):** consecutive Greek letters, top-down by tier, EXTENDING the established α β γ δ core (γ/δ stay adhoc/oneshot — nothing established moves; only new roles get new letters; the old σ for sprint → ε for an unbroken run). 17 letters α→ρ, no gaps:

```
[ Founder & CEO = the human operator (you) — vision, final authority ]
α  COO + System/Org Architect            (was "Alex α"; runs the company for the CEO)
├─ β  Chief of Staff                      (was "Beta β"; to the CEO; independent check on the COO)
├─ γ·δ·ε  Director of Project Management  (γ adhoc · δ oneshot · ε sprint [was σ]; one role, mode-selected face)
├─ ζ  Director of Product
│     ├─ κ  Product Lead
│     ├─ λ  Research-Insight Lead
│     └─ μ  Product Designer (craft)
├─ η  Director of Engineering   → frontend/backend builders, reviewers (ephemeral)
├─ θ  Director of QA            → qa, test (ephemeral)
├─ ι  Director of Marketing
│     ├─ ν  Copy Lead
│     ├─ ξ  Growth Lead
│     └─ ο  Web-Conversion Designer
└─ π·ρ  design-quality · visual-review   (cross-domain design judges)
```
Reads as the Greek alphabet in order: α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ = exec → orchestration (3 DoPM faces) → 4 directors → leads/craft → judges. The progression IS the hierarchy. Builders/reviewers (frontend/backend-builder, reviewer, compliance, redteam, test-runner) = ephemeral workers, unlettered for now (optional).
Through-line of the whole session's design: operator consistently chooses "a real company you run" over "a dispatch machine."

## 9. Requirement pipeline (operator design 2026-06-02) — DESIGN ONLY, NOT BUILT

The req→build pipeline the operator wants. Maps onto the existing req types (PRD R-N · HL stories H-N · granular S-N · AC · COPY C-N · INPUTS IN-N · TRACE TR-N · qa/redteam/release plans · tickets T-N) and adds a visual-mockup artifact + the `_knowledge/` substrate.

**Grounding (always-on — every authored artifact must satisfy):** `_requirements/00-canonical/*` (JTBD/Vision/Audience via CORE_BRIEF/USER_COHORTS/GOLDEN_PATHS) + `_knowledge/` (audience + copy) + the relevant PRD.

**Authoring (design step):**
- **Product Lead writes the PRD** (R-N — the high-level "accomplish this"), grounded in canon + milestone.
- **PL + Product Designer co-author** HL stories (H-N), granular stories (S-N), acceptance criteria.
- **Product Designer → visual mockup + flow** (NEW first-class artifact — drives the build + visually gut-checks UI/UX; the design-review judges the rendered result AGAINST it).
- **copy-lead → COPY (C-N)** grounded in `_knowledge/copy`.
- All within `_requirements/_standards/` templates, tuned to canon + PRD.
- research-insight-lead is NOT in authoring — it feeds `_knowledge/` upstream.

**Build / QA (phase-orchestrators — SUPERSEDES the §8 B′ "DoE read-only" stance; see RT-2026-06-02-doe-dispatch-independence):**
- **Dir of Engineering dispatches builders (FE/BE) + reviewers** = build-phase orchestrator (takes Gamma's place). **NO self-approval conflict** — this is Gamma's exact pattern ("Gamma with an engineering identity"). Independence lives in the *reviewer being independent*, not in *who dispatched*. The earlier "conflict" flag conflated *DoE rendering a verdict on its own work* (real, but NOT proposed) with *DoE orchestrating build + coordinating independent reviewers* (Gamma, proposed). DoE-the-agent's read-only ruling guarded DoE-as-JUDGE; positioning DoE as ORCHESTRATOR dissolves it (the judge is the independent reviewer).
- **Dir of QA dispatches QA agents** (+ future test cases / test suite) = qa-phase orchestrator (judges others' output).
- **The real invariant (NOT "judges don't dispatch"):** *no agent renders a verdict on work it authored, AND the dispatcher cannot override the verdict.* Three guard conditions, all already true of Gamma → DoE inherits them: (1) DoE never authors the code and never writes the verdict (builders build, reviewers judge; build_spec is PL-authored per schema); (2) **the gauntlet roster + scope are fixed by the registry/composition, NOT chosen ad-hoc by DoE per build** — the one residual to actually encode (else a soft thumb-on-the-scale returns). **ENFORCER (β, DECIDE 0.85, OPEN_ADR):** extend `dispatch-route-guard` so that when the CALLER is DoE, the gauntlet agent list + scope params MUST be registry-resolved (sourced from the hook-point registry), NOT derived from DoE's own output; a DoE dispatch passing a dynamically-constructed reviewer list → non-zero exit. This is the load-bearing invariant that makes the Gamma analogy hold — it must be a guard, not a convention; (3) the verdict is binding + `gauntlet-verify`-telemetried — DoE integrates findings but cannot flip a FAIL.
- **Integration seam:** DoE owns it WITHIN the build phase; a thin lifecycle owner (α or a minimal σ) owns the cross-phase HANDOFFS (design→build→qa→release). σ decomposed into domain phase-orchestrators under a thin lifecycle spine.
- **Mechanical:** DoE/DoQA are read-only (`tools:[Read,Grep,Glob]`) today — promoting them to phase-orchestrators means giving them dispatch tools (judge→orchestrator). RE-RATIFY DoE+β at build time with guard condition (2) as the binding requirement. (Consciously supersedes §8's DoE-read-only — validated by RT-2026-06-02-doe-dispatch-independence; β re-ratification requested.)

**`_knowledge/` (NEW per-project folder — CORRECTED axis: who-reads-it, not generic-vs-specific):**
The split is **audience**, per operator ("_guides is moreso for the user"):
- **`_guides/` = FOR THE USER** — founder-facing launch guides (AUTH/PAYMENTS/DEV_SETUP, surfaced to the human in bootstrap/lastmile). Unchanged.
- **`_knowledge/` = FOR THE AGENTS** — grounds the sprint/design/copy/research agents:
  - `_knowledge/design/` — design PRINCIPLES (generic, agent-grounding). **These live in `_guides/design/` TODAY** — a namespace overload under the user-facing umbrella (4 design agents reference them via `<!-- DESIGN-GUIDES -->` blocks). DECISION: migrate → `_knowledge/design/` (move 19 guides + rewire the 4 agent blocks + registry + guides:coverage) [recommended, for a clean user/agent split] OR grandfather `_guides/design/` and put only NEW grounding in `_knowledge/`.
  - `_knowledge/copy/` — copy PRINCIPLES (generic) + project copy knowledge (voice, hooks, customer language). [CORRECTION: earlier "copy principles → `_guides/copy/`" was wrong — they go here.]
  - `_knowledge/audience/` — per-project audience dossiers (RIL output: segment-level, source-attributed, confidence-scored, NO PII).
  - `_knowledge/state/` — **living project STATE-OF-RECORD, updated every sprint + feature change** (current architecture, feature inventory, decisions — "what the project IS now"). Distinct from canon: **canon (`_requirements/00-canonical/`) = INTENDED product (vision/JTBD, stable); `_knowledge/state/` = ACTUAL current state (evolving).** Lets a new sprint ground in what EXISTS (not re-derive from vision) + feeds a masterconsole cockpit. Written at sprint-close/retro + on feature-change; kept honest by a **staleness enforcer** (state-record vs actual repo/feature reality — D6 "dumb output" applied to state).
- **Adjacency to NOT overlap:** `_requirements/01-design-system/` + `02-copy-system/` are THIS PROJECT's instantiated design/copy SYSTEMS (tokens, components) — NOT generic principles. Three distinct homes: principles → `_knowledge/`, instantiated project system → `_requirements/0{1,2}-*`, founder guides → `_guides/`.

**New work items (all design/roadmap):**
1. `_knowledge/` scaffold (per-project) + `_guides/copy/` (generic copy principles, the copy twin of the design taxonomy).
2. Make RIL audience-mining REAL (implement dossier production — design→reality).
3. Copy principles taxonomy + copy knowledge.
4. Product-designer visual mockup + flow as a first-class design-step artifact; design-review judges against it.
5. DoE/DoQA → phase-orchestrators + the thin lifecycle spine (revises B′; re-ratify at build).
6. **Canon-grounding enforcer** — every authored requirement traces up to canon (JTBD/Vision/Audience) + relevant PRD (extends §7b vertical-traceability; `_knowledge/` is the audience/copy substrate).
