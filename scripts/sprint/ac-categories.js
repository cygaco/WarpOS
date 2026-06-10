#!/usr/bin/env node
"use strict";

/**
 * scripts/sprint/ac-categories.js — the SINGLE SOURCE OF TRUTH for the 20
 * enforcement-criteria categories (E-LIFECYCLE-001 / S-LC-11, PLAN §11).
 *
 * This is a different AXIS from the per-AC `verified_by:` linkage that
 * `check-ac-coverage.js` already audits (Given/When/Then ACs). Here the
 * question is: "does this plan/epic/sprint AC artifact carry AC for ALL 20
 * enforcement-criteria categories, each with a proof?"
 *
 * EVERYONE reads this list from here so it can never drift:
 *   - the checker:   scripts/sprint/check-ac-coverage.js (--categories mode)
 *   - the scaffolds: scripts/epic/plan.js (/epic:plan) emits the checklist
 *   - the skills:    /sprint:design + /scan:ac-coverage reference it
 *   - the tests:     tests/regression/S-LC-11/*.test.js assert length === 20
 *
 * Zero dependencies (Node stdlib only) so it loads anywhere without an install
 * and without pulling in the sprint path table.
 */

// The 20 enforcement-criteria categories, VERBATIM from PLAN §11. Order is
// stable (the scaffolds and reports render in this order). Do NOT reword an
// entry without updating PLAN §11 — the drift guard asserts length === 20.
const AC_CATEGORIES = Object.freeze([
  "correct mode selection",
  "correct mode switching",
  "correct team teardown",
  "correct team creation",
  "correct team verification",
  "correct lifecycle-hook firing",
  "correct hook ordering",
  "correct agent dispatch",
  "correct sprint/epic binding",
  "correct tracker linkage",
  "correct planning-artifact persistence",
  "correct provider readiness",
  "correct safety gates",
  "correct test strategy",
  "correct fixture/holdout coverage",
  "correct review requirements",
  "correct completion proof",
  "correct user-approval points",
  "correct learning/persistence capture",
  "correct blast-radius analysis",
]);

// The stable heading the scaffolds emit + the skills reference. Recognizable by
// the checker (it never collides with a category phrase).
const CATEGORY_SECTION_HEADING =
  "Enforcement-criteria coverage — 20 categories (PLAN §11 / S-LC-11)";

/**
 * Render the 20-category Acceptance-Criteria checklist a producer scaffolds into
 * its plan/epic artifact. Each category is a STUB the author fills with a proof;
 * a bare `proof: TODO` is "named but unproven" and gets flagged (report-only) by
 * `/scan:ac-coverage --categories`. PURE + deterministic (no Date.now / fs) so a
 * re-render is byte-identical — keeping `/epic:plan` idempotent.
 *
 * @param {object} [opts]
 * @param {number} [opts.headingLevel=3] markdown heading level for the section.
 * @param {string} [opts.proofPlaceholder="TODO"] the stub proof value.
 */
function categoryChecklistMarkdown(opts = {}) {
  const level = Number.isInteger(opts.headingLevel) ? opts.headingLevel : 3;
  const hashes = "#".repeat(Math.min(Math.max(level, 1), 6));
  const stub = opts.proofPlaceholder || "TODO";
  const rows = AC_CATEGORIES.map(
    (cat) => `- [ ] **${cat}** — proof: ${stub}`,
  ).join("\n");
  return `${hashes} ${CATEGORY_SECTION_HEADING}

Every category below needs AC + a **proof** — a planted fixture that must fail, a
real record (run_id + elapsed/bytes), a green/blocked exit code, or a captured
event sequence (PLAN §11 proof standard). Replace each \`proof: ${stub}\` with the
real proof; a bare \`proof: ${stub}\` stub is "named but unproven" and is FLAGGED
(report-only) by \`/scan:ac-coverage --categories\`. Single source for this list:
\`scripts/sprint/ac-categories.js\` (${AC_CATEGORIES.length} categories).

${rows}`;
}

module.exports = {
  AC_CATEGORIES,
  CATEGORY_SECTION_HEADING,
  categoryChecklistMarkdown,
};

// Self-check: `node scripts/sprint/ac-categories.js --selftest`
if (require.main === module && process.argv.includes("--selftest")) {
  const assert = require("assert");
  assert.strictEqual(AC_CATEGORIES.length, 20, "must be exactly 20 categories");
  assert.strictEqual(
    new Set(AC_CATEGORIES).size,
    20,
    "no duplicate categories",
  );
  const md = categoryChecklistMarkdown();
  for (const cat of AC_CATEGORIES) {
    assert.ok(md.includes(`**${cat}**`), `checklist names "${cat}"`);
  }
  // deterministic
  assert.strictEqual(md, categoryChecklistMarkdown(), "render is deterministic");
  process.stdout.write(
    `ac-categories selftest: ${AC_CATEGORIES.length} categories, checklist renders all, deterministic — OK\n`,
  );
  process.exit(0);
}
