"use strict";
// FALSIFIER: bundle-lineage-mismatch — record-trust gate Surface 3 (SP-20260720-002 Phase 4 R1, QA-004/
// RT-602/RT-603, FIX-4b, β R2). `promotion.from_src_digest` must be LOAD-BEARING at integrate()-time: a
// pinned bundle promoted from a DRIFTED source (not matching the LIVE check-lib source) must be refused —
// never a dormant, optional CLI-only check (check-lib-single-source.js's own checkLineage). MUST-BLOCK.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PCB = require(path.join(__dirname, "..", "pinned-checker-bundle"));
const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");

/** Copy the REAL check-lib source into a scratch dir, then mutate ONE checker file — a "forked" source
 *  that differs from the live repo's check-lib but is otherwise structurally identical (same registry,
 *  same file layout). */
function makeDriftedSrcRoot() {
  const scratchSrc = fs.mkdtempSync(path.join(os.tmpdir(), "pcb-drift-src-"));
  const liveSrc = PCB.DEFAULT_LIB_SRC;
  function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
      const s = path.join(src, ent.name);
      const d = path.join(dest, ent.name);
      if (ent.isDirectory()) copyDir(s, d);
      else fs.copyFileSync(s, d);
    }
  }
  copyDir(liveSrc, scratchSrc);
  // Mutate a checker file's content — a "drifted fork" of the live source.
  const target = path.join(scratchSrc, "checks", "no-nul-bytes.js");
  fs.appendFileSync(target, "\n// drifted-fork-content\n");
  return scratchSrc;
}

test("FIX-4b bundle-lineage-mismatch — a bundle promoted from a DRIFTED (forked) check-lib source is REFUSED by loadPinnedCheckLib (bundle-lineage-mismatch)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const ctl = require("../trusted-controller");

  const driftedSrc = makeDriftedSrcRoot();
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pcb-drift-bundle-"));
  t.after(() => {
    fs.rmSync(driftedSrc, { recursive: true, force: true });
    fs.rmSync(outRoot, { recursive: true, force: true });
  });

  const { manifest, bundleRoot } = PCB.buildBundle({ srcRoot: driftedSrc, outRoot, promotedBy: "fix4b-drift-test" });
  // The bundle is INTERNALLY consistent — promotion.from_src_digest matches the drifted srcRoot it was
  // ACTUALLY promoted from; the attack is that this no longer matches the LIVE repo's real check-lib.
  assert.ok(manifest.promotion.from_src_digest);
  assert.notStrictEqual(manifest.promotion.from_src_digest, PCB.sourceDigestOf(PCB.DEFAULT_LIB_SRC), "PRECONDITION: the drifted promotion must genuinely differ from the live source digest");

  assert.throws(
    () => ctl.loadPinnedCheckLib(manifest, { bundleRoot }),
    (e) => e.code === "bundle-lineage-mismatch",
  );
});

test("FIX-4b bundle-lineage-mismatch — the SAME drifted bundle REFUSES a full integrate() call before any check ever runs", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const { makeControllerFixture, standardInput, standardOpts } = require("./_lib/controller-fixtures");
  const { headSha } = require("./_lib/git-scratch");
  const ctl = require("../trusted-controller");

  const driftedSrc = makeDriftedSrcRoot();
  const fx = makeControllerFixture("lineage-mismatch-e2e");
  const driftedOutRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pcb-drift-e2e-bundle-"));
  t.after(() => {
    fs.rmSync(driftedSrc, { recursive: true, force: true });
    fs.rmSync(driftedOutRoot, { recursive: true, force: true });
    fx.cleanup();
  });

  const { manifest, bundleRoot, manifestPath } = PCB.buildBundle({ srcRoot: driftedSrc, outRoot: driftedOutRoot, promotedBy: "fix4b-e2e" });
  void manifest;
  void bundleRoot;

  const result = ctl.integrate(standardInput(fx), standardOpts(fx, { bundleManifestPath: manifestPath, bundleRoot }));
  assert.strictEqual(result.ok, false, "MUST-BLOCK: a drifted-source bundle must never authorize an integration");
  assert.strictEqual(result.decision, "BLOCKED");
  assert.strictEqual(result.reason, "bundle-lineage-mismatch");
  assert.strictEqual(headSha(fx.dir, fx.targetRef), fx.base);
});

test("FIX-4b bundle-lineage-mismatch — CONTROL: a bundle promoted from the REAL live check-lib source (the default, no srcRoot override) passes lineage cleanly", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const ctl = require("../trusted-controller");

  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pcb-lineage-control-"));
  t.after(() => fs.rmSync(outRoot, { recursive: true, force: true }));

  const { manifest, bundleRoot } = PCB.buildBundle({ outRoot, promotedBy: "fix4b-control" });
  const pinnedIndex = ctl.loadPinnedCheckLib(manifest, { bundleRoot });
  assert.ok(pinnedIndex && Array.isArray(pinnedIndex.CHECK_NAMES) && pinnedIndex.CHECK_NAMES.length > 0);
});
