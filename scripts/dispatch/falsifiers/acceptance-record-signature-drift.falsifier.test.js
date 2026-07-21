"use strict";
// FALSIFIER: rider-6/AP-8 acceptance-record-signature-drift — record-trust gate Surface 6
// (SP-20260720-002 Phase 4, AC-2). A DRIFTED acceptance-record.js signature (a missing export, a
// non-function export, or a behaviorally-neutered produce()/authorizesIntegration()) must make
// `assertAcceptanceRecordContract()` THROW — caught here BEFORE any integration is even attempted, never
// via `fn.length` (a defaulted-opts arity undercount). Also proves the REAL, live acceptance-record.js
// (module-load side effect) passes today. MUST-BLOCK (throws).
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");

test("rider-6/AP-8 acceptance-record-signature-drift — the REAL controller module loads clean (the live contract passes today)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");
  // Module-load itself is the assertion: requiring the real trusted-controller.js runs
  // assertAcceptanceRecordContract() as a side effect. A throw here would fail this whole test file to
  // load — so a clean require is itself the "the live signature has not drifted" proof.
  const ctl = require("../trusted-controller");
  assert.strictEqual(typeof ctl.integrate, "function");
  assert.strictEqual(typeof ctl.assertAcceptanceRecordContract, "function");
});

test("rider-6/AP-8 acceptance-record-signature-drift — a MISSING required export THROWS at contract-assert time", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");
  const ctl = require("../trusted-controller");
  const real = require("../acceptance-record");

  const drifted = { ...real };
  delete drifted.authorizesIntegration; // simulate a renamed/removed export

  assert.throws(() => ctl.assertAcceptanceRecordContract(drifted), /contract drift/, "MUST-BLOCK: a missing export must throw before any integration is attempted");
});

test("rider-6/AP-8 acceptance-record-signature-drift — a NON-FUNCTION export (renamed to a value) THROWS", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");
  const ctl = require("../trusted-controller");
  const real = require("../acceptance-record");

  const drifted = { ...real, commitIntegration: "not-a-function-anymore" };
  assert.throws(() => ctl.assertAcceptanceRecordContract(drifted), /contract drift/);
});

test("rider-6/AP-8 acceptance-record-signature-drift — a BEHAVIORALLY-NEUTERED produce() (never throws on a non-SHA base) is caught by the smoke, NOT fn.length", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");
  const ctl = require("../trusted-controller");
  const real = require("../acceptance-record");

  // A drifted produce() with the SAME arity (fn.length) as the real one — proving fn.length alone could
  // never have caught this; only the BEHAVIORAL smoke does.
  const neuteredProduce = (input = {}) => ({ ...input, schema_version: "acceptance-record/v1", record_digest: "fake" });
  assert.strictEqual(neuteredProduce.length, real.produce.length, "the drifted stub must share the SAME arity as the real produce() — proving fn.length cannot distinguish them");

  const drifted = { ...real, produce: neuteredProduce };
  assert.throws(
    () => ctl.assertAcceptanceRecordContract(drifted),
    /no longer throws on a non-SHA base_commit/,
    "MUST-BLOCK: a produce() that silently accepts a non-SHA base_commit must be caught by the BEHAVIORAL smoke",
  );
});

test("rider-6/AP-8 acceptance-record-signature-drift — a BEHAVIORALLY-NEUTERED authorizesIntegration() (returns true for a bare envelope) THROWS", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");
  const ctl = require("../trusted-controller");
  const real = require("../acceptance-record");

  // NOTE the default-valued 3rd param: `fn.length` does NOT count parameters after the first default value
  // (real authorizesIntegration(record, targetRef, opts = {}) reports length===2 for exactly this reason —
  // "defaulted opts undercount", the module doc's own warning against using fn.length as the drift check).
  const neuteredAuthz = (record, targetRef, opts = {}) => {
    void record;
    void targetRef;
    void opts;
    return true; // ALWAYS authorizes — the exact false-green class this smoke exists to catch
  };
  assert.strictEqual(neuteredAuthz.length, real.authorizesIntegration.length, "the drifted stub must share the SAME (undercounted) arity as the real authorizesIntegration() — proving fn.length cannot distinguish them");

  const drifted = { ...real, authorizesIntegration: neuteredAuthz };
  assert.throws(
    () => ctl.assertAcceptanceRecordContract(drifted),
    /authorizesIntegration\(bareEnvelope, ref\) did not return false/,
    "MUST-BLOCK: an always-true authorizesIntegration() must be caught",
  );
});
