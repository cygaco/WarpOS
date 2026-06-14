#!/usr/bin/env node
"use strict";

// S-PF-09a R-6 / AC-brand — brand-leak-scan on the first net-new product-facing surface.
//
// Fixture-driven: the real panel/guide templates are built in parallel by other builders and
// don't exist here, so we plant clean + leaky fixtures in a temp scaffold dir and assert the
// scanner's fail-closed behavior. Real expected paths are referenced via the scanner's exports.

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const brand = require("../../../scripts/checks/brand-leak-scan.js");

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

function mkdtemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}
function touch(root, rel, body) {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body);
  return abs;
}

// A clean fixture: panel + guide content with the product's OWN brand only, schema id used
// strictly in the machine layer (a comment / import path the scanner strips) — never the DOM.
function cleanFixture() {
  const dir = mkdtemp("sp614-brand-");
  touch(
    dir,
    `${brand.PANEL_GLOB_DIR}/page.tsx.tmpl`,
    [
      'import { buildReadinessReport } from "@/lib/readiness/data";',
      "// schema: " + brand.SCHEMA_ID + " (machine-layer comment, stripped before scan)",
      "export default function ReadinessPanel() {",
      "  return <main><h1>{{PRODUCT_NAME}} launch readiness</h1></main>;",
      "}",
      "",
    ].join("\n")
  );
  touch(
    dir,
    `${brand.GUIDE_CONTENT_DIR}/PAYMENTS_GUIDE.md.tmpl`,
    "# Taking money in {{PRODUCT_NAME}}\n\nA newbie-friendly walkthrough.\n"
  );
  touch(
    dir,
    brand.GUIDE_VIEWER_ROUTE,
    "export default function GuideViewer() { return <article>{{GUIDE_BODY}}</article>; }\n"
  );
  return dir;
}

test("clean-fixture-passes", () => {
  const dir = cleanFixture();
  const res = brand.evaluateBrandLeak(dir);
  assert.strictEqual(res.ok, true, `expected clean, got: ${res.errors.join("; ")}`);
  assert.ok(res.scanned >= 3, "should scan the planted surfaces");
});

test("schema-id-not-in-visible-dom", () => {
  const dir = cleanFixture();
  // Plant the machine-layer schema id into VISIBLE JSX text — this must FAIL.
  touch(
    dir,
    `${brand.PANEL_GLOB_DIR}/page.tsx.tmpl`,
    [
      "export default function ReadinessPanel() {",
      "  return <main><footer>" + brand.SCHEMA_ID + "</footer></main>;",
      "}",
      "",
    ].join("\n")
  );
  const res = brand.evaluateBrandLeak(dir);
  assert.strictEqual(res.ok, false, "schema id in visible DOM must FAIL");
  assert.ok(
    res.errors.some((e) => e.includes("schema id") && e.includes("visible DOM")),
    `expected schema-id-in-DOM error, got: ${res.errors.join("; ")}`
  );
});

test("planted-leak-fails", () => {
  const dir = cleanFixture();
  // Plant a product-facing "WarpOS" string into a visible guide body — must FAIL.
  touch(
    dir,
    `${brand.GUIDE_CONTENT_DIR}/PAYMENTS_GUIDE.md.tmpl`,
    "# Powered by WarpOS\n\nThis copy leaks the engine brand to the founder.\n"
  );
  const res = brand.evaluateBrandLeak(dir);
  assert.strictEqual(res.ok, false, "product-facing WarpOS must FAIL");
  assert.ok(
    res.errors.some((e) => /product-facing engine brand "WarpOS"/.test(e)),
    `expected brand-leak error, got: ${res.errors.join("; ")}`
  );
});

test("brand-leak-in-panel-jsx-text-fails", () => {
  const dir = cleanFixture();
  touch(
    dir,
    `${brand.PANEL_GLOB_DIR}/page.tsx.tmpl`,
    "export default function P(){ return <span>Built on WarpOS</span>; }\n"
  );
  const res = brand.evaluateBrandLeak(dir);
  assert.strictEqual(res.ok, false, "WarpOS in panel JSX must FAIL");
  assert.ok(res.errors.some((e) => /engine brand "WarpOS"/.test(e)));
});

test("schema-id-in-machine-layer-comment-is-allowed", () => {
  // The clean fixture already has the schema id in a stripped comment + import path; assert that
  // path is NOT flagged (machine layer is allowed; only visible-DOM is a leak).
  const dir = cleanFixture();
  const res = brand.evaluateBrandLeak(dir);
  assert.strictEqual(res.ok, true, `machine-layer schema id must be allowed, got: ${res.errors.join("; ")}`);
});

(async () => {
  let passed = 0;
  const failures = [];
  for (const t of tests) {
    try {
      await t.fn();
      passed++;
    } catch (e) {
      failures.push(`${t.name}: ${e.stack || e.message}`);
    }
  }
  if (failures.length) {
    process.stderr.write(`SP-20260614-001 brand-leak: ${passed} passed, ${failures.length} FAILED\n`);
    for (const f of failures) process.stderr.write(`  - ${f}\n`);
    process.exit(1);
  }
  process.stdout.write(`SP-20260614-001 brand-leak: ${passed}/${tests.length} passed\n`);
})();
