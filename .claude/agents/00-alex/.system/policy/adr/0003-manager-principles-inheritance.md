# ADR 0003 — Manager-principles inheritance via a slug registry + reject-scan

**Date:** 2026-05-30
**Status:** accepted
**Class:** B (architectural impact — affects the manager-agent layer's data model + a new enforcer)

---

## Decision

Encode the manager-principles model **shared base → Director → Lead → specialist** as a
**machine-readable registry** (`.claude/agents/03-managers/_principles/registry.json`) keyed
by **stable slugs**, where each agent declares `inherits_from` / `owned_principles` /
`inherited_principles`, backed by a **fail-closed reject-scan**
(`scripts/checks/manager-principles-scan.js`, `/scan:manager-principles`) that rejects
duplicate-owned, missing-inherited, dangling, rooted-mismatch, and orphan principles. Prose
lives in `_principles/base.md` + each Director spec; the registry is authoritative for
ownership/inheritance; principles are **never** referenced by ordinal.

## Context

The product-studio org (S0.1) needs every Director/Lead to share a common principle base
(clarity-is-king, map-the-user-journey, evidence-over-invention, claims-boundary) while
owning domain principles. Before this, principles were prose-only in two Director specs, with
**duplication** (Map-the-User-Journey appeared verbatim as DoP #10 and DoQA #7) and
**ordinal cross-references** (`director-of-qa.md` referenced "the Director of Product's
Principle #7"; `director-of-product.md:159` referenced its own #7) — both of which break
silently when principles move or reorder (the CLAUDE.md Refactor & Rename Hygiene bug class,
LRN-2026-04-29). R4 (β `EVT-org-roadmap-principles-beta-001`) chose an inheritance model; this
ADR records *how* it is mechanized. Required because oneshot mode has no α/β — a manager
exists there only as an enforcer, so principle ownership must be machine-checkable, not a
prose convention.

## Options considered

1. **Option A — Slug registry + reject-scan (chosen):** machine-readable ownership/inheritance
   keyed by stable slugs; a scan rejects drift; prose stays in specs.
2. **Option B — Prose-only convention:** keep principles as spec prose with a "base" doc and a
   written rule that each Director inherits it; no enforcer.
3. **Option C — YAML frontmatter per agent + frontmatter scan:** put `owned_principles` etc.
   in each agent's `.md` frontmatter, scan parses YAML.

## Decision criteria

| Criterion | A (registry+scan) | B (prose-only) | C (frontmatter+scan) |
|---|---|---|---|
| Product fit | high | medium | high |
| Simplicity | high | high | medium |
| Reliability | high | low | medium |
| Reversibility | high | high | medium |
| Enforceability (oneshot) | high | low | high |

## Why this option won

Enforceability is the load-bearing criterion: "every policy needs a named enforcer," and in
oneshot a manager *is* its enforcer. Option B fails closed to nothing — drift is invisible
(the exact aspirational-vs-enforced gap the framework keeps re-paying). Option C is
enforceable but needs a YAML parser and couples the machine data to 14+ scattered frontmatter
blocks (more drift surface, harder to scan atomically). Option A keeps a single JSON source of
truth that is trivially parseable (no dependency), atomic to scan, and decoupled from prose —
and stable slugs eliminate the ordinal-fragility class outright. Tiebreaker over C:
Simplicity + single-file atomicity.

## Risks

- **Registry ↔ prose drift:** the registry could claim an ownership the spec prose contradicts
  (e.g., spec still describes a principle the registry says moved).
- **Slug index in specs perpetuates ordinals:** the pointer blocks annotate slugs with their
  current heading ordinal `(#8)` as a navigation aid, which a careless reader could treat as a
  cross-reference.
- **Base over-grows:** future work dumps domain principles into the shared base, eroding the
  "minimal base" intent.

## Mitigations

- A **spec↔registry cross-check** (assert each Director's prose headings match its owned
  slugs) is the named follow-on enhancement to the scan (β deferred it as hygiene, not
  correctness-blocking, since Wave 0B builds against the registry, not the prose).
- The inheritance pointer block states the **discipline rule explicitly** ("never
  cross-reference by ordinal; use the slug") and the ordinals are display-only.
- `rooted_in` + the `orphan-definition` / `rooted-mismatch` reject classes keep the base
  honest; review base additions against the "genuinely crosses domains" bar.

## Reversal plan

The registry is additive and self-contained. To revert to prose-only, delete the registry +
scan and the pointer blocks; the Director specs remain valid (the principles never left them
except the two genuinely-moved duplicates, which would need re-inlining). Cost: low. Trigger
for reversal: if the scan proves to be ceremonial (never catches a real drift across several
sprints) — but the inverse is expected as Leads/specialists are added in Wave 2.

## References

- Implementation: `_principles/registry.json`, `_principles/base.md`,
  `scripts/checks/manager-principles-scan.js`; spec surgery in `director-of-product.md` +
  `director-of-qa.md` (S0.1, sprint SP-20260530-001).
- β: `EVT-org-roadmap-principles-beta-001` (R4, inheritance model), `EVT-org-gpt-rereview-beta-001`
  (mechanism as acceptance requirement), `EVT-s0-1-hard-halt-scan-logic-beta-001` (scan-logic +
  slug review; caught the `director-of-product.md:159` dangling ordinal).
- Bug class: CLAUDE.md § Refactor & Rename Hygiene (LRN-2026-04-29 stale-identifier).
- Contracts the routing enforcer (remaining S0.1) will target: ADR-adjacent
  `_requirements/10-contracts/ARTIFACT-CONTRACTS.md` (`contract.owner_domain`).
