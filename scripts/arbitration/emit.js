#!/usr/bin/env node
"use strict";

/**
 * arbitration/emit.js — the enforcer-facing helper to emit a `decision_record`
 * (S1.2). In oneshot there is no α/β in the room, so a per-domain ENFORCER calls
 * this to record its judgment. `arbitration_needed:true` = FAIL-CLOSED park:
 * contracts conflicted, confidence was low, a gauntlet deadlocked, or a required
 * upstream artifact was missing/contradictory — the unit is PARKED and the
 * arbitration_resolver blocks ship-ready at run-end.
 *
 * β DECIDE conf 0.89 (EVT-s1-2-hard-halt-arbitration-beta-001):
 *   Q1 per-unit park-and-continue · Q2 enforcer-declared confidence, NO global
 *   threshold, FAIL-CLOSED default (uncertain ⇒ arbitration_needed:true) ·
 *   Q3 fail-closed at run-end · resolver bundles PER-UNIT, precedence-ordered.
 *
 * Shape = schemas/contracts/decision_record.schema.json (the S0.2 contract).
 * Records are PER-RUN ⇒ runtime/arbitration/<unit>/<id>.json (walk-skipped, NOT
 * tracked — per-run emissions go under runtime/, never .claude/project/).
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT =
  process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const STORE = path.join(ROOT, "runtime", "arbitration");

/**
 * @param {object} o
 * @param {string} o.unit            the unit of work (feature/artifact) being judged
 * @param {string} o.owner           the emitting enforcer/domain (e.g. "design_quality", "product_lead")
 * @param {string} o.decision        what was decided
 * @param {string} o.rationale       why
 * @param {string} [o.precedenceBasis] which contract precedence resolved (or would resolve) the conflict
 * @param {number} [o.confidence]    0..1 (enforcer-declared; low confidence is a first-class result)
 * @param {boolean} [o.arbitrationNeeded] OMIT or pass non-false to fail-closed-park;
 *                                   pass EXACTLY false only when the enforcer is CONFIDENT-resolved (β Q2)
 * @param {number} [o.artifactPrecedence] the emitting artifact's integer precedence rank
 *                                   (governs per-unit bundle ordering — highest leads, β ADR delta)
 * @returns {object} the written decision_record
 */
function emit(o = {}) {
  const { unit, owner, decision, rationale } = o;
  if (!unit || !owner || !decision || !rationale) {
    throw new Error(
      "arbitration.emit: `unit`, `owner`, `decision`, `rationale` are required",
    );
  }
  const rec = {
    type: "decision_record",
    id: "dr-" + Date.now().toString(36) + "-" + crypto.randomBytes(3).toString("hex"),
    unit: String(unit),
    decision: String(decision),
    owner: String(owner),
    rationale: String(rationale),
    precedence_basis: o.precedenceBasis ? String(o.precedenceBasis) : "n/a",
    confidence: typeof o.confidence === "number" ? o.confidence : 0,
    // FAIL-CLOSED default (β Q2): true unless the enforcer EXPLICITLY passes false.
    arbitration_needed: o.arbitrationNeeded !== false,
    artifact_precedence:
      typeof o.artifactPrecedence === "number" ? o.artifactPrecedence : 0,
    emitted_at: new Date().toISOString(),
    resolved: false,
  };
  const safeUnit = rec.unit.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const dir = path.join(STORE, safeUnit);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, rec.id + ".json"), JSON.stringify(rec, null, 2));
  return rec;
}

module.exports = { emit, STORE };

if (require.main === module) {
  // Manual smoke: node scripts/arbitration/emit.js <unit> <owner> "<decision>" "<rationale>"
  const [, , unit, owner, decision, rationale] = process.argv;
  const rec = emit({ unit, owner, decision, rationale });
  process.stdout.write(JSON.stringify(rec, null, 2) + "\n");
}
