#!/usr/bin/env node
"use strict";

/**
 * Bite-test for skill-hook-coverage.js — proves evaluate() FIRES each finding class
 * on a synthetic fixture (no disk; all seams injected) and stays clean on a coherent one.
 * An enforcer with no negative test is a false-green waiting to happen.
 *
 *   node scripts/checks/skill-hook-coverage.test.js
 */

const assert = require("assert");
const path = require("path");
const { execFileSync } = require("child_process");
const { evaluate, deriveStaleNames } = require("./skill-hook-coverage");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// A minimal coherent registry: two registered persona skills, each on a real role id.
// roadmap:next + growth:message-brief mirror the real registry's shape (a conditional
// pair with one default, and a single-role-per-hook pair).
const coherentReg = { skills: {
  "roadmap:next": { domain: "product", hooks: [
    { hook_point: "pick", role: "product-lead", condition: "single-product" },
    { hook_point: "pick", role: "director-of-product", condition: "strategic", default: true },
  ] },
  "growth:message-brief": { domain: "growth", hooks: [
    { hook_point: "distill-message", role: "director-of-growth" },
    { hook_point: "shape-copy", role: "copy-lead" },
  ] },
} };
const ROLE_IDS = ["product-lead", "director-of-product", "director-of-growth", "copy-lead", "marketing-lead"];

// Both registered skills resolve to a real file (so phantom_skill_entry does NOT fire by
// accident). The real .claude/commands tree has these; existsSync sees them.
const ROOT = path.resolve(__dirname, "..", "..");
const realFile = (skill) => path.join(ROOT, ".claude", "commands", ...skill.replace(/:/g, "/").split("/")) + ".md";
const baseFiles = [
  { skill: "roadmap:next", path: realFile("roadmap:next"), body: "no dispatch here" },
  { skill: "growth:message-brief", path: realFile("growth:message-brief"), body: "no dispatch here" },
];

// 0. POSITIVE — coherent registry + clean bodies → 0 findings
test("coherent → 0 findings", () => {
  const { findings } = evaluate({ registry: coherentReg, roleIds: ROLE_IDS, commandFiles: baseFiles });
  assert.deepStrictEqual(findings, [], `expected clean, got: ${findings.map((f) => f.finding_type).join("; ")}`);
});

// deriveStaleNames sanity — handles string AND array `was`, drops empties
test("deriveStaleNames collects string + array was values", () => {
  const stale = deriveStaleNames({
    a: { was: "director-of-marketing" },
    b: { was: ["qa", "req-reviewer", "compliance"] },
    c: { was: "" },
    d: { status: "live" },
  });
  assert.ok(stale.has("director-of-marketing") && stale.has("req-reviewer") && stale.has("compliance"), "string + array collected");
  assert.ok(!stale.has(""), "empty was dropped");
});

// 1. BITE — a stale (renamed-away) name hardcoded → hardcoded_stale_role (HIGH)
test("hardcoded stale role (director-of-marketing) → hardcoded_stale_role", () => {
  const files = [...baseFiles, { skill: "growth:message-brief", path: "x.md", body: "subagent_type: director-of-marketing" }];
  // Note: same skill body appears twice; use a fresh non-allowlisted skill to isolate the class.
  const f2 = [
    baseFiles[0], baseFiles[1],
    { skill: "growth:other", path: "x.md", body: "subagent_type: director-of-marketing\n" },
  ];
  const staleNames = new Set(["director-of-marketing"]);
  const { findings } = evaluate({ registry: coherentReg, roleIds: ROLE_IDS, commandFiles: f2, staleNames });
  assert.ok(
    findings.some((f) => f.finding_type === "hardcoded_stale_role" && f.role === "director-of-marketing" && f.severity === "high"),
    `expected hardcoded_stale_role, got: ${findings.map((f) => f.finding_type).join("; ")}`,
  );
  void files;
});

// 2. BITE — a registered persona skill hardcoding a CURRENT persona role, not allowlisted → hardcoded_role
test("registered persona skill hardcodes current persona role, not allowlisted → hardcoded_role", () => {
  const files = [
    baseFiles[1],
    { skill: "roadmap:next", path: realFile("roadmap:next"), body: "subagent_type: product-lead\n" },
  ];
  const { findings } = evaluate({ registry: coherentReg, roleIds: ROLE_IDS, commandFiles: files, allowlist: new Set() });
  assert.ok(
    findings.some((f) => f.finding_type === "hardcoded_role" && f.role === "product-lead" && f.skill === "roadmap:next"),
    `expected hardcoded_role, got: ${findings.map((f) => f.finding_type).join("; ")}`,
  );
});

// 3. BITE — SAME hardcode but the skill IS allowlisted → tracked in info, NOT findings
test("same hardcode but allowlisted → info, not findings", () => {
  const files = [
    baseFiles[1],
    { skill: "roadmap:next", path: realFile("roadmap:next"), body: "subagent_type: product-lead\n" },
  ];
  const { findings, info } = evaluate({
    registry: coherentReg, roleIds: ROLE_IDS, commandFiles: files, allowlist: new Set(["roadmap:next"]),
  });
  assert.ok(!findings.some((f) => f.finding_type === "hardcoded_role"), "allowlisted hardcode must not be a finding");
  assert.ok(info.some((f) => f.finding_type === "hardcoded_role" && f.skill === "roadmap:next"), "allowlisted hardcode must be tracked in info");
});

// 4. BITE — an allowlisted skill with NO hardcode → stale_allowlist_entry (allowlist rot)
test("allowlisted skill with no hardcode → stale_allowlist_entry", () => {
  const { findings } = evaluate({
    registry: coherentReg, roleIds: ROLE_IDS, commandFiles: baseFiles, allowlist: new Set(["roadmap:next"]),
  });
  assert.ok(
    findings.some((f) => f.finding_type === "stale_allowlist_entry" && f.skill === "roadmap:next"),
    `expected stale_allowlist_entry, got: ${findings.map((f) => f.finding_type).join("; ")}`,
  );
});

// 5. BITE — a registered skill whose command file is missing → phantom_skill_entry
test("registered skill with no command file → phantom_skill_entry", () => {
  const reg = { skills: {
    "ghost:skill": { domain: "product", hooks: [{ hook_point: "pick", role: "product-lead" }] },
  } };
  // commandFiles does NOT contain ghost:skill, and no real file exists for it on disk.
  const { findings } = evaluate({ registry: reg, roleIds: ROLE_IDS, commandFiles: [] });
  assert.ok(
    findings.some((f) => f.finding_type === "phantom_skill_entry" && f.skill === "ghost:skill"),
    `expected phantom_skill_entry, got: ${findings.map((f) => f.finding_type).join("; ")}`,
  );
});

// 6. BITE — generic / stable-face literals (general-purpose, beta) → NOT flagged
test("subagent_type: general-purpose / beta → NOT flagged", () => {
  const files = [
    ...baseFiles,
    { skill: "models:check", path: "m.md", body: "subagent_type: general-purpose\n" },
    { skill: "mode:adhoc", path: "a.md", body: 'subagent_type: "beta"\nsubagent_type: "gamma"\n' },
  ];
  const { findings } = evaluate({ registry: coherentReg, roleIds: ROLE_IDS, commandFiles: files });
  assert.deepStrictEqual(findings, [], `generics/faces must not flag, got: ${findings.map((f) => f.finding_type).join("; ")}`);
});

// ── INTEGRATION — the REAL enforcer on the REAL files exits clean (the M1-c invariant) ──
test("integration: real enforcer process exits 0 on the live tree", () => {
  const out = execFileSync(process.execPath, [path.join(__dirname, "skill-hook-coverage.js")], {
    encoding: "utf8", cwd: ROOT,
  });
  assert.ok(/OK\s+\[skill-hook-coverage\]/.test(out), `expected OK line, got: ${out}`);
});

if (failures.length) {
  process.stderr.write(`skill-hook-coverage bite-test: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) process.stderr.write(`  - ${f}\n`);
  process.exit(1);
}
process.stdout.write(`skill-hook-coverage bite-test: ${passed}/${passed} passed (positive + 6 bite classes + 1 sanity + integration)\n`);
process.exit(0);
