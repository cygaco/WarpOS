# SP-20260718-001 Phase 0 — PRD (Product Lead consult, ε-consolidated)

**Author:** product-lead (design BLOCK author, gpt-5.6-terra via codex CLI, ok:true). Framework/kernel phase — "product" = WarpOS's own portable runtime governance. Scope RATIFIED (RATIFIED-PLAN § Phase 0); this PRD decomposes it, does not re-scope.

## Definition of Done (H-1, verbatim — also D8, embedded in the contract)
> 1.0 is done when a clean installed product moves idea→canon→roadmap→sprint→build→gauntlet→launch-readiness→release→retro→learning-promotion without relying on chat memory, stale trackers, manual Alpha heroics, or unverified agent claims.

Phase 0's slice of that DoD: the provider-independent kernel CONTRACT + trust-boundary DEFINITION that everything else binds to. (Define-before-build; the enforcement ADAPTER is Phase 4.)

## Requirement areas (R-1..R-5 → deliverables)
- **R-1** Runtime trust contract + completion standard — the provider-independent trusted boundary + H-1 preamble. (D1, D8)
- **R-2** Durable governance state + evidence preservation — ratify durable company state; classify retained evidence under archive-never-delete. (D2, D7)
- **R-3** Binding + authorization inputs — authoritative role-binding precedence + the minimum valid WorkOrder field set. (D3, D5)
- **R-4** Cross-provider execution declaration — contract provider × capability × helm-level + model×channel support. (D4)
- **R-5** Kernel conformance evidence — kernel-scope fixtures proving CORE-invariant + matrix coverage. (D6)

## Granular stories (S-1..S-8)
- **S-1** — R-1 (D1,D8): author the merged Top-Level Runtime Contract, numbered policy blocks defining trusted-layer ownership of capability grants / protected mutation / verification / main-integration; include H-1 DoD verbatim.
- **S-2** — R-3 (D3): role-binding precedence graph (validated WorkOrder/CLI → explicit top-level → UNBOUND fail-closed; repo prose cannot bind; workers never default to President).
- **S-3** — R-3 (D5): minimal required WorkOrder fields for a valid auditable binding (not the full v1 schema).
- **S-4** — R-2 (D2): the one-page ADR ratifying durable on-disk company state (tracker/registry/ledgers) + interchangeable model executors.
- **S-5** — R-4 (D4): the provider × capability × helm-level matrix for Claude, codex/GPT, agy/Antigravity; record ED-060 down; addendum A model×channel.
- **S-6** — R-2 (D7): diagnostics/operational/security/semantic retention classes against the shipped archive-never-delete behavior, preserving raw history.
- **S-7** — R-5 (D6): harvest kernel-only conformance fixtures from packets 13/15 with positive coverage per CORE invariant + in-kernel matrix cell.
- **S-8** — R-1..R-5 (D1–D8): cross-link policy blocks / ADR / matrices / fixtures / retention classes to named Enforcers/EDs so contract-lint resolves references + preserves CORE non-waivability.

## Traceability (deliverable → requirement → gate)
D1→R-1→G0.1 · D2→R-2→G0.2 · D3→R-3→G0.1 · D4→R-4→G0.3 · D5→R-3→G0.1 · D6→R-5→G0.3 · D7→R-2→G0.1 · D8→R-1→G0.4. Acceptance criteria AC-1..AC-13 in `qa-plan.md §2`; build shapes in `build-spec.md`.

## Scope IN / OUT (kernel-scope, H-4)
IN: the contract + ADR + precedence graph + support matrix + minimal WorkOrder field set + kernel conformance fixtures + retention classes + the 2 enforcer scripts. OUT (route to lastmile / later phases): the trusted enforcement ADAPTER (Phase 4), the full WorkOrder/ResultEnvelope v1 (Phase 3), product-pack/webapp/founder-panel gates (lastmile), agy migration liveness (Phase 1 — recorded DOWN here, ED-060).

## Product-lens sanity check (product-lead)
COMPLETE — AC-1..AC-13 cover all ratified D1–D8, incl. AC-4 (fail-closed malformed lint) + AC-9 (positive CORE + matrix fixture coverage). Each requirement area maps to ≥1 covered deliverable; no ratified-scope coverage gap indicated.
