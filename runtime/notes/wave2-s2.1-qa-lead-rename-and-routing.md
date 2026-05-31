# S2.1 Design Note — QA Lead rename + intra-Product routing

_Wave 2 product lane (SP-20260530-001). DESIGN NOTE for α's integration — describes the
change; does NOT execute the rename (the dispatch alias must not break)._

## Context
The org map (`.claude/agents/03-managers/_org/org-map.json`) already encodes the QA Lead as
a Product-domain lead with a kept alias:
```json
{ "role": "qa-lead", "agent": "director-of-qa", "alias": "director-of-qa",
  "owns": "product-driven QA; QA/fix-priority under product-priority-over-severity; directs the QA failure-mode scanner",
  "note": "Renamed from Director of QA; reports to Director of Product Mgmt. Keep the director-of-qa dispatch alias until all refs migrate." }
```
So the role is **already named `qa-lead` in the org map**, but the underlying agent spec,
its `subagent_type`, and every dispatch/skill reference still say `director-of-qa`. This
note specifies how the rename completes WITHOUT breaking the alias — and the intra-Product
conflict routing that S2.1 adds.

## A. QA Lead rename — keep the `director-of-qa` dispatch alias (do NOT break it)

**Iron constraint (team lead + §11.A + role-registry-parity):** keep a `director-of-qa`
dispatch alias until ALL registry/skill refs migrate. A hard rename now silently breaks
every consumer that dispatches `subagent_type: director-of-qa` — the exact refactor-hygiene
bug class CLAUDE.md calls out (grep ALL occurrences of the OLD literal before completing a
rename).

**Current `director-of-qa` references (grepped this lane — migration surface for α):**
- `.claude/agents/03-managers/director-of-qa.md` — the spec itself (`name: director-of-qa`,
  `subagent_type: director-of-qa`, invocation block).
- `.claude/agents/01-adhoc/.system/protocol.md` and `.claude/agents/02-oneshot/.system/protocol.md`
  — protocol refs.
- `.claude/agents/03-managers/_org/org-map.json` — `agent: "director-of-qa"` + `alias`.
- `.claude/agents/03-managers/_principles/registry.json` — `agents."director-of-qa"` key +
  spec path (principle owner of `product-priority-over-severity` et al.).
- `.claude/agents/00-alex/.system/beta/events.jsonl` — historical event refs (do NOT rewrite
  history; informational only).
- Skill consumers that name `director-of-qa` (e.g. `qa:audit`, `qa:check`, `sprint:design`,
  `sprint:release`, gauntlet orchestrators per the DoQA invocation block).
- `scripts/dispatch/catalog.js` + `scripts/dispatch/org-roles.js` (role universe / gamma-only
  derivation — **shared contracts, α-only edit**).

**Recommended migration (α, serial — the alias-preserving path):**
1. **Add `qa-lead` as the canonical role**; make `director-of-qa` an **alias** that resolves
   to the same spec. Two viable mechanisms (α picks per the dispatch layer's alias support):
   - (a) keep `director-of-qa.md` as the spec, register `qa-lead` in `catalog.js` ROLES with
     a documented alias map `qa-lead ⇄ director-of-qa`; OR
   - (b) rename the spec file to `qa-lead.md`, add a thin `director-of-qa.md` stub that
     points to it (mirrors the `req-reviewer` oneshot-stub pattern — a stub spec that says
     "read the canonical spec").
2. **Migrate references** from `director-of-qa` → `qa-lead` one consumer at a time, keeping
   the alias live throughout. Each migrated, re-run `/scan:role-parity` + `/scan:manager-principles`.
3. **Retire the alias only after** a full grep shows zero non-alias `director-of-qa` literals
   remain (and the `qa` failure-mode-scanner doer role retires under `qa-lead` — see the
   role-parity TRANSITIONAL note for `qa`).

**Registry note (principles):** the QA Lead's principle ownership is **unchanged** by the
rename — it still owns `product-priority-over-severity` + its 5 QA principles, rooted under
the `director-of-qa` registry key today. When α flips the canonical name to `qa-lead`, the
registry `agents` key + each principle's `rooted_in` migrate together (atomic, to avoid a
`rooted-mismatch` / `duplicate-owned` flag from `/scan:manager-principles`). **This lane did
NOT touch the QA Lead registry entry** — the rename is α's serial step; I only documented it.

## B. Intra-Product conflict routing (β EVT-org-gpt-rereview-beta-001, R2 / §11.A)

The default once **both** Product Lead and QA Lead agents exist (PL is built this lane):

| Conflict | Owner / resolver |
|---|---|
| Backlog priority, within-sprint sequencing, what-to-build-next (single product) | **Product Lead** |
| QA / fix-priority, ship-readiness of a build, what-to-fix-first | **QA Lead** (under `product-priority-over-severity`) |
| PL ↔ QA disagreement they can't resolve between them | **Director of Product** (escalation, NOT β) |
| Ship-gate decision · any cross-domain conflict (Product ↔ Marketing ↔ Engineering) | **β** (referee) |

**The line that matters:** β enters **ONLY** for a ship-gate or a cross-domain conflict —
**never** as an intra-Product appeal court (keeps β from becoming an intra-domain tiebreaker).
Unresolved intra-Product goes UP to the Director of Product first. This is encoded in the
`product-lead.md` spec's "Intra-Product conflict routing" section and mirrored in the org map's
`referee.scope`. No code enforcer is added by this lane (it is a routing convention for live
adhoc mode); if α wants it self-detecting, log it to `paths.enforcementDebt` — but per §11.A
it is a behavioral default, comparable to the existing β-consultation protocol.

## C. What this lane changed vs. left for α
- **Changed (this lane):** authored `product-lead.md` (encodes the routing); no edit to the
  QA Lead spec, the org map, or the catalog.
- **Left for α (serial integration):** the `director-of-qa → qa-lead` canonical rename with
  alias preservation; the org-map `agent: null → product-lead` flip (REGISTRY DELTA); any
  enforcement-debt entry if the routing convention should be made self-detecting.
