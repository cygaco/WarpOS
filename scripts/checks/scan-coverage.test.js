#!/usr/bin/env node
"use strict";

/**
 * Bite-test for scan-coverage.js evaluate() — proves each rejection class fires
 * (and the clean case passes), with injected seams, no disk access.
 * An enforcer without a bite-test is a false-green waiting to happen.
 *
 *   node scripts/checks/scan-coverage.test.js
 */

const { evaluate } = require("./scan-coverage.js");

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) pass++;
  else {
    fail++;
    console.error("FAIL: " + name);
  }
}

// clean — every skill delegated or excluded → 0 findings
check(
  "clean → 0 findings",
  evaluate({
    scanSkills: ["full", "a", "b"],
    fullSelf: "full",
    fullReferenced: new Set(["a", "b"]),
    exclusions: {},
  }).length === 0,
);

// UNCOVERED — a skill not in full and not excluded
check(
  "uncovered fires",
  evaluate({
    scanSkills: ["full", "a", "orphan"],
    fullSelf: "full",
    fullReferenced: new Set(["a"]),
    exclusions: {},
  }).some((x) => x.kind === "uncovered" && x.message.includes("orphan")),
);

// excluded skill is OK (no uncovered finding)
check(
  "excluded → no uncovered",
  !evaluate({
    scanSkills: ["full", "a", "info"],
    fullSelf: "full",
    fullReferenced: new Set(["a"]),
    exclusions: { info: "read-only informational" },
  }).some((x) => x.kind === "uncovered"),
);

// DANGLING — full references a scan with no skill file
check(
  "dangling fires",
  evaluate({
    scanSkills: ["full", "a"],
    fullSelf: "full",
    fullReferenced: new Set(["a", "ghost"]),
    exclusions: {},
  }).some((x) => x.kind === "dangling" && x.message.includes("ghost")),
);

// STALE-EXCLUSION — allowlist excludes a non-skill
check(
  "stale-exclusion fires",
  evaluate({
    scanSkills: ["full", "a"],
    fullSelf: "full",
    fullReferenced: new Set(["a"]),
    exclusions: { gone: "reason" },
  }).some((x) => x.kind === "stale-exclusion"),
);

// REASONLESS-EXCLUSION — excluded without a reason
check(
  "reasonless-exclusion fires",
  evaluate({
    scanSkills: ["full", "a", "x"],
    fullSelf: "full",
    fullReferenced: new Set(["a"]),
    exclusions: { x: "" },
  }).some((x) => x.kind === "reasonless-exclusion"),
);

// the aggregator itself is never flagged uncovered
check(
  "full itself not flagged",
  !evaluate({
    scanSkills: ["full"],
    fullSelf: "full",
    fullReferenced: new Set([]),
    exclusions: {},
  }).length,
);

console.log(`scan-coverage.test: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
