<!-- requirement-format-legacy -->
# Acceptance Criteria — S0.2 Artifact contracts + decision-record schema (message_brief spine)

**Sprint:** `SP-20260530-001`
**PRD:** `.claude/project/sprint/requirements/SP-20260530-001/prd.md`

> `goal_verification.reproduction = not_applicable` in the Plan Contract, so
> `verified_by: not_applicable — <justification>` is permitted. Where a runnable
> proof exists it is preferred and cited; the validator self-test
> (`scripts/contracts/test-validate-artifact.js`) is that proof and doubles as
> S0.1's test corpus (β: EVT-sp20260530-001-before-plan-beta-001).

## S-1 — Machine-readable artifact-contract schema set (R-1)

- AC-1.1: Given the 7 chain artifact types (audience_dossier, message_brief, offer_brief, conversion_brief, design_brief, build_spec, converting_artifact), when each schema under `schemas/contracts/` is loaded, then it is a valid JSON Schema (draft-07) with `$id` `warpos/contracts/<artifact>/v0.1` and a `contract` block declaring `owner_domain`, `consumers[]`, and an integer `precedence`.
  verified_by: scripts/contracts/test-validate-artifact.js::schemas-valid-and-declare-contract-meta
- AC-1.2: Given the message_brief spine, when any downstream artifact schema (offer_brief, conversion_brief, design_brief, build_spec, converting_artifact) is inspected, then it requires a `derived_from_message_brief` reference field; message_brief itself does not.
  verified_by: scripts/contracts/test-validate-artifact.js::downstream-requires-message_brief-ref

## S-2 — Decision-record schema, the oneshot α/β stand-in (R-2)

- AC-2.1: Given a conformant decision record, when validated, then it passes; and given a record missing any required field (decision, owner, rationale, precedence_basis, confidence, arbitration_needed), when validated, then the validator exits non-zero naming the missing field.
  verified_by: scripts/contracts/test-validate-artifact.js::decision-record-valid-and-rejects-missing
- AC-2.2: Given the decision-record schema, then its `$id` is `warpos/contracts/decision-record/v0.1` — a DISTINCT schema that is field-compatible with betaEvents (shares decision/owner/rationale/confidence) but is NOT the betaEvents file, preserving the oneshot clean-room invariant.
  verified_by: not_applicable — design invariant asserted by the distinct $id + spec note; no behavioral test (β Q3).

## S-3 — Fail-closed validator + precedence / reference integrity (R-3)

- AC-3.1: Given an artifact instance of unknown `type`, when validated, then the validator exits 1 — fail-closed, never lint-and-pass.
  verified_by: scripts/contracts/test-validate-artifact.js::unknown-type-rejected
- AC-3.2: Given two artifacts asserting the same integer precedence rank over the same decision surface, when validated as a chain, then the validator exits 1 naming the precedence conflict.
  verified_by: scripts/contracts/test-validate-artifact.js::precedence-conflict-rejected
- AC-3.3: Given a downstream artifact whose `derived_from_message_brief` cites a message_brief id absent from the chain, when validated, then the validator exits 1 naming the dangling reference.
  verified_by: scripts/contracts/test-validate-artifact.js::dangling-message_brief-ref-rejected
- AC-3.4: Given a clean conformant chain (audience_dossier → message_brief → offer/conversion → design_brief → build_spec → converting_artifact), when validated, then the validator exits 0.
  verified_by: scripts/contracts/test-validate-artifact.js::clean-chain-passes

## S-4 — Integration coherence (R-1/R-2/R-3 cross-cut)

- AC-4.1: Given the new spec/schemas/validator/fixture files, when both manifests are regenerated, then `manifest/validate.js --strict` reports 0 missing / 0 unmanifested / 0 drift and schema version-label coherence holds.
  verified_by: not_applicable — build-level gate (node scripts/warpos/manifest/validate.js --strict + node scripts/testsuite/enforce.js green); no per-sprint regression fixture.
- AC-4.2: Given the new contract specs/schemas/validator, then each is referenced via a `paths.*` key (not a literal) and the human-readable contract spec doc enumerates all 7 artifacts + the decision-record with owner/consumers/precedence.
  verified_by: not_applicable — verified by path-lint green + reading the spec doc; structural, not behavioral.
