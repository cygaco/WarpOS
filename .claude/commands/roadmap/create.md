---
description: "Bootstrap a product ROADMAP.md from the inputs a project actually has — prefers _requirements/00-canonical/* + a Director-of-PM lens when present, falls back to the competitor clone brief + PROJECT.md. Evidence-bound, MVP-core-loop first."
user-invocable: true
---

# /roadmap:create — Bootstrap a product roadmap

Turns a product's grounding inputs into a real `ROADMAP.md`. The existing
`/roadmap:add` and `/roadmap:cleanup` operate on an *already-existing* roadmap;
nothing **bootstraps** one. A fresh `/portfolio:new` product (or any product
without a roadmap) starts here.

## Input-source detection (the core design — WG-7)

Detect what grounding the project actually has and pick the richest available,
**in this order**:

1. **Canonical-grounded (preferred):** `paths.requirementsRoot`/`00-canonical/*`
   exists (CORE_BRIEF, USER_COHORTS, GOLDEN_PATHS, PRODUCT_MODEL, EVOLUTION,
   FAILURE_STATES). Mine those and reason through a **Director-of-PM** lens
   (sequence by user value × evidence × leverage; name the bet each milestone
   makes). This is the fuller WarpOS milestone-0.14.0 "Managerial Agent Layer"
   shape.
2. **Clone + brief (fallback):** no `00-canonical/*`, but a competitor clone
   brief (`_docs/clones/<slug>/<slug>.clone.md` — JTBDs, scored features,
   gaps `G-*`, opportunities `O-*`) and/or `PROJECT.md` exist. Mine those.

The same command serves a bare fresh product and a fully-specified one — detect,
don't ask. State which source set was used in the run summary.

## Input

`/roadmap:create [--source canonical|clone|auto] [--slug <clone-slug>] [--force]`

- `--source auto` (default) runs the detection above. `canonical`/`clone` force
  a source set. `--force` overwrites an existing `ROADMAP.md` (otherwise refuse
  if one exists — direct the operator to `/roadmap:add` / `/roadmap:cleanup`).

## Invariants

1. **Evidence-bound.** Every milestone and every sprint MUST cite its grounding —
   a `JTBD-N` / `G-N` / `O-N` from the clone brief, or a canonical doc + line,
   or a `PROJECT.md` line. No milestone without a citation. Unciteable ideas go
   to a "Later (unvalidated)" bucket, not the sequence.
2. **MVP-core-loop first.** Milestone 1 validates the core loop before infra.
   **Milestone 1's first sprint MUST be a `/portfolio:spinup`** — get the loop
   on screen and prove it serves before front-loading anything else. Then
   sequence top opportunities by **leverage × evidence**.
3. **Structure parity.** Render the full `ROADMAP-EXAMPLE.md` shape:
   - **Strategy** block (grounded one-paragraph thesis + the bet).
   - 🏛 **Milestones** — an Upcoming sequence overview, then per milestone:
     the shift / before→after / sprints-feeding-it / definition-of-done /
     reality-unlocked.
   - **Later** — trigger-gated (what unlocks it), incl. the unvalidated bucket.
   - **Shipped** — stub (empty for a fresh product).
   - **Sprints** — the auto-managed ledger table with the
     `<!-- ledger:sprints -->` anchor so `scripts/sprint/ledger.js` can append.
4. **Never invent product facts.** Pull from the detected sources only.

## Procedure

1. **Refuse-or-detect.** If `ROADMAP.md` exists and no `--force`, stop and point
   at `/roadmap:add` / `/roadmap:cleanup`. Else run input-source detection.
2. **Mine the source set.** Canonical: read `00-canonical/*` + adopt the DoPM
   lens. Clone/brief: read the clone brief's JTBD/feature/gap/opportunity
   sections + `PROJECT.md`. Build the evidence index (every claim → citation).
3. **Sequence.** Milestone 1 = core-loop validation, first sprint =
   `/portfolio:spinup`. Then order remaining milestones by leverage × evidence.
   Each milestone names its bet + DoD + the reality it unlocks.
4. **Render** `ROADMAP.md` in the Invariant-3 structure, including the
   `<!-- ledger:sprints -->` anchor (so future `/sprint:full` runs auto-record
   rows — see WG-16 / Step 8b).
5. **Verify + report:** confirm every milestone/sprint carries a citation, the
   ledger anchor is present, Milestone 1's first sprint is a spinup, and which
   source set was used. Print the milestone sequence.

## Notes

- Reference paths via `paths.*` keys, not literals (path-lint enforces).
- This skill is the fallback half (clone+brief) AND the preferred half
  (canonical+DoPM) of one design — the canonical-grounded path is the
  milestone-0.14.0 managerial-agent shape; this ships the detection + both
  source readers, with the DoPM lens deepening as 0.14.0 lands.
- Sibling skills: `/portfolio:spinup` (Milestone 1's first sprint),
  `bootstrap:spinup --clone` (produces the fallback brief), `/roadmap:add` /
  `/roadmap:cleanup` (operate on the result).

## Reference

- Structure model: `ROADMAP-EXAMPLE.md`
- Ledger writer: `scripts/sprint/ledger.js` (anchor `<!-- ledger:sprints -->`)
- Sources: `paths.requirementsRoot`/`00-canonical`, `_docs/clones/<slug>/`, `PROJECT.md`
