"use strict";
// FALSIFIER: AC-15 pinned-bundle-path-symlink — record-trust gate Surface 2 (SP-20260720-002 Phase 4).
// Adversarial: the pinned executable path resolves, via a hostile symlink, into the candidate's own
// writable domain. `resolveExecutable` MUST refuse (exact reason `resolution-outside-candidate`) BEFORE any
// execution — realpath resolution (not the raw string) is what's checked, so the symlink TARGET, not its
// location, is what trips the gate. CONTROL: an equivalent manifest whose pinned executable legitimately
// resolves OUTSIDE candidateRoot succeeds — isolating the symlink-into-candidate as the sole differentiator.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const PCB = require(path.join(__dirname, "..", "pinned-checker-bundle"));

test("AC-15 pinned-bundle-path-symlink MUST-BLOCK a hostile symlink resolving into candidateRoot", (t) => {
  const candidateRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pcb-symlink-cand-"));
  t.after(() => {
    try {
      fs.rmSync(candidateRoot, { recursive: true, force: true });
    } catch {
      /* best-effort cleanup */
    }
  });

  const hostileTarget = path.join(candidateRoot, "hostile-node");
  fs.writeFileSync(hostileTarget, "not a real executable — just needs to exist for realpath to resolve\n");
  const linkPath = path.join(os.tmpdir(), `pcb-evil-node-link-${process.pid}-${Date.now()}`);

  let symlinked = true;
  try {
    fs.symlinkSync(hostileTarget, linkPath);
  } catch {
    symlinked = false;
  }
  t.after(() => {
    try {
      fs.unlinkSync(linkPath);
    } catch {
      /* best-effort cleanup, may not exist if symlink creation failed */
    }
  });
  if (!symlinked) {
    return t.skip("symlink creation not permitted in this environment (Windows Developer Mode / admin required) — falsifier RED pending environment capability");
  }

  const manifest = {
    schema_version: "checker-bundle/v1",
    suite_version: "n/a",
    bundle_digest: "n/a",
    files: {},
    executables: { node: linkPath },
    config: {},
  };

  // Sanity: the symlink really does resolve into candidateRoot (the attack is real, not a no-op).
  assert.strictEqual(fs.realpathSync(linkPath), fs.realpathSync(hostileTarget));

  // ATTACK: the pinned executable is a symlink whose REALPATH resolves inside candidateRoot.
  let thrown = null;
  try {
    PCB.resolveExecutable(manifest, "node", { candidateRoot });
  } catch (e) {
    thrown = e;
  }
  assert.ok(thrown, "MUST-BLOCK: resolveExecutable must refuse a symlink that realpath-resolves inside candidateRoot");
  assert.strictEqual(thrown.code, "resolution-outside-candidate", "the exact reason code must be resolution-outside-candidate");

  // CONTROL: the SAME shape, but the pinned executable is the real, legitimate node binary (outside
  // candidateRoot) — resolves cleanly, proving the symlink-into-candidate was the sole differentiator.
  const cleanManifest = { ...manifest, executables: { node: process.execPath } };
  const resolved = PCB.resolveExecutable(cleanManifest, "node", { candidateRoot });
  assert.strictEqual(resolved, fs.realpathSync(process.execPath));
});
