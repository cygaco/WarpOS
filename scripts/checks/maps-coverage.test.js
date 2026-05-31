#!/usr/bin/env node
"use strict";

/**
 * Bite-test for maps-coverage.js evaluate() — proves each class fires (and clean
 * passes), with injected seams, no disk access. Mirrors scan-coverage.test.js.
 *
 *   node scripts/checks/maps-coverage.test.js
 */

const { evaluate } = require("./maps-coverage.js");

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) pass++;
  else {
    fail++;
    console.error("FAIL: " + name);
  }
}

const base = {
  mapsSkills: ["all", "hooks", "skills"],
  allSelf: "all",
  allReferenced: new Set(["hooks", "skills"]),
  mapFiles: ["hooks.jsonl", "skills.md"],
  generators: new Set(["hooks", "skills"]),
  allowlist: {},
  staleNames: [],
};

// clean → 0 blocking findings
check("clean → 0 blocking", evaluate(base).filter((f) => f.severity !== "warn").length === 0);

// UNREGISTERED-SKILL — a /maps:<x> skill not referenced by all + not excluded
check(
  "unregistered-skill fires",
  evaluate({ ...base, mapsSkills: ["all", "hooks", "orphan"] }).some(
    (f) => f.kind === "unregistered-skill" && f.message.includes("orphan"),
  ),
);

// excluded skill → no unregistered finding
check(
  "excluded skill → ok",
  !evaluate({ ...base, mapsSkills: ["all", "hooks", "orphan"], allowlist: { orphan: "reason" } }).some(
    (f) => f.kind === "unregistered-skill",
  ),
);

// DANGLING-REGISTRY — all references a skill with no file
check(
  "dangling-registry fires",
  evaluate({ ...base, allReferenced: new Set(["hooks", "skills", "ghost"]) }).some(
    (f) => f.kind === "dangling-registry" && f.message.includes("ghost"),
  ),
);

// ORPHAN-MAP-FILE — a persisted map with no generator + not allowlisted
check(
  "orphan-map-file fires",
  evaluate({ ...base, mapFiles: ["hooks.jsonl", "weird.json"] }).some(
    (f) => f.kind === "orphan-map-file" && f.message.includes("weird.json"),
  ),
);

// allowlisted map file → no orphan finding
check(
  "allowlisted map file → ok",
  !evaluate({ ...base, mapFiles: ["hooks.jsonl", "weird.json"], allowlist: { weird: "manual registry" } }).some(
    (f) => f.kind === "orphan-map-file",
  ),
);

// STALE → WARN (non-blocking)
const staleF = evaluate({ ...base, staleNames: ["hooks.jsonl"] });
check("stale → warn only (non-blocking)", staleF.some((f) => f.kind === "stale-map" && f.severity === "warn") && staleF.filter((f) => f.severity !== "warn").length === 0);

// the aggregator itself is never flagged
check("all itself not flagged", !evaluate({ mapsSkills: ["all"], allSelf: "all", allReferenced: new Set([]), mapFiles: [], generators: new Set(), allowlist: {}, staleNames: [] }).length);

console.log(`maps-coverage.test: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
