#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// single-writer-invariant.test.js — SP-20260614-002 R-3 (AC-R3c).
// CROSS-FILE INVARIANT (runs fully post-integration): across scripts/admin/*.js,
// EXACTLY ONE module may WRITE the instance pointer (.claude/runtime/admin-preview.json)
// — scripts/admin/preview.js (the mode-set.js single-writer chokepoint). A planted
// second writer (e.g. seed.js writing the pointer) FAILS.
//
// Mechanism: static scan. For each scripts/admin/*.js we detect a "pointer write"
// = a line that BOTH references the pointer basename/path AND performs a write
// (fs.write*/createWriteStream/renameSync/copyFileSync). Reads (fs.readFileSync)
// do NOT count. seed.js must NOT appear as a writer.
//
// NOTE: in a pre-integration worktree preview.js may be absent (a different
// builder owns it). The invariant we OWN here is "no writer OTHER THAN preview.js
// exists across scripts/admin/*". We assert that strictly; we additionally assert
// the keystone IS the writer only when preview.js is present (full post-integration
// pass). Either way, seed.js being a non-writer is checked unconditionally.
// ─────────────────────────────────────────────────────────────────────────────
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const ADMIN_DIR = path.join(ROOT, "scripts", "admin");

let pass = 0;
let fail = 0;
function ok(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    fail++;
    console.log(`FAIL  ${name}\n      ${e.message}`);
  }
}

const POINTER_BASENAME = "admin-preview.json";
const WRITE_FNS = /\b(?:fs\.)?(?:writeFileSync|writeFile|createWriteStream|renameSync|rename|copyFileSync|appendFileSync|appendFile)\s*\(/;

// Strip line/block comments so a doc-comment mentioning the pointer + a nearby
// fs.writeFileSync (for OTHER files) doesn't trip a false positive. We scan code
// lines only, and require the pointer reference + a write call on the SAME logical
// statement window.
function stripComments(src) {
  // remove /* ... */ blocks
  let s = src.replace(/\/\*[\s\S]*?\*\//g, "");
  // remove // line comments
  s = s
    .split(/\r?\n/)
    .map((l) => l.replace(/\/\/.*$/, ""))
    .join("\n");
  return s;
}

// A module is a "pointer writer" if a write call's argument expression references
// the pointer path/basename. Heuristic: find each write call and inspect a small
// window of the surrounding code for the pointer basename combined with a write.
function isPointerWriter(src) {
  const code = stripComments(src);
  const lines = code.split(/\r?\n/);
  // Resolve pointer-path constants: an identifier assigned a path that contains the
  // pointer basename (e.g. `const POINTER_PATH = path.join(..., "admin-preview.json")`).
  // A write to such a constant — or to a tmp derived from it in the same window — is a
  // pointer write even when the literal basename is not on the write line itself
  // (preview.js writes via `renameSync(tmp, POINTER_PATH)`, basename only at the def).
  const ptrVars = [];
  const varRe = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*[^;\n]*admin-preview\.json/g;
  let vm;
  while ((vm = varRe.exec(code))) ptrVars.push(vm[1]);
  const ptrVarRe = ptrVars.length
    ? new RegExp(`\\b(?:${ptrVars.map((v) => v.replace(/\$/g, "\\$")).join("|")})\\b`)
    : null;
  for (let i = 0; i < lines.length; i++) {
    if (!WRITE_FNS.test(lines[i])) continue;
    // window: the write line + 2 lines before/after (multi-line write args).
    const win = lines.slice(Math.max(0, i - 2), i + 3).join("\n");
    if (win.includes(POINTER_BASENAME) || /admin-preview\.json/.test(win) || (ptrVarRe && ptrVarRe.test(win))) {
      return true;
    }
  }
  return false;
}

function adminJsFiles() {
  if (!fs.existsSync(ADMIN_DIR)) return [];
  return fs
    .readdirSync(ADMIN_DIR)
    .filter((f) => f.endsWith(".js"))
    .map((f) => path.join(ADMIN_DIR, f));
}

ok("exactly-one-instance-pointer-writer-across-admin-scripts", () => {
  const files = adminJsFiles();
  assert.ok(files.length >= 1, "expected at least one scripts/admin/*.js");
  const writers = files.filter((f) => isPointerWriter(fs.readFileSync(f, "utf8"))).map((f) => path.basename(f));

  const previewPresent = files.some((f) => path.basename(f) === "preview.js");

  // seed.js (and any non-preview admin script) must NEVER be a pointer writer.
  const illegalWriters = writers.filter((w) => w !== "preview.js");
  assert.deepStrictEqual(
    illegalWriters,
    [],
    `only preview.js may write the instance pointer; illegal writer(s): ${illegalWriters.join(", ") || "none"}`
  );

  if (previewPresent) {
    // Full post-integration assertion: the keystone IS the sole writer.
    assert.strictEqual(
      writers.length,
      1,
      `exactly one pointer writer expected post-integration; found: ${writers.join(", ") || "none"}`
    );
    assert.strictEqual(writers[0], "preview.js", "the single pointer writer must be preview.js");
  } else {
    // Pre-integration worktree: preview.js not yet merged in. The owned invariant
    // (no writer other than preview.js) holds; log the partial state.
    console.log("  note  preview.js absent (pre-integration) — asserted only the no-other-writer half");
  }
});

ok("seed.js-is-a-reader-not-a-writer-of-the-pointer", () => {
  const seedPath = path.join(ADMIN_DIR, "seed.js");
  assert.ok(fs.existsSync(seedPath), "scripts/admin/seed.js must exist");
  const src = fs.readFileSync(seedPath, "utf8");
  assert.strictEqual(isPointerWriter(src), false, "seed.js must NOT write the instance pointer");
  // Positive: it DOES read the pointer.
  assert.ok(/readFileSync\([^)]*pointerPath|readPointer/.test(src), "seed.js must READ the pointer");
});

console.log(`\nsingle-writer-invariant: ${pass}/${pass + fail} pass`);
process.exit(fail ? 1 : 0);
