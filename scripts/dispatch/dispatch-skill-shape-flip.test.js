#!/usr/bin/env node
"use strict";
/**
 * Shape-door regression fixtures for the skill-lane ENFORCE flip (SP-20260718-003 D10 · qa-plan T6 · AC-18).
 *
 * The live dispatch-skill.js wrapper stays report-only-PINNED because the heavy-by-design skills
 * (scan:full / research:deep / qa:audit) are NOT yet §13.6/§13.7-stamped (they resolve inline/proven:
 * false) — flipping enforce today would FALSE-REFUSE them. These fixtures prove, in DATA (not prose —
 * the self-tripping-enforcer guard), that the flip is CORRECT the moment burn-in stamps them:
 *   - a formerly report-only skill-shape violation BLOCKS under enforce (the flip's effect);
 *   - the sanctioned lane is suppressed (correct) — and, FIX-A3 landmine, a NON-sanctioned lane can
 *     NOT ride the suppression;
 *   - no-widen: each sanctioned lane grants ONLY its exact shape+class (dispatch-contract reader).
 * They also prove WHY the live flip is deferred: scan:full (unstamped) → refuse under enforce.
 *
 *   node scripts/dispatch/dispatch-skill-shape-flip.test.js
 */
const assert = require("assert");
const { shapeDoor, shapeMismatch } = require("./dispatch-shape");
const { sanctionedLane } = require("./dispatch-contract");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// The skill-lane VIOLATION fixture: an unstamped heavy skill dispatched subprocess-skill mismatches
// (resolver picks inline, high severity). This is deterministic while scan:full is unstamped — which
// is EXACTLY the precondition the flip is gated on (once stamped, it stops mismatching = safe to flip).
const SKILL_UNIT = { kind: "skill", id: "scan:full" };
const SKILL_SHAPE = "subprocess-skill";

test("precondition: scan:full (unstamped) dispatched subprocess-skill is a HIGH-severity mismatch", () => {
  const mm = shapeMismatch(SKILL_SHAPE, SKILL_UNIT);
  assert.ok(mm && mm.mismatch === true && mm.severity === "high", JSON.stringify(mm));
});

// ── report-only (the LIVE pin) → advisory PROCEED (today's behavior — heavy skills still run). ──
test("report-only pin: skill violation → PROCEED (advisory, not blocked) — current live behavior", () => {
  const d = shapeDoor(SKILL_SHAPE, SKILL_UNIT, {}, { reportOnlyPin: true });
  assert.equal(d.action, "proceed");
  assert.equal(d.mode, "report");
});

// ── enforce (the FLIP) → REFUSE (a formerly report-only violation now blocks). AC-18 core. ──
test("enforce flip: the SAME skill violation → REFUSE (the flip blocks it)", () => {
  const d = shapeDoor(SKILL_SHAPE, SKILL_UNIT, {}, { enforceDefault: true });
  assert.equal(d.action, "refuse");
  assert.equal(d.severity, "high");
});

// ── enforce + SANCTIONED → suppressed PROCEED (a registered off-default lane is intentional). ──
test("enforce + sanctioned → PROCEED + suppressed (sanctioned lane is not blocked)", () => {
  const d = shapeDoor(SKILL_SHAPE, SKILL_UNIT, {}, { enforceDefault: true, sanctioned: true });
  assert.equal(d.action, "proceed");
  assert.equal(d.suppressed, true);
});

// ── FIX-A3 landmine: a NON-sanctioned lane (sanctioned not set) can NOT ride the suppression. ──
test("FIX-A3: enforce + sanctioned NOT set → REFUSE (non-sanctioned cannot ride suppression)", () => {
  const d = shapeDoor(SKILL_SHAPE, SKILL_UNIT, {}, { enforceDefault: true, sanctioned: false });
  assert.equal(d.action, "refuse", "a non-sanctioned lane must not be suppressed");
  assert.equal(d.suppressed, false);
});

// ── the flip does NOT break a CORRECTLY-shaped dispatch (once stamped, no mismatch → proceed). ──
test("enforce: a MATCHING shape proceeds (the flip refuses only mismatches, not correct shapes)", () => {
  // A skill dispatched its resolver-picked shape has no mismatch → proceed regardless of mode. Prove
  // via an inline-resolved skill dispatched inline (match).
  const inlineSkill = { kind: "skill", id: "scan:references" }; // proven:true, resolves inline
  const d = shapeDoor("inline", inlineSkill, {}, { enforceDefault: true });
  assert.equal(d.action, "proceed");
});

// ── NO-WIDEN per sanctioned lane (dispatch-contract reader): each grants ONLY its exact shape+class. ──
test("no-widen: security_claude_hunter sanctions in-process-agent for a cross_provider_reviewer only", () => {
  const ok = sanctionedLane({ role: "security-reviewer", shape: "in-process-agent", lane: "security_claude_hunter" });
  assert.equal(ok.sanctioned, true, ok.reason);
});
test("no-widen: security_claude_hunter does NOT sanction a WRONG shape (subprocess-cross-provider)", () => {
  const bad = sanctionedLane({ role: "security-reviewer", shape: "subprocess-cross-provider", lane: "security_claude_hunter" });
  assert.equal(bad.sanctioned, false, "wrong shape must not be sanctioned");
});
test("no-widen: a non-cross_provider_reviewer role cannot claim security_claude_hunter", () => {
  const bad = sanctionedLane({ role: "frontend-builder", shape: "in-process-agent", lane: "security_claude_hunter" });
  assert.equal(bad.sanctioned, false, "a builder role must not ride the claude-hunter lane");
});
test("no-widen: an UNREGISTERED lane name → not sanctioned (fail-closed)", () => {
  const bad = sanctionedLane({ role: "security-reviewer", shape: "in-process-agent", lane: "totally-made-up-lane" });
  assert.equal(bad.sanctioned, false);
});

if (failures.length) {
  process.stderr.write(`FAIL [dispatch-skill-shape-flip.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [dispatch-skill-shape-flip.test] ${passed} passed (flip blocks a violation; sanctioned suppressed; FIX-A3 + no-widen hold)\n`);
