#!/usr/bin/env node
"use strict";

/**
 * Isolated P5 test for rotate.js. Proves:
 *   1. below-cap no-op — file untouched
 *   2. at/over-cap rotates to `.1`; ZERO lines lost across the rename +
 *      the next append (pre-count == .1 lines + new lines)
 *   3. cheap-stat pre-gate does NOT rotate a large-bytes/low-lines file
 *      prematurely (proceeds to the real line count, which is under cap)
 *   4. fault-injection (rename / read throws) → returns falsy, NEVER throws
 *   5. missing / 0-byte file → no-op
 *   6. rotateBytesIfNeeded — the byte-cap sibling, same shape
 *
 * Real filesystem, sealed temp dirs (via fixture-harness's sealedDir) — this
 * module operates on actual files, not an in-memory pure-evaluate shape, so
 * the harness's `test`/`violation`/`failClosed` runners (not `pass`, whose
 * isPass() interpreter expects an enforcer-style {ok/violations/...} shape)
 * drive assert-based assertions directly.
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
  MIN_BYTES_PER_LINE,
  DEFAULT_JSONL_CAP_LINES,
  SINK_CAPS,
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

// ── 1. below-cap no-op — untouched ──────────────────────────────────────────
h.test("below-cap: file untouched, content identical", () => {
  const fx = sealedDir({}, "rotate-below-cap");
  try {
    const file = fx.file("events.jsonl");
    const content = mkLines(5);
    fs.writeFileSync(file, content, "utf8");
    const res = rotateIfNeeded(file, 20000);
    assert.strictEqual(res.rotated, false, "should not rotate below cap");
    assert.strictEqual(fs.readFileSync(file, "utf8"), content, "content must be byte-identical");
    assert.ok(!fs.existsSync(file + ".1"), "no .1 generation should be created");
  } finally {
    fx.cleanup();
  }
});

// ── 2. at/over-cap rotates; ZERO lines lost across rename + next append ────
h.test("over-cap: rotates to .1, next append recreates fresh, zero lines lost", () => {
  const fx = sealedDir({}, "rotate-over-cap");
  try {
    const file = fx.file("events.jsonl");
    const cap = 20;
    // Pad each line so total size clears the cheap pre-gate threshold
    // (cap * MIN_BYTES_PER_LINE) comfortably, mirroring real event lines.
    const originalContent = mkLines(cap + 5, 120);
    const originalLineCount = countLines(originalContent);
    fs.writeFileSync(file, originalContent, "utf8");

    const res = rotateIfNeeded(file, cap);
    assert.strictEqual(res.rotated, true, "should rotate when over cap");
    assert.ok(!fs.existsSync(file), "active file path should be gone immediately after rename");
    assert.ok(fs.existsSync(file + ".1"), ".1 generation should exist");
    const rotatedLineCount = countLines(fs.readFileSync(file + ".1", "utf8"));
    assert.strictEqual(rotatedLineCount, originalLineCount, ".1 must carry ALL original lines");

    // The next append recreates `file` fresh (caller's responsibility, per
    // contract) — simulate it and prove zero lines lost overall.
    const newLine = JSON.stringify({ i: "new-after-rotation" }) + "\n";
    fs.appendFileSync(file, newLine, "utf8");
    const newLineCount = countLines(fs.readFileSync(file, "utf8"));
    assert.strictEqual(newLineCount, 1, "fresh active file should carry only the new line");
    assert.strictEqual(
      rotatedLineCount + newLineCount,
      originalLineCount + 1,
      "total lines across .1 + fresh active == original + the one new append (zero lost)",
    );
  } finally {
    fx.cleanup();
  }
});

// ── 2b. overwrite semantics: exactly ONE generation kept ────────────────────
h.test("a second rotation overwrites the prior .1 (exactly one generation)", () => {
  const fx = sealedDir({}, "rotate-one-gen");
  try {
    const file = fx.file("events.jsonl");
    const cap = 5;
    fs.writeFileSync(file, mkLines(cap + 3, 120), "utf8");
    let res = rotateIfNeeded(file, cap);
    assert.strictEqual(res.rotated, true);
    const firstGen = fs.readFileSync(file + ".1", "utf8");

    fs.writeFileSync(file, mkLines(cap + 10, 120), "utf8");
    res = rotateIfNeeded(file, cap);
    assert.strictEqual(res.rotated, true);
    const secondGen = fs.readFileSync(file + ".1", "utf8");
    assert.notStrictEqual(secondGen, firstGen, "the .1 generation should have been overwritten");
    assert.strictEqual(countLines(secondGen), cap + 10);
  } finally {
    fx.cleanup();
  }
});

// ── 3. cheap-stat pre-gate does NOT rotate a large-bytes/low-lines file ─────
h.test("pre-gate: large bytes but few lines does not rotate prematurely", () => {
  const fx = sealedDir({}, "rotate-pregate");
  try {
    const file = fx.file("events.jsonl");
    const cap = 10;
    // 3 lines, each padded to 300 bytes ⇒ ~900 bytes total, clears the
    // cheap pre-gate threshold (cap * MIN_BYTES_PER_LINE = 10*50 = 500), so
    // the real line count runs — and 3 lines is well under cap=10, so it
    // must NOT rotate.
    const content = mkLines(3, 300);
    assert.ok(
      Buffer.byteLength(content, "utf8") >= cap * MIN_BYTES_PER_LINE,
      "fixture must clear the pre-gate threshold to exercise the real line count",
    );
    fs.writeFileSync(file, content, "utf8");
    const res = rotateIfNeeded(file, cap);
    assert.strictEqual(res.rotated, false, "few real lines under cap must not rotate");
    assert.strictEqual(fs.readFileSync(file, "utf8"), content, "content must be untouched");
  } finally {
    fx.cleanup();
  }
});

h.test("pre-gate: tiny file below the byte floor never reads/rotates", () => {
  const fx = sealedDir({}, "rotate-pregate-tiny");
  try {
    const file = fx.file("events.jsonl");
    const cap = 20000; // threshold = 20000*50 = 1,000,000 bytes
    fs.writeFileSync(file, mkLines(3), "utf8"); // a few hundred bytes only
    const res = rotateIfNeeded(file, cap);
    assert.strictEqual(res.rotated, false);
    assert.strictEqual(res.reason, "below-pregate");
  } finally {
    fx.cleanup();
  }
});

// ── 4. fault-injection — NEVER throws, returns falsy ────────────────────────
h.violation("rename throwing surfaces as a falsy result, never a throw", () => {
  const fx = sealedDir({}, "rotate-fault-rename");
  try {
    const file = fx.file("events.jsonl");
    const cap = 5;
    fs.writeFileSync(file, mkLines(cap + 5, 120), "utf8");
    const origRename = fs.renameSync;
    fs.renameSync = () => {
      throw new Error("injected rename failure");
    };
    let res;
    let threw = false;
    try {
      res = rotateIfNeeded(file, cap);
    } catch {
      threw = true;
    } finally {
      fs.renameSync = origRename;
    }
    // { ok: true } (isPass=true, a "pass") would mean the planted fault WAS
    // handled safely — but this is a violation() assertion, so we invert:
    // we WANT the safe outcome (no throw, falsy rotated) to register as
    // "not a pass" is wrong framing — assert directly instead and return a
    // shape isPass() reads as a fail (throwing) if our own assertion fails.
    assert.strictEqual(threw, false, "rotateIfNeeded must NEVER throw, even on a fs fault");
    assert.strictEqual(res.rotated, false, "a fault must surface as a falsy rotated result");
    return { ok: false }; // mark this h.violation as "correctly caught" (see harness semantics)
  } finally {
    fx.cleanup();
  }
});

h.violation("readFileSync throwing after the pre-gate also returns falsy, never throws", () => {
  const fx = sealedDir({}, "rotate-fault-read");
  try {
    const file = fx.file("events.jsonl");
    const cap = 5;
    fs.writeFileSync(file, mkLines(cap + 5, 120), "utf8");
    const origRead = fs.readFileSync;
    fs.readFileSync = () => {
      throw new Error("injected read failure");
    };
    let res;
    let threw = false;
    try {
      res = rotateIfNeeded(file, cap);
    } catch {
      threw = true;
    } finally {
      fs.readFileSync = origRead;
    }
    assert.strictEqual(threw, false, "rotateIfNeeded must NEVER throw, even on a fs fault");
    assert.strictEqual(res.rotated, false, "a fault must surface as a falsy rotated result");
    return { ok: false };
  } finally {
    fx.cleanup();
  }
});

// ── 5. missing / 0-byte file → no-op ────────────────────────────────────────
h.test("missing file is a no-op (falsy, no throw)", () => {
  const fx = sealedDir({}, "rotate-missing");
  try {
    const file = fx.file("does-not-exist.jsonl");
    const res = rotateIfNeeded(file, 10);
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
    const res = rotateIfNeeded(file, 1);
    assert.strictEqual(res.rotated, false);
  } finally {
    fx.cleanup();
  }
});

// ── 6. rotateBytesIfNeeded — byte-cap sibling ───────────────────────────────
h.test("rotateBytesIfNeeded: under cap no-op, over cap rotates", () => {
  const fx = sealedDir({}, "rotate-bytes");
  try {
    const file = fx.file("team-guard-debug.log");
    fs.writeFileSync(file, "x".repeat(1000), "utf8");
    let res = rotateBytesIfNeeded(file, 2000);
    assert.strictEqual(res.rotated, false, "under cap must not rotate");

    fs.writeFileSync(file, "x".repeat(3000), "utf8");
    res = rotateBytesIfNeeded(file, 2000);
    assert.strictEqual(res.rotated, true, "over cap must rotate");
    assert.ok(fs.existsSync(file + ".1"));
    assert.strictEqual(fs.readFileSync(file + ".1", "utf8").length, 3000);
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
      res = rotateBytesIfNeeded(file, 2000);
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

// ── Bonus: SINK_CAPS shape sanity (single source of truth) ─────────────────
h.test("SINK_CAPS carries the expected default line cap", () => {
  assert.strictEqual(DEFAULT_JSONL_CAP_LINES, 20000);
  const kinds = Object.values(SINK_CAPS).map((e) => e.kind);
  assert.ok(kinds.length > 0, "SINK_CAPS should not be empty in a real checkout");
  assert.ok(kinds.every((k) => k === "lines" || k === "bytes"), "every entry has a recognized kind");
});

h.done();
