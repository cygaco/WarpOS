# TRACE — Enforce sprint routing policy

**Sprint:** `SP-20260514-002`
**PRD:** `prd.md`

Observability hooks. Each `TR-N` ties a request → requirement → code → test → release → learning.

## TR-1 — Trace row written (linked R-2, S-1)

- **Event type:** `sprint.routing.recorded`
- **Emitted by:** `scripts/sprint/routing.js record`
- **Payload:** `{ phase, artifact_id, sprint_id, model, diff_reviewer, evidence, ts }`
- **Sink:** append to `paths.eventsFile` via `scripts/hooks/lib/logger.js`.
- **Test:** `tests/sprint/routing-record.test.js` asserts an event with the expected shape after `record`.

## TR-2 — Trace row missing detected (linked R-1, S-2)

- **Event type:** `sprint.routing.check_failed`
- **Emitted by:** `scripts/sprint/routing.js check` on miss.
- **Payload:** `{ phase, artifact_id, sprint_id, expected_class }`
- **Sink:** events file.
- **Test:** `tests/sprint/routing-check.test.js` covers hit + miss.

## TR-3 — Guard warn surfaced (linked R-10, S-10)

- **Event type:** `sprint.routing.guard_warned`
- **Emitted by:** `scripts/hooks/sprint-routing-guard.js` on `enforcement.mode = warn` miss.
- **Payload:** `{ artifact_path, sprint_id, inferred_phase, mode: "warn" }`
- **Sink:** events file.
- **Test:** integration test in `tests/hooks/sprint-routing-guard.test.js` with synthetic PreToolUse payload.

## TR-4 — Guard block surfaced (linked R-10, S-10)

- **Event type:** `sprint.routing.guard_blocked`
- **Emitted by:** `scripts/hooks/sprint-routing-guard.js` on `enforcement.mode = block` miss.
- **Payload:** same as TR-3 with `mode: "block"`.
- **Sink:** events file.
- **Test:** same suite as TR-3.

## TR-5 — Coverage report (linked R-8, S-3)

- **Event type:** `sprint.routing.coverage_report`
- **Emitted by:** `scripts/sprint/routing.js coverage` at the end of a coverage run.
- **Payload:** `{ sprint_id, required_phases, covered, missing, optional_missing, ts }`
- **Sink:** events file + stdout.
- **Test:** `tests/sprint/routing-coverage.test.js` covers full + partial + missing cases.

## TR-6 — Release gate refused (linked R-8, S-8)

- **Event type:** `sprint.release.routing_gap`
- **Emitted by:** `scripts/sprint/release.js` when coverage exits non-zero.
- **Payload:** `{ sprint_id, missing_phases, allow_routing_gap: false }`
- **Sink:** events file + decision-ledger.
- **Test:** integration in `tests/sprint/release-gate.test.js`.

## TR-7 — Single-vendor fallback recorded (linked R-4, S-1)

- **Event type:** `sprint.routing.single_vendor_session`
- **Emitted by:** `scripts/sprint/routing.js record --evidence single_vendor_session`.
- **Payload:** `{ phase, artifact_id, sprint_id, model, requested_diff_review: true, decision_ledger_ref }`
- **Sink:** events file + decision-ledger.
- **Test:** `tests/sprint/routing-record.test.js` covers the single-vendor branch.
