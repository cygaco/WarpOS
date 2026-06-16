#!/usr/bin/env node
// AC-R5a — /panel:roadmap + registry opener default to the GUI; --text → v1 board; thin forwarder.
"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");

let p = 0, f = 0;
function ok(n, fn) { try { fn(); p++; console.log("  ok  " + n); } catch (e) { f++; console.log("FAIL  " + n + "\n      " + e.message); } }

ok("registry-opener-is-gui-text-flag-forwards-to-v1-board-no-duplicated-logic", () => {
  const reg = JSON.parse(fs.readFileSync(path.join(ROOT, "framework", "panel-registry.json"), "utf8"));
  assert.strictEqual(reg.panels.roadmap.opener, "node scripts/panel/roadmap-gui.js",
    "registry roadmap opener is the GUI server (browser default)");
  const skill = fs.readFileSync(path.join(ROOT, ".claude", "commands", "panel", "roadmap.md"), "utf8");
  const body = skill.replace(/^---[\s\S]*?---/, "");
  assert.ok(/node scripts\/panel\/roadmap-gui\.js/.test(body), "skill delegates to the GUI by default");
  assert.ok(/--text[\s\S]*roadmap\.js/.test(body), "skill documents --text → the v1 board (roadmap.js), preserved");
  // thin forwarder: no server/board/render logic copied into the skill body
  assert.ok(!/createServer|generate\(|fs\.readFileSync|JSON\.parse|listen\(/.test(body),
    "skill carries NO server/board logic (thin delegation only)");
  // v1 board script still exists (the --text fallback + shared data layer)
  assert.ok(fs.existsSync(path.join(ROOT, "scripts", "panel", "roadmap.js")), "v1 roadmap.js board preserved");
});

console.log(`\nwireup-forwarder: ${p}/${p + f} pass`);
process.exit(f ? 1 : 0);
