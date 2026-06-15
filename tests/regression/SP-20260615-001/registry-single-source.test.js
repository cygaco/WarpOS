#!/usr/bin/env node
// AC-R1c — forwarders + enumerator both read the registry; neither hardcodes a panel list.
"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..", "..");

let p = 0, f = 0;
function ok(n, fn) { try { fn(); p++; console.log("  ok  " + n); } catch (e) { f++; console.log("FAIL  " + n + "\n      " + e.message); } }

// An "inline panel list" = a literal array enumerating >=2 of the known panel names in code/prose.
const INLINE_LIST = /\[\s*["']readiness["']\s*,\s*["']models["']/;

ok("forwarders-and-enumerator-both-read-registry-no-inline-list", () => {
  const listSrc = fs.readFileSync(path.join(ROOT, "scripts", "panel", "list.js"), "utf8");
  assert.ok(/panel-registry\.json/.test(listSrc), "enumerator reads framework/panel-registry.json");
  assert.ok(!INLINE_LIST.test(listSrc), "enumerator has NO inline panel-name list (registry is the only source)");

  const dir = path.join(ROOT, ".claude", "commands", "panel");
  for (const fwd of ["readiness", "models", "admin", "roadmap"]) {
    const src = fs.readFileSync(path.join(dir, fwd + ".md"), "utf8");
    assert.ok(/panel-registry\.json/.test(src), `${fwd} forwarder declares the registry under reads`);
    assert.ok(!INLINE_LIST.test(src), `${fwd} forwarder has NO inline panel list (names its ONE target)`);
  }
});

console.log(`\nregistry-single-source: ${p}/${p + f} pass`);
process.exit(f ? 1 : 0);
