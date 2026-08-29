"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const {
  analyzeSource,
  oldNaiveDetect,
  cleanSource,
  runAudit,
  walkJsFiles,
  getWiredStatus,
} = require("./gate-failclosed-audit.js");

const FIXTURE_DIR = path.join(
  __dirname,
  "..",
  "..",
  "runtime",
  "enforcer-fixtures",
  "SP-20260829-001",
);

// Ground truth per fixture, keyed by filename. `true` = the handler CAN
// reach a permissive outcome (should be flagged); `false` = it cannot (must
// NOT be flagged). Each entry documents which of the earlier probe's two
// failure directions (false-negative / false-positive) it demonstrates.
const FIXTURES = [
  { file: "fn-nested-brace.js", expected: true, class: "false-negative" },
  { file: "fn-long-handler.js", expected: true, class: "false-negative" },
  { file: "fn-spacing-variant.js", expected: true, class: "false-negative" },
  { file: "fn-quoted-reordered-key.js", expected: true, class: "false-negative" },
  { file: "fp-string-literal.js", expected: false, class: "false-positive" },
  { file: "fp-method-named-catch.js", expected: false, class: "false-positive" },
  { file: "fp-unreachable-after-throw.js", expected: false, class: "false-positive" },
  { file: "fp-false-value.js", expected: false, class: "false-positive" },
];

function readFixture(name) {
  return fs.readFileSync(path.join(FIXTURE_DIR, name), "utf8");
}

test("fixture files exist and are non-empty (sanity — a missing fixture must not silently read as empty-source-clean)", () => {
  for (const f of FIXTURES) {
    const p = path.join(FIXTURE_DIR, f.file);
    assert.ok(fs.existsSync(p), `missing fixture: ${f.file}`);
    const content = fs.readFileSync(p, "utf8");
    assert.ok(content.length > 20, `fixture suspiciously short: ${f.file}`);
  }
});

for (const f of FIXTURES) {
  test(`NEW detector: ${f.file} (${f.class}) — expected flagged=${f.expected}`, () => {
    const src = readFixture(f.file);
    const findings = analyzeSource(src);
    const flagged = findings.length > 0;
    assert.equal(
      flagged,
      f.expected,
      `analyzeSource(${f.file}) findings=${JSON.stringify(findings)}`,
    );
  });

  test(`OLD naive-regex predicate is OBSERVED RED on: ${f.file} (proves the fixture actually discriminates)`, () => {
    const src = readFixture(f.file);
    const oldFlagged = oldNaiveDetect(src);
    // The old (pre-lexer) regex shape must get this case WRONG — that is
    // precisely what makes it a near-miss fixture. If the old predicate
    // happened to agree with ground truth, this fixture would prove
    // nothing about the new detector's improvement.
    assert.notEqual(
      oldFlagged,
      f.expected,
      `old predicate agreed with ground truth on ${f.file} — this fixture no longer discriminates`,
    );
  });
}

test("no-op mutation guard: a predicate that does nothing differently must still be caught wrong by every fixture", () => {
  // A "mutation" that doesn't actually change behavior (identity wrapper
  // around the old predicate) must still disagree with ground truth on
  // every fixture, exactly like the un-wrapped old predicate. If it didn't,
  // the fixture assertions above would be vacuously true regardless of
  // what's under test — this guard proves they are NOT vacuous.
  const noOpWrapped = (src) => oldNaiveDetect(src); // no-op: identical behavior
  let disagreements = 0;
  for (const f of FIXTURES) {
    const src = readFixture(f.file);
    const a = oldNaiveDetect(src);
    const b = noOpWrapped(src);
    assert.equal(a, b, `no-op wrapper changed behavior on ${f.file} — wrapper is not actually a no-op`);
    if (b !== f.expected) disagreements++;
  }
  assert.equal(
    disagreements,
    FIXTURES.length,
    "no-op-wrapped old predicate must disagree with ground truth on ALL 8 fixtures, same as the bare old predicate",
  );
});

test("real brace matching: nested handler >1 level deep with mixed delimiters still finds process.exit(0)", () => {
  const src = `
    function h() {
      try {
        go();
      } catch (e) {
        if (a) {
          for (const x of [1,2,3]) {
            if (x) { doThing({ nested: { deeper: [1,2,{x:3}] } }); }
          }
        }
        process.exit(0);
      }
    }
  `;
  const findings = analyzeSource(src);
  assert.ok(findings.length > 0, "expected a finding through multi-level nesting");
});

test("catch with no binding (optional catch binding, ES2019) is still recognized as a real catch clause", () => {
  const src = `
    function h() {
      try {
        go();
      } catch {
        process.exit(0);
      }
    }
  `;
  const findings = analyzeSource(src);
  assert.equal(findings.length, 1);
});

test("try without a following catch (try/finally only) produces no finding and does not throw", () => {
  const src = `
    function h() {
      try {
        go();
      } finally {
        process.exit(0);
      }
    }
  `;
  assert.doesNotThrow(() => analyzeSource(src));
  const findings = analyzeSource(src);
  assert.equal(findings.length, 0);
});

test("cleanSource masks string/comment/template-text content but preserves length and code", () => {
  const src = 'const s = "process.exit(0)"; // comment with { brace\nconst t = `plain ${1+1} text`;';
  const clean = cleanSource(src);
  assert.equal(clean.length, src.length);
  assert.ok(!clean.includes("process.exit"), "string content should be masked in clean buffer");
  assert.ok(clean.includes("1+1"), "template ${...} expression code must remain live, not masked");
});

test("blindness guard 1: zero successfully-read files under an empty/nonexistent root yields UNKNOWN, exit 2, never clean", () => {
  const emptyRoot = path.join(__dirname, "..", "..", "runtime", "enforcer-fixtures", "SP-20260829-001", "__does_not_exist__");
  const { exitCode, report } = runAudit(emptyRoot);
  assert.equal(exitCode, 2);
  assert.equal(report.status, "unknown");
  assert.equal(report.files_scanned, 0);
});

test("blindness guard 1b: a dangling symlink (or unreadable file) does not count toward files_scanned", (t) => {
  const tmpDir = path.join(__dirname, "..", "..", "runtime", "enforcer-fixtures", "SP-20260829-001", "__tmp_symlink_test__");
  fs.mkdirSync(tmpDir, { recursive: true });
  const target = path.join(tmpDir, "does-not-exist-target.js");
  const linkPath = path.join(tmpDir, "dangling-link.js");
  try {
    fs.symlinkSync(target, linkPath, "file");
  } catch (e) {
    // Symlink creation itself can require elevated privileges on some
    // Windows configurations. If we can't even create the fixture, we
    // cannot assess this guard on this machine — skip rather than fabricate.
    fs.rmSync(tmpDir, { recursive: true, force: true });
    t.skip("could not create a symlink on this machine/permission set — guard not assessable here");
    return;
  }
  const { scanned, unreadable } = walkJsFiles(tmpDir);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  assert.equal(scanned.length, 0, "dangling symlink must not count as successfully scanned");
  assert.ok(unreadable.length >= 1, "dangling symlink must be recorded as unreadable, not silently dropped");
});

test("blindness guard 2: unreadable/malformed settings.json yields wired='unknown', never collapsed to false", () => {
  // Point at a directory whose .claude/settings.json does not exist.
  const fakeRepoRoot = path.join(__dirname, "..", "..", "runtime", "enforcer-fixtures", "SP-20260829-001");
  const status = getWiredStatus(fakeRepoRoot, "scripts/checks/gate-failclosed-audit.js");
  assert.equal(status, "unknown", "missing settings.json must yield 'unknown', not false");
});

test("real-repo self-scan produces a list (never a bare count) and reports the ceiling text", () => {
  const { report } = runAudit("scripts/checks");
  assert.ok(Array.isArray(report.findings));
  assert.ok(typeof report.ceiling === "string" && report.ceiling.length > 0);
  assert.ok(typeof report.property === "string" && report.property.length > 0);
  // every finding must carry file:line, never a bare count
  for (const f of report.findings) {
    assert.ok(f.file && typeof f.line === "number");
  }
});
