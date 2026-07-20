"use strict";
// POSITIVE COMPANION: unbrokered-merge-bypass.falsifier.test.js (SP-20260720-002 Phase 4, AC-10). The SAME
// direct `git update-ref` on refs/heads/main, this time carrying a CURRENT, valid controller fence (the
// exact scoped env vars trusted-controller.js#withControllerFence sets around its own commitIntegration
// call) — succeeds. Proves the refusal above is about the FENCE, not a hook that blocks main unconditionally.
const test = require("node:test");
const assert = require("node:assert");
const os = require("os");
const path = require("path");
const fs = require("fs");

const HOOK = path.join(__dirname, "..", "..", "hooks", "protected-ref-transaction.js");

test("brokered-merge POSITIVE — the SAME direct update-ref on main, carrying a current controller fence, succeeds (CAS ok)", (t) => {
  if (!fs.existsSync(HOOK)) return t.skip("pending backend-builder — protected-ref-transaction hook not yet built (falsifier RED)");

  const { git, makeScratchRepo, installHook, headSha, fenceEnv, noFenceEnv, rmrf } = require("./_lib/git-scratch");
  const lease = require("../conductor-lease");

  const dir = makeScratchRepo("brokered");
  installHook(dir);
  t.after(() => rmrf(dir));

  git(dir, ["checkout", "-q", "-b", "candidate"], { env: noFenceEnv() });
  fs.writeFileSync(path.join(dir, "candidate.txt"), "brokered write\n");
  git(dir, ["add", "."]);
  git(dir, ["commit", "-q", "-m", "candidate on a side ref"], { env: noFenceEnv() });
  const candidate = headSha(dir);

  const leaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), "sp002-brokered-lease-"));
  const spId = "SP-BROKERED-POSITIVE";
  const acquired = lease.acquire(spId, { root: leaseRoot, sessionId: "brokered" });
  t.after(() => rmrf(leaseRoot));

  const result = git(dir, ["update-ref", "refs/heads/main", candidate], { env: fenceEnv(spId, acquired.token, leaseRoot, noFenceEnv()) });

  assert.strictEqual(result.status, 0, "a FENCED direct update-ref on main must succeed — " + result.stderr);
  assert.strictEqual(headSha(dir, "refs/heads/main"), candidate, "refs/heads/main must now point at the candidate");
});
