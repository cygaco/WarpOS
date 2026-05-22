#!/usr/bin/env node
"use strict";

/**
 * scripts/product/bootstrap.js — thin re-export shim (T-20260521-177).
 *
 * Canonical implementation moved to scripts/portfolio/bootstrap.js as part of
 * the /product:* → /portfolio:* namespace migration (sprint SP-20260521-001,
 * granular story S-10). This shim exists for one release cycle so existing
 * callers and external consumers do not break.
 *
 * Removal target: next minor release after T-176 (skill rename) ships its
 * deprecation banner. After that, the /product:bootstrap skill is removed
 * and this shim goes with it.
 *
 * Contract preserved:
 *   - `require('scripts/product/bootstrap')` returns the same object as
 *     `require('scripts/portfolio/bootstrap')`.
 *   - `node scripts/product/bootstrap.js --help` (and any other CLI invocation)
 *     prints the same help and behaves identically to running the canonical
 *     script directly (AC-10.2).
 */

const target = require("../portfolio/bootstrap");

// Re-export every named export.
module.exports = target;

// CLI passthrough: if invoked directly (not required), forward to the
// canonical script via a fresh subprocess so argv/process.exit semantics stay
// honest. We can't simply re-invoke the canonical module's main() because the
// `if (require.main === module) main();` guard there will not match when
// require'd; running as a subprocess preserves exact CLI fidelity.
if (require.main === module) {
  const { spawnSync } = require("child_process");
  const path = require("path");
  const canonical = path.resolve(__dirname, "..", "portfolio", "bootstrap.js");
  const r = spawnSync(process.execPath, [canonical, ...process.argv.slice(2)], {
    stdio: "inherit",
  });
  process.exit(r.status == null ? 1 : r.status);
}
