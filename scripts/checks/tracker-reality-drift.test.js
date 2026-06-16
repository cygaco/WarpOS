#!/usr/bin/env node
"use strict";
/**
 * tracker-reality-drift.test.js — fixture gauntlet for the ED-056 enforcer.
 * Plants a verification-log table row that CLAIMS "Missing But Required" while naming an
 * EXISTING script (the enforcer must FLAG it) + 6 negatives that must NOT flag (a genuinely
 * absent script, the §10 legend row, a non-"Missing" state, history-section rows) + a
 * fail-CLOSED case. Zero deps.
 */
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { scan, historyStart } = require("./tracker-reality-drift.js");

let pass = 0, fail = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; } catch (e) { fail++; fails.push(`  ✗ ${name}: ${e.message}`); }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "trd-fix-"));
// The positive row names THIS enforcer (a real, existing script) → must flag.
fs.writeFileSync(path.join(tmp, "E-FIX-001.md"), [
  "# E-FIX-001",                                                                                   // 1
  "## Verification log",                                                                           // 2
  "| Item | Should exist? | State | Where | Proof | Checked | By |",                               // 3
  "| --- | --- | --- | --- | --- | --- | --- |",                                                   // 4
  "| legend | — | Verified Exists | Verified Nonexistent | Missing But Required | — | — |",         // 5 legend → skip
  "| The drift enforcer | Yes | Missing But Required | `scripts/checks/tracker-reality-drift.js` | x | 2026-06-16 | a |", // 6 EXISTS → FLAG
  "| Absent tool | Yes | Missing But Required | scripts/checks/zzz-does-not-exist.js | | 2026 | a |", // 7 missing → no flag
  "| Incomplete | Yes | Exists But Incomplete | scripts/checks/tracker-reality-drift.js | | | |",   // 8 not "Missing" → no flag
  "",                                                                                              // 9
  "## Change log",                                                                                 // 10
  "| Historic | Yes | Missing But Required | `scripts/checks/tracker-reality-drift.js` | | | |",    // 11 history → skip
].join("\n"));

t("FLAGS a verification-log row: 'Missing But Required' + an EXISTING named script", () => {
  const r = scan({ epicsDir: tmp });
  assert.ok(!r.error, "scan errored: " + r.error);
  const hits = r.findings.filter((f) => f.artifact === "scripts/checks/tracker-reality-drift.js");
  assert.strictEqual(hits.length, 1, "expected exactly 1 flag, got " + JSON.stringify(r.findings));
  assert.strictEqual(hits[0].line, 6, "flag on wrong line: " + hits[0].line);
});
t("does NOT flag a row naming a NON-EXISTENT script (the claim is honest)", () => {
  assert.ok(!scan({ epicsDir: tmp }).findings.some((f) => /zzz-does-not-exist/.test(f.artifact)));
});
t("does NOT flag the §10 state-vocabulary LEGEND row", () => {
  assert.ok(!scan({ epicsDir: tmp }).findings.some((f) => f.line === 5));
});
t("does NOT flag 'Exists But Incomplete' (only the exact 'Missing But Required' state)", () => {
  assert.ok(!scan({ epicsDir: tmp }).findings.some((f) => f.line === 8));
});
t("does NOT flag rows in the HISTORY (Change log) section", () => {
  assert.ok(!scan({ epicsDir: tmp }).findings.some((f) => f.line >= 11));
});
t("fail-CLOSED: a missing epics dir returns an error (never a silent 0)", () => {
  assert.ok(scan({ epicsDir: path.join(tmp, "nope") }).error, "expected an error for a missing dir");
});
t("historyStart finds the first Session/Change log heading", () => {
  assert.strictEqual(historyStart(["a", "## Change log", "b"]), 1);
  assert.strictEqual(historyStart(["a", "b"]), 2);
});

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* best-effort */ }

if (fail) {
  process.stderr.write(fails.join("\n") + "\n");
  process.stderr.write(`tracker-reality-drift test: ${pass}/${pass + fail} passed, ${fail} FAILED\n`);
  process.exit(1);
}
process.stdout.write(`tracker-reality-drift test: ${pass}/${pass} passed\n`);
process.exit(0);
