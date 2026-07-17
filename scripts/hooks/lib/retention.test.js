#!/usr/bin/env node
"use strict";

/**
 * Adversarial ship-gate test for retention.js — a conservative-by-construction
 * DELETION sweep of transient runtime cruft. Uses node's built-in test runner
 * (zero deps) against a throwaway fake root under os.tmpdir(), with a FIXED
 * `{now}` for determinism.
 *
 * Proves:
 *   1. PLANTED ADVERSARIAL FIXTURE (the ship gate) — every decoy shape
 *      survives; ONLY exact allowlist shapes are deleted.
 *   2. path-containment — `..`, absolute-outside, and (where the platform
 *      supports it) an escaping symlink are all refused.
 *   3. dry-run is the DEFAULT — no `apply:true` deletes nothing.
 *   4. per-run cap bounds the blast radius of a shape-match bug.
 *   5. keep-newest-N is honored for handoff-live-*.md.
 *   6. an audit trail is produced on apply (counts on the returned shape).
 *
 *   node --test scripts/hooks/lib/retention.test.js
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { test } = require("node:test");
const assert = require("node:assert");

const {
  planRetention,
  applyRetention,
  safeResolve,
  HANDOFF_LIVE_KEEP,
  MAX_DELETIONS_PER_RUN,
  RETENTION_HANDOFF_DAYS,
} = require("./retention");

const DAY_MS = 24 * 60 * 60 * 1000;
const FIXED_NOW = Date.parse("2026-07-16T12:00:00.000Z");

function mkRoot(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `warpos-retention-${label}-`));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function touch(file, mtimeMs) {
  fs.writeFileSync(file, "content\n", "utf8");
  const t = mtimeMs / 1000;
  fs.utimesSync(file, t, t);
}

// ── 1. PLANTED ADVERSARIAL FIXTURE — the ship gate ──────────────────────────
test("adversarial fixture: only exact allowlist shapes are deleted, every decoy survives", () => {
  const root = mkRoot("adversarial");
  try {
    const runtimeDir = path.join(root, ".claude", "runtime");
    const handoffsDir = path.join(runtimeDir, "handoffs");
    const namedLogDir = path.join(root, "runtime");
    ensureDir(runtimeDir);
    ensureDir(handoffsDir);
    ensureDir(namedLogDir);

    // Decoy: wrong shape — `.md.bak`, must NOT match `^handoff-live-.+\.md$`
    const evilBak = path.join(runtimeDir, "handoff-live-EVIL.md.bak");
    touch(evilBak, FIXED_NOW - 1 * DAY_MS);

    // 20 handoff-live-*.md with staggered mtimes — 01 oldest .. 20 newest.
    // Keep-newest-10 means files 11..20 survive, files 01..10 are eligible.
    const liveFiles = [];
    for (let i = 1; i <= 20; i++) {
      const name = `handoff-live-real-${String(i).padStart(2, "0")}.md`;
      const full = path.join(runtimeDir, name);
      // stagger: earlier index = older mtime
      touch(full, FIXED_NOW - (21 - i) * 60 * 60 * 1000);
      liveFiles.push({ name, full, index: i });
    }
    const expectedDeletedLive = liveFiles.filter((f) => f.index <= 10); // oldest 10
    const expectedSurvivingLive = liveFiles.filter((f) => f.index > 10); // newest 10

    // Decoy: unrelated file in the same dir
    const notesFile = path.join(runtimeDir, "notes.md");
    touch(notesFile, FIXED_NOW - 1 * DAY_MS);

    // Decoy: a literal filename containing encoded traversal chars (NOT a real
    // path separator — just a weird single filename). Must survive untouched.
    const traversalNamed = path.join(runtimeDir, "..%2f..%2fpasswd");
    touch(traversalNamed, FIXED_NOW - 1 * DAY_MS);

    // handoffs/ dir: one aged 20d (eligible), one aged 2d (must survive)
    const old20d = path.join(handoffsDir, "old-handoff-20d.md");
    touch(old20d, FIXED_NOW - 20 * DAY_MS);
    const recent2d = path.join(handoffsDir, "recent-handoff-2d.md");
    touch(recent2d, FIXED_NOW - 2 * DAY_MS);

    // Named error log — the one exact-path shape, always eligible if present.
    const namedLog = path.join(namedLogDir, "s-pf-03-security-review.err.log");
    touch(namedLog, FIXED_NOW - 1 * DAY_MS);

    const result = applyRetention(root, { apply: true, now: FIXED_NOW });

    assert.strictEqual(result.applied, true);
    assert.strictEqual(result.capped, false, "12 eligible must not trip the 25 cap");

    // ── every decoy SURVIVES ──
    assert.ok(fs.existsSync(evilBak), "the .bak decoy must survive (wrong shape)");
    assert.ok(fs.existsSync(notesFile), "the unrelated notes.md must survive");
    assert.ok(fs.existsSync(traversalNamed), "the literal traversal-named file must survive");
    assert.ok(fs.existsSync(recent2d), "the 2-day-old handoffs file must survive (under the 14d cutoff)");
    for (const f of expectedSurvivingLive) {
      assert.ok(fs.existsSync(f.full), `${f.name} (newest 10) must survive`);
    }

    // ── ONLY exact allowlist shapes were deleted ──
    assert.ok(!fs.existsSync(old20d), "the 20-day-old handoffs file must be deleted");
    assert.ok(!fs.existsSync(namedLog), "the named err log must be deleted");
    for (const f of expectedDeletedLive) {
      assert.ok(!fs.existsSync(f.full), `${f.name} (beyond newest 10) must be deleted`);
    }

    // ── deleted set is EXACTLY the allowlist matches, nothing more/less ──
    assert.strictEqual(result.deleted.length, 12, "err log + 20d handoffs file + 10 handoff-live");
    const deletedPaths = new Set(result.deleted.map((d) => d.path));
    assert.ok(deletedPaths.has(path.resolve(namedLog)));
    assert.ok(deletedPaths.has(path.resolve(old20d)));
    for (const f of expectedDeletedLive) {
      assert.ok(deletedPaths.has(path.resolve(f.full)), `${f.name} must be in deleted[]`);
    }
    // None of the survivors ever appear in deleted[]
    assert.ok(!deletedPaths.has(path.resolve(evilBak)));
    assert.ok(!deletedPaths.has(path.resolve(notesFile)));
    assert.ok(!deletedPaths.has(path.resolve(traversalNamed)));
    assert.ok(!deletedPaths.has(path.resolve(recent2d)));
    for (const f of expectedSurvivingLive) {
      assert.ok(!deletedPaths.has(path.resolve(f.full)));
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── 2. path-containment ─────────────────────────────────────────────────────
test("safeResolve refuses `..` traversal and absolute-outside paths", () => {
  const root = mkRoot("containment");
  try {
    ensureDir(root);
    const escapeViaDotDot = path.join(root, "..", "escape");
    assert.strictEqual(safeResolve(root, escapeViaDotDot), null);

    const absoluteOutside = path.resolve(os.tmpdir(), "definitely-outside-root-xyz");
    assert.strictEqual(safeResolve(root, absoluteOutside), null);

    // Sanity: a legitimate inside-root path DOES resolve.
    const inside = path.join(root, ".claude", "runtime", "handoff-live-x.md");
    assert.strictEqual(safeResolve(root, inside), path.resolve(inside));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a symlink under runtime whose target escapes root is never deleted", (t) => {
  const root = mkRoot("symlink");
  try {
    const runtimeDir = path.join(root, ".claude", "runtime");
    ensureDir(runtimeDir);

    // A real file OUTSIDE root that the symlink will point to.
    const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-retention-outside-"));
    const outsideTarget = path.join(outsideDir, "secret.md");
    fs.writeFileSync(outsideTarget, "should never be touched\n", "utf8");

    const symlinkPath = path.join(runtimeDir, "handoff-live-escape.md");
    let symlinkSupported = true;
    try {
      fs.symlinkSync(outsideTarget, symlinkPath, "file");
    } catch {
      symlinkSupported = false;
    }

    if (!symlinkSupported) {
      // Windows without dev-mode/admin can EPERM on symlink creation — skip
      // gracefully rather than failing the whole suite on an environment gap.
      t.skip("symlink creation not permitted on this platform/user");
      fs.rmSync(outsideDir, { recursive: true, force: true });
      return;
    }

    try {
      // Direct containment check: the resolved REAL path escapes root.
      assert.strictEqual(safeResolve(root, symlinkPath), null);

      // Full apply must never delete it (or its outside target).
      const result = applyRetention(root, { apply: true, now: FIXED_NOW });
      assert.ok(fs.existsSync(symlinkPath) || fs.lstatSync(symlinkPath), "symlink itself untouched");
      assert.ok(fs.existsSync(outsideTarget), "the outside target must survive");
      const deletedPaths = new Set(result.deleted.map((d) => d.path));
      assert.ok(!deletedPaths.has(path.resolve(symlinkPath)));
      assert.ok(!deletedPaths.has(path.resolve(outsideTarget)));
    } finally {
      fs.rmSync(outsideDir, { recursive: true, force: true });
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── 3. dry-run is the DEFAULT ───────────────────────────────────────────────
test("dry-run (no apply) deletes nothing", () => {
  const root = mkRoot("dryrun");
  try {
    const runtimeDir = path.join(root, ".claude", "runtime");
    const handoffsDir = path.join(runtimeDir, "handoffs");
    const namedLogDir = path.join(root, "runtime");
    ensureDir(runtimeDir);
    ensureDir(handoffsDir);
    ensureDir(namedLogDir);

    for (let i = 1; i <= 15; i++) {
      touch(
        path.join(runtimeDir, `handoff-live-real-${String(i).padStart(2, "0")}.md`),
        FIXED_NOW - (16 - i) * 60 * 60 * 1000,
      );
    }
    const old20d = path.join(handoffsDir, "old-handoff-20d.md");
    touch(old20d, FIXED_NOW - 20 * DAY_MS);
    const namedLog = path.join(namedLogDir, "s-pf-03-security-review.err.log");
    touch(namedLog, FIXED_NOW - 1 * DAY_MS);

    const result = applyRetention(root, { now: FIXED_NOW }); // no `apply`
    assert.strictEqual(result.applied, false);
    assert.strictEqual(result.deleted.length, 0);
    assert.ok(result.totalCandidates > 0, "sanity: there WERE eligible candidates");

    // Every seeded file is still on disk.
    for (let i = 1; i <= 15; i++) {
      assert.ok(
        fs.existsSync(path.join(runtimeDir, `handoff-live-real-${String(i).padStart(2, "0")}.md`)),
      );
    }
    assert.ok(fs.existsSync(old20d));
    assert.ok(fs.existsSync(namedLog));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("applyRetention with apply:false explicitly also deletes nothing", () => {
  const root = mkRoot("dryrun-explicit-false");
  try {
    const namedLogDir = path.join(root, "runtime");
    ensureDir(namedLogDir);
    const namedLog = path.join(namedLogDir, "s-pf-03-security-review.err.log");
    touch(namedLog, FIXED_NOW - 1 * DAY_MS);

    const result = applyRetention(root, { apply: false, now: FIXED_NOW });
    assert.strictEqual(result.applied, false);
    assert.deepStrictEqual(result.deleted, []);
    assert.ok(fs.existsSync(namedLog));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── 4. per-run cap ───────────────────────────────────────────────────────────
test("per-run cap bounds candidates even when far more are eligible", () => {
  const root = mkRoot("cap");
  try {
    const handoffsDir = path.join(root, ".claude", "runtime", "handoffs");
    ensureDir(handoffsDir);
    const total = 40;
    for (let i = 1; i <= total; i++) {
      touch(
        path.join(handoffsDir, `old-handoff-${String(i).padStart(2, "0")}.md`),
        FIXED_NOW - (20 + i) * DAY_MS, // all well past the 14-day cutoff
      );
    }
    const plan = planRetention(root, { now: FIXED_NOW });
    assert.strictEqual(plan.totalCandidates, total);
    assert.strictEqual(plan.capped, true);
    assert.strictEqual(plan.candidates.length, MAX_DELETIONS_PER_RUN);
    assert.strictEqual(plan.candidates.length, 25);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── 5. keep-newest-N ─────────────────────────────────────────────────────────
test("keep-newest-HANDOFF_LIVE_KEEP: the newest N handoff-live files are never candidates", () => {
  const root = mkRoot("keep-newest");
  try {
    const runtimeDir = path.join(root, ".claude", "runtime");
    ensureDir(runtimeDir);
    const files = [];
    for (let i = 1; i <= 20; i++) {
      const name = `handoff-live-real-${String(i).padStart(2, "0")}.md`;
      const full = path.join(runtimeDir, name);
      touch(full, FIXED_NOW - (21 - i) * 60 * 60 * 1000); // i=20 newest
      files.push({ name, full, index: i });
    }
    const plan = planRetention(root, { now: FIXED_NOW });
    const candidatePaths = new Set(plan.candidates.map((c) => c.path));
    const newest10 = files.filter((f) => f.index > 10);
    const oldest10 = files.filter((f) => f.index <= 10);
    assert.strictEqual(newest10.length, HANDOFF_LIVE_KEEP);
    for (const f of newest10) {
      assert.ok(!candidatePaths.has(path.resolve(f.full)), `${f.name} (newest) must not be a candidate`);
    }
    for (const f of oldest10) {
      assert.ok(candidatePaths.has(path.resolve(f.full)), `${f.name} (oldest, beyond keep) must be a candidate`);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── 6. audit trail on apply ──────────────────────────────────────────────────
test("apply produces a counted audit result (deleted/skipped/totalCandidates)", () => {
  const root = mkRoot("audit");
  try {
    const namedLogDir = path.join(root, "runtime");
    ensureDir(namedLogDir);
    const namedLog = path.join(namedLogDir, "s-pf-03-security-review.err.log");
    touch(namedLog, FIXED_NOW - 1 * DAY_MS);

    const result = applyRetention(root, { apply: true, now: FIXED_NOW });
    assert.strictEqual(result.applied, true);
    assert.strictEqual(result.deleted.length, 1, "the named err log alone must be deleted");
    assert.strictEqual(result.skipped.length, 0);
    assert.strictEqual(result.totalCandidates, 1);
    assert.strictEqual(typeof result.capped, "boolean");
    assert.ok(!fs.existsSync(namedLog));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

// ── Bonus: the load/prune invariant this module encodes at require-time ─────
test("RETENTION_HANDOFF_DAYS stays a strict superset of the session-start load window", () => {
  assert.ok(RETENTION_HANDOFF_DAYS > 7, "must exceed the 7-day session-start load window");
});
