#!/usr/bin/env node
"use strict";
// greek-office-parity — the naming bijection enforcer (operator directive 2026-07-16; ADR-0016).
//
// RULE: a role carries a Greek call-sign IFF it is a member of the President's office
// (home === "president"). "Greek call-signs live ONLY in the President's office" (DISPATCH.md §8) —
// and the ENTIRE office gets one. Fires BOTH ways:
//   - VIOLATION-B: a NON-office role carries a Greek call_sign (the 10 department leads to strip).
//   - VIOLATION-A: an OFFICE role is MISSING a Greek call_sign (cabinet/ops-analyst until assigned).
// Registry-focused (the call_sign SoT); the surgical sweep keeps spec frontmatter/body/org-docs in
// sync. Report-only in /scan:full (surfaces the pre-strip state; goes green once the sweep lands).
//
// Exit: 0 clean · 1 findings · 2 fail-closed (unreadable/unparseable registry).
const fs = require("fs");
const path = require("path");

const NAME = "greek-office-parity";
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const REGISTRY = ".claude/agents/_org/role-registry.json";
// Greek + Greek-Extended blocks — a call_sign glyph in this range is a "Greek letter" identity.
const GREEK_RE = /[Ͱ-Ͽἀ-῿]/;

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const hasGreek = (r) => !!(r && typeof r.call_sign === "string" && GREEK_RE.test(r.call_sign));
const isOffice = (r) => !!(r && r.home === "president");

// Pure, injectable core → returns a flat error list.
function evaluateGreekOfficeParity(reg) {
  const errors = [];
  const roles = (reg && reg.roles) || {};
  for (const [name, r] of Object.entries(roles)) {
    const greek = hasGreek(r);
    const office = isOffice(r);
    if (greek && !office)
      errors.push(
        `[NAMING] role "${name}" (home="${r.home}") carries a Greek call_sign "${r.call_sign}" — Greek letters are the President's office ONLY; strip it (DISPATCH.md §8; ADR-0016).`,
      );
    if (office && !greek)
      errors.push(
        `[NAMING] President-office role "${name}" has NO Greek call_sign — the ENTIRE office gets a letter; assign one (ADR-0016; cabinet→ζ, ops-analyst→η).`,
      );
  }
  return errors;
}

function main(argv) {
  const json = (argv || []).includes("--json");
  let reg;
  try {
    reg = readJSON(path.join(ROOT, REGISTRY));
  } catch (e) {
    process.stderr.write(`${NAME}: role-registry.json unreadable/unparseable: ${e.message}\n`);
    return 2;
  }
  let errors;
  try {
    errors = evaluateGreekOfficeParity(reg);
  } catch (e) {
    process.stderr.write(`${NAME} error: ${e.message}\n`);
    return 2;
  }
  if (json) {
    process.stdout.write(JSON.stringify({ ok: errors.length === 0, check: NAME, errors }, null, 2) + "\n");
    return errors.length ? 1 : 0;
  }
  if (errors.length === 0) {
    process.stdout.write(`OK   [${NAME}] Greek call-signs ⟺ President's office (bijection holds)\n`);
    return 0;
  }
  process.stderr.write(`FAIL [${NAME}] Greek/office bijection (${errors.length}):\n${errors.map((e) => `  - ${e}`).join("\n")}\n`);
  return 1;
}

if (require.main === module) process.exit(main(process.argv));
module.exports = { evaluateGreekOfficeParity, hasGreek, isOffice, GREEK_RE, main, NAME };
