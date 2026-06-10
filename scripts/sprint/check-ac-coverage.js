#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * scripts/sprint/check-ac-coverage.js
 *
 * Read-only audit skill (/scan:ac-coverage). Scans active sprints + their
 * acceptance-criteria.md files and reports per-AC linkage state:
 *   - executable: has a real `verified_by: <file>::<name>` line
 *   - not_applicable: has `verified_by: not_applicable — <justification>`
 *   - missing: AC line not followed by any verified_by: linkage
 *
 * Diagnostic only — never modifies tracker state. Per Beta Q1 (PC-20260518-0011):
 * empty justification = same as missing.
 *
 * Usage:
 *   node scripts/sprint/check-ac-coverage.js                # prose, current primary sprint
 *   node scripts/sprint/check-ac-coverage.js --sprint <id>  # target specific sprint
 *   node scripts/sprint/check-ac-coverage.js --json         # machine output
 *
 * Exit codes:
 *   0  all ACs linked (executable or not_applicable) OR no goal_verification
 *      contract on the sprint (gate not applicable)
 *   1  one or more ACs missing linkage
 *   2  usage error
 */

"use strict";

const fs = require("fs");
const path = require("path");
const SPRINT = require("./paths");
const { readYamlMaybe } = require("./fs");
const { AC_CATEGORIES } = require("./ac-categories");

function parseArgs(argv) {
  const out = {
    sprint: null,
    json: false,
    help: false,
    categories: false,
    file: null,
    enforce: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--sprint") out.sprint = argv[++i];
    else if (a === "--json") out.json = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--categories") out.categories = true;
    else if (a === "--file") out.file = argv[++i];
    else if (a === "--enforce") out.enforce = true;
  }
  return out;
}

const HELP = `check-ac-coverage — read-only audit of AC coverage on two axes.

Axis 1 (default) — per-AC verified_by: linkage:
  node scripts/sprint/check-ac-coverage.js [--sprint <SP-id>] [--json]

Axis 2 (--categories) — the 20 enforcement-criteria categories (S-LC-11, PLAN §11):
  node scripts/sprint/check-ac-coverage.js --categories [--sprint <SP-id>] [--json]
  node scripts/sprint/check-ac-coverage.js --categories --file <plan|epic|AC artifact>
    Report-only ramp: a plan missing categories is FLAGGED (exit 0), NOT blocked.
    --enforce   exit non-zero when a category is uncovered (off by default).
    Fail-open: an unreadable/absent artifact reports nothing and exits 0 clean.
    Single source for the category list: scripts/sprint/ac-categories.js.

Exit: 0 = clean OR no goal_verification gate OR report-only categories,
      1 = missing linkage (axis 1) / uncovered category under --enforce (axis 2),
      2 = usage error.
`;

const placeholderRegex = /\{\{|<test-file>|<test-name>/;
const acRegex = /\bAC-\d+(?:\.\d+)+\b/;

// Shared classifier for the text after a `verified_by:` token. Used by BOTH the
// per-AC linkage audit (analyzeFile) AND the 20-category proof detection
// (chunkHasProof) — single parser, no fork. Returns { state, evidence } where
// state ∈ { executable, not_applicable, missing }.
function classifyVerifiedByRest(rest) {
  if (/^not_applicable\b/i.test(rest)) {
    const justMatch = rest.match(/^not_applicable\s*(?:—|--|-)?\s*(.*)$/i);
    const j2 = justMatch ? justMatch[1].trim() : "";
    if (!j2) {
      return { state: "missing", evidence: "not_applicable-empty-justification" };
    }
    return { state: "not_applicable", evidence: j2 };
  }
  if (/^\S+::\S+/.test(rest)) {
    return { state: "executable", evidence: rest };
  }
  return { state: "missing", evidence: `unrecognized: ${rest}` };
}

function analyzeFile(acMarkdown) {
  const lines = acMarkdown.split(/\r?\n/);
  const details = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(acRegex);
    if (!m) continue;
    let state = "missing";
    let evidence = null;
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const cand = lines[j];
      if (/^\s*$/.test(cand)) continue;
      if (acRegex.test(cand)) break;
      const linkMatch = cand.match(/verified_by\s*:\s*(.+?)\s*$/i);
      if (!linkMatch) continue;
      const rest = linkMatch[1];
      if (placeholderRegex.test(cand)) {
        state = "missing";
        evidence = "placeholder";
        break;
      }
      const c = classifyVerifiedByRest(rest);
      state = c.state;
      evidence = c.evidence;
      break;
    }
    details.push({
      ac: m[0],
      line: i + 1,
      state,
      evidence,
    });
  }
  return details;
}

// ── Axis 2: the 20 enforcement-criteria categories (S-LC-11, PLAN §11) ────────
// A different axis from the Given/When/Then AC linkage above: "does this AC
// artifact carry AC for ALL 20 categories, each with a proof?" Report-only.

const proofPlaceholderRegex = /\{\{|<test-file>|<test-name>|<proof>|<fill/i;

function normalizeLine(s) {
  return String(s).toLowerCase().replace(/\s+/g, " ").trim();
}

// A proof value is a STUB (named but unproven) if empty, a placeholder, or a
// "to-do" marker. Anchored leading-word match catches `TODO: write fixture`.
function isStubProof(v) {
  if (!v) return true;
  if (proofPlaceholderRegex.test(v)) return true;
  if (
    /^(todo|tbd|t\.?b\.?d\.?|pending|fixme|wip|n\/a|na|xxx|\.\.\.|placeholder|stub|none|fill[\s-]?me|fill in)\b/i.test(
      v,
    )
  ) {
    return true;
  }
  return false;
}

// Does this window of text carry a real proof for the category named in it?
// Reuses classifyVerifiedByRest so verified_by linkage is recognized identically
// to axis 1; also accepts a non-stub `proof:` / `proven by` clause.
function chunkHasProof(chunk) {
  const vb = chunk.match(/verified_by\s*:\s*([^\n]+)/i);
  if (vb) {
    const rest = vb[1].trim();
    if (!proofPlaceholderRegex.test(rest) && !placeholderRegex.test(rest)) {
      const c = classifyVerifiedByRest(rest);
      if (c.state === "executable" || c.state === "not_applicable") return true;
    }
  }
  // Require a `proof:` label (with colon) so the literal word "proof" inside a
  // category name (e.g. "correct completion proof") never reads as a proof; the
  // `proven by` form is matched separately.
  let pm = chunk.match(/\bproof\s*:\s*([^\n]+)/i);
  if (!pm) pm = chunk.match(/\bproven by\b\s*[:\-—]*\s*([^\n]+)/i);
  if (pm) {
    const v = pm[1].trim().replace(/[*_`]+\s*$/, "").trim();
    if (v && !isStubProof(v)) return true;
  }
  return false;
}

/**
 * Check 20-category coverage of an AC artifact's markdown. A category is
 * `covered` when the artifact NAMES it AND a proof/verified_by sits in its
 * window; `named_no_proof` when named but unproven (a bare stub); `missing` when
 * not named at all. PURE (no fs). Returns a harness-friendly shape: `ok` /
 * `findings` mirror `complete` / `uncovered` so fixture-harness reads it.
 */
function checkCategoryCoverage(acMarkdown, categories = AC_CATEGORIES) {
  const text = typeof acMarkdown === "string" ? acMarkdown : "";
  const lines = text.split(/\r?\n/);
  const norm = lines.map(normalizeLine);
  const normCats = categories.map((c) => normalizeLine(c));

  const details = categories.map((cat, ci) => {
    const ncat = normCats[ci];
    let nameLine = -1;
    for (let i = 0; i < norm.length; i++) {
      if (norm[i].includes(ncat)) {
        nameLine = i;
        break;
      }
    }
    if (nameLine === -1) {
      return { category: cat, state: "missing", line: null };
    }
    // Build a small window: the naming line + following lines, stopping at a
    // heading or a line that names a DIFFERENT category.
    const windowLines = [lines[nameLine]];
    for (let j = nameLine + 1; j < Math.min(nameLine + 5, lines.length); j++) {
      if (/^\s*#{1,6}\s/.test(lines[j])) break;
      const namesOther = normCats.some(
        (other, oi) => oi !== ci && norm[j].includes(other),
      );
      if (namesOther) break;
      windowLines.push(lines[j]);
    }
    const proven = chunkHasProof(windowLines.join("\n"));
    return {
      category: cat,
      state: proven ? "covered" : "named_no_proof",
      line: nameLine + 1,
    };
  });

  const missing = details.filter((d) => d.state === "missing").map((d) => d.category);
  const namedNoProof = details
    .filter((d) => d.state === "named_no_proof")
    .map((d) => d.category);
  const covered = details.filter((d) => d.state === "covered");
  const uncovered = details.filter((d) => d.state !== "covered").map((d) => d.category);

  return {
    total: categories.length,
    covered: covered.length,
    missing,
    named_no_proof: namedNoProof,
    uncovered,
    // harness-friendly aliases (empty findings + ok:true == a pass)
    findings: uncovered,
    ok: uncovered.length === 0,
    complete: uncovered.length === 0,
    details,
  };
}

// Resolve a sprint's acceptance-criteria.md absolute path (or null). Fail-open.
function resolveAcPath(sprintId) {
  try {
    const per =
      typeof SPRINT.forSprint === "function" ? SPRINT.forSprint(sprintId) : null;
    if (!per || !per.current || !fs.existsSync(per.current)) return null;
    const current = readYamlMaybe(per.current);
    if (!current) return null;
    const acRel =
      current.requirements && current.requirements.acceptance_criteria;
    if (!acRel) return null;
    return path.resolve(SPRINT.PROJECT, acRel);
  } catch {
    return null;
  }
}

function categoryTargets(args) {
  if (args.file) {
    return [{ label: args.file, path: path.resolve(SPRINT.PROJECT, args.file) }];
  }
  const ids = args.sprint
    ? [args.sprint]
    : activeSprintIds().length
      ? activeSprintIds()
      : [SPRINT.active && SPRINT.active()].filter(Boolean);
  const targets = [];
  for (const id of ids) {
    const acPath = resolveAcPath(id);
    if (acPath && fs.existsSync(acPath)) targets.push({ label: id, path: acPath });
  }
  return targets;
}

function renderCategoryProse(r) {
  if (r.error) {
    return `ac-coverage (categories) — ${r.label}: SKIP (${r.error}; fail-open)`;
  }
  const lines = [];
  lines.push(
    `ac-coverage (categories) — ${r.label}: ${r.covered}/${r.total} covered, ${r.missing.length} missing, ${r.named_no_proof.length} named-but-unproven`,
  );
  if (r.uncovered.length) {
    lines.push(
      `  FLAGGED (report-only) — ${r.uncovered.length} category(ies) need AC + proof:`,
    );
    for (const cat of r.missing) {
      lines.push(`    - ${cat} (not named in the artifact)`);
    }
    for (const cat of r.named_no_proof) {
      lines.push(`    - ${cat} (named, but no proof/verified_by)`);
    }
  }
  return lines.join("\n");
}

function runCategoryMode(args) {
  const targets = categoryTargets(args);
  const reports = targets.map((t) => {
    let md;
    try {
      md = fs.readFileSync(t.path, "utf8");
    } catch {
      return {
        label: t.label,
        error: "unreadable",
        ok: true,
        total: AC_CATEGORIES.length,
        covered: 0,
        missing: [],
        named_no_proof: [],
        uncovered: [],
      };
    }
    return { label: t.label, ...checkCategoryCoverage(md) };
  });

  if (args.json) {
    process.stdout.write(JSON.stringify(reports, null, 2) + "\n");
  } else {
    if (!reports.length) {
      process.stdout.write(
        "ac-coverage (categories) — no AC artifact to audit (fail-open, exit 0)\n",
      );
    }
    for (const r of reports) process.stdout.write(renderCategoryProse(r) + "\n");
    process.stdout.write(
      `\nmode: report-only (${args.enforce ? "--enforce: exit non-zero on gaps" : "default: gaps are FLAGGED, exit 0"}) · single source: scripts/sprint/ac-categories.js (${AC_CATEGORIES.length} categories)\n`,
    );
  }

  const anyGap = reports.some(
    (r) => !r.error && Array.isArray(r.uncovered) && r.uncovered.length > 0,
  );
  return args.enforce && anyGap ? 1 : 0;
}

function checkSprint(sprintId) {
  const entry =
    typeof SPRINT.entry === "function" ? SPRINT.entry(sprintId) : null;
  if (!entry && sprintId) {
    return {
      sprint_id: sprintId,
      error: `unknown sprint id ${sprintId} in active-sprints.yaml`,
    };
  }
  const per =
    typeof SPRINT.forSprint === "function" ? SPRINT.forSprint(sprintId) : null;
  if (!per || !per.current) {
    return { sprint_id: sprintId, error: "no per-sprint current.yaml" };
  }
  const current = readYamlMaybe(per.current);
  if (!current) {
    return { sprint_id: sprintId, error: "current.yaml unreadable" };
  }
  const plan = current.plan_contract
    ? readYamlMaybe(path.resolve(SPRINT.PROJECT, current.plan_contract))
    : null;
  const gv = plan && plan.goal_verification;
  const acRel =
    current.requirements && current.requirements.acceptance_criteria;
  if (!acRel) {
    return {
      sprint_id: sprintId,
      gate_applicable: Boolean(gv),
      error: "no acceptance-criteria.md linked from current sprint",
    };
  }
  const acPath = path.resolve(SPRINT.PROJECT, acRel);
  if (!fs.existsSync(acPath)) {
    return {
      sprint_id: sprintId,
      gate_applicable: Boolean(gv),
      error: `acceptance-criteria.md missing at ${acPath}`,
    };
  }
  const details = analyzeFile(fs.readFileSync(acPath, "utf8"));
  const exec = details.filter((d) => d.state === "executable").length;
  const na = details.filter((d) => d.state === "not_applicable").length;
  const missing = details.filter((d) => d.state === "missing").length;
  return {
    sprint_id: sprintId,
    title: current.title,
    gate_applicable: Boolean(gv),
    goal_verification_reproduction: gv ? gv.reproduction : null,
    acceptance_criteria_path: acRel,
    total_acs: details.length,
    executable: exec,
    not_applicable: na,
    missing,
    details,
  };
}

function activeSprintIds() {
  try {
    const reg = readYamlMaybe(SPRINT.activeRegistry);
    if (!reg || !Array.isArray(reg.sprints)) return [];
    return reg.sprints
      .filter(
        (s) =>
          s &&
          s.status !== "closed" &&
          s.status !== "abandoned" &&
          s.status !== "retrospected",
      )
      .map((s) => s.id);
  } catch {
    return [];
  }
}

function renderProse(report) {
  const lines = [];
  if (report.error) {
    lines.push(
      `ac-coverage — sprint ${report.sprint_id}: ERROR ${report.error}`,
    );
    return lines.join("\n");
  }
  lines.push(
    `ac-coverage — sprint ${report.sprint_id}: ${report.executable} executable, ${report.not_applicable} not_applicable, ${report.missing} missing  (total: ${report.total_acs})`,
  );
  if (!report.gate_applicable) {
    lines.push(
      `  note: plan_contract has no goal_verification block — gate is not applicable; report is informational.`,
    );
  }
  if (report.missing > 0) {
    lines.push(`  missing ACs:`);
    for (const d of report.details) {
      if (d.state === "missing") {
        lines.push(
          `    - ${d.ac} (line ${d.line}; ${d.evidence || "no verified_by line"})`,
        );
      }
    }
  }
  return lines.join("\n");
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    process.stdout.write(HELP);
    return 0;
  }
  // Axis 2 — the 20 enforcement-criteria categories (S-LC-11). Report-only.
  if (args.categories) {
    return runCategoryMode(args);
  }
  const sprintIds = args.sprint
    ? [args.sprint]
    : (() => {
        if (
          typeof SPRINT.active === "function" &&
          SPRINT.active() &&
          typeof activeSprintIds === "function"
        ) {
          const ids = activeSprintIds();
          return ids.length ? ids : [SPRINT.active()];
        }
        return [SPRINT.active && SPRINT.active()].filter(Boolean);
      })();
  if (sprintIds.length === 0) {
    process.stderr.write("no active sprints to audit\n");
    return 1;
  }
  const reports = sprintIds.map(checkSprint);
  if (args.json) {
    process.stdout.write(JSON.stringify(reports, null, 2) + "\n");
  } else {
    for (const r of reports) {
      process.stdout.write(renderProse(r) + "\n");
    }
  }
  // Exit 1 if any sprint with gate_applicable has missing>0.
  const bad = reports.some(
    (r) => !r.error && r.gate_applicable && r.missing > 0,
  );
  return bad ? 1 : 0;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = {
  main,
  checkSprint,
  analyzeFile,
  parseArgs,
  classifyVerifiedByRest,
  checkCategoryCoverage,
  chunkHasProof,
  isStubProof,
  resolveAcPath,
  runCategoryMode,
  AC_CATEGORIES,
};
