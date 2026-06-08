#!/usr/bin/env node
"use strict";

/**
 * Isolated P5 test for no-nul-bytes.js. Proves a clean buffer passes and a
 * planted NUL byte is caught (the Write-tool corruption class).
 *
 *   node scripts/checks/no-nul-bytes.test.js
 */

const { harness } = require("./lib/fixture-harness");
const { evaluate } = require("./no-nul-bytes");

const h = harness("no-nul-bytes");

h.pass("clean text files pass", () =>
  evaluate({ files: [{ path: "a.js", buf: Buffer.from("const x = /[`$;&|<>\\s]/;\n", "utf8") }] }));

// PLANTED VIOLATION: a NUL byte (the space-before-] artifact) must be caught.
h.violation("a file with a NUL byte is flagged", () =>
  evaluate({ files: [{ path: "bad.js", buf: Buffer.concat([Buffer.from("const x = /[<>"), Buffer.from([0x00]), Buffer.from("]/;")]) }] }));

h.violation("a NUL anywhere in the buffer is caught", () =>
  evaluate({ files: [{ path: "bad2.js", buf: Buffer.concat([Buffer.from("ok line\n"), Buffer.from([0x00])]) }] }));

h.done();
