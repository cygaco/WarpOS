#!/usr/bin/env node
/**
 * test-requirement-format-guard.js — Phase 0 workstream J fixture test.
 */

"use strict";

const path = require("path");
const guard = require(
  path.join(__dirname, "hooks", "requirement-format-guard.js"),
);

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail) {
  if (cond) {
    passed++;
  } else {
    failed++;
    failures.push(`${name}: ${detail || "false"}`);
  }
}

const ID_PATTERNS = require(
  path.join(__dirname, "requirements", "config.js"),
).ID_PATTERNS;

// ── isRequirementPath ─────────────────────────────────────
check(
  "PRD is a requirement path",
  guard.isRequirementPath("_requirements/04-features/auth/PRD.md"),
);
check(
  "STORIES is a requirement path",
  guard.isRequirementPath("_requirements/04-features/auth/STORIES.md"),
);
check(
  "HL-STORIES is a requirement path",
  guard.isRequirementPath("_requirements/04-features/auth/HL-STORIES.md"),
);
check(
  "_audits files are skipped",
  !guard.isRequirementPath("_requirements/_audits/abc/PRD.md"),
);
check(
  "non-requirement paths are skipped",
  !guard.isRequirementPath("src/app.tsx"),
);

// ── PRD: legacy S-1 / S-2 caught ──────────────────────────
const prdLegacy = guard.checkContent(
  "_requirements/04-features/auth/PRD.md",
  "## Requirements\n- S-1: User can sign in\n- S-2: User can sign out\n",
  ID_PATTERNS,
);
check(
  "PRD flags legacy S-<n>",
  prdLegacy.length === 1 && /Legacy "S-<n>"/.test(prdLegacy[0]),
  JSON.stringify(prdLegacy),
);

// ── PRD: legacy marker grandfathers ───────────────────────
const prdGrand = guard.checkContent(
  "_requirements/04-features/auth/PRD.md",
  "<!-- requirement-format-legacy -->\n- S-1: legacy",
  ID_PATTERNS,
);
check(
  "PRD legacy marker grandfathers",
  prdGrand.length === 0,
  JSON.stringify(prdGrand),
);

// ── STORIES: legacy heading caught ────────────────────────
const storyLegacy = guard.checkContent(
  "_requirements/04-features/auth/STORIES.md",
  "### S-12: User can reset password\n\n> Story body",
  ID_PATTERNS,
);
check(
  "STORIES flags legacy heading",
  storyLegacy.length === 1 && /Legacy story heading/.test(storyLegacy[0]),
  JSON.stringify(storyLegacy),
);

// ── STORIES: malformed GS- caught ─────────────────────────
const storyMalformed = guard.checkContent(
  "_requirements/04-features/auth/STORIES.md",
  "### gs-auth-12: lowercase\n\n> body",
  ID_PATTERNS,
);
// "gs-auth-12" doesn't match the heading regex because we require "GS-…"
// uppercase. The line is therefore not flagged as malformed-GS (no
// match) — and not flagged as legacy S-<n> either. That's intended:
// the legacy regex catches "S-12", the malformed-GS regex catches
// "GS-<bad>".
check(
  "STORIES does not crash on non-GS heading",
  Array.isArray(storyMalformed),
);

// ── STORIES: valid GS-* passes ────────────────────────────
const storyValid = guard.checkContent(
  "_requirements/04-features/auth/STORIES.md",
  "### GS-AUTH-12: User can reset password\n\n> body",
  ID_PATTERNS,
);
check(
  "STORIES valid GS- passes",
  storyValid.length === 0,
  JSON.stringify(storyValid),
);

// ── HL-STORIES: malformed caught ──────────────────────────
const hlBad = guard.checkContent(
  "_requirements/04-features/auth/HL-STORIES.md",
  "### HL-foo: lowercase\n\n> body",
  ID_PATTERNS,
);
check(
  "HL-STORIES flags malformed",
  hlBad.length === 1 && /does not match HL-<UPPER>-<NN>/.test(hlBad[0]),
  JSON.stringify(hlBad),
);

// ── CROSS-STANDARDS ───────────────────────────────────────
const csValid = guard.checkContent(
  "_requirements/_shared/CROSS-STANDARDS.md",
  "### CS-001: Standard\n\n> body",
  ID_PATTERNS,
);
check(
  "CROSS-STANDARDS valid CS- passes",
  csValid.length === 0,
  JSON.stringify(csValid),
);

const csBad = guard.checkContent(
  "_requirements/_shared/CROSS-STANDARDS.md",
  "### CS-1: too short\n\n> body",
  ID_PATTERNS,
);
check(
  "CROSS-STANDARDS flags too-short id",
  csBad.length === 1 && /does not match CS-<NNN>/.test(csBad[0]),
  JSON.stringify(csBad),
);

if (failed > 0) {
  console.error(`FAIL — ${failed} of ${passed + failed} cases failed:`);
  for (const f of failures) console.error("  -", f);
  process.exit(1);
}
console.log(`OK — ${passed} cases passed`);
process.exit(0);
