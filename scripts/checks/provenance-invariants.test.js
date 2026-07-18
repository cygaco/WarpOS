#!/usr/bin/env node
"use strict";
/**
 * Self-verifying teeth for the STRUCTURAL anti-recurrence guard (SP-20260718-003, β round-5 ruling). The
 * guard is only a class-CLOSE if it actually CATCHES a re-introduced leak — so each detector is proven
 * against a leak fixture AND a clean fixture, and the live guard is asserted GREEN on the swept code.
 *
 *   node scripts/checks/provenance-invariants.test.js
 */
const assert = require("assert");
const g = require("./provenance-invariants");

let passed = 0;
const failures = [];
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failures.push(`${name}: ${e.message}`); }
}

// ── INV-1 hunter-identity: the via/record_via OR is the SR-016 leak; strict shape is clean. ──
test("INV-1: detects a via/record_via OR in a hunter-identity check", () => {
  const leak = `match = recs.find(r => r.role === HUNTER && (r.via === "epsilon-agent" || r.shape === "in-process-agent") && r.output_digest);`;
  assert.equal(g.hasHunterIdentityLeak(leak), true, "the settable-label OR must be flagged");
});
test("INV-1: a strict shape check (no label OR) is clean", () => {
  const clean = `match = recs.find(r => r.role === HUNTER && r.shape === "in-process-agent" && r.output_digest);`;
  assert.equal(g.hasHunterIdentityLeak(clean), false);
});
test("INV-1: a via mention inside a COMMENT is not a false positive", () => {
  const commented = `// legacy: (r.via === "epsilon-agent" || r.shape === "in-process-agent")\nmatch = recs.find(r => r.shape === "in-process-agent");`;
  assert.equal(g.hasHunterIdentityLeak(commented), false);
});

// ── INV-2 run-identity: an r.run_id filter is the QA-014 leak; panel_run_id / output field is clean. ──
test("INV-2: detects an r.run_id === runId attestation filter", () => {
  assert.equal(g.hasRunIdentityLeak(`if (r.run_id !== runId) continue;`), true);
  assert.equal(g.hasRunIdentityLeak(`recs.filter(r => r.run_id === runId)`), true);
});
test("INV-2: filtering by panel_run_id is clean; run_id as an OUTPUT field is clean", () => {
  assert.equal(g.hasRunIdentityLeak(`if (r.panel_run_id !== panelRunId) continue;`), false);
  assert.equal(g.hasRunIdentityLeak(`return { run_id: runId, ok };`), false);
});

// ── INV-3 provenance-token: an unvalidated packed-ref return is the R5-BE-001 leak. ──
test("INV-3: flags git-head source whose readPackedRef does NOT SHA-validate", () => {
  const leak = [
    "function readGitHead(root) {",
    "  if (/^[0-9a-f]{7,40}$/i.test(x)) return x;",
    "  if (/^[0-9a-f]{7,40}$/i.test(y)) return y;",
    "}",
    "function readPackedRef(p, ref) {",
    "  return t.slice(0, sp);",
    "}",
  ].join("\n");
  assert.equal(g.gitHeadTokenValidated(leak), false, "an unvalidated packed-ref return must be flagged");
});
test("INV-3: git-head source that SHA-validates every path is clean", () => {
  const clean = [
    "function readGitHead(root) {",
    "  if (/^[0-9a-f]{7,40}$/i.test(x)) return x;",
    "  if (/^[0-9a-f]{7,40}$/i.test(y)) return y;",
    "}",
    "function readPackedRef(p, ref) {",
    "  const s = t.slice(0, sp);",
    "  return /^[0-9a-f]{7,40}$/i.test(s) ? s : '';",
    "}",
  ].join("\n");
  assert.equal(g.gitHeadTokenValidated(clean), true);
});

// ── the LIVE guard must be GREEN on the swept code (all three invariants hold at every guarded site). ──
test("live: the swept code has ZERO invariant violations", () => {
  const v = g.run();
  assert.equal(v.length, 0, `guard must be green on swept code: ${v.map((x) => `[${x.inv}] ${x.file}: ${x.msg}`).join(" | ")}`);
});

if (failures.length) {
  process.stderr.write(`FAIL [provenance-invariants.test] ${failures.length} failure(s):\n${failures.map((f) => `  - ${f}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(`OK   [provenance-invariants.test] ${passed} passed (the guard catches a re-introduced leak per class AND is green on the swept code)\n`);
