# Masterplan — Large System Update (Managers · Design · Builders · Audience · /etc)

_Status: DRAFT for operator sign-off. Reconciliation + recon complete; GPT‑5.5 consult running; execution HELD pending operator's forgotten conversion resources. Date: 2026-05-30._

End goal (operator): a **sprint plan with parallel sprints where safe**. This doc culminates in that plan (§5).

---

## 0. Critical framing (verified)
- In the **canonical** WarpOS repo, `.claude/` IS the authoritative working tree. `_warpos/` holds only `MANIFEST.json` + `settings/defaults.json` and is regenerated **from** `.claude/` at release time.
- **Edit:** `.claude/` (agents, commands), `scripts/`, `_requirements/`, `framework/templates/`. **Then regen both manifests:** `node scripts/generate-framework-manifest.js && node scripts/warpos/manifest/build.js`.
- Adding/splitting an agent role touches a **distributed role registry** (no single DB): `scripts/dispatch/catalog.js` (`ROLES`, `DEFAULT_PROVIDER_PER_ROLE`, `DEFAULT_EFFORT_PER_ROLE`) · `scripts/dispatch/state.js` · `scripts/hooks/lib/providers.js` (`DEFAULT_AGENT_PROVIDERS`, `DEFAULT_REASONING_EFFORT`) · `scripts/hooks/team-guard.js` (`GAMMA_ONLY_TYPES`/`TEAMMATE_TYPES`) · parity enforced by `scripts/checks/dispatch-routing-parity.js` · the spec dir · `gamma.md`/`delta.md` dispatch prose · `AGENTS.md` · manifest regen.

## 1. Org hierarchy v1 ("that can be it to start")
```
                         Alex α  (orchestrator)
                            │
        Alex β  —  cross-domain GATE + arbiter, owns risk / escalation / Class-C
                            │
        ┌───────────────────┴───────────────────┐
   Director of Product                      Director of QA
   (PRODUCT domain owner;                   (QUALITY domain owner)
    design function rolls up here)
        │
   Design Lead   (design domain owner under Product; owns design→build handoff)
        ├── Product / App (UI-UX) Designer
        └── Web / Conversion Designer
```
- **Per-domain ownership (operator decision):** product calls → Director of Product; quality calls → Director of QA; design calls → Design Lead; **β only arbitrates cross-domain conflicts** and owns the risk/escalation/final gate.
- **Reporting line formalized now:** design function → Director of Product. Web/Conversion designer sits under Design Lead→DoP for now (flagged: a future Growth/Marketing director could re-parent the conversion side).
- This is a real org graph → it must be **machine-readable + enforced** (see F0), because today's routing rule is unenforced prose.

## 2. Reconciliation — 9 asks → 2 foundations + 3 workstreams + 1 accelerator
| Ask | Folds into |
|---|---|
| 6 shared manager principles + 1 multi-decider substrate + "create hierarchy" | **F0 Manager Base + Org Hierarchy** |
| 7 deepen audience ("everything about them") | **F1 Audience/Insight Layer** |
| 1 multi-manager decisions (wire it live) | **W1 Decision/Manager System** |
| 2 web/conversion + 3 product/app + UI-framework wiring | **W2 Design Function** |
| 4 split builder FE/BE | **W3 Builder Specialization** |
| 5 /etc skill | **A1 Authoring Accelerator** |

Key condensations: (1+6+hierarchy) are ONE manager OS, not three tasks. (2+3) share principles+audience+component-library; the audience layer (7) is their shared FOUNDATION (also feeds DoQA's golden/vulnerable users). UI-framework wiring is an enabler INSIDE W2. /etc (5) is both a deliverable and the tool that authors the new agents. The FE builder (W3) is the design function's (W2) downstream consumer → handoff is a first-class contract.

---

## 3. Foundations

### F0 — Manager Base + Org Hierarchy + Decision Routing (+ enforcer)
**Goal:** one inherited substrate every manager uses; a machine-readable org; enforced per-domain decision routing.
- **Shared principles base** (new): `clarity is king`, build-for-audience (incl. limitations), KISS, map-the-user-journey, product-priority-over-severity, FTUE/cold-start, focus. Extract the **duplicated** Product-Priority + User-Journey out of both directors INTO the base; directors keep only role-specific principles + inherit the base.
- **Org/domain map** (new, machine-readable): `reports_to`, `domain`, `owns_decisions[]` per manager. Candidate: `.claude/agents/03-managers/.system/org.json` + `manager-base.md`.
- **Decision-routing contract:** extend decision-policy.md so a decision's **domain tag** routes to the owning manager first (substance) → β (gate). Per-domain owners; β arbitrates cross-domain + risk.
- **ENFORCER (the crux — today's rule is prose):** a hook/telemetry pair that (a) tags decisions by domain, (b) records which owner was consulted (`manager-consult` event), (c) flags a product/quality/design call that bypassed its owner. Mechanism candidates: PreToolUse hook on AskUserQuestion/decision events + a `/scan:manager-routing-honesty` audit (mirrors `scan:sprint-beta-honesty`). Log enforcement gap if any rung stays prose (`/enforcement:log`).
- **Edits:** `.claude/agents/03-managers/*` , `.../.system/`, `decision-policy.md`, a new hook in `scripts/hooks/`, a new `/scan:*` skill, manifest regen.

### F1 — Audience / Insight Layer (deep, "everything about them")
**Goal:** know the audience completely; a repeatable pipeline that produces a per-product audience dossier.
- **Schema dimensions** (product-layer canonical): Demographics (age, gender, location, income, education, occupation, family/living situation) · Psychographics (values, beliefs, personality, lifestyle) · Interests & lifestyle (likes, hobbies, media, apps used, communities, brands) · Behavioral (tech literacy, devices, daily routine, buying behavior) · **Personal-life context** (struggles/problems in personal life, life stage, stressors, aspirations) · **Emotional landscape** (deepest needs, desires, fears, wants, frustrations, hopes) · Jobs-to-be-done (functional/emotional/social) · Voice (vocabulary, where they congregate online).
- **Mining pipeline** (new): given product/niche → multi-source research (leverage `research:deep` cross-provider) → synthesized dossier → canonical docs (`AUDIENCE.md` / `PERSONAS.md` / cohort dossiers under `framework/templates/canonical/` + per-product generation via `scripts/canon/generate.js`). Consumed by DoP, Design Lead, designers, DoQA.
- **Ethics/rigor guardrail:** mine *segment-level* psychographics from legitimate sources (no PII, no individual targeting); cite sources; mark inferred vs evidenced. (Refine with GPT‑5.5 consult Q5.)
- **Edits:** `framework/templates/canonical/*`, `scripts/canon/*`, new audience-mining skill (`/audience:mine`?), bootstrap:spinup phase wiring.

---

## 4. Workstreams

### W2 — Design Function (Design Lead + 2 specialists + component-library wiring)
- **Agents (new):** `design-lead` (orchestrates, briefs specialists, arbitrates, owns design→build handoff, reports to DoP) · `product-designer` (app UI/UX; build-for-audience incl. limitations, KISS, clarity-is-king, clear iconography) · `web-designer` (marketing sites that convert; conversion/CRO expert). All inherit F0 base + consume F1 audience.
- **Component-library wiring (closes "integrated but unused"):** make the documented stack (Next + Tailwind v4 + Radix + shadcn/ui + Lucide) actually install/scaffold in `portfolio:new` + `bootstrap:spinup` + builder contract. Stack is **pre-decided** (existing `_requirements/01-design-system` + provider notes) so wiring needn't wait on the Design Lead.
- **Research (execution-time):** `/research:deep` on (a) SaaS conversion/CRO and (b) OpenAI+Anthropic website-generation workflows — feeds the web-designer's operating procedure. **Gated on operator's forgotten resources.**
- **Edits:** new agent specs in `.claude/agents/`, role registry (see §0), `portfolio/new.js`, `bootstrap` phases, builder/design-system contracts, manifest regen.

### W3 — Builder Specialization (frontend-builder + backend-builder)
- Split generic `builder` → `frontend-builder` (scope: `src/components/**`, `src/app/**`) + `backend-builder` (scope: `src/api/**`, `src/lib/**`, `src/server/**`). Shared files → a foundation owner to avoid scope-theft compliance flags.
- FE builder consumes design specs from W2 (handoff contract owned by Design Lead). Reviewer/compliance/qa/redteam stay **builder-agnostic** (already polymorphic; heartbeat allows `builder-*`).
- Dispatch routing: add `builderType` to feature store OR infer from file scope; conditional dispatch in gamma/delta.
- **Edits (full changelist verified):** catalog.js, state.js, providers.js, team-guard.js, role-aliases.js (optional `builder`→`frontend-builder`), 4 new spec dirs (adhoc+oneshot × FE+BE), gamma.md/delta.md, `scripts/delta-dispatch-builder.js`, oneshot store protocol, AGENTS.md, dispatch-routing-parity check, manifest regen.
- **Open (for GPT consult Q3):** 2-way vs add a 3rd integration/fullstack role.

### W1 — Decision/Manager System wired live
- Build the real "Managerial Agent Layer": auto-consult the owning manager by domain, β-gate, `manager-consult` telemetry, and the enforcer from F0 now policing the full roster.
- Depends on F0 (contract) + W2 (Design Lead exists) + DoP/DoQA.
- **Edits:** β protocol, gamma/sprint skills that make decisions, hook + scan from F0, decision-policy.md.

### A1 — /etc Authoring Accelerator (skill)
- New skill `.claude/commands/etc/extend.md`: takes an agent/skill, **extends its chain-of-thought + few-shot examples**, using a **GPT‑5.5 consult** (`node scripts/dispatch-agent.js consult <file> --provider openai --model gpt-5.5`) during authoring. Closest analog: `playbook:add` (example-anchored, append-only) + `skills:edit` contract.
- Built **early**, then dogfooded to enrich F0/W1/W2 agent reasoning + examples.

---

## 5. Parallel sprint plan (the deliverable)
Framework supports parallel lanes (ADR‑0002). 7 sprints, 3 waves. Each becomes a `/sprint:plan` Plan Contract.

**Wave 1 — Foundations (3 parallel lanes, mutually independent):**
| Sprint | Workstream | Depends on | Parallel-safe with |
|---|---|---|---|
| **S1** | A1 — /etc skill | — | S2, S3 |
| **S2** | F0 — manager base + hierarchy + principles dedup + routing enforcer | — | S1, S3 |
| **S3** | F1 — audience schema + mining pipeline | — | S1, S2 |
_S1 slightly ahead if capacity-limited (it authors later agents), but not a hard blocker._

**Wave 2 — Build-out (3 parallel lanes; need Wave 1):**
| Sprint | Workstream | Depends on | Parallel-safe with | Gate |
|---|---|---|---|---|
| **S4** | W2a — design agents (Design Lead + 2 designers) | S2 (base), S3 (audience) | S5, S6 | web-designer scope gated on operator resources |
| **S5** | W2b — component-library scaffold/install wiring | (stack pre-decided) | S4, S6 | — |
| **S6** | W3 — builder FE/BE split | — (independent plumbing) | S4, S5 | integrate design→FE handoff at S4∩S6 |
_S6 is the most independent — can move into Wave 1 for scheduling flexibility._

**Wave 3 — Integration (1 lane; needs full roster):**
| Sprint | Workstream | Depends on |
|---|---|---|
| **S7** | W1 — wire per-domain decision routing + β-gate + enforcer + telemetry | S2, S4, DoP/DoQA |

**Thin contracts that de-risk parallelism:** (a) F0 publishes the principles-base + org.json schema early so S4 can inherit; (b) F1 publishes the audience-dossier schema early so S4 designers can consume; (c) the design→build handoff spec is defined at the S4/S6 seam; (d) component-library stack is pre-frozen so S5 ⟂ S4.

---

## 6. Holds & open items
- **HOLD execution** until operator provides the forgotten **conversion resources** (feeds S4 web-designer + a conversion-knowledge task). Then update plan + run phased+parallel.
- **GPT‑5.5 consult** running (`runtime/notes/gpt55-consult-out.json`) — will re-sequence/critique §3–§5 (decision-model failure modes, FE/BE split 2-vs-3, OpenAI+Anthropic web-gen workflows, audience schema, parallel-safety). Fold in before final sign-off.
- Branding boundary: design/web output is product-facing → must never leak "WarpOS" (needs leak-scanner; existing debt).
- Every new policy/contract here must name its enforcer at write-time (CLAUDE.md Policy & Enforcement Hygiene) or log `/enforcement:log`.

## 7. Next actions
1. Read GPT‑5.5 consult → revise §3–§5.
2. Operator sends conversion resources → update S4 + conversion task.
3. Operator signs off → mint Plan Contracts via `/sprint:plan` per sprint, launch Wave 1 (parallel).

---

## 8. UPDATE 2026-05-30 — operator resources + Director of Marketing
**Sources delivered** (the previously-missing conversion resources): 7 YouTube videos + 1 Google Doc ("plus all the links within"), captured at `_planning/sources/SOURCES.md`. Ingestion approach routed to β (recommendation: capture now + extract within S3/S4 via `/research:deep` + `/etc` into product-layer agent procedures, NOT raw system learnings).

**Director of Marketing (NEW manager).** Added as a peer per-domain owner alongside Director of Product + Director of QA. Marketing-domain decisions → Director of Marketing; β still gates cross-domain + risk. Design↔Marketing interplay is real — the **conversion website lives at that seam**.

**Hierarchy v1.1 (revised):**
```
                         Alex α
                            │
        Alex β  —  cross-domain GATE + arbiter (risk / escalation / Class-C)
                            │
   ┌──────────────────┬─────┴───────────┬──────────────────┐
 Director of        Director of      Director of        Director of
  Product            Marketing         QA               [future…]
   │                    │
   │   ┌────────────────┘  (design↔marketing seam)
   │   │
  Design Lead  (design domain; owns design→build handoff)
   ├── Product / App (UI-UX) Designer        → clearly under Product
   └── Web / Conversion Designer             → at the Design↔Marketing seam (OPEN: reports Design, Marketing, or joint — routed to β + GPT consult Q4/Q7)
```

**Workstream deltas:**
- F0 / S2 now also creates **Director of Marketing** (+ its principles) and adds it to the org/domain map + routing enforcer.
- W2 / S4 is now the **Design + Marketing Function** (Design Lead + Product/App designer + Web/Conversion designer + Director of Marketing); operating procedures seeded from `_planning/sources/`.
- F1 / S3 audience dossier gains **Director of Marketing** as a consumer (positioning, messaging, channel fit).

**Open items added:** conversion-web reporting line (β + GPT consult); ingestion approach (β); fill `_planning/sources/SOURCES.md` "Feeds" + expand Google-Doc nested links at extraction time.

**Consolidation note:** planning deliverables to be relocated under `_planning/` (per operator) at the next revision, once the GPT‑5.5 consult + β verdict land — to avoid writing the doc twice mid-flight.

---
## [2026-05-31] EXECUTION DRIFT NOTE (assumptions.unsafe) — caught during S0.3 recon
- `_requirements/03-architecture/STACK.md` is titled **"Jobzooka — Stack & Deployment"** and `_requirements/01-design-system/COMPONENT_LIBRARY.md` + `.claude/agents/02-oneshot/.system/skeleton-checklist.md` are **Jobzooka product-leftovers** in canonical (pending the known root-_requirements scrub). STACK.md even mandates "No Tailwind utility classes / CSS-vars + inline styles" — the OPPOSITE of the shadcn/Tailwind stack S0.3 must scaffold.
- ADAPTATION (not papering over): S0.3 scaffolds the standard **shadcn/ui Next 16.2.x + React 19.2.3 + Tailwind v4 + Radix + Lucide** stack the FINAL-PLAN explicitly names. Generic conventions harvested from the leftovers (tsconfig @/*→./src/*, security headers, src/app+components/ui+lib, @tailwindcss/postcss, pinned versions) are reused; Jobzooka-specifics (rockets/stripe/BD/DeusMechanicus/CSS-vars-only) are NOT.
- Scaffold ships as PINNED TEMPLATES under framework/templates/app-scaffold/ (deterministic, offline, enforceable) — NOT live `npx create-next-app`/`shadcn init` (network+nondeterministic). npm install is the only network step, done in the target product at scaffold-time, not in canonical.
