# MASTERPLAN — Large System Update (Managers · Design · Marketing · Builders · Audience · /etc)

_Status: **CONSOLIDATED FINAL DRAFT** for operator sign-off. Reconciliation + recon complete; GPT‑5.5 senior consult folded in; β verdict logged. Execution HELD on operator's conversion-web resources (Google-Doc nested links still to expand). Date: 2026-05-30._

**End goal (operator):** a sprint plan with parallel sprints where safe. This doc culminates in that plan; the standalone runnable version is `_planning/SPRINT-PLAN.md`.

**What's new in this consolidation:** every actionable GPT‑5.5 recommendation is integrated and tagged **[consult]**. The headline consult correction — *"contracts before agents; you are adding roles faster than enforceable interfaces, that is how multi-agent systems become theater"* — drove a new **F2 Artifact Contracts** foundation and a re-sequenced **Wave 0 contracts spike**. See `## Consult deltas` and `## β verdict (logged)`.

---

## 0. Critical framing (verified — unchanged)
- In the **canonical** WarpOS repo, `.claude/` IS the authoritative working tree. `_warpos/` holds only `MANIFEST.json` + `settings/defaults.json` and is regenerated **from** `.claude/` at release time.
- **Edit:** `.claude/` (agents, commands), `scripts/`, `_requirements/`, `framework/templates/`. **Then regen BOTH manifests (last step before commit):** `node scripts/generate-framework-manifest.js && node scripts/warpos/manifest/build.js`.
- Adding/splitting an agent role touches a **distributed role registry** (no single DB): `scripts/dispatch/catalog.js` (`ROLES`, `DEFAULT_PROVIDER_PER_ROLE`, `DEFAULT_EFFORT_PER_ROLE`) · `scripts/dispatch/state.js` · `scripts/hooks/lib/providers.js` (`DEFAULT_AGENT_PROVIDERS`, `DEFAULT_REASONING_EFFORT`) · `scripts/hooks/team-guard.js` (`GAMMA_ONLY_TYPES`/`TEAMMATE_TYPES`) · `scripts/dispatch/role-aliases.js` · parity enforced by `scripts/checks/dispatch-routing-parity.js` · the spec dir · `gamma.md`/`delta.md` dispatch prose · `AGENTS.md` · manifest regen.

## 1. Org hierarchy v1.1 (with Director of Marketing; conversion-web under Marketing)
```
                         Alex α  (orchestrator — owns orchestration, NOT judgment) [consult]
                            │
        Alex β  —  cross-domain GATE + arbiter, owns risk taxonomy / escalation /
                   Class-C / final release gate; cannot silently override (needs
                   arbitration record) [consult]
                            │
   ┌──────────────────┬─────┴───────────┬──────────────────┐
 Director of        Director of      Director of        Director of
  Product            Marketing         QA               [future…]
 (PRODUCT owner;    (MARKETING owner; (QUALITY owner)
  product truth:     audience activation/
  no fake claims)    channel/conversion
   │                 narrative/campaigns)
   │                    │
   │   ┌────────────────┘   ← design↔marketing seam = NAMED interface (enforcer), not turf
   │   │
  Design Lead  (DESIGN owner under Product; quality bar, brand coherence,
   │            accessibility, owns design→build handoff)
   ├── Product / App (UI-UX) Designer   → clearly under Product
   └── Web / Conversion Designer        → reports OPERATIONALLY to Design Lead,
                                          but the conversion/landing-page DECISION
                                          OWNER is Director of MARKETING [consult+β]
```
- **Per-domain ownership:** product→Director of Product; marketing→Director of Marketing; quality→Director of QA; design→Design Lead. **β arbitrates cross-domain conflicts + owns risk/escalation/final gate** [consult: "domain owner decides inside domain; β owns arbitration, risk taxonomy, escalation, release gate"].
- **Conversion website reporting line (β-settled):** owned by **Director of Marketing** (accountability follows the conversion metric); **Design is execution partner** on the visual layer; **Product is claims/positioning approver**. **Joint approval only at release.** NOT joint ownership. [consult agrees: "Web/Conversion reports operationally to Design Lead, but the landing-page decision owner is Marketing"].
- **Design vs Marketing scope (β-settled):** Design owns visual language / component system / UX patterns; Marketing owns audience activation / channel strategy / conversion narrative / campaigns. The seam is **coordination, not turf — but it MUST be a NAMED interface in BOTH agents' operating procedures** (the `conversion_brief` artifact + a `design↔marketing` consult clause). If a rung stays prose, `/enforcement:log`.
- This is a real org graph → **machine-readable + enforced** (F0/F2), because today's routing rule is unenforced prose.

## 2. Reconciliation — 9 asks → **3 foundations** + 3 workstreams + 1 accelerator
| Ask | Folds into |
|---|---|
| (—) artifact contracts gap surfaced by consult | **F2 Artifact Contracts (NEW)** [consult] |
| 6 shared manager principles + 1 multi-decider substrate + "create hierarchy" + Director of Marketing | **F0 Manager Base + Org Hierarchy** |
| 7 deepen audience ("everything about them") | **F1 Audience/Insight Layer** |
| 1 multi-manager decisions (wire it live) | **W1 Decision/Manager System** |
| 2 web/conversion + 3 product/app + UI-framework wiring + Marketing function | **W2 Design + Marketing Function** |
| 4 split builder FE/BE | **W3 Builder Specialization** |
| 5 /etc skill | **A1 Authoring Accelerator** |

**Key condensations:** (1+6+hierarchy+Marketing) are ONE manager OS, not separate tasks. (2+3) share principles+audience+component-library; the audience layer (7) is their shared FOUNDATION (also feeds DoQA golden/vulnerable users). UI-framework wiring is an enabler INSIDE W2. /etc (5) is both a deliverable and the tool that authors the new agents. The FE builder (W3) is the design+marketing function's downstream consumer → handoff is a first-class **typed contract** (F2), not prose [consult].

---

## 3. Foundations

### F2 — Artifact Contracts (**NEW — the consult's #1 leverage move**) [consult]
**Goal:** before any agent expansion, define the **typed artifacts agents exchange** — required fields, validity, freshness, confidence, approval state. Without this the FE/BE split and design handoff "fail by ambiguity."
- **Artifacts (owner → consumers → required fields):**
  - `audience_dossier` — owner `director_product` → consumers `[director_marketing, design_lead, qa_director]`; required `[segments, jobs, fears, desires, constraints, evidence, confidence]`.
  - `design_brief` — owner `design_lead` → consumers `[frontend_builder, reviewer, visual_review]`; required `[audience, flows, components, states, accessibility, tokens, acceptance]`.
  - `conversion_brief` — owner `director_marketing` → consumers `[web_conversion_designer, frontend_builder]`; required `[offer, icp, objections, proof, funnel_stage, cta, analytics]`. **← this artifact IS the named design↔marketing interface** (β enforcer requirement).
  - `build_spec` — owner `gamma` → consumers `[frontend_builder, backend_builder, integration_builder]`; required `[scope, file_ownership, contracts, tests, rollback]`.
  - `decision_record` — typed output of every routed decision (see W1 telemetry schema).
- **Thin interface versions** [consult]: ship all schemas at `v0.1`; parallel teams build against `v0.1`; breaking schema changes require **migration notes**. (This is what makes Wave 1+2 genuinely parallel-safe.)
- **ENFORCER:** a schema validator (JSON-schema / zod) + a `/scan:artifact-contracts` audit that fails when a produced artifact is missing required fields, is stale, or lacks a confidence/approval field. Validation harness is the minimum Wave-0 deliverable.
- **Edits:** new `framework/templates/contracts/*.schema.{json,yaml}` (or `.claude/agents/03-managers/.system/contracts/`), a validator in `scripts/`, a `/scan:*` skill, manifest regen.

### F0 — Manager Base + Org Hierarchy + Decision Routing (+ enforcer)
**Goal:** one inherited substrate every manager uses; a machine-readable org; enforced per-domain decision routing; **now incl. Director of Marketing**.
- **Shared principles base** (new): `clarity is king`, build-for-audience (incl. limitations), KISS, map-the-user-journey, product-priority-over-severity, FTUE/cold-start, focus. Extract the **duplicated** Product-Priority + User-Journey out of both directors INTO the base; directors keep only role-specific principles + inherit the base.
- **Org/domain map** (new, machine-readable): `reports_to`, `domain`, `owns_decisions[]`, `required_inputs[]` per manager. Candidate: `.claude/agents/03-managers/.system/org.json` + `manager-base.md`. **Domain schema modeled on the consult's `decision_domains`** [consult]: product / marketing / design / quality / risk(β), each with `owner`, `triggers[]`, `required_inputs[]`.
- **Director of Marketing (NEW manager)** [β]: peer per-domain owner. 10 principles seeded from the consult (own the market not the UI; one primary conversion goal per page; message before layout; specific beats clever; proof matches claim strength; objections are first-class; segment specificity; analytics events are part of the spec; never invent claims Product can't defend; conversion clarity wins unless Product/Brand overrules) [consult]. `marketing_owns` + `marketing_consults` maps seeded from consult.
- **Decision-routing contract:** extend `decision-policy.md` so a decision's **domain tag** routes to the owning manager first (substance) → β (gate). **Routing is policy-as-code, not prose** [consult]: `route(req)` = map domains→owners; if `class==="A"` OR `owners.length>1` OR `confidence<0.75`, return `[...owners, "beta"]`; else owners. A **domain classifier** runs first; ambiguous (conf<0.75 or multi-domain) → multi-owner + β [consult].
- **ENFORCER (the crux — today's rule is prose):** PreToolUse hook on AskUserQuestion/decision events + a `/scan:manager-routing-honesty` audit (mirrors `scan:sprint-beta-honesty`) that (a) tags decisions by domain, (b) records the consulted owner (`manager-consult` event), (c) flags a product/marketing/quality/design call that bypassed its owner, (d) flags β silent override without an arbitration record. **Build the enforcer EARLY with failing tests** [consult leverage #2]. Tests required [consult]: product decision w/o DoP fails · marketing copy change w/o DoM fails · design-system change w/o Design Lead fails · multi-domain requires all owners + β · β can't silently override · enforcer rejects stale `audience_dossier` · decision logs immutable append-only. Any rung that stays prose → `/enforcement:log`.
- **Edits:** `.claude/agents/03-managers/*`, `.../.system/`, new `director-marketing` spec, `decision-policy.md`, a new hook in `scripts/hooks/`, a new `/scan:*` skill, manifest regen.

### F1 — Audience / Insight Layer (deep, "everything about them") — **discipline-hardened** [consult]
**Goal:** know the audience completely via a repeatable pipeline producing a per-product audience dossier — **segment-level, source-attributed, confidence-scored. No individual profiling. No PII. No private data unless user-provided and consented** [consult: "mine everything can become noisy surveillance… otherwise it is horoscope text"].
- **Schema (adopt the consult's `audience_dossier` shape** as canonical [consult]): `segment` (name/inclusion/exclusion/demographics/tech_literacy/accessibility_needs/buying_context) · `jobs` (functional/emotional/social) · `pains` (workflow/personal_life_adjacent/financial/status/cognitive) · `desires` (explicit/latent/identity) · `fears` (failure_modes/social_risks/switching_risks) · `objections` (price/trust/complexity/timing) · `language` (phrases/taboo_words/reading_level/tone) · `behavior` (discovery_channels/decision_process/alternatives/triggers) · **`evidence.sources[]` (type/url_or_ref/quote_or_summary/date/confidence)** · `design_implications` / `marketing_implications` / `qa_implications`. (Superset of the draft's dimensions, now with mandatory evidence + per-segment structure.)
- **Mining methods** [consult]: review mining (app stores, G2/Capterra, Reddit/forums, Amazon/book reviews) · search-intent mining ("alternatives to", "how do I", "is X worth it") · competitor teardown (promises/objections/CTAs/proof) · sales/support transcript import *if consented* · synthetic interviews **only after real-source mining and labeled synthetic** · survey/interview templates for validation · **QA derives edge cases from audience constraints** (low literacy, low bandwidth, mobile-only, disability, anxiety, time pressure).
- **Mining pipeline:** product/niche → multi-source research (`research:deep` cross-provider) → synthesized dossier → canonical docs (`AUDIENCE.md`/`PERSONAS.md`/cohort dossiers under `framework/templates/canonical/` + per-product gen via `scripts/canon/generate.js`). Consumed by DoP, **DoM**, Design Lead, designers, DoQA.
- **ENFORCER:** evidence discipline = every deep psychographic claim needs source + segment + confidence + implication; F2 validator rejects dossiers with unsourced psychographic fields or missing confidence. Ethics guardrail (no PII / segment-level only) is a schema constraint, not prose.
- **Edits:** `framework/templates/canonical/*`, `scripts/canon/*`, new audience-mining skill (`/audience:mine`?), `bootstrap:spinup` phase wiring.

---

## 4. Workstreams

### W2 — Design + Marketing Function (Design Lead + 2 specialists + Director of Marketing + component-library wiring)
- **Agents (new):** `design-lead` · `product-designer` (app UI/UX) · `web-designer` (conversion/CRO) · **`director-marketing` lands in F0** but its operating procedure is enriched here. All inherit F0 base + consume F1 audience + read/write F2 artifacts.
- **Operating procedures (adopt consult's typed input→steps→output procedures** [consult]):
  - `director_marketing`: in `[audience_dossier, product_positioning, business_goal, traffic_source]` → steps `[choose segment, define offer, map objections, select proof, define CTA, analytics events]` → out `[conversion_brief, message_hierarchy, experiment_plan]`.
  - `design_lead`: in `[audience_dossier, product_requirements, conversion_brief]` → steps `[set UX principles, assign specialist, review flows, enforce component system, approve handoff]` → out `[design_brief, component_inventory, acceptance_criteria]`.
  - `product_app_designer`: in `[audience_dossier, JTBD, app_requirements, component_inventory]` → steps `[map workflows, reduce cognitive load, define states, specify accessibility, produce FE-ready spec]` → out `[ux_flow, screen_specs, state_matrix, component_usage]`.
  - `web_conversion_designer`: in `[conversion_brief, audience_dossier, brand_tokens]` → steps `[build persuasion sequence, wireframe page, define visual hierarchy, specify responsive behavior]` → out `[landing_page_spec, copy_blocks, section_rationale, tracking_requirements]`.
- **Anti-generic-output gates (adopt as design-system enforcer rules** [consult]): require a real component library in scaffold; **design tokens before screens**; **3 competitor teardowns + 3 anti-examples**; page-specific conversion hypothesis; **screenshot QA at desktop + mobile**; **ban stock SaaS sections** ("hero, logo cloud, three cards, testimonial" fails by default unless justified). Wire into `/scan:design-system` + `/ui:review`.
- **Component-library wiring (closes "integrated but unused"):** make the documented stack (Next + Tailwind v4 + Radix + shadcn/ui + Lucide) actually install/scaffold in `portfolio:new` + `bootstrap:spinup` + builder contract. **Stack is pre-decided** (existing `_requirements/01-design-system` + provider notes) so wiring needn't wait on Design Lead. Consult corroborates the exact stack (shadcn/ui + Radix + Tailwind v4 + Next).
- **Model division of labor (adopt for agent provider routing** [consult]): Claude-family → long-context product synthesis, audience-dossier drafting, UX-flow exploration, component-level implementation, design rationale. OpenAI/Codex-family → adversarial review, codebase-grounded refactors, test generation, regression detection, alternate implementation plans, final gate. Both: never "make it beautiful" — always give artifact contracts + screenshots + examples + brand constraints + conversion hypothesis + component inventory + acceptance tests. Prompt-caching: stable context (system instructions, examples, tool defs, project docs) at the front.
- **Research (execution-time, within-sprint per β):** `/research:deep` + `/etc` on (a) SaaS conversion/CRO and (b) the OpenAI×Anthropic website-generation workflow — extracted from `_planning/sources/` into the web-designer + DoM operating procedures (PRODUCT-LAYER, not system learnings). **Gated on operator's conversion resources (Google-Doc nested links).**
- **Edits:** new agent specs in `.claude/agents/`, role registry (see §0), `portfolio/new.js`, `bootstrap` phases, builder/design-system contracts, `/scan:design-system`, manifest regen.

### W3 — Builder Specialization (FE/BE split + **integration capacity**) [consult]
- Split generic `builder` → `frontend-builder` (scope `src/components/**`, `src/app/**`) + `backend-builder` (scope `src/api/**`, `src/lib/**`, `src/server/**`). **Shared/full-stack files** (auth, forms, design tokens, generated types) **fall between owners** [consult risk #4] → assign to a **foundation/integration owner** to avoid scope-theft compliance flags.
- **3rd builder role — consult verdict: YES, a two-way split is "necessary but not sufficient."** Recommended chain: `foundation_builder` (scaffold, package config, shared types, lint/test setup, component-library wiring) · `frontend_builder` · `backend_builder` · `integration_builder` (end-to-end wiring, contracts, env, migrations, smoke tests). **Decision (this plan):** ship **FE + BE in S6**, and satisfy the integration requirement via an **explicit Gamma integration phase** in the build chain (the consult's stated fallback: *"if you refuse a fourth builder, make Gamma perform integration explicitly"*) — with `foundation`/`integration` slated as a fast-follow role split once the contracts stabilize (Wave 4 pilot evidence). Rationale: avoids shipping 4 new roles before F2 contracts are proven; keeps the role-registry blast radius bounded per sprint.
- FE builder consumes `design_brief` from W2 (handoff contract owned by Design Lead, **typed via F2**). Reviewer/compliance/qa/redteam stay **builder-agnostic** (already polymorphic; heartbeat allows `builder-*`).
- **Contract-first enforcement** [consult]: FE builder must not fake APIs (build against `build_spec` contracts); BE builder must honor UX states (owned by `design_brief`). Enforce via the F2 validator + reviewer check.
- Dispatch routing: add `builderType` to feature store OR infer from file scope; conditional dispatch in gamma/delta.
- **Edits (full changelist, verified):** `catalog.js`, `state.js`, `providers.js`, `team-guard.js`, `role-aliases.js` (optional `builder`→`frontend-builder`), **4 new spec dirs** (adhoc+oneshot × FE+BE), `gamma.md`/`delta.md`, `scripts/delta-dispatch-builder.js`, oneshot store protocol, `AGENTS.md`, `dispatch-routing-parity` check, manifest regen.

### W1 — Decision/Manager System wired live
- Build the real "Managerial Agent Layer": auto-consult the owning manager by domain, β-gate, `manager-consult` + `decision_record` telemetry, and the F0 enforcer now policing the **full roster incl. DoM**.
- **Typed decision record / telemetry (adopt consult schema** [consult]): `decision_id, timestamp, class, domains, consulted_agents, missing_required_agents, owner_decision, beta_gate, conflicts, artifact_versions, confidence, final_status` — append-only, immutable.
- Depends on F0 (contract) + F2 (decision_record type) + W2 (Design Lead + DoM exist) + DoP/DoQA.
- **Edits:** β protocol, gamma/sprint skills that make decisions, hook + scan from F0, `decision-policy.md`.

### A1 — /etc Authoring Accelerator (skill) — **re-scoped per consult** [consult]
- **Re-scope (consult):** `/etc` is **NOT** "extend chain-of-thought" (wrong abstraction; don't build a system whose correctness depends on preserving hidden reasoning traces). It is a **prompt/skill authoring + evaluation harness** that stores **procedures, rubrics, examples, counterexamples, decision records, and compressed rationales**.
- New skill `.claude/commands/etc/extend.md`: takes an agent/skill and enriches its **procedures + few-shot examples + rubrics + counterexamples**, using a GPT‑5.5 consult (`node scripts/dispatch-agent.js consult <file> --provider openai --model gpt-5.5`) during authoring. Closest analog: `playbook:add` (example-anchored, append-only) + `skills:edit` contract.
- Built **early**, then dogfooded to enrich F0/W1/W2 agent procedures + examples — but authored **against the provisional F2 contracts** [consult sequencing], so it doesn't bake in pre-contract assumptions.

---

## 5. Plan shape (the deliverable lives in SPRINT-PLAN.md)
Framework supports parallel lanes (ADR‑0002). **Re-sequenced per consult into 5 waves** (was 3): a **Wave 0 Contracts Spike** now precedes Foundations, and a **Wave 4 pilot** validates contracts before scaling. Full runnable plan — ids, goals, deliverables, depends-on, parallel-safe-with, gates, exact changelists, thin contracts, and the `/sprint:plan` invocation order — is in **`_planning/SPRINT-PLAN.md`**.

**Wave summary:** W0 Contracts Spike (F2 + schemas + validation harness) → W1 Foundations (F0, F1, A1 — parallel) → W2 Build-out (W1-decision-enforcer, W2 design+marketing agents, W2b component scaffold — parallel) → W3 Builders (FE/BE + Gamma integration) → W4 Pilot (one product end-to-end, revise contracts).

---

## 6. Holds & open items
- **HOLD W2 web/conversion scope** until operator provides the remaining **conversion resources** — the Google-Doc (`D1`) **nested links still to expand** (`_planning/sources/SOURCES.md`). Design/component/audience lanes are NOT gated and can start.
- Branding boundary: design/web output is product-facing → must never leak "WarpOS" (needs leak-scanner; existing debt — see Master Console branding-boundary memory).
- Every new policy/contract here must name its enforcer at write-time (CLAUDE.md Policy & Enforcement Hygiene) or log `/enforcement:log`. The design↔marketing seam specifically MUST be a named interface (the `conversion_brief` artifact + consult clause) or log enforcement debt [β].
- **Pilot-before-scale** [consult leverage #5]: run ONE product through the full chain (W4) and use its defects to revise the `v0.1` contracts before broad rollout.

## 7. Next actions
1. Operator signs off on this consolidated plan.
2. Operator sends remaining conversion resources → un-gate W2 web/conversion scope (S4-web).
3. Mint Plan Contracts via `/sprint:plan` per `_planning/SPRINT-PLAN.md` invocation order; launch Wave 0 first (contracts spike), then fan out.

---

## Consult deltas
_What changed because of the GPT‑5.5 senior consult, and what was deliberately NOT adopted (one line each, with reason)._

**Adopted (changed the plan):**
- **F2 Artifact Contracts added as a foundation** — the consult's #1 point; agents without typed inputs/outputs are "theater." Reason: de-risks every downstream handoff.
- **Wave 0 Contracts Spike inserted before Foundations** — consult showed old Wave 1 wasn't parallel-safe (A1 needs conventions, F1 needs contracts, W2/W3 need scaffold decisions). Reason: correct sequencing.
- **Wave 4 pilot-before-scale added** — run one product end-to-end, revise contracts from real defects. Reason: avoids scaling a flawed contract set.
- **/etc re-scoped** from "extend chain-of-thought" → authoring+evaluation harness (procedures/rubrics/examples/counterexamples). Reason: CoT-warehouse is a fragile abstraction.
- **Decision routing = policy-as-code** with a domain classifier + `route()` fallback (conf<0.75 or multi-domain → owners+β) + 7 failing-test requirements + immutable decision log. Reason: replaces unenforced prose.
- **Audience layer hardened** to the consult's evidence-disciplined `audience_dossier` schema (mandatory source/confidence, segment-level, no PII). Reason: prevents "horoscope text."
- **Anti-generic design gates** (tokens before screens; 3 teardowns + 3 anti-examples; screenshot QA; ban stock SaaS sections). Reason: stops generic output by default.
- **Model division of labor** (Claude=synthesis/build, OpenAI/Codex=adversarial review/tests/final gate; prompt-caching for stable context). Reason: matches the OpenAI×Anthropic web-gen workflow ask.
- **Integration capacity** added to W3 via explicit Gamma integration phase (consult's named fallback to a 4th builder). Reason: shared/full-stack files fall between FE/BE owners.

**Deliberately NOT adopted (with reason):**
- **A standalone 4th `integration_builder` role now** — deferred to a Wave-4-evidenced fast-follow; using Gamma's explicit integration phase instead. Reason: don't ship 4 new roles before F2 contracts are proven (bounded role-registry blast radius).
- **A standalone `foundation_builder` role now** — folded into the Gamma integration/scaffold phase + W2b component-wiring. Reason: same bounded-blast-radius rationale.
- **Conversion website reporting OPERATIONALLY to Design as the decision owner** — consult phrasing leans "operationally to Design Lead." We keep operational/execution partnership with Design but set the **decision owner = Marketing** per β (accountability follows the conversion metric). Reason: explicit β verdict overrides.
- **Routing everything multi-owner+β by default** — we gate the β fan-in on class-A OR multi-domain OR conf<0.75, not every decision. Reason: preserves per-domain owner autonomy (operator's core ask) and avoids re-centralizing on β.

## β verdict (logged)
_Three Beta decisions — settled, treat as final. Logged to `paths.betaEvents` as `EVT-masterplan-system-update-beta-001` (DECIDE, Class B, conf 0.88, not escalated, OPEN_ADR false)._
1. **Source ingestion = Option B.** Do NOT `/learn:ingest` now. Extract the 8 sources **within sprints** — S4 (design/marketing/conversion operating-procedures) + S3 (audience-mining methods) — via `/research:deep` + `/etc`, into **PRODUCT-LAYER agent procedures** (not framework system-learnings). Rationale: layer-correctness + plan-not-execute.
2. **Director of Marketing = sound** as a peer per-domain owner. Design owns visual language / component system / UX patterns; Marketing owns audience activation / channel strategy / conversion narrative / campaigns. The design↔marketing seam is coordination, not turf — but it **MUST be a NAMED interface** in both agents' operating procedures (an enforcer = the `conversion_brief` artifact + consult clause); if not enforceable, log enforcement debt.
3. **Conversion website reporting line = Director of Marketing** (accountability follows the conversion metric), with **Design as execution partner** on the visual layer. **NOT joint ownership.**
