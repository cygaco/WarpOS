#!/usr/bin/env node
"use strict";

/**
 * arbitration/resolver.js — the `arbitration_resolver` (S1.2; the consumer the
 * decision_record schema names). β DECIDE conf 0.89, EVT-s1-2-hard-halt-arbitration-beta-001.
 *
 * Scans runtime/arbitration/** for OPEN arbitration records (`arbitration_needed
 * === true && resolved !== true`), BUNDLES them PER-UNIT (β ADR delta — a unit's
 * concerns are presented together, NOT per-enforcer, so α/β never resolve one
 * concern blind to the others on the same unit), and orders each bundle by
 * `artifact_precedence` DESC (highest-rank artifact concern leads).
 *
 * It is the FAIL-CLOSED run-end ship-ready GATE (β Q3): EXIT 1 if any unit is
 * parked — a run with ≥1 open arbitration record is NOT ship-ready (never
 * silently green). EXIT 2 on internal error (a resolver that errors must never
 * read green). Wire this as the oneshot run-end gate + the S3.1 pilot exit gate.
 *
 *   node scripts/arbitration/resolver.js [--json]
 */

const fs = require("fs");
const path = require("path");

const ROOT =
  process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const STORE = path.join(ROOT, "runtime", "arbitration");

/** Collect OPEN arbitration records (injectable store for the bite-test). */
function collectOpen(store = STORE) {
  const open = [];
  if (!fs.existsSync(store)) return open;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else if (e.isFile() && e.name.endsWith(".json")) {
        let rec;
        try {
          rec = JSON.parse(fs.readFileSync(full, "utf8"));
        } catch {
          continue; // unparseable record is skipped here; the contract validator catches malformed
        }
        if (
          rec &&
          rec.type === "decision_record" &&
          rec.arbitration_needed === true &&
          rec.resolved !== true
        ) {
          rec._file = full;
          open.push(rec);
        }
      }
    }
  };
  walk(store);
  return open;
}

/** Group records PER-UNIT, each bundle ordered by artifact_precedence DESC (β ADR delta). */
function bundlePerUnit(records) {
  const byUnit = {};
  for (const r of records) {
    const u = r.unit || "(unspecified)";
    (byUnit[u] = byUnit[u] || []).push(r);
  }
  for (const u of Object.keys(byUnit)) {
    byUnit[u].sort(
      (a, b) => (b.artifact_precedence || 0) - (a.artifact_precedence || 0),
    );
  }
  return byUnit;
}

function main(argv) {
  const json = argv.includes("--json");
  let bundles, openCount;
  try {
    const open = collectOpen();
    openCount = open.length;
    bundles = bundlePerUnit(open);
  } catch (e) {
    process.stderr.write(`arbitration-resolver error: ${e.message}\n`);
    return 2; // fail-closed
  }
  const units = Object.keys(bundles);
  const shipReady = units.length === 0;

  if (json) {
    process.stdout.write(
      JSON.stringify(
        { ok: shipReady, check: "arbitration-resolver", openCount, parkedUnits: units, bundles },
        null,
        2,
      ) + "\n",
    );
    return shipReady ? 0 : 1;
  }

  if (shipReady) {
    process.stdout.write(
      "OK   [arbitration-resolver] no open arbitration records — run is ship-ready\n",
    );
    return 0;
  }

  process.stderr.write(
    `HALT [arbitration-resolver] ${openCount} open arbitration record(s) across ${units.length} parked unit(s) — NOT ship-ready (β fail-closed, S1.2):\n`,
  );
  for (const u of units) {
    process.stderr.write(
      `  ▸ unit "${u}" — ${bundles[u].length} concern(s), precedence-ordered:\n`,
    );
    for (const r of bundles[u]) {
      process.stderr.write(
        `      - [${r.owner} @prec ${r.artifact_precedence || 0}] ${r.decision} :: ${String(r.rationale).slice(0, 140)} (conf ${r.confidence})\n`,
      );
    }
  }
  process.stderr.write(
    "  Resolve: α/β arbitrate each per-unit bundle (highest-precedence concern leads), then set resolved:true on each record (or remove). Re-run to clear the gate.\n",
  );
  return 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { collectOpen, bundlePerUnit, STORE, main };
