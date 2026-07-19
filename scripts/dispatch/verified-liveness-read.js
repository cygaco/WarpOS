"use strict";
/**
 * verified-liveness-read.js — the SINGLE same-session choke-point for "is this ok:true dispatch-ledger
 * record a TRUSTED liveness proof?" (SP-20260718-004, gauntlet R4 close; β DIRECTIVE + α reconciliation).
 *
 * THE PROBLEM the gauntlet surfaced (rounds 3-4): the SAME mistake-reachable false-green class recurred in
 * reader after reader — gauntlet-verify, dispatch-review applyPanelGate, coverage-gate, sprint-manager-consult,
 * sprint-hook-coverage each INDEPENDENTLY trusted a field-only ok:true record, so a FORGED unsigned record
 * read as "a role ran". Patching them one at a time recurred every round. This module is the CHOKE-POINT:
 * every SAME-SESSION ok:true ledger read routes through it, and a structural guard
 * (scripts/checks/liveness-read-choke-point.js) FAILS any same-session reader that does NOT — so a NEW reader
 * cannot silently re-open the class (the recurrence-stopper, the SP-003 choke-point pattern).
 *
 * SAME-SESSION ONLY (β teeth — the exact thing the R3 verifyTyped attempt got wrong): signature verification
 * requires the signer + verifier to share the per-session HMAC secret (ADR-0025). This helper is for readers
 * of THIS session's ledger. CROSS-SESSION-by-construction readers (e.g. the sealed-capsule gate, which reads
 * an ISOLATED child repo's ledger signed with a DIFFERENT secret) are structurally unverifiable — they are
 * EXPLICITLY exempted in the guard by their STRUCTURAL property (reads a foreign-session ledger), never by a
 * settable per-record marker, and tracked (ED-232) — the named per-session ceiling, not a silent bypass.
 */
const { verifyRecord } = require("./attest-signing");

/**
 * Is `record` a trusted same-session liveness record? ok:true AND (default) a valid origin-proof signature.
 * `requireSignature` defaults TRUE (a same-session reader MUST verify); a caller reading a CROSS-SESSION
 * ledger (unverifiable by construction) passes requireSignature:false AND must be guard-exempted structurally.
 *
 * @param {object} record   a parsed dispatch-completion record
 * @param {{requireSignature?:boolean, verify?:function}} [opts]  verify injectable for the bite-test
 * @returns {boolean}
 */
function isVerifiedLivenessRecord(record, opts = {}) {
  if (!record || typeof record !== "object") return false;
  if (record.ok !== true) return false;
  const requireSignature = opts.requireSignature !== false; // default TRUE
  if (!requireSignature) return true;
  const verify = opts.verify || verifyRecord;
  return verify(record) === true;
}

/** Filter `records` to the trusted same-session liveness records. */
function filterVerifiedLiveness(records, opts = {}) {
  return (Array.isArray(records) ? records : []).filter((r) => isVerifiedLivenessRecord(r, opts));
}

module.exports = { isVerifiedLivenessRecord, filterVerifiedLiveness };
