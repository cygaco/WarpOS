#!/usr/bin/env node
/**
 * scripts/warpos/test-seed-provenance.js — coverage for the seed-zone
 * PROVENANCE writer (views/populate-seed-provenance.js, SP-20260618-001 / U2).
 *
 * Proves the U2 verified_by contract:
 *   1. On a fresh fixture, every seeded `_requirements/*` + `_docs/*` zone gets a
 *      `.provenance.json` whose `seeded_from` resolves under `_warpos/BASELINE/...`
 *      (or `_warpos/templates/...`) — NEVER the deleted framework-templates home.
 *   2. The writer is IDEMPOTENT (a second run is byte-for-byte stable) AND a
 *      pre-edited operator file (and a hand-edited marker) is preserved untouched.
 *   3. NEGATIVE seam: the module source contains zero references to the deleted
 *      framework-templates path (the needle is built dynamically so this test
 *      file itself never embeds the forbidden literal — no self-trip).
 *
 * Exit: 0 = all pass; 1 = any fail.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

const MODULE_PATH = path.join(__dirname, "views", "populate-seed-provenance.js");
const { populateSeedProvenance, BASELINE_PREFIX, PROVENANCE_FILE } = require(MODULE_PATH);
const { SKELETON_DIRS } = require("./scaffold-core");

let pass = 0;
let fail = 0;
function ok(name, cond, detail) {
  if (cond) {
    process.stdout.write(`  ok  ${name}\n`);
    pass++;
  } else {
    process.stderr.write(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}\n`);
    fail++;
  }
}

const noop = () => {};
// The forbidden seed source, assembled at runtime so the literal never appears
// contiguously in THIS file (and the negative seam rg stays zero here too).
const FORBIDDEN_SOURCE = ["framework", "templates"].join("/");

function snapshotMarkers(root) {
  const out = {};
  for (const zone of SKELETON_DIRS) {
    const abs = path.join(root, zone, PROVENANCE_FILE);
    out[zone] = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
  }
  return out;
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-seed-prov-"));
try {
  // ── 1. Fresh seed: every zone gets a well-formed provenance marker ──
  // Pre-create the zone dirs (scaffold-core does this before calling the writer)
  // so the fixture mirrors a real install; the writer also mkdir's defensively.
  for (const zone of SKELETON_DIRS) {
    fs.mkdirSync(path.join(tmp, zone), { recursive: true });
  }

  const VERSION = "9.9.9";
  // No `zones` passed → exercises the default-zones path (scaffold-core's
  // SKELETON_DIRS via lazy require).
  const r1 = populateSeedProvenance({ targetRoot: tmp, warposVersion: VERSION, log: noop });

  ok("writer ok + wrote every seed zone", r1.ok && r1.written.length === SKELETON_DIRS.length,
    `ok=${r1.ok} written=${r1.written.length}/${SKELETON_DIRS.length}`);
  ok("writer reports the seeding version", r1.version === VERSION, `version=${r1.version}`);

  let allMarkersValid = true;
  let firstBadDetail = "";
  for (const zone of SKELETON_DIRS) {
    const abs = path.join(tmp, zone, PROVENANCE_FILE);
    if (!fs.existsSync(abs)) {
      allMarkersValid = false;
      firstBadDetail = firstBadDetail || `missing marker for ${zone}`;
      continue;
    }
    let marker;
    try {
      marker = JSON.parse(fs.readFileSync(abs, "utf8"));
    } catch (e) {
      allMarkersValid = false;
      firstBadDetail = firstBadDetail || `unparseable marker for ${zone}: ${e.message}`;
      continue;
    }
    const srcOk =
      typeof marker.seeded_from === "string" &&
      (marker.seeded_from.startsWith("_warpos/BASELINE/") ||
        marker.seeded_from.startsWith("_warpos/templates/")) &&
      marker.seeded_from === `${BASELINE_PREFIX}/${zone}`;
    const fieldsOk =
      marker.framework_version === VERSION &&
      marker.seeded_by === "/warp:setup" &&
      marker.zone === zone &&
      !marker.seeded_from.includes(FORBIDDEN_SOURCE);
    if (!srcOk || !fieldsOk) {
      allMarkersValid = false;
      firstBadDetail = firstBadDetail || `bad marker for ${zone}: seeded_from=${marker.seeded_from}`;
    }
  }
  ok("every zone marker: seeded_from under _warpos/ + correct fields", allMarkersValid, firstBadDetail);

  // ── 2a. Idempotent: a second run is byte-for-byte stable ──
  const before = snapshotMarkers(tmp);
  const r2 = populateSeedProvenance({ targetRoot: tmp, warposVersion: VERSION, log: noop });
  const after = snapshotMarkers(tmp);
  const byteStable = SKELETON_DIRS.every((z) => before[z] === after[z] && after[z] !== null);
  ok("second run is byte-stable (idempotent)", byteStable);
  ok("second run writes nothing new, all unchanged",
    r2.written.length === 0 && r2.unchanged.length === SKELETON_DIRS.length,
    `written=${r2.written.length} unchanged=${r2.unchanged.length}`);

  // ── 2b. Pre-edited operator content + hand-edited marker are preserved ──
  const userZone = "_requirements/00-canonical";
  const userFile = path.join(tmp, userZone, "USER_NOTES.md");
  const userContent = "# my notes\noperator-authored — must survive a re-run\n";
  fs.writeFileSync(userFile, userContent);

  const editedMarkerZone = "_docs";
  const editedMarkerAbs = path.join(tmp, editedMarkerZone, PROVENANCE_FILE);
  const operatorMarker = JSON.stringify({ custom: "operator-edited marker" }, null, 2) + "\n";
  fs.writeFileSync(editedMarkerAbs, operatorMarker);

  const r3 = populateSeedProvenance({ targetRoot: tmp, warposVersion: VERSION, log: noop });

  ok("pre-edited operator content file untouched",
    fs.readFileSync(userFile, "utf8") === userContent);
  ok("hand-edited marker preserved, not clobbered",
    fs.readFileSync(editedMarkerAbs, "utf8") === operatorMarker &&
      r3.preserved.includes(editedMarkerZone),
    `preserved=${JSON.stringify(r3.preserved)}`);

  // ── 3. NEGATIVE seam: module names the deleted templates path zero times ──
  const moduleSrc = fs.readFileSync(MODULE_PATH, "utf8");
  ok(`module has zero "${FORBIDDEN_SOURCE}" references`,
    !moduleSrc.includes(FORBIDDEN_SOURCE));
  ok("module references the _warpos/ baseline source", moduleSrc.includes("_warpos/BASELINE"));
} finally {
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {
    /* best-effort */
  }
}

process.stdout.write(`\n${pass} pass / ${fail} fail\n`);
process.exit(fail === 0 ? 0 : 1);
