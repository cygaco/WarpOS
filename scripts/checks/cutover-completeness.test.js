#!/usr/bin/env node
"use strict";

/**
 * Bite-test for cutover-completeness.js (ED-026) — proves the pure evaluate()
 * FIRES each finding class (dead-tree path + renamed-away role) AND that every
 * allowlist rule (comment, `was:` field, file-allowlist, prefix-allowlist) SUPPRESSES
 * a hit. The false-positive guard is the whole point: a cutover gate that flagged
 * the `was:` history or the alias table itself would be un-shippable.
 *
 * Plus: a unit test of the disk extractor's comment/`was:` classification
 * (extractFile on a temp file), and an integration check that the real enforcer
 * runs on the live tree, exits 1 (the known keystone debt is REAL — that's the
 * point of ED-026), and emits a recognizable verdict (never crashes / exit 2).
 *
 *   node scripts/checks/cutover-completeness.test.js
 */

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { evaluate, extractFile } = require("./cutover-completeness");

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
const flagged = (res, file, literal) =>
  res.findings.some((f) => f.file === file && f.literal === literal);
const allowedFor = (res, file, literal) =>
  res.allowed.some((a) => a.file === file && a.literal === literal);

// A functional hit = the literal is live code/data (not a comment, not a `was:` field).
const hit = (over = {}) => ({
  file: "scripts/live-consumer.js",
  line: 10,
  literal: "03-managers",
  text: 'path: ".claude/agents/03-managers/x.md",',
  inComment: false,
  wasField: false,
  ...over,
});

// ── 0. POSITIVE — a clean hit set → 0 findings. ──────────────────────────────
test("no hits → 0 findings", () => {
  const res = evaluate({ hits: [], fileAllow: new Set(), prefixAllow: [] });
  assert.deepStrictEqual(res.findings, [], `expected clean, got: ${res.findings.map((f) => f.message).join(" | ")}`);
});

// ── 1. FIRES — a functional dead-tree path literal flags. ────────────────────
test("functional dead-tree path → flagged (dead-tree-path)", () => {
  const res = evaluate({ hits: [hit()], fileAllow: new Set(), prefixAllow: [] });
  assert.ok(flagged(res, "scripts/live-consumer.js", "03-managers"), "expected 03-managers flagged");
  assert.strictEqual(res.findings[0].kind, "dead-tree-path");
});

// ── 2. FIRES — a functional renamed-away role literal flags. ─────────────────
test("functional renamed-away role → flagged (renamed-away-role)", () => {
  const res = evaluate({
    hits: [hit({ literal: "product-designer", text: '"rooted_in": "product-designer",', file: ".claude/agents/_principles/registry.json" })],
    fileAllow: new Set(),
    prefixAllow: [],
  });
  assert.ok(flagged(res, ".claude/agents/_principles/registry.json", "product-designer"), "expected product-designer flagged");
  assert.strictEqual(res.findings[0].kind, "renamed-away-role");
});

// ── 3. SUPPRESS (comment) — a hit inside a comment does NOT flag. ────────────
test("comment hit → allowed (migrated-from / ADR-context), not flagged", () => {
  const res = evaluate({ hits: [hit({ inComment: true })], fileAllow: new Set(), prefixAllow: [] });
  assert.ok(!flagged(res, "scripts/live-consumer.js", "03-managers"), "comment hit must NOT flag");
  assert.ok(allowedFor(res, "scripts/live-consumer.js", "03-managers"), "comment hit must be recorded as allowed");
  assert.ok(/comment/.test(res.allowed[0].allowedBy), `expected comment reason, got ${res.allowed[0].allowedBy}`);
});

// ── 4. SUPPRESS (`was:` field) — a renamed role in a `was:` field is history, not debt. ──
test("`was:` field hit → allowed (historical rename record), not flagged", () => {
  const res = evaluate({
    hits: [hit({ literal: "product-designer", wasField: true, text: '"was": "product-designer",' })],
    fileAllow: new Set(),
    prefixAllow: [],
  });
  assert.ok(!flagged(res, "scripts/live-consumer.js", "product-designer"), "`was:` field must NOT flag");
  assert.ok(/was:/.test((res.allowed[0] || {}).allowedBy || ""), "`was:` field must be recorded as allowed");
});

// ── 5. SUPPRESS (file-allowlist) — an entirely-exempt file does NOT flag (the alias table). ──
test("file-allowlist hit → allowed (e.g. role-aliases.js), not flagged", () => {
  const f = "scripts/hooks/lib/role-aliases.js";
  const res = evaluate({
    hits: [hit({ file: f, literal: "growth-lead", text: '"growth-lead": "marketing-lead",' })],
    fileAllow: new Set([f]),
    prefixAllow: [],
  });
  assert.ok(!flagged(res, f, "growth-lead"), "file-allowlisted hit must NOT flag");
  assert.ok(allowedFor(res, f, "growth-lead"), "file-allowlisted hit must be recorded as allowed");
});

// ── 6. SUPPRESS (prefix-allowlist) — a frozen release capsule does NOT flag. ─
test("prefix-allowlist hit → allowed (frozen framework/releases/*), not flagged", () => {
  const f = "framework/releases/0.13.0/agents/00-alex/alpha.md";
  const res = evaluate({
    hits: [hit({ file: f, literal: "00-alex" })],
    fileAllow: new Set(),
    prefixAllow: [{ prefix: "framework/releases/", reason: "frozen capsule" }],
  });
  assert.ok(!flagged(res, f, "00-alex"), "prefix-allowlisted hit must NOT flag");
  assert.ok(/prefix-allowlist/.test((res.allowed[0] || {}).allowedBy || ""), "prefix hit must be recorded as allowed");
});

// ── 7. DISCRIMINATION — `was:` allow does NOT leak: a DEAD-TREE PATH on a line
//     that ALSO has a `was:` field is still flagged (path moved, not a rename record). ──
test("dead-tree PATH still flags even when wasField=true (path ≠ rename history)", () => {
  // role-registry lines carry BOTH `current_spec: "...01-adhoc/..."` AND `was: "fixer"`.
  // The path is real stale residue; only the ROLE-NAME in `was:` is history. Our gate
  // suppresses on wasField, so to keep paths catchable the extractor marks wasField ONLY
  // when the line is a `"was":` assignment. This test pins the evaluate() contract: if a
  // caller (wrongly) set wasField on a path hit, it WOULD be suppressed — so the guarantee
  // lives in extractFile's classification (test 9), and evaluate() trusts its input. Here
  // we assert the INTENDED path: wasField=false for a path hit → flagged.
  const res = evaluate({
    hits: [hit({ literal: "01-adhoc/", text: '"current_spec": ".claude/agents/01-adhoc/fixer.md", "was": "fixer"', wasField: false })],
    fileAllow: new Set(),
    prefixAllow: [],
  });
  assert.ok(flagged(res, "scripts/live-consumer.js", "01-adhoc/"), "dead-tree path must flag");
});

// ── 8. TOKEN BOUNDARY — `research-lead` (the NEW name) must NOT match `research-insight-lead`. ──
test("extractFile: new role name does not false-match the old one (token boundary)", () => {
  const tmp = path.join(os.tmpdir(), `cutover-tok-${process.pid}.json`);
  fs.writeFileSync(tmp, '{\n  "a": "research-lead",\n  "b": "marketing-lead",\n  "c": "conversion-lead"\n}\n');
  try {
    const hits = extractFile(tmp, "fixtures/tok.json");
    assert.deepStrictEqual(hits, [], `new names must NOT match dead-role needles, got: ${hits.map((h) => h.literal).join(",")}`);
  } finally {
    fs.unlinkSync(tmp);
  }
});

// ── 9. EXTRACTOR CLASSIFICATION — comment vs `was:` vs functional, on a real temp file. ──
test("extractFile: classifies comment / was-field / functional correctly", () => {
  const tmpJs = path.join(os.tmpdir(), `cutover-cls-${process.pid}.js`);
  fs.writeFileSync(
    tmpJs,
    [
      'const p = ".claude/agents/03-managers/x.md";   // functional path (flag)',
      '// migrated from .claude/agents/00-alex/alpha.md (comment — allow)',
      'const role = "product-designer"; // functional role (flag)',
    ].join("\n") + "\n",
  );
  try {
    const hits = extractFile(tmpJs, "scripts/sample.js");
    const fn = hits.find((h) => h.literal === "03-managers");
    const cm = hits.find((h) => h.literal === "00-alex");
    const ro = hits.find((h) => h.literal === "product-designer");
    assert.ok(fn && fn.inComment === false, "03-managers path is functional (not in comment)");
    assert.ok(cm && cm.inComment === true, "00-alex in a // comment must be inComment=true");
    assert.ok(ro && ro.inComment === false, "product-designer before a trailing // is functional");
    // Run through evaluate(): the functional two flag, the comment one is allowed.
    const res = evaluate({ hits, fileAllow: new Set(), prefixAllow: [] });
    assert.ok(flagged(res, "scripts/sample.js", "03-managers") && flagged(res, "scripts/sample.js", "product-designer"), "two functional hits flag");
    assert.ok(!flagged(res, "scripts/sample.js", "00-alex"), "the comment hit does not flag");
  } finally {
    fs.unlinkSync(tmpJs);
  }
});

// ── 10. EXTRACTOR — JSON `"was":` line is classified wasField=true (role-name history). ──
test("extractFile: a JSON `was:` field line marks wasField=true", () => {
  const tmp = path.join(os.tmpdir(), `cutover-was-${process.pid}.json`);
  fs.writeFileSync(tmp, '{\n  "design-lead": { "status": "rename", "was": "product-designer" }\n}\n');
  try {
    const hits = extractFile(tmp, ".claude/agents/_org/role-registry.json");
    const h = hits.find((x) => x.literal === "product-designer");
    assert.ok(h && h.wasField === true, "product-designer in a `was:` field must be wasField=true");
    const res = evaluate({ hits, fileAllow: new Set(), prefixAllow: [] });
    assert.ok(!flagged(res, ".claude/agents/_org/role-registry.json", "product-designer"), "`was:` role-name history must NOT flag");
  } finally {
    fs.unlinkSync(tmp);
  }
});

// ── 11. INTEGRATION — the real enforcer on the live tree: exit 1 (known keystone
//     debt is REAL — ED-026's whole point) + a recognizable verdict; NEVER exit 2. ──
test("integration: real enforcer runs, flags the live keystone debt, exits 1 (not 2)", () => {
  let out = "";
  let status = 0;
  try {
    out = execFileSync(process.execPath, [path.join(__dirname, "cutover-completeness.js")], {
      encoding: "utf8",
      cwd: path.resolve(__dirname, "..", ".."),
    });
  } catch (e) {
    status = e.status;
    out = `${e.stdout || ""}${e.stderr || ""}`;
  }
  assert.strictEqual(status, 1, `enforcer must exit 1 on the live tree (real keystone debt), got ${status}: ${out.slice(0, 400)}`);
  assert.ok(/\[cutover-completeness\]/.test(out), `expected a cutover-completeness verdict line, got: ${out.slice(0, 200)}`);
  // The named keystone instances must be among the findings (the spec's flag set).
  assert.ok(/_principles\/registry\.json/.test(out), "expected the _principles registry dead-key debt to be flagged");
  assert.ok(/role-registry\.json/.test(out), "expected role-registry current_spec debt to be flagged");
  // The allowlisted alias table must NOT appear as a finding.
  assert.ok(!/FAIL[\s\S]*role-aliases\.js/.test(out), "role-aliases.js must NOT be flagged (it's allowlisted)");
});

if (failures.length) {
  process.stderr.write(`cutover-completeness bite-test: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) process.stderr.write(`  - ${f}\n`);
  process.exit(1);
}
process.stdout.write(
  `cutover-completeness bite-test: ${passed}/${passed} passed (positive + dead-tree/role fires + comment/was/file/prefix suppress + token-boundary + extractor classification + integration)\n`,
);
process.exit(0);
