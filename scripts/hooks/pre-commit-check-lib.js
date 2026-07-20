#!/usr/bin/env node
"use strict";
/**
 * pre-commit-check-lib.js — the git pre-commit consumer of the shared check-lib (SP-20260720-002 Phase 4,
 * Seam D consumer b). FAST, EXPLICITLY NON-AUTHORITATIVE local feedback: `require()`s the check-lib SOURCE
 * (never the pinned bundle — resolving/promoting the pinned snapshot is trusted-controller.js's exclusive
 * job, Seam B) and runs its REQUIRED_CHECKS against the working tree for a quick, cheap, in-session signal
 * before a commit even lands.
 *
 * THIS HOOK IS NEVER THE AUTHORITY BOUNDARY (R-8 / AC-12). `git commit --no-verify` skips it entirely, and
 * even when it runs and reports clean, that verdict decides NOTHING about integration: the sole route into
 * a protected ref is trusted-controller.js's out-of-tree pinned run (Seam B) gated by the
 * `reference-transaction` hook's fence (Seam E) — a mechanism `--no-verify` does NOT bypass. See
 * precommit-bypass-harmless.falsifier.test.js for the proof that a `--no-verify` candidate still requires a
 * brand-new controller-run AcceptanceRecord to integrate.
 *
 * Exit 0 = clean (or non-authoritative issues found and reported, per opts). Exit 1 = a required check
 * failed/skipped-required/timed-out — a signal, not a gate; `git commit --no-verify` sails right past it.
 */

const checkLib = require("../dispatch/check-lib");

/**
 * runCheckLibSuite(ctx) -> {version, results, missing, blocked, blockingReasons}. Pure-ish: runs the FULL
 * `CHECK_NAMES` set (not just REQUIRED_CHECKS — local feedback should surface everything, even an
 * informational skip) and reduces to a block/pass decision scoped to REQUIRED checks only (a skipped
 * OPTIONAL check is not itself blocking local feedback). Exposed for direct programmatic use (falsifiers,
 * any skill that wants pre-commit-shaped signal in-process); the CLI path below is a thin wrapper.
 */
function runCheckLibSuite(ctx = {}) {
  const suite = checkLib.runSuite(checkLib.CHECK_NAMES.slice(), ctx);
  const requiredSet = new Set(checkLib.REQUIRED_CHECKS);
  const blockingReasons = suite.results
    .filter((r) => r.status === "fail" || r.status === "timeout" || (r.status === "skipped" && requiredSet.has(r.name)))
    .map((r) => ({ name: r.name, status: r.status, reason: r.reason }));
  if (suite.missing.length) {
    blockingReasons.push({ name: suite.missing.join(","), status: "missing", reason: "check-registry-drift" });
  }
  return { ...suite, blocked: blockingReasons.length > 0, blockingReasons };
}

function main() {
  let result;
  try {
    result = runCheckLibSuite({ root: process.cwd() });
  } catch (e) {
    // A hook RUNNER crash must not permanently strangle every local commit — this gate is explicitly
    // non-authoritative (Seam D); fail OPEN (exit 0) while surfacing the error loudly on stderr.
    process.stderr.write(`pre-commit-check-lib: runner error (fail-open, non-authoritative gate): ${e && e.message ? e.message : e}\n`);
    return 0;
  }
  if (result.blocked) {
    process.stderr.write(
      "pre-commit-check-lib: local check-lib feedback found issue(s) — NON-AUTHORITATIVE (bypassable via " +
        "--no-verify; the real gate is trusted-controller.js's out-of-tree pinned run, Seam E):\n",
    );
    for (const r of result.blockingReasons) {
      process.stderr.write(`  - ${r.name}: ${r.status}${r.reason ? ` (${r.reason})` : ""}\n`);
    }
    return 1;
  }
  process.stdout.write("pre-commit-check-lib: OK (non-authoritative local signal only)\n");
  return 0;
}

if (require.main === module) process.exit(main());

module.exports = { runCheckLibSuite, main };
