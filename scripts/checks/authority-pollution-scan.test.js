"use strict";
/**
 * authority-pollution-scan.test.js — G2.3 standing enforcer + BLOCKING FIXTURE (ii).
 * Proves: (a) the rule-#5-STYLE default-binding plant in a NEUTRAL file is CAUGHT (the class β flagged
 * as the one that matters); (b) a DESCRIPTIVE clean control is NOT tripped (not a blunt "President"
 * grep); (c) the STANDING canonical scan is green (the live neutral graph carries no ambient authority).
 */
const { test } = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const { scan } = require("./authority-pollution-scan");

const PLANT = path.join(__dirname, "fixtures", "authority-pollution", "plant");
const CLEAN = path.join(__dirname, "fixtures", "authority-pollution", "clean");
const CANONICAL = path.resolve(__dirname, "..", "..");

test("BLOCKING FIXTURE (ii): the default-binding plant in a neutral AGENTS.md is CAUGHT", () => {
  const res = scan(PLANT);
  assert.ok(res.violations.length > 0, "the plant must be caught");
  const ids = new Set(res.violations.map((v) => v.patternId));
  // The class that matters (β): a default top-level role binding planted in a neutral file.
  assert.ok(ids.has("default-binding"), `expected default-binding to be caught; got [${[...ids]}]`);
  // The other pollution classes on the same fixture are also caught.
  assert.ok(ids.has("identity-assertion"), "identity assertion caught");
  assert.ok(ids.has("authority-grant"), "authority grant caught");
  // G2.6: an operator-voice / operator-audience directive in a neutral surface is caught (helm-only).
  assert.ok(ids.has("operator-audience"), `expected operator-audience (G2.6) caught; got [${[...ids]}]`);
});

test("the default-binding paraphrase ('top-level session defaults to alex-alpha') is caught", () => {
  const res = scan(PLANT);
  const paraphraseCaught = res.violations.some(
    (v) => v.patternId === "default-binding" && /defaults to alex-alpha/i.test(v.text),
  );
  assert.ok(paraphraseCaught, "a paraphrase of the default binding must be caught, not just the literal");
});

test("CLEAN control: descriptive third-person mentions of the President do NOT trip the scan", () => {
  const res = scan(CLEAN);
  assert.strictEqual(res.violations.length, 0, `clean control tripped: ${JSON.stringify(res.violations)}`);
});

test("STANDING scan: the live canonical neutral graph is clean (zero ambient authority)", () => {
  const res = scan(CANONICAL);
  assert.strictEqual(
    res.violations.length,
    0,
    `canonical neutral graph has authority pollution:\n${res.violations.map((v) => `  ${v.file}:${v.line} [${v.patternId}]`).join("\n")}`,
  );
  assert.ok(res.surfaceCount >= 1, "at least the root AGENTS.md must be scanned");
});
