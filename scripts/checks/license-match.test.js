"use strict";
/**
 * license-match — the root package.json `license` field must agree with the LICENSE file.
 *
 * Enforcer for E-OPEN-SOURCE-001 DoD item 4 ("a check fails when package.json license ≠ LICENSE").
 * Runs under `node --test` (so `npm test` from the repo root picks it up) and can be run alone:
 *   node --test scripts/checks/license-match.test.js
 *
 * Fail-closed: a missing LICENSE, a missing/unknown package.json license, or a mismatch all fail.
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");

// SPDX id → a phrase that must appear in the first 5 lines of the canonical LICENSE text.
const HEADERS = {
  "AGPL-3.0-only": /GNU AFFERO GENERAL PUBLIC LICENSE\s+Version 3/,
  "AGPL-3.0-or-later": /GNU AFFERO GENERAL PUBLIC LICENSE\s+Version 3/,
  "GPL-3.0-only": /GNU GENERAL PUBLIC LICENSE\s+Version 3/,
  "MIT": /MIT License/,
  "Apache-2.0": /Apache License\s+Version 2\.0/,
};

test("root package.json license matches the LICENSE file", () => {
  const pkgPath = path.join(ROOT, "package.json");
  const licPath = path.join(ROOT, "LICENSE");
  assert.ok(fs.existsSync(pkgPath), "root package.json is missing");
  assert.ok(fs.existsSync(licPath), "root LICENSE is missing");

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const spdx = pkg.license;
  assert.ok(typeof spdx === "string" && spdx.length > 0, "package.json has no `license` field");
  const header = HEADERS[spdx];
  assert.ok(header, `package.json license "${spdx}" is not in the known-license table (add it to HEADERS in this test)`);

  const head = fs.readFileSync(licPath, "utf8").split(/\r?\n/).slice(0, 5).join("\n");
  assert.match(head, header, `LICENSE header does not match package.json license "${spdx}"\n--- LICENSE head ---\n${head}`);
});

test("planted mismatch is detected (self-test)", () => {
  // The same comparison, on a fixture pair that MUST disagree — proves the check is not vacuous.
  const head = "MIT License\n\nCopyright (c) example";
  assert.doesNotMatch(head, HEADERS["AGPL-3.0-only"]);
});
