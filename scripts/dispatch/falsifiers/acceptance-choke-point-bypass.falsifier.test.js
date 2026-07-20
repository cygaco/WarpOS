"use strict";
// FALSIFIER: AC-F9 acceptance-read choke-point BYPASS — record-trust gate (SP-20260718-005), surface acceptance-record-at-integration.
// Adversarial: an integrator that reads `envelope.success` directly and merges WITHOUT routing through
// acceptance-record.authorizesIntegration (the un-routed reader — the exact class SP-004 spent 6 rounds finding).
// The structural guard MUST-BLOCK it (report a violation), mirroring liveness-read-choke-point. RED until SEC-3.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const GUARD = path.join(ROOT, "scripts", "checks", "acceptance-read-choke-point.js");
const FIXTURE_ROOT = path.join(ROOT, "runtime", "record-trust-falsifiers", "bypass");

test("AC-F9 un-routed integrator (reads envelope.success, no authorizesIntegration) MUST-BLOCK — guard flags it", (t) => {
  if (!fs.existsSync(GUARD)) return t.skip("pending SEC-3 — acceptance-read-choke-point.js not yet built (falsifier RED)");
  const { scan } = require(GUARD);
  const res = scan(FIXTURE_ROOT); // scan the seeded fixture root, not the live tree
  const flagged = (res.violations || []).some((v) => /unrouted-integrator\.js/.test(v.file || ""));
  assert.strictEqual(
    flagged,
    true,
    "MUST-BLOCK: the structural guard must flag an integrator that authorizes a merge on envelope.success without routing through authorizesIntegration",
  );
});
