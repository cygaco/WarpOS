#!/usr/bin/env node
"use strict";

/**
 * Isolated test for rotate.js — ARCHIVE-MOVE rotation (D-1: raw history is
 * never destroyed; the over-cap sink MOVES into the archive tier, not `.1`).
 * Proves:
 *   1. below-cap no-op — file untouched, nothing archived
 *   2. at/over-cap ARCHIVES (active file gone, archive carries ALL lines, index
 *      entry written); the next append recreates fresh, ZERO lines lost
 *   3. F-ROT-1: ≥2 generations — a second rotation creates a SECOND archive
 *      generation; the first is NEVER clobbered (unique names)
 *   4. F-ROT-2: the SOUND pre-gate rotates a tiny-byte/high-line file that the
 *      old 50-byte/line floor would have skipped
 *   5. F-ROT-3: at/over-cap boundary — exactly `cap` lines rotates; `cap-1` does not
 *   6. F-ROT-4: rotateSink is CLOSED over SINK_CAPS — an unknown path is a no-op
 *   7. fault-injection (archive move throws) → falsy, NEVER throws, source kept
 *   8. missing / 0-byte file → no-op
 *   9. rotateBytesIfNeeded — the byte-cap sibling, archive semantics
 *
 * Real filesystem, sealed temp dirs (via fixture-harness's sealedDir) — the
 * temp dir IS the trusted root; the archive tier lands at
 * <root>/.claude/runtime/archive/.
 *
 *   node scripts/hooks/lib/rotate.test.js
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { harness, sealedDir } = require("../../checks/lib/fixture-harness");
const {
  rotateIfNeeded,
  rotateBytesIfNeeded,
  rotateSink,
  MIN_BYTES_PER_LINE,
  DEFAULT_JSONL_CAP_LINES,
  SINK_CAPS,
  CAP_CLASSES,
} = require("./rotate");

const h = harness("rotate");

function countLines(content) {
  return content.length === 0 ? 0 : content.split("\n").filter(Boolean).length;
}

function mkLines(n, padTo) {
  const lines = [];
  for (let i = 0; i < n; i++) {
    let line = JSON.stringify({ i, ts: "2026-01-01T00:00:00.000Z" });
    if (padTo && line.length < padTo) line += "x".repeat(padTo - line.length);
    lines.push(line);
  }
  return lines.join("\n") + "\n";
}

/** List archived files (everything under <root>/.claude/runtime/archive except index.jsonl). */
function archivedFiles(root) {
  const dir = path.join(root, ".claude", "runtime", "archive");
  let names = [];
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return names.filter((n) => n !== "index.jsonl").map((n) => path.join(dir, n));
}

function readIndex(root) {
  try {
    const raw = fs.readFileSync(path.join(root, ".claude", "runtime", "archive", "index.jsonl"), "utf8");
    return raw.split("\n").filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

// ── 1. below-cap no-op — untouched, nothing archived ────────────────────────
h.test("below-cap: file untouched, nothing archived", () => {
  const fx = sealedDir({}, "rotate-below-cap");
  try {
    const file = fx.file("events.jsonl");
    const content = mkLines(5);
    fs.writeFileSync(file, content, "utf8");
    const res = rotateIfNeeded(file, 20000, { root: fx.dir, allowUnregistered: true });
    assert.strictEqual(res.rotated, false, "should not rotate below cap");
    assert.strictEqual(fs.readFileSync(file, "utf8"), content, "content must be byte-identical");
    assert.strictEqual(archivedFiles(fx.dir).length, 0, "nothing should be archived");
  } finally {
    fx.cleanup();
  }
});

// ── 2. at/over-cap ARCHIVES; ZERO lines lost across move + next append ──────
h.test("over-cap: archives (active gone, archive carries ALL lines), zero lines lost", () => {
  const fx = sealedDir({}, "rotate-over-cap");
  try {
    const file = fx.file("events.jsonl");
    const cap = 20;
    const originalContent = mkLines(cap + 5, 120);
    const originalLineCount = countLines(originalContent);
    fs.writeFileSync(file, originalContent, "utf8");

    const res = rotateIfNeeded(file, cap, { root: fx.dir, allowUnregistered: true });
    assert.strictEqual(res.rotated, true, "should rotate when over cap");
    assert.strictEqual(res.reason, "archived");
    assert.ok(!fs.existsSync(file), "active file path should be gone after the archive move");

    const arch = archivedFiles(fx.dir);
    assert.strictEqual(arch.length, 1, "exactly one archive generation should exist");
    const archivedLineCount = countLines(fs.readFileSync(arch[0], "utf8"));
    assert.strictEqual(archivedLineCount, originalLineCount, "archive must carry ALL original lines");

    const idx = readIndex(fx.dir);
    assert.strictEqual(idx.length, 1, "an index entry must be written");
    assert.strictEqual(idx[0].origin, "events.jsonl", "index records the origin (relative)");
    assert.ok(idx[0].reason && idx[0].reason.startsWith("rotation:"), "index records the reason");

    // The next append recreates `file` fresh (caller's contract) — zero lines lost overall.
    const newLine = JSON.stringify({ i: "new-after-rotation" }) + "\n";
    fs.appendFileSync(file, newLine, "utf8");
    const newLineCount = countLines(fs.readFileSync(file, "utf8"));
    assert.strictEqual(newLineCount, 1, "fresh active file should carry only the new line");
    assert.strictEqual(
      archivedLineCount + newLineCount,
      originalLineCount + 1,
      "total lines across archive + fresh active == original + the one new append (zero lost)",
    );
  } finally {
    fx.cleanup();
  }
});

// ── 3. F-ROT-1: ≥2 generations — a second rotation NEVER clobbers the first ──
h.test("F-ROT-1: a second rotation creates a SECOND archive generation (no clobber)", () => {
  const fx = sealedDir({}, "rotate-two-gen");
  try {
    const file = fx.file("events.jsonl");
    const cap = 5;
    fs.writeFileSync(file, mkLines(cap + 3, 120), "utf8");
    let res = rotateIfNeeded(file, cap, { root: fx.dir, allowUnregistered: true });
    assert.strictEqual(res.rotated, true);
    const firstGen = fs.readFileSync(res.archived, "utf8");

    fs.writeFileSync(file, mkLines(cap + 10, 120), "utf8");
    res = rotateIfNeeded(file, cap, { root: fx.dir, allowUnregistered: true });
    assert.strictEqual(res.rotated, true);

    const arch = archivedFiles(fx.dir);
    assert.strictEqual(arch.length, 2, "BOTH generations must survive — no clobber (F-ROT-1)");
    // The first generation's content is still present verbatim in one of the two.
    const contents = arch.map((f) => fs.readFileSync(f, "utf8"));
    assert.ok(contents.includes(firstGen), "the first generation must NOT have been overwritten");
    assert.strictEqual(readIndex(fx.dir).length, 2, "two index entries — one per generation");
  } finally {
    fx.cleanup();
  }
});

// ── 4. F-ROT-2: SOUND pre-gate rotates a tiny-byte / high-line file ─────────
h.test("F-ROT-2: tiny 3-byte-per-line file over cap DOES rotate (sound floor)", () => {
  const fx = sealedDir({}, "rotate-sound-pregate");
  try {
    assert.strictEqual(MIN_BYTES_PER_LINE, 1, "the pre-gate floor must be the sound value 1");
    const file = fx.file("events.jsonl");
    const cap = 10;
    // 20 lines of `{}` (~3 bytes each ⇒ ~60 bytes). The OLD 50-byte/line floor
    // (threshold 10*50 = 500 bytes) would have skipped this file, so a genuinely
    // over-cap file never rotated (F-ROT-2). The sound floor (threshold = cap = 10
    // bytes) lets the real line count run: 20 lines >= cap ⇒ rotate.
    fs.writeFileSync(file, Array.from({ length: 20 }, () => "{}").join("\n") + "\n", "utf8");
    const res = rotateIfNeeded(file, cap, { root: fx.dir, allowUnregistered: true });
    assert.strictEqual(res.rotated, true, "an over-cap tiny-line file MUST rotate under the sound floor");
    assert.strictEqual(archivedFiles(fx.dir).length, 1);
  } finally {
    fx.cleanup();
  }
});

// ── 4b. pre-gate still spares a genuinely-small file (no premature read/rotate) ─
h.test("pre-gate: large bytes but few lines does not rotate; tiny file spared", () => {
  const fx = sealedDir({}, "rotate-pregate");
  try {
    const file = fx.file("events.jsonl");
    // few lines, big bytes — clears the pre-gate, real count is under cap.
    const content = mkLines(3, 300);
    fs.writeFileSync(file, content, "utf8");
    let res = rotateIfNeeded(file, 10, { root: fx.dir, allowUnregistered: true });
    assert.strictEqual(res.rotated, false, "few real lines under cap must not rotate");
    assert.strictEqual(fs.readFileSync(file, "utf8"), content, "content must be untouched");

    // tiny file under a big cap → below-pregate (no read).
    const file2 = fx.file("events2.jsonl");
    fs.writeFileSync(file2, mkLines(3), "utf8");
    res = rotateIfNeeded(file2, 20000, { root: fx.dir, allowUnregistered: true });
    assert.strictEqual(res.rotated, false);
    assert.strictEqual(res.reason, "below-pregate");
  } finally {
    fx.cleanup();
  }
});

// ── 5. F-ROT-3: at/over-cap boundary — exactly `cap` rotates, `cap-1` doesn't ─
h.test("F-ROT-3: exactly cap lines rotates (at/over); cap-1 does not", () => {
  const fx = sealedDir({}, "rotate-exact-cap");
  try {
    const cap = 12;
    const atCap = fx.file("at.jsonl");
    fs.writeFileSync(atCap, mkLines(cap, 40), "utf8"); // EXACTLY cap lines
    let res = rotateIfNeeded(atCap, cap, { root: fx.dir, allowUnregistered: true });
    assert.strictEqual(res.rotated, true, "exactly cap lines must rotate (>= cap)");

    const underCap = fx.file("under.jsonl");
    fs.writeFileSync(underCap, mkLines(cap - 1, 40), "utf8"); // cap-1 lines
    res = rotateIfNeeded(underCap, cap, { root: fx.dir, allowUnregistered: true });
    assert.strictEqual(res.rotated, false, "cap-1 lines must NOT rotate");
    assert.strictEqual(res.reason, "under-cap");
  } finally {
    fx.cleanup();
  }
});

// ── 6. F-ROT-4: rotateSink is CLOSED over SINK_CAPS — unknown path no-ops ────
h.test("F-ROT-4: rotateSink no-ops on an unknown (unregistered) path", () => {
  const fx = sealedDir({}, "rotate-sink-closure");
  try {
    const file = fx.file("not-a-known-sink.jsonl");
    fs.writeFileSync(file, mkLines(50, 200), "utf8"); // way over any default cap
    const res = rotateSink(file, { root: fx.dir, allowUnregistered: true });
    assert.strictEqual(res.rotated, false, "an unknown sink must never rotate");
    assert.strictEqual(res.reason, "unknown-sink");
    assert.strictEqual(archivedFiles(fx.dir).length, 0, "nothing archived for an unknown sink");
    assert.ok(fs.existsSync(file), "the unknown file is left untouched");
  } finally {
    fx.cleanup();
  }
});

// ── 6b. F-ROT-4 SEAM: the raw primitive refuses an unregistered path ────────
// The gauntlet holdout that reopened F-ROT-4: rotateIfNeeded/rotateBytesIfNeeded
// are public, and previously archive-moved ANY over-cap in-root path. The seam
// gate (archiveFile) now refuses an unregistered path unless allowUnregistered.
h.test("F-ROT-4 seam: rotateIfNeeded on an unregistered over-cap file is REFUSED without allowUnregistered", () => {
  const fx = sealedDir({}, "rotate-seam");
  try {
    const file = fx.file("arbitrary.jsonl");
    fs.writeFileSync(file, mkLines(30, 120), "utf8"); // over cap 5, clears the pre-gate
    const res = rotateIfNeeded(file, 5, { root: fx.dir }); // NO allowUnregistered
    assert.strictEqual(res.rotated, false, "an unregistered path must not be archive-moved at the seam");
    assert.strictEqual(res.reason, "unregistered-sink");
    assert.strictEqual(archivedFiles(fx.dir).length, 0, "nothing archived for an unregistered path");
    assert.ok(fs.existsSync(file), "the arbitrary file is left untouched");

    // The byte sibling is gated the same way.
    const bfile = fx.file("arbitrary.log");
    fs.writeFileSync(bfile, "x".repeat(5000), "utf8");
    const bres = rotateBytesIfNeeded(bfile, 1000, { root: fx.dir }); // NO allowUnregistered
    assert.strictEqual(bres.reason, "unregistered-sink");
    assert.ok(fs.existsSync(bfile));
  } finally {
    fx.cleanup();
  }
});

// ── 6c. stale-decision guard: verify UNDER the lock catches a resolved decision ─
h.test("stale-decision: a file that drops under cap between the pre-lock count and the lock is NOT archived", () => {
  const fx = sealedDir({}, "rotate-stale");
  try {
    const file = fx.file("events.jsonl");
    fs.writeFileSync(file, mkLines(30, 120), "utf8"); // real bytes clear the pre-gate + statSync
    const origRead = fs.readFileSync;
    let reads = 0;
    fs.readFileSync = () => {
      reads++;
      // 1st read = outer over-cap decision; 2nd read = verify under the lock (now under cap).
      return reads === 1 ? mkLines(30, 120) : mkLines(1);
    };
    let res;
    try {
      res = rotateIfNeeded(file, 5, { root: fx.dir, allowUnregistered: true });
    } finally {
      fs.readFileSync = origRead;
    }
    assert.strictEqual(res.rotated, false, "a decision resolved before the move must not archive");
    assert.strictEqual(res.reason, "resolved-under-lock");
    assert.strictEqual(archivedFiles(fx.dir).length, 0, "nothing archived when the re-check fails");
  } finally {
    fx.cleanup();
  }
});

// ── 7. fault-injection — archive move throws → falsy, NEVER throws ───────────
h.violation("archive move throwing surfaces as a falsy result, never a throw; source kept", () => {
  const fx = sealedDir({}, "rotate-fault-move");
  try {
    const file = fx.file("events.jsonl");
    const cap = 5;
    fs.writeFileSync(file, mkLines(cap + 5, 120), "utf8");
    const origRename = fs.renameSync;
    fs.renameSync = () => {
      throw new Error("injected move failure");
    };
    let res;
    let threw = false;
    try {
      res = rotateIfNeeded(file, cap, { root: fx.dir, allowUnregistered: true });
    } catch {
      threw = true;
    } finally {
      fs.renameSync = origRename;
    }
    assert.strictEqual(threw, false, "rotateIfNeeded must NEVER throw, even on a move fault");
    assert.strictEqual(res.rotated, false, "a move fault must surface as a falsy result");
    assert.ok(fs.existsSync(file), "the source must be KEPT when the archive move fails (no data loss)");
    return { ok: false }; // mark this h.violation as "correctly caught"
  } finally {
    fx.cleanup();
  }
});

// ── 8. missing / 0-byte file → no-op ────────────────────────────────────────
h.test("missing file is a no-op (falsy, no throw)", () => {
  const fx = sealedDir({}, "rotate-missing");
  try {
    const res = rotateIfNeeded(fx.file("does-not-exist.jsonl"), 10, { root: fx.dir, allowUnregistered: true });
    assert.strictEqual(res.rotated, false);
  } finally {
    fx.cleanup();
  }
});

h.test("0-byte file is a no-op", () => {
  const fx = sealedDir({}, "rotate-zero-byte");
  try {
    const file = fx.file("empty.jsonl");
    fs.writeFileSync(file, "", "utf8");
    const res = rotateIfNeeded(file, 1, { root: fx.dir, allowUnregistered: true });
    assert.strictEqual(res.rotated, false);
  } finally {
    fx.cleanup();
  }
});

// ── 9. rotateBytesIfNeeded — byte-cap sibling, archive semantics ─────────────
h.test("rotateBytesIfNeeded: under cap no-op, over cap archives", () => {
  const fx = sealedDir({}, "rotate-bytes");
  try {
    const file = fx.file("team-guard-debug.log");
    fs.writeFileSync(file, "x".repeat(1000), "utf8");
    let res = rotateBytesIfNeeded(file, 2000, { root: fx.dir, allowUnregistered: true });
    assert.strictEqual(res.rotated, false, "under cap must not rotate");

    fs.writeFileSync(file, "x".repeat(3000), "utf8");
    res = rotateBytesIfNeeded(file, 2000, { root: fx.dir, allowUnregistered: true });
    assert.strictEqual(res.rotated, true, "over cap must archive");
    assert.ok(!fs.existsSync(file), "active file moved to archive");
    const arch = archivedFiles(fx.dir);
    assert.strictEqual(arch.length, 1);
    assert.strictEqual(fs.readFileSync(arch[0], "utf8").length, 3000, "archive carries the full bytes");
  } finally {
    fx.cleanup();
  }
});

h.violation("rotateBytesIfNeeded fault-injection never throws", () => {
  const fx = sealedDir({}, "rotate-bytes-fault");
  try {
    const file = fx.file("team-guard-debug.log");
    fs.writeFileSync(file, "x".repeat(3000), "utf8");
    const origRename = fs.renameSync;
    fs.renameSync = () => {
      throw new Error("injected");
    };
    let res;
    let threw = false;
    try {
      res = rotateBytesIfNeeded(file, 2000, { root: fx.dir, allowUnregistered: true });
    } catch {
      threw = true;
    } finally {
      fs.renameSync = origRename;
    }
    assert.strictEqual(threw, false);
    assert.strictEqual(res.rotated, false);
    return { ok: false };
  } finally {
    fx.cleanup();
  }
});

// ── Bonus: SINK_CAPS shape + per-class caps (amendment #2) ──────────────────
h.test("SINK_CAPS carries per-class caps (amendment #2)", () => {
  assert.strictEqual(DEFAULT_JSONL_CAP_LINES, 20000);
  const entries = Object.values(SINK_CAPS);
  assert.ok(entries.length > 0, "SINK_CAPS should not be empty in a real checkout");
  assert.ok(entries.every((e) => e.kind === "lines" || e.kind === "bytes"), "recognized kinds only");
  assert.ok(entries.every((e) => typeof e.class === "string" && CAP_CLASSES[e.class]), "every sink carries a known class");
  // Distinct classes really do carry distinct caps (not a uniform 20k).
  const caps = new Set(Object.values(CAP_CLASSES).map((c) => c.cap));
  assert.ok(caps.size > 1, "the classes must not all share one cap");
});

h.done();
