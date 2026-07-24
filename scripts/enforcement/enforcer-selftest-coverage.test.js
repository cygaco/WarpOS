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

console.log("");
console.log(pass + "/" + (pass + fail) + " passed" + (fail ? " (" + fail + " FAILED)" : ""));
process.exit(fail ? 1 : 0);
