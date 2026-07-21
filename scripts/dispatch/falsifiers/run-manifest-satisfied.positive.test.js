"use strict";
// POSITIVE COMPANION (shared): the 8 default-deny-*.falsifier.test.js files (SP-20260720-002 Phase 4, S4,
// AC-7). All expected checks present, correct nonce, correctly-shaped, all passing -> `reconcileRunManifest`
// authorizes (ok:true). Defeats a reject-everything stub. ALSO exercised end-to-end through the real
// controller + a real pinned bundle (the same happy-path proof every other module test relies on).
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");

test("run-manifest-satisfied POSITIVE (pure) — every expected check present + correct nonce + passing -> ok:true", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");
  const ctl = require("../trusted-controller");
  const { manifest, result } = require("./_lib/run-manifest-fixtures");

  const rm = manifest({ expected_checks: ["alpha", "beta"], required_checks: ["alpha", "beta"] });
  const out = ctl.reconcileRunManifest(rm, [result("alpha"), result("beta")]);
  assert.deepStrictEqual(out, { ok: true });
});

test("run-manifest-satisfied POSITIVE (end-to-end) — a real controller + real pinned bundle run over a clean tree authorizes + integrates", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");
  const { makeControllerFixture, standardInput, standardOpts } = require("./_lib/controller-fixtures");
  const { headSha } = require("./_lib/git-scratch");
  const ctl = require("../trusted-controller");

  const fx = makeControllerFixture("run-manifest-satisfied-e2e");
  t.after(() => fx.cleanup());

  const result = ctl.integrate(standardInput(fx), standardOpts(fx));
  assert.strictEqual(result.ok, true, JSON.stringify(result));
  assert.strictEqual(headSha(fx.dir, fx.targetRef), fx.result);
});
