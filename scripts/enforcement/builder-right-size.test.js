#!/usr/bin/env node
"use strict";
/**
 * builder-right-size.test.js — teeth for the ED-257 builder right-sizing heuristic. β rider: a
 * large-but-legitimate prompt stays WARN-not-block by default; a real oversize fires; enforce-env blocks.
 */
const assert = require("assert");
const { assessBuilderPrompt, enforceEnabled, SIZE_FLOOR_BYTES, ENFORCE_ENV } = require("./builder-right-size.js");

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log("  PASS  " + name); }
  catch (e) { fail++; console.error("  FAIL  " + name + " — " + (e && e.message ? e.message : e)); }
}
const big = SIZE_FLOOR_BYTES + 5000;
const small = SIZE_FLOOR_BYTES - 5000;

t("build-chain + oversize prompt, default -> WARN (not block; β: large-but-legit isn't blocked)", () => {
  const a = assessBuilderPrompt({ role: "backend-builder", promptBytes: big, isBuildChain: true, enforce: false });
  assert.strictEqual(a.level, "warn", JSON.stringify(a));
});

t("build-chain + oversize prompt + enforce -> BLOCK", () => {
  const a = assessBuilderPrompt({ role: "backend-builder", promptBytes: big, isBuildChain: true, enforce: true });
  assert.strictEqual(a.level, "block", JSON.stringify(a));
});

t("build-chain + right-sized prompt -> OK (no warn)", () => {
  const a = assessBuilderPrompt({ role: "frontend-builder", promptBytes: small, isBuildChain: true, enforce: true });
  assert.strictEqual(a.level, "ok", JSON.stringify(a));
});

t("prompt exactly at the floor -> OK (boundary, inclusive)", () => {
  const a = assessBuilderPrompt({ role: "builder", promptBytes: SIZE_FLOOR_BYTES, isBuildChain: true, enforce: true });
  assert.strictEqual(a.level, "ok", JSON.stringify(a));
});

t("NON-build-chain role + oversize prompt -> OK (a reviewer prompt is not a builder unit)", () => {
  const a = assessBuilderPrompt({ role: "backend-reviewer", promptBytes: big, isBuildChain: false, enforce: true });
  assert.strictEqual(a.level, "ok", JSON.stringify(a));
});

t("enforceEnabled: '1'/'true' -> true; unset/other -> false (warn-by-default)", () => {
  assert.strictEqual(enforceEnabled({ [ENFORCE_ENV]: "1" }), true);
  assert.strictEqual(enforceEnabled({ [ENFORCE_ENV]: "true" }), true);
  assert.strictEqual(enforceEnabled({}), false);
  assert.strictEqual(enforceEnabled({ [ENFORCE_ENV]: "0" }), false);
});

console.log("\n" + pass + "/" + (pass + fail) + " passed");
process.exit(fail ? 1 : 0);
