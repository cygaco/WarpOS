#!/usr/bin/env node
// AC-R4d [β-2] — /panel:roadmap delegates to the generator; no inline parse/render logic in the skill.
"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");

let p = 0, f = 0;
function ok(n, fn) { try { fn(); p++; console.log("  ok  " + n); } catch (e) { f++; console.log("FAIL  " + n + "\n      " + e.message); } }

ok("panel-roadmap-delegates-to-generator-no-inline-render", () => {
  const b = fs.readFileSync(path.join(ROOT, ".claude", "commands", "panel", "roadmap.md"), "utf8").replace(/^---[\s\S]*?---/, "");
  assert.ok(/node\s+scripts\/panel\/roadmap\.js/.test(b), "delegates by shelling node scripts/panel/roadmap.js");
  // no reproduced board-generation CODE in the skill body (it is a forwarder, not an implementation).
  assert.ok(!/fs\.readFileSync|JSON\.parse|spawnSync|\.split\(|\.match\(/.test(b),
    "no inline parse/render code in the /panel:roadmap forwarder");
});

console.log(`\nroadmap-opener-delegates: ${p}/${p + f} pass`);
process.exit(f ? 1 : 0);
