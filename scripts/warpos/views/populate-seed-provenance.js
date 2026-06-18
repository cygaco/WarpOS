#!/usr/bin/env node
/**
 * scripts/warpos/views/populate-seed-provenance.js — write PROVENANCE markers
 * into a product's seeded `_requirements/*` + `_docs/*` skeleton zones.
 *
 * SP-20260618-001 / U2 (seed-zone provenance).
 *
 * THE GAP THIS CLOSES: scaffold-core.js seeds the structure-parity skeleton
 * (the `_requirements/*` zones + the `_docs/` brief/clone homes) as empty dirs,
 * each carrying only a bare `.gitkeep`. A bare `.gitkeep` records NOTHING about
 * where the skeleton came from. This writer augments each seed zone with a
 * `.provenance.json` marker that records:
 *   - `seeded_from` — the framework SOURCE the zone was seeded from. U1 moved the
 *     template/baseline home under `_warpos/` (`_warpos/templates/...` and the
 *     `_warpos/BASELINE/...` snapshot of the `_requirements/_docs` skeleton). The
 *     seed zones this writer covers are the BASELINE-snapshot zones, so their
 *     source is `_warpos/BASELINE/<zone>`. This writer NEVER references the old,
 *     now-deleted framework templates location — only `_warpos/`.
 *   - `framework_version` — the WarpOS version that seeded the zone.
 *   - `seeded_by` — a "seeded by /warp:setup" note.
 *
 * SIBLING TO populate-source.js (NOT merged into it): populate-source.js mirrors
 * the framework VIEW source into `_warpos/` so regenerate.js does real work — a
 * different job. Keeping provenance in its own module keeps the two concerns
 * separate (β: own-the-seam, don't fork-by-overloading).
 *
 * IDEMPOTENT / skip-if-modified (same content-addressed discipline
 * populate-source.js uses):
 *   - marker MISSING            → write it.
 *   - marker present & EQUAL    → no-op (a re-run is byte-stable).
 *   - marker present & DIFFERS  → operator-modified → LEAVE untouched (preserve).
 * The writer only ever touches `.provenance.json`; every other file in a zone
 * (operator content, the `.gitkeep`) is never read or written. The marker body
 * is a pure function of (zone, version) — no wall-clock timestamp — so two runs
 * against the same inputs are byte-identical.
 *
 * PURE FUNCTION with an injectable target root (like populateSource) so the test
 * can drive it against a throwaway fixture.
 *
 * Usage (programmatic — how scaffold-core.js calls it):
 *   const { populateSeedProvenance } = require(".../views/populate-seed-provenance.js");
 *   populateSeedProvenance({ targetRoot, warposRoot, zones, log });
 *
 * Usage (CLI — for re-seeding / debugging):
 *   node scripts/warpos/views/populate-seed-provenance.js \
 *     --target <product-root> [--warpos <clone>] [--json]
 *
 * Exit codes: 0 = markers written / already current; 1 = write failure;
 *             2 = CLI/IO error (bad root).
 */

"use strict";

const fs = require("fs");
const path = require("path");

// The framework SOURCE root the seed zones are seeded from. U1 relocated the
// baseline snapshot of the `_requirements/_docs` skeleton here; the writer points
// every marker at `${BASELINE_PREFIX}/<zone>`. Deliberately under `_warpos/` —
// the writer must never name the old, deleted templates location.
const BASELINE_PREFIX = "_warpos/BASELINE";

const PROVENANCE_FILE = ".provenance.json";
const PROVENANCE_SCHEMA = "warpos/seed-provenance/v1";

// Strip a leading UTF-8 BOM (PowerShell-written / fresh-migration JSON carries
// one) before JSON.parse — mirrors the inline fix in update.js.
const stripBom = (s) => (typeof s === "string" ? s.replace(/^﻿/, "") : s);

/**
 * Resolve the WarpOS version that is seeding the zones. Prefer an explicit
 * override, then the installing SOURCE clone's version.json (the version
 * actually being installed), then the target's own, else a safe default.
 */
function resolveWarposVersion({ warposVersion, warposRoot, targetRoot }) {
  if (warposVersion && typeof warposVersion === "string") return warposVersion;
  for (const root of [warposRoot, targetRoot]) {
    if (!root) continue;
    try {
      const vj = JSON.parse(
        stripBom(fs.readFileSync(path.join(root, "version.json"), "utf8")),
      );
      if (vj && typeof vj.version === "string" && vj.version) return vj.version;
    } catch {
      /* try the next candidate */
    }
  }
  return "0.0.0";
}

/**
 * Normalize a zone path string to a forward-slash relative dir (no trailing
 * slash). Pure — the marker body depends only on (zone, version).
 */
function normalizeZone(zone) {
  return String(zone).replace(/\\/g, "/").replace(/\/+$/, "");
}

/**
 * The deterministic marker body for a zone. No timestamp by design — the
 * framework_version is the temporal anchor, so a re-run is byte-stable.
 */
function expectedMarker(zoneRel, version) {
  const body = {
    $schema: PROVENANCE_SCHEMA,
    zone: zoneRel,
    seeded_from: `${BASELINE_PREFIX}/${zoneRel}`,
    framework_version: version,
    seeded_by: "/warp:setup",
    note:
      "Provenance for a WarpOS seed zone — records the framework source this " +
      "skeleton was seeded from. Safe to edit or delete; WarpOS will not " +
      "overwrite a modified marker.",
  };
  return JSON.stringify(body, null, 2) + "\n";
}

/**
 * Resolve the default seed-zone list — the SAME list scaffold-core.js ensures.
 * Lazy require (only when zones aren't passed in) so there is no load-time
 * circular dependency: scaffold-core.js requires THIS module lazily, inside
 * scaffoldProduct, after its own module has fully loaded.
 */
function defaultZones() {
  try {
    const core = require("../scaffold-core");
    if (Array.isArray(core.SKELETON_DIRS)) return core.SKELETON_DIRS;
  } catch {
    /* fall through */
  }
  return [];
}

/**
 * populateSeedProvenance — core entry. Writes a `.provenance.json` marker into
 * each seed zone under `targetRoot`.
 *
 * @param {object}   opts
 * @param {string}   opts.targetRoot      product root (where zones live)
 * @param {string}  [opts.warposRoot]     installing source clone (for version.json)
 * @param {string[]}[opts.zones]          seed-zone dir list; defaults to
 *                                         scaffold-core's SKELETON_DIRS
 * @param {string}  [opts.warposVersion]  explicit framework version override
 * @param {function}[opts.log]            reporter log(status, msg)
 * @returns {{ok, code, version, written, unchanged, preserved, failed}}
 */
function populateSeedProvenance(opts) {
  const targetRoot = path.resolve(opts.targetRoot);
  const warposRoot = opts.warposRoot ? path.resolve(opts.warposRoot) : null;
  const log = typeof opts.log === "function" ? opts.log : () => {};

  const result = {
    ok: true,
    code: 0,
    version: null,
    written: [],
    unchanged: [],
    preserved: [],
    failed: [],
  };

  if (!fs.existsSync(targetRoot) || !fs.statSync(targetRoot).isDirectory()) {
    return { ...result, ok: false, code: 2, error: `target not a directory: ${targetRoot}` };
  }

  const zones = Array.isArray(opts.zones) ? opts.zones : defaultZones();
  const version = resolveWarposVersion({
    warposVersion: opts.warposVersion,
    warposRoot,
    targetRoot,
  });
  result.version = version;

  for (const rawZone of zones) {
    const zoneRel = normalizeZone(rawZone);
    if (!zoneRel) continue;
    const markerAbs = path.join(targetRoot, zoneRel, PROVENANCE_FILE);
    const expected = expectedMarker(zoneRel, version);
    try {
      if (fs.existsSync(markerAbs)) {
        const current = fs.readFileSync(markerAbs, "utf8");
        // Compare against the expected body. Equal → idempotent no-op. Differs →
        // operator-modified; leave it untouched (preserve), never clobber.
        if (current === expected) result.unchanged.push(zoneRel);
        else result.preserved.push(zoneRel);
        continue;
      }
      fs.mkdirSync(path.dirname(markerAbs), { recursive: true });
      fs.writeFileSync(markerAbs, expected);
      result.written.push(zoneRel);
    } catch (err) {
      result.failed.push({ zone: zoneRel, reason: err.message });
    }
  }

  if (result.failed.length > 0) {
    result.ok = false;
    result.code = 1;
  }

  log(
    result.ok ? "ok" : "warn",
    `seed-zone provenance: ${result.written.length} written, ` +
      `${result.unchanged.length} unchanged, ${result.preserved.length} preserved ` +
      `(operator-modified)${result.failed.length ? `, ${result.failed.length} failed` : ""} @ v${version}`,
  );
  return result;
}

// ── CLI ──────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = { target: null, warpos: null, json: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--target") out.target = argv[++i];
    else if (a === "--warpos") out.warpos = argv[++i];
    else if (a === "--json") out.json = true;
  }
  return out;
}

function main() {
  const opts = parseArgs(process.argv);
  if (opts.help || !opts.target) {
    process.stdout.write(
      "scripts/warpos/views/populate-seed-provenance.js — write seed-zone provenance markers\n\n" +
        "Usage:\n  node scripts/warpos/views/populate-seed-provenance.js --target <product-root> [--warpos <clone>] [--json]\n\n" +
        "--warpos defaults to the clone this script lives in.\n",
    );
    return opts.help ? 0 : 2;
  }
  const warposRoot = opts.warpos || path.resolve(__dirname, "..", "..", "..");
  const r = populateSeedProvenance({ targetRoot: opts.target, warposRoot });
  if (opts.json) {
    process.stdout.write(JSON.stringify(r, null, 2) + "\n");
  } else if (!r.ok && r.code === 2) {
    process.stderr.write(`populate-seed-provenance failed: ${r.error}\n`);
  } else {
    process.stdout.write(
      `populate-seed-provenance: ${r.written.length} written, ${r.unchanged.length} unchanged, ` +
        `${r.preserved.length} preserved, ${r.failed.length} failed (v${r.version})\n`,
    );
  }
  return r.code || 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  populateSeedProvenance,
  resolveWarposVersion,
  expectedMarker,
  normalizeZone,
  BASELINE_PREFIX,
  PROVENANCE_FILE,
};
