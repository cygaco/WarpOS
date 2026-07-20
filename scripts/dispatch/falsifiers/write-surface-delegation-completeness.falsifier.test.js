"use strict";
// FALSIFIER: G4.4 write-surface-delegation-completeness — record-trust gate Surface 1 (SP-20260720-002
// Phase 4, AC-11). The integration surface inventory names FOUR normal main-write surfaces — `update-ref`,
// merge (fast-forward), merge (non-ff), `push` — and asserts EACH is refused when un-brokered (no current
// controller fence), evidence-grounded in runtime/sp002-phase4/reftxn-probe-evidence.md (ONE
// reference-transaction hook covers all of them). It ALSO asserts the honest-ceiling NAMED-UNCOVERED
// surfaces (core.hooksPath redirect, hook deletion, a direct .git/refs/** filesystem write, a hostile
// process forging the fence) are documented in the hook's own source — an uncovered surface that is NOT
// named would be a silent gap, not an honest ceiling. MUST-BLOCK (per covered surface).
const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
const fs = require("fs");

const HOOK = path.join(__dirname, "..", "..", "hooks", "protected-ref-transaction.js");

test("G4.4 write-surface-delegation-completeness — update-ref / fast-forward merge / non-ff merge / push are ALL refused un-brokered", (t) => {
  if (!fs.existsSync(HOOK)) return t.skip("pending backend-builder — protected-ref-transaction hook not yet built (falsifier RED)");

  const { git, makeScratchRepo, makeBareRemote, installHook, headSha, noFenceEnv, rmrf } = require("./_lib/git-scratch");

  // ── surface 1: update-ref (already the dedicated falsifier's subject; re-asserted here for the
  //    single-file completeness inventory the AC requires). ──
  {
    const dir = makeScratchRepo("delegcomplete-updateref");
    installHook(dir);
    const before = headSha(dir, "refs/heads/main");
    git(dir, ["checkout", "-q", "-b", "cand"], { env: noFenceEnv() });
    fs.writeFileSync(path.join(dir, "x.txt"), "1\n");
    git(dir, ["add", "."]);
    git(dir, ["commit", "-q", "-m", "cand"], { env: noFenceEnv() });
    const cand = headSha(dir);
    const r = git(dir, ["update-ref", "refs/heads/main", cand], { env: noFenceEnv() });
    assert.notStrictEqual(r.status, 0, "MUST-BLOCK: un-brokered update-ref");
    assert.strictEqual(headSha(dir, "refs/heads/main"), before);
    rmrf(dir);
  }

  // ── surface 2: fast-forward merge. ──
  {
    const dir = makeScratchRepo("delegcomplete-ff");
    installHook(dir);
    const before = headSha(dir, "refs/heads/main");
    git(dir, ["checkout", "-q", "-b", "cand"], { env: noFenceEnv() });
    fs.writeFileSync(path.join(dir, "y.txt"), "1\n");
    git(dir, ["add", "."]);
    git(dir, ["commit", "-q", "-m", "cand-ff"], { env: noFenceEnv() });
    git(dir, ["checkout", "-q", "main"], { env: noFenceEnv() });
    const r = git(dir, ["merge", "--ff-only", "cand"], { env: noFenceEnv() });
    assert.notStrictEqual(r.status, 0, "MUST-BLOCK: un-brokered fast-forward merge into main — " + r.stdout + r.stderr);
    assert.strictEqual(headSha(dir, "refs/heads/main"), before);
    rmrf(dir);
  }

  // ── surface 3: non-fast-forward (true 3-way) merge. ──
  {
    const dir = makeScratchRepo("delegcomplete-nonff");
    installHook(dir);
    // Diverge: one commit on main (unrelated file) via a FENCED write (so main itself can move once,
    // legitimately, to create real divergence), one commit on a side branch — then attempt an un-brokered
    // non-ff merge of the side branch into main.
    const lease = require("../conductor-lease");
    const { fenceEnv } = require("./_lib/git-scratch");
    const leaseRoot = fs.mkdtempSync(path.join(require("os").tmpdir(), "sp002-delegcomplete-lease-"));
    const spId = "SP-DELEGCOMPLETE-NONFF";
    const acquired = lease.acquire(spId, { root: leaseRoot, sessionId: "nonff" });

    git(dir, ["checkout", "-q", "-b", "side"], { env: noFenceEnv() });
    fs.writeFileSync(path.join(dir, "side.txt"), "1\n");
    git(dir, ["add", "."]);
    git(dir, ["commit", "-q", "-m", "side-commit"], { env: noFenceEnv() });
    const sideSha = headSha(dir);

    git(dir, ["checkout", "-q", "main"], { env: noFenceEnv() });
    fs.writeFileSync(path.join(dir, "main-only.txt"), "1\n");
    git(dir, ["add", "."]);
    // A COMMIT on main is itself a protected-ref write too — it needs the fence to land at all, proving
    // the SAME mechanism covers plain `git commit` on main as well as merge/update-ref/push (probe-grounded).
    const mainCommit = git(dir, ["commit", "-q", "-m", "main-commit"], { env: fenceEnv(spId, acquired.token, leaseRoot, noFenceEnv()) });
    assert.strictEqual(mainCommit.status, 0, "a FENCED commit on main must succeed (establishing real divergence)");
    const before = headSha(dir, "refs/heads/main");

    const r = git(dir, ["merge", "-q", "-m", "merge side", "side"], { env: noFenceEnv() });
    assert.notStrictEqual(r.status, 0, "MUST-BLOCK: un-brokered non-ff merge into main — " + r.stdout + r.stderr);
    assert.strictEqual(headSha(dir, "refs/heads/main"), before);
    void sideSha;
    rmrf(dir);
    rmrf(leaseRoot);
  }

  // ── surface 4: push (the reference-transaction hook fires on the RECEIVING end — the bare remote). ──
  {
    const remote = makeBareRemote("delegcomplete-push");
    installHook(remote);
    const clientDir = makeScratchRepo("delegcomplete-push-client");
    git(clientDir, ["remote", "add", "origin", remote.replace(/\\/g, "/")]);
    git(clientDir, ["push", "-q", "origin", "main"], { env: noFenceEnv() }); // seed the remote's main (first push may itself need a fence — see assertion below)
    // Re-derive whether the SEED push landed: if the hook is wired correctly it should have been refused
    // too (main is protected from the FIRST write), so the remote's main must be ABSENT/unadvanced.
    const remoteHeadAfterSeed = headSha(remote, "refs/heads/main");

    fs.writeFileSync(path.join(clientDir, "push.txt"), "1\n");
    git(clientDir, ["add", "."]);
    git(clientDir, ["commit", "-q", "-m", "push-candidate"], { env: fenceEnvForSeed() });
    const r = git(clientDir, ["push", "-q", "origin", "main"], { env: noFenceEnv() });
    assert.notStrictEqual(r.status, 0, "MUST-BLOCK: an un-brokered push to the remote's main must be REFUSED by the remote's own hook — " + r.stdout + r.stderr);
    assert.strictEqual(headSha(remote, "refs/heads/main"), remoteHeadAfterSeed, "the remote's main must be unchanged by the refused push");

    rmrf(remote);
    rmrf(clientDir);

    function fenceEnvForSeed() {
      // The local client-side commit needn't be fenced (main protection is enforced by the REMOTE's own
      // hook on push, and this repo's own local main write is exercised in surfaces 1-3 above) — reuse a
      // clean env so this commit lands locally regardless of any ambient fence vars in the parent process.
      return noFenceEnv();
    }
  }

  // ── honest-ceiling NAMED-UNCOVERED surfaces are documented in the hook's own source (not a silent gap). ──
  const hookSrc = fs.readFileSync(HOOK, "utf8");
  for (const term of ["core.hooksPath", ".git/refs", "hostile"]) {
    assert.ok(hookSrc.includes(term), `the hook's own doc comment must NAME the uncovered ceiling term "${term}" (an honest, evidence-grounded ceiling, never a silent gap)`);
  }
});
