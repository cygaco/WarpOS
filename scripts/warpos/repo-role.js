#!/usr/bin/env node
/**
 * scripts/warpos/repo-role.js — resolve the canonical-vs-consumer repo role.
 *
 * The SINGLE source of truth for "is this repo the WarpOS framework source
 * (canonical), a product install that consumes the framework (consumer), or
 * something unrecognisable (unknown)?" Every guard that gates on repo role MUST
 * call this instead of re-deriving heuristics inline. The invariant is enforced
 * by scripts/checks/repo-role-single-source.js (ED-009).
 *
 * Role tokens:
 *   'canonical'  — this repo IS the WarpOS framework source tree
 *   'consumer'   — a product install that consumes the framework
 *   'unknown'    — cannot determine (no signals; don't block, don't enforce)
 *
 * Precedence (first wins):
 *   (a) explicit override arg   resolveRepoRole({ override: 'canonical' })
 *   (b) env WARPOS_REPO_ROLE    WARPOS_REPO_ROLE=canonical node <script>
 *   (c) manifest/marker signals  — see CANONICAL_SIGNALS below
 *   (d) structural heuristic    version.json#name === "warpos"
 *   (e) consumer heuristic      .claude/framework-installed.json present but no canonical signal
 *   (f) 'unknown'               no signals at all
 *
 * WHY (a) MATTERS (LRN-2026-05-30): subagents and guards invoked in contexts
 * that cannot read env vars must be able to pass the role explicitly so the
 * orchestrator's resolved value threads through cleanly. This is the #1 reason
 * the resolver accepts an arg.
 *
 * Fail-safe: on any read/parse error fall through — do NOT spuriously return
 * 'canonical'. The "safer = strict" invariant: an ambiguous repo is treated as
 * non-canonical, keeping gates active.
 *
 * CLI:
 *   node scripts/warpos/repo-role.js           # print the resolved role
 *   node scripts/warpos/repo-role.js --json    # {role,source,canonical,consumer,roles}
 *
 * Exit 0 always (resolution is informational).
 */

"use strict";

const fs = require("fs");
const path = require("path");

// Resolved from this module's location so it works when required from any callsite.
const ROOT = path.resolve(__dirname, "..", "..");

const ROLES = Object.freeze(["canonical", "consumer", "unknown"]);

// repoRole values in .claude/manifest.json that mean "this IS the framework".
const CANONICAL_ROLE_VALUES = new Set(["canonical", "framework"]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeExists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function makeResult(role, source) {
  return {
    role,
    source,
    canonical: role === "canonical",
    consumer: role === "consumer",
  };
}

// ── Resolver ─────────────────────────────────────────────────────────────────

/**
 * resolveRepoRole(opts?) → { role, source, canonical, consumer }
 *
 * @param {object}  [opts]
 * @param {string}  [opts.override]  Explicit role string — wins over EVERYTHING
 *                                   including env. Pass when the caller has already
 *                                   resolved the role and wants to thread it through.
 * @param {string}  [opts.root]      Directory to probe for role signals.
 *                                   Default: the repo root resolved from this module's
 *                                   own __dirname (scripts/warpos/../.. = project root).
 * @param {string}  [opts.cwd]       Alias for opts.root (backward-compat shim).
 * @returns {{ role: string, source: string, canonical: boolean, consumer: boolean }}
 */
function resolveRepoRole(opts) {
  const overrideArg = opts && typeof opts.override === "string" ? opts.override.trim() : "";
  const root = opts && (opts.root || opts.cwd)
    ? path.resolve(opts.root || opts.cwd)
    : ROOT;

  // ── (a) Explicit override arg ────────────────────────────────────────────
  // Wins unconditionally — subagents pass this when env is unavailable.
  if (overrideArg) {
    return makeResult(overrideArg.toLowerCase(), "arg:override");
  }

  // ── (b) Env override ─────────────────────────────────────────────────────
  const envVal = (process.env.WARPOS_REPO_ROLE || "").trim();
  if (envVal) {
    return makeResult(envVal.toLowerCase(), "env:WARPOS_REPO_ROLE");
  }

  // ── (c) Manifest / marker signals ────────────────────────────────────────
  // Canonical if ANY positive signal is present. Fail-safe: read/parse errors
  // fall through so a corrupt file never causes a false-canonical verdict.

  // Signal 1: _warpos/MANIFEST.json — the strongest canonical marker.
  // Only the canonical source tree ships this; consumer installs receive a
  // product-side copy with a different shape. Presence alone is sufficient.
  if (safeExists(path.join(root, "_warpos", "MANIFEST.json"))) {
    return makeResult("canonical", "marker:_warpos/MANIFEST.json");
  }

  // Signal 2: .warpos-canonical explicit marker file.
  // Written by maintainers in mid-build trees where _warpos/ isn't yet present.
  if (safeExists(path.join(root, ".warpos-canonical"))) {
    return makeResult("canonical", "marker:.warpos-canonical");
  }

  // Signal 3: .claude/manifest.json — three fields can signal canonical.
  try {
    const mfp = path.join(root, ".claude", "manifest.json");
    if (fs.existsSync(mfp)) {
      // Strip BOM (this repo ships BOM'd JSON — mirror testsuite/role.js).
      const m = JSON.parse(fs.readFileSync(mfp, "utf8").replace(/^﻿/, ""));
      if (m) {
        // Field 3a: explicit repoRole field.
        if (typeof m.repoRole === "string" && CANONICAL_ROLE_VALUES.has(m.repoRole)) {
          return makeResult("canonical", "manifest.json#repoRole");
        }
        // Field 3b: warpos.repoRole (nested variant).
        if (m.warpos && typeof m.warpos.repoRole === "string" && CANONICAL_ROLE_VALUES.has(m.warpos.repoRole)) {
          return makeResult("canonical", "manifest.json#warpos.repoRole");
        }
        // Field 3c: warpos.source === "self" (the canonical dev repo self-identifies).
        if (m.warpos && m.warpos.source === "self") {
          return makeResult("canonical", "manifest.json#warpos.source");
        }
        // Field 3d: project.slug === "warpos".
        if (m.project && m.project.slug === "warpos") {
          return makeResult("canonical", "manifest.json#project.slug");
        }
      }
    }
  } catch {
    /* read/parse error — fall through; safer = not canonical */
  }

  // ── (d) Structural heuristic ─────────────────────────────────────────────
  // version.json#name === "warpos" — backup for trees mid-build before manifest
  // is fully written.
  try {
    const vjp = path.join(root, "version.json");
    if (fs.existsSync(vjp)) {
      const v = JSON.parse(fs.readFileSync(vjp, "utf8"));
      if (v && v.name === "warpos") {
        return makeResult("canonical", "version.json#name");
      }
    }
  } catch {
    /* fall through */
  }

  // ── (e) Consumer heuristic ───────────────────────────────────────────────
  // A repo with .claude/framework-installed.json but NONE of the canonical
  // signals above is a consumer install.
  if (safeExists(path.join(root, ".claude", "framework-installed.json"))) {
    return makeResult("consumer", "heuristic:framework-installed.json");
  }

  // ── (f) Unknown ──────────────────────────────────────────────────────────
  return makeResult("unknown", "none");
}

// ── CLI entry ─────────────────────────────────────────────────────────────────

if (require.main === module) {
  const json = process.argv.includes("--json");
  const r = resolveRepoRole();
  if (json) {
    process.stdout.write(JSON.stringify({ ...r, roles: ROLES }) + "\n");
  } else {
    process.stdout.write(`${r.role}\n`);
  }
  process.exit(0); // always 0 — resolution is informational
}

module.exports = { resolveRepoRole, ROLES };
