#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// gui-no-new-deps.test.js — SP-20260615-002 S-2 / AC-R2d [β-2]
//
// ::server-requires-only-builtins-and-firstparty-package-json-unchanged
//   Statically enumerate every require() in scripts/panel/roadmap-gui.js and assert
//   each resolves ONLY to a Node built-in (node:http, node:crypto, node:child_process,
//   node:path, fs) or a first-party repo module (./roadmap). No npm/vendored UI
//   framework. AND: no package.json under the repo gained a dependency entry (the
//   scripts/package.json that pins CommonJS carries no deps; a vendored framework
//   would FAIL).
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const SCRIPT = path.join(ROOT, "scripts", "panel", "roadmap-gui.js");
const SRC = fs.readFileSync(SCRIPT, "utf8");

let pass = 0, fail = 0;
function ok(name, cond, msg) {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}\n      ${msg || ""}`); }
}

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[\t ]*\/\/.*$/gm, "");
}
const CODE = stripComments(SRC);

// The allowed require targets: Node built-ins + first-party relative modules.
const BUILTINS = new Set([
  "node:http", "node:crypto", "node:child_process", "node:path", "node:fs",
  "http", "crypto", "child_process", "path", "fs",
]);

function main() {
  // ── enumerate every require() target ─────────────────────────────────────────
  const targets = [];
  const re = /require\(\s*["']([^"']+)["']\s*\)/g;
  let m;
  while ((m = re.exec(CODE)) !== null) targets.push(m[1]);

  ok("at least one require() found (sanity)", targets.length > 0, "no requires parsed");

  const offenders = targets.filter((t) => {
    if (BUILTINS.has(t)) return false;
    if (t.startsWith("./") || t.startsWith("../")) return false; // first-party relative
    return true; // a bare specifier = an npm/vendored package
  });
  ok("every require() is a built-in or first-party relative module", offenders.length === 0, `bare/npm specifiers: ${offenders.join(", ")}`);

  // first-party relative requires must actually resolve on disk
  const relTargets = targets.filter((t) => t.startsWith("./") || t.startsWith("../"));
  for (const t of relTargets) {
    const resolved = path.resolve(path.dirname(SCRIPT), t);
    const exists = fs.existsSync(resolved) || fs.existsSync(resolved + ".js");
    ok(`first-party require '${t}' resolves on disk`, exists, `${resolved}(.js) not found`);
  }
  ok("data source is scripts/panel/roadmap.js (#generate)", /require\(\s*["']\.\/roadmap["']\s*\)/.test(CODE) && /\bgenerate\b/.test(CODE), "roadmap.js#generate not wired");

  // ── no package.json gained a dependency ──────────────────────────────────────
  // The CommonJS-pinning scripts/package.json must carry no deps; if a repo-root
  // package.json exists it must not either. (A vendored framework would add one.)
  const candidates = [
    path.join(ROOT, "package.json"),
    path.join(ROOT, "scripts", "package.json"),
  ];
  for (const pj of candidates) {
    if (!fs.existsSync(pj)) continue;
    const json = JSON.parse(fs.readFileSync(pj, "utf8").replace(/^﻿/, ""));
    const deps = Object.keys(json.dependencies || {});
    const dev = Object.keys(json.devDependencies || {});
    ok(`${path.relative(ROOT, pj)} declares no runtime dependencies`, deps.length === 0, `dependencies: ${deps.join(", ")}`);
    ok(`${path.relative(ROOT, pj)} declares no devDependencies`, dev.length === 0, `devDependencies: ${dev.join(", ")}`);
  }

  console.log(`\ngui-no-new-deps: ${pass}/${pass + fail} pass`);
  process.exit(fail ? 1 : 0);
}

main();
