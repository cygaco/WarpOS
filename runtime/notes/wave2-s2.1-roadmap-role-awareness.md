# S2.1 Design Note — Roadmap skills role-awareness (R3)

_Wave 2 product lane (SP-20260530-001). DESIGN NOTE for α — describes the change to make
`roadmap:{prioritize,ideas,next,create}` role-aware. **No skill is edited by this lane**
(team-lead constraint). `roadmap:add` stays role-neutral._

## The change (β R3 + §11.A)
Today all roadmap skills dispatch a single `subagent_type: director-of-product`. Per R2's
altitude split, prioritization/ideation should be **role-aware**:
- **single-product / within-product backlog** → **Product Lead** (`product-lead`)
- **strategic / cross-product / lifecycle-phase-shift** → **Director of Product** (`director-of-product`)

`roadmap:add` is a **mechanical appender** (no `subagent_type` dispatch) — it stays
**role-neutral** and is **excluded** from the role-aware set (§11.A explicit).

## Scope = exactly these 4 skills (verified present this lane)
`.claude/commands/roadmap/`: `prioritize.md`, `ideas.md`, `next.md`, `create.md` → make
role-aware. `add.md` → leave role-neutral. (`cleanup.md` is an audit, no product-persona
dispatch — leave as-is; it is invoked by `prioritize` Phase 1.)

## Recommended mechanism (α implements after the `product-lead` role is registered)
The role-aware selection is a **routing decision inside each skill**, grounded in scope:

1. **Default selector by scope signal.** Each skill resolves which persona to dispatch:
   - If the run is scoped to **one product's backlog / within-sprint ordering** (the common
     case in a product repo, or an explicit `$ARGUMENTS` like "rank Sprint 11+ for <product>")
     → dispatch **`product-lead`**.
   - If the run is **strategic / cross-product / lifecycle-phase-shift** (portfolio-wide,
     "should we pivot", milestone-level) → dispatch **`director-of-product`**.
   - **Fallback / no signal → `director-of-product`** (current behavior; no regression — R2).
2. **Optional explicit override** via `$ARGUMENTS` (e.g. `--as product-lead` / `--as director`)
   so the operator can force the altitude.
3. **Until `product-lead` is registered** in the dispatch catalog, keep
   `subagent_type: director-of-product` as the SOLE dispatch — **no regression, no debt**
   (R3). The role-aware branch activates only once the REGISTRY DELTA flips
   `product-lead` from `agent: null`.

Because the Product Lead **inherits** the Director's principles (registry: `product-lead`
`inherits_from: director-of-product`), a single-product ranking from the Lead applies the
same product principles at execution altitude — "Lead-based" is not less product judgment
(R2). The skills already reference the persona's principles **by pointer** (e.g.
`prioritize.md` points at the DoP spec, not an enumerated list), so swapping the dispatched
`subagent_type` does not require re-listing principles.

## Related refactor-hygiene observation for α (NOT fixed by this lane)
- `roadmap/ideas.md:34` and `roadmap/next.md:16` reference **"Principle #1 (Lean Product
  Development)" by ORDINAL.** This violates the S0.1 stable-slug rule (refer by slug
  `lean-product-development`, never by ordinal — ordinals are display-only and can gap, as
  they now do on the DoP spec after #7/#8/#9 left). When α makes these skills role-aware,
  fold in the slug fix (and prefer the pointer-to-spec pattern `prioritize.md` already uses).
  This lane did not touch the skills, so it is logged here, not fixed.
- Consider whether the role-aware selection convention needs an enforcer (e.g. a check that
  a single-product `prioritize` run dispatched the Lead, not the Director, once both exist).
  If it should be self-detecting, `/enforcement:log` it; otherwise it is a behavioral routing
  default like β-consultation.

## What this lane changed vs left for α
- **Changed (this lane):** nothing in the roadmap skills (note only). The `product-lead`
  persona it authored is the carrier the role-aware branch will dispatch.
- **Left for α:** edit the 4 skills to add the role-aware selector (gated on `product-lead`
  registration); fold in the ordinal→slug fix in `ideas.md`/`next.md`; optionally log the
  enforcement-debt entry.
