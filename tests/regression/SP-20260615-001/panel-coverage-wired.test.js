#!/usr/bin/env node
// AC-R5c — panel-registry-coverage delegated REPORT-ONLY in /scan:full Tier-2 + scan skill present.
"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");

let p = 0, f = 0;
function ok(n, fn) { try { fn(); p++; console.log("  ok  " + n); } catch (e) { f++; console.log("FAIL  " + n + "\n      " + e.message); } }

ok("delegated-tier2-report-only-and-on-scan-coverage-inventory", () => {
  const full = fs.readFileSync(path.join(ROOT, ".claude", "commands", "scan", "full.md"), "utf8");
  assert.ok(/\/scan:panel-registry-coverage/.test(full), "/scan:panel-registry-coverage delegated in /scan:full");
  assert.ok(/panel-registry-coverage[\s\S]{0,400}REPORT-ONLY/i.test(full), "wired REPORT-ONLY (does not gate the run)");
  // the scan skill exists (the delegated target)
  assert.ok(fs.existsSync(path.join(ROOT, ".claude", "commands", "scan", "panel-registry-coverage.md")),
    "the /scan:panel-registry-coverage skill file exists");
  // it appears in the Tier-2 `·`-separated scan list (no silent scan-list drift)
  const tier2Line = full.split(/\n/).find((l) => l.includes("/scan:admin-suite-coverage") && l.includes("·"));
  assert.ok(tier2Line && tier2Line.includes("/scan:panel-registry-coverage"),
    "listed in the Tier-2 scan inventory beside admin-suite-coverage");
});

console.log(`\npanel-coverage-wired: ${p}/${p + f} pass`);
process.exit(f ? 1 : 0);
