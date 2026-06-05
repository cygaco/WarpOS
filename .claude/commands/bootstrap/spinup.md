---
description: "From 'just WarpOS' to something on screen — one in-project command: intent (guided brief, or --clone a competitor) → canonical docs → roadmap with sprints → execute the first sprint until the core loop serves. The idea→screen on-ramp."
user-invocable: true
---

# /bootstrap:spinup — Idea → on screen, one command

The single in-project on-ramp. Run it inside a project that has WarpOS installed
(scaffolded via `/portfolio:new`, or a manual `/warp:setup`) and it takes you
from a bare framework to: **canonical product docs + a roadmap organized into
milestones & sprints + the core loop running on screen.** One command; the
phases below are flags, not separate skills.

> **Two entry points, one implementation.** `bootstrap:spinup` is the real
> implementation (runs in the current project). From WarpOS, `portfolio:spinup
> <slug>` is a thin wrapper that dispatches this skill into the chosen product
> via `portfolio:run`. Both reach the same result.

## Input

`/bootstrap:spinup [--clone <competitor-name|url>] [--phase <intent|canon|roadmap|onscreen>] [--resume]`

- **default (no `--clone`)** — gather product intent through a guided brief
  discussion.
- **`--clone <target>`** — alternate entry: derive intent from competitor
  intelligence instead. Produces the clone doc (kept on disk) AND feeds it into
  the same on-ramp.
- **`--phase <name>`** — run/re-run a single phase (e.g. regenerate canonical
  docs after editing intent: `--phase canon`). No separate skill needed.
- **`--resume`** — continue a partially-completed on-ramp from its last phase.

## Pipeline (idea → on screen)

```
spinup [--clone <target>]
  → 1. intent    default: guided brief discussion        | --clone: competitor intel → clone doc
  → 2. canon     generate _requirements/00-canonical/*    (research-backed; engine: SP-20260525-022)
  → 3. roadmap   roadmap:create — milestones + sprints    (core-loop first)
  → 4. onscreen  execute the first sprint until the core loop SERVES (verify-before-claim)
```

<!-- guide-anchor:DEV_SETUP anchor:spinup:preflight shape:checklist -->
> ⏱️ **Day-zero launch guide — DEV_SETUP (start the slow clocks NOW):** the moment you begin, fire off the long-lead developer-account signups — see [`_guides/DEV_SETUP_GUIDE.md`](../../../_guides/DEV_SETUP_GUIDE.md). Apple ~2d payment+verify, Google Play identity review + 12-tester / 14-day closed test, D-U-N-S days–weeks. The setup is cheap; the *waiting* is the cost — so start the waiting early. (Surfaced here by `/guides:integrate`.)

### Phase 1 — Intent
- **Default:** run the guided brief discussion (problem, JTBDs, emotional
  promise, value chain, wedge, MVP) — the folded-in brief flow.
  Output: a product brief the rest of the on-ramp grounds in.
- **`--clone <target>`:** derive intent from a competitor instead. Reuse the
  clone engine `scripts/portfolio/clone.js` (do NOT reimplement) — discover
  across **source classes** `product | review | landing | devdocs | appimg`
  (sitemap/nav + `/lp`,`/solutions`,`/industries` landing pages + `developers.`
  /`docs.`/`/api` dev docs + `og:image`/app-store imagery read by a vision
  model), tag each, and synthesize JTBDs / scored features / gaps / opportunities.
  The clone doc is written to `_docs/clones/<slug>/` **and kept**, then feeds
  Phase 2 as the grounding input.

### Phase 2 — Canon
Generate the full `_requirements/00-canonical/*` from the Phase-1 intent: the 7
narrative docs (CORE_BRIEF, USER_COHORTS, GOLDEN_PATHS, PRODUCT_MODEL, EVOLUTION,
FAILURE_STATES, GLOSSARY) + 4 structured files (FIELD_REGISTRY, PRECEDENCE,
STEPS, WATCHED_DIRS). The engine is `scripts/canon/generate.js` (SP-20260525-022).

**1. Run the engine** against the Phase-1 intent (the guided brief, or the
`--clone` doc under `_docs/clones/<slug>/`). It renders the 11 artifacts from
`framework/templates/canonical/*`, fills fields from the intent, validates
output, and writes to `_requirements/00-canonical/` (the product's own canonical
zone — generating product-titled canon there is correct, not a purity concern):

```bash
node scripts/canon/generate.js --intent <intent-file.md> --product "<Product Name>" --research off
```

The engine **always emits structurally-valid output** and exits 0 with WARNINGS
for thin fields (fields the intent didn't cover); a non-zero exit means a real
structural error (missing section, invalid JSON, product-name mismatch) — fix the
intent or template, don't paper over it. Thin output is honest scaffold the
product fills in over time.

**1a. Research depth — the tier chooser.** **Moderate is the default — EVERYWHERE
(interactive AND automated/headless).** When a human is present, show the two-tier
chooser and **pre-select Moderate**:

> **How thorough should the research be?**
> - **Light Research** — Uses existing training data. *(no live web search, no spend)*
> - **Moderate Research** — Finds newer data for better results. *(parallel web search — Recommended; **default**)*

Hitting enter (no explicit pick) selects **Moderate**. Map the choice to the engine:
**Light → `--research off`** (or `--research light`), **Moderate → `--research simple`**
(or pass `--research-tier light|moderate` to the orchestrator).

**Default + spend posture.** With no flag at all, the orchestrator resolves to
**Moderate (`simple`)** in every context — interactive AND headless (`--auto` / `--json`
/ a subprocess caller like `/portfolio:new`, `/portfolio:spinup`, or the Master-Console
cockpit). Moderate is a handful of parallel web searches (cents — under the `## Autonomy`
$5 line), so there is no surprise-spend concern and no interactive/headless branch.
**Light** is an explicit opt-DOWN (zero-cost, training-data only). **Deep**
(`--research deep` — the expensive deep-research APIs) is an explicit opt-UP and the
**one mode never auto-defaulted**: it requires an explicit flag.

**2. Capped research (opt-in — real `research:*` spend).** To fill thin docs with
cited category signal, re-run with `--research simple` (or `deep`). The fill is
**bounded** by `schemas/canon/research-fields.schema.json` — named fields per doc,
never open-ended discovery. The engine and the orchestrator split the work:

  - **Engine builds the cap.** With `--research simple` and no `--research-in`, the
    engine writes a bounded query set to `_requirements/00-canonical/.canon-research-request.json`
    (≤ `research_cap.max_queries`, only the schema's `x-fields` for thin docs).
  - **Orchestrator invokes.** Run `research:simple` against those bounded questions
    (this is the API spend — >$5 needs operator OK per `## Autonomy`). Assemble the
    answers into a findings file matching the cap schema shape:
    `{ "per_doc": { "<DOC>": { "findings": { "<x-field>": "…" }, "sources": ["…"] } } }`.
    **Every finding MUST carry `sources[]`** — a finding with empty sources is THIN
    and will be dropped with a warning (β directive: never a silent pass).
  - **Engine validates + merges.** Re-invoke with the findings; the engine rejects
    any out-of-schema doc/field and appends a cited "Research Signals
    (non-canonical)" block to each filled doc:

    ```bash
    node scripts/canon/generate.js --intent <intent-file.md> --product "<Product Name>" \
      --research simple --research-in _requirements/00-canonical/.canon-research-findings.json
    ```

Default resolution (see **1a**): **Moderate (`simple`) everywhere** — interactive AND
headless. `light`/`off` is the explicit opt-down (no-spend); `deep` is the explicit
opt-up (never auto-defaulted). Run the research bridge whenever the resolved mode is
`simple`/`deep` (the cited category fill); `off` is the no-spend pass.

### Phase 3 — Roadmap
Invoke `roadmap:create` to produce `ROADMAP.md` — grounded in the canonical docs
(preferred) or the brief/clone — with milestones + sprints, **MVP-core-loop
first**: Milestone 1's first sprint is getting the core loop on screen.

### Phase 4 — On screen
**Scaffold-if-missing (S0.3):** before handoff, the phase materializes the WarpOS
app scaffold (Next.js+Tailwind v4+shadcn/ui+Radix+Lucide via `scripts/scaffold/app.js`)
when the repo has no `package.json` yet — you can't get on screen without an app to
serve. Idempotent (no-op when `/portfolio:new` already scaffolded) and fail-open.
Then execute that first sprint until the core loop **serves**, gated by
verify-before-claim: build clean + dev server returns HTTP 200 + entry module
transforms without error. "It builds" ≠ "it serves" — prove both; a live `node`
process or an existing worktree is not evidence. Local-first, no-backend,
installable-PWA bias (overridable). The gate is implemented as
`onscreen.verifyServe()` in `scripts/bootstrap/phases/onscreen.js` (SP-023): it
returns `pass:false` unless build is clean AND HTTP 200 AND the entry transforms
— a clean build with a non-200 server FAILS. The actual first-sprint execution is
product-side (LLM-orchestrated); the driver returns `needs_orchestration` and the
skill body drives it, then gates completion with `verifyServe`.

> **Visual confirmation is opt-in and needs Playwright.** The objective serve gate
> above (build clean + HTTP 200 + entry transforms) is the only auto-verifiable
> check. A *visual* "does it look right" pass via the `visual-review` agent requires
> the Playwright MCP server connected (`mcp__playwright__browser_*`); when it is
> absent, `visual-review` correctly BAILS rather than fabricating — treat that as
> "not run," not a failure, and never claim a visual pass that didn't execute. Run
> the visual pass in a session where the MCP is connected, or document its absence.

<!-- design-overview-pointer (single bootstrap entry to the agent-grounding design library; anchor:none, NOT a guide-anchor marker) -->
> 🎨 **Design-principles guides (overview):** the first-screen UX is judged by the
> `design-lead` / `conversion-lead` / `design-quality` / `visual-review`
> agents, which ground their craft in the **design-principles guide library** —
> overview at [`_knowledge/design/README.md`](../../../_knowledge/design/README.md) (index
> `_knowledge/design/registry.json`). These are agent-grounding training references
> (`anchor: none`), not staged launch guides; the README is the one design-overview
> entry the bootstrap pipeline surfaces.

## Execution — the orchestrator driver (SP-20260525-023)
The phases above execute via `scripts/bootstrap/spinup-orchestrate.js` (a real
driver, mirroring `scripts/canon/generate.js`, so `--phase`/`--resume` state is
durable and the chain is CI-testable):

```bash
node scripts/bootstrap/spinup-orchestrate.js \
  [--product "<name>"] [--intent <file.md>] [--clone <target>] \
  [--phase preflight|intent|canon|roadmap|onscreen] [--resume] \
  [--research-tier light|moderate] [--research off|simple|deep]
```

- **Research depth (WI-25):** `--research-tier light|moderate` (light→off, moderate→simple)
  is the user-facing chooser (§1a); `--research off|simple|deep` is the raw/power-user form
  (`deep` only here). With NEITHER set, the driver resolves to **Moderate (`simple`)
  everywhere** — interactive AND headless (`--auto`/`--json`/subprocess). `light`/`off`
  is the explicit opt-down; `deep` is the explicit opt-up and the one mode never auto-defaulted.

- **Always runs `preflight` first** (a hard gate — refuses a gappy install via
  `/scan:install`, exit ≠ 0 → stop). Deterministic phases (`preflight`, `canon`,
  `--clone` intent) run in-process by reusing the existing engines
  (`scripts/check/install.js`, `scripts/canon/generate.js`, `scripts/portfolio/clone.js`).
- **LLM-orchestrated steps** — the guided brief, `roadmap:create`'s canon-grounded
  synthesis, and the real first-sprint execution — cannot run from a node process.
  Those phases exit **3 (`needs_orchestration`)** with an `orchestration_prompt`;
  the skill body (Alpha) fulfills it (runs the brief / `roadmap:create` /
  the sprint), then re-invokes with `--resume`. This mirrors B's canon research
  bridge and respects the dispatch-route-guard.
- Phase-state persists to `.warpos/spinup-state.json`; `--resume` continues after
  the last completed phase, `--phase <name>` re-runs exactly one.
- Fixture e2e: `node scripts/bootstrap/test-spinup-orchestrate.js` proves the
  chain (intent→canon→roadmap, `--research off`) + the verify gate WITHOUT
  standing up a real product (canonical proves the chain; real serve is product-side).

## Pre-flight — install completeness
Before Phase 1, run `/scan:install` (incl. the sprint-subsystem probe). Refuse
to proceed on a gappy install — a fresh `/portfolio:new` scaffold or a manual
`/warp:setup` must reach a complete, sprint-capable state first. This is the
guarantee behind "full WarpOS install, without gaps."

## Relationship
- `portfolio:spinup <slug>` — the from-WarpOS wrapper (dispatches this skill into a product).
- `bootstrap:ponder` — sit with direction before/around an on-ramp.
- `roadmap:create` — Phase 3's engine (also runnable standalone).
- `/portfolio:new` — scaffolds the repo; `bootstrap:spinup` fills it in.

## Notes
- Reference paths via `paths.*` keys, not literals (path-lint enforces).
- Reversible per phase: intent/clone/canon/roadmap each write to their own dirs;
  the on-screen phase runs in a sprint branch.
- Supersedes the former standalone product-brief and competitor-clone skills —
  both are now intent modes here. Their engines
  (`scripts/portfolio/bootstrap.js`, `scripts/portfolio/clone.js`) are reused.
