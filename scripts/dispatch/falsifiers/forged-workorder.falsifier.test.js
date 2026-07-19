"use strict";
// FALSIFIER: AC-F1 forged/unsigned WorkOrder — record-trust gate (SP-20260718-005), surface workorder-at-dispatch.
// Adversarial: a hand-authored WorkOrder with the right fields but NO valid same-session signature. The ED-218
// active validator MUST-BLOCK it (field-only trust is a rubber-stamp — the attest-signing mistake-class). RED until SEC-1.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const MOD = path.join(ROOT, "scripts", "dispatch", "workorder-validator.js");

test("AC-F1 forged/unsigned WorkOrder MUST-BLOCK role resolution", (t) => {
  if (!fs.existsSync(MOD)) return t.skip("pending SEC-1 — workorder-validator.js not yet built (falsifier RED)");
  const { validate } = require(MOD);
  const forged = {
    schema_version: "1",
    correlation_id: "corr-forged",
    role: "backend-builder",
    provider: "claude",
    base_commit: "base-1",
    result_tree_hash: "tree-1",
    allowed_capabilities: ["read"],
    allowed_paths: ["scripts/"],
    terminal_state: "success",
    // NO valid attest signature — hand-authored
  };
  const res = validate(forged);
  const okFlag = res && (res.ok === true || res.valid === true);
  assert.notStrictEqual(
    okFlag,
    true,
    "MUST-BLOCK: an unsigned/forged WorkOrder must fail active validation (schema+authority), never resolve a role",
  );
});
