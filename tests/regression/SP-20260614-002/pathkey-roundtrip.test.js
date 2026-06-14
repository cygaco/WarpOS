#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// pathkey-roundtrip.test.js — SP-20260614-002 / AC-R4a (path-key-survived-regen).
//
// The orphan-bug guard: keys added to the SOURCE (framework/paths.registry.json)
// must survive `scripts/paths/build.js` into BOTH generated views —
// .claude/paths.json AND scripts/hooks/lib/paths.generated.js. A key added only
// to a generated view (the orphan bug that bit orgRoleRegistry/sprintHookPoints)
// FAILS.
//
// Runs the build in CHECK mode against the live registry (--check exits 1 if any
// artifact is stale) to prove the committed generated views are already in sync,
// then asserts both admin keys are present in the source + both generated views,
// with the EXACT path values.
//   verified_by ::admin-keys-survive-source-to-generated-regen
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const REGISTRY = path.join(ROOT, "framework", "paths.registry.json");
const PATHS_JSON = path.join(ROOT, ".claude", "paths.json");
const GENERATED_JS = path.join(ROOT, "scripts", "hooks", "lib", "paths.generated.js");
const BUILD_JS = path.join(ROOT, "scripts", "paths", "build.js");

const EXPECT = {
  scriptsAdmin: "scripts/admin",
  adminPanelRegistry: "framework/admin-panel-registry.json",
};

let pass = 0;
let fail = 0;
function ok(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    fail++;
    console.log(`FAIL  ${name}\n      ${e.message}`);
  }
}

console.log("pathkey-roundtrip.test.js — AC-R4a");

ok("admin keys present in SOURCE registry with kind/owner", () => {
  const reg = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  for (const [key, p] of Object.entries(EXPECT)) {
    const entry = reg.paths[key];
    assert(entry, `source registry missing key '${key}'`);
    assert.strictEqual(entry.path, p, `source '${key}'.path != '${p}'`);
    assert.strictEqual(entry.owner, "framework", `'${key}' owner must be framework`);
  }
  assert.strictEqual(reg.paths.scriptsAdmin.kind, "dir", "scriptsAdmin kind must be dir");
  assert.strictEqual(reg.paths.adminPanelRegistry.kind, "json", "adminPanelRegistry kind must be json");
});

ok("both keys survive into .claude/paths.json (generated view 1)", () => {
  const pj = JSON.parse(fs.readFileSync(PATHS_JSON, "utf8"));
  for (const [key, p] of Object.entries(EXPECT)) {
    assert.strictEqual(pj[key], p, `.claude/paths.json '${key}' = '${pj[key]}', expected '${p}'`);
  }
});

ok("both keys survive into paths.generated.js (generated view 2)", () => {
  const src = fs.readFileSync(GENERATED_JS, "utf8");
  // path.join(PROJECT, "scripts", "admin") — assert the quoted-key line is present.
  assert(/"scriptsAdmin":\s*path\.join\(PROJECT,\s*"scripts",\s*"admin"\)/.test(src),
    "paths.generated.js missing scriptsAdmin join");
  assert(/"adminPanelRegistry":\s*path\.join\(PROJECT,\s*"framework",\s*"admin-panel-registry\.json"\)/.test(src),
    "paths.generated.js missing adminPanelRegistry join");
});

ok("paths.generated.js resolves the keys at runtime (require-load)", () => {
  // Fresh require with CLAUDE_PROJECT_DIR=ROOT so PROJECT resolves to the repo.
  const prev = process.env.CLAUDE_PROJECT_DIR;
  process.env.CLAUDE_PROJECT_DIR = ROOT;
  delete require.cache[require.resolve(GENERATED_JS)];
  const { PATHS } = require(GENERATED_JS);
  assert.strictEqual(PATHS.scriptsAdmin, path.join(ROOT, "scripts", "admin"));
  assert.strictEqual(PATHS.adminPanelRegistry, path.join(ROOT, "framework", "admin-panel-registry.json"));
  if (prev === undefined) delete process.env.CLAUDE_PROJECT_DIR;
  else process.env.CLAUDE_PROJECT_DIR = prev;
});

ok("committed generated views are in sync with source (build --check clean)", () => {
  const res = spawnSync(process.execPath, [BUILD_JS, "--check"], { cwd: ROOT, encoding: "utf8" });
  assert.strictEqual(res.status, 0,
    `build.js --check reported stale artifacts (the orphan/desync bug):\n${res.stdout}\n${res.stderr}`);
});

console.log(`\npathkey-roundtrip: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
