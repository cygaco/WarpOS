"use strict";
/**
 * no-legacy-gemini-cli.test.js — bite-test for the Gemini-CLI creep-back enforcer.
 *
 * Proves NO-NARROW and NO-WIDEN (not just a green count):
 *   - negative fixtures: EVERY forbidden `form` is caught (one trigger per form),
 *   - positive fixture: a KEPT gemini-model-via-agy config is NOT flagged,
 *   - live tree: scanTree() is clean (the gate actually passes on canonical).
 */
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { scanText, scanTree, FORBIDDEN } = require("./no-legacy-gemini-cli.js");

const FIX = path.resolve(__dirname, "..", "..", "runtime", "gemini-deepclean-fixtures");
const neg = fs.readFileSync(path.join(FIX, "negative-fixtures.txt"), "utf8");
const pos = fs.readFileSync(path.join(FIX, "positive-fixture.txt"), "utf8");

test("negative fixtures: EVERY forbidden form is caught (no-narrow)", () => {
  const vios = scanText(neg);
  assert.ok(vios.length > 0, "negative fixtures produced no violations at all");
  const caught = new Set(vios.map((v) => v.form));
  for (const f of FORBIDDEN) {
    assert.ok(
      caught.has(f.form),
      `form '${f.form}' (${f.desc}) was NOT caught — the enforcer NARROWED. Caught: ${[...caught].join(", ")}`,
    );
  }
});

test("positive fixture: gemini-model-via-agy config is NOT flagged (no-widen)", () => {
  const vios = scanText(pos);
  assert.equal(
    vios.length,
    0,
    `the KEPT gemini-model-via-agy fixture was wrongly flagged (enforcer WIDENED): ${JSON.stringify(vios, null, 2)}`,
  );
});

test("live canonical tree is clean — the gate passes", () => {
  const vios = scanTree();
  assert.equal(
    vios.length,
    0,
    `live tree carries legacy-gemini-CLI wiring:\n${vios.map((v) => `  ${v.file}:${v.line} [${v.form}] ${v.snippet}`).join("\n")}`,
  );
});
