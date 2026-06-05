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
const { evaluate, derivePersonaStaleNames } = require("./skill-hook-coverage");

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

// derivePersonaStaleNames — PERSONA-NARROWED: collects `was` of /^director-/ OR /-lead$/
// roles ONLY (string + array), and DROPS worker scraps (the false-positive guard) + empties.
test("derivePersonaStaleNames narrows to management personas, drops worker scraps", () => {
  const stale = derivePersonaStaleNames({
    "director-of-growth": { id: "director-of-growth", was: "director-of-marketing" },
    "marketing-lead": { id: "marketing-lead", was: "growth-lead" },
    "design-lead": { id: "design-lead", was: "product-designer" },
    // worker scraps — NOT director-/-lead → must be excluded even though they carry `was`
    "qa-reviewer": { id: "qa-reviewer", was: ["qa", "req-reviewer", "compliance"] },
    "redteamer": { id: "redteamer", was: "redteam" },
    // edge cases
    "empty": { id: "design-lead-x", was: "" },        // not -lead suffix anyway, empty was
    "nowas": { id: "director-of-product" },             // no `was`
  });
  assert.ok(stale.has("director-of-marketing") && stale.has("growth-lead") && stale.has("product-designer"),
    "management-persona was values collected");
  assert.ok(!stale.has("qa") && !stale.has("req-reviewer") && !stale.has("compliance") && !stale.has("redteam"),
    "worker scraps must be excluded (persona-narrowing)");
  assert.ok(!stale.has(""), "empty was dropped");
});

// 1. BITE — a stale (renamed-away) name hardcoded via subagent_type → hardcoded_stale_role (HIGH)
test("hardcoded stale role (director-of-marketing) → hardcoded_stale_role", () => {
  const f2 = [
    baseFiles[0], baseFiles[1],
    { skill: "growth:other", path: "x.md", body: "subagent_type: director-of-marketing\n" },
  ];
  const personaStaleNames = new Set(["director-of-marketing"]);
  const { findings } = evaluate({ registry: coherentReg, roleIds: ROLE_IDS, commandFiles: f2, personaStaleNames });
  assert.ok(
    findings.some((f) => f.finding_type === "hardcoded_stale_role" && f.role === "director-of-marketing" && f.severity === "high"),
    `expected hardcoded_stale_role, got: ${findings.map((f) => f.finding_type).join("; ")}`,
  );
});

// 1b. BITE — a persona stale name in DESCRIPTIVE prose (no dispatch verb) → hardcoded_stale_role.
//     The broadened STALE check fires ANYWHERE in a body, not just at a subagent_type literal.
test("persona stale name in plain descriptive prose → hardcoded_stale_role", () => {
  const files = [
    baseFiles[0], baseFiles[1],
    { skill: "growth:doc", path: "d.md", body: "This skill used to consult the director-of-marketing for sign-off.\n" },
  ];
  const personaStaleNames = new Set(["director-of-marketing"]);
  const { findings } = evaluate({ registry: coherentReg, roleIds: ROLE_IDS, commandFiles: files, personaStaleNames });
  assert.ok(
    findings.some((f) => f.finding_type === "hardcoded_stale_role" && f.role === "director-of-marketing"),
    `expected hardcoded_stale_role from prose, got: ${findings.map((f) => f.finding_type).join("; ")}`,
  );
});

// 1c. BITE — the SAME descriptive prose on a `stale-ok` line → NOT flagged (suppression).
test("persona stale name on a stale-ok line → NOT flagged", () => {
  const files = [
    baseFiles[0], baseFiles[1],
    { skill: "scan:doc", path: "s.md", body: "e.g. director-of-marketing after the rename <!-- stale-ok: documents the break -->\n" },
  ];
  const personaStaleNames = new Set(["director-of-marketing"]);
  const { findings } = evaluate({ registry: coherentReg, roleIds: ROLE_IDS, commandFiles: files, personaStaleNames });
  assert.ok(
    !findings.some((f) => f.finding_type === "hardcoded_stale_role"),
    `stale-ok line must suppress, got: ${findings.map((f) => f.finding_type).join("; ")}`,
  );
});

// 1d. BITE — a WORKER-SCRAP name (redteam, qa) ANYWHERE → NOT flagged (persona-narrowing proof).
//     Worker scraps are excluded from personaStaleNames, so legit skill names / dispatch docs
//     mentioning them must never trip the STALE check.
test("worker-scrap names (redteam, qa) anywhere → NOT flagged", () => {
  const files = [
    baseFiles[0], baseFiles[1],
    { skill: "redteam:full", path: "rt.md", body: "Run /redteam:full then /qa:audit; the redteam subagent and qa pass cover it.\nsubagent_type: redteam\n" },
  ];
  // personaStaleNames is the SAME narrowed set the real derivation yields — redteam/qa absent.
  const personaStaleNames = new Set(["director-of-marketing", "growth-lead", "product-designer"]);
  const { findings } = evaluate({ registry: coherentReg, roleIds: ROLE_IDS, commandFiles: files, personaStaleNames });
  assert.deepStrictEqual(findings, [],
    `worker-scrap names must never flag (persona-narrowing), got: ${findings.map((f) => f.finding_type).join("; ")}`);
});

// 2. BITE — a registered persona skill hardcoding a CURRENT persona via subagent_type, not allowlisted → hardcoded_role
test("registered persona skill hardcodes current persona via subagent_type → hardcoded_role", () => {
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

// 2b. BITE — a current persona bold-backtick + "subagent" on the line, in an UNREGISTERED skill →
//     unregistered_persona_skill (the prose-dispatch catch for a skill missing from the registry).
test("current persona bold-backtick + subagent in UNregistered skill → unregistered_persona_skill", () => {
  const files = [
    baseFiles[0], baseFiles[1],
    { skill: "growth:notreg", path: "nr.md", body: "- **`marketing-lead`** subagent (the `eq-scoring` hook) — for scoring\n" },
  ];
  // marketing-lead is a real registry id + a renameable persona (mirrors the real registry).
  const personaRoles = new Set(["product-lead", "director-of-product", "director-of-growth", "copy-lead", "marketing-lead"]);
  const { findings } = evaluate({ registry: coherentReg, roleIds: ROLE_IDS, commandFiles: files, personaRoles });
  assert.ok(
    findings.some((f) => f.finding_type === "unregistered_persona_skill" && f.role === "marketing-lead" && f.skill === "growth:notreg"),
    `expected unregistered_persona_skill, got: ${findings.map((f) => f.finding_type).join("; ")}`,
  );
});

// 2c. BITE — a current persona bold-backtick with NO dispatch verb on the line → NOT flagged.
//     Naming a persona descriptively (no subagent|dispatch|resolve|consult) is not a dispatch.
test("current persona bold-backtick with NO dispatch verb → NOT flagged", () => {
  const files = [
    baseFiles[0], baseFiles[1],
    { skill: "growth:notreg", path: "nr.md", body: "- **`marketing-lead`** owns the EQ scoring rubric and the SCALE/TEST/SKIP call.\n" },
  ];
  // marketing-lead IS a renameable persona here — proving the guard is the missing dispatch
  // VERB, not an absent role. With a verb this would fire (see the previous test).
  const personaRoles = new Set(["product-lead", "director-of-product", "director-of-growth", "copy-lead", "marketing-lead"]);
  const { findings } = evaluate({ registry: coherentReg, roleIds: ROLE_IDS, commandFiles: files, personaRoles });
  assert.deepStrictEqual(findings, [],
    `bold-backtick without a dispatch verb must not flag, got: ${findings.map((f) => f.finding_type).join("; ")}`);
});

// 3. BITE — SAME subagent_type hardcode but the skill IS allowlisted → tracked in info, NOT findings
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

// ── INTEGRATION — the REAL enforcer on the REAL files (the M1-c invariant). A parallel agent
//    may be mid-migration (prose-dispatch skills) so a transient RED is tolerated; we assert
//    only that the process RUNS and emits a recognizable OK or FAIL line (never crashes/exit 2).
test("integration: real enforcer process runs and emits OK or FAIL on the live tree", () => {
  let out = "";
  try {
    out = execFileSync(process.execPath, [path.join(__dirname, "skill-hook-coverage.js")], {
      encoding: "utf8", cwd: ROOT,
    });
  } catch (e) {
    // exit 1 (findings) is expected mid-migration; capture its output. exit 2 (fail-closed) is NOT.
    assert.strictEqual(e.status, 1, `enforcer must exit 0 or 1, got status ${e.status}: ${e.stderr || e.message}`);
    out = `${e.stdout || ""}${e.stderr || ""}`;
  }
  assert.ok(/\[skill-hook-coverage\]/.test(out), `expected a skill-hook-coverage status line, got: ${out}`);
});

if (failures.length) {
  process.stderr.write(`skill-hook-coverage bite-test: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) process.stderr.write(`  - ${f}\n`);
  process.exit(1);
}
process.stdout.write(`skill-hook-coverage bite-test: ${passed}/${passed} passed (positive + bite classes [stale-prose, stale-ok, unregistered-prose, no-verb, worker-scrap, subagent_type, allowlist, rot, phantom, generics] + persona-narrow sanity + integration)\n`);
process.exit(0);
