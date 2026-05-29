#!/usr/bin/env node
/**
 * scripts/testsuite/role.js — repo-role stub (INTERIM, 0.17.0).
 *
 * Answers one question: is THIS repo the canonical/framework source, or a
 * product install that consumes the framework? The test-suite enforcer
 * (enforce.js) and the regression_seed release gate use this to decide whether
 * the regression-seed suite is mandatory (canonical/framework) or opt-in
 * (product, where consumer-only detectors would falsely fail).
 *
 * INTERIM: this reads `.claude/manifest.json#repoRole` directly. It is a stand-in
 * for the still-open *shared repo-role resolver* (0.17.0 open item) — a single
 * source of truth that role.js, run.js, and enforce.js would all consume instead
 * of each reading the manifest ad-hoc. That gap is tracked in
 * paths.enforcementDebt (ED-009). Replace this module's body when the resolver
 * lands; keep the isCanonical()/roleLabel() surface stable so callers don't move.
 *
 *   node scripts/testsuite/role.js   # prints { canonical: <bool>, role: <label> } as JSON
 *
 * isCanonical() never throws — a missing/unreadable/malformed manifest is
 * treated as "product" (false), the safe default (enforce.js no-ops in products).
 */
const fs = require("fs");
const path = require("path");

const MANIFEST = path.resolve(__dirname, "..", "..", ".claude", "manifest.json");

// repoRole values that mean "this repo is the source of the framework".
const CANONICAL_ROLES = new Set(["canonical", "framework"]);

// Read repoRole from the manifest, checking top-level first then warpos.repoRole.
// BOM-tolerant (this repo has BOM'd JSON; mirror run.js's `.replace(/^﻿/,"")`).
// Returns the raw role string, or null when missing/unreadable/malformed.
function readRole() {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8").replace(/^﻿/, ""));
  } catch {
    return null;
  }
  if (manifest && typeof manifest.repoRole === "string") return manifest.repoRole;
  if (manifest && manifest.warpos && typeof manifest.warpos.repoRole === "string") {
    return manifest.warpos.repoRole;
  }
  return null;
}

// true iff repoRole resolves to a canonical/framework role. Missing → false.
function isCanonical() {
  return CANONICAL_ROLES.has(readRole());
}

// The resolved repoRole value, or "product" when missing/unreadable.
function roleLabel() {
  return readRole() || "product";
}

if (require.main === module) {
  process.stdout.write(JSON.stringify({ canonical: isCanonical(), role: roleLabel() }) + "\n");
}

module.exports = { isCanonical, roleLabel };
