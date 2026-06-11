#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const validator = require("../../../scripts/contracts/validate-artifact");

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const artifact = path.join(
  REPO_ROOT,
  ".claude/project/sprint/requirements/S-PF-01/artifacts/build_spec-S-PF-01-w0-telemetry-seam.chain.json",
);

try {
  const registry = validator.loadSchemas(validator.DEFAULT_SCHEMAS_DIR);
  const input = JSON.parse(fs.readFileSync(artifact, "utf8"));
  const result = validator.validateInput(input, registry);
  assert.strictEqual(result.ok, true, JSON.stringify(result.errors || []));
  console.log("PASS message-brief-build-spec-chain-validates");
  console.log("contract-chain: 1 passed, 0 failed");
  process.exit(0);
} catch (err) {
  console.error(`FAIL message-brief-build-spec-chain-validates: ${err.stack || err.message}`);
  console.log("contract-chain: 0 passed, 1 failed");
  process.exit(1);
}
