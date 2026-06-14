<!-- requirement-format-legacy -->
# Acceptance Criteria — ED-051 enforcer — missing_product_lead_authoring finding

**Sprint:** `SP-20260613-001`
**PRD:** `C:\Users\Vlad\Desktop\Claude\Projects\WarpOS\.claude\project\sprint\requirements\SP-20260613-001\prd.md`

> Each AC is testable. The detector finding is proven by the existing enforcer test
> harness `scripts/checks/test-sprint-manager-consult.js` (planted fixtures), the live
> behavior by running the enforcer against the real ledger, and the scan-surface by the
> enforcer's `--json` output + `/scan:scan-coverage`.

## S-1 — Detector fires selectively on a real WG-3 violation

- AC-1.1: Given a post-cutoff sprint (date ≥ `AUTHORING_CUTOFF` 2026-06-12) that produced a `plan`/`design` phase event for its sprint_id and has NO backing `product-lead` authorship dispatch record, when `computeFindings` runs, then it emits a `missing_product_lead_authoring` finding and counts the sprint `applicable`.
  verified_by: scripts/checks/test-sprint-manager-consult.js::pl1_post_cutoff_plan_no_record_REDs
- AC-1.2: Given a sprint with a plan artifact and no record but dated BEFORE `AUTHORING_CUTOFF` (2026-06-11), when `computeFindings` runs, then it emits ZERO `missing_product_lead_authoring` findings (pre-WG-3 backlog exempt).
  verified_by: scripts/checks/test-sprint-manager-consult.js::pl5_pre_cutoff_exempt

## S-2 — Record-backed authorship + non-circular solo carve-out

- AC-2.1: Given a post-cutoff sprint with a plan/design artifact AND an in-window `{role:"product-lead", ok:true}` dispatch record correlated by sprint_id (the real line-269/291 record shape), when `computeFindings` runs, then it emits ZERO `missing_product_lead_authoring` findings (compliant sprint greens).
  verified_by: scripts/checks/test-sprint-manager-consult.js::pl3_record_present_GREENs
- AC-2.2: Given a sprint that emitted NO `plan`/`design` phase event (the solo shape) with α authoring and no product-lead record, when `computeFindings` runs, then it emits ZERO `missing_product_lead_authoring` findings via the in-scope carve-out (clause-1 unmet) — NOT via a circular "no-record ⇒ assume solo" inference.
  verified_by: scripts/checks/test-sprint-manager-consult.js::pl4_solo_no_phase_event_GREENs

## S-3 — Integration: no regression, no self-trip, rides /scan:full

- AC-3.1: Given the existing `missing_design_consult` fixtures (a, b, k1, k2), when the suite runs, then each emits ZERO `missing_product_lead_authoring` findings and all existing cases still pass unchanged (no cross-contamination).
  verified_by: scripts/checks/test-sprint-manager-consult.js::no_cross_contamination_regression
- AC-3.2: Given the REAL event + dispatch ledger, when `node scripts/checks/sprint-manager-consult.js` runs, then it exits 0 — it does NOT retroactively RED any historic sprint AND does NOT RED SP-20260613-001 itself (the enforcer's own sprint greens because it complied or never ran plan/design phases).
  verified_by: scripts/checks/test-sprint-manager-consult.js::live_ledger_exit_0_no_self_trip
- AC-3.3: Given the new finding_type, when `node scripts/checks/sprint-manager-consult.js --json` runs and `/scan:scan-coverage` runs, then the `missing_product_lead_authoring` finding_type is present in the schema and scan-coverage stays green (the finding rides `/scan:full` additively, no list edit).
  verified_by: scripts/checks/test-sprint-manager-consult.js::module_shape_and_finding_type_sanity
