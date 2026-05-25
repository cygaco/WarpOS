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

### Phase 2 — Canon *(engine ships in SP-20260525-022)*
Generate the full `_requirements/00-canonical/*` from the Phase-1 intent: the 7
narrative docs (CORE_BRIEF, USER_COHORTS, GOLDEN_PATHS, PRODUCT_MODEL, EVOLUTION,
FAILURE_STATES, GLOSSARY) + 4 structured files (FIELD_REGISTRY, PRECEDENCE,
STEPS, WATCHED_DIRS). Gaps in the operator's input are filled by **capped**
`research:*` (a defined output schema — named fields, not open-ended discovery).
*(This phase calls the canon engine built in SP-20260525-022; until then it is
the documented hook in this skeleton.)*

### Phase 3 — Roadmap
Invoke `roadmap:create` to produce `ROADMAP.md` — grounded in the canonical docs
(preferred) or the brief/clone — with milestones + sprints, **MVP-core-loop
first**: Milestone 1's first sprint is getting the core loop on screen.

### Phase 4 — On screen *(full orchestration ships in SP-20260525-023)*
Execute that first sprint until the core loop **serves**, gated by
verify-before-claim: build clean + dev server returns HTTP 200 + entry module
transforms without error. "It builds" ≠ "it serves" — prove both; a live `node`
process or an existing worktree is not evidence. Local-first, no-backend,
installable-PWA bias (overridable). *(Full execute-loop orchestration lands in
SP-20260525-023; this skeleton documents the contract.)*

## Pre-flight — install completeness
Before Phase 1, run `/check:install` (incl. the sprint-subsystem probe). Refuse
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
