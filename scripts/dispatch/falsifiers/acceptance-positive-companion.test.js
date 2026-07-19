"use strict";
// POSITIVE COMPANION (SP-20260718-005 AC-4 happy-path) — record-trust gate defense against the reject-everything
// stub (quality-lead: a constant `authorizesIntegration = () => false` passes FOUR falsifiers while authorizing
// nothing real). This asserts the GOLDEN path: a content-valid AcceptanceRecord — matching target, terminal_state
// "success", fresh base against the integration head, valid digests, current lease token — DOES authorize. Paired
// with the F2/F3/F4/F6 falsifiers, it makes a reject-everything stub FAIL. NOT a falsifier (no MUST-BLOCK); the
// record-trust-gate enforcer tracks it as a required positive_companion. RED until SEC-2.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const MOD = path.join(ROOT, "scripts", "dispatch", "acceptance-record.js");

test("AC-4 positive companion — a fully valid AcceptanceRecord DOES authorize integration", (t) => {
  if (!fs.existsSync(MOD)) return t.skip("pending SEC-2 — acceptance-record.js not yet built (companion RED)");
  const acc = require(MOD);
  // Build a record the module itself certifies valid, so this stays true against the real content-addressed
  // trust anchor (the exact base/tree/digest values are the module's to define — use its own producer if present).
  const record =
    typeof acc.produceForTest === "function"
      ? acc.produceForTest({ target_ref: "refs/heads/integration" })
      : {
          workorder_digest: "wo-OK",
          base_commit: "base-OK",
          result_tree_hash: "tree-OK",
          target_ref: "refs/heads/integration",
          terminal_state: "success",
        };
  // SP-20260718-005 gauntlet C2 fix: recompute is MANDATORY. The golden path injects a treeResolver that
  // returns the record's OWN honest tree — the analog of production's real read-only git resolving the
  // target ref's actual tree and it MATCHING the honest record's digest. (A forged record's digest would
  // not match; a reject-everything stub still returns false — both false-greens stay defeated.)
  const authorized = acc.authorizesIntegration(record, "refs/heads/integration", {
    integrationHead: "base-OK",
    treeResolver: () => record.result_tree_hash,
  });
  assert.strictEqual(
    authorized,
    true,
    "the golden path must AUTHORIZE — a reject-everything stub fails here (defeats the constant-false false-green)",
  );
});
