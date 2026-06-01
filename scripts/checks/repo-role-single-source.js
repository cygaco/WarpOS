#!/usr/bin/env node
/**
 * scripts/checks/repo-role-single-source.js — ED-009 invariant enforcer.
 *
 * Policy: ALL canonical-vs-consumer role derivation MUST flow through
 * scripts/warpos/repo-role.js. No guard or script may re-derive the repo role
 * by reading canonical signals inline (e.g. checking _warpos/MANIFEST.json
 * existence, .warpos-canonical, manifest.json#warpos.source, etc.).
 *
 * This script greps for known inline role-derivation idioms across the scripts/
 * directory tree and exits non-zero if any appear OUTSIDE the resolver itself.
 *
 * Usage:
 *   node scripts/checks/repo-role-single-source.js         # human report
 *   node scripts/checks/repo-role-single-source.js --json  # machine-readable
 *
 * Exit codes:
 *   0 — clean (no inline derivation found outside the resolver)
 *   1 — violations: one or more files re-derive role independently
 *   2 — tool/scan error
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const SCRIPTS_DIR = path.join(ROOT, "scripts");

// ── Allowlist ──────────────────────────────────────────────────────────────
// Files allowed to reference canonical-detection patterns (the resolver + its
// own test file). Relative to SCRIPTS_DIR.
const ALLOWLIST = new Set([
  path.join(SCRIPTS_DIR, "warpos", "repo-role.js"),
  path.join(SCRIPTS_DIR, "warpos", "test-repo-role.js"),
  path.join(SCRIPTS_DIR, "checks", "repo-role-single-source.js"), // self
]);

// ── Patterns that constitute "inline role derivation" ─────────────────────
// Each entry: { name, regex } — the regex is matched against each line.
// Only patterns that are UNAMBIGUOUSLY role-detection are listed (not broad
// substring matches that appear in legitimate non-role contexts).
const PATTERNS = [
  {
    name: "warpos_canonical_marker",
    // existsSync check for the .warpos-canonical marker file — exclusively a role signal.
    regex: /['".]warpos-canonical['"]/,
    description: "'.warpos-canonical' marker check — role derivation only belongs in repo-role.js",
  },
  {
    name: "warpos_source_self",
    // m.warpos.source === "self" or similar — specific canonical-dev-repo signal.
    regex: /warpos[.\[].*source.*===.*['"]self['"]|['"]self['"].*===.*warpos[.\[].*source/,
    description: "warpos.source === \"self\" role check — use resolveRepoRole() instead",
  },
  {
    name: "project_slug_warpos",
    // m.project.slug === "warpos" — specific canonical role signal.
    regex: /project[.\[].*slug.*===.*['"]warpos['"]|['"]warpos['"].*===.*project[.\[].*slug/,
    description: "project.slug === \"warpos\" role check — use resolveRepoRole() instead",
  },
];

// ── File walker ────────────────────────────────────────────────────────────

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // Skip node_modules and hidden dirs.
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      walk(full, out);
    } else if (e.isFile() && e.name.endsWith(".js")) {
      out.push(full);
    }
  }
}

// ── Scan ──────────────────────────────────────────────────────────────────

function scan() {
  const files = [];
  walk(SCRIPTS_DIR, files);

  const violations = [];

  for (const file of files) {
    if (ALLOWLIST.has(file)) continue;

    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }

    const lines = content.split(/\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pat of PATTERNS) {
        if (pat.regex.test(line)) {
          violations.push({
            file: path.relative(ROOT, file),
            line: i + 1,
            pattern: pat.name,
            description: pat.description,
            text: line.trim().slice(0, 120),
          });
        }
      }
    }
  }

  return violations;
}

// ── Main ──────────────────────────────────────────────────────────────────

function main() {
  const json = process.argv.includes("--json");

  let violations;
  try {
    violations = scan();
  } catch (e) {
    if (json) {
      process.stdout.write(JSON.stringify({ ok: false, error: e.message, violations: [] }) + "\n");
    } else {
      process.stderr.write(`repo-role-single-source: scan error — ${e.message}\n`);
    }
    process.exit(2);
  }

  const ok = violations.length === 0;

  if (json) {
    process.stdout.write(
      JSON.stringify({
        ok,
        policy: "All repo-role derivation must flow through scripts/warpos/repo-role.js (ED-009)",
        resolver: "scripts/warpos/repo-role.js",
        violationCount: violations.length,
        violations,
      }, null, 2) + "\n",
    );
  } else {
    if (ok) {
      process.stdout.write(
        "repo-role-single-source: OK — no inline role derivation found outside scripts/warpos/repo-role.js\n",
      );
    } else {
      process.stderr.write(
        [
          `repo-role-single-source: FAIL — ${violations.length} inline role-derivation(s) found.`,
          "Policy (ED-009): all canonical-vs-consumer detection must flow through",
          "  scripts/warpos/repo-role.js  (use resolveRepoRole())",
          "",
          ...violations.map(
            (v) =>
              `  ${v.file}:${v.line}  [${v.pattern}]\n    ${v.text}`,
          ),
          "",
          "Fix: replace the inline check with:",
          "  const { resolveRepoRole } = require('<rel>/warpos/repo-role');",
          "  const isCanonical = resolveRepoRole({ root: <your-root> }).role === 'canonical';",
          "",
        ].join("\n"),
      );
    }
  }

  process.exit(ok ? 0 : 1);
}

main();
