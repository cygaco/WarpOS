#!/usr/bin/env node
/* eslint-disable no-console */
"use strict";

/**
 * scripts/checks/planning-principles.js — the named enforcer for
 * E-LIFECYCLE-001 §8.11 (S-LC-08). The planning principles (`_planning/principle.md`)
 * say every plan must name an ENFORCER per policy (#7), state its PROOF / acceptance
 * (#6/#15), and assess its BLAST RADIUS (#5). This scan makes a plan that OMITS any
 * of those three self-detecting.
 *
 * WHAT IT DOES: walks the lifecycle-store epic plan artifacts (`_planning/epics/**`,
 * optionally `_planning/plans/**` with --include-plans), and for each plan `.md`
 * (README.md excluded — that's the dir contract, not a plan) checks the body for the
 * three principle-required sections. A doc missing one or more → a FINDING naming the
 * file + which sections are absent.
 *
 * RAMP: REPORT-ONLY this sprint (§8.11 "report-only first"). It prints gaps and ALWAYS
 * exits 0 — it does NOT block /scan:full. FAIL-OPEN: a missing planning dir, an
 * unreadable file, or any internal error degrades to a clean exit 0 with a note; an
 * advisory plan-lint must never break the scan or the build. (A deliberate departure
 * from the fail-CLOSED posture of the blocking enforcers — it matches the brief.)
 *
 * Mirrors the envelope/--json shape of scripts/checks/coverage-gate-scan.js +
 * scripts/checks/turbo-spend.js (the other report-only / fail-open scans).
 *
 *   node scripts/checks/planning-principles.js [--json] [--include-plans] [--planning-dir <path>]
 *
 * Exit: ALWAYS 0 (report-only + fail-open). Findings are printed, never blocking.
 */

const fs = require("fs");
const path = require("path");

const NAME = "planning-principles";

// ── The three principle-required sections (the machine-checkable subset of
//    _planning/principle.md). Each is matched case-insensitively against the doc
//    body; a doc that satisfies all three is well-formed. ───────────────────────
const REQUIRED_SECTIONS = [
  {
    key: "enforcer",
    label: "named enforcer (principle #7)",
    // "## Enforcer", "named enforcer", "enforced by", "enforcer:"
    test: (text) => /\benforcer\b/i.test(text) || /\benforced\s+by\b/i.test(text),
  },
  {
    key: "proof",
    label: "proof / acceptance (principles #6/#15)",
    // "proof", "required-proof", "acceptance [criteria]", "verified by"
    test: (text) =>
      /\bproof\b/i.test(text) ||
      /required[-\s]proof/i.test(text) ||
      /\bacceptance\b/i.test(text) ||
      /\bverified[_\s-]?by\b/i.test(text),
  },
  {
    key: "blast-radius",
    label: "blast-radius assessment (principle #5)",
    test: (text) => /blast[-\s]?radius/i.test(text),
  },
];

function parseArgs(argv) {
  const out = { json: false, includePlans: false, planningDir: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") out.json = true;
    else if (a === "--include-plans") out.includePlans = true;
    else if (a === "--planning-dir") out.planningDir = String(argv[++i] || "");
  }
  return out;
}

// Recursively collect plan `.md` files under `dir`, skipping README.md (the dir
// contract) and dotfiles. Fail-open: a missing dir yields []; an unreadable entry
// is skipped (recorded as a notice by the caller).
function collectPlanDocs(dir, notices) {
  const docs = [];
  let entries;
  try {
    if (!fs.existsSync(dir)) return docs; // missing dir → nothing to scan
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    notices.push(`could not read dir ${dir} (fail-open): ${String(e.message || e)}`);
    return docs;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    let isDir = false;
    let isFile = false;
    try {
      isDir = ent.isDirectory();
      isFile = ent.isFile();
    } catch {
      continue;
    }
    if (isDir) {
      docs.push(...collectPlanDocs(full, notices));
    } else if (isFile) {
      if (ent.name === "README.md") continue; // dir contract, not a plan
      if (ent.name.startsWith(".")) continue; // .gitkeep etc.
      if (/\.md$/i.test(ent.name)) docs.push(full);
    }
  }
  return docs;
}

/**
 * Scan the planning lifecycle store for principle-omitting plan docs.
 * Pure given the filesystem. Returns:
 *   { ok, check, reportOnly, scannedDirs[], counts:{docs,gaps}, findings:[{file,missing[]}], notices[] }
 * ok = true when there are zero gaps. (Exit is ALWAYS 0 regardless — report-only.)
 */
function scanPlanningPrinciples(opts = {}) {
  const root = opts.root || process.cwd();
  const planningDir = opts.planningDir
    ? path.resolve(opts.planningDir)
    : path.join(root, "_planning");

  const result = {
    check: NAME,
    reportOnly: true,
    scannedDirs: [],
    counts: { docs: 0, gaps: 0 },
    findings: [],
    notices: [],
  };

  // Default scan = epics/ only (the lifecycle-store epic plans). plans/ is the
  // separate org/GTM expansion corpus — opt-in via --include-plans.
  const dirs = [path.join(planningDir, "epics")];
  if (opts.includePlans) dirs.push(path.join(planningDir, "plans"));

  let docs = [];
  for (const d of dirs) {
    result.scannedDirs.push(d);
    docs = docs.concat(collectPlanDocs(d, result.notices));
  }
  result.counts.docs = docs.length;

  for (const file of docs) {
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch (e) {
      // Unreadable plan doc → fail-open: skip with a notice, do not flag/throw.
      result.notices.push(`could not read ${file} (fail-open): ${String(e.message || e)}`);
      continue;
    }
    const missing = REQUIRED_SECTIONS.filter((s) => {
      try {
        return !s.test(text);
      } catch {
        return false; // a regex fault must not flag a doc — fail-open
      }
    }).map((s) => s.label);
    if (missing.length) {
      result.findings.push({ file, missing });
    }
  }

  result.counts.gaps = result.findings.length;
  result.ok = result.counts.gaps === 0;
  return result;
}

function render(r) {
  const lines = [
    `/scan:${NAME} — ${r.counts.gaps ? "FINDINGS" : "OK"} (report-only; plans must obey _planning/principle.md)`,
    "",
  ];
  lines.push(`  scanned: ${r.scannedDirs.length} dir(s), ${r.counts.docs} plan doc(s)`);
  if (r.counts.gaps === 0) {
    lines.push("  result:  every scanned plan names an enforcer, proof/acceptance, and a blast-radius");
  } else {
    lines.push(
      `  result:  ${r.counts.gaps} plan doc(s) OMIT a principle-required section (REPORT-ONLY — not blocking):`,
    );
    for (const f of r.findings) {
      lines.push(`    ! ${f.file}`);
      lines.push(`        missing: ${f.missing.join("; ")}`);
    }
  }
  if (r.notices.length) {
    lines.push("", "  notices:");
    for (const n of r.notices) lines.push(`    - ${n}`);
  }
  return lines.join("\n");
}

module.exports = { scanPlanningPrinciples, render, parseArgs, REQUIRED_SECTIONS };

// ── CLI ──────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  let r;
  try {
    r = scanPlanningPrinciples({
      includePlans: args.includePlans,
      planningDir: args.planningDir,
    });
  } catch (e) {
    // Ultimate fail-open: never crash the scan harness. Report-only ⇒ exit 0.
    const msg = String((e && e.message) || e);
    if (args.json) {
      process.stdout.write(
        JSON.stringify({ ok: true, check: NAME, reportOnly: true, note: `fail-open: ${msg}` }) + "\n",
      );
    } else {
      process.stdout.write(`OK   [${NAME}] fail-open — nothing scanned (${msg})\n`);
    }
    process.exit(0);
  }
  if (args.json) {
    process.stdout.write(JSON.stringify(r, null, 2) + "\n");
  } else {
    process.stdout.write(render(r) + "\n");
  }
  // REPORT-ONLY: ALWAYS exit 0. Gaps are surfaced, never blocking (§8.11).
  process.exit(0);
}
