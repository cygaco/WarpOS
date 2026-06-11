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
 *   node scripts/checks/planning-principles.js [--json] [--include-plans]
 *       [--include-sprints] [--include-root] [--all] [--enforce] [--planning-dir <path>]
 *
 * Exit (default, report-only + fail-open): ALWAYS 0. Findings are printed, never blocking.
 *
 * --enforce (S-7, SP-20260611-002 R-7 / finding #17/#18/#19): the report-only ramp
 * grows a REAL enforce tail. The flow is the same scan, but the EXIT changes:
 *   - clean (0 gaps)                      -> exit 0
 *   - gaps present                        -> exit 1  (reportOnly was the only thing
 *                                            holding it at 0; --enforce flips it)
 *   - internal runner error during scan   -> exit 2  (FAIL-CLOSED — an internal error
 *                                            under --enforce can NEVER read as a clean
 *                                            ok:true/exit 0; that is exactly the #18
 *                                            false-green this ticket closes)
 * Without --enforce the historic report-only contract is unchanged: ALWAYS exit 0,
 * fail-open on any error. --enforce is proven-capable here but NOT wired into
 * /scan:full this sprint (AC-X.4 no report-only→blocking flip).
 */

const fs = require("fs");
const path = require("path");

const NAME = "planning-principles";

// ── The three principle-required sections (the machine-checkable subset of
//    _planning/principle.md). Each is matched case-insensitively against the doc
//    body; a doc that satisfies all three is well-formed. ───────────────────────
//
// AC-7.3 (close the loose-regex weakness, finding #17): a section is satisfied only
// when the principle term appears in a STRUCTURAL form — a markdown heading
// (`## Enforcer`), a bold/label run (`**Enforcer**`, `Enforcer:`), a list-item
// label (`- Enforcer:` / `- [x] **Proof**`), or a recognized verbed phrase
// (`enforced by`, `verified by`). BARE WORD PRESENCE in prose ("there is no
// enforcer", "this needs proof") does NOT satisfy the section — the term has to be
// LABELLING content, not merely occurring. The labelled-form matchers are built by
// `labelForm()` so the three sections share one definition of "a heading/label".
//
// `wordMatcher(term)` => RegExp that fires only when `term` is used as a section
// label/heading, not as an incidental word:
//   ^### Enforcer            heading (1-6 #), term leads the heading text
//   - [x] **Enforcer** …     list item with a bold/plain label
//   **Enforcer**             a bold run naming the section
//   Enforcer:                an inline label (term immediately followed by a colon)
// The leading anchor (start-of-line / `**` / `- ` / `[x] `) is what separates a
// LABEL from prose — "no enforcer" has no such anchor, so it no longer satisfies.
function labelForm(term) {
  // term may itself be a small alternation (e.g. "proof|acceptance").
  const t = `(?:${term})`;
  return new RegExp(
    // heading: line-start, 1-6 '#', optional list/number prefix, then the term
    String.raw`(?:^|\n)\s{0,3}#{1,6}\s+(?:[-*\d.)\s]*)?` + t + String.raw`\b` +
      "|" +
      // bold/label run: **Term** or __Term__ (optionally inside a list/checkbox item)
      String.raw`(?:\*\*|__)\s*` + t + String.raw`\b[^\n*_]*(?:\*\*|__)` +
      "|" +
      // inline label: line-start (optionally `- ` / `- [x] `) then Term immediately
      // followed by a ':' — "Enforcer:" / "- Proof:" — a labelling colon, not prose
      String.raw`(?:^|\n)\s{0,3}(?:[-*+]\s+(?:\[[ xX]\]\s+)?)?(?:\*\*|__)?` + t +
      String.raw`(?:\*\*|__)?\s*:`,
    "i",
  );
}

const REQUIRED_SECTIONS = [
  {
    key: "enforcer",
    label: "named enforcer (principle #7)",
    // a labelled Enforcer section/heading, OR the verbed phrase "enforced by".
    enforce: labelForm("enforcer"),
    test: (text) => labelForm("enforcer").test(text) || /\benforced\s+by\b/i.test(text),
  },
  {
    key: "proof",
    label: "proof / acceptance (principles #6/#15)",
    // a labelled Proof / Acceptance / Required-proof section, OR "verified by".
    test: (text) =>
      labelForm("proof|required[-\\s]?proof|acceptance(?:\\s+criteria)?").test(text) ||
      /\bverified[_\s-]?by\b/i.test(text),
  },
  {
    key: "blast-radius",
    label: "blast-radius assessment (principle #5)",
    // a labelled Blast-radius / Blast radius section (the term IS already
    // distinctive, but require the label form for parity with #17 hardening).
    test: (text) => labelForm("blast[-\\s]?radius").test(text),
  },
];

function parseArgs(argv) {
  const out = {
    json: false,
    includePlans: false,
    includeSprints: false,
    includeRoot: false,
    enforce: false,
    planningDir: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") out.json = true;
    else if (a === "--include-plans") out.includePlans = true;
    else if (a === "--include-sprints") out.includeSprints = true;
    else if (a === "--include-root") out.includeRoot = true;
    else if (a === "--enforce") out.enforce = true;
    else if (a === "--all") {
      // --all = the widest default scan scope (epics + plans + sprints + root
      // lifecycle plans), so a single flag closes finding #19 without naming each.
      out.includePlans = true;
      out.includeSprints = true;
      out.includeRoot = true;
    } else if (a === "--planning-dir") out.planningDir = String(argv[++i] || "");
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

// Collect TOP-LEVEL plan `.md` files directly under `dir` (NOT recursive — the
// epics/plans/sprints subtrees are scanned separately). Skips README.md, dotfiles,
// and any directory. Fail-open like collectPlanDocs. Used for AC-7.4 root-plan scope.
function collectRootPlanDocs(dir, notices) {
  const docs = [];
  let entries;
  try {
    if (!fs.existsSync(dir)) return docs;
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    notices.push(`could not read dir ${dir} (fail-open): ${String(e.message || e)}`);
    return docs;
  }
  for (const ent of entries) {
    let isFile = false;
    try {
      isFile = ent.isFile();
    } catch {
      continue;
    }
    if (!isFile) continue; // directories handled by the dedicated subtree scans
    if (ent.name === "README.md") continue; // dir contract, not a plan
    if (ent.name.startsWith(".")) continue;
    if (/\.md$/i.test(ent.name)) docs.push(path.join(dir, ent.name));
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
  //
  // AC-7.4 (finding #19): the historic default missed violations living OUTSIDE
  // _planning/epics — specifically _planning/sprints (sprint plan artifacts) and
  // ROOT lifecycle plans. --include-sprints / --include-root (or --all) extend the
  // scan scope so such a violation is now FOUND. The default stays epics-only so the
  // historic report-only behavior and the S-LC-08 fixtures do not change.
  const dirs = [path.join(planningDir, "epics")];
  if (opts.includePlans) dirs.push(path.join(planningDir, "plans"));
  if (opts.includeSprints) dirs.push(path.join(planningDir, "sprints"));

  let docs = [];
  for (const d of dirs) {
    result.scannedDirs.push(d);
    docs = docs.concat(collectPlanDocs(d, result.notices));
  }
  // ROOT lifecycle plans live directly under _planning/ (NOT recursing into the
  // epics/plans/sprints subtrees already scanned). Only the top-level plan `.md`s.
  if (opts.includeRoot) {
    result.scannedDirs.push(planningDir);
    docs = docs.concat(collectRootPlanDocs(planningDir, result.notices));
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
  // reportOnly defaults true (the scan result) unless the CLI set --enforce.
  const reportOnly = r.reportOnly !== false;
  const modeNote = reportOnly ? "report-only" : "ENFORCE (gaps exit non-zero)";
  const lines = [
    `/scan:${NAME} — ${r.counts.gaps ? "FINDINGS" : "OK"} (${modeNote}; plans must obey _planning/principle.md)`,
    "",
  ];
  lines.push(`  scanned: ${r.scannedDirs.length} dir(s), ${r.counts.docs} plan doc(s)`);
  if (r.counts.gaps === 0) {
    lines.push("  result:  every scanned plan names an enforcer, proof/acceptance, and a blast-radius");
  } else {
    lines.push(
      `  result:  ${r.counts.gaps} plan doc(s) OMIT a principle-required section (${reportOnly ? "REPORT-ONLY — not blocking" : "ENFORCE — blocking"}):`,
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
      includeSprints: args.includeSprints,
      includeRoot: args.includeRoot,
      planningDir: args.planningDir,
    });
  } catch (e) {
    // An internal runner error. The posture DIVERGES by mode:
    //   default (report-only)  -> FAIL-OPEN: exit 0 with a note (advisory plan-lint
    //                             must never break the scan/build — §8.11).
    //   --enforce              -> FAIL-CLOSED: exit 2 (AC-7.2). An internal error can
    //                             NEVER read as a clean ok:true/exit 0 under --enforce
    //                             — that is the #18 false-green this ticket closes.
    const msg = String((e && e.message) || e);
    if (args.enforce) {
      if (args.json) {
        process.stdout.write(
          JSON.stringify({ ok: false, check: NAME, reportOnly: false, enforce: true, failClosed: true, error: msg }) +
            "\n",
        );
      } else {
        process.stderr.write(`FAIL [${NAME}] internal error under --enforce — FAIL-CLOSED (exit 2): ${msg}\n`);
      }
      process.exit(2);
    }
    if (args.json) {
      process.stdout.write(
        JSON.stringify({ ok: true, check: NAME, reportOnly: true, note: `fail-open: ${msg}` }) + "\n",
      );
    } else {
      process.stdout.write(`OK   [${NAME}] fail-open — nothing scanned (${msg})\n`);
    }
    process.exit(0);
  }
  // reportOnly is true unless --enforce is set: this is what flips the exit at the
  // bottom while leaving the scan output identical.
  r.reportOnly = !args.enforce;
  r.enforce = Boolean(args.enforce);
  if (args.json) {
    process.stdout.write(JSON.stringify(r, null, 2) + "\n");
  } else {
    process.stdout.write(render(r) + "\n");
  }
  // AC-7.1: the REAL enforce flip. reportOnly || ok ? 0 : 1 — default stays exit 0
  // ALWAYS (reportOnly true); under --enforce a gap (ok:false) exits 1.
  process.exit(r.reportOnly || r.ok ? 0 : 1);
}
