#!/usr/bin/env node
"use strict";

/**
 * scripts/checks/playbook-suite-coverage.js
 *
 * Fail-closed coverage check for the situational reference playbooks under
 * _planning/playbooks/. These are not product-shipped artifacts and not
 * executable /playbook:run protocols; they are the human/agent operating
 * procedures designed in _planning/playbooks/SUITE-DESIGN.md.
 *
 * Invariants:
 *   1. The five designed playbooks exist once _planning/playbooks exists.
 *   2. Every authored *-playbook.md carries the required section contract:
 *      Situation, Preconditions, Ordered Steps, Gates That Must Pass,
 *      Definition of Done, Rollback.
 *   3. Every authored playbook declares it is a reference procedure only and
 *      cites SUITE-DESIGN.md.
 *   4. Ordered Steps and Gates sections are not hollow.
 *
 * If _planning/ is absent, the check reports skipped/ok so shipped product
 * installs without the planning store do not fail /scan:full. In canonical,
 * _planning/ exists, so missing or malformed playbooks are red.
 *
 *   node scripts/checks/playbook-suite-coverage.js [--json]
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const PLAYBOOK_DIR = path.join(REPO_ROOT, "_planning", "playbooks");
const NAME = "playbook-suite-coverage";

const REQUIRED_SECTIONS = [
  "Situation",
  "Preconditions",
  "Ordered Steps",
  "Gates That Must Pass",
  "Definition of Done",
  "Rollback",
];

const REQUIRED_PLAYBOOKS = [
  { id: "launch-readiness", file: "launch-readiness-playbook.md" },
  { id: "provider-setup", file: "provider-setup-playbook.md" },
  { id: "mode-switch", file: "mode-switch-playbook.md" },
  { id: "incident-response", file: "incident-response-playbook.md" },
  { id: "retro-loop", file: "retro-loop-playbook.md" },
];

function normalizeHeading(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizePath(s) {
  return String(s || "").replace(/\\/g, "/").replace(/^\.?\//, "");
}

function parseSections(markdown) {
  const headings = [];
  const re = /^##\s+(.+?)\s*$/gm;
  let match;
  while ((match = re.exec(markdown)) !== null) {
    headings.push({
      title: match[1].trim(),
      key: normalizeHeading(match[1]),
      start: match.index,
      contentStart: re.lastIndex,
    });
  }
  const sections = new Map();
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    const end = i + 1 < headings.length ? headings[i + 1].start : markdown.length;
    sections.set(h.key, {
      title: h.title,
      content: markdown.slice(h.contentStart, end).trim(),
    });
  }
  return sections;
}

function hasListContent(content) {
  return /(^|\n)\s*(?:[-*]|\d+\.)\s+\S/.test(content || "");
}

function orderedStepsAreGrounded(content) {
  const text = String(content || "");
  return /\/[a-z][a-z0-9-]*:[a-z0-9-]+/i.test(text) ||
    /node\s+scripts\//i.test(text) ||
    /HUMAN GATE|confirm-class|approval|gate/i.test(text);
}

function validatePlaybook(file, content) {
  const problems = [];
  if (!/^#\s+\S/m.test(content)) {
    problems.push(`${file}: missing top-level title`);
  }
  if (!/Reference procedure only/i.test(content)) {
    problems.push(`${file}: must state 'Reference procedure only'`);
  }
  if (!/SUITE-DESIGN\.md/.test(content)) {
    problems.push(`${file}: must cite _planning/playbooks/SUITE-DESIGN.md`);
  }

  const sections = parseSections(content);
  for (const section of REQUIRED_SECTIONS) {
    const key = normalizeHeading(section);
    const body = sections.get(key);
    if (!body) {
      problems.push(`${file}: missing section '${section}'`);
    } else if (!body.content.trim()) {
      problems.push(`${file}: section '${section}' is empty`);
    }
  }

  const ordered = sections.get(normalizeHeading("Ordered Steps"));
  if (ordered) {
    if (!hasListContent(ordered.content)) {
      problems.push(`${file}: Ordered Steps must contain a numbered or bulleted procedure`);
    }
    if (!orderedStepsAreGrounded(ordered.content)) {
      problems.push(`${file}: Ordered Steps must name a skill, script, gate, or approval point`);
    }
  }

  const gates = sections.get(normalizeHeading("Gates That Must Pass"));
  if (gates && !hasListContent(gates.content)) {
    problems.push(`${file}: Gates That Must Pass must contain concrete gates`);
  }

  return problems;
}

function evaluate({ files, requiredPlaybooks = REQUIRED_PLAYBOOKS }) {
  const problems = [];
  const normalized = new Map();
  for (const file of files || []) {
    const rel = normalizePath(file.path || file.file || "");
    normalized.set(rel, String(file.content || ""));
    normalized.set(path.posix.basename(rel), String(file.content || ""));
  }

  for (const p of requiredPlaybooks) {
    if (!normalized.has(p.file)) {
      problems.push(`missing required playbook '${p.id}' (${p.file})`);
    }
  }

  const authored = [...normalized.entries()]
    .filter(([rel]) => rel.endsWith("-playbook.md"))
    .filter(([rel], idx, arr) => arr.findIndex(([other]) => path.posix.basename(other) === path.posix.basename(rel)) === idx)
    .map(([rel, content]) => ({ file: path.posix.basename(rel), content }));

  for (const p of authored) {
    problems.push(...validatePlaybook(p.file, p.content));
  }

  return {
    ok: problems.length === 0,
    problems,
    counts: {
      required: requiredPlaybooks.length,
      authored: authored.length,
      sections: REQUIRED_SECTIONS.length,
    },
  };
}

function listMarkdownFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => ({
      path: entry.name,
      content: fs.readFileSync(path.join(dir, entry.name), "utf8"),
    }));
}

function run(root = REPO_ROOT) {
  const planningDir = path.join(root, "_planning");
  const playbookDir = path.join(planningDir, "playbooks");
  if (!fs.existsSync(planningDir)) {
    return {
      ok: true,
      skipped: true,
      problems: [],
      counts: { required: REQUIRED_PLAYBOOKS.length, authored: 0, sections: REQUIRED_SECTIONS.length },
      notes: ["_planning/ absent; playbook-suite check is not applicable in this install"],
    };
  }
  if (!fs.existsSync(playbookDir)) {
    return {
      ok: false,
      skipped: false,
      problems: ["_planning/playbooks/ is missing"],
      counts: { required: REQUIRED_PLAYBOOKS.length, authored: 0, sections: REQUIRED_SECTIONS.length },
      notes: [],
    };
  }
  const result = evaluate({ files: listMarkdownFiles(playbookDir) });
  return {
    ...result,
    skipped: false,
    notes: [
      `${result.counts.authored} authored playbook(s) · ${result.counts.required} required · ${result.counts.sections} required section(s)`,
    ],
  };
}

function main() {
  const jsonOut = process.argv.includes("--json");
  let result;
  try {
    result = run(REPO_ROOT);
  } catch (e) {
    const message = `${NAME}: runner error (fail-closed): ${e.message}`;
    if (jsonOut) {
      console.log(JSON.stringify({ ok: false, fatal: true, error: message }, null, 2));
    } else {
      console.error(message);
    }
    process.exit(2);
  }

  if (jsonOut) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  }

  if (result.ok) {
    const prefix = result.skipped ? "SKIP" : "PASS";
    console.log(`${prefix} [${NAME}] ${result.notes.join(" · ")}`);
    process.exit(0);
  }

  console.error(`FAIL [${NAME}] ${result.problems.length} gap(s):`);
  for (const p of result.problems) console.error(`  - ${p}`);
  if (result.notes.length) console.error(`  (${result.notes.join(" · ")})`);
  process.exit(1);
}

if (require.main === module) main();

module.exports = {
  REQUIRED_PLAYBOOKS,
  REQUIRED_SECTIONS,
  evaluate,
  parseSections,
  run,
  validatePlaybook,
};
