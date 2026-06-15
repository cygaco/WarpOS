#!/usr/bin/env node
// AC-R5d — scriptsPanel + panelRegistry keys survive SOURCE -> generated regen (no orphan-key).
"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");

let p = 0, f = 0;
function ok(n, fn) { try { fn(); p++; console.log("  ok  " + n); } catch (e) { f++; console.log("FAIL  " + n + "\n      " + e.message); } }

ok("panel-keys-survive-source-to-generated-regen", () => {
  const KEYS = ["scriptsPanel", "panelRegistry"];
  // SOURCE — the keys must originate in the registry source (not a generated-only orphan, CLAUDE.md source-vs-generated).
  const srcTxt = fs.readFileSync(path.join(ROOT, "framework", "paths.registry.json"), "utf8");
  for (const k of KEYS) assert.ok(new RegExp('"' + k + '"').test(srcTxt), `${k} present in SOURCE framework/paths.registry.json`);
  // GENERATED views — must carry the key after build.js (the regen-and-verify discipline).
  const gen = JSON.parse(fs.readFileSync(path.join(ROOT, ".claude", "paths.json"), "utf8"));
  for (const k of KEYS) assert.ok(gen[k], `${k} present in generated .claude/paths.json (survived regen)`);
  const genjs = fs.readFileSync(path.join(ROOT, "scripts", "hooks", "lib", "paths.generated.js"), "utf8");
  for (const k of KEYS) assert.ok(genjs.includes(k), `${k} present in generated paths.generated.js`);
  // sanity: the resolved paths point where expected
  assert.strictEqual(gen.scriptsPanel, "scripts/panel", "scriptsPanel resolves to scripts/panel");
  assert.strictEqual(gen.panelRegistry, "framework/panel-registry.json", "panelRegistry resolves to framework/panel-registry.json");
});

console.log(`\npathkey-roundtrip: ${p}/${p + f} pass`);
process.exit(f ? 1 : 0);
