"use strict";
// FALSIFIER: reftxn-hook-not-installed — record-trust gate Surface 1 (SP-20260720-002 Phase 4 R1, QA-001/
// RT-604, FIX-3). Hook installation/activation is now a FAIL-CLOSED PRECONDITION of integration: this
// exercises the repo's ACTUAL configured `reference-transaction` hook path (via
// `verifyActiveHookInstalled`/`git rev-parse --git-path hooks`), not a manually-installed scratch hook. An
// absent/wrong active hook REFUSES integration. MUST-BLOCK.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");

test("FIX-3 reftxn-hook-not-installed — a fixture repo WITHOUT the active reference-transaction hook installed REFUSES integration (active-hook-not-installed)", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const { makeControllerFixture, standardInput, standardOpts } = require("./_lib/controller-fixtures");
  const { headSha } = require("./_lib/git-scratch");
  const ctl = require("../trusted-controller");

  const fx = makeControllerFixture("hook-not-installed", { skipHookInstall: true });
  t.after(() => fx.cleanup());

  const result = ctl.integrate(standardInput(fx), standardOpts(fx));
  assert.strictEqual(result.ok, false, "MUST-BLOCK: an un-fenced repo must never integrate, even with an otherwise-valid record");
  assert.strictEqual(result.decision, "BLOCKED");
  assert.strictEqual(result.reason, "active-hook-not-installed");
  assert.strictEqual(headSha(fx.dir, fx.targetRef), fx.base, "the ref must never have advanced");
});

test("FIX-3 reftxn-hook-not-installed — verifyActiveHookInstalled resolves the ACTUAL active hooks dir via `git rev-parse --git-path hooks` (never a hardcoded .git/hooks guess) — proven by a repo with core.hooksPath REDIRECTED to a DIFFERENT (also-unpopulated) directory still reporting the SAME failure reason at the REDIRECTED path", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const { makeControllerFixture } = require("./_lib/controller-fixtures");
  const { execFileSync } = require("child_process");
  const os = require("os");
  const ctl = require("../trusted-controller");

  const fx = makeControllerFixture("hook-redirected-hooks-path", { skipHookInstall: true });
  t.after(() => fx.cleanup());

  const altHooksDir = fs.mkdtempSync(path.join(os.tmpdir(), "sp002-althooks-"));
  execFileSync("git", ["config", "core.hooksPath", altHooksDir], { cwd: fx.dir, encoding: "utf8", windowsHide: true });
  t.after(() => fs.rmSync(altHooksDir, { recursive: true, force: true }));

  const check = ctl.verifyActiveHookInstalled({ gitRoot: fx.dir });
  assert.strictEqual(check.ok, false);
  assert.strictEqual(check.reason, "active-hook-not-installed");
  assert.strictEqual(path.resolve(check.hooksDir), path.resolve(altHooksDir), "the resolved hooksDir must be the REDIRECTED core.hooksPath, not a hardcoded .git/hooks guess");
});

test("FIX-3 reftxn-hook-not-installed — CONTROL: a fixture repo WITH the hook installed (the default) passes the precondition and proceeds to integrate", (t) => {
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built");
  const { makeControllerFixture, standardInput, standardOpts } = require("./_lib/controller-fixtures");
  const ctl = require("../trusted-controller");

  const fx = makeControllerFixture("hook-installed-control");
  t.after(() => fx.cleanup());

  const check = ctl.verifyActiveHookInstalled({ gitRoot: fx.dir });
  assert.strictEqual(check.ok, true, JSON.stringify(check));

  const result = ctl.integrate(standardInput(fx), standardOpts(fx));
  assert.strictEqual(result.ok, true, JSON.stringify(result));
});
