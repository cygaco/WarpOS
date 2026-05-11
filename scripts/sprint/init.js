#!/usr/bin/env node

/**
 * scripts/sprint/init.js — Sprint Workflow v0.1 downstream init.
 *
 * Creates the .claude/project/sprint/ tracker tree from templates
 * in framework/templates/sprint/init/. Safe to run multiple times —
 * refuses to overwrite existing files unless --force.
 *
 * Usage:
 *   node scripts/sprint/init.js                 (initialize if missing)
 *   node scripts/sprint/init.js --force         (recreate from templates)
 *   node scripts/sprint/init.js --status        (report what exists)
 *   node scripts/sprint/init.js --project "<name>"  (project_name placeholder)
 *
 * Exit codes:
 *   0  init done or already exists
 *   1  template load failed
 *   2  bad args
 */

"use strict";

const fs = require("fs");
const path = require("path");
const SPRINT = require("./paths");
const { ensureDir, readText, writeText, render, nowIso } = require("./fs");
const { sprintId } = require("./ids");

function parseArgs(argv) {
  const out = { force: false, status: false, project: "your project" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") out.force = true;
    else if (a === "--status") out.status = true;
    else if (a === "--project") out.project = argv[++i] || "your project";
  }
  return out;
}

function status() {
  const dirs = [
    ["root", SPRINT.root],
    ["plan-contracts", SPRINT.planContracts],
    ["tickets", SPRINT.tickets],
    ["issues", SPRINT.issues],
    ["external-services", SPRINT.externalServices],
    ["releases", SPRINT.releases],
    ["approvals", SPRINT.approvals],
    ["decisions", SPRINT.decisions],
    ["ralph", SPRINT.ralph],
    ["checkpoints", SPRINT.checkpoints],
    ["requirements", SPRINT.requirements],
    ["history", SPRINT.history],
  ];
  const files = [
    ["current-sprint.yaml", SPRINT.current],
    ["sprint-progress.yaml", SPRINT.progress],
    ["issues.md (repo root)", SPRINT.issuesLedger],
  ];
  let total = 0,
    present = 0;
  process.stdout.write("scripts/sprint/init.js — tracker status\n");
  for (const [label, d] of dirs) {
    total++;
    const ok = fs.existsSync(d);
    if (ok) present++;
    process.stdout.write(`  [${ok ? "x" : " "}] dir ${label}: ${d}\n`);
  }
  for (const [label, f] of files) {
    total++;
    const ok = fs.existsSync(f);
    if (ok) present++;
    process.stdout.write(`  [${ok ? "x" : " "}] file ${label}: ${f}\n`);
  }
  process.stdout.write(`  ${present}/${total} present\n`);
  return 0;
}

function init(args) {
  const tmplDir = path.join(SPRINT.templates, "init");
  if (!fs.existsSync(tmplDir)) {
    process.stderr.write(`init templates missing: ${tmplDir}\n`);
    return 1;
  }
  // mkdir tree
  for (const d of [
    SPRINT.root,
    SPRINT.planContracts,
    SPRINT.tickets,
    SPRINT.issues,
    SPRINT.externalServices,
    SPRINT.releases,
    SPRINT.approvals,
    SPRINT.decisions,
    SPRINT.ralph,
    SPRINT.checkpoints,
    SPRINT.requirements,
    SPRINT.history,
  ]) {
    ensureDir(d);
  }
  const sid = sprintId(SPRINT.history);
  const now = nowIso();
  const data = {
    sprint_id: sid,
    sprint_title: "Initial sprint placeholder",
    sprint_objective: "Run /sprint:plan to set this.",
    created_at: now,
    updated_at: now,
    project_name: args.project,
  };
  const targets = [
    {
      tmpl: path.join(tmplDir, "current-sprint.yaml.tmpl"),
      out: SPRINT.current,
    },
    {
      tmpl: path.join(tmplDir, "sprint-progress.yaml.tmpl"),
      out: SPRINT.progress,
    },
    {
      tmpl: path.join(tmplDir, "README.md.tmpl"),
      out: path.join(SPRINT.root, "README.md"),
    },
    {
      tmpl: path.join(tmplDir, "issues.md.tmpl"),
      out: SPRINT.issuesLedger,
    },
  ];
  let wrote = 0,
    skipped = 0;
  for (const t of targets) {
    const text = readText(t.tmpl);
    if (text === null) {
      process.stderr.write(`missing template: ${t.tmpl}\n`);
      continue;
    }
    const rendered = render(text, data);
    const res = writeText(t.out, rendered, { force: args.force });
    if (res.wrote) wrote++;
    else skipped++;
    process.stdout.write(`  ${res.wrote ? "wrote " : "skip  "} ${t.out}\n`);
  }
  process.stdout.write(
    `init: ${wrote} written, ${skipped} skipped (existing). Sprint id = ${sid}.\n`,
  );
  return 0;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.status) return status();
  return init(args);
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { init, status };
