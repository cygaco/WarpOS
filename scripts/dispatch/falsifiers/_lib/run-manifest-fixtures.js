"use strict";
/**
 * run-manifest-fixtures.js — shared synthetic run-manifest/result builders for the S4 default-deny
 * falsifier corpus (SP-20260720-002 Phase 4, G4.3/AC-7). NOT a falsifier — a test utility. `reconcileRunManifest`
 * is PURE (no fs/git), so these 8 falsifiers drive it directly with synthetic-but-faithful shapes rather
 * than re-running a real pinned bundle each time — the run-manifest's OWN required-fields contract
 * (schema_version/nonce/expected_checks/required_checks) is exercised verbatim.
 */
const NONCE = "test-nonce-abc123";

function manifest(overrides = {}) {
  return {
    schema_version: "run-manifest/v1",
    nonce: NONCE,
    minted_at: Date.now(),
    sp_id: "SP-S4-TEST",
    lease_fencing_token: 1,
    base_commit: "b".repeat(40),
    result_commit: "c".repeat(40),
    target_ref: "refs/heads/integration",
    suite_version: "check-suite/v1",
    bundle_digest: "digest-abc",
    expected_checks: ["alpha", "beta"],
    required_checks: ["alpha", "beta"],
    ...overrides,
  };
}

function result(name, overrides = {}) {
  return { name, status: "pass", reason: "ok", evidence: {}, digest: `digest-${name}`, nonce: NONCE, ...overrides };
}

module.exports = { NONCE, manifest, result };
