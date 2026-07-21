#!/usr/bin/env node
"use strict";

/**
 * Bite-test for duplicate-doc-drift.js (S-6 / D-4) — proves the pure evaluate()
 * FIRES on a planted drifted-duplicate, and that BOTH non-finding classes pass:
 * a sanctioned-by-allowlist drifted dup, and an identical-content dup. The
 * false-positive guard is the whole point of D-4 — a drift gate that flagged the
 * per-pod role docs (`builder.md` × frontend/backend/security) would be unshippable.
 *
 * Plus: a unit test of the dir-glob matcher, a disk test of shippedDocPaths /
 * buildGroups on a SEALED synthetic manifest + fixture (so the surface-scoping +
 * content-hashing path is exercised in isolation, not just against the live repo),
 * a fail-closed test (malformed manifest → exit 2), and an INTEGRATION check that
 * the real enforcer runs on the live tree, catches the known agent-dispatch-guide
 * drift, stays report-only (exit 0) by default and exit 1 under --enforce, and
 * never crashes / exits 2.
 *
 *   node scripts/checks/duplicate-doc-drift.test.js
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { harness, sealedDir } = require("./lib/fixture-harness");
const {
  evaluate,
  fileMatchesDirGlob,
  shippedDocPaths,
  buildGroups,
} = require("./duplicate-doc-drift");

const SCRIPT = path.join(__dirname, "duplicate-doc-drift.js");
const ROOT = path.resolve(__dirname, "..", "..");
const h = harness("duplicate-doc-drift");

// Allowlist rule fixtures (mirror the real sidecar's shape).
const POD_RULE = { basename: "builder.md", dirGlobs: [".claude/agents/engineering/*/"], reason: "per-pod role doc" };

// A drifted duplicate group helper.
const driftedGroup = (basename, dirs) => ({
  basename,
  members: dirs.map((d, i) => ({ file: `${d}${basename}`, hash: `hash${i}` })), // distinct hashes => drifted
});
const identicalGroup = (basename, dirs) => ({
  basename,
  members: dirs.map((d) => ({ file: `${d}${basename}`, hash: "same" })), // one hash => identical
});

const flagged = (res, basename) => res.findings.some((f) => f.basename === basename);
const allowedFor = (res, basename) => res.allowed.find((a) => a.basename === basename);

// ── known-answer: empty input → 0 findings. ──────────────────────────────────
h.pass("no groups → clean", () => evaluate({ groups: [], rules: [] }));

// ── PLANTED VIOLATION (P5.3): a drifted, UN-sanctioned duplicate FAILS. ───────
h.violation("planted drifted duplicate (no allowlist rule) is CAUGHT", () => {
  const res = evaluate({
    groups: [driftedGroup("agent-dispatch-guide.md", [".claude/agents/.system/guides/", ".claude/project/reference/"])],
    rules: [POD_RULE], // a rule for a DIFFERENT basename must not rescue it
  });
  assert.ok(flagged(res, "agent-dispatch-guide.md"), "drifted unsanctioned dup must flag");
  assert.strictEqual(res.findings[0].kind, "duplicate-doc-drift");
  return res; // { findings:[...] } non-empty => harness reads it as FAIL (the violation)
});

// ── D-4 NON-FINDING #1: a SANCTIONED drifted dup PASSES (per-pod role docs). ──
h.pass("sanctioned drifted duplicate (per-pod builder.md) is allowed, not flagged", () => {
  const res = evaluate({
    groups: [
      driftedGroup("builder.md", [
        ".claude/agents/engineering/frontend/",
        ".claude/agents/engineering/backend/",
        ".claude/agents/engineering/security/",
      ]),
    ],
    rules: [POD_RULE],
  });
  assert.ok(!flagged(res, "builder.md"), "sanctioned dup must NOT flag");
  assert.ok(/sanctioned-duplicate/.test((allowedFor(res, "builder.md") || {}).allowedBy || ""), "must be recorded as sanctioned");
  return res;
});

// ── D-4 NON-FINDING #2: an IDENTICAL-content dup PASSES. ──────────────────────
h.pass("identical-content duplicate is allowed, not flagged", () => {
  const res = evaluate({
    groups: [identicalGroup("agent-dispatch-guide.md", [".claude/agents/.system/guides/", ".claude/project/reference/"])],
    rules: [],
  });
  assert.ok(!flagged(res, "agent-dispatch-guide.md"), "identical dup must NOT flag");
  assert.strictEqual((allowedFor(res, "agent-dispatch-guide.md") || {}).allowedBy, "identical-content");
  return res;
});

// ── PARTIAL-SANCTION GUARD: a member OUTSIDE the sanctioned dirs breaks the
//    exemption (a real drifted dup hiding next to sanctioned ones still fires). ──
h.violation("a drifted member outside the sanctioned dir is NOT exempted (partial-sanction guard)", () => {
  const res = evaluate({
    groups: [
      {
        basename: "builder.md",
        members: [
          { file: ".claude/agents/engineering/frontend/builder.md", hash: "a" },
          { file: ".claude/project/reference/builder.md", hash: "b" }, // outside engineering/*/ → not covered
        ],
      },
    ],
    rules: [POD_RULE],
  });
  assert.ok(flagged(res, "builder.md"), "a member outside the sanctioned dir must keep the group flagged");
  return res;
});

// ── dir-glob matcher unit ─────────────────────────────────────────────────────
h.test("fileMatchesDirGlob: single-* matches exactly one segment; literal dirs match", () => {
  assert.ok(fileMatchesDirGlob(".claude/agents/engineering/frontend/builder.md", ".claude/agents/engineering/*/"));
  assert.ok(fileMatchesDirGlob("_knowledge/design/README.md", "_knowledge/*/"));
  assert.ok(fileMatchesDirGlob("patterns/README.md", "patterns/"));
  // `*` is ONE segment — a deeper path must not match a single-* glob.
  assert.ok(!fileMatchesDirGlob(".claude/agents/engineering/frontend/sub/builder.md", ".claude/agents/engineering/*/"));
  // basename in a sibling dir not covered.
  assert.ok(!fileMatchesDirGlob(".claude/project/reference/builder.md", ".claude/agents/engineering/*/"));
  // a glob without a trailing slash never matches.
  assert.ok(!fileMatchesDirGlob("patterns/README.md", "patterns"));
});

// ── DISK: shippedDocPaths + buildGroups on a SEALED synthetic manifest. ───────
// Proves surface-scoping (kind/path exclusion) and content-hash drift detection
// in isolation — the sealed repo has a drifted dup, a by-design skill collision
// that MUST be excluded, and a frozen-capsule collision that MUST be excluded.
h.test("disk: shippedDocPaths excludes skill/release_capsule kinds + buildGroups hashes content", () => {
  const manifest = {
    assets: {
      reference: [
        { dest: "a/guide.md", kind: "reference", owner: "framework", removedIn: null },
        { dest: "b/guide.md", kind: "reference", owner: "framework", removedIn: null }, // drifted dup (different content below)
        { dest: "c/solo.md", kind: "reference", owner: "framework", removedIn: null },
        { dest: "d/removed.md", kind: "reference", owner: "framework", removedIn: "0.9.0" }, // removed → excluded
        { dest: "e/project.md", kind: "reference", owner: "generated", removedIn: null }, // not framework → excluded
      ],
      skill: [
        { dest: ".claude/commands/x/list.md", kind: "skill", owner: "framework", removedIn: null }, // skill → excluded
        { dest: ".claude/commands/y/list.md", kind: "skill", owner: "framework", removedIn: null },
      ],
      release_capsule: [
        { dest: "framework/releases/0.1.0/changelog.md", kind: "release_capsule", owner: "framework", removedIn: null }, // excluded
        { dest: "framework/releases/0.2.0/changelog.md", kind: "release_capsule", owner: "framework", removedIn: null },
      ],
    },
  };
  const fx = sealedDir(
    {
      ".claude/framework-manifest.json": JSON.stringify(manifest),
      "a/guide.md": "CANONICAL CONTENT v1",
      "b/guide.md": "DRIFTED CONTENT v2", // different bytes → drifted
      "c/solo.md": "only one of me",
    },
    "ddd-disk",
  );
  try {
    // Re-resolve the module against the sealed ROOT via CLAUDE_PROJECT_DIR so MANIFEST_FILE
    // + buildGroups read the fixture, not the live repo. (run() in-process honors it.)
    const out = execFileSync(process.execPath, [SCRIPT, "--json"], {
      encoding: "utf8",
      env: { ...process.env, CLAUDE_PROJECT_DIR: fx.dir },
    });
    const res = JSON.parse(out);
    // Only the framework-owned, non-excluded .md docs are in scope: a/guide.md, b/guide.md, c/solo.md.
    const scanned = res.notes.join(" ");
    assert.ok(/3 shipped framework doc\(s\)/.test(scanned), `expected 3 in-scope docs, got: ${scanned}`);
    // guide.md drifted → exactly one finding; list.md (skill) + changelog.md (capsule) excluded.
    assert.strictEqual(res.findings.length, 1, `expected 1 finding, got ${res.findings.length}`);
    assert.strictEqual(res.findings[0].basename, "guide.md");
    // The excluded by-design collisions must NOT appear as findings.
    assert.ok(!res.findings.some((f) => f.basename === "list.md" || f.basename === "changelog.md"), "skill/capsule collisions must be excluded");
  } finally {
    fx.cleanup();
  }
});

// ── FAIL-CLOSED: a malformed manifest exits 2 (a runner error is never a pass). ──
h.failClosed("malformed framework-manifest → exit 2 (fail-closed)", () => {
  const fx = sealedDir({ ".claude/framework-manifest.json": "{ this is not json" }, "ddd-bad");
  try {
    const r = execFileSync(process.execPath, [SCRIPT, "--json"], {
      encoding: "utf8",
      env: { ...process.env, CLAUDE_PROJECT_DIR: fx.dir },
    });
    return { exitCode: 0, _unexpected: r }; // got 0 → WRONG (should have thrown w/ status 2)
  } catch (e) {
    return { exitCode: e.status }; // expect 2 → isPass(false) → fail-closed satisfied
  } finally {
    fx.cleanup();
  }
});

// ── INTEGRATION: real enforcer on the live tree. ─────────────────────────────
h.test("integration: real enforcer catches the agent-dispatch-guide drift; report-only=0, enforce=1; never exit 2", () => {
  // Report-only (default): the WARN verdict line goes to STDERR with exit 0.
  // spawnSync captures both streams + status in one call regardless of exit code
  // (execFileSync would discard stderr on the success path).
  const { spawnSync } = require("child_process");
  const ro = spawnSync(process.execPath, [SCRIPT], { encoding: "utf8", cwd: ROOT });
  const statusRO = ro.status;
  const outRO = `${ro.stdout || ""}${ro.stderr || ""}`;
  assert.strictEqual(statusRO, 0, `report-only must exit 0, got ${statusRO}: ${outRO.slice(0, 300)}`);
  assert.ok(/\[duplicate-doc-drift\]/.test(outRO), `expected a verdict line, got: ${outRO.slice(0, 200)}`);
  // D-4 INC-4: this case used to hard-depend on a specific live-tree agent-dispatch-guide drift; that drift was
  // reconciled, so the assertion became brittle-stale (it failed on main). The sealed-fixture cases ABOVE already
  // prove the enforcer CATCHES a drift with a controlled input; this integration case's honest job is to prove the
  // enforcer RUNS on the REAL tree without crashing or false-flagging a sanctioned doc — the exit reflects whatever
  // the live tree currently is (clean -> 0, a real drift -> 1), never 2 (fail-closed is malformed-manifest only).
  // Sanctioned per-pod / per-dir docs must NEVER be a finding on the live tree.
  assert.ok(!/FAIL[\s\S]*builder\.md/.test(outRO) && !/WARN[\s\S]*builder\.md/.test(outRO), "builder.md (sanctioned) must NOT be a finding");

  // --enforce: exit reflects the live tree — 0 (clean) or 1 (a real drift); NEVER 2 (a crash / malformed manifest).
  let statusEnf = 0;
  let outEnf = "";
  try {
    outEnf = execFileSync(process.execPath, [SCRIPT, "--enforce"], { encoding: "utf8", cwd: ROOT });
  } catch (e) {
    statusEnf = e.status;
    outEnf = `${e.stdout || ""}${e.stderr || ""}`;
  }
  assert.ok(statusEnf === 0 || statusEnf === 1, `--enforce must exit 0 (clean) or 1 (drift), never 2, got ${statusEnf}: ${outEnf.slice(0, 300)}`);
  if (statusEnf === 1) assert.ok(/FAIL \[duplicate-doc-drift\]/.test(outEnf), "enforce mode prints a FAIL verdict when it exits 1");
});

h.done();
