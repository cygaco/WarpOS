#!/usr/bin/env node
"use strict";

/**
 * Bite-test for knowledge-coverage.js — proves evaluate() FIRES each marker/record
 * invariant (INV-3 / 6 / 7 / 8) on a synthetic fixture (no disk; all seams injected)
 * and stays clean on a coherent one. An enforcer with no negative test is a
 * false-green waiting to happen. Plus an integration check: the real enforcer runs
 * on the live tree and emits a recognizable verdict (never crashes / exit 2).
 *
 *   node scripts/checks/knowledge-coverage.test.js
 */

const assert = require("assert");
const path = require("path");
const { execFileSync } = require("child_process");
const { evaluate } = require("./knowledge-coverage");

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
const has = (problems, frag) => problems.some((p) => p.includes(frag));

// Synthetic role→spec map (paths are arbitrary but must match the markers' `file`).
const SPECS = {
  "design-lead": ".claude/agents/product/design-lead.md",
  "visual-review": ".claude/agents/product/quality/visual-review.md",
  "research-lead": ".claude/agents/growth/research-lead.md",
};
const roleSpecs = new Map(Object.entries(SPECS));

const libDomain = {
  domain: "design",
  kind: "library",
  producer: "design-lead",
  consumers: ["design-lead", "visual-review"],
};
const storeDomain = {
  domain: "audience",
  kind: "store",
  producer: "research-lead",
  consumers: ["copy-lead"],
};

const marker = (domain, role) => ({ domain, role, file: SPECS[role] });
const record = (domain, role) => ({ domain, role });

// A coherent library state: both consumers have an active record AND a marker in their own spec.
const coherent = () => ({
  domains: [libDomain],
  active: [record("design", "design-lead"), record("design", "visual-review")],
  markers: [marker("design", "design-lead"), marker("design", "visual-review")],
  roleSpecs,
});

// 0. POSITIVE — coherent library state → 0 problems.
test("coherent library → 0 problems", () => {
  const problems = evaluate(coherent());
  assert.deepStrictEqual(problems, [], `expected clean, got: ${problems.join(" | ")}`);
});

// 1. INV-3a — a consumer with a marker but NO active record → fires.
test("consumer with no active record → INV-3 (no record)", () => {
  const s = coherent();
  s.active = s.active.filter((r) => r.role !== "design-lead"); // drop design-lead's record
  const problems = evaluate(s);
  assert.ok(
    has(problems, "INV-3") && has(problems, "design-lead") && has(problems, "no active integration record"),
    `expected INV-3 no-record for design-lead, got: ${problems.join(" | ")}`
  );
});

// 2. INV-3b — a consumer whose marker is in the WRONG spec file → fires.
test("consumer marker in wrong spec → INV-3 (no live marker)", () => {
  const s = coherent();
  s.markers = [record("design", "design-lead") && { domain: "design", role: "design-lead", file: ".claude/agents/WRONG.md" }, marker("design", "visual-review")];
  const problems = evaluate(s);
  assert.ok(
    has(problems, "INV-3") && has(problems, "no live") && has(problems, "design-lead"),
    `expected INV-3 no-marker for design-lead, got: ${problems.join(" | ")}`
  );
});

// 3. INV-6 — phantom record: an active record whose marker is absent from the specs.
test("active record with no marker → INV-6 (phantom record)", () => {
  const s = coherent();
  s.markers = [marker("design", "visual-review")]; // design-lead record present, marker gone
  const problems = evaluate(s);
  assert.ok(
    has(problems, "INV-6") && has(problems, "phantom"),
    `expected INV-6 phantom for design-lead, got: ${problems.join(" | ")}`
  );
});

// 4. INV-7 — orphan record: a record naming a role that is NOT a consumer of the domain.
test("record for a non-consumer role → INV-7 (orphan record)", () => {
  const s = coherent();
  s.active = [...s.active, record("design", "copy-lead")]; // copy-lead is not a design consumer
  const problems = evaluate(s);
  assert.ok(
    has(problems, "INV-7") && has(problems, "copy-lead") && has(problems, "orphan record"),
    `expected INV-7 orphan record for copy-lead, got: ${problems.join(" | ")}`
  );
});

// 5. INV-8 — orphan marker: a marker with no backing active record.
test("marker with no record → INV-8 (orphan marker)", () => {
  const s = coherent();
  s.markers = [...s.markers, { domain: "design", role: "design-quality", file: SPECS["design-lead"] }];
  const problems = evaluate(s);
  assert.ok(
    has(problems, "INV-8") && has(problems, "design-quality") && has(problems, "orphan marker"),
    `expected INV-8 orphan marker for design-quality, got: ${problems.join(" | ")}`
  );
});

// 6. STORE tolerance — a store record on (domain, producer) is NOT an orphan, and stores
//    generate NO library marker/record problems in evaluate() (their contract is run()'s INV-5).
test("store producer record → tolerated, 0 problems from evaluate", () => {
  const problems = evaluate({
    domains: [storeDomain],
    active: [record("audience", "research-lead")], // role === producer
    markers: [],
    roleSpecs,
  });
  assert.deepStrictEqual(problems, [], `store producer record must be tolerated, got: ${problems.join(" | ")}`);
});

// 6b. INV-7 — a store record naming neither producer nor consumer → orphan.
test("store record for an unrelated role → INV-7 (orphan record)", () => {
  const problems = evaluate({
    domains: [storeDomain],
    active: [record("audience", "marketing-lead")], // not producer, not in consumers
    markers: [],
    roleSpecs,
  });
  assert.ok(has(problems, "INV-7") && has(problems, "marketing-lead"), `expected INV-7, got: ${problems.join(" | ")}`);
});

// 7. INTEGRATION — the real enforcer on the real tree: must run + emit a verdict, exit 0 or 1 (never 2).
test("integration: real enforcer runs and emits a verdict on the live tree", () => {
  let out = "";
  let status = 0;
  try {
    out = execFileSync(process.execPath, [path.join(__dirname, "knowledge-coverage.js")], {
      encoding: "utf8",
      cwd: path.resolve(__dirname, "..", ".."),
    });
  } catch (e) {
    status = e.status;
    out = `${e.stdout || ""}${e.stderr || ""}`;
  }
  assert.ok(status === 0 || status === 1, `enforcer must exit 0 or 1, got ${status}: ${out}`);
  assert.ok(/\[knowledge-coverage\]/.test(out), `expected a knowledge-coverage status line, got: ${out}`);
});

if (failures.length) {
  process.stderr.write(`knowledge-coverage bite-test: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) process.stderr.write(`  - ${f}\n`);
  process.exit(1);
}
process.stdout.write(
  `knowledge-coverage bite-test: ${passed}/${passed} passed (positive + INV-3a/3b/6/7/8 + store-tolerance + integration)\n`
);
process.exit(0);
