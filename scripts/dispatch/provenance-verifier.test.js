#!/usr/bin/env node
"use strict";
/**
 * Bite-test for provenance-verifier.js laneContract — the FAIL-CLOSED panel-profile whitelist (R7-BE-001,
 * SP-20260718-003 round-7 pre-land precondition). Before the fix, `claudeLaneContract` treated ANY
 * non-`panel-3lab` string as the `panel-2family` floor contract, so a typo'd/unknown/absent profile silently
 * false-greened to the subprocess-claude floor. This test proves BOTH sides:
 *   POSITIVE — the two recognized profiles (panel-3lab BINDING, panel-2family FLOOR) still resolve correctly
 *              on every provider (the GREEN floor is undisturbed).
 *   NEGATIVE — a typo'd / unknown / absent profile THROWS (fails closed), for the claude lane AND the
 *              cross-provider lanes (the partial false-green is closed too). The negative control is the teeth.
 *
 *   node scripts/dispatch/provenance-verifier.test.js
 */
const assert = require("assert");
const pv = require("./provenance-verifier");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// ── the recognized set is exactly the two contracted profiles, and it is frozen. ──
test("RECOGNIZED_PROFILES is exactly [panel-3lab, panel-2family] and frozen", () => {
  assert.deepEqual([...pv.RECOGNIZED_PROFILES].sort(), ["panel-2family", "panel-3lab"]);
  assert.ok(Object.isFrozen(pv.RECOGNIZED_PROFILES), "the whitelist must be immutable");
});

// ── POSITIVE: the panel-3lab BINDING resolves the in-process hunter on the claude lane. ──
test("panel-3lab + claude → in-process hunter contract (BINDING)", () => {
  const c = pv.laneContract("panel-3lab", "claude");
  assert.deepEqual(c, { shape: pv.IN_PROCESS_SHAPE, role: pv.HUNTER_ROLE, isHunter: true });
});

// ── POSITIVE: the panel-2family FLOOR resolves a subprocess-claude review on the claude lane. ──
test("panel-2family + claude → subprocess-claude floor contract (FLOOR, still GREEN)", () => {
  const c = pv.laneContract("panel-2family", "claude");
  assert.deepEqual(c, { shape: pv.SUBPROCESS_CLAUDE_SHAPE, role: pv.PANEL_ROLE, isHunter: false });
});

// ── POSITIVE: every cross-provider lab is a CLI subprocess review in BOTH recognized profiles. ──
test("recognized profiles + a cross-provider lane → cross-provider contract", () => {
  for (const profile of ["panel-3lab", "panel-2family"]) {
    for (const provider of ["openai", "antigravity"]) {
      const c = pv.laneContract(profile, provider);
      assert.deepEqual(c, { shape: pv.CROSS_PROVIDER_SHAPE, role: pv.PANEL_ROLE, isHunter: false }, `${profile}/${provider}`);
    }
  }
});

// ── POSITIVE: claudeLaneContract directly resolves both recognized profiles. ──
test("claudeLaneContract resolves both recognized profiles directly", () => {
  assert.equal(pv.claudeLaneContract("panel-3lab").isHunter, true);
  assert.equal(pv.claudeLaneContract("panel-2family").isHunter, false);
});

// ── NEGATIVE (the R7-BE-001 regression): a TYPO'd profile must THROW on the claude lane, not floor-default. ──
test("R7-BE-001: a typo'd profile + claude THROWS (does NOT resolve to the floor)", () => {
  assert.throws(() => pv.laneContract("panel-2famly", "claude"), /unrecognized panel profile|fail closed/i);
  // and it must NOT have silently returned the floor contract:
  let resolved = null;
  try { resolved = pv.laneContract("panel-2famly", "claude"); } catch { /* expected */ }
  assert.equal(resolved, null, "a typo'd profile must never resolve to a contract");
});

// ── NEGATIVE: the typo must ALSO throw for a cross-provider lane (partial false-green closed). ──
test("R7-BE-001: a typo'd profile + a cross-provider lane ALSO throws (no partial false-green)", () => {
  assert.throws(() => pv.laneContract("panel-2famly", "openai"), /unrecognized panel profile/i);
  assert.throws(() => pv.laneContract("panel-3lab-typo", "antigravity"), /unrecognized panel profile/i);
});

// ── NEGATIVE: an entirely UNKNOWN profile throws. ──
test("R7-BE-001: an unknown profile throws", () => {
  assert.throws(() => pv.laneContract("floor", "claude"), /unrecognized panel profile/i);
  assert.throws(() => pv.laneContract("panel-4lab", "claude"), /unrecognized panel profile/i);
});

// ── NEGATIVE: an ABSENT profile (undefined / null / empty string) throws — the "absent" half of the rule. ──
test("R7-BE-001: an absent profile (undefined/null/empty) throws", () => {
  for (const bad of [undefined, null, ""]) {
    assert.throws(() => pv.laneContract(bad, "claude"), /unrecognized panel profile/i, `laneContract(${JSON.stringify(bad)})`);
    assert.throws(() => pv.claudeLaneContract(bad), /unrecognized panel profile/i, `claudeLaneContract(${JSON.stringify(bad)})`);
  }
});

// ── NEGATIVE: claudeLaneContract itself fails closed (defense-in-depth — it is exported and callable). ──
test("R7-BE-001: claudeLaneContract fails closed on a typo (exported entry is guarded too)", () => {
  assert.throws(() => pv.claudeLaneContract("panel-2famly"), /unrecognized panel profile/i);
});

// ── the fail-closed error is greppable (names the profile + the recognized set) for debuggability. ──
test("the fail-closed error names the offending profile and the recognized set", () => {
  try {
    pv.laneContract("bogus-profile", "claude");
    assert.fail("should have thrown");
  } catch (e) {
    assert.ok(/bogus-profile/.test(e.message), "error names the offending profile");
    assert.ok(/panel-3lab/.test(e.message) && /panel-2family/.test(e.message), "error lists the recognized profiles");
  }
});

if (failures.length) {
  process.stderr.write(`FAIL [provenance-verifier.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [provenance-verifier.test] ${passed} passed (R7-BE-001: unrecognized/absent profile fails closed; recognized floor+binding still resolve)\n`);
