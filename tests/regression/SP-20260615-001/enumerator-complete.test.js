#!/usr/bin/env node
// AC-R3a — /panel:list enumerates every registry row exactly (the FTUE discoverability surface).
"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..", "..", "..");

let p = 0, f = 0;
function ok(n, fn) { try { fn(); p++; console.log("  ok  " + n); } catch (e) { f++; console.log("FAIL  " + n + "\n      " + e.message); } }

ok("enumeration-matches-registry-rows-exactly", () => {
  const reg = JSON.parse(fs.readFileSync(path.join(ROOT, "framework", "panel-registry.json"), "utf8"));
  const r = spawnSync(process.execPath, [path.join(ROOT, "scripts", "panel", "list.js"), "--json"], { encoding: "utf8" });
  assert.strictEqual(r.status, 0, "list.js --json exits 0");
  const out = JSON.parse(r.stdout);
  const regNames = Object.keys(reg.panels).sort();
  const outNames = out.panels.map((x) => x.name).sort();
  assert.strictEqual(out.count, regNames.length, "enumerated count matches registry row count");
  assert.deepStrictEqual(outNames, regNames, "enumerated names match registry rows exactly (no omission, no hardcoded extra)");
});

console.log(`\nenumerator-complete: ${p}/${p + f} pass`);
process.exit(f ? 1 : 0);
