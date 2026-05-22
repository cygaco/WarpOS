#!/usr/bin/env node
/**
 * framework-purity-guard.js — PreToolUse Bash hook.
 *
 * Fires on `git commit` commands. Runs scripts/checks/framework-purity
 * .js --diff to scan staged + unstaged changes. Blocks the commit if
 * any of the four detectors fires:
 *
 *   - root_leak       (gated by ROOT_LEAK_PENDING_SCRUB)
 *   - client_slug     product slugs in canonical content
 *   - abs_path        maintainer-home absolute paths
 *   - promote_relic   reintroduction of purged paths/tokens
 *
 * Goal: close the door behind SP-20260522-001's purge commit. Once the
 * promote suite is gone, this gate refuses any future commit that would
 * reintroduce it.
 *
 * Escape hatches (mirror framework-manifest-guard):
 *   - env: WARPOS_PURITY_GUARD=off
 *   - sentinel: .warpos/purity-guard-disable
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const PURITY_SCRIPT = path.join(
  PROJECT_DIR,
  "scripts",
  "checks",
  "framework-purity.js",
);
const SENTINEL_PATH = path.join(
  PROJECT_DIR,
  ".warpos",
  "purity-guard-disable",
);

if (process.env.WARPOS_PURITY_GUARD === "off") process.exit(0);

if (fs.existsSync(SENTINEL_PATH)) {
  try {
    const { logEvent } = require("./lib/logger");
    logEvent(
      "bypass",
      "system",
      "framework-purity-guard-sentinel",
      "",
      ".warpos/purity-guard-disable present",
    );
  } catch {
    /* logger optional */
  }
  process.exit(0);
}

if (!fs.existsSync(PURITY_SCRIPT)) {
  // Older install without the check script — skip silently.
  process.exit(0);
}

// Read the hook payload from stdin.
let payload = {};
try {
  const raw = fs.readFileSync(0, "utf8");
  payload = raw ? JSON.parse(raw) : {};
} catch {
  /* tolerate empty/invalid payload */
}

const cmd =
  (payload && payload.tool_input && payload.tool_input.command) || "";

// Only act on `git commit` commands. Skip other Bash invocations.
if (!/\bgit\s+commit\b/.test(cmd)) {
  process.exit(0);
}

const r = spawnSync(
  process.execPath,
  [PURITY_SCRIPT, "--diff", "--json"],
  {
    cwd: PROJECT_DIR,
    encoding: "utf8",
    timeout: 30_000,
  },
);

if (r.status === 0) {
  // Clean — allow commit.
  process.exit(0);
}

if (r.status === 2) {
  // Tool-level error — log but don't block (fail-open on our own error).
  process.stderr.write(
    `framework-purity-guard: check tool errored (exit ${r.status}); allowing commit\n${r.stderr || ""}\n`,
  );
  process.exit(0);
}

// status === 1 → violations. Block.
let parsed = null;
try {
  parsed = JSON.parse(r.stdout || "{}");
} catch {
  /* */
}

const summary =
  parsed && parsed.summary
    ? Object.entries(parsed.summary)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")
    : "violations detected";

process.stderr.write(
  [
    "framework-purity-guard: commit refused.",
    `  ${summary}`,
    "",
    "  Run for details:",
    "    node scripts/checks/framework-purity.js --diff",
    "",
    "  To bypass (logged):",
    "    set WARPOS_PURITY_GUARD=off, OR",
    "    touch .warpos/purity-guard-disable",
    "",
  ].join("\n"),
);

process.exit(2); // PreToolUse exit 2 = block the tool call.
