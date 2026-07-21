"use strict";
// FALSIFIER: result-tree-materialization — record-trust gate Surface 1 (SP-20260720-002 Phase 4 R1,
// QA-003/RT-601, FIX-1). The controller must scan EXACTLY result_commit's tree, materialized into a
// trusted, OUT-of-candidate path — NEVER `gitRoot` (the caller's mutable working tree, which may not even
// be checked out at result_commit at all). Adversarial: gitRoot's WORKING TREE is clean-at-base (checked
// out at fx.base, containing no NUL-byte file), but result_commit — a REAL commit the working tree is NOT
// currently checked out to — has a NUL-byte-poisoned file in its tree. MUST-BLOCK: the no-nul-bytes check
// must fire against the MATERIALIZED result tree and fail, proving the scan target is the real
// result_commit tree, not whatever gitRoot's working directory happens to contain right now.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");

const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");

test("FIX-1 result-tree-materialization — gitRoot's working tree is clean-at-base, but result_commit's REAL tree is poisoned -> integration REFUSED (no-nul-bytes fires over the MATERIALIZED tree)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const { makeControllerFixture, standardInput, standardOpts } = require("./_lib/controller-fixtures");
  const { headSha } = require("./_lib/git-scratch");
  const ctl = require("../trusted-controller");

  const fx = makeControllerFixture("materialization-poison");
  t.after(() => fx.cleanup());

  const poisonedResult = fx.poisonResultCommit();

  // ADVERSARIAL SETUP: check the working tree back out at fx.base — gitRoot's ON-DISK files are now the
  // CLEAN base content, containing NO poison at all. If the controller (incorrectly) scanned `gitRoot`'s
  // working tree instead of a materialized result_commit checkout, this run would read CLEAN and integrate.
  const sh = (cmd, args) => execFileSync(cmd, args, { cwd: fx.dir, encoding: "utf8", windowsHide: true }).trim();
  sh("git", ["checkout", "-q", "trunk"]); // trunk currently sits at fx.result's ancestor line; force it to fx.base
  sh("git", ["reset", "-q", "--hard", fx.base]);
  assert.strictEqual(fs.readFileSync(path.join(fx.dir, "f.txt"), "utf8").trim(), "base", "PRECONDITION: gitRoot's working tree is genuinely clean-at-base");
  assert.ok(!fs.existsSync(path.join(fx.dir, "scripts", "checks", "poison.js")), "PRECONDITION: the poison file does not exist in gitRoot's CURRENT working tree");

  const input = standardInput(fx, { result_commit: poisonedResult });
  const result = ctl.integrate(input, standardOpts(fx));

  assert.strictEqual(result.ok, false, "MUST-BLOCK: the REAL result_commit tree is poisoned, regardless of what gitRoot's working directory currently shows");
  assert.strictEqual(result.decision, "BLOCKED");
  assert.strictEqual(result.reason, "check-failed");
  assert.strictEqual(result.offending, "no-nul-bytes");

  assert.strictEqual(headSha(fx.dir, fx.targetRef), fx.base, "the ref must never have advanced");
});

test("FIX-1 result-tree-materialization — CONTROL: the same clean-at-base working tree with a CLEAN result_commit integrates normally (proves the block above is about the poison, not an incidental side effect of the working-tree state)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const { makeControllerFixture, standardInput, standardOpts } = require("./_lib/controller-fixtures");
  const { headSha } = require("./_lib/git-scratch");
  const ctl = require("../trusted-controller");

  const fx = makeControllerFixture("materialization-control");
  t.after(() => fx.cleanup());

  const sh = (cmd, args) => execFileSync(cmd, args, { cwd: fx.dir, encoding: "utf8", windowsHide: true }).trim();
  sh("git", ["checkout", "-q", "trunk"]);
  sh("git", ["reset", "-q", "--hard", fx.base]);

  const result = ctl.integrate(standardInput(fx), standardOpts(fx));
  assert.strictEqual(result.ok, true, JSON.stringify(result));
  assert.strictEqual(headSha(fx.dir, fx.targetRef), fx.result);
});
