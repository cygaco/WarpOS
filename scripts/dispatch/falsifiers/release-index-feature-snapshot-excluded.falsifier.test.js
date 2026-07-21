"use strict";
/**
 * FALSIFIER: release-index-feature-snapshot-excluded — GF-2 TEETH (the release-commit analog of beta R1)
 * (SP-20260721-001 D-4 INC-1, unit MIG dogfood).
 *
 * THE ATTACK: brokerReleaseCommit builds the commit object the broker then verifies + lands. If it built
 * that object from the AMBIENT working index, an invocation from a FEATURE branch (or with foreign staged
 * content) would produce a commit whose tree is the feature snapshot, parented cleanly to live main — and
 * because the tree can still pass the pinned suite (no NULs etc.), the broker would materialize + land it,
 * SILENTLY replacing main's tree with the feature snapshot. That is the release-commit form of a caller
 * choosing the base (beta R1): the transport must not trust the caller's ambient index as the build base.
 *
 * MUST HOLD (GF-2): the commit is built in an ISOLATED index SEEDED FROM the target head — its tree is
 * head + ONLY the explicitly-named pathspecs. The feature branch's OTHER files can NEVER appear on the
 * landed main commit, whatever branch is checked out.
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const { brokerReleaseCommit } = require("../broker-release-commit");
const { makeTransportFixture, sh } = require("./_lib/transport-fixtures");

test("FALSIFIER GF-2 MUST-BLOCK — a feature-branch working tree cannot smuggle its snapshot onto main via a release commit", () => {
  const fx = makeTransportFixture("gf2-feature-snapshot");
  try {
    const mainHead = fx.head("refs/heads/main");
    // Diverge onto a feature branch carrying a FOREIGN file that must never reach main.
    sh(["checkout", "-q", "-b", "feature/evil"], fx.dir);
    fs.writeFileSync(path.join(fx.dir, "FEATURE_SECRET.txt"), "must never land on main\n");
    sh(["add", "FEATURE_SECRET.txt"], fx.dir);
    sh(["commit", "-q", "-m", "feature work"], fx.dir);
    // While ON feature/evil, write a legitimate bookkeeping file and broker a release-commit to main.
    fs.writeFileSync(path.join(fx.dir, "MANIFEST.generated.json"), JSON.stringify({ regenerated: true }));
    const res = brokerReleaseCommit(
      { message: "chore: manifest regen", add: ["MANIFEST.generated.json"], target_ref: "refs/heads/main" },
      { ...fx.opts(), emit: false },
      {},
    );
    assert.strictEqual(res.ok, true, `the legitimate bookkeeping commit should land: ${res.reason} ${res.detail || ""}`);
    const landed = res.release_commit;
    // Single-parent, parented to LIVE main (not the feature branch).
    const parents = sh(["rev-list", "--parents", "-n", "1", landed], fx.dir).split(/\s+/).slice(1);
    assert.strictEqual(parents.length, 1, "a bookkeeping commit is single-parent");
    assert.strictEqual(parents[0].toLowerCase(), mainHead, "parented to live main");
    // The landed tree = main + ONLY the named path. The foreign feature file MUST be absent.
    const treeFiles = sh(["ls-tree", "-r", "--name-only", landed], fx.dir).split(/\s+/).filter(Boolean);
    assert.ok(treeFiles.includes("MANIFEST.generated.json"), "the named bookkeeping path is present");
    assert.strictEqual(treeFiles.includes("FEATURE_SECRET.txt"), false, "MUST-BLOCK: the feature-branch snapshot must NOT leak onto the main commit");
  } finally {
    fx.cleanup();
  }
});

test("FALSIFIER GF-2/R2-F3 MUST-BLOCK — the build path REQUIRES explicit --add (the ambient index is never swept)", () => {
  const fx = makeTransportFixture("gf2-require-add");
  try {
    const before = fx.head("refs/heads/main");
    // Stage foreign content in the REAL index, then call WITHOUT --add: the old ambient-index build would
    // have committed it; the isolated build must refuse (nothing named) and move no ref.
    fs.writeFileSync(path.join(fx.dir, "AMBIENT_STAGED.txt"), "pre-staged, unnamed\n");
    sh(["add", "AMBIENT_STAGED.txt"], fx.dir);
    const res = brokerReleaseCommit(
      { message: "chore: no add given", target_ref: "refs/heads/main" },
      { ...fx.opts(), emit: false },
      {},
    );
    assert.strictEqual(res.ok, false, "MUST-BLOCK: a build-path invocation with no --add must be refused");
    assert.strictEqual(res.reason, "nothing-to-commit");
    assert.strictEqual(res.classification, "usage");
    assert.match(res.detail, /--add/, "the refusal must tell the caller to name pathspecs with --add");
    assert.strictEqual(fx.head("refs/heads/main"), before, "MUST-BLOCK: refs/heads/main must be UNCHANGED — the ambient staged file is never swept");
  } finally {
    fx.cleanup();
  }
});
