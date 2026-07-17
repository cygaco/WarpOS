#!/usr/bin/env node
"use strict";

/**
 * Isolated test for archive.js — the archive tier (D-1: move-to-archive, never
 * delete) + addendum B (archive index + RESTORE DRILL). Proves:
 *   1. archive() MOVES a file into the tier + writes an index entry
 *   2. RESTORE DRILL (addendum B): archive → restore → file back at origin, intact
 *   3. restore refuses to clobber live state (origin already exists)
 *   4. containment: a source OUTSIDE root, or a symlink source, is refused
 *   5. F-ROT-1: two archives of the same basename produce DISTINCT files (no clobber)
 *   6. reader (amendment #5): archived content is fully READABLE (rotation loses nothing)
 *   7. readIndex tolerates a torn/partial line, never throws
 *   8. tryLock: single-writer semantics + stale reclaim
 *   9. fault-injection: a move fault → ok:false, source kept, NEVER throws
 *
 *   node scripts/hooks/lib/archive.test.js
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { harness, sealedDir } = require("../../checks/lib/fixture-harness");
const archive = require("./archive");

const h = harness("archive");

function seedRuntime(fx) {
  fs.mkdirSync(path.join(fx.dir, ".claude", "runtime"), { recursive: true });
}

// ── 1. archive() MOVES + indexes ────────────────────────────────────────────
h.test("archive moves the file into the tier and writes an index entry", () => {
  const fx = sealedDir({}, "archive-move");
  try {
    seedRuntime(fx);
    const src = path.join(fx.dir, ".claude", "runtime", "events.jsonl");
    fs.writeFileSync(src, "a\nb\nc\n", "utf8");
    const res = archive.archive(src, { root: fx.dir, reason: "rotation:over-cap", shape: "operational" });
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.indexed, true, "a successful archive reports indexed:true");
    assert.ok(!fs.existsSync(src), "source moved off its origin");
    assert.ok(fs.existsSync(res.archived), "archived file exists in the tier");
    assert.strictEqual(fs.readFileSync(res.archived, "utf8"), "a\nb\nc\n", "content preserved byte-for-byte");

    const idx = archive.readIndex(fx.dir);
    assert.strictEqual(idx.length, 1);
    assert.strictEqual(idx[0].origin, ".claude/runtime/events.jsonl");
    assert.strictEqual(idx[0].reason, "rotation:over-cap");
    assert.strictEqual(idx[0].shape, "operational");
    assert.strictEqual(idx[0].lines, 3, "index records the line count");
    assert.ok(typeof idx[0].bytes === "number" && idx[0].bytes > 0, "index records the byte size");
  } finally {
    fx.cleanup();
  }
});

// ── 2. RESTORE DRILL (addendum B) ───────────────────────────────────────────
h.test("RESTORE DRILL: archive then restore returns the file to its origin intact", () => {
  const fx = sealedDir({}, "archive-restore-drill");
  try {
    seedRuntime(fx);
    const src = path.join(fx.dir, ".claude", "runtime", "handoffs", "old.md");
    fs.mkdirSync(path.dirname(src), { recursive: true });
    const original = "line1\nline2\nline3\n";
    fs.writeFileSync(src, original, "utf8");

    const a = archive.archive(src, { root: fx.dir, reason: "retention:handoffs-dir" });
    assert.strictEqual(a.ok, true);
    assert.ok(!fs.existsSync(src), "moved off origin");

    // Restore from the index entry (the drill uses exactly what the archive recorded).
    const idx = archive.readIndex(fx.dir);
    const r = archive.restore(idx[0], { root: fx.dir });
    assert.strictEqual(r.ok, true, "restore must succeed");
    assert.ok(fs.existsSync(src), "the file is back at its origin");
    assert.strictEqual(fs.readFileSync(src, "utf8"), original, "restored content is byte-identical");
  } finally {
    fx.cleanup();
  }
});

// ── 3. restore never clobbers live state ────────────────────────────────────
h.test("restore refuses when the origin already exists (never clobber live state)", () => {
  const fx = sealedDir({}, "archive-restore-noclobber");
  try {
    seedRuntime(fx);
    const src = path.join(fx.dir, ".claude", "runtime", "events.jsonl");
    fs.writeFileSync(src, "old\n", "utf8");
    const a = archive.archive(src, { root: fx.dir, reason: "rotation" });
    // A NEW live file appears at the origin before the restore.
    fs.writeFileSync(src, "fresh-live\n", "utf8");
    const r = archive.restore(a.entry, { root: fx.dir });
    assert.strictEqual(r.ok, false, "restore must refuse to overwrite the live file");
    assert.strictEqual(r.reason, "origin-exists");
    assert.strictEqual(fs.readFileSync(src, "utf8"), "fresh-live\n", "live file untouched");
  } finally {
    fx.cleanup();
  }
});

// ── 4. containment ──────────────────────────────────────────────────────────
h.test("archive refuses a source outside root", () => {
  const fx = sealedDir({}, "archive-escape");
  const outside = sealedDir({}, "archive-outside");
  try {
    seedRuntime(fx);
    const evil = path.join(outside.dir, "secret.md");
    fs.writeFileSync(evil, "secret\n", "utf8");
    const res = archive.archive(evil, { root: fx.dir, reason: "x" });
    assert.strictEqual(res.ok, false, "a source outside root must be refused");
    assert.strictEqual(res.reason, "escapes-root");
    assert.ok(fs.existsSync(evil), "the outside file is untouched");
  } finally {
    fx.cleanup();
    outside.cleanup();
  }
});

h.test("archive refuses a symlink source (no-follow)", (/* platform-tolerant */) => {
  const fx = sealedDir({}, "archive-symlink");
  const outside = sealedDir({}, "archive-symlink-target");
  try {
    seedRuntime(fx);
    const target = path.join(outside.dir, "secret.md");
    fs.writeFileSync(target, "secret\n", "utf8");
    const link = path.join(fx.dir, ".claude", "runtime", "events.jsonl");
    let symlinkOk = true;
    try {
      fs.symlinkSync(target, link, "file");
    } catch {
      symlinkOk = false;
    }
    if (!symlinkOk) return; // platform without symlink perms — skip gracefully
    const res = archive.archive(link, { root: fx.dir, reason: "x" });
    assert.strictEqual(res.ok, false, "a symlink source must be refused (not-a-regular-file)");
    assert.strictEqual(res.reason, "not-a-regular-file");
    assert.ok(fs.existsSync(target), "the symlink target survives");
  } finally {
    fx.cleanup();
    outside.cleanup();
  }
});

// ── 5. F-ROT-1: two archives of the same basename never clobber ─────────────
h.test("F-ROT-1: archiving the same basename twice yields TWO distinct generations", () => {
  const fx = sealedDir({}, "archive-two-gen");
  try {
    seedRuntime(fx);
    const src = path.join(fx.dir, ".claude", "runtime", "events.jsonl");
    fs.writeFileSync(src, "gen-one\n", "utf8");
    const a1 = archive.archive(src, { root: fx.dir, reason: "rotation" });
    fs.writeFileSync(src, "gen-two\n", "utf8");
    const a2 = archive.archive(src, { root: fx.dir, reason: "rotation" });
    assert.ok(a1.ok && a2.ok);
    assert.notStrictEqual(a1.archived, a2.archived, "unique names — the two generations are distinct files");
    assert.strictEqual(fs.readFileSync(a1.archived, "utf8"), "gen-one\n", "first generation intact");
    assert.strictEqual(fs.readFileSync(a2.archived, "utf8"), "gen-two\n", "second generation intact");
    assert.strictEqual(archive.readIndex(fx.dir).length, 2);
  } finally {
    fx.cleanup();
  }
});

// ── 6. reader (amendment #5): archived content stays fully readable ─────────
h.test("reader: a reader of the archived generation gets the complete content (rotation loses nothing)", () => {
  const fx = sealedDir({}, "archive-reader");
  try {
    seedRuntime(fx);
    const src = path.join(fx.dir, ".claude", "runtime", "events.jsonl");
    const lines = [];
    for (let i = 0; i < 500; i++) lines.push(JSON.stringify({ i, msg: "event-" + i }));
    fs.writeFileSync(src, lines.join("\n") + "\n", "utf8");
    const a = archive.archive(src, { root: fx.dir, reason: "rotation" });
    // A reader parses the archived JSONL — every line must round-trip.
    const parsed = fs
      .readFileSync(a.archived, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l));
    assert.strictEqual(parsed.length, 500, "all 500 lines readable from the archive");
    assert.strictEqual(parsed[0].i, 0);
    assert.strictEqual(parsed[499].i, 499);
    // The index also points a reader at the archived path (the query seam).
    const idx = archive.readIndex(fx.dir);
    assert.strictEqual(path.join(fx.dir, idx[0].archived), a.archived);
  } finally {
    fx.cleanup();
  }
});

// ── 7. readIndex tolerates a torn line ──────────────────────────────────────
h.test("readIndex tolerates a torn/partial index line (never throws)", () => {
  const fx = sealedDir({}, "archive-torn-index");
  try {
    seedRuntime(fx);
    const idxPath = path.join(fx.dir, ".claude", "runtime", "archive", "index.jsonl");
    fs.mkdirSync(path.dirname(idxPath), { recursive: true });
    fs.writeFileSync(idxPath, JSON.stringify({ origin: "a" }) + "\n{ this is not json\n" + JSON.stringify({ origin: "b" }) + "\n");
    const idx = archive.readIndex(fx.dir);
    assert.strictEqual(idx.length, 2, "the two valid lines parse; the torn line is skipped");
  } finally {
    fx.cleanup();
  }
});

// ── 8. tryLock single-writer + stale reclaim ────────────────────────────────
h.test("tryLock: a fresh lock blocks a second acquire; release re-opens it", () => {
  const fx = sealedDir({}, "archive-lock");
  try {
    const lp = path.join(fx.dir, ".claude", "runtime", "x.lock");
    const rel = archive.tryLock(lp);
    assert.strictEqual(typeof rel, "function", "first acquire succeeds");
    assert.strictEqual(archive.tryLock(lp), null, "a second acquire while held returns null");
    rel();
    const rel2 = archive.tryLock(lp);
    assert.strictEqual(typeof rel2, "function", "after release the lock is acquirable again");
    rel2();
  } finally {
    fx.cleanup();
  }
});

h.test("tryLock: a STALE lock (older than staleMs) is reclaimed", () => {
  const fx = sealedDir({}, "archive-lock-stale");
  try {
    const lp = path.join(fx.dir, ".claude", "runtime", "y.lock");
    fs.mkdirSync(path.dirname(lp), { recursive: true });
    fs.writeFileSync(lp, JSON.stringify({ pid: 999999, ts: 0 }) + "\n");
    // Backdate the lock so it is stale relative to a tiny staleMs.
    const old = (Date.now() - 10 * 1000) / 1000;
    fs.utimesSync(lp, old, old);
    const rel = archive.tryLock(lp, { staleMs: 1000 });
    assert.strictEqual(typeof rel, "function", "a stale lock must be reclaimable");
    rel();
  } finally {
    fx.cleanup();
  }
});

// ── 9. fault-injection — a move fault → ok:false, source kept, NEVER throws ──
h.violation("archive move fault surfaces as ok:false, source kept, never throws", () => {
  const fx = sealedDir({}, "archive-fault");
  try {
    seedRuntime(fx);
    const src = path.join(fx.dir, ".claude", "runtime", "events.jsonl");
    fs.writeFileSync(src, "data\n", "utf8");
    const origRename = fs.renameSync;
    fs.renameSync = () => {
      throw new Error("injected move failure");
    };
    let res;
    let threw = false;
    try {
      res = archive.archive(src, { root: fx.dir, reason: "x" });
    } catch {
      threw = true;
    } finally {
      fs.renameSync = origRename;
    }
    assert.strictEqual(threw, false, "archive must NEVER throw");
    assert.strictEqual(res.ok, false, "a move fault surfaces as ok:false");
    assert.ok(fs.existsSync(src), "the source is KEPT on a move fault (no data loss)");
    return { ok: false }; // mark this h.violation as correctly-caught
  } finally {
    fx.cleanup();
  }
});

// ── index-failure is SURFACED, not swallowed (gauntlet R1 new-defect) ───────
h.test("archive surfaces an index-write failure as indexed:false (file still archived)", () => {
  const fx = sealedDir({}, "archive-index-fail");
  try {
    seedRuntime(fx);
    const src = path.join(fx.dir, ".claude", "runtime", "events.jsonl");
    fs.writeFileSync(src, "a\nb\n", "utf8");
    const origAppend = fs.appendFileSync;
    // Fail ONLY the index append (the path ends with index.jsonl).
    fs.appendFileSync = (p, ...rest) => {
      if (String(p).endsWith("index.jsonl")) throw new Error("injected index write failure");
      return origAppend(p, ...rest);
    };
    let res;
    try {
      res = archive.archive(src, { root: fx.dir, reason: "rotation" });
    } finally {
      fs.appendFileSync = origAppend;
    }
    assert.strictEqual(res.ok, true, "the file IS archived (data safe) even when the index write fails");
    assert.strictEqual(res.indexed, false, "the index-write failure must be SURFACED, not swallowed");
    assert.ok(fs.existsSync(res.archived), "the archived generation is on disk (recoverable by dir scan)");
    assert.ok(!fs.existsSync(src), "source moved");
  } finally {
    fx.cleanup();
  }
});

// ── β F-RET-1 CONDITION: ADVERSARIAL containment — one negative fixture per vector ─
// Each vector asserts REFUSE-or-ARCHIVE-WITHIN-ROOT (never an arbitrary delete,
// never an out-of-root write, never exfiltration). The residual (a same-uid
// ancestor-swap can pull an out-of-root file INTO our own archive — contained,
// recoverable) is the β-ruled MED-LOW tracked residual (ADR 0017).
h.test("β-adversarial containment: vector (b) non-regular file (directory source) is REFUSED", () => {
  const fx = sealedDir({}, "contain-dir");
  try {
    seedRuntime(fx);
    const dirSrc = path.join(fx.dir, ".claude", "runtime", "a-directory");
    fs.mkdirSync(dirSrc, { recursive: true });
    const r = archive.archive(dirSrc, { root: fx.dir, reason: "x" });
    assert.strictEqual(r.ok, false, "a directory source must be refused (lstat isFile())");
    assert.strictEqual(r.reason, "not-a-regular-file");
    assert.ok(fs.existsSync(dirSrc), "the directory is untouched (not deleted)");
  } finally {
    fx.cleanup();
  }
});

h.test("β-adversarial containment: vector (d) out-of-root source is REFUSED", () => {
  const fx = sealedDir({}, "contain-out");
  const outside = sealedDir({}, "contain-out-src");
  try {
    seedRuntime(fx);
    const evil = path.join(outside.dir, "secret.md");
    fs.writeFileSync(evil, "secret\n", "utf8");
    const r = archive.archive(evil, { root: fx.dir, reason: "x" });
    assert.strictEqual(r.ok, false, "an out-of-root source must be refused");
    assert.strictEqual(r.reason, "escapes-root");
    assert.ok(fs.existsSync(evil), "the out-of-root file survives (not deleted, not moved outside)");
  } finally {
    fx.cleanup();
    outside.cleanup();
  }
});

h.test("β-adversarial containment: vector (a) symlink-source/ancestor → refuse OR archive-WITHIN-root, never delete/exfil", () => {
  const fx = sealedDir({}, "contain-symlink");
  const target = sealedDir({}, "contain-symlink-target");
  try {
    seedRuntime(fx);
    const outsideFile = path.join(target.dir, "secret.md");
    fs.writeFileSync(outsideFile, "secret\n", "utf8");
    const link = path.join(fx.dir, ".claude", "runtime", "evil.jsonl");
    let symlinkOk = true;
    try {
      fs.symlinkSync(outsideFile, link, "file");
    } catch {
      symlinkOk = false;
    }
    if (!symlinkOk) return; // platform without symlink perms — vector not exercisable, skip
    const r = archive.archive(link, { root: fx.dir, reason: "x" });
    // A final-component symlink is refused (lstat.isFile() is false for a symlink).
    assert.strictEqual(r.ok, false, "a symlink source must be refused (not a regular file)");
    assert.ok(fs.existsSync(outsideFile), "the symlink target (out-of-root) survives — no delete, no exfil");
    // Invariant even if a future change let SOME archive through: the DEST is inside root.
    if (r.ok && r.archived) {
      assert.ok(archive.resolveInsideRoot(path.resolve(fx.dir), r.archived), "any archive dest stays inside root");
    }
  } finally {
    fx.cleanup();
    target.cleanup();
  }
});

// ── β F-RET-1 CONDITION: NO-DELETE proof — deletion left the former-deleter paths ─
h.test("β no-delete proof: retention.js + rotate.js contain NO fs.unlink/fs.rm/fs.rmdir (archive-move only)", () => {
  const stripComments = (s) =>
    s.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const rel of ["retention.js", "rotate.js"]) {
    const code = stripComments(fs.readFileSync(path.join(__dirname, rel), "utf8"));
    for (const pat of [/fs\.unlink/, /fs\.rmSync/, /fs\.rm\b/, /fs\.rmdir/]) {
      assert.ok(
        !pat.test(code),
        `${rel} must contain no ${pat} — the destructive path is MOVE-TO-ARCHIVE only (D-1)`,
      );
    }
  }
  // archive.js's unlinks are ONLY the EXDEV copy-THEN-unlink move + lock release —
  // never a user-data delete. Assert each data-move unlink is paired with a copy.
  const arch = stripComments(fs.readFileSync(path.join(__dirname, "archive.js"), "utf8"));
  const copyCount = (arch.match(/fs\.copyFileSync/g) || []).length;
  assert.ok(copyCount >= 2, "archive.js keeps its EXDEV copy-before-unlink move semantics (archive + restore)");
});

// ── lstat restore no-clobber (LOW hardening, both security passes flagged) ──
h.test("restore no-clobber uses lstat (no symlink-follow): a dangling-symlink origin is NOT clobbered", () => {
  const fx = sealedDir({}, "restore-lstat");
  try {
    seedRuntime(fx);
    const src = path.join(fx.dir, ".claude", "runtime", "events.jsonl");
    fs.writeFileSync(src, "data\n", "utf8");
    const a = archive.archive(src, { root: fx.dir, reason: "rotation" });
    assert.strictEqual(a.ok, true);
    // Plant a DANGLING symlink at the origin (existsSync would report false → old bug clobbers).
    let symlinkOk = true;
    try {
      fs.symlinkSync(path.join(fx.dir, ".claude", "runtime", "nonexistent-target"), src, "file");
    } catch {
      symlinkOk = false;
    }
    if (!symlinkOk) return; // platform without symlink perms — skip
    const r = archive.restore(a.entry, { root: fx.dir });
    assert.strictEqual(r.ok, false, "restore must refuse when a (dangling) symlink already occupies the origin");
    assert.strictEqual(r.reason, "origin-exists");
    assert.ok(fs.lstatSync(src).isSymbolicLink(), "the dangling symlink at the origin is untouched");
  } finally {
    fx.cleanup();
  }
});

h.violation("archive refuses a missing source (ok:false, no throw)", () => {
  const fx = sealedDir({}, "archive-missing");
  try {
    seedRuntime(fx);
    const res = archive.archive(path.join(fx.dir, ".claude", "runtime", "nope.jsonl"), { root: fx.dir });
    assert.strictEqual(res.ok, false);
    assert.strictEqual(res.reason, "missing");
    return { ok: false };
  } finally {
    fx.cleanup();
  }
});

h.done();
