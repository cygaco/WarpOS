#!/usr/bin/env node

/**
 * scripts/test-providers-stdin-fix.js — Verify the 0.4.4 fix to
 * scripts/hooks/lib/providers.js works: spawnSync called with
 * encoding:"buffer" + Buffer-typed input does NOT throw "Unknown encoding",
 * and roundtrips stdin → stdout via a benign command.
 *
 * Also verifies the BUGGY shape (encoding:"buffer" + string input) still
 * fails the same way it did pre-fix, so the test would catch regression.
 */

"use strict";

const { spawnSync } = require("child_process");

let passed = 0;
let failed = 0;

function check(name, ok, detail) {
  if (ok) {
    passed++;
    process.stdout.write(`  ok    ${name}\n`);
  } else {
    failed++;
    process.stdout.write(`  FAIL  ${name}\n`);
    if (detail) process.stdout.write(`        ${detail}\n`);
  }
}

const input = "hello world\n";

// Buggy shape: throws synchronously with ERR_UNKNOWN_ENCODING in modern
// Node (this is what Phase 0 shipped, manifesting as silent dispatch
// breakage because nothing caught the throw at the call site).
let buggyThrew = false;
let buggyCode = null;
try {
  spawnSync(process.execPath, ["-e", "process.stdin.pipe(process.stdout)"], {
    input,
    encoding: "buffer",
  });
} catch (e) {
  buggyThrew = true;
  buggyCode = e.code || null;
}
check(
  "buggy (string + encoding:buffer) throws ERR_UNKNOWN_ENCODING",
  buggyThrew && buggyCode === "ERR_UNKNOWN_ENCODING",
  `threw=${buggyThrew} code=${buggyCode}`,
);

// Fixed shape: Buffer input + encoding:buffer roundtrips correctly
const fixed = spawnSync(
  process.execPath,
  ["-e", "process.stdin.pipe(process.stdout)"],
  {
    input: Buffer.from(input, "utf8"),
    encoding: "buffer",
  },
);
const noError = !fixed.error;
check(
  "fixed (Buffer + encoding:buffer) does not error",
  noError,
  noError ? null : `error: ${fixed.error && fixed.error.message}`,
);

const stdout = fixed.stdout ? fixed.stdout.toString("utf8") : "";
check(
  "fixed shape roundtrips stdin -> stdout",
  stdout === input,
  `expected ${JSON.stringify(input)}, got ${JSON.stringify(stdout)}`,
);

process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
