"use strict";
// FALSIFIER: AC-F2 self-asserted-success — record-trust gate (SP-20260718-005), surface acceptance-record-at-integration.
// Adversarial: a ResultEnvelope claims success:true with NO trusted AcceptanceRecord. Integration MUST-BLOCK —
// a provider's self-authored success NEVER authorizes integration (R-2). RED until SEC-2 builds acceptance-record.js.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const MOD = path.join(ROOT, "scripts", "dispatch", "acceptance-record.js");

test("AC-F2 self-asserted success MUST-BLOCK integration (no trusted AcceptanceRecord)", (t) => {
  if (!fs.existsSync(MOD)) return t.skip("pending SEC-2 — acceptance-record.js not yet built (falsifier RED)");
  const { authorizesIntegration } = require(MOD);
  const envelope = { success: true, provider: "openai", role: "backend-builder" }; // untrusted execution report
  const authorized = authorizesIntegration(envelope, "refs/heads/integration");
  assert.strictEqual(
    authorized,
    false,
    "MUST-BLOCK: a ResultEnvelope success with no trusted AcceptanceRecord must not authorize integration",
  );
});
