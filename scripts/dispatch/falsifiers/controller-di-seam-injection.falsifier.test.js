"use strict";
// FALSIFIER: controller-di-seam-injection — record-trust gate Surface 1/4 (SP-20260720-002 Phase 4 R2, S2 /
// BE-CQ-P4-R2-001 + SR-R2-002; the ED-225-227 "trust decided by caller-settable inputs" class).
//
// R1's `trusted-controller.js#integrate(input, opts)` honored NINE whole-predicate override seams supplied
// through the caller's own `opts` object — `hookLivenessCheckFn`, `materializeResultTreeFn`,
// `materializedTreeResolver`, `treeResolver`, `commitResolver`, `ancestryResolver`, `leaseTokenResolver`,
// `checkLibSrcRoot`, `liveHead` — gated ONLY by a docstring saying "test-only". A comment is not a boundary.
// Confirmed repros: `integrate({...}, {gitRoot, hookLivenessCheckFn: () => ({ok:true})})` bypassed the FIX-3
// hook precondition outright; `materializeResultTreeFn` re-opened FIX-1 (substitute the scanned tree);
// `checkLibSrcRoot` pointed lineage at a drifted source; `liveHead` spoofed the CAS TOCTOU head.
//
// MUST-BLOCK: a PRODUCTION-shaped caller passing any of these through `opts` must have it IGNORED — the real
// predicate still runs and still refuses. The companion structural guard
// (controller-di-seam-creep.falsifier.test.js) fails if a new seam is ever added back silently.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");

test("S2 controller-di-seam-injection — `hookLivenessCheckFn: () => ({ok:true})` through production opts MUST NOT bypass the FIX-3 hook precondition", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const { makeControllerFixture, standardInput, standardOpts } = require("./_lib/controller-fixtures");
  const { headSha } = require("./_lib/git-scratch");
  const ctl = require("../trusted-controller");

  // A fixture repo with NO reference-transaction hook installed — the hook-liveness precondition MUST refuse.
  const fx = makeControllerFixture("di-hook-injection", { skipHookInstall: true });
  t.after(() => fx.cleanup());

  // PRECONDITION: without any injection, this repo is genuinely refused (the gate is live).
  const baseline = ctl.integrate(standardInput(fx), standardOpts(fx));
  assert.strictEqual(baseline.ok, false, "PRECONDITION: an un-fenced repo must be refused");
  assert.strictEqual(baseline.reason, "active-hook-not-installed");

  // ATTACK: hand the production entrypoint a whole-predicate override that says "the hook is fine".
  const attack = ctl.integrate(standardInput(fx), standardOpts(fx, { hookLivenessCheckFn: () => ({ ok: true }) }));
  assert.strictEqual(attack.ok, false, "MUST-BLOCK: a caller-injected hook-liveness override must be IGNORED on the production path");
  assert.strictEqual(attack.decision, "BLOCKED");
  assert.strictEqual(attack.reason, "active-hook-not-installed", "the REAL precondition must still be the one that ran");
  assert.strictEqual(headSha(fx.dir, fx.targetRef), fx.base, "the ref must never have advanced");
});

test("S2 controller-di-seam-injection — `materializeResultTreeFn` / `treeResolver` / `materializedTreeResolver` through production opts MUST NOT substitute the scanned tree (FIX-1 stays closed)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const { makeControllerFixture, standardInput, standardOpts } = require("./_lib/controller-fixtures");
  const { headSha } = require("./_lib/git-scratch");
  const ctl = require("../trusted-controller");

  const fx = makeControllerFixture("di-materialize-injection");
  t.after(() => fx.cleanup());

  const poisonedResult = fx.poisonResultCommit();
  const input = standardInput(fx, { result_commit: poisonedResult });

  // ATTACK: substitute a materializer that hands the suite a CLEAN scratch directory instead of the real
  // (poisoned) result tree. If honored, the no-nul-bytes check would never see the poison.
  let injectedCalls = 0;
  const cleanDir = fs.mkdtempSync(path.join(require("os").tmpdir(), "di-clean-substitute-"));
  t.after(() => fs.rmSync(cleanDir, { recursive: true, force: true }));
  const attack = ctl.integrate(
    input,
    standardOpts(fx, {
      materializeResultTreeFn: (rc, o) => {
        injectedCalls++;
        void rc;
        void o;
        return { dir: cleanDir, treeHash: "deadbeef", cleanup() {} };
      },
      treeResolver: () => "deadbeef",
      materializedTreeResolver: () => "deadbeef",
    }),
  );

  assert.strictEqual(injectedCalls, 0, "MUST-BLOCK: the injected materializer must never be CALLED by the production entrypoint");
  assert.strictEqual(attack.ok, false, "MUST-BLOCK: the REAL result tree is poisoned and must still be what gets scanned");
  assert.strictEqual(attack.reason, "check-failed");
  assert.strictEqual(attack.offending, "no-nul-bytes");
  assert.strictEqual(headSha(fx.dir, fx.targetRef), fx.base, "the ref must never have advanced");
});

test("S2 controller-di-seam-injection — `checkLibSrcRoot` through production opts MUST NOT redirect the lineage comparison at a drifted source", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const os = require("os");
  const PCB = require("../pinned-checker-bundle");
  const { makeControllerFixture, standardInput, standardOpts } = require("./_lib/controller-fixtures");
  const { headSha } = require("./_lib/git-scratch");
  const ctl = require("../trusted-controller");

  // A DRIFTED copy of the live check-lib, and a bundle honestly promoted FROM it. Its lineage is internally
  // consistent but does not match the LIVE source — integration must be refused.
  const driftedSrc = fs.mkdtempSync(path.join(os.tmpdir(), "di-drift-src-"));
  const driftedOut = fs.mkdtempSync(path.join(os.tmpdir(), "di-drift-bundle-"));
  const fx = makeControllerFixture("di-checklibsrc-injection");
  t.after(() => {
    fs.rmSync(driftedSrc, { recursive: true, force: true });
    fs.rmSync(driftedOut, { recursive: true, force: true });
    fx.cleanup();
  });
  (function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
      const s = path.join(src, ent.name);
      const d = path.join(dest, ent.name);
      if (ent.isDirectory()) copyDir(s, d);
      else fs.copyFileSync(s, d);
    }
  })(PCB.DEFAULT_LIB_SRC, driftedSrc);
  fs.appendFileSync(path.join(driftedSrc, "checks", "no-nul-bytes.js"), "\n// drifted-fork-content\n");

  const { bundleRoot, manifestPath } = PCB.buildBundle({ srcRoot: driftedSrc, outRoot: driftedOut, promotedBy: "di-seam-test" });

  // ATTACK: point the lineage comparison at the DRIFTED source so the mismatch "goes away".
  const attack = ctl.integrate(
    standardInput(fx),
    standardOpts(fx, { bundleManifestPath: manifestPath, bundleRoot, checkLibSrcRoot: driftedSrc }),
  );
  assert.strictEqual(attack.ok, false, "MUST-BLOCK: a caller-supplied checkLibSrcRoot must be IGNORED — lineage always compares against the LIVE check-lib");
  assert.strictEqual(attack.decision, "BLOCKED");
  assert.strictEqual(attack.reason, "bundle-lineage-mismatch");
  assert.strictEqual(headSha(fx.dir, fx.targetRef), fx.base);
});

test("S2 controller-di-seam-injection — `leaseTokenResolver` / `liveHead` through production opts are DROPPED (an honest run is unaffected by a hostile injection)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const { makeControllerFixture, standardInput, standardOpts } = require("./_lib/controller-fixtures");
  const { headSha } = require("./_lib/git-scratch");
  const ctl = require("../trusted-controller");

  const fx = makeControllerFixture("di-lease-livehead-injection");
  t.after(() => fx.cleanup());

  // If `leaseTokenResolver` were honored, this bogus token would make the run UNAUTHORIZED. If `liveHead`
  // were honored, the CAS would see a moved head and refuse. Both are dropped, so the honest run proceeds —
  // proving the injected seams reached NOTHING (the production path resolved the real lease + real head).
  let injectedLeaseCalls = 0;
  const result = ctl.integrate(
    standardInput(fx),
    standardOpts(fx, {
      leaseTokenResolver: () => {
        injectedLeaseCalls++;
        return 999999;
      },
      liveHead: "f".repeat(40),
    }),
  );
  assert.strictEqual(injectedLeaseCalls, 0, "MUST-BLOCK: the injected lease resolver must never be CALLED");
  assert.strictEqual(result.ok, true, `the honest run must be unaffected by the dropped seams: ${JSON.stringify(result)}`);
  assert.strictEqual(headSha(fx.dir, fx.targetRef), fx.result);

  // And the SANCTIONED test-producer export still drives the seam explicitly — proving the seam WORKS when
  // reached through `integrateForTest`, so the assertions above are about the production BOUNDARY, not a
  // dead seam that never did anything.
  const fx2 = makeControllerFixture("di-lease-livehead-forttest");
  t.after(() => fx2.cleanup());
  const viaTestSeam = ctl.integrateForTest(standardInput(fx2), standardOpts(fx2), { leaseTokenResolver: () => 999999 });
  assert.strictEqual(viaTestSeam.ok, false, "REACHABILITY: the same seam, via integrateForTest, genuinely changes the outcome");
  assert.strictEqual(headSha(fx2.dir, fx2.targetRef), fx2.base);
});
