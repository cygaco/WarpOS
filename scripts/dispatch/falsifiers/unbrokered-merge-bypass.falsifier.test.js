"use strict";
// FALSIFIER: G4.4 unbrokered-merge-bypass — record-trust gate Surface 1 (SP-20260720-002 Phase 4, AC-10).
// Adversarial: a normal, DIRECT `git update-ref` on the protected ref (refs/heads/main), performed WITHOUT
// going through trusted-controller.js at all. The sole-route MECHANISM (Seam E, `reference-transaction`
// hook) must refuse it. MUST-BLOCK. Positive companion: brokered-merge.positive.test.js (the SAME tree,
// fenced, succeeds).
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const HOOK = path.join(__dirname, "..", "..", "hooks", "protected-ref-transaction.js");

test("G4.4 unbrokered-merge-bypass — a direct `git update-ref` on refs/heads/main with NO controller fence is REFUSED", (t) => {
  if (!fs.existsSync(HOOK)) return t.skip("pending backend-builder — protected-ref-transaction hook not yet built (falsifier RED)");

  const { git, makeScratchRepo, installHook, headSha, noFenceEnv, rmrf } = require("./_lib/git-scratch");

  const dir = makeScratchRepo("unbrokered");
  installHook(dir);
  t.after(() => rmrf(dir));

  const before = headSha(dir, "refs/heads/main");

  // Build the candidate commit on a NON-protected side branch first (committing there needs no fence at
  // all — only refs/heads/main is protected) so the attack below is a CLEAN direct write of an
  // already-built candidate onto main, not conflated with the (also-refused) act of committing on main.
  const co = git(dir, ["checkout", "-q", "-b", "candidate"], { env: noFenceEnv() });
  assert.strictEqual(co.status, 0, "checking out a side branch must succeed (not a protected ref)");
  fs.writeFileSync(path.join(dir, "candidate.txt"), "un-brokered write\n");
  git(dir, ["add", "."]);
  const commitRes = git(dir, ["commit", "-q", "-m", "candidate on a side ref"], { env: noFenceEnv() });
  assert.strictEqual(commitRes.status, 0, "the candidate commit itself (on the SIDE branch, not main) must succeed");
  const candidate = headSha(dir); // HEAD now == the new candidate commit, but main hasn't moved

  // ATTACK: a direct, un-brokered write of main to the candidate — no fence env vars set at all.
  const attack = git(dir, ["update-ref", "refs/heads/main", candidate], { env: noFenceEnv() });

  assert.notStrictEqual(attack.status, 0, "MUST-BLOCK: an un-brokered update-ref on refs/heads/main must be REFUSED (exit non-zero)");
  assert.match(attack.stderr, /reference-transaction hook|REFUSED|no-current-controller-fence/i, "the hook's own refusal must be surfaced");

  const after = headSha(dir, "refs/heads/main");
  assert.strictEqual(after, before, "MUST-BLOCK: refs/heads/main must be UNCHANGED after the refused attack");
});
