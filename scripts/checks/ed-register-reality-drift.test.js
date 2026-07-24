"use strict";
/**
 * Sealed-fixture test for ed-register-reality-drift.js (ED-056 register residual).
 * Pure evaluate() driven by an injected register text + a mock fileExists oracle — no disk.
 */
const assert = require("assert");
const { evaluate } = require("./ed-register-reality-drift");

let pass = 0, fail = 0;
function t(desc, fn) {
  try { fn(); console.log("  PASS  " + desc); pass++; }
  catch (e) { console.error("  FAIL  " + desc + "\n        " + e.message); fail++; }
}

// A mock filesystem: a Set of repo-relative paths that "exist".
function mkExists(paths) {
  const s = new Set(paths);
  return (rel) => s.has(rel);
}

const row = (o) => JSON.stringify(o);

// ── 1. shipped-with-teeth (open ED, enforcer + sibling test exist) -> RED ──
t("open ED naming a new enforcer that exists WITH a sibling test -> drift finding", () => {
  const text = row({ id: "ED-900", status: "open", severity: "medium", gap: "no dup detector",
    trigger: "Build scripts/enforcement/foo-lint.js + wire scan:full" });
  const exists = mkExists(["scripts/enforcement/foo-lint.js", "scripts/enforcement/foo-lint.test.js"]);
  const r = evaluate({ registerText: text, fileExists: exists });
  assert.strictEqual(r.findings.length, 1, "expected 1 finding");
  assert.strictEqual(r.findings[0].id, "ED-900");
  assert.strictEqual(r.findings[0].deliverable, "scripts/enforcement/foo-lint.js");
});

// ── 2. enforcer exists but NO sibling test (modify-existing class) -> GREEN ──
t("open ED naming a file that exists but has NO sibling test -> no false-RED (modify-existing)", () => {
  const text = row({ id: "ED-901", status: "open", gap: "add a check to scripts/checks/epsilon-liveness.js",
    trigger: "extend scripts/checks/epsilon-liveness.js" });
  const exists = mkExists(["scripts/checks/epsilon-liveness.js"]); // exists, but no .test.js in the mock
  const r = evaluate({ registerText: text, fileExists: exists });
  assert.strictEqual(r.findings.length, 0, "modify-existing (no new test sibling) must not RED");
});

// ── 3. enforcer does NOT exist -> GREEN (genuinely open) ──
t("open ED naming an enforcer that does not exist -> no finding", () => {
  const text = row({ id: "ED-902", status: "open", trigger: "Build scripts/enforcement/not-built.js" });
  const r = evaluate({ registerText: text, fileExists: mkExists([]) });
  assert.strictEqual(r.findings.length, 0);
});

// ── 4. CLOSED ED (closure row) -> GREEN even though enforcer+test exist ──
t("closed ED (closure row present) -> not a drift candidate", () => {
  const text = [
    row({ id: "ED-903", status: "open", gap: "x", trigger: "Build scripts/enforcement/done-lint.js" }),
    row({ id: "ED-903", status: "closed", closure_receipt: "SP-X", closed_ts: "2026-07-24" }),
  ].join("\n");
  const exists = mkExists(["scripts/enforcement/done-lint.js", "scripts/enforcement/done-lint.test.js"]);
  const r = evaluate({ registerText: text, fileExists: exists });
  assert.strictEqual(r.findings.length, 0, "a closed ED must never be a drift finding");
});

// ── 5. malformed line -> skipped + counted, does not crash ──
t("malformed register line -> skipped + counted, no crash", () => {
  const text = ["{not json", row({ id: "ED-904", status: "open", trigger: "Build scripts/enforcement/m.js" })].join("\n");
  const exists = mkExists(["scripts/enforcement/m.js", "scripts/enforcement/m.test.js"]);
  const r = evaluate({ registerText: text, fileExists: exists });
  assert.strictEqual(r.malformedLines, 1, "expected 1 malformed line counted");
  assert.strictEqual(r.findings.length, 1, "the well-formed drift row still flagged");
});

// ── 6. multiple enforcer paths in one row -> deduped, each shipped one flagged once ──
t("two enforcer paths in one open row -> each flagged once (deduped)", () => {
  const text = row({ id: "ED-905", status: "open",
    trigger: "Build scripts/checks/a.js AND scripts/enforcement/b.js; also mention scripts/checks/a.js again" });
  const exists = mkExists(["scripts/checks/a.js", "scripts/checks/a.test.js", "scripts/enforcement/b.js", "scripts/enforcement/b.test.js"]);
  const r = evaluate({ registerText: text, fileExists: exists });
  assert.strictEqual(r.findings.length, 2, "expected exactly 2 (a + b), a deduped");
});

// ── 7. .cjs/.mjs sibling naming handled ──
t("cjs enforcer -> sibling .test.cjs checked", () => {
  const text = row({ id: "ED-906", status: "open", trigger: "Build scripts/enforcement/c.cjs" });
  const exists = mkExists(["scripts/enforcement/c.cjs", "scripts/enforcement/c.test.cjs"]);
  const r = evaluate({ registerText: text, fileExists: exists });
  assert.strictEqual(r.findings.length, 1);
});

// ── 8. partial-resolution exclusion: open ED with a residual marker + shipped enforcer -> NOT flagged ──
t("open ED with an open-residual marker + shipped enforcer -> excluded (managed partial)", () => {
  const exists = mkExists(["scripts/enforcement/p.js", "scripts/enforcement/p.test.js"]);
  // text marker
  const t1 = row({ id: "ED-907", status: "open", trigger: "Build scripts/enforcement/p.js", gap: "REMAINING OPEN: sub-item (ii)" });
  assert.strictEqual(evaluate({ registerText: t1, fileExists: exists }).findings.length, 0, "text marker must exclude");
  // structured field
  const t2 = row({ id: "ED-908", status: "open", trigger: "Build scripts/enforcement/p.js", open_adr: true });
  assert.strictEqual(evaluate({ registerText: t2, fileExists: exists }).findings.length, 0, "open_adr field must exclude");
  // amendment row carrying the residual
  const t3 = [
    row({ id: "ED-909", status: "open", trigger: "Build scripts/enforcement/p.js" }),
    row({ id: "ED-909", record_kind: "amendment", amends: "ED-909", note: "sub-item (i) still open" }),
  ].join("\n");
  assert.strictEqual(evaluate({ registerText: t3, fileExists: exists }).findings.length, 0, "amendment residual must exclude");
});

// ── 9. CONTROL: on the live register, the false-positive class is closed (append-safe INVARIANT,
//     not a fixed count — the register grows): no FLAGGED id may carry a partial-resolution marker. ──
t("CONTROL: live register — no flagged id carries a partial-resolution marker (false-positive class closed)", () => {
  const fs = require("fs"), path = require("path");
  const reg = path.join(__dirname, "..", "..", ".claude", "project", "memory", "enforcement-debt.jsonl");
  let text; try { text = fs.readFileSync(reg, "utf8"); } catch { console.log("        (register absent — skipped)"); return; }
  const realExists = (rel) => { try { return fs.existsSync(path.join(__dirname, "..", "..", rel)); } catch { return false; } };
  const parseRegister = require("../enforcement/ed-registry").parseRegister;
  const r = evaluate({ registerText: text, fileExists: realExists });
  const PARTIAL = /\b(REMAINING OPEN|open_adr|residual|sub-item|partially|partial_enforced|deferred|still open|remains open)\b/i;
  const rows = parseRegister(text);
  for (const f of r.findings) {
    const idText = rows.filter((x) => !x.malformed && x.id === f.id).map((x) => JSON.stringify(x.obj)).join(" ");
    assert.ok(!PARTIAL.test(idText), `flagged id ${f.id} carries a partial marker — false positive not excluded`);
  }
  // must not crash + returns a well-formed shape
  assert.ok(Array.isArray(r.findings) && typeof r.skippedPartial === "number");
});

// ── 10. β Q2(b) PHANTOM-CLOSE: closed ED citing an ABSENT enforcer -> phantomClose candidate ──
t("closed ED whose closure names an enforcer that does NOT exist -> phantom-close candidate", () => {
  const text = [
    row({ id: "ED-910", status: "open", gap: "x", trigger: "Build scripts/enforcement/ghost.js" }),
    row({ id: "ED-910", status: "closed", closure_receipt: "SP-Y", enforcer: "scripts/enforcement/ghost.js", closed_ts: "2026-07-24" }),
  ].join("\n");
  const r = evaluate({ registerText: text, fileExists: mkExists([]) }); // ghost.js absent
  assert.strictEqual(r.findings.length, 0, "not a stale-open (it is closed)");
  assert.strictEqual(r.phantomClose.length, 1, "closed+absent -> phantom-close");
  assert.strictEqual(r.phantomClose[0].id, "ED-910");
});

// ── 11. closed ED citing a PRESENT enforcer -> no phantom-close (healthy closure) ──
t("closed ED whose closure names an enforcer that exists -> no phantom-close", () => {
  const text = row({ id: "ED-911", status: "closed", closure_receipt: "SP-Z", enforcer: "scripts/checks/real.js", closed_ts: "2026-07-24" });
  const r = evaluate({ registerText: text, fileExists: mkExists(["scripts/checks/real.js"]) });
  assert.strictEqual(r.phantomClose.length, 0, "closure naming a present file is healthy");
});

// ── 12. phantom-close reads only the CLOSURE row's path, not the open genesis target ──
t("open genesis naming an absent target on a still-OPEN ED is not phantom-close", () => {
  const text = row({ id: "ED-912", status: "open", trigger: "Build scripts/enforcement/todo.js" });
  const r = evaluate({ registerText: text, fileExists: mkExists([]) });
  assert.strictEqual(r.phantomClose.length, 0, "an open ED's not-yet-built target is not a phantom-close");
});

// ── F7 (gpt qa r0, HIGH false-green): a FALSE-valued partial field must NOT suppress a stale-open ──
t("F7: open ED with open_adr:false + shipped enforcer -> STILL flagged (false field does not suppress)", () => {
  const text = row({ id: "ED-920", status: "open", open_adr: false, trigger: "Build scripts/enforcement/f7.js" });
  const exists = mkExists(["scripts/enforcement/f7.js", "scripts/enforcement/f7.test.js"]);
  const r = evaluate({ registerText: text, fileExists: exists });
  assert.strictEqual(r.findings.length, 1, "open_adr:false must not suppress via a JSON-key match");
});
t("F7: partial_enforced:false + shipped enforcer -> STILL flagged", () => {
  const text = row({ id: "ED-925", status: "open", partial_enforced: false, trigger: "Build scripts/enforcement/f7b.js" });
  const exists = mkExists(["scripts/enforcement/f7b.js", "scripts/enforcement/f7b.test.js"]);
  assert.strictEqual(evaluate({ registerText: text, fileExists: exists }).findings.length, 1);
});
t("F7 companion: open_adr:TRUE (real partial) still suppresses", () => {
  const text = row({ id: "ED-926", status: "open", open_adr: true, trigger: "Build scripts/enforcement/f7c.js" });
  const exists = mkExists(["scripts/enforcement/f7c.js", "scripts/enforcement/f7c.test.js"]);
  assert.strictEqual(evaluate({ registerText: text, fileExists: exists }).findings.length, 0, "a real open_adr:true partial is excluded");
});

// ── F8 (gpt qa/backend r0, HIGH): a RESOLUTION-only closure feeds phantom-close ──
t("F8: resolution-only closure naming an ABSENT enforcer -> phantom-close candidate", () => {
  const text = [
    row({ id: "ED-921", status: "open", gap: "x", trigger: "Build scripts/checks/f8.js" }),
    row({ id: "ED-921", resolution: "resolved via scripts/checks/f8.js" }), // resolution-only closure row (no status/closure_receipt)
  ].join("\n");
  const r = evaluate({ registerText: text, fileExists: mkExists([]) }); // f8.js absent
  assert.strictEqual(r.findings.length, 0, "resolution => closed, not stale-open");
  assert.strictEqual(r.phantomClose.length, 1, "resolution-only closure + absent enforcer -> phantom-close");
});

// ── F9 (gpt backend r0, HIGH): an AMENDMENT (not genesis) names the shipped enforcer ──
t("F9: amendment names the shipped enforcer while genesis has only gap text -> flagged", () => {
  const text = [
    row({ id: "ED-922", status: "open", gap: "a descriptive gap naming no concrete path" }),
    row({ id: "ED-922", record_kind: "amendment", amends: "ED-922", note: "Build scripts/enforcement/f9.js as the enforcer" }),
  ].join("\n");
  const exists = mkExists(["scripts/enforcement/f9.js", "scripts/enforcement/f9.test.js"]);
  const r = evaluate({ registerText: text, fileExists: exists });
  assert.strictEqual(r.findings.length, 1, "amendment-named enforcer must be scanned (all rows), not just genesis");
});

// ── F10 (gpt qa r0, HIGH): a MODIFY-existing reference must NOT false-flag ──
t("F10: open ED that MODIFIES an existing enforcer (file+test exist) -> not flagged", () => {
  const text = row({ id: "ED-923", status: "open", trigger: "Add a waiter-armed check to scripts/checks/existing.js" });
  const exists = mkExists(["scripts/checks/existing.js", "scripts/checks/existing.test.js"]);
  assert.strictEqual(evaluate({ registerText: text, fileExists: exists }).findings.length, 0, "modify-existing must not false-flag");
});
t("F10 companion: a CREATION context for a new enforcer IS flagged", () => {
  const text = row({ id: "ED-924", status: "open", trigger: "Build scripts/checks/brandnew.js" });
  const exists = mkExists(["scripts/checks/brandnew.js", "scripts/checks/brandnew.test.js"]);
  assert.strictEqual(evaluate({ registerText: text, fileExists: exists }).findings.length, 1);
});

console.log("");
console.log(pass + "/" + (pass + fail) + " passed" + (fail ? " (" + fail + " FAILED)" : ""));
process.exit(fail ? 1 : 0);
