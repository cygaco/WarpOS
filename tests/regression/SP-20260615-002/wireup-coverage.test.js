#!/usr/bin/env node
// AC-R5b — panel-registry-coverage stays green: the rewired roadmap opener resolves to a real script.
"use strict";
const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..", "..", "..");

let p = 0, f = 0;
function ok(n, fn) { try { fn(); p++; console.log("  ok  " + n); } catch (e) { f++; console.log("FAIL  " + n + "\n      " + e.message); } }

ok("panel-registry-coverage-green-roadmap-opener-resolves", () => {
  const r = spawnSync(process.execPath, [path.join(ROOT, "scripts", "checks", "panel-registry-coverage.js")], { encoding: "utf8" });
  assert.strictEqual(r.status, 0,
    `panel-registry-coverage must exit 0 (every opener incl. the rewired roadmap → scripts/panel/roadmap-gui.js resolves). got ${r.status}: ${r.stderr || r.stdout}`);
});

console.log(`\nwireup-coverage: ${p}/${p + f} pass`);
process.exit(f ? 1 : 0);
