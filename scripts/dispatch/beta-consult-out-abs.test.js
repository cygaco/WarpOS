#!/usr/bin/env node
"use strict";

/**
 * D3 (SP-20260718-003 / I-3) — beta-consult.js resolveOutPath honors ABSOLUTE --out.
 * The bug: `path.join(ROOT, outFile)` corrupts an absolute --out (Windows:
 * ROOT\C:\...\file). Fix resolves relative-to-ROOT only when the path is relative.
 *
 *   node scripts/dispatch/beta-consult-out-abs.test.js
 */

const path = require("path");
const assert = require("assert");
const { harness } = require("../checks/lib/fixture-harness");
const { resolveOutPath } = require("./beta-consult");

const h = harness("beta-consult-out-abs");
const ROOT = "C:\\Users\\Vlad\\Desktop\\Claude\\Projects\\WarpOS";

h.test("resolveOutPath honors an ABSOLUTE --out exactly (no ROOT prefix)", () => {
  const abs = path.join("C:\\", "tmp", "verdict.json");
  assert.strictEqual(resolveOutPath(abs, ROOT), abs, "absolute --out must be returned as-is (I-3)");
  // The bug's output (path.join(ROOT, abs)) must NOT equal the resolved path.
  assert.notStrictEqual(resolveOutPath(abs, ROOT), path.join(ROOT, abs), "must not ROOT-prefix an absolute path");
});

h.test("resolveOutPath resolves a RELATIVE --out under ROOT (backward-compat)", () => {
  const rel = path.join("runtime", "beta-consult", "v.json");
  assert.strictEqual(resolveOutPath(rel, ROOT), path.join(ROOT, rel), "relative --out resolves under ROOT");
});

// Teeth (β#4): the OLD path.join(ROOT, outFile) shape corrupts an absolute path.
h.violation("negative control: the old path.join(ROOT, abs) shape corrupts an absolute path", () => {
  const abs = path.join("C:\\", "tmp", "verdict.json");
  const buggy = path.join(ROOT, abs); // the pre-fix behavior
  // If the buggy join differs from the true absolute path, it is a corruption → caught.
  const corrupted = buggy !== abs ? [buggy] : [];
  return { violations: corrupted };
});

h.done();
