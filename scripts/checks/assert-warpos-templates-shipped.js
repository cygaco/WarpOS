#!/usr/bin/env node
"use strict";
/**
 * assert-warpos-templates-shipped.js — anti-value-inversion proof for the
 * SP-20260618-001 framework/templates → _warpos/templates migration.
 *
 * ship-coverage proves "no owner=framework path is unshipped". This asserts the
 * STRONGER, migration-specific invariant the quality-lead made binding (addendum §2):
 * a single `src` entry for the dir is NOT enough — every one of the 108 template
 * files across all 9 subtrees must actually land in the shipped set (count +
 * membership, not a one-string smoke). Plus the NEGATIVE: _warpos build-outputs
 * (MANIFEST.json, settings/) must NOT be shipped (proves the carve was surgical).
 *
 * Run pre-delete AND post-delete (both must pass). Exit 0 = all assertions hold; 1 = fail.
 */
const fs = require("fs");
const path = require("path");
const ROOT = process.cwd();

const TEMPLATES_REL = "_warpos/templates";
const EXPECTED_SUBTREES = [
  "app-scaffold", "canonical", "lastmile", "portfolio", "product-bootstrap",
  "product-clone", "product-import", "report", "sprint",
];
const EXPECTED_FILE_COUNT = 108;

function toRel(p) {
  return p.split(path.sep).join("/");
}

// Flatten framework-manifest assets into the shipped src/dest path set (same walk
// as warpos-ship-coverage.js#shippedPathSet — the authoritative shipped set).
function shippedPathSet(fm) {
  const set = new Set();
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      if (v.src || v.dest) {
        if (v.src) set.add(v.src);
        if (v.dest) set.add(v.dest);
      } else for (const k of Object.keys(v)) walk(v[k]);
    }
  };
  walk(fm.assets);
  for (const key of ["generated_files", "version_file", "installer_script"]) {
    if (fm[key]) walk(fm[key]);
  }
  return set;
}

// Recursively list files under a dir, project-relative with forward slashes.
function listFiles(absDir, relBase, out) {
  for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
    const abs = path.join(absDir, ent.name);
    const rel = `${relBase}/${ent.name}`;
    if (ent.isDirectory()) listFiles(abs, rel, out);
    else out.push(rel);
  }
  return out;
}

function main() {
  const failures = [];
  const fm = JSON.parse(fs.readFileSync(path.join(ROOT, ".claude/framework-manifest.json"), "utf8"));
  const shipped = shippedPathSet(fm);

  // ── POSITIVE: count + membership ──────────────────────────────────────────
  const tmplAbs = path.join(ROOT, TEMPLATES_REL);
  if (!fs.existsSync(tmplAbs)) {
    failures.push(`POSITIVE: ${TEMPLATES_REL} does not exist on disk`);
  } else {
    const onDisk = listFiles(tmplAbs, TEMPLATES_REL, []).map(toRel);
    // (a) file count
    if (onDisk.length !== EXPECTED_FILE_COUNT) {
      failures.push(`POSITIVE: expected ${EXPECTED_FILE_COUNT} files under ${TEMPLATES_REL}, found ${onDisk.length}`);
    }
    // (b) every on-disk template file is in the shipped set (membership, not single-string)
    const missing = onDisk.filter((p) => !shipped.has(p));
    if (missing.length) {
      failures.push(`POSITIVE: ${missing.length} ${TEMPLATES_REL} file(s) NOT in shipped set, e.g.:\n    - ${missing.slice(0, 5).join("\n    - ")}`);
    }
    // (c) all 9 subtrees represented in the shipped set
    for (const sub of EXPECTED_SUBTREES) {
      const prefix = `${TEMPLATES_REL}/${sub}/`;
      const anyShipped = [...shipped].some((p) => p.startsWith(prefix));
      if (!anyShipped) failures.push(`POSITIVE: subtree ${prefix} has ZERO shipped files`);
    }
    const shippedTemplateCount = [...shipped].filter((p) => p.startsWith(`${TEMPLATES_REL}/`)).length;
    console.log(`POSITIVE: ${onDisk.length} files on disk, ${shippedTemplateCount} ${TEMPLATES_REL}/* paths in shipped set, ${EXPECTED_SUBTREES.length} subtrees checked`);
  }

  // ── NEGATIVE: _warpos build-outputs must NOT ship ─────────────────────────
  const mustNotShip = ["_warpos/MANIFEST.json", "_warpos/settings/defaults.json"];
  for (const p of mustNotShip) {
    if (shipped.has(p)) failures.push(`NEGATIVE: ${p} IS in the shipped set (carve not surgical)`);
  }
  if ([...shipped].some((p) => p.startsWith("_warpos/settings/"))) {
    failures.push(`NEGATIVE: a _warpos/settings/* path IS in the shipped set`);
  }
  console.log(`NEGATIVE: confirmed _warpos/MANIFEST.json + _warpos/settings/* NOT shipped`);

  if (failures.length) {
    console.error(`\nFAIL (${failures.length}):\n - ${failures.join("\n - ")}`);
    process.exit(1);
  }
  console.log("\nOK — all positive (count+membership) and negative assertions hold.");
}

main();
