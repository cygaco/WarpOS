#!/usr/bin/env node
/**
 * scripts/testsuite/role.js — repo-role bridge for the test-suite enforcer.
 *
 * Thin shim over the shared repo-role resolver (scripts/warpos/repo-role.js).
 * This replaces the interim stub (0.17.0 ED-009 open item) per its own comment:
 * "Replace this module's body when the resolver lands; keep the isCanonical()/
 * roleLabel() surface stable so callers don't move."
 *
 * Surface (unchanged — callers enforce.js, run.js, release-gates.js still work):
 *   isCanonical()  → boolean   true iff this repo is the canonical framework source
 *   roleLabel()    → string    resolved role, or "product" when missing/unknown
 *   roleStatus()   → object    { manifestExists, manifestReadable, role, canonical }
 *
 *   node scripts/testsuite/role.js   # prints { canonical, role, status } as JSON
 *
 * isCanonical() never throws — fail-safe to false (product) on any error, same
 * as the interim stub. roleStatus().canonical distinguishes a genuine product repo
 * from a corrupt/unreadable manifest (for gates that need the distinction).
 */
const path = require("path");
const { resolveRepoRole } = require("../warpos/repo-role");

// Root of this repo, same anchor the old stub used.
const ROOT = path.resolve(__dirname, "..", "..");

// true iff this repo resolves to the canonical framework role.
// Never throws — resolver is fail-safe (unknown/consumer on any error).
function isCanonical() {
  try {
    return resolveRepoRole({ root: ROOT }).role === "canonical";
  } catch {
    return false;
  }
}

// The resolved role label. Falls back to "product" (not "unknown") to preserve
// backward-compat with callers that use this as a display string for consumer repos.
function roleLabel() {
  try {
    const r = resolveRepoRole({ root: ROOT });
    return r.role === "unknown" ? "product" : r.role;
  } catch {
    return "product";
  }
}

// Extended status object for release-gate callers that need to distinguish a
// genuine product repo from an unreadable manifest (qa W5 invariant).
function roleStatus() {
  const fs = require("fs");
  const MANIFEST = path.join(ROOT, ".claude", "manifest.json");
  const exists = fs.existsSync(MANIFEST);
  let readable = false;
  let role = null;
  if (exists) {
    try {
      JSON.parse(fs.readFileSync(MANIFEST, "utf8").replace(/^﻿/, ""));
      readable = true;
    } catch {
      readable = false;
    }
  }
  // Role resolution is always from the full resolver (not manifest-only), so
  // "canonical via version.json" still works even when manifest is unreadable.
  let resolvedRole = null;
  try {
    resolvedRole = resolveRepoRole({ root: ROOT }).role;
  } catch {
    resolvedRole = null;
  }
  return {
    manifestExists: exists,
    manifestReadable: readable,
    role: resolvedRole,
    canonical: resolvedRole === "canonical",
  };
}

if (require.main === module) {
  process.stdout.write(JSON.stringify({ canonical: isCanonical(), role: roleLabel(), status: roleStatus() }) + "\n");
}

module.exports = { isCanonical, roleLabel, roleStatus };
