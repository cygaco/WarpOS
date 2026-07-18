#!/usr/bin/env node
"use strict";

/**
 * Isolated P5 test for reader-discipline.js (SP-20260718-002 · C4 · AC-12).
 *
 * Proves the sound-DIRECTION check has teeth AND zero false positives:
 *   - a CLEAN fixture (only allowlisted readers + non-readers) → ok / exit 0;
 *   - a SEEDED non-allowlisted reader of the events literal → not-ok / exit non-zero,
 *     and the offending file is NAMED (the teeth-proving negative control);
 *   - an allowlisted reader containing the literal is NOT flagged (allowlist works);
 *   - a COMMENT-only or WRITE-only mention is NOT flagged (precision);
 *   - an unreadable file record fails CLOSED.
 *
 *   node scripts/checks/reader-discipline.test.js
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { spawnSync } = require("child_process");
const { harness, sealedDir } = require("./lib/fixture-harness");
const { evaluate, findReads, isSanctioned, stripComments, scan } = require("./reader-discipline");

const h = harness("reader-discipline");
const CHECK = path.join(__dirname, "reader-discipline.js");

// A realistic hand-rolled full-log read (the class the check must catch).
const BAD_READ = 'const fs = require("fs");\nconst raw = fs.readFileSync(PATHS.eventsFile, "utf8");\n';
// Same read, but this file is an ALLOWLISTED sanctioned reader.
const ALLOWLISTED_READ = 'const raw = fs.readFileSync(PATHS.eventsFile, "utf8");\n';
// A clean consumer — never touches the events log.
const CLEAN = 'module.exports = function add(a, b) {\n  return a + b;\n};\n';

// ── Known-answer: clean fixture (allowlisted reader + non-reader) passes ──────
h.pass("clean fixture — allowlisted reader + non-reader → ok", () =>
  evaluate({
    files: [
      { path: "scripts/events/cli.js", content: ALLOWLISTED_READ },
      { path: "scripts/analytics/report.js", content: CLEAN },
    ],
  }));

// ── PLANTED VIOLATION: a non-allowlisted file reading the events literal ──────
h.violation("seeded non-allowlisted reader of the events literal → not-ok", () =>
  evaluate({ files: [{ path: "scripts/analytics/recap.js", content: BAD_READ }] }));

// ...and it NAMES the offending file (teeth: the report must point at it).
h.test("the seeded violation names the offending file:line", () => {
  const res = evaluate({ files: [{ path: "scripts/analytics/recap.js", content: BAD_READ }] });
  assert.strictEqual(res.ok, false, "a non-allowlisted reader must not read green");
  const off = res.offenders.find((o) => o.path === "scripts/analytics/recap.js");
  assert.ok(off, "the offender list must name the file");
  assert.strictEqual(off.reason, "unsanctioned-reader");
  assert.ok(off.hits && off.hits[0] && off.hits[0].line === 2, "reports the read at its line");
});

// ── Allowlist works: the SAME read on an allowlisted path is NOT flagged ──────
h.pass("an allowlisted reader containing the literal is NOT flagged", () =>
  evaluate({ files: [{ path: "scripts/events/cli.js", content: BAD_READ }] }));

h.pass("every allowlisted path + *.test.js + the scanner itself is sanctioned", () => {
  for (const p of [
    "scripts/events/cli.js",
    "scripts/hooks/lib/logger.js",
    "scripts/hooks/lib/rotate.js",
    "scripts/hooks/lib/archive.js",
    "scripts/hooks/lib/retention.js",
    "scripts/materialize-decisions.js",
    "scripts/state/materialize.js",
    "scripts/state/materialize-core.js",
    "scripts/events/events-compact.js",
    "scripts/events/events-compact.test.js",
    "scripts/anything/deep/foo.test.js",
    "scripts/checks/reader-discipline.js",
  ]) {
    assert.ok(isSanctioned(p), `${p} should be sanctioned`);
  }
  assert.ok(!isSanctioned("scripts/analytics/recap.js"), "a random consumer is NOT sanctioned");
  return true;
});

// ── Precision: a COMMENT-only mention is NOT a read (zero false positives) ────
h.pass("a comment mentioning fs.readFileSync(paths.eventsFile) is NOT flagged", () =>
  evaluate({
    files: [
      {
        path: "scripts/analytics/note.js",
        content:
          "// do NOT fs.readFileSync(paths.eventsFile) — use events:query instead\n" +
          "/* banned: readJsonl(EVENTS_FILE) */\nmodule.exports = 1;\n",
      },
    ],
  }));

// ── Precision: a WRITE to the events file is NOT a read ───────────────────────
h.pass("an appendFileSync WRITE to paths.eventsFile is NOT flagged as a read", () =>
  evaluate({
    files: [{ path: "scripts/emit.js", content: 'fs.appendFileSync(PATHS.eventsFile, line);\n' }],
  }));

// ── findReads detects each sanctioned token form (verb × token coverage) ──────
h.test("findReads matches events.jsonl / .eventsFile / EVENTS_FILE / readJsonl forms", () => {
  assert.strictEqual(findReads('x = fs.readFileSync(EVENTS_FILE, "utf8")').length, 1, "EVENTS_FILE");
  assert.strictEqual(findReads('x = fs.readFileSync(PATHS.eventsFile)').length, 1, ".eventsFile");
  assert.strictEqual(
    findReads('readJsonl(path.join(ROOT, "events/events.jsonl"))').length,
    1,
    "events.jsonl via readJsonl through nested parens",
  );
  assert.strictEqual(
    findReads('readJsonl(path.join(ROOT, paths.eventsFile || "x/events.jsonl"))').length,
    1,
    "readJsonl with .eventsFile fallback",
  );
  // A bare mention with no read-call form is NOT a hit.
  assert.strictEqual(findReads('const p = PATHS.eventsFile; // held in a var').length, 0, "no read verb");
  // The undecidable residual (ED-222): a computed path read on a later line is NOT caught.
  assert.strictEqual(
    findReads("const p = PATHS.eventsFile;\nfs.readFileSync(p);").length,
    0,
    "computed-path read is the ED-222 residual — intentionally not caught",
  );
});

h.test("stripComments removes line + block comments but preserves line count", () => {
  const src = "a\n// c\n/* b\nb */ x\nd";
  const out = stripComments(src);
  assert.strictEqual(out.split("\n").length, src.split("\n").length, "line count preserved");
  assert.ok(!/c/.test(out), "line comment stripped");
  assert.ok(/x/.test(out), "code after a block-close survives");
});

// ── Fail-closed: an unreadable file record is ALWAYS an offender ──────────────
h.violation("an unreadable file record fails CLOSED (never silently skipped)", () =>
  evaluate({ files: [{ path: "scripts/analytics/raced.js", unreadable: true }] }));

h.violation("a malformed file record (no path) fails CLOSED", () =>
  evaluate({ files: [{ content: BAD_READ }] }));

// ── CLI TEETH (process-level negative control): --enforce exit codes ──────────
h.test("CLI --enforce exits NON-ZERO on a sealed seeded violation and names it", () => {
  const fx = sealedDir({
    "scripts/analytics/recap.js": BAD_READ,
    "scripts/events/cli.js": ALLOWLISTED_READ, // allowlisted — must be ignored
    "scripts/analytics/clean.js": CLEAN,
  });
  try {
    const r = spawnSync(process.execPath, [CHECK, "--enforce", "--root", fx.dir], { encoding: "utf8" });
    assert.strictEqual(r.status, 1, `expected exit 1, got ${r.status} (stderr: ${r.stderr})`);
    assert.ok(/scripts\/analytics\/recap\.js/.test(r.stderr), "names the offender");
    assert.ok(!/scripts\/events\/cli\.js/.test(r.stderr), "does NOT flag the allowlisted reader");
  } finally {
    fx.cleanup();
  }
});

h.test("CLI --enforce exits 0 on a sealed CLEAN tree (only sanctioned + non-readers)", () => {
  const fx = sealedDir({
    "scripts/events/cli.js": ALLOWLISTED_READ,
    "scripts/analytics/clean.js": CLEAN,
    "scripts/foo.test.js": BAD_READ, // *.test.js is sanctioned even while reading
  });
  try {
    const r = spawnSync(process.execPath, [CHECK, "--enforce", "--root", fx.dir], { encoding: "utf8" });
    assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status} (stderr: ${r.stderr})`);
  } finally {
    fx.cleanup();
  }
});

h.test("CLI default (no --enforce) is REPORT-ONLY — exit 0 even with a violation present", () => {
  const fx = sealedDir({ "scripts/analytics/recap.js": BAD_READ });
  try {
    const r = spawnSync(process.execPath, [CHECK, "--root", fx.dir], { encoding: "utf8" });
    assert.strictEqual(r.status, 0, `report-only must exit 0, got ${r.status}`);
    assert.ok(/recap\.js/.test(r.stderr), "still reports the finding");
  } finally {
    fx.cleanup();
  }
});

// ── BR-8/SEC-5 (gauntlet R1): a missing/non-dir scripts path fails CLOSED, never a green scanned:0 ──
h.test("BR-8: scan() on a root with NO scripts dir throws (fail-closed), not a green scanned:0", () => {
  const fx = sealedDir({ "docs/readme.md": "no scripts here\n" }, "reader-discipline-noscripts");
  try {
    assert.ok(!fs.existsSync(path.join(fx.dir, "scripts")), "precondition: no scripts dir");
    assert.throws(
      () => scan(fx.dir),
      /scripts dir not found|not a directory/i,
      "a wrong --root (no scripts dir) must be a RUNNER ERROR, not a clean scanned:0",
    );
  } finally {
    fx.cleanup();
  }
});

h.test("BR-8: the CLI exits 2 (fail-closed) when the scripts dir is missing", () => {
  const fx = sealedDir({ "docs/readme.md": "x\n" }, "reader-discipline-cli-noscripts");
  try {
    const r = spawnSync(process.execPath, [path.join(__dirname, "reader-discipline.js"), "--root", fx.dir, "--json"], {
      encoding: "utf8",
    });
    assert.strictEqual(r.status, 2, "runner error → exit 2 (fail-closed)");
    assert.ok(/scripts dir not found|not a directory/i.test((r.stdout || "") + (r.stderr || "")), "explicit runner-error message");
  } finally {
    fx.cleanup();
  }
});

h.done();
