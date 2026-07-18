#!/usr/bin/env node
"use strict";
/**
 * Bite-test for contract-lint.js (G0.1) — the R1 fail-closed negative fixtures
 * (malformed / unresolvable-ref / missing-ed / core-waived-by-ed, AC-4/AC-5)
 * plus the positive self-host assertion (the real contract must lint clean).
 *
 *   node scripts/checks/contract-lint.test.js
 */
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { evaluate, run, findBlocks, resolveEnforcer, H1_SENTENCE } = require("./contract-lint");

// Anchor on __dirname (this test file's own location), never a possibly-stale
// CLAUDE_PROJECT_DIR — see contract-lint.js's resolveRoot() for the rationale.
const ROOT = path.resolve(__dirname, "..", "..");
const FIXTURES_DIR = path.join(ROOT, ".claude", "kernel", "fixtures", "contract-lint");

let passed = 0;
const failures = [];
function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
}

function readFixture(name) {
  return fs.readFileSync(path.join(FIXTURES_DIR, name), "utf8");
}

// ── R1 negative fixtures (AC-4): malformed / unresolvable-ref / missing-ed → exit 2, DISTINCT from clean 0. ──

test("malformed.md: zero policy blocks -> exit 2 (structural, fail-closed)", () => {
  const res = run({ docPath: path.join(FIXTURES_DIR, "malformed.md") });
  assert.strictEqual(res.exitCode, 2, JSON.stringify(res));
  assert.ok(res.structural.some((s) => s.reason === "no-policy-blocks"), JSON.stringify(res.structural));
});

test("unresolvable-ref.md: Enforcer ref does not resolve -> exit 2 (structural, fail-closed)", () => {
  const res = run({ docPath: path.join(FIXTURES_DIR, "unresolvable-ref.md") });
  assert.strictEqual(res.exitCode, 2, JSON.stringify(res));
  assert.ok(
    res.structural.some((s) => s.reason === "unresolvable-enforcer"),
    JSON.stringify(res.structural),
  );
});

test("missing-ed.md: cited ED absent from ledger -> exit 2 (structural, fail-closed)", () => {
  const res = run({ docPath: path.join(FIXTURES_DIR, "missing-ed.md") });
  assert.strictEqual(res.exitCode, 2, JSON.stringify(res));
  assert.ok(
    res.structural.some((s) => s.reason === "missing-ed" && s.ed === "ED-999999"),
    JSON.stringify(res.structural),
  );
});

// ── R1/AC-5 negative fixture: core-waived-by-ed -> exit 1 (POLICY fail, distinct from the exit-2 structural trio). ──

test("core-waived-by-ed.md: CORE block waived by a Deferred ED -> exit 1 (policy-FAIL, NOT exit 2)", () => {
  const res = run({ docPath: path.join(FIXTURES_DIR, "core-waived-by-ed.md") });
  assert.strictEqual(res.exitCode, 1, JSON.stringify(res));
  assert.strictEqual(res.structural.length, 0, "this fixture must NOT trip a structural failure: " + JSON.stringify(res.structural));
  assert.ok(
    res.policy.some((p) => p.reason === "core-waived" && p.core === "CORE-1"),
    JSON.stringify(res.policy),
  );
});

// ── The four negative cases must never share the same "clean" exit code, and the trio must be distinct from the ED-5 policy case. ──

test("all four R1 negative fixtures are non-zero AND the structural trio is distinct from the policy-fail case", () => {
  const malformed = run({ docPath: path.join(FIXTURES_DIR, "malformed.md") });
  const unresolvable = run({ docPath: path.join(FIXTURES_DIR, "unresolvable-ref.md") });
  const missingEd = run({ docPath: path.join(FIXTURES_DIR, "missing-ed.md") });
  const coreWaived = run({ docPath: path.join(FIXTURES_DIR, "core-waived-by-ed.md") });
  for (const r of [malformed, unresolvable, missingEd, coreWaived]) {
    assert.notStrictEqual(r.exitCode, 0, "must never clean-pass on a negative fixture");
  }
  assert.strictEqual(malformed.exitCode, 2);
  assert.strictEqual(unresolvable.exitCode, 2);
  assert.strictEqual(missingEd.exitCode, 2);
  assert.strictEqual(coreWaived.exitCode, 1);
});

// ── Positive self-host: the REAL contract must lint clean. ──

test("self-host: the real top-level-runtime-contract.md lints clean (exit 0)", () => {
  const res = run();
  assert.strictEqual(res.exitCode, 0, JSON.stringify({ structural: res.structural, policy: res.policy }));
  assert.strictEqual(res.structural.length, 0);
  assert.strictEqual(res.policy.length, 0);
});

// ── Pure-core unit coverage on findBlocks + evaluate, independent of fs. ──

test("findBlocks: a doc with one block and one trailer parses to exactly one block", () => {
  const doc = ["## §1 — Title", "", "#### P1.1 — A block", "body", "Core: non-waivable", "", "## §2 — Next"].join(
    "\n",
  );
  const blocks = findBlocks(doc.split("\n"));
  assert.strictEqual(blocks.length, 1);
  assert.strictEqual(blocks[0].id, "P1.1");
});

test("evaluate: a block with TWO trailers is malformed (structural, exit 2)", () => {
  const doc = ["#### P1.1 — Two trailers", "Enforcer: scripts/checks/log-sink-caps.js", "Core: non-waivable"].join(
    "\n",
  );
  const res = evaluate({
    docText: doc,
    ledgerIds: new Set(),
    fixtureCount: 1,
    rootDir: ROOT,
  });
  assert.strictEqual(res.exitCode, 2);
  assert.ok(res.structural.some((s) => s.reason === "malformed-block-trailer"));
});

test("evaluate: a block with ZERO trailers is malformed (structural, exit 2)", () => {
  const doc = ["#### P1.1 — No trailer", "just prose, no trailer line here"].join("\n");
  const res = evaluate({ docText: doc, ledgerIds: new Set(), fixtureCount: 1, rootDir: ROOT });
  assert.strictEqual(res.exitCode, 2);
  assert.ok(res.structural.some((s) => s.reason === "malformed-block-trailer" && s.found === 0));
});

test("evaluate: ledger read failure is fail-closed (structural, exit 2) even with an otherwise-clean doc", () => {
  const doc = ["#### P1.1 — Fine block", "Core: non-waivable"].join("\n");
  const res = evaluate({ docText: doc, ledgerIds: null, ledgerError: "ENOENT", fixtureCount: 1, rootDir: ROOT });
  assert.strictEqual(res.exitCode, 2);
  assert.ok(res.structural.some((s) => s.reason === "ledger-unreadable"));
});

test("evaluate: fixture count zero is a POLICY fail (exit 1), not structural", () => {
  const doc = [
    "#### P7.1 — CORE-1",
    "**core_id:** CORE-1",
    "**waivable:** false",
    "Core: non-waivable",
    "#### P7.2 — CORE-2",
    "**core_id:** CORE-2",
    "**waivable:** false",
    "Core: non-waivable",
    "#### P7.3 — CORE-3",
    "**core_id:** CORE-3",
    "**waivable:** false",
    "Core: non-waivable",
    "#### P7.4 — CORE-4",
    "**core_id:** CORE-4",
    "**waivable:** false",
    "Core: non-waivable",
    "---", // thematic break closes P7.4's block (S-1) before the D8 sentence
    H1_SENTENCE,
  ].join("\n");
  const res = evaluate({ docText: doc, ledgerIds: new Set(), fixtureCount: 0, rootDir: ROOT });
  assert.strictEqual(res.exitCode, 1, JSON.stringify(res));
  assert.ok(res.policy.some((p) => p.reason === "fixture-count-zero"));
});

test("evaluate: missing D8 sentence is a POLICY fail (exit 1), not structural", () => {
  const doc = ["#### P1.1 — Fine block", "Core: non-waivable"].join("\n");
  const res = evaluate({ docText: doc, ledgerIds: new Set(), fixtureCount: 1, rootDir: ROOT });
  assert.strictEqual(res.exitCode, 1);
  assert.ok(res.policy.some((p) => p.reason === "dod-sentence-missing"));
});

// ── B-1 regression: an Enforcer ref escaping scripts/checks/ is REFUSED before
// require() ever runs — never loaded, even when the escaping target exists and
// is itself loadable. ──

test("B-1: resolveEnforcer refuses a traversal ref that escapes scripts/checks/ — never require()'d", () => {
  // A throwaway checkout-shaped tmp root with a REAL, loadable .js file placed
  // OUTSIDE scripts/checks/. If resolveEnforcer ever required it, it would set
  // a global marker — proving the escape path never reaches require().
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "clint-b1-"));
  try {
    fs.mkdirSync(path.join(tmpRoot, "scripts", "checks"), { recursive: true });
    const evilPath = path.join(tmpRoot, "evil-outside-checks.js");
    fs.writeFileSync(evilPath, "global.__CLINT_B1_EVIL_REQUIRED__ = true;\n");
    delete global.__CLINT_B1_EVIL_REQUIRED__;

    const res = resolveEnforcer("../evil-outside-checks.js", path.join(tmpRoot, "scripts", "checks"));
    assert.strictEqual(res.resolved, false, JSON.stringify(res));
    assert.ok(/escapes scripts\/checks/.test(res.error), res.error);
    assert.strictEqual(
      global.__CLINT_B1_EVIL_REQUIRED__,
      undefined,
      "the escaping ref must NEVER be require()'d — arbitrary code execution during a lint",
    );
  } finally {
    delete global.__CLINT_B1_EVIL_REQUIRED__;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("B-1: resolveEnforcer refuses an absolute-path ref outside scripts/checks/ — never require()'d", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "clint-b1-abs-"));
  try {
    fs.mkdirSync(path.join(tmpRoot, "scripts", "checks"), { recursive: true });
    const evilPath = path.join(tmpRoot, "evil-abs.js");
    fs.writeFileSync(evilPath, "global.__CLINT_B1_ABS_EVIL_REQUIRED__ = true;\n");
    delete global.__CLINT_B1_ABS_EVIL_REQUIRED__;

    const res = resolveEnforcer(evilPath, path.join(tmpRoot, "scripts", "checks"));
    assert.strictEqual(res.resolved, false, JSON.stringify(res));
    assert.ok(/escapes scripts\/checks/.test(res.error), res.error);
    assert.strictEqual(global.__CLINT_B1_ABS_EVIL_REQUIRED__, undefined);
  } finally {
    delete global.__CLINT_B1_ABS_EVIL_REQUIRED__;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("B-1: resolveEnforcer still resolves a legitimate ref INSIDE scripts/checks/", () => {
  const res = resolveEnforcer("scripts/checks/log-sink-caps.js", ROOT);
  assert.strictEqual(res.resolved, true, JSON.stringify(res));
});

// ── S-1 regression: a block whose (single) trailer is not the last non-empty
// line of the block is malformed (structural, exit 2), never a silent pass. ──

test("S-1: trailer-not-terminal.md — trailer followed by more content -> exit 2 (structural, fail-closed)", () => {
  const res = run({ docPath: path.join(FIXTURES_DIR, "trailer-not-terminal.md") });
  assert.strictEqual(res.exitCode, 2, JSON.stringify(res));
  assert.ok(
    res.structural.some((s) => s.reason === "trailer-not-terminal" && s.block === "P1.1"),
    JSON.stringify(res.structural),
  );
});

test("S-1 (pure-core): a block with a trailer line followed by trailing prose is malformed, not a silent pass", () => {
  const doc = ["#### P1.1 — Trailer not terminal", "Core: non-waivable", "more content after the trailer"].join(
    "\n",
  );
  const res = evaluate({ docText: doc, ledgerIds: new Set(), fixtureCount: 1, rootDir: ROOT });
  assert.strictEqual(res.exitCode, 2, JSON.stringify(res));
  assert.ok(res.structural.some((s) => s.reason === "trailer-not-terminal"));
});

test("S-1 (pure-core): a trailer immediately followed by only blank lines IS terminal (no false positive)", () => {
  const doc = ["#### P1.1 — Trailer is terminal", "Core: non-waivable", "", "   ", ""].join("\n");
  const res = evaluate({ docText: doc, ledgerIds: new Set(), fixtureCount: 1, rootDir: ROOT });
  assert.strictEqual(res.structural.length, 0, JSON.stringify(res.structural));
});

test("S-1 (pure-core): a thematic break ('---') between the trailer and the next block closes the block cleanly", () => {
  const doc = ["#### P1.1 — Fine block", "Core: non-waivable", "", "---", "", "## Next section", "prose"].join(
    "\n",
  );
  const res = evaluate({ docText: doc, ledgerIds: new Set(), fixtureCount: 1, rootDir: ROOT });
  assert.strictEqual(res.structural.length, 0, JSON.stringify(res.structural));
});

// ── C-1 regression: a D6 manifest that is present but CORRUPT (read/parse
// failure) is structural (exit 2), distinct from a manifest that reads fine
// with a legitimately-zero count (policy, exit 1). ──

test("C-1: a manifest read failure (missing file) is structural (exit 2), never fixture-count-zero policy", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "clint-c1-missing-"));
  try {
    const doc = ["#### P1.1 — Fine block", "Core: non-waivable"].join("\n");
    const docPath = path.join(tmpDir, "doc.md");
    fs.writeFileSync(docPath, doc + "\n" + H1_SENTENCE + "\n");
    const res = run({
      docPath,
      ledgerPath: path.join(ROOT, ".claude", "project", "memory", "enforcement-debt.jsonl"),
      manifestPath: path.join(tmpDir, "does-not-exist-manifest.json"),
    });
    assert.strictEqual(res.exitCode, 2, JSON.stringify(res));
    assert.ok(
      res.structural.some((s) => s.reason === "manifest-unreadable"),
      JSON.stringify(res.structural),
    );
    assert.ok(
      !res.policy.some((p) => p.reason === "fixture-count-zero"),
      "a corrupt manifest must not ALSO masquerade as a legitimate zero count",
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("C-1: a manifest with unparseable JSON is structural (exit 2), never fixture-count-zero policy", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "clint-c1-badjson-"));
  try {
    const doc = ["#### P1.1 — Fine block", "Core: non-waivable"].join("\n");
    const docPath = path.join(tmpDir, "doc.md");
    fs.writeFileSync(docPath, doc + "\n" + H1_SENTENCE + "\n");
    const manifestPath = path.join(tmpDir, "manifest.json");
    fs.writeFileSync(manifestPath, "{ this is not valid json");
    const res = run({
      docPath,
      ledgerPath: path.join(ROOT, ".claude", "project", "memory", "enforcement-debt.jsonl"),
      manifestPath,
    });
    assert.strictEqual(res.exitCode, 2, JSON.stringify(res));
    assert.ok(res.structural.some((s) => s.reason === "manifest-unreadable"), JSON.stringify(res.structural));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("C-1 (pure-core): manifestError is structural even on an otherwise-clean doc", () => {
  const doc = ["#### P1.1 — Fine block", "Core: non-waivable"].join("\n");
  const res = evaluate({
    docText: doc,
    ledgerIds: new Set(),
    fixtureCount: undefined,
    manifestError: "manifest is not valid JSON: Unexpected token",
    rootDir: ROOT,
  });
  assert.strictEqual(res.exitCode, 2, JSON.stringify(res));
  assert.ok(res.structural.some((s) => s.reason === "manifest-unreadable"));
  assert.ok(!res.policy.some((p) => p.reason === "fixture-count-zero"));
});

test("C-1 (pure-core): a manifest that reads fine with a legitimately-zero count stays POLICY (exit 1)", () => {
  const doc = ["#### P1.1 — Fine block", "Core: non-waivable"].join("\n");
  const res = evaluate({ docText: doc, ledgerIds: new Set(), fixtureCount: 0, manifestError: null, rootDir: ROOT });
  assert.strictEqual(res.exitCode, 1, JSON.stringify(res));
  assert.ok(res.policy.some((p) => p.reason === "fixture-count-zero"));
});

if (failures.length) {
  process.stderr.write(`FAIL [contract-lint.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [contract-lint.test] ${passed} passed\n`);
