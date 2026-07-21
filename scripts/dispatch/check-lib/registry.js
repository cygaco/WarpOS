"use strict";
/**
 * registry.js — the FIXED check-name enumeration + suite version (SP-20260720-002 Phase 4, unit BUNDLE).
 *
 * This is the SINGLE internal source for the anti-drift name contract: `index.js` (the public module) and
 * any in-lib consumer (e.g. `checks/suite-completeness.js`) read the frozen arrays from HERE — neither ever
 * re-declares them. Extracted to its own tiny file (rather than living inline in index.js) purely to break a
 * require cycle: `checks/suite-completeness.js` needs to know the full CHECK_NAMES set, and `index.js` needs
 * to require the check modules — if `index.js` were the only holder of CHECK_NAMES, `suite-completeness.js`
 * would have to require `../index` (circular). This file has ZERO dependency on `index.js` or any check
 * module, so there is no cycle.
 *
 * NOT a plugin framework: this file enumerates NAMES only. The check MODULES those names bind to are
 * require()'d explicitly, one line per name, in `index.js`'s REGISTRY object — never directory-scanned,
 * never dynamically discovered. Adding a check means editing three places, in order: (1) add the name here,
 * (2) add its module under `checks/`, (3) add one `require()` line in `index.js`'s REGISTRY. A name added
 * here with no matching REGISTRY entry throws at `index.js` load time (see the anti-drift self-check there).
 */

const SUITE_VERSION = "check-suite/v1";

// Seed set (build_spec §1.1 / PRD S-1). All three are REQUIRED — none may be silently absent or skipped.
const CHECK_NAMES = Object.freeze(["false-green-envelope", "no-nul-bytes", "suite-completeness"]);

// Subset whose absence/skip is fatal (controller reconcile: `required-check-skipped` / `missing-required-check`).
// For the seed set every check is load-bearing, so REQUIRED_CHECKS === CHECK_NAMES today; a FUTURE optional
// check would be added to CHECK_NAMES only, leaving REQUIRED_CHECKS narrower — REQUIRED_CHECKS must always be
// a subset of CHECK_NAMES (asserted in index.js).
const REQUIRED_CHECKS = Object.freeze(["false-green-envelope", "no-nul-bytes", "suite-completeness"]);

module.exports = { SUITE_VERSION, CHECK_NAMES, REQUIRED_CHECKS };
