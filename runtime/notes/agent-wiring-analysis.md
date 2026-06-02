# Agent Wiring Analysis — Designers + Managers ↔ Guides ↔ Pipelines

Read-only analysis of WarpOS canonical. Date: 2026-06-02. Scope: how the DESIGNER and
MANAGERIAL agents (`.claude/agents/03-managers/` + `.claude/agents/02-oneshot/{design-quality,visual-review}/`)
connect to the `_guides/` training library and the bootstrap / portfolio / sprint pipelines.

---

## 1. Designer ↔ Guides wiring — VERDICT: LIVE (but via a SEPARATE mechanism, not `/guides:integrate`)

**Verdict: the four designer/visual agents ARE wired to the design-principles guide library, and the wiring is LIVE (embedded in the agent specs, not aspirational). BUT it was NOT done by `/guides:integrate` — that skill is structurally incapable of wiring guides into agents.**

### The two guide libraries are deliberately split

There are **two** registries with **two** different purposes:

| Registry | Guides | `anchor` | Purpose | Wired by |
|---|---|---|---|---|
| `_guides/registry.json` | 6 launch guides (AUTH, DATABASE, DEV_SETUP, EMAIL, PAYMENTS, PRIVACY_GDPR) + README | real anchors (`spinup:preflight`, `lastmile:module/*`, `lastmile:gate/*`) | staged founder launch guides | `/guides:integrate` → bootstrap pipeline |
| `_guides/design/registry.json` | 19 design-principles guides (VISUAL_HIERARCHY, ACCESSIBILITY_WCAG, …) | **`anchor: "none"` for ALL 19** | **agent-grounding training references** | embedded `<!-- DESIGN-GUIDES:... -->` blocks inside agent specs (manual) |

The design registry states this explicitly (`_guides/design/registry.json:4`):
> "anchor:none for all — these are AGENT-GROUNDING training references, not bootstrap launch guides."

Each of the 19 design guides carries a `trains: [...]` array and a `maps_to: [...]` array
(`_guides/design/registry.json:7-178`) targeting the four agents' own vocabularies
(`design_quality_axes` + `visual_review_categories`, defined at `registry.json:5-6`).

### The actual designer↔guides wiring is in the agent specs (LIVE)

All four design agents carry an **additive `<!-- DESIGN-GUIDES:<agent> -->` block** that references
`_guides/design/`, the registry, the README, and instructs the agent to apply each guide's §6
agent-applicable RULES:

- `product-designer.md:117-138` — DESIGN-GUIDES block; lists all 19 guides grouped by category.
- `web-conversion-designer.md:96-116` — DESIGN-GUIDES block; its conversion-lane subset.
- `design-quality/design-quality.md:94-117` — DESIGN-GUIDES block with a **per-axis owning-guide table** (6 axes → guides), mirroring `registry.json#coverage.design_quality_axes`.
- `visual-review/visual-review.md:70-94` — DESIGN-GUIDES block with a **per-category owning-guide table** (7 categories → guides), mirroring `registry.json#coverage.visual_review_categories`.

These are **load-bearing and live**: the agents read them on every invocation. The `trains:` /
`maps_to:` fields in the registry and the per-axis/per-category tables in the specs are consistent
with each other (cross-checked: e.g. `design-tokens` axis → CONSISTENCY_DESIGN_SYSTEMS_TOKENS ·
TYPOGRAPHY · COLOR_AND_CONTRAST · LAYOUT_GRID_SPACING · DEPTH_ELEVATION_IMAGERY in BOTH the spec
table and the registry coverage block).

### `/guides:integrate` does NOT (and cannot) wire guides into designers

- `/guides:integrate` (`.claude/commands/guides/integrate.md:48`) processes only guides with
  `anchor != none`, and its anchor→plugin-spot map (`integrate.md:32-41`) resolves only to
  `spinup.md` / `lastmile.md` regions. There is **no agent-target plugin spot**. An `anchor: none`
  guide is explicitly "not wired" (`integrate.md:41`, `:79`).
- The integration ledger (`.claude/project/maps/guide-integration.jsonl`) confirms this: it contains
  **exactly 6 records**, all for the launch guides into `spinup.md` / `lastmile.md` — **zero records
  reference any design guide or any designer agent**.
- `/guides:coverage` (`coverage.md:14-24`) enforces only that `anchor != none` guides have a ledger
  record + a bootstrap-file marker. **It does NOT verify the designer↔design-guide wiring at all** —
  the 19 design guides are `anchor: none`, so coverage treats them as "not to be wired" and never
  checks the `<!-- DESIGN-GUIDES -->` blocks.

### THE GAP (designer↔guides)

The designer↔design-guides wiring is **real but UNENFORCED**. The `<!-- DESIGN-GUIDES -->` blocks are
hand-maintained prose. Nothing detects:
- a design guide added to `_guides/design/` but never added to an agent's block;
- a `trains:`/`maps_to:` registry entry that drifts from the agent spec's table;
- an agent block that references a guide that no longer exists.
This is the exact "contract defined but not applied" drift class `/guides:coverage` was built to kill —
but for a different (launch-guide) surface. The design library has no analog enforcer.

---

## 2. Designer usage in bootstrap / portfolio

| Skill | Dispatches a designer? | How / where | Live? |
|---|---|---|---|
| `bootstrap:spinup` | **Mention only, no dispatch** | `spinup.md:127-133` names `visual-review` as an *opt-in* visual confirmation pass (Phase 4 "On screen"), gated on Playwright MCP being connected; BAILs otherwise. `spinup.md:135-142` adds a `design-overview-pointer` callout pointing readers at `_guides/design/README.md` and naming the 4 design agents — but it is a **pointer, not a dispatch**. | Partial — visual-review is invocable but optional; no automatic designer dispatch |
| `bootstrap:lastmile` | **No** | No designer reference. | n/a |
| `bootstrap:ponder` | **No** | No designer reference. | n/a |
| `portfolio:spinup` / `portfolio:new` / `portfolio:run` / others | **No** | Portfolio skills are thin wrappers / scaffolders; they delegate to `bootstrap:spinup` for the on-ramp but add no designer dispatch of their own. | n/a |

**Note:** the `design-overview-pointer` in `spinup.md:135` is explicitly NOT a `guide-anchor` marker
(it says so in the comment) — so it is invisible to `/guides:coverage` and is the *only* place the
bootstrap pipeline surfaces the design library, and only as a README link.

---

## 3. Designer usage in sprints — VERDICT: NOT WIRED

| Sprint skill | product-designer | web-conversion-designer | design-quality | visual-review |
|---|---|---|---|---|
| `sprint:design` | **No** | No | No | No |
| `sprint:execute` | No | No | No | No (only mentions "gauntlet" generically) |
| `sprint:full` | No | No | No | No |

- `sprint:design.md` is entirely **script-driven** (`scripts/sprint/design.js`) + hand-edit + a
  generic **Beta review** step (Step 6, `design.md:142-157`). It does NOT consult `product-designer`
  for UX of the authored stories, nor `director-of-engineering` for the build_spec/architecture, nor
  `product-lead` for requirement authoring, nor `director-of-qa` for the QA plan — **despite all four
  specs naming `sprint:design` as a "natural/first intended consumer."** (product-designer.md:185;
  director-of-engineering.md:226-228; product-lead.md:217; director-of-qa.md:188.)
- The build gauntlet is owned by **Gamma** (`.claude/agents/00-alex/gamma.md`). Gamma's gauntlet is
  the **four engineering reviewers** (reviewer · compliance · qa · redteam, `gamma.md:261`) + a test
  pilot. Gamma dispatches **`visual-review`** when the diff touches UI (`gamma.md:275-292`,
  multimodal, parallel with test-runner). Gamma does **NOT** dispatch **`design-quality`** — the
  org's *named cross-domain design authority* — anywhere.
- The Delta (oneshot) orchestrator likewise does not dispatch `design-quality` or run the gate; it
  only references `visual-review` in a dispatch-rule comment (`delta.md:113`).

### The biggest single gap (and it lives here)

**`design-quality` is the org-map's `is_named_design_authority: true` gauntlet
(`org-map.json:42-48`), it is a registered dispatch role (`catalog.js:214,232,250`), it has a
fully-built two-lane launcher `scripts/checks/design-quality-gate.js` (+ a passing bite-test
`design-quality-gate.test.js`) — and NOTHING invokes it.** A repo-wide search for
`design-quality-gate` across `.claude/commands`, `scripts/dispatch`, and the oneshot launchers
returns **zero callers**. The gate exists; the gauntlet exists; the wiring from any build/sprint
pipeline into the gate **does not**. The static lane (`scan:design-system` / `design-system.js
--strict`) runs, but the judgment lane (the actual design authority) is never launched by a pipeline.

This is the textbook aspirational-vs-enforced pattern from CLAUDE.md "Policy & Enforcement Hygiene":
the policy ("rendered UI is approved by the named design authority before ship") has a fully-built
enforcer that is simply **not called**.

---

## 4. Per-managerial-agent wiring table

Legend: **Invoked-by** = skills that dispatch it via `subagent_type:` (Agent/Task tool) or name it as
a consult. **Connected-to-guides** = references the design-principles library (only the design
specialists do; the strategy managers have no guide library). **Status** = LIVE-WIRED (≥1 skill
dispatches it) / CONSULT-ONLY (named as consult in skill prose, dispatched ad hoc) / ORPHAN (defined,
org-mapped, but no skill invokes it).

| Agent | Defined? | org-map `agent` | Invoked-by skills (file:line) | Guides? | Status |
|---|---|---|---|---|---|
| **director-of-product** | yes | populated | `roadmap:create` (create.md:38), `roadmap:ideas` (ideas.md:14), `roadmap:next` (next.md:14), `roadmap:prioritize` (prioritize.md:14,29), `playbook:add` (add.md:45 consult), `session:end`/`session:dump` (end.md:35 consult) | no | **LIVE-WIRED** |
| **product-lead** | yes | populated | `roadmap:ideas` (ideas.md:13), `roadmap:next` (next.md:13), `roadmap:prioritize` (prioritize.md:13,29), `roadmap:create` (create.md:44, conditional) | no | **LIVE-WIRED** |
| **director-of-qa** (alias qa-lead) | yes | populated | `playbook:add` (add.md:45 consult). Named as consumer by `qa:audit`/`qa:check`/`sprint:design`/`sprint:release` in its own spec but those skills do NOT dispatch it. | no | **CONSULT-ONLY / near-ORPHAN** |
| **director-of-marketing** | yes | populated | `growth:message-brief` (message-brief.md:24,38), `growth:advertorial` (advertorial.md:33), `growth:ad-images` (ad-images.md:32), `growth:product-finder` (product-finder.md:28) | no | **LIVE-WIRED** |
| **copy-lead** | yes | populated | `growth:advertorial` (advertorial.md:31-32,61,65), `growth:angles` (angles.md:24,39), `growth:message-brief` (message-brief.md:27), `growth:ad-video` (ad-video.md:29,40), `growth:ad-images` (ad-images.md:32), `growth:landing-page` (landing-page.md:26,50) | no | **LIVE-WIRED** |
| **growth-lead** | yes | populated | `growth:product-finder` (product-finder.md:26,53), `growth:iterate` (iterate.md:29) | no | **LIVE-WIRED** |
| **research-insight-lead** | yes | populated | `growth:angles` (angles.md:26), `growth:message-brief` (message-brief.md:29) | no | **LIVE-WIRED (light)** |
| **director-of-engineering** | yes | populated | **NONE.** Names `sprint:design`/`sprint:plan`/γ-δ dispatch as consumers (doe.md:226-228) but no skill dispatches it. | no | **ORPHAN** |
| **product-designer** | yes | populated | **NONE.** Names `sprint:design`/`ui:review`/`scan:design-system`/`bootstrap:spinup` as consumers; verified none dispatch it (`ui/review.md`, `scan/design-system.md` have zero matches). | YES (spec block) | **ORPHAN** |
| **web-conversion-designer** | yes | populated | `growth:landing-page` (landing-page.md:24-25,40) | YES (spec block) | **LIVE-WIRED** |
| **design-quality** (gauntlet) | yes | named authority | **NONE dispatch it.** Launcher `design-quality-gate.js` built + tested but has zero callers. Referenced in `growth:landing-page` prose (landing-page.md:28,55,62) as the formal approver, but not dispatched. | YES (spec block) | **ORPHAN (built, uncalled)** |
| **visual-review** | yes | (claude role) | `gamma.md:275-292` (build gauntlet, UI-diff-gated), `bootstrap:spinup` (spinup.md:129 opt-in) | YES (spec block) | **LIVE-WIRED** |

### Summary counts
- **LIVE-WIRED (7):** director-of-product, product-lead, director-of-marketing, copy-lead, growth-lead, research-insight-lead, web-conversion-designer, visual-review. (Marketing domain + product-roadmap domain are fully wired; visual-review is the one design agent wired into the build chain.)
- **CONSULT-ONLY / near-orphan (1):** director-of-qa (only a passive `playbook:add` consumer).
- **ORPHAN (3):** director-of-engineering, product-designer, design-quality.

### Pattern
The wiring is **domain-lopsided**:
- **Marketing domain** (director-of-marketing, copy-lead, growth-lead, web-conversion-designer) → fully wired into the `growth:` skill pack. This is the most mature.
- **Product-roadmap surface** (director-of-product, product-lead) → fully wired into the `roadmap:` pack with clean single-product-vs-strategic routing.
- **Engineering + app-design + QA-as-advisor + the design authority** → defined, org-mapped, enforcers built, but **no pipeline dispatches them.** `sprint:*` is the conspicuous hole: every product/engineering/QA manager names `sprint:design` as its consumer, and `sprint:design` consults none of them (only generic Beta).

---

## 5. Unification proposal — _guides_ (training) → designers/managers (judgment) → pipeline

### The target model

```
TRAINING            JUDGMENT                         PIPELINE                       ENFORCER
_guides/design/  →  product-designer            →   sprint:design (UX of stories)  →  design-agent-coverage scan
(19, anchor:none)   web-conversion-designer     →   growth:landing-page  [done]    →  (already wired)
                    design-quality (authority)  →   gamma + delta build gauntlet   →  design-quality-gate.js (CALL it)
                    visual-review               →   gamma gauntlet  [done]         →  (already wired)

_guides/ (launch) → (no agent — staged founder guides) → spinup/lastmile [done]    →  guides:coverage [done]

(no guide lib)   →  director-of-product / product-lead → roadmap:* [done]          →  manager-principles-scan [done]
                    director-of-marketing/copy/growth   → growth:* [done]          →  manager-principles-scan [done]
                    director-of-engineering             → sprint:design/plan       →  (NEW) sprint-manager-consult check
                    director-of-qa                      → sprint:design/release    →  (NEW) sprint-manager-consult check
```

### Concrete wirings + their enforcers (each closes a gap above)

**W1 — Call the design authority from the build gauntlet (closes the #1 gap).**
- *Anchor:* Gamma's test-pilot phase (`gamma.md:261-300`) and Delta's oneshot gauntlet. Where Gamma
  today dispatches `visual-review` on a UI diff, it should ALSO (in app-design / web-design units)
  run `design-quality-gate.js` — lane 1 (`design-system.js --strict`) + lane 2 (dispatch
  `design-quality`, capture the DesignQualityResult, pass via `--judgment`).
- *Enforcer:* `design-quality-gate.js` already exists and fails-closed (REJECT on either lane;
  arbitration on missing judgment). The wiring gap is purely **"the orchestrator never calls it."**
  Add a Gamma/Delta gate step + a `gauntlet-verify`-style telemetry record (mirror
  `gamma.md:238-256`) so a missing design-quality dispatch on a UI unit self-flags as `no-record`.

**W2 — Consult product/eng/QA managers in `sprint:design` (closes the manager-orphan gap).**
- *Anchor:* `sprint:design.md` Step 2 (hand-edit) and Step 6 (currently generic Beta). Add explicit
  consults: `product-lead` authors/owns the build_spec + acceptance (its declared S2.1 job),
  `director-of-engineering` rules on the build_spec shape + FE/BE split + integration seam,
  `director-of-qa` produces the QA plan (Scope×Depth), `product-designer` reviews the UX of the
  authored stories (app-design units).
- *Enforcer:* a new `scan:sprint-manager-consult` (analog of `manager-principles-scan`) that asserts,
  for a sprint whose units include product/eng/UI work, the design-phase artifacts carry a
  `manager-consult` telemetry record for the relevant role — OR a logged `/enforcement:log` debt.
  Today the four manager specs *claim* `sprint:design` consumes them; nothing detects the claim is
  false. (This is exactly the "every policy names its enforcer" rule.)

**W3 — Wire product-designer into the design-craft entry points.**
- *Anchor:* `ui:review` and `scan:design-system` (the product-designer spec names both as consumers).
  Have `ui:review` dispatch `product-designer` for the craft judgment that a static scan can't make
  (cohort fit, cognitive load, state coverage), feeding the design-quality gauntlet.
- *Enforcer:* fold into W1's design-quality-gate telemetry (the craft input is part of the judgment
  lane's record) + the W4 coverage scan below.

**W4 — Enforce the designer↔design-guide wiring (closes the unenforced-training gap).**
- *Anchor:* the `<!-- DESIGN-GUIDES:<agent> -->` blocks in the 4 design agent specs +
  `_guides/design/registry.json`.
- *Enforcer:* a new `scan:design-guides-coverage` (the design-library analog of `/guides:coverage`)
  that fail-closed asserts: (a) registry fresh vs the 19 guides' frontmatter; (b) every guide's
  `trains:` agents each carry a DESIGN-GUIDES block that lists that guide; (c) every agent block's
  guide refs resolve to a real `_guides/design/*.md`; (d) the per-axis/per-category tables in
  design-quality.md / visual-review.md match `registry.json#coverage`. This is the missing twin of
  the launch-guide `guides:coverage` — same drift class, different surface.

**W5 — Surface the design library in bootstrap as a wired anchor, not a bare pointer (optional).**
- *Anchor:* `spinup.md:135` design-overview-pointer is intentionally NOT a guide-anchor marker, so
  it's invisible to enforcement. Either (a) leave it as an agent-grounding pointer (current intent)
  and rely on W4, or (b) promote it to a real coverage-checked marker if you want the bootstrap
  surface guaranteed present. Recommend (a) + W4 — keep the agent-grounding/launch-guide split clean.

### Aspirational-vs-enforced ledger (what to log if not built now)

| Wiring | Built? | Enforced? | Action |
|---|---|---|---|
| design-quality-gate.js | YES | self-enforcing once called | **W1: call it** (the gate is the enforcer) |
| designer↔design-guides blocks | YES (live) | **NO** | **W4: build `scan:design-guides-coverage`** or `/enforcement:log` |
| sprint:design ↔ product/eng/QA managers | NO | NO | **W2: wire + `scan:sprint-manager-consult`** or `/enforcement:log` |
| product-designer ↔ ui:review/scan:design-system | NO | NO | **W3** or `/enforcement:log` |
| manager principles (all 03-managers) | n/a | YES (`manager-principles-scan.js`) | none — already enforced |
| launch guides ↔ bootstrap | YES | YES (`guides:coverage`) | none — already enforced |

### Headline

**The judgment layer is built and org-mapped; the pipeline calls only half of it.** Marketing +
product-roadmap managers are fully wired through `growth:`/`roadmap:`; engineering, app-design, the
QA director, and — most glaringly — the org's own *named design authority* (`design-quality`, whose
fail-closed gate is built and tested but never invoked) are orphans. The single highest-leverage fix
is **W1: have Gamma/Delta call `design-quality-gate.js` on UI units** — it activates an already-built
enforcer for zero new machinery. The second is **W4**, the missing `scan:design-guides-coverage` that
would make the (currently live-but-hand-maintained) designer↔guide wiring self-detecting.
