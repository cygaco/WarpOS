# Agent-System Clean-Rewrite Plan

> **STATUS: PLAN ONLY — DO NOT BUILD. Build is a follow-up session.**
> Captures the final agent-company org (designed 2026-06-03) + a complete diff against the live system + a no-stray-agents verification checklist. Supersedes the org portions of `agent-org-sprint-mode-spec.md`. Authoritative human-readable view: `AGENT-STRUCTURE.md`. Master plan: `DUMP.md`.

---

## 1. The final org (target)

```
                              YOU — Founder & CEO
                                       │
                              ALEX — President   (name = "Alex"; role = President)
                          faces:  α run · β check · γ adhoc · δ oneshot · ε sprint
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
   ζ DIRECTOR OF             η DIRECTOR OF                   ι DIRECTOR OF
      PRODUCT                  ENGINEERING                     GROWTH
   ├ κ Product Lead         ├ Frontend Lead → FE Builder    ├ λ Research Lead
   ├ μ Design Lead          │                 + FE Reviewer ├ ν Copy Lead
   └ θ Quality Lead         ├ Backend Lead  → BE Builder    ├ ο Conversion Lead
       dispatches:          │                 + BE Reviewer └ ξ Marketing Lead
       QA Reviewers ·       └ Security Lead → Security Builder
       design-quality ·                       + Security Reviewer(s)
       visual-review · test-runner
                         every Reviewer verdict is BINDING — the Lead/Director
                         cannot override a FAIL; roster is registry-fixed.

   ══ SHARED `_knowledge/` (DATA, not an org box) — fed by the leads, drawn by all ════
   audience (Research Lead) · copy (Copy Lead) · design (Design Lead) · state (per sprint)
```

**Faces of Alex** (one identity, mode-selected — NOT separate org titles): α run · β check · γ adhoc-deliver · δ oneshot-deliver · ε sprint-deliver *(ε design-locked, not built)*. `"Alex"` is the hidden true-name; the Greek letter is the call-sign.

**The dispatched-reviewer model (the core structural shift).** There is no monolithic `qa` agent and no `redteam` agent. Instead, a **Lead dispatches one or more Reviewers**, each parameterized by a *review scope* passed at dispatch:
- **Security Lead** → dispatches **Security Reviewer(s)** (scope: OWASP, authn/z, injection, secrets…). *Replaces the `redteam` agent.* ✅ operator-directed
- **Quality Lead** → dispatches **QA Reviewer(s)** (scope: the failure-mode personas; functional + UI/UX experience). *Replaces the monolithic `qa` agent.* ✅ operator-directed
- **Frontend/Backend Leads** → dispatch **Builder** + **Reviewer(s)** for their pod.

**The independence invariant (load-bearing).** No agent renders a verdict on work *it authored*; the dispatcher/Lead **cannot override a FAIL**; the reviewer roster is **registry-fixed** (a Lead can't hand-pick a friendly reviewer). This — not org separation — is what makes reviewer-and-builder-under-one-Lead safe.

**Cross-provider diversity** stays a *dispatch property* of the Reviewer (≥1 reviewer on a different provider), not a separate agent type.

**Agents are mode-agnostic (workers don't fork by mode).** Builders, Reviewers, Fixers, Leads, Directors have **one spec each** and behave identically in adhoc / oneshot / sprint. What changes per mode is the **orchestration**, never the worker: (1) the conducting face (γ adhoc · δ oneshot · ε sprint); (2) the lifecycle/cadence (single feature · full skeleton + cycles + learner · the 6-step sprint); (3) the **composition** — which agents/scopes are engaged, decided by the manager-set router by unit-type/risk; (4) the autonomy posture (oneshot solo; adhoc + sprint have human/α/β). A worker takes input → does its scoped job → returns a result; **IO + escalation routing is the orchestrator's job, not a fork in the worker.** The three faces **wrap one shared toolkit, never forked** (δ's full lifecycle is ε's precedent). *This mode-agnosticism is exactly what lets the `01-adhoc/`+`02-oneshot/` duplication collapse into one tree.*

**Multiplicity — workers fan out, managers are singletons.** The **worker tier** (Builders · Reviewers · Fixers — incl. QA Reviewers and Security Reviewers) is **multi-instance**: a Lead can dispatch *several at once* on independent work — 3 FE Builders on 3 components, 2 Security Reviewers on different lenses — each in its **own isolated worktree**, each rendering its **own binding verdict**. The **manager tier** (Alex faces · Directors · Leads) is **single-instance** — exactly one of each, persistent — so authority, ownership, and verdict-binding stay unambiguous. A Lead **scales by fanning out workers, never by cloning itself**. (Pairs with parallel-builds-by-default.)

### Roster (target)

| Letter | Role | Home | Dispatches |
|---|---|---|---|
| α | (Alex) run face | Alex | the work |
| β | (Alex) check face | Alex | — (read-only verdict) |
| γ·δ·ε | (Alex) deliver faces | Alex | builders/reviewers per mode |
| ζ | Director of Product | Product | — |
| κ | Product Lead | Product | — |
| μ | Design Lead | Product | — |
| θ | Quality Lead | Product | QA Reviewers · design-quality · visual-review · test-runner |
| η | Director of Engineering | Engineering | the pods |
| — | Frontend Lead | Engineering | FE Builder + FE Reviewer(s) + FE Fixer |
| — | Backend Lead | Engineering | BE Builder + BE Reviewer(s) + BE Fixer |
| — | Security Lead | Engineering | Security Builder + Security Reviewer(s) + Security Fixer |
| ι | Director of Growth | Growth | — |
| λ | Research Lead | Growth | — (audience research → `_knowledge/audience`, shared) |
| ν | Copy Lead | Growth | — |
| ο | Conversion Lead | Growth | — |
| ξ | Marketing Lead | Growth | — (paid media · campaigns) |

*(Greek letters are display call-signs; the canonical α→ρ tier-ordered re-lettering is finalized during the build, not load-bearing here.)*

### Copy & content flow (the seam to the build)

Builders never reach *into* the copy system — copy is **delivered as a contract**:
1. **`_knowledge/copy`** holds the shared copy system — voice, hooks, customer language, principles (cross-cut; same source Marketing uses).
2. **Design phase:** the **Copy Lead** authors the feature's actual strings into **`COPY.md`** (the C-N copy items) grounded in that voice; the **Design Lead** pairs them with the UI so the mockup shows the *real words*.
3. **Build phase:** `COPY.md` ships to the **Frontend Builder** *inside the build spec* (with PRD/stories/flow). The builder wires in the **exact strings** — inventing or placeholder copy = **Reviewer FAIL** (the no-invented-data grounding rule).

The *same* voice feeds marketing copy AND in-app `COPY.md` → product and ads speak in one voice (this is *why* copy is shared knowledge, not siloed in Marketing). **Split to confirm:** Copy Lead owns the voice + high-leverage copy (headlines, onboarding, marketing); routine product microcopy (labels, states, errors) may be authored by the **Design Lead** straight from `_knowledge/copy`, so Marketing isn't a per-label bottleneck.

### Knowledge integration (how `_knowledge/` reaches the agents)

The knowledge is **wired into the agents that consume it** — the proven guide-anchor mechanism, generalized from `_guides/` to `_knowledge/`:
- **Source / where it comes from:** `_knowledge/copy` is populated from (a) ingested copy **methodology** (argument-not-copy · hooks-are-90 · voice), (b) the **Research Lead's** audience work (`_knowledge/audience` → the customer's real language), (c) the product **canon** (JTBD/vision/promise → the claims boundary).
- **Wiring:** each consuming agent spec (Copy Lead, Design Lead, Conversion/Growth) carries an anchor (`<!-- COPY-KNOWLEDGE -->`); an integrate step (the `/guides:integrate` pattern → a `_knowledge:integrate` analog) wires the relevant knowledge into that anchor — idempotent, recorded in an integration ledger — so the agent runs *with* the copy system in its context.
- **Enforcement:** a coverage scan (the `/guides:coverage` analog) asserts every knowledge file is wired into its consumers and no anchor is stale → no orphan knowledge, no silent drift.
- **Built vs designed:** the machinery EXISTS for `_guides/` (`/guides:integrate` + `/guides:coverage` + the anchor contract + `guide-integration.jsonl`). `_knowledge/` generalizes it to wire into **agents** (not the user-facing bootstrap pipeline) — that generalization is the **M1** build.

---

## 2. Target folder structure + naming

**Principle:** folders mirror the **org**, not the **mode**. The build roles live once under their department; the Alex faces (γ/δ/ε) dispatch into them per mode — so the current `01-adhoc/` ↔ `02-oneshot/` duplication collapses to one set.

```
.claude/agents/
  president/                    # Alex's faces — the President (was 00-alex/)
    alpha.md  beta.md  gamma.md  delta.md  epsilon.md(NEW)
    .system/                    # policy, lexicon, beta judgment, ADRs (moved as-is)
  product/
    director-of-product.md
    product-lead.md
    design-lead.md              # was product-designer.md
    quality-lead.md             # was director-of-qa.md
    quality/                    # what the Quality Lead dispatches
      qa-reviewer.md            # was qa/{orchestrator,scan,analyze}.md → one parameterized reviewer
      design-quality.md
      visual-review.md
      test-runner.md
  engineering/
    director-of-engineering.md
    _build-core.md              # shared builder discipline (was _build-core/)
    _review-core.md             # shared reviewer discipline (was reviewer/req-reviewer/compliance)
    frontend/   frontend-lead.md  builder.md  reviewer.md  fixer.md
    backend/    backend-lead.md   builder.md  reviewer.md  fixer.md
    security/   security-lead.md  builder.md(NEW)  reviewer.md  fixer.md   # reviewer was redteam
  growth/                       # was marketing/ — research + message + conversion + paid
    director-of-growth.md       # was director-of-marketing.md
    research-lead.md            # was research-insight-lead.md (moved out of knowledge/)
    copy-lead.md
    conversion-lead.md          # was web-conversion-designer.md
    marketing-lead.md           # was growth-lead.md
  # no knowledge/ agent folder — the _knowledge/ STORES are shared DATA, fed by the leads:
  #   audience←Research Lead · copy←Copy Lead · design←Design Lead · state←per sprint
  _system/                      # cross-cut infra, mode-agnostic
    learner.md
    stub-scaffold.md
    agent-dispatch-guide.md  .system.md  protocol.md (merged adhoc+oneshot)
```

**Naming conventions:** file = role in `kebab-case`; frontmatter carries `call_sign` (Greek), and for the Alex faces `true_name: Alex`; one spec per role (no per-mode duplicates); `_prefixed` = shared discipline/infra, not a dispatchable agent.

### Dispatch rules (how the mode-collapse stays safe)

Today the on-disk system has **two spec files per build role** (`01-adhoc/` + `02-oneshot/`) — that duplication is the hazard we're removing. The target dispatches cleanly:
1. **Address by role NAME; one spec per role.** `claude -p --agent frontend-builder` → the ONE `engineering/frontend/builder.md`. No mode in the name/path → no two-files-same-name ambiguity.
2. **Mode is CONTEXT the orchestrator passes**, never part of the agent's identity. The same spec serves adhoc/oneshot/sprint; γ/δ/ε pass the mode + scope + IO target as input.
3. **Routing source of truth = the Dispatch Console** (`catalog.js` + `providers.js`): role → provider → model → effort. Claude roles dispatch via `claude -p --agent <role>` (in-process); openai/gemini via `dispatch-agent.js` (which *refuses* Claude roles by design).
4. **The collapse only breaks dispatch if the reference sweep is incomplete** — a role-list or routing table still pointing to a removed/renamed role (`redteam`, generic `builder`, `qa`) or an old mode-path. That is exactly what **`scan:role-parity`** (every routed role ↔ exactly one spec; no orphans) + **`scan:dispatch-routing-parity`** (routing tables agree across `providers.js`/`catalog.js`/the guide) catch — both build-gates. **So dispatch gets *cleaner*, not more broken: one name → one spec, with the parity scans as the tripwire.**

---

## 3. Diff analysis — current → target (absorbable vs scrap)

**Dispositions:** KEEP · RENAME · REHOME · ABSORB (folded into another role) · RESTRUCTURE (shape changes) · SCRAP (delete) · NEW.

| Current agent (live) | Disposition | Target | Notes / references to sweep |
|---|---|---|---|
| `alpha` | KEEP | Alex · α | identity → President "run" face; add `true_name: Alex` |
| `beta` | KEEP | Alex · β | independent check; verdict-binding |
| `gamma` | KEEP | Alex · γ | adhoc deliver face |
| `delta` | KEEP | Alex · δ | oneshot deliver face |
| — | **NEW** | Alex · ε | sprint deliver face — design-locked, build in Phase D |
| `director-of-product` | KEEP | ζ | — |
| `product-lead` | KEEP | κ | — |
| `product-designer` | **RENAME** | μ Design Lead | owns UI/UX authoring + mockups |
| `director-of-qa` | **RENAME + REHOME** | θ Quality Lead (under Product) | broaden: functional **+** experience; dispatches QA Reviewers |
| `research-insight-lead` | **RENAME + REHOME** | λ Research Lead (under Director of Growth) | audience research → `_knowledge/audience` (shared, drawn by all) |
| `director-of-engineering` | KEEP | η | orchestrates pods |
| `frontend-builder` | **RENAME + REHOME** | engineering/frontend/builder | under Frontend Lead |
| `backend-builder` | **RENAME + REHOME** | engineering/backend/builder | under Backend Lead |
| `builder` (generic) | **SCRAP** ✅ | — | operator-decided; superseded by FE/BE builders — still **sweep refs** (role-parity.test.js + catalog ROLES list it) |
| `reviewer` | **KEEP → pod Reviewer** | engineering pod `reviewer` (code-quality only) | FE/BE/Security pod code reviewer; traceability + integrity moved to QA |
| `req-reviewer` | **ABSORB → QA** ✅ | QA Reviewer scope (traceability) under **Quality Lead** | operator-decided; pod Reviewers = code-quality only |
| `compliance` | **ABSORB → QA** ✅ | QA Reviewer scope (integrity, **cross-provider**) under **Quality Lead** | operator-decided; keep cross-provider; mode/risk-gated by the router |
| `qa/{orchestrator,scan,analyze}` | **RESTRUCTURE** | QA Reviewer(s) dispatched by Quality Lead | ✅ operator-directed; 13 personas → review scopes |
| `redteam/{orchestrator,scan,analyze}` | **RESTRUCTURE → SCRAP agent** | Security Reviewer(s) dispatched by Security Lead | ✅ operator-directed; **SWEEP ~60 refs** (see below) |
| `fixer` | **RESTRUCTURE → per-pod** ✅ | FE Fixer · BE Fixer · Security Fixer (one per pod, under each Lead) | operator-decided; keep "fix one brief, ≤3 attempts"; Fixer authors → **Reviewer re-runs after every fix** |
| — | **NEW** | Frontend Lead · Backend Lead · Security Lead | the Lead layer (today builders are dispatched directly) |
| — | **NEW** | Security Builder | builds hardening (authn/z, secrets, validation) |
| `design-quality` | KEEP + **REHOME** | product/quality/ | under Quality Lead |
| `visual-review` | KEEP + **REHOME** | product/quality/ | under Quality Lead |
| `test-runner` | KEEP + **REHOME** | product/quality/ | E2E tool under Quality Lead |
| `learner` | KEEP + **REHOME** | _system/ | cross-cycle learning (mode-agnostic) |
| `stub-scaffold` | KEEP + **REHOME** | _system/ | skeleton stub regen (build infra) |
| `_build-core` | KEEP + **REHOME** | engineering/_build-core | shared builder discipline |
| `director-of-marketing` | **RENAME** | ι Director of Growth | dept Marketing → **Growth** (research + message + conversion + paid) |
| `growth-lead` | **RENAME** | ξ Marketing Lead (under Growth) | paid media · campaigns · EQ scoring |
| `copy-lead` | **KEEP** | ν (under Growth) | **stays** (operator-reverted); also seeds `_knowledge/copy` |
| `web-conversion-designer` | **RENAME** | ο Conversion Lead (under Growth) | owns conversion copy + page |
| `01-adhoc/` ↔ `02-oneshot/` duplication | **COLLAPSE** | one department-based set | faces dispatch per mode; no per-mode role copies |

**Reference blast-radius to sweep (no-stray rule extends to references, not just specs):**
- `redteam` → ~60 files: `scripts/dispatch/state.js` (`GEMINI_ROLES`), `org-roles.js`, `provider-trace.js`, `delta-*-gauntlet.js` fallbacks, `role-parity.test.js`, `catalog.js` ROLES, `dispatch-route-guard.js`/`dispatch-claude.js` BUILD_CHAIN_ROLES, `agent-dispatch-guide.md`, sprint artifacts (`redteam-plan.md`), maps, manifests, `framework/releases/*`.
- `qa` → role-lists in the same files (`MINI_OPENAI_ROLES`, reviewGauntletRoles, etc.).
- `builder`/`reviewer`/`compliance`/`fixer` → BUILD_CHAIN_ROLES, role-parity, org-roles, catalog ROLES.
- Routing source-of-truth to update together: `org-map.json` + `org-roles.js` + `catalog.js` + `dispatch-route-guard.js` + `dispatch-claude.js` + the dispatch guide (parity enforced by `scan:dispatch-routing-parity`).

**OUT OF SCOPE — do NOT touch (Claude Code harness agents, not WarpOS org):** `Explore`, `Plan`, `general-purpose`, `claude`, `statusline-setup`, `claude-code-guide`.

**No-stray assertion:** every live WarpOS agent above has a disposition. After the build, `scan:role-parity` + `scan:dispatch-routing-parity` + a fresh `subagent_type` enumeration must show ZERO roles that aren't in the target roster, and ZERO target roles without a spec.

---

## 4. Verification checklist — "every inch"

Walk this before declaring the build done. Each line is a concrete assertion.

**A. Identity & naming**
- [ ] Alex = President everywhere (CLAUDE.md identity, AGENTS.md, AGENT-STRUCTURE.md, specs).
- [ ] α/β/γ/δ/ε framed as *faces*, not separate org titles.
- [ ] `true_name: Alex` on the face specs; Greek call-sign on every role.
- [ ] No stray "Alex α / Beta / COO / Chief of Staff" old-title language in prose.

**B. Org structure & reporting**
- [ ] 3 departments (Product/Eng/Marketing) + Knowledge layer, all reporting to Alex (President).
- [ ] Product = Product Lead + Design Lead + Quality Lead.
- [ ] Engineering = Director + Frontend/Backend/Security Leads, each with Builder + Reviewer(s).
- [ ] Marketing = Director + Growth Lead + Conversion Lead + **Copy Lead**.
- [ ] Knowledge = Research/Insight Lead steward + the 4 stores (audience/copy/design/state); "everyone contributes & draws."

**C. The independence invariant**
- [ ] Every Reviewer verdict is BINDING; no Lead/Director can override a FAIL.
- [ ] Reviewer roster is registry-fixed (not Lead-chosen).
- [ ] No agent judges work it authored (Design Lead authors / Quality judges; Builder authors / Reviewer judges).
- [ ] Cross-provider diversity preserved as a dispatch property.

**D. Dispatched-reviewer model**
- [ ] No monolithic `qa` agent; Quality Lead dispatches QA Reviewer(s).
- [ ] No `redteam` agent; Security Lead dispatches Security Reviewer(s).
- [ ] req-reviewer + compliance → **QA Reviewer scopes** (Quality Lead); Engineering pod Reviewers = **code-quality only** — RESOLVED.
- [ ] (default) fixer scrapped / Builder self-fixes — decision recorded.

**E. Decisions captured (this session)**
- [ ] Alex=President · faces · hidden true-name. β stays separate (can't merge into α).
- [ ] Everyone reports to the President. QA under Product (Quality Lead). Research → Knowledge (cross-cut). Copy Lead reverted-in.
- [ ] Product Designer→Design Lead · QA Lead→Quality Lead (broadened) · Web-Conversion Designer→Conversion Lead.
- [ ] Engineering pods; Security/QA as dispatched Reviewers; redteam scrapped.

**F. No stray (the operator's hard requirement)**
- [ ] Every live agent in §3 dispationed; none orphaned.
- [ ] All `redteam`/`qa`/`builder`/`fixer` references swept across scripts/routing/maps/manifests/sprint-artifacts.
- [ ] `01-adhoc/`+`02-oneshot/` duplication collapsed; no per-mode role copies remain.
- [ ] Harness agents untouched.

**G. Cross-doc consistency**
- [ ] `AGENT-STRUCTURE.md` ↔ `DUMP.md` ↔ this plan ↔ `org-map.json` ↔ `org-roles.js` ↔ `catalog.js` ↔ dispatch guide all agree.
- [ ] Both manifests regenned (framework-manifest → installed) after edits.
- [ ] `scan:role-parity`, `scan:dispatch-routing-parity`, `scan:references`, `scan:install` all green.

---

## 4.5 Open decision — model routing (decide at build)

**Which model / provider / effort does each role use?** The new roster (Alex faces · the Leads · per-pod Builder/Reviewer/Fixer · QA Reviewer scopes · Security Reviewer · directors · ε) needs an explicit **role→model map**. Today: α/γ on Claude Opus, β on Sonnet; `state.js` pins reviewer/compliance/learner→OpenAI-flagship, qa→OpenAI-mini, redteam→Gemini. The rewrite must redefine this for the new roles while preserving:
- **Cross-provider diversity** — ≥1 reviewer on a different provider than the builder (no shared blind spots).
- **The 2nd-GPT security pass** — Security runs twice (Gemini corpus-diverse + OpenAI jailbreak-tuned).
- **Model-by-risk/capability** — heavier model + effort for high-risk / money / data units; cheaper for low-risk.

Source of truth = the **Dispatch Console** (`catalog.js` + `providers.js`); enforced by `scan:dispatch-routing-parity`. This is the **one open decision added post-design** — settle it before/at the build.

---

## 5. Build sequencing (for the follow-up session — NOT now)
1. Write **ADR-0007** (org rewrite) at build start; re-ratify all-persistent residency + DoE-as-orchestrator with η + β.
2. ✅ **All flagged decisions RESOLVED:** req-reviewer + compliance → QA Reviewer scopes (Quality Lead) · pod Reviewers = code-quality only · `fixer` → **per-pod FE/BE/Security Fixers** (keep fix-one-brief discipline; re-review after each fix) · generic `builder` **scrapped** · workers **mode-agnostic** (orchestration differs, not the worker).
3. Execute the diff in §3 (rename/rehome/scrap/new), one reviewable chunk at a time; foreground (no background builder dispatch — RI-004).
4. Sweep ALL references (§3 blast-radius) — grep the OLD literal everywhere, not just specs.
5. Regen both manifests; run the §4 checklist end-to-end; converge (re-run, don't single-pass).
