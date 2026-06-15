#!/usr/bin/env node
// AC-R1d — the 4 known panels are seeded with verified openers that resolve to real targets.
"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");

let p = 0, f = 0;
function ok(n, fn) { try { fn(); p++; console.log("  ok  " + n); } catch (e) { f++; console.log("FAIL  " + n + "\n      " + e.message); } }

const EXPECT = {
  readiness: "/cockpit:readiness",
  models: "/models:router",
  admin: "node scripts/admin/preview.js",
  roadmap: "node scripts/panel/roadmap.js",
};

function resolves(opener) {
  const m = opener.match(/^node\s+(\S+)/);
  if (m) return fs.existsSync(path.join(ROOT, m[1]));
  const s = opener.match(/^\/([a-z0-9-]+):([a-z0-9-]+)$/i);
  if (s) return fs.existsSync(path.join(ROOT, ".claude", "commands", s[1], s[2] + ".md"));
  return false;
}

ok("four-known-panels-seeded-and-openers-resolve", () => {
  const reg = JSON.parse(fs.readFileSync(path.join(ROOT, "framework", "panel-registry.json"), "utf8"));
  for (const [name, opener] of Object.entries(EXPECT)) {
    assert.ok(reg.panels[name], `seed row '${name}' present`);
    assert.strictEqual(reg.panels[name].opener, opener, `${name} opener matches`);
    assert.ok(resolves(opener), `${name} opener resolves to a real target: ${opener}`);
  }
});

console.log(`\nregistry-seed-resolves: ${p}/${p + f} pass`);
process.exit(f ? 1 : 0);
