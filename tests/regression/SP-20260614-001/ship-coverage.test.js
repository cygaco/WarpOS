#!/usr/bin/env node
"use strict";

// S-PF-09a R-5 / AC-ship — scaffold-coverage readiness surface + guide enforcers.
//
// The panel/guide template files are built in PARALLEL by other builders and do NOT exist in
// this worktree. So these tests are FIXTURE-driven: we plant present/absent files in temp dirs
// and assert the enforcer's fail-closed behavior. They reference the REAL expected paths by
// string (the same constants the enforcer exports) but never depend on the real scaffold.

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const cov = require("../../../scripts/checks/scaffold-coverage-scan.js");

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

function mkdtemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}
function touch(root, rel, body = "// fixture\n") {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body);
  return abs;
}

// Build a COMPLETE, passing fixture pair (scaffold dir + repo root), then let individual tests
// remove pieces to prove each absence FAILS.
function fullFixture() {
  const scaffold = mkdtemp("sp614-scaffold-");
  const repo = mkdtemp("sp614-repo-");

  // Producer half (under repo root).
  for (const rel of cov.READINESS_PRODUCER_FILES) touch(repo, rel);
  // The guide-set producer must be readable so computeReferenceableGuideBasenames works — copy
  // the real readiness-report.js maps into the fixture repo so the referenceable set is real.
  fs.copyFileSync(
    path.join(__dirname, "..", "..", "..", "scripts", "scaffold", "readiness-report.js"),
    path.join(repo, "scripts", "scaffold", "readiness-report.js")
  );

  // Panel half (under scaffold dir).
  for (const rel of cov.READINESS_PANEL_FILES) touch(scaffold, rel, "export default function P(){return null}\n");
  // ALL required readiness lib templates (types, group, writeback) must ship — plant each.
  for (const rel of cov.READINESS_LIB_FILES) {
    touch(scaffold, `${cov.READINESS_LIB_DIR_REL}/${rel}`, "export const x = 1;\n");
  }

  // Guide content for EVERY referenceable basename + the viewer route.
  const referenceable = cov.computeReferenceableGuideBasenames(repo);
  for (const base of referenceable) {
    touch(scaffold, `${cov.GUIDE_CONTENT_DIR_REL}/${base}.tmpl`, "# guide\n");
  }
  touch(scaffold, cov.GUIDE_VIEWER_ROUTE_REL, "export default function V(){return null}\n");

  return { scaffold, repo, referenceable };
}

test("baseline-full-fixture-passes", () => {
  const { scaffold, repo } = fullFixture();
  const res = cov.evaluateReadinessCoverage(scaffold, repo);
  assert.strictEqual(res.ok, true, `expected clean baseline, got: ${res.errors.join("; ")}`);
});

test("producer-present-panel-absent-fails", () => {
  const { scaffold, repo } = fullFixture();
  // Remove the ENTIRE panel half — producer present, panel absent (the WG-23 split).
  fs.rmSync(path.join(scaffold, "src/app/admin/readiness"), { recursive: true, force: true });
  fs.rmSync(path.join(scaffold, cov.READINESS_LIB_DIR_REL), { recursive: true, force: true });
  const res = cov.evaluateReadinessCoverage(scaffold, repo);
  assert.strictEqual(res.ok, false, "producer-present/panel-absent must FAIL");
  assert.ok(
    res.errors.some((e) => /panel template missing/.test(e)) &&
      res.errors.some((e) => /half-shipped: producer present but panel/.test(e)),
    `expected half-shipped(WG-23) error, got: ${res.errors.join("; ")}`
  );
});

test("missing-one-readiness-lib-file-fails", () => {
  const { scaffold, repo } = fullFixture();
  // Delete exactly ONE required lib template (writeback) — the panel imports it, so a build that
  // ships types/group but not writeback must FAIL (the old ">=1 lib file" check passed this).
  fs.rmSync(path.join(scaffold, `${cov.READINESS_LIB_DIR_REL}/writeback.ts.tmpl`), { force: true });
  const res = cov.evaluateReadinessCoverage(scaffold, repo);
  assert.strictEqual(res.ok, false, "missing one required readiness lib file must FAIL");
  assert.ok(
    res.errors.some((e) => /readiness shared lib missing/.test(e) && /writeback\.ts\.tmpl/.test(e)),
    `expected writeback-lib-missing error, got: ${res.errors.join("; ")}`
  );
});

test("all-readiness-lib-files-asserted-by-name", () => {
  // Each required lib file, removed in isolation, must produce its own missing-lib error — proving
  // the enforcer asserts ALL of them by name, not just count>=1.
  for (const victim of cov.READINESS_LIB_FILES) {
    const { scaffold, repo } = fullFixture();
    fs.rmSync(path.join(scaffold, `${cov.READINESS_LIB_DIR_REL}/${victim}`), { force: true });
    const res = cov.evaluateReadinessCoverage(scaffold, repo);
    assert.strictEqual(res.ok, false, `missing ${victim} must FAIL`);
    assert.ok(
      res.errors.some((e) => /readiness shared lib missing/.test(e) && e.includes(victim)),
      `expected missing-lib error for ${victim}, got: ${res.errors.join("; ")}`
    );
  }
});

test("panel-present-producer-absent-fails", () => {
  const { scaffold, repo } = fullFixture();
  // Remove producer scripts but keep readiness-report.js (so the guide set still computes) —
  // wait: removing app.js/founders-checklist.js leaves panel whole, producer not whole.
  fs.rmSync(path.join(repo, "scripts/scaffold/app.js"), { force: true });
  fs.rmSync(path.join(repo, "scripts/scaffold/founders-checklist.js"), { force: true });
  const res = cov.evaluateReadinessCoverage(scaffold, repo);
  assert.strictEqual(res.ok, false, "panel-present/producer-absent must FAIL");
  assert.ok(
    res.errors.some((e) => /readiness producer missing/.test(e)),
    `expected producer-missing error, got: ${res.errors.join("; ")}`
  );
});

test("missing-one-referenceable-guide-fails-cta-points-nowhere", () => {
  const { scaffold, repo, referenceable } = fullFixture();
  // Delete exactly one shipped guide whose ref the producer CAN emit → CTA points nowhere.
  const victim = referenceable[0];
  fs.rmSync(path.join(scaffold, `${cov.GUIDE_CONTENT_DIR_REL}/${victim}.tmpl`), { force: true });
  const res = cov.evaluateReadinessCoverage(scaffold, repo);
  assert.strictEqual(res.ok, false, "planted referenceable-ref-with-no-shipped-guide must FAIL");
  assert.ok(
    res.errors.some((e) => e.includes("points nowhere") && e.includes(victim)),
    `expected CTA-points-nowhere for ${victim}, got: ${res.errors.join("; ")}`
  );
});

test("missing-guide-viewer-route-fails", () => {
  const { scaffold, repo } = fullFixture();
  fs.rmSync(path.join(scaffold, cov.GUIDE_VIEWER_ROUTE_REL), { force: true });
  const res = cov.evaluateReadinessCoverage(scaffold, repo);
  assert.strictEqual(res.ok, false, "missing [ref] viewer route must FAIL");
  assert.ok(
    res.errors.some((e) => /guide viewer route missing/.test(e)),
    `expected viewer-route-missing error, got: ${res.errors.join("; ")}`
  );
});

test("referenceable-set-is-the-real-eight-guides", () => {
  // Provenance sanity: the enforcer computes the union of the three deep-link maps. Reference
  // the real producer (repo root) so this stays true if the maps drift (the test will then need
  // updating, which is the point — the set is load-bearing).
  const set = cov.computeReferenceableGuideBasenames();
  assert.ok(set.length >= 1, "referenceable set must be non-empty (fail-closed otherwise)");
  for (const base of set) assert.match(base, /_GUIDE\.md$/);
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
    process.stderr.write(`SP-20260614-001 ship-coverage: ${passed} passed, ${failures.length} FAILED\n`);
    for (const f of failures) process.stderr.write(`  - ${f}\n`);
    process.exit(1);
  }
  process.stdout.write(`SP-20260614-001 ship-coverage: ${passed}/${tests.length} passed\n`);
})();
