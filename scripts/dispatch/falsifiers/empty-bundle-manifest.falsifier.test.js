"use strict";
// FALSIFIER: empty-bundle-manifest — record-trust gate Surface 2/3 (SP-20260720-002 Phase 4 R1, QA-004/
// RT-602/RT-603, FIX-4a). An empty or self-authored external `files:{}` manifest must never be accepted as
// a "verified" pin — `verifyBundle` alone would trivially report ok:true (zero mismatches over zero
// entries). `loadBundleManifest` and `runPinnedSuite`/`loadPinnedCheckLib` must REFUSE it. MUST-BLOCK.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PCB = require(path.join(__dirname, "..", "pinned-checker-bundle"));
const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");

test("FIX-4a empty-bundle-manifest — loadBundleManifest REFUSES an empty-files self-authored manifest (fail-closed at the loader)", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pcb-empty-mf-"));
  try {
    const manifestPath = path.join(outRoot, "manifest.json");
    // Self-authored, internally "consistent" (its own bundle_digest matches ITS OWN empty files map) — the
    // exact attack QA-004 named: consistency is not completeness.
    const files = {};
    const executables = { node: process.execPath };
    const config = {};
    const crypto = require("crypto");
    const digest = crypto.createHash("sha256").update(JSON.stringify({ files, executables, config })).digest("hex");
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({ schema_version: "checker-bundle/v1", bundle_digest: digest, files, executables, config }),
    );
    assert.throws(() => PCB.loadBundleManifest(manifestPath), /EMPTY|empty/);
  } finally {
    fs.rmSync(outRoot, { recursive: true, force: true });
  }
});

test("FIX-4a empty-bundle-manifest — runPinnedSuite REFUSES an in-memory manifest missing lib/checks/*.js entries even though lib/index.js + lib/registry.js are present (incomplete, not just empty)", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pcb-incomplete-mf-"));
  const candidateRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pcb-incomplete-cand-"));
  try {
    const { manifest, bundleRoot } = PCB.buildBundle({ outRoot, promotedBy: "fix4a-test" });
    // Attack: hand-edit the promoted manifest's `files` map to DROP every lib/checks/*.js entry (as if a
    // self-authored manifest never pinned the actual checker modules) — the on-disk files are untouched, so
    // a naive hash-only verify over the SHRUNK map would still trivially pass.
    const shrunk = { ...manifest, files: {} };
    for (const [rel, hash] of Object.entries(manifest.files)) {
      if (rel === "lib/index.js" || rel === "lib/registry.js") shrunk.files[rel] = hash;
    }
    const crypto = require("crypto");
    const sortObj = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
    shrunk.bundle_digest = crypto.createHash("sha256").update(JSON.stringify({ files: sortObj(shrunk.files), executables: shrunk.executables, config: shrunk.config })).digest("hex");

    const res = PCB.runPinnedSuite(shrunk, {}, { bundleRoot, candidateRoot });
    assert.strictEqual(res.ok, false, "MUST-BLOCK: a manifest missing checker modules must be refused even though its OWN (shrunk) hash is internally consistent");
    assert.strictEqual(res.reason, "incomplete-bundle-manifest");
    assert.ok(res.missing.some((m) => m.startsWith("lib/checks/")), JSON.stringify(res.missing));
  } finally {
    fs.rmSync(outRoot, { recursive: true, force: true });
    fs.rmSync(candidateRoot, { recursive: true, force: true });
  }
});

test("FIX-4a empty-bundle-manifest — CONTROL: the real, fully-promoted bundle is complete (assertBundleCompleteness ok:true)", () => {
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pcb-complete-control-"));
  try {
    const { manifest, bundleRoot } = PCB.buildBundle({ outRoot, promotedBy: "fix4a-control" });
    const res = PCB.assertBundleCompleteness(manifest, { bundleRoot });
    assert.strictEqual(res.ok, true, JSON.stringify(res.missing));
  } finally {
    fs.rmSync(outRoot, { recursive: true, force: true });
  }
});

test("FIX-4a empty-bundle-manifest — the CONTROLLER's own loadPinnedCheckLib refuses an incomplete manifest before the pinned suite ever runs", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const ctl = require("../trusted-controller");
  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pcb-controller-incomplete-"));
  try {
    const { manifest, bundleRoot } = PCB.buildBundle({ outRoot, promotedBy: "fix4a-controller" });
    const shrunk = { ...manifest, files: { "lib/index.js": manifest.files["lib/index.js"] } };
    const crypto = require("crypto");
    const sortObj = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
    shrunk.bundle_digest = crypto.createHash("sha256").update(JSON.stringify({ files: sortObj(shrunk.files), executables: shrunk.executables, config: shrunk.config })).digest("hex");

    assert.throws(
      () => ctl.loadPinnedCheckLib(shrunk, { bundleRoot }),
      (e) => e.code === "incomplete-bundle-manifest",
    );
  } finally {
    fs.rmSync(outRoot, { recursive: true, force: true });
  }
});
