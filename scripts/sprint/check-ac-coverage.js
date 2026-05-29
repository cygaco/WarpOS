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

function parseArgs(argv) {
  const out = { sprint: null, json: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--sprint") out.sprint = argv[++i];
    else if (a === "--json") out.json = true;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

const HELP = `check-ac-coverage — read-only audit of AC verified_by: linkage.

Usage:
  node scripts/sprint/check-ac-coverage.js [--sprint <SP-id>] [--json]

Exit: 0 = clean OR no goal_verification gate, 1 = missing linkage, 2 = usage error.
`;

const placeholderRegex = /\{\{|<test-file>|<test-name>/;
const acRegex = /\bAC-\d+(?:\.\d+)+\b/;

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
      if (/^not_applicable\b/i.test(rest)) {
        const justMatch = rest.match(/^not_applicable\s*(?:—|--|-)?\s*(.*)$/i);
        const j2 = justMatch ? justMatch[1].trim() : "";
        if (!j2) {
          state = "missing";
          evidence = "not_applicable-empty-justification";
        } else {
          state = "not_applicable";
          evidence = j2;
        }
        break;
      }
      if (/^\S+::\S+/.test(rest)) {
        state = "executable";
        evidence = rest;
        break;
      }
      state = "missing";
      evidence = `unrecognized: ${rest}`;
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

module.exports = { main, checkSprint, analyzeFile, parseArgs };
