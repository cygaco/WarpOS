#!/usr/bin/env node
"use strict";

/**
 * scripts/product/import.js — thin re-export shim (T-20260521-177).
 *
 * Canonical implementation moved to scripts/portfolio/import.js as part of the
 * /product:* → /portfolio:* namespace migration (sprint SP-20260521-001,
 * granular story S-10). This shim exists for one release cycle so existing
 * callers and external consumers do not break.
 *
 * Removal target: next minor release after T-176 (skill rename) ships its
 * deprecation banner. After that, the /product:import skill is removed and
 * this shim goes with it.
 *
 * Contract preserved:
 *   - `require('scripts/product/import')` returns the same object as
 *     `require('scripts/portfolio/import')`.
 *   - `node scripts/product/import.js --help` (and any other CLI invocation)
 *     prints the same help and behaves identically to running the canonical
 *     script directly (AC-10.2).
 */

const target = require("../portfolio/import");

// Re-export every named export.
module.exports = target;

// CLI passthrough — see scripts/product/bootstrap.js for rationale.
if (require.main === module) {
  const { spawnSync } = require("child_process");
  const path = require("path");
  const canonical = path.resolve(__dirname, "..", "portfolio", "import.js");
  const r = spawnSync(process.execPath, [canonical, ...process.argv.slice(2)], {
    stdio: "inherit",
  });
  process.exit(r.status == null ? 1 : r.status);
}
