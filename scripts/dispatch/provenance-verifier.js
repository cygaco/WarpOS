"use strict";
/**
 * provenance-verifier.js — the SINGLE choke-point for security-panel evidence-provenance identity
 * (SP-20260718-003, α round-6 ruling; ED-225). Five gauntlet rounds recurred the SAME invariants because
 * they were RE-IMPLEMENTED at each consumer (cert-attest, dispatch-review) with per-site predicates — and
 * even a comprehensive sweep + a grep-guard missed a settable-label vector (SR-017 sanctioned_lane_id) and
 * a profile-contract split (SR-018/QA-017). α's fix: ONE module owns these predicates; every consumer calls
 * it; ZERO local re-implementations remain (the duplication IS the disease). A structural guard
 * (provenance-invariants.js) fails if any consumer re-implements them or keys identity on a settable label.
 *
 * THE THREE PREDICATES:
 *  1. isHunterRecord      — the sanctioned in-process Claude hunter's identity, from WRITER-STAMPED fields
 *                           ONLY (provider, shape, role). NO settable per-record label (via / record_via /
 *                           sanctioned_lane_id / any per-record string) may establish the hunter — those
 *                           are spoofable (SR-016 via, SR-017 sanctioned_lane_id).
 *  2. laneContract        — the PROFILE-AWARE lane contract: the panel-2family FLOOR's claude lane is a
 *                           subprocess-claude security review; the panel-3lab BINDING's claude lane is the
 *                           in-process hunter. Every other lane is a cross-provider CLI subprocess in both.
 *                           This closes the false-RED (SR-018/QA-017): the valid floor is attestable under
 *                           its OWN contract, while the binding still demands the hunter.
 *  3. readGitHead         — the SHA-validating ref reader (re-exported from git-head.js; loose-malformed
 *                           precedence fixed there — a malformed loose ref fails closed, never packed).
 */
const HUNTER_ROLE = "security_claude_hunter";
const IN_PROCESS_SHAPE = "in-process-agent";
const SUBPROCESS_CLAUDE_SHAPE = "subprocess-claude";
const CROSS_PROVIDER_SHAPE = "subprocess-cross-provider";
const PANEL_ROLE = "security-reviewer";

// (1) THE hunter-identity predicate. Identity = writer-stamped provider + shape + role. A subprocess
// wrapper hardcodes subprocess-claude / subprocess-cross-provider and CANNOT write in-process-agent; the
// conductor stamps role=security_claude_hunter only for the sanctioned hunter dispatch. NO settable label.
function isHunterRecord(r) {
  return !!r && r.provider === "claude" && r.shape === IN_PROCESS_SHAPE && r.role === HUNTER_ROLE;
}

// (2) THE profile-aware claude lane contract. Returns { shape, role, isHunter }.
function claudeLaneContract(profileName) {
  if (profileName === "panel-3lab") return { shape: IN_PROCESS_SHAPE, role: HUNTER_ROLE, isHunter: true };
  // panel-2family FLOOR (and any degraded/interim profile): a subprocess-claude security review.
  return { shape: SUBPROCESS_CLAUDE_SHAPE, role: PANEL_ROLE, isHunter: false };
}

// The full per-lane contract for a profile: claude is profile-dependent (above); every cross-provider lab
// is a CLI subprocess review in both profiles.
function laneContract(profileName, provider) {
  if (provider === "claude") return claudeLaneContract(profileName);
  return { shape: CROSS_PROVIDER_SHAPE, role: PANEL_ROLE, isHunter: false };
}

// Does a same-run record satisfy a lane's contract? For the hunter lane, isHunterRecord is the gate; for a
// CLI/subprocess lane, the writer-stamped shape + role (+ provider) must match the contract. Liveness,
// non-fallback, provenance (output_digest / cmdline_checksum / code_sha / panel_run_id) are the CALLER's
// corroboration checks — this predicate owns only the IDENTITY (shape/role), never a settable label.
function recordMatchesLane(r, contract, provider) {
  if (!r) return false;
  if (contract.isHunter) return isHunterRecord(r);
  return r.provider === provider && r.shape === contract.shape && r.role === contract.role;
}

const { readGitHead } = require("./git-head");

module.exports = {
  HUNTER_ROLE,
  IN_PROCESS_SHAPE,
  SUBPROCESS_CLAUDE_SHAPE,
  CROSS_PROVIDER_SHAPE,
  PANEL_ROLE,
  isHunterRecord,
  claudeLaneContract,
  laneContract,
  recordMatchesLane,
  readGitHead,
};
