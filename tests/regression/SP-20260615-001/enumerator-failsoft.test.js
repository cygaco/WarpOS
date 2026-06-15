#!/usr/bin/env node
// AC-R3b — /panel:list fails SOFT on a malformed registry (clear message, non-zero, no uncaught throw).
"use strict";
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..", "..", "..");

let p = 0, f = 0;
function ok(n, fn) { try { fn(); p++; console.log("  ok  " + n); } catch (e) { f++; console.log("FAIL  " + n + "\n      " + e.message); } }

ok("malformed-registry-yields-clear-message-no-uncaught-throw", () => {
  const tmp = path.join(os.tmpdir(), "panel-failsoft-" + process.pid + ".json");
  fs.writeFileSync(tmp, "{ this is not valid json");
  try {
    const r = spawnSync(process.execPath, [path.join(ROOT, "scripts", "panel", "list.js"), "--registry", tmp], { encoding: "utf8" });
    assert.notStrictEqual(r.status, 0, "non-zero exit on malformed registry");
    assert.ok(/unavailable/i.test(r.stderr || ""), "clear 'panel registry unavailable' message on stderr");
    assert.ok(!/^\s*at\s+\S+.*:\d+:\d+/m.test(r.stderr || ""), "NO uncaught stack trace (no 'at fn (file:line:col)' frame)");
  } finally { fs.rmSync(tmp, { force: true }); }
});

console.log(`\nenumerator-failsoft: ${p}/${p + f} pass`);
process.exit(f ? 1 : 0);
