"use strict";
/**
 * workorder-schema.js — WorkOrder MIN SCHEMA validator + workorder_digest (SP-20260718-005 Phase 3,
 * units BE-1 + BE-3). Mirrors the JSON Schema at .claude/schemas/workorder-min.schema.json — this file
 * is a hand-rolled, dependency-free implementation of that shape (no ajv / no new npm package; the spec
 * forbids adding a dependency not already in package.json). Keep the two files in sync by hand; the JSON
 * Schema is the documented contract, this module is the enforced one.
 *
 * SCOPE (BE-1): `validate(workorder) -> {ok, errors}` FAILS CLOSED — a missing required field, a
 * terminal_state outside the 5, or a failure_reason outside the CLASS taxonomy all yield {ok:false}. A
 * hollow/empty WorkOrder ({}) fails (every required field is reported missing).
 *
 * SCOPE (BE-3): `workOrderDigest(workorder)` is a PURE, deterministic sha256 over the IMMUTABLE WorkOrder
 * identity fields only (schema_version, correlation_id, role, provider, model, base_commit,
 * result_tree_hash, allowed_capabilities, allowed_paths) — never over terminal_state/failure_reason/
 * retry_lineage/evidence_refs, which mutate across the WorkOrder's lifecycle. The digest is appended to
 * attest-signing.js#SIGNED_FIELDS (BE-3) so a post-hoc workorder_digest swap on a signed record invalidates
 * the same-session HMAC signature — see the "Session-scope partition" note in build_spec.md: the WorkOrder
 * is a SAME-SESSION artifact, so per-session HMAC signing is the correct trust anchor for it (unlike the
 * cross-session AcceptanceRecord/lease, which must NOT depend on it — SHARP-1).
 *
 * failure_reason semantics (deliberate, not literally spelled out field-by-field in the spec but the only
 * consistent reading): terminal_state === "success" carries NO failure_reason (a success has no failure
 * cause — presence is a contradiction and is rejected); every OTHER terminal_state (partial/blocked/
 * failed/cancelled) REQUIRES a failure_reason drawn from the CLASS taxonomy. This keeps the two enums
 * honest against each other instead of independently-optional siblings that could disagree.
 */

const crypto = require("crypto");

// EXACTLY these 5 — order is the canonical enumeration order (not load-bearing, just readable).
const TERMINAL_STATES = Object.freeze(["success", "partial", "blocked", "failed", "cancelled"]);

// The CLASS taxonomy (not states) a non-success terminal_state cites as its cause.
// `model_unavailable` MUST be present — it predicted the harness-spawn model-override bug class (ED-208).
const FAILURE_REASON_CLASSES = Object.freeze([
  "timeout",
  "quota_exhausted",
  "provider_unavailable",
  "model_unavailable",
  "auth_missing",
  "worktree_base_stale",
]);

// The IMMUTABLE WorkOrder identity fields the digest covers (BE-3). Alphabetically sorted so the
// canonical field ORDER itself is deterministic and reviewable ("sort keys" per the spec) — independent
// of whatever key-insertion order the caller's workorder object happens to have.
const DIGEST_FIELDS = Object.freeze([
  "allowed_capabilities",
  "allowed_paths",
  "base_commit",
  "correlation_id",
  "model",
  "provider",
  "result_tree_hash",
  "role",
  "schema_version",
]);

const REQUIRED_STRING_FIELDS = Object.freeze([
  "schema_version",
  "correlation_id",
  "role",
  "provider",
  "model",
  "base_commit",
  "result_tree_hash",
]);

const REQUIRED_STRING_ARRAY_FIELDS = Object.freeze(["allowed_capabilities", "allowed_paths"]);
const REQUIRED_ARRAY_FIELDS = Object.freeze(["retry_lineage", "evidence_refs"]);

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function isStringArray(v) {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

/**
 * validate(workorder) -> {ok:boolean, errors:string[]}
 * FAIL-CLOSED: never throws on a malformed input — a non-object, null, or array input is simply {ok:false}.
 * Every violation is collected (not short-circuited) so a hollow WorkOrder reports its full failure list.
 */
function validate(workorder) {
  if (!workorder || typeof workorder !== "object" || Array.isArray(workorder)) {
    return { ok: false, errors: ["workorder must be a non-null, non-array object"] };
  }
  const wo = workorder;
  const errors = [];

  for (const f of REQUIRED_STRING_FIELDS) {
    if (!isNonEmptyString(wo[f])) {
      errors.push(`missing/invalid required field: '${f}' (expected a non-empty string)`);
    }
  }
  for (const f of REQUIRED_STRING_ARRAY_FIELDS) {
    if (!isStringArray(wo[f])) {
      errors.push(`missing/invalid required field: '${f}' (expected string[])`);
    }
  }
  for (const f of REQUIRED_ARRAY_FIELDS) {
    if (!Array.isArray(wo[f])) {
      errors.push(`missing/invalid required field: '${f}' (expected an array)`);
    }
  }

  const terminalState = wo.terminal_state;
  const validTerminal = TERMINAL_STATES.includes(terminalState);
  if (!validTerminal) {
    errors.push(
      `terminal_state must be one of: ${TERMINAL_STATES.join(", ")} (got: ${JSON.stringify(terminalState)})`,
    );
  }

  const failureReason = wo.failure_reason;
  const hasFailureReason = failureReason !== undefined && failureReason !== null;
  if (hasFailureReason && !FAILURE_REASON_CLASSES.includes(failureReason)) {
    errors.push(
      `failure_reason must be one of the CLASS taxonomy: ${FAILURE_REASON_CLASSES.join(", ")} (got: ${JSON.stringify(failureReason)})`,
    );
  }
  if (validTerminal) {
    if (terminalState === "success" && hasFailureReason) {
      errors.push("failure_reason must be ABSENT when terminal_state is 'success' (a success has no failure cause)");
    } else if (terminalState !== "success" && !hasFailureReason) {
      errors.push(
        `failure_reason is REQUIRED when terminal_state is '${terminalState}' (one of: ${FAILURE_REASON_CLASSES.join(", ")})`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * workOrderDigest(workorder) -> hex sha256 string. PURE — no fs, no randomness, no clock. Covers ONLY the
 * IMMUTABLE identity fields (DIGEST_FIELDS); any other field on the input (terminal_state, retry_lineage,
 * evidence_refs, extra props, etc.) never affects the digest. Missing digest fields serialize as `null`
 * (stable) rather than being omitted, so the digest is well-defined even over a partially-hollow input —
 * callers that need a valid digest should validate() first.
 */
function workOrderDigest(workorder) {
  const wo = workorder && typeof workorder === "object" && !Array.isArray(workorder) ? workorder : {};
  const canonical = {};
  for (const f of DIGEST_FIELDS) {
    canonical[f] = wo[f] === undefined ? null : wo[f];
  }
  const json = JSON.stringify(canonical);
  return crypto.createHash("sha256").update(json).digest("hex");
}

module.exports = {
  TERMINAL_STATES,
  FAILURE_REASON_CLASSES,
  DIGEST_FIELDS,
  validate,
  workOrderDigest,
};
