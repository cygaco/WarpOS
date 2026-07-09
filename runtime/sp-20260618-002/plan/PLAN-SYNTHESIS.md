# SP-20260618-002 — Plan-Phase Synthesis (E-MC-READINESS-ANALYSIS-001)

**Plan consults (real GPT-5.5, gauntlet-verify PASS):** director-of-product (ok), product-lead (ok).
**β plan→design:** consult sent, awaiting verdict (gates advancing to design).

## Composition (locked)
3 analysis units, LOW-MEDIUM risk, A1→A2→A3 (A3 LAST — both consults agree). ANALYSIS-ONLY.

## DoP verdict (strategy)
Proceed. Finishing the analysis epic is the right opportunity-cost call (jumping to execution would
burn against an unfrozen target + recreate the stale-tracker problem). A2 is the value unlock; A1
closes the last evidence gap; A3 last (tracker reflects consolidated truth).
**Register PRIORITIZATION (DoP):** P0 = false-confidence / missing-enforcement (ED-033 "enforcer named
but never built" class, prose-vs-enforcement gaps, gates stronger-looking than they are) + the 2 high
security findings; P1 = the 10 high-severity edge cases grouped by the 5 structural classes (fix root
causes not symptoms) + pipeline/sealed-capsule integrity; P2 = medium/low by leverage (blast radius,
operator frequency, fix-dependency, multi-finding-reduction).
**Each register item carries:** severity, release-blocking flag, source track, evidence link, affected
surface, root-cause class, dependency, proposed execution epic/ticket, acceptance evidence.
**Track-1 depth:** timebox to "credible adversarial sampling," not exhaustive proof (golden-flow bypass,
sealed-capsule gate failure modes, stale-state/readiness misclassification, enforcement/prose mismatch);
stop when actionable or no new class beyond existing docs.
**Strategic risk + HOW:** A2 can become a taxonomy exercise → force EVERY entry to route to execution or
be explicitly marked "no-action/accepted" — NO orphan findings.

## Product-Lead verdict (execution) + AC SPINE
Scope OK, A3 LAST (read-only baseline note first; reconciling before A1/A2 = churn).

### A1 AC — Track-1 hardening-sim findings doc
- Extends the sealed-capsule foundation ACROSS the shipped/masterconsole command-flow surface (not a
  new broad audit). Uses test-sealed-capsule-gate.js + runtime/sealed-gate-full.log as foundation.
- Enumerates: exercised surfaces, skipped/unreachable surfaces, failure modes, fragilities, readiness risks.
- Each finding: source/evidence, severity, reproducibility/confidence, execution-route.
- Anti-sprawl: stop at launch-relevant fragility; no fixes, no speculative redesign, no exhaustive
  non-shipped-system archaeology.

### A2 AC — consolidated findings register
- Represents Tracks 1,2,3,4,6 + Track-5 as SUPERSEDED/absorbed-by-E-SYSTEM-ORG-001.
- Every material finding preserved from source docs OR explicitly marked duplicate/absorbed.
- Each finding: stable ID, source track/doc, severity, launch reachability/blast radius, evidence
  pointer, proposed execution route, owner epic if known.
- Prioritized: severity → external-launch reachability → lack-of-automated-enforcement →
  dependency-unblocking value → fix containment.
- Separates: `must-fix-before-external-launch` / `should-fix-before-launch` / `execution-backlog`.

### A3 AC — tracker reconciliation
- Credits Track-2/3/4/6 complete with report links; records Track-5 supersession into E-SYSTEM-ORG-001;
  records A1 completion + A2 register path; truthful DoD checkboxes (incl. register + analysis-only
  invariant); corrects % from stale ~15% to reality after A1/A2; records bundling/supersession in
  session/change log.

### ANALYSIS-ONLY CHECK (the load-bearing invariant)
- Final diff limited to `_reports/` + the E-MC tracker + optional `runtime/` evidence.
- NO diff under `scripts/`, framework/product source, hooks, validators, manifests, shipped assets.
- Any proposed fix appears ONLY as a finding routed to E-MC-READINESS-EXECUTION-001 (or an existing
  execution epic) — never applied here.

## Next: DESIGN
- product-lead (always, block) — author the analysis build_spec / AC from the spine above (CLI, I dispatch).
- director-of-engineering (claude, in-process → RELAY to α) — the A1 hardening-sim ENVELOPE (what command
  surface, what failure modes, how to exercise without modifying).
- Then β at design→build (the analysis-only invariant is the load-bearing gate).
