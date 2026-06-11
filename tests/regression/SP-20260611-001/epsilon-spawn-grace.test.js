#!/usr/bin/env node
"use strict";

/**
 * epsilon-spawn-grace.test.js — regression for SP-20260611-001 fix 1 (T-310, R-1).
 *
 * Finding (crossfam-findings-2026-06-10 §A.1): spawnAgent passed
 * foregroundAwareTimeout(...) — the CHILD wrapper's OWN bound — as spawnSync's parent
 * `timeout`. The child wrapper (dispatch-claude.js / dispatch-agent.js) self-bounds at
 * the SAME value, so the parent's hard SIGTERM fired at the exact instant the child
 * started writing its graceful death record, racing (and often killing) that write.
 *
 * The fix: parent bound = child bound + PARENT_GRACE_MS (45s, β-decided 30–60s window),
 * at BOTH spawn sites (epsilon-agent ~476, epsilon-claude ~500), reading the SAME named
 * constant. The parent bound is RETAINED (not backstop-only) so a genuinely-hung child is
 * still reaped — just with grace headroom.
 *
 * Exploit-shaped (BC-16): asserts the OLD race condition (parent ≤ child) is now closed at
 * BOTH sites — the missed second site is the rename-hygiene bug class.
 *
 *   node tests/regression/SP-20260611-001/epsilon-spawn-grace.test.js
 */

const path = require("path");

const RT = path.resolve(__dirname, "../../../scripts/sprint/epsilon-runtime");
const TP = path.resolve(__dirname, "../../../scripts/dispatch/timeout-policy");
const rt = require(RT);
const { foregroundAwareTimeout, WRAPPER_DEFAULTS } = require(TP);

let passed = 0;
let failed = 0;
function ok(name, cond, detail) {
  if (cond) {
    passed++;
    console.log(`  ok  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// Inject a runner that captures the spawnSync options (so we read the parent `timeout`
// the runtime actually computed) and returns a benign ok outcome so spawnAgent completes.
function captureTimeout(route, role, opts = {}) {
  let captured = null;
  const run = (_bin, _args, options) => {
    captured = options;
    return { status: 0, stdout: "ok" };
  };
  rt.spawnAgent(
    { role, step: "gauntlet", route, provider: route === rt.ROUTE.DISPATCH_CLAUDE ? "claude" : "gemini", model: "x" },
    "SP-T",
    { run, promptFile: __filename, ...opts }
  );
  return captured ? captured.timeout : null;
}

const GRACE = rt.PARENT_GRACE_MS;

console.log("(1) PARENT_GRACE_MS is a named constant in the β window (30–60s):");
{
  ok("PARENT_GRACE_MS is exported as a number", typeof GRACE === "number");
  ok("PARENT_GRACE_MS within 30000–60000ms", GRACE >= 30000 && GRACE <= 60000, `got ${GRACE}`);
}

console.log("\n(2) parent-bound-exceeds-child-bound-at-both-sites:");
{
  // Site 1 — epsilon-agent (DISPATCH_AGENT route, ~line 476).
  const childAgent = foregroundAwareTimeout(WRAPPER_DEFAULTS["epsilon-agent"], {});
  const parentAgent = captureTimeout(rt.ROUTE.DISPATCH_AGENT, "security-reviewer");
  ok(
    "epsilon-agent site: parent timeout = child bound + PARENT_GRACE_MS",
    parentAgent === childAgent + GRACE,
    `parent=${parentAgent} child=${childAgent} grace=${GRACE}`
  );
  ok("epsilon-agent site: parent STRICTLY exceeds child (not backstop-only)", parentAgent > childAgent);

  // Site 2 — epsilon-claude (DISPATCH_CLAUDE route, ~line 500).
  const childClaude = foregroundAwareTimeout(WRAPPER_DEFAULTS["epsilon-claude"], {});
  const parentClaude = captureTimeout(rt.ROUTE.DISPATCH_CLAUDE, "frontend-builder", { worktree: __dirname });
  ok(
    "epsilon-claude site: parent timeout = child bound + PARENT_GRACE_MS",
    parentClaude === childClaude + GRACE,
    `parent=${parentClaude} child=${childClaude} grace=${GRACE}`
  );
  ok("epsilon-claude site: parent STRICTLY exceeds child (not backstop-only)", parentClaude > childClaude);

  // The OLD bug: parent == child (the race). Assert that exact equality no longer holds.
  ok("epsilon-agent: OLD race (parent == child) is closed", parentAgent !== childAgent);
  ok("epsilon-claude: OLD race (parent == child) is closed", parentClaude !== childClaude);
}

console.log("\n(3) graceful-death-record-wins-race-both-sites:");
{
  // A child exiting at exactly its own bound is comfortably within the parent bound, with
  // at least 30s of margin for its graceful death-record write — at BOTH sites.
  const MIN_MARGIN = 30000;

  const childAgent = foregroundAwareTimeout(WRAPPER_DEFAULTS["epsilon-agent"], {});
  const parentAgent = captureTimeout(rt.ROUTE.DISPATCH_AGENT, "security-reviewer");
  ok(
    "epsilon-agent: child bound < parent bound with ≥30s margin",
    childAgent < parentAgent && parentAgent - childAgent >= MIN_MARGIN,
    `margin=${parentAgent - childAgent}`
  );

  const childClaude = foregroundAwareTimeout(WRAPPER_DEFAULTS["epsilon-claude"], {});
  const parentClaude = captureTimeout(rt.ROUTE.DISPATCH_CLAUDE, "frontend-builder", { worktree: __dirname });
  ok(
    "epsilon-claude: child bound < parent bound with ≥30s margin",
    childClaude < parentClaude && parentClaude - childClaude >= MIN_MARGIN,
    `margin=${parentClaude - childClaude}`
  );

  // Background dispatches (full bound) still get the grace, not parent ≤ child.
  const childBg = foregroundAwareTimeout(WRAPPER_DEFAULTS["epsilon-claude"], { background: true });
  const parentBg = captureTimeout(rt.ROUTE.DISPATCH_CLAUDE, "frontend-builder", { background: true, worktree: __dirname });
  ok(
    "background dispatch: parent still = child bound + grace (race closed at full bound too)",
    parentBg === childBg + GRACE,
    `parent=${parentBg} child=${childBg}`
  );
}

console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — epsilon-spawn-grace: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
