#!/usr/bin/env node
// Visual-gauntlet finding fix — an epic's `**Current state:**` run-on paragraph must be
// capped to a short status label (tidy pill + matches the status-group→color mapping).
"use strict";
const assert = require("assert");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");
const { generate } = require(path.join(ROOT, "scripts", "panel", "roadmap.js"));

let p = 0, f = 0;
function ok(n, fn) { try { fn(); p++; console.log("  ok  " + n); } catch (e) { f++; console.log("FAIL  " + n + "\n      " + e.message); } }

ok("epic-state-label-capped-no-runon-paragraph", () => {
  const sum = generate({ root: ROOT }).summary;
  const epics = sum.epics || [];
  assert.ok(epics.length > 0, "real repo has epics");
  for (const e of epics) {
    if (e.parseError) continue;
    assert.ok(typeof e.state === "string" && e.state.length <= 61,
      `epic ${e.id} state must be a short label (<=61 chars), got ${e.state.length}: "${String(e.state).slice(0, 80)}"`);
    assert.ok(!/\n/.test(e.state), `epic ${e.id} state must be a single line (no run-on)`);
  }
});

console.log(`\nepic-state-cap: ${p}/${p + f} pass`);
process.exit(f ? 1 : 0);
