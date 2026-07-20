#!/usr/bin/env node
"use strict";
/**
 * check-lib-prevention.js — Claude hook consumer (SP-20260720-002 Phase 4, Seam D-a): require()s the ONE
 * shared check-lib module (never a bespoke duplicate) and runs its REQUIRED_CHECKS as EARLY, IN-SESSION
 * feedback. This hook is explicitly NON-AUTHORITATIVE for merge-into-main (that authority is the
 * controller's out-of-tree pinned run, Seam B) — a bypass or crash here is harmless per R-8/AC-12 because
 * the sole route into `main` is the controller, not this hook. It exists to catch the cheap, fast subset
 * of problems (a NUL-byte artifact, a hollow-success envelope) before they even reach a commit.
 *
 * Only `status:"fail"`/`"timeout"` results BLOCK (exit 2); `"skipped"` is informational (e.g. the
 * false-green-envelope check has nothing to evaluate on a generic file write with no envelope in scope) —
 * skips are NOT this hook's authority to escalate; that is the controller's job (its run-manifest
 * reconciliation treats a skipped REQUIRED check as fatal, a materially stricter bar appropriate to an
 * irreversible merge, not to an in-session keystroke).
 */

const checkLib = require("../dispatch/check-lib");

/**
 * runPrevention(ctx) -> {version, results, missing, blocked, blockingReasons}. Pure-ish: runs
 * `REQUIRED_CHECKS` from the shared registry against `ctx` and reduces to a block/pass decision. Exposed
 * for direct programmatic use (falsifiers/tests, and any skill that wants to screen an envelope
 * in-process); the CLI stdin path below is a thin wrapper over this.
 */
function runPrevention(ctx = {}) {
  const suite = checkLib.runSuite(checkLib.REQUIRED_CHECKS, ctx);
  const blockingReasons = suite.results
    .filter((r) => r.status === "fail" || r.status === "timeout")
    .map((r) => ({ name: r.name, status: r.status, reason: r.reason }));
  if (suite.missing.length) {
    blockingReasons.push({ name: suite.missing.join(","), status: "missing", reason: "check-registry-drift" });
  }
  return { ...suite, blocked: blockingReasons.length > 0, blockingReasons };
}

/** Build a check-lib ctx from a Claude Code PreToolUse-shaped hook event. */
function ctxFromHookEvent(event) {
  const filePath = event && event.tool_input && event.tool_input.file_path;
  const content = (event && event.tool_input && (event.tool_input.content || event.tool_input.new_string)) || "";
  return {
    envelope: event && event.envelope, // when a caller (e.g. a wrapping skill) supplies a ResultEnvelope to screen
    filePath,
    content,
    // root is intentionally left for each check's own resolution (e.g. no-nul-bytes's __dirname-anchored
    // guess) rather than CLAUDE_PROJECT_DIR here — that env var reflects the INVOKING session's project
    // root, which can be a DIFFERENT checkout than the worktree this hook is actually installed in.
  };
}

function main() {
  let input = "";
  process.stdin.on("data", (chunk) => (input += chunk));
  process.stdin.on("end", () => {
    let ctx = {};
    try {
      const event = JSON.parse(input || "{}");
      ctx = ctxFromHookEvent(event);
    } catch {
      // malformed/absent event JSON — proceed with an empty ctx; checks fail closed on missing input
      // themselves (e.g. 'no-envelope-in-context' -> skipped), this hook never treats a parse failure
      // as an implicit pass of anything it hasn't actually evaluated.
    }
    let result;
    try {
      result = runPrevention(ctx);
    } catch (e) {
      // A hook RUNNER crash must not silently BLOCK every write forever — this gate is non-authoritative
      // by design (Seam D), so fail OPEN here (exit 0) while still surfacing the error loudly on stderr.
      process.stderr.write(`check-lib-prevention: runner error (fail-open, non-blocking gate): ${e && e.message ? e.message : e}\n`);
      process.exit(0);
    }
    if (result.blocked) {
      process.stderr.write(`check-lib-prevention: BLOCKED — ${JSON.stringify(result.blockingReasons)}\n`);
      process.exit(2);
    }
    process.exit(0);
  });
}

module.exports = { runPrevention, ctxFromHookEvent };

if (require.main === module) main();
