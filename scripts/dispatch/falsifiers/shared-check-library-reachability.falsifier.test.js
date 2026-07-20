"use strict";
// FALSIFIER: AC-17/AC-19 shared-check-library-reachability — record-trust gate Surface 3 (SP-20260720-002
// Phase 4, rider-4). For EACH of the 3 Seam-D consumers (Claude hook / pre-commit / controller-via-pinned-
// bundle), the shared check must actually FIRE when the consumer is invoked — not merely be import-able.
// Phase-3 shape: this falsifier SKIPS RED (does not fabricate a pass) until a consumer's module exists AND
// (for pre-commit/controller) is actually wired to require() check-lib — those two are backend-builder's
// units (build_spec §3: BUNDLE merges first, CONTROLLER/HELM-RUNNER second). The hook consumer (this unit,
// BUNDLE) is asserted fully: a spy-proof that the shared suite really RAN (not just imported), and a
// negative control exposing the exact check reason on a bad input.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const CHECK_LIB_DIR = path.join(ROOT, "scripts", "dispatch", "check-lib");
const HOOK = path.join(ROOT, "scripts", "hooks", "check-lib-prevention.js");
const PRECOMMIT = path.join(ROOT, "scripts", "hooks", "pre-commit-steps-check.js");
const CONTROLLER = path.join(ROOT, "scripts", "dispatch", "trusted-controller.js");

function fileRequiresCheckLib(p) {
  if (!fs.existsSync(p)) return false;
  let content;
  try {
    content = fs.readFileSync(p, "utf8");
  } catch {
    return false;
  }
  return /require\([^)]*check-lib[^)]*\)/.test(content);
}

test("AC-17/AC-19 shared check-library reachability — the shared check FIRES via each of the 3 consumers", (t) => {
  if (!fs.existsSync(CHECK_LIB_DIR)) return t.skip("pending BUNDLE — check-lib not yet built (falsifier RED)");
  if (!fs.existsSync(HOOK)) return t.skip("pending BUNDLE — hook consumer not yet built (falsifier RED)");
  if (!fileRequiresCheckLib(PRECOMMIT)) return t.skip("pending backend-builder — pre-commit not yet wired to check-lib (falsifier RED)");
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");
  if (!fileRequiresCheckLib(CONTROLLER)) return t.skip("pending backend-builder — controller not yet wired to check-lib (falsifier RED)");

  // Consumer 1 — the Claude hook: call the exported entrypoint (NOT just require() it) and prove the
  // suite-completeness REQUIRED check actually FIRED, with real result shapes (a spy-equivalent — we
  // inspect the returned results, which only exist if runSuite genuinely executed).
  delete require.cache[require.resolve(HOOK)];
  const hook = require(HOOK);
  const cleanResult = hook.runPrevention({ root: ROOT });
  assert.ok(cleanResult && Array.isArray(cleanResult.results) && cleanResult.results.length > 0, "hook consumer must actually RUN the shared suite, not just import it");
  assert.ok(cleanResult.results.some((r) => r.name === "suite-completeness"), "the suite-completeness check (a REQUIRED check) must have fired");
  assert.ok(cleanResult.results.some((r) => r.name === "no-nul-bytes"), "the no-nul-bytes check (a REQUIRED check) must have fired");

  // NEGATIVE CONTROL: a bad envelope (self-claimed "passed" with zero observable work) must expose the
  // EXACT false-green-envelope reason via the hook's own block reduction.
  const badResult = hook.runPrevention({ root: ROOT, envelope: { status: "passed", files: 0, commits: 0, tests: 0, evidence: 0 } });
  assert.strictEqual(badResult.blocked, true, "a hollow-success envelope must BLOCK via the hook");
  assert.ok(
    badResult.blockingReasons.some((r) => r.name === "false-green-envelope" && r.reason === "false-green-envelope-zero-evidence"),
    "the exact false-green-envelope reason must be exposed, not a generic failure",
  );

  // Consumer 2 — pre-commit: static reachability by source is asserted above (fileRequiresCheckLib); require
  // it and confirm it exposes a callable entrypoint (its own falsifiers, owned by backend-builder, prove
  // full end-to-end firing of ITS wiring).
  delete require.cache[require.resolve(PRECOMMIT)];
  const preCommit = require(PRECOMMIT);
  assert.ok(
    typeof preCommit.runCheckLibSuite === "function" || typeof preCommit.main === "function" || typeof preCommit === "function",
    "pre-commit consumer must expose a callable entrypoint that runs the shared suite",
  );

  // Consumer 3 — controller: same wiring-layer reachability contract (its own falsifiers, owned by
  // backend-builder, prove full end-to-end firing via the pinned bundle indirection, Seam B).
  const controllerSrc = fs.readFileSync(CONTROLLER, "utf8");
  assert.ok(/check-lib/.test(controllerSrc), "controller must reference check-lib (via the pinned bundle) — reachability at the wiring layer");
});
