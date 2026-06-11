#!/usr/bin/env node
"use strict";

const assert = require("assert");
const path = require("path");
const { spawnSync } = require("child_process");

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const artifact = path.join(
  REPO_ROOT,
  ".claude/project/sprint/requirements/S-PF-01/artifacts/build_spec-S-PF-01-w0-telemetry-seam.chain.json",
);

const result = spawnSync(
  process.execPath,
  ["scripts/contracts/validate-artifact.js", artifact],
  { cwd: REPO_ROOT, encoding: "utf8" },
);

try {
  assert.strictEqual(result.status, 0, (result.stdout || "") + (result.stderr || ""));
  console.log("PASS message-brief-build-spec-chain-validates");
  console.log("contract-chain: 1 passed, 0 failed");
  process.exit(0);
} catch (err) {
  console.error(`FAIL message-brief-build-spec-chain-validates: ${err.message}`);
  console.log("contract-chain: 0 passed, 1 failed");
  process.exit(1);
}
