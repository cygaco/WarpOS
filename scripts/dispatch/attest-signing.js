"use strict";
/**
 * attest-signing.js — ORIGIN-PROOF for the binding security-panel attestation (SP-20260718-003, ED-231;
 * α RULING option (A) + (C)-honesty; ADR-0025).
 *
 * THE PROBLEM (gauntlet-caught, reproduced): cert-attest.attestLane/attestPanelRun validated record FIELDS
 * (shape/role/provider/panel_run_id/code_sha/digests) but NEVER proved WRITER ORIGIN — so a HAND-AUTHORED
 * ledger record with the right fields ATTESTED ok:true. In this system the primary actor is an AI agent with
 * NORMAL ledger-write access, so a mistaken/shortcut-taking component hand-writing a plausible record is the
 * exact mistake-class (feedback_never_claim_done_without_proof: the 2026-06 faked-ε-dispatch precedent). A
 * field-only attestor is a rubber-stamp of whatever is in the file.
 *
 * THE FIX: a per-session HMAC secret the FS-writer cannot forge WITHOUT deliberate intent. The TWO trusted
 * writers (dispatch-agent.recordCompletion — the single choke-point BOTH the CLI records AND epsilon-runtime's
 * in-process hunter go through) sign the canonical IDENTITY fields; cert-attest VERIFIES and FAILS-CLOSED on an
 * absent/invalid signature. A hand-authored record has no valid signature → it cannot attest.
 *
 * HONEST CEILING (named, accepted — ADR-0025): the secret lives in a gitignored runtime file, so a SAME-USER
 * FS-READ adversary can read it and forge a valid signature (or edit the attestor / read any local key). NO
 * local scheme beats a same-user adversary — that boundary is the machine/user account (the SP-001 raced-
 * hard-link honest-ceiling class). This converts forgery from MISTAKE-REACHABLE to REQUIRES-DELIBERATE-INTENT
 * (read the secret + re-sign), which is the design goal; the residual is the named account boundary, not a
 * silent hole.
 *
 * SCOPE (α): verification is REQUIRED on the BINDING attestation surface ONLY (the cert-attest path). The
 * broader gauntlet-verify ok:true liveness readers are UNTOUCHED this session — whole-ledger signing is a
 * Phase-2 identity/portability item (tracked). Signing every record is additive + harmless to those readers.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
// Gitignored runtime secret (same dir as the ledger — .claude/runtime/ is gitignored). Created once, reused by
// every process this session. A dedicated test secret path is honored so a bite-test never touches the real one.
const SECRET_FILE =
  process.env.WARPOS_ATTEST_SECRET_FILE || path.join(ROOT, ".claude", "runtime", ".attest-session-secret");

// The CANONICAL fields the signature covers — the fields the attestation keys its trust on. Order is
// FIXED (signer + verifier must agree byte-for-byte). Binds IDENTITY + PROVENANCE.
// SP-20260718-004 Phase 2 (ED-231 RIDER-2 — sign-the-verdict): `verdict` is now INCLUDED. ADR-0025
// originally EXCLUDED it (the sig proved the lane RAN with real origin, not what it FOUND), leaving a
// same-user FAIL→PASS flip of a real signed record un-detected (BE-CQ-001's allowlist catches
// malformed/unknown values but NOT a valid-but-tampered flip). Signing the verdict closes that within
// the same account ceiling: flipping a signed verdict now invalidates the signature. Records with no
// verdict field sign/verify with the empty value consistently (backward-compatible for non-review records).
const SIGNED_FIELDS = Object.freeze([
  "role",
  "shape",
  "provider",
  "tool_id",
  "panel_run_id",
  "code_sha",
  "output_digest",
  "evidence_sha",
  "cmdline_checksum",
  "completed_at",
  "verdict", // ED-231 RIDER-2 (SP-20260718-004): a post-hoc verdict flip invalidates the signature.
]);

let _cachedSecret;
/** The per-session HMAC secret — read from the gitignored file, created (0600-ish) on first use. Cached
 *  per-process. Same-user-readable by construction (the named ceiling). Returns a Buffer. */
function sessionSecret() {
  if (_cachedSecret !== undefined) return _cachedSecret;
  try {
    if (fs.existsSync(SECRET_FILE)) {
      const hex = fs.readFileSync(SECRET_FILE, "utf8").trim();
      if (/^[0-9a-f]{64,}$/i.test(hex)) return (_cachedSecret = Buffer.from(hex, "hex"));
    }
    // create it
    const secret = crypto.randomBytes(32);
    fs.mkdirSync(path.dirname(SECRET_FILE), { recursive: true });
    fs.writeFileSync(SECRET_FILE, secret.toString("hex"), { mode: 0o600 });
    return (_cachedSecret = secret);
  } catch (e) {
    // Fail-CLOSED at the caller: no secret → signRecord returns null (record unsigned → cannot attest);
    // verifyRecord returns false (an absent secret can never validate a signature).
    _cachedSecret = null;
    return _cachedSecret;
  }
}

/** The deterministic canonical string a record's signature covers. Missing fields → empty (stable). PURE. */
function canonicalIdentityString(record) {
  return SIGNED_FIELDS.map((f) => `${f}=${record && record[f] != null ? String(record[f]) : ""}`).join("\x1f");
}

/** HMAC-SHA256(secret, canonicalIdentityString(record)) → hex, or null if the secret is unavailable
 *  (unsigned → the verifier fails it closed). Injectable secret for the bite-test. */
function signRecord(record, secret = sessionSecret()) {
  if (!secret) return null;
  return crypto.createHmac("sha256", secret).update(canonicalIdentityString(record)).digest("hex");
}

/** Verify record.attest_sig over its canonical identity fields. FAIL-CLOSED: no secret, no/short sig, or a
 *  mismatch → false. Timing-safe compare. Injectable secret for the bite-test. */
function verifyRecord(record, secret = sessionSecret()) {
  if (!secret || !record) return false;
  const sig = record.attest_sig;
  if (typeof sig !== "string" || !/^[0-9a-f]{64}$/i.test(sig)) return false; // absent/malformed → fail-closed
  const expected = signRecord(record, secret);
  if (!expected) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

module.exports = { sessionSecret, canonicalIdentityString, signRecord, verifyRecord, SIGNED_FIELDS, SECRET_FILE };
