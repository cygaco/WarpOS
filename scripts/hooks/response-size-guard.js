#!/usr/bin/env node
// PostToolUse hook: flags oversized Agent responses from build-chain
// subagents (builder/fixer/reviewer/compliance/qa/redteam/learner/delta).
//
// Why this exists:
//   Run-8 halted at Phase 2 because in-process Agent dispatch returned
//   100K+ chars of prose per reviewer, overflowing the orchestrator's
//   context window. The canonical fix is Bash-subprocess dispatch with
//   parseProviderJson returning a ~2K JSON envelope, but the harness
//   blocks `claude -p *` without explicit allow rules. So the in-process
//   fallback is what we have.
//
// What this DOES:
//   - Measures the response size for build-chain Agent calls
//   - Logs a "response_size" event with {subagent_type, bytes, threshold}
//   - Writes a warn-tier audit entry if oversized
//   - Surfaces the warning in stderr so it appears in the conversation
//
// What this does NOT do:
//   - Does not truncate or rewrite the response (that would corrupt the
//     calling agent's parse expectations)
//   - Does not block the dispatch (post-hoc — too late by then)
//
// Real enforcement remains:
//   1. delta-dispatch-builder.js prompt template must mandate JSON envelope
//   2. builder.md / fixer.md persona must say "OUTPUT IS JSON ONLY"
//   3. parseProviderJson must reject non-envelope responses
//
// This hook is a tripwire that lets the learner pattern-match oversized
// responses and recommend prompt-template tightening over time.

const fs = require("fs");
const path = require("path");

// ADR-0007: normalize legacy role names to canonical so a renamed role's
// response is still size-checked. Fail-open identity if unavailable.
let normalizeRole = (r) => r;
try {
  ({ normalizeRole } = require("./lib/role-aliases"));
} catch {
  /* keep identity */
}

// Build-chain subagent types whose responses should be JSON-envelope-shaped.
// ADR-0007 roster + legacy aliases (evaluator/auditor/redteam/compliance/qa).
// Lookups normalize first, so a legacy id folds onto its canonical role.
const BUILD_CHAIN = new Set([
  // ADR-0007 roster:
  "frontend-builder", "backend-builder", "security-builder",
  "frontend-fixer", "backend-fixer", "security-fixer",
  "frontend-reviewer", "backend-reviewer", "qa-reviewer", "security-reviewer",
  // S-7: canonical names (lookups normalize first, so the set must carry the
  // NEW canonical so a dispatch by the new id is recognized). Legacy ids below.
  "ops-analyst", "skeleton-builder", "delta",
  // generic transitional + legacy aliases:
  "builder", "fixer", "fix-agent", "reviewer", "evaluator",
  "compliance", "learner", "auditor", "stub-scaffold", "qa", "redteam",
]);

// Soft warn threshold (8KB) and hard concern threshold (32KB)
const WARN_BYTES = 8 * 1024;
const CONCERN_BYTES = 32 * 1024;

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    const event = JSON.parse(input);
    if (event.tool_name !== "Agent") {
      process.exit(0);
    }

    const rawType = (event.tool_input?.subagent_type || "").toLowerCase();
    const subagentType = normalizeRole(rawType);
    if (!BUILD_CHAIN.has(subagentType) && !BUILD_CHAIN.has(rawType)) {
      process.exit(0);
    }

    const response = event.tool_response;
    let bytes = 0;
    if (typeof response === "string") {
      bytes = Buffer.byteLength(response, "utf8");
    } else if (response && typeof response === "object") {
      // Some Claude Code runtimes wrap the assistant message; flatten
      // any common content fields.
      const candidates = [
        response.content,
        response.text,
        response.message,
        JSON.stringify(response),
      ];
      for (const c of candidates) {
        if (typeof c === "string") {
          bytes = Math.max(bytes, Buffer.byteLength(c, "utf8"));
        }
      }
    }

    if (bytes === 0) {
      // Could not measure — don't fire false positives
      process.exit(0);
    }

    const tier =
      bytes >= CONCERN_BYTES ? "concern" : bytes >= WARN_BYTES ? "warn" : "ok";

    // Log structured event so the learner can pattern-match on these
    try {
      const { logEvent } = require("./lib/logger");
      logEvent("modification", "system", "response_size", subagentType, {
        bytes,
        tier,
        warnThreshold: WARN_BYTES,
        concernThreshold: CONCERN_BYTES,
      });
    } catch {
      // Logger missing — fall back to plain JSONL append
      try {
        const logPath = path.resolve(
          __dirname,
          "..",
          "..",
          ".claude",
          "runtime",
          "response-size-guard.jsonl",
        );
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
        fs.appendFileSync(
          logPath,
          JSON.stringify({
            ts: new Date().toISOString(),
            subagent_type: subagentType,
            bytes,
            tier,
          }) + "\n",
        );
      } catch {
        // Best effort — never block on logging
      }
    }

    if (tier !== "ok") {
      const kb = (bytes / 1024).toFixed(1);
      process.stderr.write(
        `[response-size-guard] ${tier.toUpperCase()}: ${subagentType} returned ${kb}KB ` +
          `(threshold ${tier === "concern" ? "32KB" : "8KB"}). ` +
          `Build-chain agents should return ~2KB JSON envelopes — this is a ` +
          `prompt-template smell. Run /scan:patterns or check learner output.\n`,
      );
    }

    process.exit(0);
  } catch {
    // PostToolUse must never block the conversation flow
    process.exit(0);
  }
});
