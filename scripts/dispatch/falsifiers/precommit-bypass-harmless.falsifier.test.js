"use strict";
// FALSIFIER: G4.4 precommit-bypass-harmless — record-trust gate Surface 1 (SP-20260720-002 Phase 4,
// AC-12). Proves the BOUNDARY is the controller (Seam A/E), not pre-commit: a candidate created with
// `git commit --no-verify` — skipping BOTH pre-commit-steps-check.js and pre-commit-check-lib.js entirely,
// including a NUL-byte poisoned file that pre-commit-check-lib.js's check-lib pass would have flagged —
// still CANNOT integrate into main without (a) surviving the reference-transaction fence (Seam E, which
// `--no-verify` does NOT bypass — probe-confirmed) and (b) a brand-new trusted-controller AcceptanceRecord
// (Seam A) whose OWN fresh pinned run genuinely re-checks the tree. MUST-BLOCK on both fronts.
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const HOOK = path.join(__dirname, "..", "..", "hooks", "protected-ref-transaction.js");
const CONTROLLER = path.join(__dirname, "..", "trusted-controller.js");
const PRECOMMIT_CHECKLIB = path.join(__dirname, "..", "..", "hooks", "pre-commit-check-lib.js");

test("G4.4 precommit-bypass-harmless — a --no-verify candidate (skipping pre-commit-check-lib.js) still cannot land on main without the controller", (t) => {
  if (!fs.existsSync(HOOK)) return t.skip("pending backend-builder — protected-ref-transaction hook not yet built (falsifier RED)");
  if (!fs.existsSync(CONTROLLER)) return t.skip("pending backend-builder — controller not yet built (falsifier RED)");
  if (!fs.existsSync(PRECOMMIT_CHECKLIB)) return t.skip("pending backend-builder — pre-commit-check-lib.js not yet built (falsifier RED)");

  const { git, makeScratchRepo, installHook, headSha, noFenceEnv, rmrf } = require("./_lib/git-scratch");
  const { runCheckLibSuite } = require("../../hooks/pre-commit-check-lib");

  const dir = makeScratchRepo("precommit-bypass");
  installHook(dir);
  t.after(() => rmrf(dir));

  git(dir, ["checkout", "-q", "-b", "cand"], { env: noFenceEnv() });
  // Write a NUL-byte-poisoned file that pre-commit-check-lib.js's OWN required check would flag.
  const poisonedRel = "scripts/checks/precommit-bypass-poison.js";
  fs.mkdirSync(path.join(dir, "scripts", "checks"), { recursive: true });
  fs.writeFileSync(path.join(dir, poisonedRel), Buffer.from([0x2f, 0x2f, 0x00, 0x0a])); // "//\0\n"
  git(dir, ["add", "."]);

  // PROOF (a): a NORMAL (non --no-verify) local check-lib pass over this exact tree WOULD flag it —
  // establishing that this is a real, non-trivial poison, not a no-op fixture.
  const localCheck = runCheckLibSuite({ root: dir });
  assert.strictEqual(localCheck.blocked, true, "the poisoned file must genuinely trip local check-lib feedback (a real, non-trivial poison)");

  // The candidate commit itself uses --no-verify (skips pre-commit entirely, poison and all) — this is a
  // NON-protected ref (side branch), so it succeeds regardless of any hook.
  const commitRes = git(dir, ["commit", "-q", "-m", "poisoned candidate", "--no-verify"], { env: noFenceEnv() });
  assert.strictEqual(commitRes.status, 0, "the --no-verify candidate commit itself succeeds (a side branch, not main)");
  const candidate = headSha(dir);

  // ATTACK 1 (Seam E): an un-brokered direct update-ref of main to this --no-verify candidate. --no-verify
  // does NOT touch the reference-transaction hook (a DIFFERENT hook class) — still refused.
  const before = headSha(dir, "refs/heads/main");
  const attack1 = git(dir, ["update-ref", "refs/heads/main", candidate], { env: noFenceEnv() });
  assert.notStrictEqual(attack1.status, 0, "MUST-BLOCK: --no-verify does not bypass the reference-transaction fence (Seam E)");
  assert.strictEqual(headSha(dir, "refs/heads/main"), before);

  // ATTACK 2 (Seam A): even with a properly-brokered fence, the CONTROLLER's OWN fresh pinned run must
  // re-check this exact poisoned tree — a --no-verify commit proves nothing to the controller, which never
  // even looks at whether pre-commit ran. Uses the SAME controller machinery every other falsifier does.
  const { makeControllerFixture, standardInput, standardOpts } = require("./_lib/controller-fixtures");
  const ctl = require("../trusted-controller");
  const fx = makeControllerFixture("precommit-bypass-ctl");
  t.after(() => fx.cleanup());
  // Point the controller's result_commit at the REAL poisoned candidate in the SAME repo (fx.dir === a
  // different scratch repo than `dir` — rebuild the poison inside fx.dir's own candidate so the controller
  // recomputes over the identical adversarial content).
  fs.mkdirSync(path.join(fx.dir, "scripts", "checks"), { recursive: true });
  fs.writeFileSync(path.join(fx.dir, poisonedRel), Buffer.from([0x2f, 0x2f, 0x00, 0x0a]));
  git(fx.dir, ["add", "."]);
  git(fx.dir, ["commit", "-q", "-m", "poisoned candidate", "--no-verify"], { env: noFenceEnv() });
  const poisonedResult = headSha(fx.dir);

  // FIX-1 (QA-003/RT-601): the controller materializes + scans the REAL result_commit tree — the poison
  // committed above (into fx.dir, the real result_commit) is picked up naturally, no ctx override needed.
  const ctlResult = ctl.integrate(standardInput(fx, { result_commit: poisonedResult }), standardOpts(fx));
  assert.strictEqual(ctlResult.ok, false, "MUST-BLOCK: the controller's OWN fresh pinned run must re-derive and catch the poison — a --no-verify commit authorizes NOTHING");
  assert.strictEqual(ctlResult.decision, "BLOCKED");
  assert.strictEqual(ctlResult.reason, "check-failed");
  assert.strictEqual(ctlResult.offending, "no-nul-bytes");
});
