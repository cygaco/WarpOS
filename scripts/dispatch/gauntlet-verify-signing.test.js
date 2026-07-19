"use strict";
/**
 * gauntlet-verify-signing.test.js — ED-231 whole-ledger signing (SP-20260718-004 Phase 2, β RIDER-1,
 * MISTAKE-CLASS priority). Proves the liveness reader (the release/WG-19 gate) rejects a FORGED
 * UNSIGNED ok:true record — the same mistake class ADR-0025 closed on the cert-attest binding surface,
 * one reader over. A regression here = a hand-authored ok:true liveness record fooling the release gate.
 *
 * Fixture (iv) from the qa-plan: forged UNSIGNED ok:true record must NOT pass the release gate.
 */
// Isolate the HMAC secret to a temp file so the test never touches the real one (must be set BEFORE
// requiring attest-signing, which computes SECRET_FILE from the env at load).
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");
process.env.WARPOS_ATTEST_SECRET_FILE = path.join(
  os.tmpdir(),
  `gv-signing-secret-${Date.now()}-${Math.random().toString(36).slice(2)}`,
);

const { test } = require("node:test");
const assert = require("node:assert");
const { verifyGauntlet } = require("./gauntlet-verify");
const { signRecord } = require("./attest-signing");

const NOW = new Date();
const SINCE = NOW.getTime() - 60_000;

function wellFormed(overrides = {}) {
  return {
    role: "security-reviewer",
    ok: true,
    provider: "openai",
    model: "gpt-5.5",
    completed_at: NOW.toISOString(),
    tool_id: "codex",
    cmdline_checksum: "abc123",
    ...overrides,
  };
}
function signed(overrides = {}) {
  const r = wellFormed(overrides);
  r.attest_sig = signRecord(r);
  return r;
}

test("requireSignature:false (legacy default) — an unsigned well-formed ok:true record still counts as ran", () => {
  const res = verifyGauntlet({ roles: ["security-reviewer"], since: SINCE, records: [wellFormed()] });
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.roles[0].status, "ran");
});

test("FIXTURE (iv): requireSignature:true — a FORGED UNSIGNED ok:true record is rejected (fail-closed)", () => {
  const res = verifyGauntlet({
    roles: ["security-reviewer"],
    since: SINCE,
    requireSignature: true,
    records: [wellFormed()], // no attest_sig — the forged/unsigned liveness record
  });
  assert.strictEqual(res.ok, false, "an unsigned ok:true record must NOT green the gauntlet");
  assert.strictEqual(res.roles[0].status, "unsigned");
  assert.ok(res.missingRoles.includes("security-reviewer"));
});

test("requireSignature:true — a record with a BOGUS signature is rejected (fail-closed)", () => {
  const res = verifyGauntlet({
    roles: ["security-reviewer"],
    since: SINCE,
    requireSignature: true,
    records: [wellFormed({ attest_sig: "0".repeat(64) })],
  });
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.roles[0].status, "unsigned");
});

test("requireSignature:true — a PROPERLY SIGNED record passes (no false-RED on real records)", () => {
  const res = verifyGauntlet({
    roles: ["security-reviewer"],
    since: SINCE,
    requireSignature: true,
    records: [signed()],
  });
  assert.strictEqual(res.ok, true, "a validly signed origin-proof record must green");
  assert.strictEqual(res.roles[0].status, "ran");
});

test("requireSignature:true — a signed record whose IDENTITY field was tampered after signing is rejected", () => {
  const r = signed();
  r.role = "security-reviewer"; // role is a SIGNED field; tampering the provider invalidates the sig
  r.provider = "claude"; // flip provider after signing → signature no longer matches
  const res = verifyGauntlet({ roles: ["security-reviewer"], since: SINCE, requireSignature: true, records: [r] });
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.roles[0].status, "unsigned");
});

test("ED-231 RIDER-2 (sign-the-verdict): flipping a signed record's verdict FAIL→PASS invalidates the sig", () => {
  // A real signed record with verdict:fail; a same-user adversary flips it to pass. Because `verdict`
  // is now a SIGNED field, the flip no longer matches the signature → the record is rejected as unsigned.
  const r = signed({ verdict: "fail" });
  r.verdict = "pass"; // post-hoc flip of a signed record
  const res = verifyGauntlet({ roles: ["security-reviewer"], since: SINCE, requireSignature: true, records: [r] });
  assert.strictEqual(res.ok, false, "a tampered verdict must invalidate the origin-proof signature");
  assert.strictEqual(res.roles[0].status, "unsigned");
});

// Clean up the temp secret file.
test("cleanup", () => {
  try { fs.unlinkSync(process.env.WARPOS_ATTEST_SECRET_FILE); } catch { /* ignore */ }
});
