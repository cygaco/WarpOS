#!/usr/bin/env node
"use strict";
/**
 * pipe-masks-gate-lint.test.js — teeth for the ED-258b pipe-masks-gate shell-lint. β: plant the real
 * violation (`| tail && next` AND `| head && next`) → RED, and the hardest benign-adjacent
 * (bare-gate-then-&&, pipe-with-no-chain, grep-as-gate, prose-outside-a-fence, pragma) → GREEN.
 */
const assert = require("assert");
const { scanText } = require("./pipe-masks-gate-lint.js");

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log("  PASS  " + name); }
  catch (e) { fail++; console.error("  FAIL  " + name + " — " + (e && e.message ? e.message : e)); }
}
const fenced = (...cmds) => ["```bash", ...cmds, "```"].join("\n");

t("| tail before && -> RED", () => {
  assert.strictEqual(scanText(fenced("node gate.js | tail -1 && node next.js")).length, 1);
});

t("| head before && -> RED (general shape, not just tail)", () => {
  assert.strictEqual(scanText(fenced("node gate.js | head -5 && echo ok")).length, 1);
});

t("| tee before && -> RED", () => {
  assert.strictEqual(scanText(fenced("node gate.js | tee out.log && node next.js")).length, 1);
});

t("| tail before ; -> RED (semicolon chain masks too)", () => {
  assert.strictEqual(scanText(fenced("node gate.js | tail -1 ; node next.js")).length, 1);
});

t("bare gate then && (NO pipe) -> GREEN", () => {
  assert.deepStrictEqual(scanText(fenced("node gate.js && node next.js")), []);
});

t("pipe to a passthrough with NO chain after -> GREEN", () => {
  assert.deepStrictEqual(scanText(fenced("node gate.js | tail -1")), []);
});

t("grep-as-gate (non-passthrough filter) then && -> GREEN (grep's exit IS the intended gate)", () => {
  assert.deepStrictEqual(scanText(fenced("echo x | grep needle && echo found")), []);
});

t("security r2 #5: MID-STAGE passthrough `| tail | grep x && next` -> RED (not just last-stage)", () => {
  assert.strictEqual(scanText(fenced("node gate.js | tail -1 | grep OK && node next.js")).length, 1);
});

t("security r2 #5: passthrough split across a \\ line-continuation -> RED (lines joined)", () => {
  const md = ["```bash", "node gate.js | tail -1 \\", "  && node next.js", "```"].join("\n");
  assert.strictEqual(scanText(md).length, 1);
});

t("mid-stage: `| head | awk … ;` -> RED (semicolon + mid-stage passthrough)", () => {
  assert.strictEqual(scanText(fenced("node gate.js | head -5 | awk '{print}' ; node next.js")).length, 1);
});

t("the pattern OUTSIDE a fenced block (prose) -> GREEN (fenced-only; no self-trip on the rule's example)", () => {
  const md = "The rule warns: `node gate.js | tail -1 && next` runs next even on a RED gate.\n";
  assert.deepStrictEqual(scanText(md), []);
});

t("a sanctioned line with the pragma -> GREEN", () => {
  assert.deepStrictEqual(scanText(fenced("node gate.js | tail -1 && next   # pipe-masks-gate-lint:allow")), []);
});

t("backend r2 #8: a QUOTED semicolon `| tee \"a;b\"` (no real chain) -> GREEN (false-positive closed)", () => {
  assert.deepStrictEqual(scanText(fenced('node gate.js | tee "a;b"')), []);
});

t("backend r2 #8: a quoted separator but a REAL && after -> RED (the real chain still flagged)", () => {
  assert.strictEqual(scanText(fenced('node gate.js | tee "a;b" && node next.js')).length, 1);
});

t("backend r2 #8: a `;`/`&&` inside a trailing # comment -> GREEN (comment stripped)", () => {
  assert.deepStrictEqual(scanText(fenced("node gate.js | tail -1   # note: use ; or && carefully")), []);
});

t("qa/backend r2 (literal #): mid-word `| tee out#tag && next` -> RED (the # is literal, not a comment)", () => {
  assert.strictEqual(scanText(fenced("false | tee /tmp/result#literal && node next.js")).length, 1);
});

t("qa/backend r2 (escaped #): `| tee out\\#tag && next` -> RED (\\# is a literal #, tail kept)", () => {
  assert.strictEqual(scanText(fenced("false | tee out\\#tag && node next.js")).length, 1);
});

t("backend r3 7G-003 (escaped SPACE before #): `| tee out\\ #tag && next` -> RED (the # is mid-token)", () => {
  // `out\ #tag` is a filename "out #tag" (the space is escaped) — the # is NOT a comment marker, and the
  // real `&& next` must NOT be swallowed. A regex `(^|\s)#` mis-read the escaped space as a boundary.
  assert.strictEqual(scanText(fenced("false | tee out\\ #tag && node next.js")).length, 1);
});

t("a GENUINE comment after unescaped whitespace still strips -> GREEN", () => {
  assert.deepStrictEqual(scanText(fenced("node gate.js | tail -1  # real comment && next")), []);
});

t("multiple offending lines in one block -> all flagged", () => {
  const md = fenced("node a.js | tail && b", "clean.js && c", "node d.js | head -1 ; e");
  assert.strictEqual(scanText(md).length, 2);
});

console.log("\n" + pass + "/" + (pass + fail) + " passed");
process.exit(fail ? 1 : 0);
