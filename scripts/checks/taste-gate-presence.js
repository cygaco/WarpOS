#!/usr/bin/env node
"use strict";
// taste-gate-presence (TRC-001, SP-20260716-001 qa-reviewer traceability) — the NAMED deterministic
// enforcer for the composer TASTE GATE. The taste-gate policy (a no-checklist "does it look designed or
// assembled" vibe verdict, where taste_gate.pass:false is a BINDING verdict:FAIL) was wired into the two
// design-review specs by the SP-20260716-003 composer patch (composer-taste-gate-roster.patch.md). Per
// CLAUDE.md "Policy & Enforcement Hygiene — every policy needs a named enforcer": this makes a spec that
// DROPS or WEAKENS the taste-gate contract self-detecting, instead of the policy silently rotting out.
//
// Scope: PRESENCE + shape of the contract in the specs (the deterministic half). The RUNTIME binding half
// (a live-gauntlet consumer that BLOCKS on taste_gate.pass:false) is tracked as enforcement debt.
//
// Exit: 0 both specs carry the contract · 1 a spec is missing/weakened it · 2 fail-closed (spec unreadable).
const fs = require("fs");
const path = require("path");

const NAME = "taste-gate-presence";
const ROOT = path.resolve(__dirname, "..", "..");
const SPECS = [
  ".claude/agents/product/quality/design-quality.md",
  ".claude/agents/product/quality/visual-review.md",
];

// The three load-bearing pieces of the taste-gate contract each design-review spec MUST carry.
const REQUIRED = [
  { key: "section", re: /taste gate/i, desc: "a taste-gate section (the 'designed vs assembled' vibe verdict)" },
  { key: "schema", re: /"taste_gate"\s*:\s*\{\s*"pass"\s*:/, desc: 'the output-schema field "taste_gate": { "pass": … }' },
  { key: "binding", re: /pass[`"]?\s*:\s*false[\s\S]{0,120}(FAIL|binding)/i, desc: "the BINDING rule (taste_gate.pass:false → verdict FAIL)" },
];

/** Return the list of missing contract pieces for one spec's text (empty = complete). Pure. */
function evaluateSpec(text) {
  const missing = [];
  for (const r of REQUIRED) if (!r.re.test(String(text || ""))) missing.push(r.desc);
  return missing;
}

function main() {
  const errors = [];
  for (const rel of SPECS) {
    let text;
    try {
      text = fs.readFileSync(path.join(ROOT, rel), "utf8");
    } catch (e) {
      process.stderr.write(`${NAME}: taste-gate spec unreadable: ${rel}: ${e.message}\n`);
      return 2; // fail-closed
    }
    for (const m of evaluateSpec(text)) errors.push(`spec ${rel} is MISSING ${m} — the taste-gate contract must be present (TRC-001)`);
  }
  if (errors.length === 0) {
    process.stdout.write(`OK   [${NAME}] both design-review specs carry the taste-gate contract (section + schema + binding rule)\n`);
    return 0;
  }
  process.stderr.write(`FAIL [${NAME}] taste-gate contract missing/weakened (${errors.length}):\n${errors.map((e) => "  - " + e).join("\n")}\n`);
  return 1;
}

if (require.main === module) process.exit(main());
module.exports = { evaluateSpec, REQUIRED, SPECS, NAME };
