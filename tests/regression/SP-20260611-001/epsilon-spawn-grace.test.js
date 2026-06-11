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
// AND the child env the runtime actually computed) and returns a benign ok outcome so
// spawnAgent completes. We need the FULL options object — FIX-A1's propagation link is the
// child env DISPATCH_BUILDER_TIMEOUT_MS, which the old test never inspected.
function captureSpawn(route, role, opts = {}) {
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
  return captured;
}
function captureTimeout(route, role, opts = {}) {
  const captured = captureSpawn(route, role, opts);
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

console.log("\n(4) parent-strictly-exceeds-child-under-opts-override-both-sites (FIX-A1 propagation link):");
{
  // The blocker the old test missed: when opts.timeoutMs is SET, the parent was computed from
  // opts.timeoutMs but the value was NEVER propagated to the child — the child read its own
  // env/default bound, so parent and child DIVERGED and the parent could end up ≤ child,
  // re-opening the death-record race. FIX-A1 single-sources the child bound BY CONSTRUCTION:
  // childBaseMs = foregroundAwareTimeout(opts.timeoutMs || default, opts); the child env
  // DISPATCH_BUILDER_TIMEOUT_MS == childBaseMs AND parent == childBaseMs + grace, for EVERY
  // opts.timeoutMs value, at BOTH sites.
  const cases = [
    { label: "small (1000)", timeoutMs: 1000 },
    { label: "huge (9_000_000)", timeoutMs: 9000000 },
    { label: "unset", timeoutMs: undefined },
  ];
  const sites = [
    { name: "epsilon-agent", route: rt.ROUTE.DISPATCH_AGENT, role: "security-reviewer", def: WRAPPER_DEFAULTS["epsilon-agent"], extra: {} },
    { name: "epsilon-claude", route: rt.ROUTE.DISPATCH_CLAUDE, role: "frontend-builder", def: WRAPPER_DEFAULTS["epsilon-claude"], extra: { worktree: __dirname } },
  ];
  for (const site of sites) {
    for (const c of cases) {
      // childBaseMs is what the runtime SHOULD compute for this opts.timeoutMs (idempotent clamp).
      const childBaseMs = foregroundAwareTimeout(c.timeoutMs || site.def, {});
      const opts = c.timeoutMs === undefined ? { ...site.extra } : { timeoutMs: c.timeoutMs, ...site.extra };
      const cap = captureSpawn(site.route, site.role, opts);
      const propagated = cap && cap.env ? Number(cap.env.DISPATCH_BUILDER_TIMEOUT_MS) : NaN;
      const parent = cap ? cap.timeout : null;

      ok(
        `${site.name} / ${c.label}: child env DISPATCH_BUILDER_TIMEOUT_MS == childBaseMs (propagation link present)`,
        propagated === childBaseMs,
        `propagated=${propagated} childBaseMs=${childBaseMs}`,
      );
      ok(
        `${site.name} / ${c.label}: parent timeout == childBaseMs + PARENT_GRACE_MS (by construction)`,
        parent === childBaseMs + GRACE,
        `parent=${parent} childBaseMs=${childBaseMs} grace=${GRACE}`,
      );
      ok(
        `${site.name} / ${c.label}: parent STRICTLY exceeds child (race closed for this opts override)`,
        parent > childBaseMs,
        `parent=${parent} childBaseMs=${childBaseMs}`,
      );
    }
  }
}

console.log(`\n${failed === 0 ? "PASS" : "FAIL"} — epsilon-spawn-grace: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
