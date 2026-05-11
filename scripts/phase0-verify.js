#!/usr/bin/env node
/**
 * phase0-verify.js — single-shot Phase 0 verification.
 *
 * Runs every fixture/unit test added by Phase 0 plus a couple of grep
 * checks that prove the agent specs and session-start reference the
 * dispatch guide. Prints a green/red summary the final report can quote
 * verbatim.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const projectDir = path.resolve(__dirname, "..");

const TESTS = [
  "test-dispatch-route-guard.js",
  "test-dispatch-telemetry.js",
  "test-provider-health.js",
  "test-warp-flag.js",
  "test-manifest-guard-product.js",
  "test-dispatch-agent-resolution.js",
  "test-requirement-format-guard.js",
];

const results = [];
for (const t of TESTS) {
  const r = spawnSync(process.execPath, [path.join(__dirname, t)], {
    cwd: projectDir,
    encoding: "utf8",
  });
  results.push({
    name: t,
    pass: r.status === 0,
    stdout: (r.stdout || "").trim().split("\n").pop() || "",
    stderr: (r.stderr || "").trim().slice(0, 400),
  });
}

// Grep-style sanity checks
function fileContains(rel, needle) {
  try {
    return fs.readFileSync(path.join(projectDir, rel), "utf8").includes(needle);
  } catch {
    return false;
  }
}

const checks = [
  {
    name: "gamma references dispatch guide",
    ok: fileContains(
      ".claude/agents/00-alex/gamma.md",
      "paths.agentDispatchGuide",
    ),
  },
  {
    name: "delta references dispatch guide",
    ok: fileContains(
      ".claude/agents/00-alex/delta.md",
      "paths.agentDispatchGuide",
    ),
  },
  {
    name: "session-start cites dispatch guide",
    ok: fileContains(
      "scripts/hooks/session-start.js",
      "agent-dispatch-guide.md",
    ),
  },
  {
    name: "dispatch-route-guard registered in settings",
    ok: fileContains(".claude/settings.json", "dispatch-route-guard.js"),
  },
  {
    name: "requirement-format-guard registered in settings",
    ok: fileContains(".claude/settings.json", "requirement-format-guard.js"),
  },
  {
    name: "paths.json carries agentDispatchGuide",
    ok: fileContains(".claude/paths.json", "agentDispatchGuide"),
  },
  {
    name: "paths.json carries warposFlagLedger",
    ok: fileContains(".claude/paths.json", "warposFlagLedger"),
  },
  {
    name: "promote.js excludes ROADMAP files",
    ok:
      fileContains("scripts/warpos/promote.js", '"ROADMAP.md"') &&
      fileContains("scripts/warpos/promote.js", '"WARPOS_ROADMAP.md"'),
  },
  {
    name: "WARPOS_ROADMAP.md exists",
    ok: fs.existsSync(path.join(projectDir, "WARPOS_ROADMAP.md")),
  },
];

const passedTests = results.filter((r) => r.pass).length;
const failedTests = results.filter((r) => !r.pass);
const passedChecks = checks.filter((c) => c.ok).length;
const failedChecks = checks.filter((c) => !c.ok);

const allOk = failedTests.length === 0 && failedChecks.length === 0;

console.log("Phase 0 Verification");
console.log("─".repeat(48));
console.log(`Tests:  ${passedTests}/${results.length} passed`);
for (const r of results) {
  const icon = r.pass ? "✓" : "✗";
  console.log(`  ${icon} ${r.name}  ${r.pass ? r.stdout : "FAILED"}`);
  if (!r.pass && r.stderr) {
    console.log("     stderr: " + r.stderr.split("\n")[0]);
  }
}
console.log(`Checks: ${passedChecks}/${checks.length} passed`);
for (const c of checks) {
  const icon = c.ok ? "✓" : "✗";
  console.log(`  ${icon} ${c.name}`);
}

if (allOk) {
  console.log("\nResult: GREEN — Phase 0 ready");
  process.exit(0);
}
console.log("\nResult: RED — see failures above");
process.exit(1);
