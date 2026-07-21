"use strict";
// FALSIFIER: empty-check-set — record-trust gate Surface 3/4 (SP-20260720-002 Phase 4 R1, QA-004/RT-602/
// RT-603, FIX-4c/4d). An empty CHECK_NAMES/REQUIRED_CHECKS registry, or an empty `expected_checks` on a
// run manifest, must NEVER vacuously pass — `mintRunManifest`/`reconcileRunManifest`/check-lib's own
// load-time self-check must all fail-closed on `empty-expected-check-set` / a load-time throw. MUST-BLOCK.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");

test("FIX-4c empty-check-set — check-lib/index.js REFUSES to load with an empty CHECK_NAMES/REQUIRED_CHECKS registry (a scratch copy, never mutating the real repo's check-lib)", (t) => {
  const registryDir = fs.mkdtempSync(require("os").tmpdir() + require("path").sep + "checklib-empty-");
  t.after(() => fs.rmSync(registryDir, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(registryDir, "registry.js"),
    '"use strict";\nmodule.exports = { SUITE_VERSION: "v/empty", CHECK_NAMES: Object.freeze([]), REQUIRED_CHECKS: Object.freeze([]) };\n',
  );
  fs.mkdirSync(path.join(registryDir, "checks"));
  // Build a scratch index.js that mirrors the REAL check-lib/index.js's shape but with the injected empty
  // registry — proving the load-time self-check (FIX-4c) fires regardless of which registry.js is fed in.
  const realIndexSrc = fs.readFileSync(path.join(__dirname, "..", "check-lib", "index.js"), "utf8");
  const scratchIndexSrc = realIndexSrc
    .replace('require("./registry")', 'require("./registry")') // registry require stays relative — same dir
    .replace(
      /const REGISTRY = Object\.freeze\(\{[\s\S]*?\}\);/,
      "const REGISTRY = Object.freeze({});", // no check modules registered — matches the empty CHECK_NAMES
    );
  fs.writeFileSync(path.join(registryDir, "index.js"), scratchIndexSrc);

  assert.throws(() => {
    delete require.cache[require.resolve(path.join(registryDir, "index.js"))];
    delete require.cache[require.resolve(path.join(registryDir, "registry.js"))];
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(path.join(registryDir, "index.js"));
  }, /CHECK_NAMES must be a non-empty array|REQUIRED_CHECKS must be a non-empty array/);
});

test("FIX-4c empty-check-set — CONTROL: the REAL check-lib/index.js loads clean (non-empty CHECK_NAMES/REQUIRED_CHECKS)", () => {
  delete require.cache[require.resolve("../check-lib")];
  const real = require("../check-lib");
  assert.ok(real.CHECK_NAMES.length > 0);
  assert.ok(real.REQUIRED_CHECKS.length > 0);
});

test("FIX-4d empty-check-set — mintRunManifest REFUSES to mint over an empty pinned CHECK_NAMES (empty-expected-check-set)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const ctl = require("../trusted-controller");

  const ctx = {
    bundleManifest: { bundle_digest: "d" },
    pinnedIndex: { SUITE_VERSION: "v", CHECK_NAMES: [], REQUIRED_CHECKS: [] },
    baseCommit: "b".repeat(40),
    resultCommit: "c".repeat(40),
    targetRef: "refs/heads/integ",
    leaseToken: null,
  };
  assert.throws(
    () => ctl.mintRunManifest({}, {}, ctx),
    (e) => e.code === "empty-expected-check-set",
  );
});

test("FIX-4d empty-check-set — reconcileRunManifest REFUSES an otherwise well-formed run manifest whose expected_checks is empty (empty-expected-check-set)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const ctl = require("../trusted-controller");

  const runManifest = {
    schema_version: "run-manifest/v1",
    nonce: "nonce-empty-set",
    minted_at: Date.now(),
    expected_checks: [],
    required_checks: [],
  };
  const out = ctl.reconcileRunManifest(runManifest, []);
  assert.strictEqual(out.ok, false);
  assert.strictEqual(out.reason, "empty-expected-check-set");
});
