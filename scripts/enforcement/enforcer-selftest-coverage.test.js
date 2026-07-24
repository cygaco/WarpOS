"use strict";
/** Sealed-fixture test for enforcer-selftest-coverage.js (ED-033). Pure evaluate() — no disk. */
const assert = require("assert");
const { evaluate } = require("./enforcer-selftest-coverage");

let pass = 0, fail = 0;
function t(desc, fn) {
  try { fn(); console.log("  PASS  " + desc); pass++; }
  catch (e) { console.error("  FAIL  " + desc + "\n        " + e.message); fail++; }
}

// ── 1. enforcer + test with a planted violation -> clean ──
t("enforcer with a self-test carrying a planted-violation -> no finding", () => {
  const r = evaluate({ items: [
    { rel: "scripts/checks/a.js", isEnforcer: true, hasTest: true, testText: "planted violation -> RED; assert(findings.length, 1)" },
  ] });
  assert.strictEqual(r.hard.length, 0);
  assert.strictEqual(r.soft.length, 0);
  assert.strictEqual(r.enforcerCount, 1);
});

// ── 2. enforcer with NO test -> HARD ──
t("enforcer with no sibling test -> hard finding", () => {
  const r = evaluate({ items: [{ rel: "scripts/enforcement/b.js", isEnforcer: true, hasTest: false, testText: "" }] });
  assert.strictEqual(r.hard.length, 1);
  assert.strictEqual(r.hard[0].enforcer, "scripts/enforcement/b.js");
});

// ── 3. enforcer with a happy-path-only test (no planted violation) -> SOFT ──
t("enforcer whose test has no failing-case assertion -> soft advisory", () => {
  const r = evaluate({ items: [
    { rel: "scripts/checks/c.js", isEnforcer: true, hasTest: true, testText: "assert.ok(true); console.log('all good');" },
  ] });
  assert.strictEqual(r.hard.length, 0);
  assert.strictEqual(r.soft.length, 1);
});

// ── 4. a non-enforcer (helper lib, no CLI main) -> ignored entirely ──
t("non-enforcer item -> not judged (no finding, not counted)", () => {
  const r = evaluate({ items: [{ rel: "scripts/checks/lib/x.js", isEnforcer: false, hasTest: false, testText: "" }] });
  assert.strictEqual(r.hard.length, 0);
  assert.strictEqual(r.enforcerCount, 0);
});

// ── 5. mix -> correct counts ──
t("mixed set -> counts hard/soft/total correctly", () => {
  const r = evaluate({ items: [
    { rel: "scripts/checks/ok.js", isEnforcer: true, hasTest: true, testText: "-> RED planted" },
    { rel: "scripts/checks/notest.js", isEnforcer: true, hasTest: false, testText: "" },
    { rel: "scripts/checks/weaktest.js", isEnforcer: true, hasTest: true, testText: "assert.ok(true)" },
    { rel: "scripts/checks/helper.js", isEnforcer: false, hasTest: false, testText: "" },
  ] });
  assert.strictEqual(r.enforcerCount, 3);
  assert.strictEqual(r.hard.length, 1);
  assert.strictEqual(r.soft.length, 1);
});

// ── 6. planted-violation signal variants each recognized ──
t("planted-violation signal variants (findings.length / must fail / violation / -> fail) recognized", () => {
  for (const sig of ["expect findings.length === 1", "this must fail", "a planted violation", "input -> fail", "hard.length, 1"]) {
    const r = evaluate({ items: [{ rel: "scripts/checks/s.js", isEnforcer: true, hasTest: true, testText: sig }] });
    assert.strictEqual(r.soft.length, 0, "signal not recognized: " + sig);
  }
});

// ── 7. CONTROL: live tree — via the REAL gatherItems (both conventions), every HARD finding truly
//     lacks BOTH `<name>.test.js` AND `test-<name>.js` on disk (no naming-convention false positive). ──
t("CONTROL: live enforcer dirs (real gather) — HARD findings truly have neither test convention", () => {
  const fs = require("fs"), path = require("path");
  const root = path.join(__dirname, "..", "..");
  const { evaluate: ev, gatherItems } = require("./enforcer-selftest-coverage");
  const { items } = gatherItems();
  const r = ev({ items });
  for (const f of r.hard) {
    const dotAbs = path.join(root, f.enforcer.replace(/\.(js|cjs|mjs)$/, ".test.$1"));
    const dir = path.dirname(path.join(root, f.enforcer));
    const dashAbs = path.join(dir, "test-" + path.basename(f.enforcer));
    assert.ok(!fs.existsSync(dotAbs) && !fs.existsSync(dashAbs), `HARD finding ${f.enforcer} actually HAS a test (dot or dash convention) — false positive`);
  }
  console.log("        (live: " + r.enforcerCount + " enforcers, " + r.hard.length + " no-test, " + r.soft.length + " weak-test)");
});

// ── 8. β Q3 SELF-COVERING BASE CASE: the meta-gate enumerates ITSELF and is NOT a HARD finding ──
t("SELF-COVERING: the meta-gate includes itself in its enumeration and passes its own check", () => {
  const { gatherItems, evaluate: ev } = require("./enforcer-selftest-coverage");
  const { items } = gatherItems();
  const self = items.find((it) => /enforcer-selftest-coverage\.js$/.test(it.rel));
  assert.ok(self, "the meta-gate must appear in its own enumeration");
  assert.strictEqual(self.isEnforcer, true, "the meta-gate is itself a CLI enforcer");
  assert.strictEqual(self.hasTest, true, "the meta-gate must carry its own self-test (this file)");
  const r = ev({ items });
  assert.ok(!r.hard.some((f) => /enforcer-selftest-coverage\.js$/.test(f.enforcer)), "the meta-gate must not be its own uncovered HARD finding");
});

// ── F11 (gpt qa/backend/security r0, HIGH): gatherItems is fail-closed — real tree has BOTH dirs
//     readable + no unreadable sources; the {items,errors,dirsSeen,dirsRequired} contract is present. ──
t("F11: gatherItems fail-closed contract — real tree: both dirs seen, zero unreadable-source errors", () => {
  const { gatherItems } = require("./enforcer-selftest-coverage");
  const g = gatherItems();
  assert.ok(Array.isArray(g.items) && Array.isArray(g.errors) && typeof g.dirsSeen === "number" && typeof g.dirsRequired === "number");
  assert.strictEqual(g.dirsSeen, g.dirsRequired, "every required enforcer dir must be readable");
  assert.strictEqual(g.errors.length, 0, "no present-but-unreadable source on the real tree");
});

// ── F12 (gpt backend r0, MED): a planted violation in the SECOND test convention is recognized ──
t("F12: evaluate sees a planted violation anywhere in the concatenated test text (order-independent)", () => {
  const happyThenPlanted = "assert.ok(true); // happy path\n// --- other convention ---\nassert.strictEqual(r.findings.length, 1);";
  const r = evaluate({ items: [{ rel: "scripts/checks/x.js", isEnforcer: true, hasTest: true, testText: happyThenPlanted }] });
  assert.strictEqual(r.soft.length, 0, "a planted violation in the concatenated text must be recognized");
});

// ── F13 (gpt security r0, MED ReDoS): the bounded `not…clean` does not stall on adversarial input ──
t("F13: PLANTED_RE is linear on a hostile 'not'-heavy fixture with no 'clean' (completes fast, is SOFT)", () => {
  const hostile = "not ".repeat(50000); // ~200KB of 'not ' with no 'clean' — quadratic would stall
  const start = Date.now();
  const r = evaluate({ items: [{ rel: "scripts/checks/h.js", isEnforcer: true, hasTest: true, testText: hostile }] });
  const ms = Date.now() - start;
  assert.ok(ms < 1000, `evaluate must be fast on hostile input (took ${ms}ms)`);
  assert.strictEqual(r.soft.length, 1, "hostile happy-path-only text has no planted violation -> SOFT");
});
t("F13: a real bounded 'not … clean' phrase IS recognized as a planted signal", () => {
  const r = evaluate({ items: [{ rel: "scripts/checks/c.js", isEnforcer: true, hasTest: true, testText: "expect result is not clean" }] });
  assert.strictEqual(r.soft.length, 0, "'not clean' within the window is a recognized planted signal");
});

console.log("");
console.log(pass + "/" + (pass + fail) + " passed" + (fail ? " (" + fail + " FAILED)" : ""));
process.exit(fail ? 1 : 0);
