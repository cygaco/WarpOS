"use strict";
/**
 * inc1-transport.test.js — UNIT TEETH for the INC-1 brokered transport (SP-20260721-001, D-4, unit BE-1):
 * `integrateBranchMerge` / `integrateReleaseCommit` and the ONE shared `fencedRefUpdate` choke-point.
 *
 * SCOPE (deliberately bounded): these are the ENTRYPOINT unit tests — the positive "a clean, correctly
 * parented commit LANDS" path plus the entrypoint-level refusals. The adversarial FALSIFIER corpus
 * (caller-adopted anchor, checked!==landed, forged/stale/injected fence token, the real-hook acceptance
 * test) belongs to unit SEC-1 and lives under `falsifiers/`.
 *
 * EVERY test below drives a REAL scratch git repo (real commits, real merge objects, a real
 * `git update-ref` CAS), a REAL pinned checker bundle built through the production promotion path
 * (`pinned-checker-bundle.js#buildBundle`), and a REAL conductor lease. Nothing here is mocked: a mock
 * would prove the test's model of the transport, not the transport.
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ctl = require("./trusted-controller");
const pcb = require("./pinned-checker-bundle");
const lease = require("./conductor-lease");
const { installHook, rmrf } = require("./falsifiers/_lib/git-scratch");

const CONTROLLER_SRC = path.join(__dirname, "trusted-controller.js");

function sh(args, cwd) {
  return execFileSync("git", args, { cwd, encoding: "utf8", windowsHide: true }).trim();
}
function headOf(dir, ref) {
  return sh(["rev-parse", "--verify", ref || "HEAD"], dir).toLowerCase();
}

/**
 * makeTransportFixture(tag, opts) -> a scratch repo whose DEFAULT branch is genuinely `refs/heads/main`
 * (the one ref `protected-ref-transaction.js` fences), with:
 *   c0 -> c1 on main, a `candidate` branch one commit ahead of c1, the REAL reference-transaction hook
 *   installed AFTER all setup writes, a real pinned bundle, and (unless opted out) a held conductor lease.
 *
 * The whole main-branch history is built BEFORE `installHook` on purpose: every later main write in these
 * tests must go through the broker, so the fixture must never need an un-brokered main write of its own.
 */
function makeTransportFixture(tag, opts = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `inc1-transport-${tag}-`));
  sh(["init", "-q", "-b", "main"], dir);
  sh(["config", "user.email", "scratch@example.com"], dir);
  sh(["config", "user.name", "Scratch"], dir);

  fs.writeFileSync(path.join(dir, "README.md"), "seed\n");
  sh(["add", "."], dir);
  sh(["commit", "-q", "-m", "c0 seed"], dir);
  const c0 = headOf(dir);

  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(dir, "scripts", "base.js"), "// base\n");
  sh(["add", "."], dir);
  sh(["commit", "-q", "-m", "c1 on main"], dir);
  const c1 = headOf(dir);

  // A clean candidate branch one commit ahead of main.
  sh(["checkout", "-q", "-b", "candidate"], dir);
  fs.writeFileSync(path.join(dir, "scripts", "feature.js"), "// clean feature work\n");
  sh(["add", "."], dir);
  sh(["commit", "-q", "-m", "candidate work"], dir);
  const candidate = headOf(dir);
  sh(["checkout", "-q", "main"], dir);

  if (opts.skipHookInstall !== true) installHook(dir);

  const outRoot = fs.mkdtempSync(path.join(os.tmpdir(), `inc1-bundle-${tag}-`));
  const { manifestPath, bundleRoot } = pcb.buildBundle({ outRoot, promotedBy: `inc1-transport-${tag}` });

  const spId = `SP-INC1-${tag.toUpperCase()}`;
  const leaseRoot = fs.mkdtempSync(path.join(os.tmpdir(), `inc1-lease-${tag}-`));
  let leaseToken = null;
  if (opts.acquireLease !== false) leaseToken = lease.acquire(spId, { root: leaseRoot, sessionId: tag }).token;

  return {
    dir,
    c0,
    c1,
    candidate,
    spId,
    leaseRoot,
    leaseToken,
    manifestPath,
    bundleRoot,
    targetRef: "refs/heads/main",
    /** Build a REAL commit object with the given parents WITHOUT touching any branch ref (`commit-tree`) —
     *  so the fixture itself never performs a main write the broker is supposed to own. */
    commitTree(treeish, parents, msg) {
      const tree = sh(["rev-parse", `${treeish}^{tree}`], dir);
      const args = ["commit-tree", tree];
      for (const p of parents) args.push("-p", p);
      args.push("-m", msg);
      return sh(args, dir).toLowerCase();
    },
    /** A branch whose tip carries a genuinely NUL-poisoned file (the pinned no-nul-bytes check must FAIL
     *  over the materialized tree of any commit built from it). */
    poisonedBranch(name) {
      sh(["checkout", "-q", "-b", name, "candidate"], dir);
      fs.mkdirSync(path.join(dir, "scripts", "checks"), { recursive: true });
      fs.writeFileSync(path.join(dir, "scripts", "checks", "poison.js"), Buffer.from([0x2f, 0x2f, 0x00, 0x0a]));
      sh(["add", "."], dir);
      sh(["commit", "-q", "-m", "poisoned"], dir);
      const tip = headOf(dir);
      sh(["checkout", "-q", "main"], dir);
      return tip;
    },
    /** A single-parent release-shaped commit on top of `parent`, created on a side branch (never main). */
    releaseCommit(parent, name) {
      sh(["checkout", "-q", "-b", name, parent], dir);
      fs.mkdirSync(path.join(dir, "scripts"), { recursive: true }); // `parent` may predate scripts/
      fs.writeFileSync(path.join(dir, "scripts", "regen.js"), `// bookkeeping regen ${name}\n`);
      sh(["add", "."], dir);
      sh(["commit", "-q", "-m", `release bookkeeping ${name}`], dir);
      const tip = headOf(dir);
      sh(["checkout", "-q", "main"], dir);
      return tip;
    },
    opts(overrides = {}) {
      return { bundleManifestPath: manifestPath, bundleRoot, gitRoot: dir, spId, leaseRoot, ...overrides };
    },
    cleanup() {
      for (const d of [dir, outRoot, leaseRoot]) rmrf(d);
    },
  };
}

// ── POSITIVE ────────────────────────────────────────────────────────────────────────────────────────────

test("POSITIVE — a clean 2-parent merge whose FIRST parent is the live head LANDS (the CAS moves main)", (t) => {
  const fx = makeTransportFixture("merge-pos");
  t.after(() => fx.cleanup());

  const merge = fx.commitTree("candidate", [fx.c1, fx.candidate], "merge candidate into main");
  assert.strictEqual(headOf(fx.dir, "refs/heads/main"), fx.c1, "precondition: main is still at c1");

  const res = ctl.integrateBranchMerge({ merge_commit: merge, target_ref: fx.targetRef }, fx.opts());

  assert.strictEqual(res.ok, true, `expected LANDED, got ${res.decision}/${res.reason} ${JSON.stringify(res.detail || "")}`);
  assert.strictEqual(res.decision, "LANDED");
  assert.strictEqual(headOf(fx.dir, "refs/heads/main"), merge, "refs/heads/main must now point at the merge commit");
  assert.strictEqual(res.receipt.previous_head, fx.c1, "the CAS anchor was the re-resolved live head");
  assert.strictEqual(res.receipt.committed_head, merge);
  assert.strictEqual(res.receipt.transport, "branch-merge");
  // β R6 — the source branch tip is PROVENANCE, recorded but never a trust guard.
  assert.strictEqual(res.receipt.provenance.source_branch_tip, fx.candidate);
  assert.deepStrictEqual(res.receipt.provenance.merge_parents, [fx.c1, fx.candidate]);
  assert.ok(res.receipt.run_nonce && res.receipt.suite_version, "the receipt binds this run's nonce + suite version");
});

test("POSITIVE — a clean single-parent release commit whose parent is the live head LANDS", (t) => {
  const fx = makeTransportFixture("rel-pos");
  t.after(() => fx.cleanup());

  const rel = fx.releaseCommit(fx.c1, "rel");
  const res = ctl.integrateReleaseCommit({ release_commit: rel, target_ref: fx.targetRef }, fx.opts());

  assert.strictEqual(res.ok, true, `expected LANDED, got ${res.decision}/${res.reason} ${JSON.stringify(res.detail || "")}`);
  assert.strictEqual(res.decision, "LANDED");
  assert.strictEqual(headOf(fx.dir, "refs/heads/main"), rel);
  assert.strictEqual(res.receipt.previous_head, fx.c1);
  assert.strictEqual(res.receipt.transport, "release-commit");
  assert.strictEqual(res.receipt.provenance.parent, fx.c1);
});

// ── β R1 — a caller-supplied anchor is IGNORED, never adopted ────────────────────────────────────────────

test("β R1 — a caller-passed base_commit that is NOT the live head is IGNORED; the CAS proceeds on the RE-RESOLVED live head", (t) => {
  const fx = makeTransportFixture("anchor-ignored");
  t.after(() => fx.cleanup());

  const merge = fx.commitTree("candidate", [fx.c1, fx.candidate], "merge candidate into main");

  // Every shape of caller-supplied anchor/token at once: on the input object AND through opts. `c0` is a
  // REAL commit that is genuinely NOT the live head (main is at c1). If ANY of these were read, the CAS
  // would either use c0 (and git would refuse the stale expected value) or fence with a forged token.
  const res = ctl.integrateBranchMerge(
    { merge_commit: merge, target_ref: fx.targetRef, base_commit: fx.c0 },
    fx.opts({ base_commit: fx.c0, expectedHead: fx.c0, leaseToken: "forged-not-the-held-token" }),
  );

  assert.strictEqual(res.ok, true, `the bogus anchor must be IGNORED (not fatal, not adopted) — got ${res.reason}`);
  assert.strictEqual(res.receipt.previous_head, fx.c1, "expectedHead is the LIVE head, never the caller's claimed base");
  assert.notStrictEqual(res.receipt.previous_head, fx.c0);
  assert.strictEqual(headOf(fx.dir, "refs/heads/main"), merge);
});

test("β R1 structural — sanitizeTransportOpts drops every non-allowlisted key (an anchor/token cannot even arrive)", () => {
  assert.deepStrictEqual(ctl.TRANSPORT_OPT_KEYS.slice().sort(), ["bundleManifestPath", "bundleRoot", "gitRoot", "leaseRoot", "spId"]);
  const dirty = {
    bundleManifestPath: "m",
    bundleRoot: "b",
    gitRoot: "g",
    spId: "s",
    leaseRoot: "l",
    base_commit: "deadbeef",
    expectedHead: "deadbeef",
    leaseToken: "forged",
    candidateRoot: "/tmp/evil",
    refUpdater: () => ({ ok: true }),
    leaseTokenResolver: () => "forged",
    materializeResultTree: () => ({ dir: "/tmp/evil", treeHash: "x", cleanup() {} }),
  };
  const clean = ctl.sanitizeTransportOpts(dirty);
  assert.deepStrictEqual(Object.keys(clean).sort(), ["bundleManifestPath", "bundleRoot", "gitRoot", "leaseRoot", "spId"]);
  for (const k of ["base_commit", "expectedHead", "leaseToken", "candidateRoot", "refUpdater", "leaseTokenResolver", "materializeResultTree"]) {
    assert.ok(!(k in clean), `${k} must never survive sanitizeTransportOpts`);
  }
});

// ── NEGATIVES (fail-closed) ─────────────────────────────────────────────────────────────────────────────

test("NEGATIVE — a merge whose FIRST parent is not the live head is BLOCKED (main never moves)", (t) => {
  const fx = makeTransportFixture("merge-stale-parent");
  t.after(() => fx.cleanup());

  // First parent c0, but main lives at c1 — landing this would silently discard c1.
  const merge = fx.commitTree("candidate", [fx.c0, fx.candidate], "merge built on a stale base");
  const res = ctl.integrateBranchMerge({ merge_commit: merge, target_ref: fx.targetRef }, fx.opts());

  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.decision, "BLOCKED");
  assert.strictEqual(res.reason, "merge-first-parent-not-live-head");
  assert.strictEqual(headOf(fx.dir, "refs/heads/main"), fx.c1, "the ref must NOT have moved");
});

test("NEGATIVE — a single-parent commit handed to integrateBranchMerge is BLOCKED (not a real merge)", (t) => {
  const fx = makeTransportFixture("merge-not-merge");
  t.after(() => fx.cleanup());

  const rel = fx.releaseCommit(fx.c1, "rel");
  const res = ctl.integrateBranchMerge({ merge_commit: rel, target_ref: fx.targetRef }, fx.opts());

  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.reason, "merge-commit-not-a-two-parent-merge");
  assert.strictEqual(headOf(fx.dir, "refs/heads/main"), fx.c1);
});

test("NEGATIVE — a 2-parent merge handed to integrateReleaseCommit is BLOCKED (not a single commit)", (t) => {
  const fx = makeTransportFixture("rel-is-merge");
  t.after(() => fx.cleanup());

  const merge = fx.commitTree("candidate", [fx.c1, fx.candidate], "merge");
  const res = ctl.integrateReleaseCommit({ release_commit: merge, target_ref: fx.targetRef }, fx.opts());

  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.reason, "release-commit-not-single-parent");
  assert.strictEqual(headOf(fx.dir, "refs/heads/main"), fx.c1);
});

test("NEGATIVE — a release commit whose parent is not the live head is BLOCKED", (t) => {
  const fx = makeTransportFixture("rel-stale-parent");
  t.after(() => fx.cleanup());

  const rel = fx.releaseCommit(fx.c0, "rel-stale"); // parented on c0 while main is at c1
  const res = ctl.integrateReleaseCommit({ release_commit: rel, target_ref: fx.targetRef }, fx.opts());

  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.reason, "release-parent-not-live-head");
  assert.strictEqual(headOf(fx.dir, "refs/heads/main"), fx.c1);
});

test("NEGATIVE (β R2, checked===landed) — a merge whose OWN tree fails the pinned suite is BLOCKED", (t) => {
  const fx = makeTransportFixture("poisoned-tree");
  t.after(() => fx.cleanup());

  const poisoned = fx.poisonedBranch("poisoned");
  // Correctly parented (first parent IS the live head) and otherwise perfectly shaped — the ONLY defect is
  // the CONTENT that would land. The suite runs over the materialized tree of the exact SHA being landed.
  const merge = fx.commitTree(poisoned, [fx.c1, poisoned], "merge poisoned work");
  const res = ctl.integrateBranchMerge({ merge_commit: merge, target_ref: fx.targetRef }, fx.opts());

  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.decision, "BLOCKED");
  assert.strictEqual(res.reason, "check-failed");
  assert.strictEqual(res.offending, "no-nul-bytes");
  assert.strictEqual(headOf(fx.dir, "refs/heads/main"), fx.c1, "poisoned content must never land");
});

test("NEGATIVE (record-trust) — no conductor lease held ⇒ BLOCKED before any ref write", (t) => {
  const fx = makeTransportFixture("no-lease", { acquireLease: false });
  t.after(() => fx.cleanup());

  const merge = fx.commitTree("candidate", [fx.c1, fx.candidate], "merge candidate into main");
  const res = ctl.integrateBranchMerge({ merge_commit: merge, target_ref: fx.targetRef }, fx.opts());

  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.reason, "lease-not-held");
  assert.strictEqual(headOf(fx.dir, "refs/heads/main"), fx.c1);
});

test("NEGATIVE — an unresolvable commit / a missing target_ref are distinct fail-closed refusals", (t) => {
  const fx = makeTransportFixture("unresolvable");
  t.after(() => fx.cleanup());

  assert.strictEqual(ctl.integrateBranchMerge({ merge_commit: "f".repeat(40), target_ref: fx.targetRef }, fx.opts()).reason, "merge-commit-unresolvable");
  assert.strictEqual(ctl.integrateBranchMerge({ merge_commit: fx.candidate }, fx.opts()).reason, "invalid-target-ref");
  assert.strictEqual(ctl.integrateReleaseCommit({ release_commit: "not-a-sha", target_ref: fx.targetRef }, fx.opts()).reason, "release-commit-unresolvable");
  assert.strictEqual(ctl.integrateReleaseCommit({ release_commit: fx.candidate }, fx.opts()).reason, "invalid-target-ref");
  assert.strictEqual(headOf(fx.dir, "refs/heads/main"), fx.c1);
});

test("NEGATIVE — a DIRECT fencedRefUpdate onto an unrelated history is BLOCKED (no-history-loss floor)", (t) => {
  const fx = makeTransportFixture("unrelated");
  t.after(() => fx.cleanup());

  // A commit with NO parents at all — nothing in main's history descends from, or is descended by, it.
  const orphan = fx.commitTree("candidate", [], "orphan root commit");
  const res = ctl.fencedRefUpdate(orphan, fx.targetRef, fx.opts());

  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.reason, "new-head-not-descendant-of-live-head");
  assert.strictEqual(headOf(fx.dir, "refs/heads/main"), fx.c1);
});

// ── reconcileTransportSuite — the default-deny reconciliation, exercised as a pure function ──────────────

test("reconcileTransportSuite — default-deny: distinct reason per failure mode, and only the ONE pinned skip passes", () => {
  const names = ["false-green-envelope", "no-nul-bytes", "suite-completeness"];
  const N = "nonce-1";
  const ok = [
    { name: "false-green-envelope", status: "skipped", reason: "no-envelope-in-context", nonce: N },
    { name: "no-nul-bytes", status: "pass", nonce: N },
    { name: "suite-completeness", status: "pass", nonce: N },
  ];
  assert.deepStrictEqual(ctl.reconcileTransportSuite(names, ok, N), { ok: true });

  const swap = (name, patch) => ok.map((r) => (r.name === name ? { ...r, ...patch } : r));
  assert.strictEqual(ctl.reconcileTransportSuite(names, swap("no-nul-bytes", { status: "fail" }), N).reason, "check-failed");
  assert.strictEqual(ctl.reconcileTransportSuite(names, swap("no-nul-bytes", { status: "timeout" }), N).reason, "check-timed-out");
  // A skip of a check that is NOT the pinned allowance — refused.
  assert.strictEqual(ctl.reconcileTransportSuite(names, swap("no-nul-bytes", { status: "skipped", reason: "whatever" }), N).reason, "required-check-skipped");
  // The allowed check skipping for a DIFFERENT reason — also refused (the pin is name+reason, not name).
  assert.strictEqual(
    ctl.reconcileTransportSuite(names, swap("false-green-envelope", { status: "skipped", reason: "some-other-reason" }), N).reason,
    "required-check-skipped",
  );
  assert.strictEqual(ctl.reconcileTransportSuite(names, ok.slice(1), N).reason, "missing-required-check");
  assert.strictEqual(ctl.reconcileTransportSuite(names, ok.concat([ok[1]]), N).reason, "duplicate-check-result");
  assert.strictEqual(ctl.reconcileTransportSuite(names, ok.concat([{ name: "surprise", status: "pass", nonce: N }]), N).reason, "unknown-check-result");
  assert.strictEqual(ctl.reconcileTransportSuite(names, swap("no-nul-bytes", { nonce: "stale" }), N).reason, "stale-check-result");
  assert.strictEqual(ctl.reconcileTransportSuite(names, ok, "").reason, "malformed-run-nonce");
  assert.strictEqual(ctl.reconcileTransportSuite([], ok, N).reason, "empty-expected-check-set");
  assert.deepStrictEqual(Object.keys(ctl.TRANSPORT_SKIP_ALLOWED), ["false-green-envelope"], "the skip allowance stays exactly one pinned name");
});

// ── STRUCTURAL — one fenced-CAS site, and no entrypoint writes a ref outside it (β R4) ──────────────────

test("STRUCTURAL — the transport writes a ref in exactly ONE place, and neither entrypoint does it itself", () => {
  const src = fs.readFileSync(CONTROLLER_SRC, "utf8");

  const refWrites = src.match(/"update-ref"/g) || [];
  assert.strictEqual(refWrites.length, 1, "trusted-controller.js must contain exactly ONE `git update-ref` site (defaultRefUpdater)");

  const transportStart = src.indexOf("function integrateBranchMergeInternal");
  const exportsStart = src.indexOf("module.exports = {");
  assert.ok(transportStart > 0 && exportsStart > transportStart);
  const entrypointBodies = src.slice(transportStart, exportsStart);
  assert.ok(!/update-ref/.test(entrypointBodies), "no entrypoint body may perform a ref write of its own");
  assert.ok(!/withControllerFence\(/.test(entrypointBodies), "no entrypoint body may set the fence itself — only fencedRefUpdate may");

  // The fence is SET in exactly two sanctioned places: the unit path (integrateInternal) and the transport
  // choke-point (fencedRefUpdateInternal). `withControllerFence` itself remains the sole env-setting site.
  const fenceCalls = src.match(/withControllerFence\(o\.spId/g) || [];
  assert.strictEqual(fenceCalls.length, 2, "exactly two sanctioned withControllerFence call sites (unit path + transport choke-point)");
});

test("STRUCTURAL — the transport exports are present and the *ForTest seams are SEPARATE from production", () => {
  for (const k of ["fencedRefUpdate", "integrateBranchMerge", "integrateReleaseCommit"]) {
    assert.strictEqual(typeof ctl[k], "function", `${k} must be exported`);
    assert.strictEqual(typeof ctl[`${k}ForTest`], "function", `${k}ForTest must be a SEPARATE export (never reachable through opts)`);
  }
});
