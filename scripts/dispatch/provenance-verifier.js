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

// (R7-BE-001, fail-CLOSED) The WHITELIST of recognized panel profiles. The lane contract is defined ONLY
// for these two — the BINDING `panel-3lab` and the degraded FLOOR `panel-2family` (ADR-0020 / panel-lane-
// manifest.json `profiles`). Before this whitelist, `claudeLaneContract` treated ANY non-`panel-3lab` string
// as the floor contract, so a typo'd/unknown/absent profile ("panel-2famly", undefined, "") silently
// false-greened to the subprocess-claude floor. Now an unrecognized/absent profile FAILS CLOSED (throws) —
// a crash is never a pass. This set must track `claudeLaneContract`'s profile branches (they co-live in this
// module, so they cannot drift) + the manifest `profiles`; adding a profile is a deliberate edit to BOTH.
const RECOGNIZED_PROFILES = Object.freeze(["panel-3lab", "panel-2family"]);

// FAIL-CLOSED profile guard. An unrecognized or absent profile is a contract error, not a floor default.
// Throws so an unknown profile can NEVER resolve to a contract — the consumers (cert-attest, dispatch-review)
// only ever pass a recognized literal (or the "panel-2family" default), so this never fires on the GREEN path.
function assertRecognizedProfile(profileName) {
  if (!RECOGNIZED_PROFILES.includes(profileName)) {
    throw new Error(
      `provenance-verifier: unrecognized panel profile ${JSON.stringify(profileName)} — recognized profiles are ` +
        `[${RECOGNIZED_PROFILES.join(", ")}]. A typo'd/unknown/absent profile FAILS CLOSED (R7-BE-001); it must ` +
        `never default to the floor contract.`,
    );
  }
}

// (1) THE hunter-identity predicate. Identity = writer-stamped provider + shape + role. A subprocess
// wrapper hardcodes subprocess-claude / subprocess-cross-provider and CANNOT write in-process-agent; the
// conductor stamps role=security_claude_hunter only for the sanctioned hunter dispatch. NO settable label.
function isHunterRecord(r) {
  return !!r && r.provider === "claude" && r.shape === IN_PROCESS_SHAPE && r.role === HUNTER_ROLE;
}

// (1b) THE sanctioned in-process claude LANE predicate (SR-020, ADR-0022 teeth-2). The CLI-only tooth
// (panel-lanes.js#assertCliOnlyPanel) EXEMPTS exactly one lane from the "cross-provider labs must be CLI
// subprocess" rule: the claude hunter. Identity of that lane = its STRUCTURAL contract — laneId "claude"
// AND provider "claude" AND the in-process shape — NEVER a settable per-lane label (`sanctioned_lane_id`
// / `role` on the manifest lane, which SR-020 flagged as the third settable-identity consumer). The
// choke-point owns this so the tooth keys on the SAME identity authority as the record path (isHunterRecord),
// closing the SR-020 gap that a gpt/agy lane could assert the exemption by setting sanctioned_lane_id. The
// laneId+provider positive scope means only lane "claude" on provider "claude" can ever qualify.
function isSanctionedHunterLane(laneId, lane) {
  return !!lane && laneId === "claude" && lane.provider === "claude" && lane.shape === IN_PROCESS_SHAPE;
}

// (2) THE profile-aware claude lane contract. Returns { shape, role, isHunter }. FAILS CLOSED on an
// unrecognized/absent profile (R7-BE-001) — only `panel-3lab` (BINDING → hunter) and `panel-2family`
// (FLOOR → subprocess-claude review) are contracted; a typo'd profile throws, it does not floor-default.
function claudeLaneContract(profileName) {
  assertRecognizedProfile(profileName);
  if (profileName === "panel-3lab") return { shape: IN_PROCESS_SHAPE, role: HUNTER_ROLE, isHunter: true };
  // panel-2family FLOOR: a subprocess-claude security review. (Reached ONLY for the whitelisted floor now.)
  return { shape: SUBPROCESS_CLAUDE_SHAPE, role: PANEL_ROLE, isHunter: false };
}

// The full per-lane contract for a profile: claude is profile-dependent (above); every cross-provider lab
// is a CLI subprocess review in both profiles. The profile is validated FIRST (R7-BE-001, fail-closed) so an
// unrecognized profile throws for EVERY provider — not only the claude lane — closing the partial false-green
// where a bogus profile would still resolve the gpt/agy lanes to a cross-provider contract.
function laneContract(profileName, provider) {
  assertRecognizedProfile(profileName);
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
  RECOGNIZED_PROFILES,
  assertRecognizedProfile,
  isHunterRecord,
  isSanctionedHunterLane,
  claudeLaneContract,
  laneContract,
  recordMatchesLane,
  readGitHead,
};
