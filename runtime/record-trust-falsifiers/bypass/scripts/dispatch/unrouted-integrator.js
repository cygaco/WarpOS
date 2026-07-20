"use strict";
// SEEDED FIXTURE (SP-20260718-005 AC-F9) — a PLANTED un-routed integrator for the acceptance-read choke-point
// bypass falsifier. Lives under runtime/ (walk-skipped; NOT scanned by the production guard) so it never reds
// the real tree. The acceptance-read-choke-point guard (SEC-3), scanned against this fixture root, MUST flag
// this file: it authorizes a MERGE on a ResultEnvelope's `.success` WITHOUT routing through
// acceptance-record.authorizesIntegration. This is the exact SP-004 "un-routed reader" class the guard exists
// to catch — proving the guard is structural (catches a NEW un-routed reader), not per-instance.

function integrate(resultEnvelope, targetRef) {
  // ANTI-PATTERN: trusts the provider's self-authored success directly — no AcceptanceRecord, no authorizesIntegration.
  if (resultEnvelope.success === true) {
    return mergeIntoIntegrationHead(targetRef); // authorizes integration on an untrusted envelope
  }
  return false;
}

function mergeIntoIntegrationHead(_ref) {
  return true;
}

module.exports = { integrate };
