#!/usr/bin/env node
"use strict";
/**
 * Bite-test for greek-office-parity.js — the naming bijection (operator directive 2026-07-16).
 * Proves it fires BOTH ways (non-office-carries-Greek FAILS; office-missing-Greek FAILS) and passes
 * a clean bijection. Plus: the live registry surfaces the current pre-strip violations (report-only).
 *
 *   node scripts/checks/greek-office-parity.test.js
 */
const assert = require("assert");
const path = require("path");
const { execFileSync } = require("child_process");
const { evaluateGreekOfficeParity, hasGreek, isOffice } = require("./greek-office-parity");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}
const has = (errs, sub) => errs.some((e) => e.includes(sub));

// ── POSITIVE — a clean bijection (office roles have Greek; non-office don't). ──
test("clean bijection → 0 findings", () => {
  const reg = { roles: {
    alpha: { home: "president", call_sign: "α" },
    cabinet: { home: "president", call_sign: "ζ" },
    "product-lead": { home: "product" },              // no Greek — correct
    "backend-builder": { home: "engineering" },
  } };
  assert.deepStrictEqual(evaluateGreekOfficeParity(reg), [], "clean must be empty");
});

// ── NEGATIVE (planted) — direction B: a NON-office role carries Greek. ──
test("non-office role with a Greek call_sign → NAMING violation", () => {
  const reg = { roles: { "director-of-product": { home: "product", call_sign: "ζ" } } };
  const errs = evaluateGreekOfficeParity(reg);
  assert.ok(has(errs, "director-of-product") && has(errs, "President's office ONLY"), errs.join(" | "));
});

// ── NEGATIVE (planted) — direction A: an OFFICE role MISSING Greek. ──
test("president-office role missing a Greek call_sign → NAMING violation", () => {
  const reg = { roles: { "ops-analyst": { home: "president" } } };
  const errs = evaluateGreekOfficeParity(reg);
  assert.ok(has(errs, "ops-analyst") && has(errs, "NO Greek call_sign"), errs.join(" | "));
});

// ── helpers ──
test("hasGreek / isOffice", () => {
  assert.equal(hasGreek({ call_sign: "ε" }), true);
  assert.equal(hasGreek({ call_sign: "Q" }), false);
  assert.equal(hasGreek({}), false);
  assert.equal(isOffice({ home: "president" }), true);
  assert.equal(isOffice({ home: "growth" }), false);
});

// ── Integration — the live registry surfaces the current pre-strip state (10 dept + 2 office). ──
test("live registry: surfaces the current Greek/office violations (report-only)", () => {
  let out = "", code = 0;
  try {
    out = execFileSync("node", [path.join(__dirname, "greek-office-parity.js")], { encoding: "utf8" });
  } catch (e) {
    out = (e.stdout || "") + (e.stderr || "");
    code = e.status || 1;
  }
  assert.ok(code === 1 && /director-of-product/.test(out) && /ops-analyst/.test(out),
    `expected the live check to surface both directions; got code=${code}: ${out}`);
});

if (failures.length) {
  process.stderr.write(`FAIL [greek-office-parity.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [greek-office-parity.test] ${passed} passed\n`);
