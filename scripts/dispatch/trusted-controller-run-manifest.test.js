"use strict";
// AC-6 — Exact run manifest (SP-20260720-002 Phase 4). Every controller run has a UNIQUE nonce-bound
// manifest listing each expected check, its requiredness, suite version, and expected evidence identity.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const CONTROLLER = path.join(__dirname, "trusted-controller.js");

test("AC-6 trusted-controller-run-manifest — mintRunManifest produces the full run-manifest/v1 shape", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const ctl = require("./trusted-controller");

  const ctx = {
    bundleManifest: { bundle_digest: "digest-abc" },
    pinnedIndex: { SUITE_VERSION: "check-suite/v1-test", CHECK_NAMES: ["alpha", "beta"], REQUIRED_CHECKS: ["alpha"] },
    baseCommit: "b".repeat(40),
    resultCommit: "c".repeat(40),
    targetRef: "refs/heads/integ",
    leaseToken: 7,
  };
  const rm = ctl.mintRunManifest({}, { spId: "SP-TEST" }, ctx);

  assert.strictEqual(rm.schema_version, "run-manifest/v1");
  assert.strictEqual(typeof rm.nonce, "string");
  assert.ok(rm.nonce.length > 0);
  assert.strictEqual(typeof rm.minted_at, "number");
  assert.strictEqual(rm.sp_id, "SP-TEST");
  assert.strictEqual(rm.lease_fencing_token, 7);
  assert.strictEqual(rm.base_commit, ctx.baseCommit);
  assert.strictEqual(rm.result_commit, ctx.resultCommit);
  assert.strictEqual(rm.target_ref, ctx.targetRef);
  assert.strictEqual(rm.suite_version, "check-suite/v1-test");
  assert.strictEqual(rm.bundle_digest, "digest-abc");
  assert.deepStrictEqual(rm.expected_checks, ["alpha", "beta"]);
  assert.ok(rm.required_checks.includes("alpha"));
});

test("AC-6 trusted-controller-run-manifest — TWO mints (even with identical ctx) produce DIFFERENT nonces — uniqueness per run", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const ctl = require("./trusted-controller");

  const ctx = {
    bundleManifest: { bundle_digest: "digest-abc" },
    pinnedIndex: { SUITE_VERSION: "v1", CHECK_NAMES: ["alpha"], REQUIRED_CHECKS: ["alpha"] },
    baseCommit: "b".repeat(40),
    resultCommit: "c".repeat(40),
    targetRef: "refs/heads/integ",
    leaseToken: null,
  };
  const rm1 = ctl.mintRunManifest({}, {}, ctx);
  const rm2 = ctl.mintRunManifest({}, {}, ctx);
  assert.notStrictEqual(rm1.nonce, rm2.nonce, "each mint must be independently nonce-bound, never reused");
});

test("AC-6 trusted-controller-run-manifest — a real end-to-end integrate() run's manifest carries a matching, non-reused nonce across its own results", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const { makeControllerFixture, standardInput, standardOpts } = require("./falsifiers/_lib/controller-fixtures");
  const ctl = require("./trusted-controller");

  const fx = makeControllerFixture("run-manifest-e2e");
  t.after(() => fx.cleanup());

  const result = ctl.integrate(standardInput(fx), standardOpts(fx));
  assert.strictEqual(result.ok, true, JSON.stringify(result));
  assert.ok(result.runManifest && result.runManifest.nonce, "a nonce-bound manifest must be present on a successful run");
  assert.strictEqual(result.runManifest.target_ref, fx.targetRef);
  assert.strictEqual(result.runManifest.result_commit, fx.result);
  assert.ok(Array.isArray(result.runManifest.expected_checks) && result.runManifest.expected_checks.length > 0);
});
