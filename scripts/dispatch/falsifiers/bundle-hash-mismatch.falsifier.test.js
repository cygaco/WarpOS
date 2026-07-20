"use strict";
// FALSIFIER: AC-13 bundle-hash-mismatch — record-trust gate Surface 2 (SP-20260720-002 Phase 4).
// Adversarial: a pinned file's on-disk bytes are tampered AFTER promotion (supply-chain / stale-cache
// tamper). Integration MUST-BLOCK before any check executes (reason `bundle-pin-mismatch`), naming the
// exact tampered path. CONTROL: a fresh, untampered bundle verifies + executes cleanly — isolating the
// on-disk tamper as the sole differentiator (Phase-3 shape: full-valid context REACHES the gate, then ONE
// variable is attacked).
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const PCB = require(path.join(__dirname, "..", "pinned-checker-bundle"));

test("AC-13 bundle-hash-mismatch MUST-BLOCK before execution when a pinned file's on-disk hash != the promoted pin", (t) => {
  const bundleRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pcb-bhm-bundle-"));
  const candidateRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pcb-bhm-cand-"));
  t.after(() => {
    for (const d of [bundleRoot, candidateRoot]) {
      try {
        fs.rmSync(d, { recursive: true, force: true });
      } catch {
        /* best-effort cleanup */
      }
    }
  });

  const { manifest } = PCB.buildBundle({ outRoot: bundleRoot, promotedBy: "falsifier-test" });

  // Full-valid context first: prove the untampered bundle actually verifies (the gate is REACHED).
  const preAttackVerify = PCB.verifyBundle(manifest, { bundleRoot });
  assert.strictEqual(preAttackVerify.ok, true, "precondition: the freshly-built bundle must verify clean before we attack it");

  // ATTACK: tamper with ONE pinned file's on-disk bytes AFTER promotion.
  const tamperedRel = Object.keys(manifest.files).find((k) => k.endsWith("index.js"));
  assert.ok(tamperedRel, "precondition: the bundle must contain a pinned index.js to tamper with");
  fs.appendFileSync(path.join(bundleRoot, tamperedRel), "\n// tampered-after-promotion\n");

  const attack = PCB.runPinnedSuite(manifest, {}, { bundleRoot, candidateRoot });
  assert.strictEqual(attack.ok, false, "MUST-BLOCK: a tampered pinned file must refuse the run");
  assert.strictEqual(attack.reason, "bundle-pin-mismatch");
  assert.strictEqual(attack.results.length, 0, "BLOCK BEFORE execute — zero checks may run over a mismatched bundle");
  assert.ok(
    attack.mismatches.some((m) => m.path === tamperedRel && m.reason === "hash-mismatch"),
    "the exact tampered file must be named in the mismatch report",
  );

  // CONTROL: a SEPARATE, untampered bundle passes verify and executes — isolating the tamper.
  const bundleRoot2 = fs.mkdtempSync(path.join(os.tmpdir(), "pcb-bhm-bundle2-"));
  t.after(() => {
    try {
      fs.rmSync(bundleRoot2, { recursive: true, force: true });
    } catch {
      /* best-effort cleanup */
    }
  });
  const built2 = PCB.buildBundle({ outRoot: bundleRoot2, promotedBy: "falsifier-test" });
  const control = PCB.runPinnedSuite(built2.manifest, {}, { bundleRoot: bundleRoot2, candidateRoot });
  assert.strictEqual(control.ok, true, "CONTROL: an untampered bundle must verify+execute cleanly");
  assert.ok(control.results.length > 0, "CONTROL: checks must actually have RUN");
});
