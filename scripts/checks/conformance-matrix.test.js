#!/usr/bin/env node
"use strict";
/**
 * Bite-test for conformance-matrix.js (G0.3) — the kernel conformance runner.
 * Proves: (1) the real fixture corpus executes clean against support-matrix.json
 * (the agy-down fixture correctly computes BLOCK, matching its own expectation —
 * a down REQUIRED lane is never a silent pass, R4); (2) --coverage sees full R3
 * positive coverage; (3) the pure gate evaluators individually compute the right
 * outcome; (4) a --enforce-shaped mismatch/required-down is detected structurally
 * (unit-level, without needing to corrupt the real fixture corpus).
 *
 *   node scripts/checks/conformance-matrix.test.js
 */
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  evaluate,
  evaluateCoverage,
  loadFixtures,
  loadSupportMatrix,
  run,
  GATE_EVALUATORS,
} = require("./conformance-matrix");

// Anchor on __dirname (this test file's own location), never a possibly-stale
// CLAUDE_PROJECT_DIR — see contract-lint.js's resolveRoot() for the rationale.
const ROOT = path.resolve(__dirname, "..", "..");
const KERNEL_DIR = path.join(ROOT, ".claude", "kernel");

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

// ── Real fixture corpus executes clean (fs-backed run()). ──

test("run(): the real fixture corpus has zero mismatches against support-matrix.json", () => {
  const res = run();
  assert.strictEqual(res.mismatches.length, 0, JSON.stringify(res.mismatches));
  assert.ok(res.fixtureCount > 0, "expected a nonzero fixture count");
});

test("run(): the agy-antigravity required-down lane is surfaced (R4) — never a silent pass", () => {
  const res = run();
  assert.ok(
    res.requiredDownLanes.some((d) => d.helm === "agy-antigravity"),
    JSON.stringify(res.requiredDownLanes),
  );
  const agyFixture = res.results && res.results.find ? res.results.find((r) => r.id && r.id.includes("agy")) : null;
  // results isn't returned by run() directly today (evaluate() is), so re-derive via evaluate():
  void agyFixture;
});

test("run(): manifestCount matches the manifest.json 'count' field and the loaded fixture count", () => {
  const res = run();
  assert.strictEqual(res.manifestCount, res.fixtureCount, JSON.stringify(res));
});

test("run(): --coverage-equivalent (evaluateCoverage over the real corpus) reports zero gaps", () => {
  const supportMatrix = loadSupportMatrix(path.join(KERNEL_DIR, "support-matrix.json"));
  const fixturesDir = path.join(KERNEL_DIR, "fixtures");
  const fixtures = loadFixtures(fixturesDir);
  const cov = evaluateCoverage({ fixtures, supportMatrix });
  assert.ok(cov.ok, JSON.stringify(cov.gaps));
  for (const id of ["CORE-1", "CORE-2", "CORE-3", "CORE-4"]) {
    assert.ok(cov.coreCoverage[id] >= 1, `expected >=1 fixture bound to ${id}`);
  }
});

test("run(): the contract-lint self-test corpus is EXCLUDED from the kernel-conformance walk", () => {
  const res = run();
  // 12 kernel-conformance fixtures per manifest.json; the 4 contract-lint/*.json
  // descriptors must NOT inflate this count.
  assert.strictEqual(res.fixtureCount, 12, `expected exactly 12 kernel-conformance fixtures, got ${res.fixtureCount}`);
});

// ── Per-gate pure evaluators (unit-level, no fs). ──

test("role-binding evaluator: unbound dispatched worker -> BLOCK (CORE-1)", () => {
  const rb = { worker_default_when_unbound: "FAIL_CLOSED" };
  const out = GATE_EVALUATORS["role-binding"]({ actor_kind: "dispatched_worker" }, { roleBinding: rb });
  assert.strictEqual(out.outcome, "BLOCK");
});

test("role-binding evaluator: bound dispatched worker -> PASS", () => {
  const rb = { worker_default_when_unbound: "FAIL_CLOSED" };
  const out = GATE_EVALUATORS["role-binding"](
    { actor_kind: "dispatched_worker", explicit_user_instruction: "build X" },
    { roleBinding: rb },
  );
  assert.strictEqual(out.outcome, "PASS");
});

test("role-binding evaluator: agents_md cannot bind (CORE-3) -> BLOCK", () => {
  const rb = { sources: { agents_md: { can_bind: false }, helm: { can_bind: true } } };
  const out = GATE_EVALUATORS["role-binding"](
    { attempted_binding_source: "agents_md", claimed_role: "alex-alpha" },
    { roleBinding: rb },
  );
  assert.strictEqual(out.outcome, "BLOCK");
});

test("role-binding evaluator: helm CAN bind -> PASS", () => {
  const rb = { sources: { agents_md: { can_bind: false }, helm: { can_bind: true } } };
  const out = GATE_EVALUATORS["role-binding"]({ attempted_binding_source: "helm" }, { roleBinding: rb });
  assert.strictEqual(out.outcome, "PASS");
});

test("support-matrix evaluator: a required+down helm -> BLOCK", () => {
  const sm = { rows: { agy: { status: "down", required: true, proven: false, evidence_ref: "ED-060" } } };
  const out = GATE_EVALUATORS["support-matrix"]({ helm: "agy" }, { supportMatrix: sm });
  assert.strictEqual(out.outcome, "BLOCK");
});

test("support-matrix evaluator: a supported+proven helm -> PASS", () => {
  const sm = { rows: { claude: { status: "supported", required: true, proven: true } } };
  const out = GATE_EVALUATORS["support-matrix"]({ helm: "claude" }, { supportMatrix: sm });
  assert.strictEqual(out.outcome, "PASS");
});

test("retention evaluator: archive disposition -> PASS; delete disposition -> BLOCK (D-1/CORE-4)", () => {
  assert.strictEqual(GATE_EVALUATORS.retention({ attempted_disposition: "archive" }).outcome, "PASS");
  assert.strictEqual(GATE_EVALUATORS.retention({ attempted_disposition: "delete" }).outcome, "BLOCK");
});

test("dispatch-honesty evaluator: passed status with zero evidence -> BLOCK (false-green)", () => {
  const out = GATE_EVALUATORS["dispatch-honesty"]({
    result_envelope: { status: "passed", files_changed: [], commits: [], tests_run: [], evidence_paths: [] },
  });
  assert.strictEqual(out.outcome, "BLOCK");
});

test("dispatch-honesty evaluator: passed status WITH evidence -> PASS", () => {
  const out = GATE_EVALUATORS["dispatch-honesty"]({
    result_envelope: { status: "passed", files_changed: ["a.js"], commits: ["abc"], tests_run: [{ cmd: "x" }], evidence_paths: ["p"] },
  });
  assert.strictEqual(out.outcome, "PASS");
});

test("dispatch-review evaluator: same-provider builder+reviewer -> BLOCK", () => {
  const out = GATE_EVALUATORS["dispatch-review"]({ builder_provider: "openai", reviewer_provider: "openai" });
  assert.strictEqual(out.outcome, "BLOCK");
});

test("dispatch-review evaluator: different-provider builder+reviewer -> PASS", () => {
  const out = GATE_EVALUATORS["dispatch-review"]({ builder_provider: "openai", reviewer_provider: "claude" });
  assert.strictEqual(out.outcome, "PASS");
});

// ── evaluate(): synthetic mismatch is detected (unit-level, no fs mutation of the real corpus). ──

test("evaluate(): a fixture whose expect disagrees with the evaluator's computed outcome is a mismatch", () => {
  const fixtures = [
    { id: "synthetic-1", gate: "retention", input: { attempted_disposition: "delete" }, expect: { outcome: "PASS" } },
  ];
  const res = evaluate({ fixtures, supportMatrix: { rows: {} }, roleBinding: {} });
  assert.strictEqual(res.mismatches.length, 1);
  assert.strictEqual(res.mismatches[0].computed, "BLOCK");
  assert.strictEqual(res.mismatches[0].expected, "PASS");
});

// B-2: an unknown gate name is a STRUCTURAL error (evaluate() throws,
// fail-closed) — this runner cannot DECIDE such a fixture, so it must never
// become a reportable mismatch/PASS in the results array.
test("B-2: evaluate() throws (fail-closed) on an unrecognized gate name, never a reportable mismatch", () => {
  const fixtures = [{ id: "synthetic-2", gate: "no-such-gate", input: {}, expect: { outcome: "PASS" } }];
  assert.throws(
    () => evaluate({ fixtures, supportMatrix: { rows: {} }, roleBinding: {} }),
    /unknown gate/,
  );
});

test("evaluateCoverage(): a CORE invariant with zero bound fixtures is a gap", () => {
  const fixtures = [{ gate: "role-binding", bound_core: "CORE-1" }];
  const cov = evaluateCoverage({ fixtures, supportMatrix: { rows: {} } });
  assert.ok(!cov.ok);
  assert.ok(cov.gaps.some((g) => g.kind === "core" && g.id === "CORE-2"));
});

// ── B-2 regression: loadFixtures() fails CLOSED on a semantically malformed
// fixture — missing required fields, unparseable JSON, or an unknown gate —
// never a reportable mismatch/PASS. ──

function writeTmpFixture(gateName, fileName, content) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cfm-b2-"));
  const gateDir = path.join(tmpDir, gateName);
  fs.mkdirSync(gateDir, { recursive: true });
  fs.writeFileSync(path.join(gateDir, fileName), content);
  return tmpDir;
}

test("B-2: loadFixtures() throws (fail-closed) on a fixture naming an unknown gate", () => {
  const tmpDir = writeTmpFixture(
    "no-such-gate",
    "case.json",
    JSON.stringify({ id: "x", gate: "no-such-gate", input: {}, expect: { outcome: "PASS" } }),
  );
  try {
    assert.throws(() => loadFixtures(tmpDir), /unknown gate/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("B-2: loadFixtures() throws (fail-closed) on a fixture missing required fields", () => {
  const tmpDir = writeTmpFixture("retention", "case.json", JSON.stringify({ gate: "retention" }));
  try {
    assert.throws(() => loadFixtures(tmpDir), /missing required field/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("B-2: loadFixtures() throws (fail-closed) on unparseable fixture JSON", () => {
  const tmpDir = writeTmpFixture("retention", "case.json", "{ not valid json");
  try {
    assert.throws(() => loadFixtures(tmpDir), /malformed fixture/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("B-2: loadFixtures() throws (fail-closed) on a non-canonical expect.outcome", () => {
  const tmpDir = writeTmpFixture(
    "retention",
    "case.json",
    JSON.stringify({ id: "x", gate: "retention", input: {}, expect: { outcome: "MAYBE" } }),
  );
  try {
    assert.throws(() => loadFixtures(tmpDir), /expect\.outcome/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("B-2: run() propagates a malformed fixture as a thrown error — the CLI maps this to exit 2, never a clean 0/1", () => {
  const tmpDir = writeTmpFixture(
    "no-such-gate",
    "case.json",
    JSON.stringify({ id: "x", gate: "no-such-gate", input: {}, expect: { outcome: "PASS" } }),
  );
  try {
    assert.throws(
      () =>
        run({
          kernelDir: KERNEL_DIR,
          supportMatrixPath: path.join(KERNEL_DIR, "support-matrix.json"),
          fixturesDir: tmpDir,
        }),
      /unknown gate/,
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ── B-3 regression: loadSupportMatrix() fails CLOSED on a syntactically-valid
// but STRUCTURALLY invalid support matrix — never silent acceptance. ──

function writeTmpSupportMatrix(obj) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cfm-b3-"));
  const p = path.join(tmpDir, "support-matrix.json");
  fs.writeFileSync(p, typeof obj === "string" ? obj : JSON.stringify(obj));
  return { tmpDir, p };
}

test("B-3: loadSupportMatrix() throws (fail-closed) when 'rows' is missing", () => {
  const { tmpDir, p } = writeTmpSupportMatrix({ schema: "x" });
  try {
    assert.throws(() => loadSupportMatrix(p), /rows/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("B-3: loadSupportMatrix() throws (fail-closed) when 'rows' is not an object", () => {
  const { tmpDir, p } = writeTmpSupportMatrix({ rows: "not-an-object" });
  try {
    assert.throws(() => loadSupportMatrix(p), /rows/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("B-3: loadSupportMatrix() throws (fail-closed) when a row is missing a required field", () => {
  const { tmpDir, p } = writeTmpSupportMatrix({ rows: { claude: { status: "supported", required: true } } });
  try {
    assert.throws(() => loadSupportMatrix(p), /proven|evidence_ref/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("B-3: loadSupportMatrix() throws (fail-closed) when a row's field has the wrong type", () => {
  const { tmpDir, p } = writeTmpSupportMatrix({
    rows: { claude: { status: "supported", required: "yes", proven: true, evidence_ref: "x" } },
  });
  try {
    assert.throws(() => loadSupportMatrix(p), /required/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("B-3: loadSupportMatrix() throws (fail-closed) on unparseable JSON", () => {
  const { tmpDir, p } = writeTmpSupportMatrix("{ not valid json");
  try {
    assert.throws(() => loadSupportMatrix(p), /not valid JSON/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("B-3: loadSupportMatrix() still accepts the REAL support-matrix.json (positive control)", () => {
  const matrix = loadSupportMatrix(path.join(KERNEL_DIR, "support-matrix.json"));
  assert.ok(matrix && typeof matrix === "object");
  assert.ok(matrix.rows && matrix.rows.claude && matrix.rows.claude.status === "supported");
});

if (failures.length) {
  process.stderr.write(
    `FAIL [conformance-matrix.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`,
  );
  process.exit(1);
}
process.stdout.write(`OK   [conformance-matrix.test] ${passed} passed\n`);
