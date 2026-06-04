#!/usr/bin/env node
/**
 * test-dispatch-agent-resolution.js — verify ADR-0007 department-tree spec
 * resolution in scripts/dispatch-agent.js. Imports findAgentSpec directly.
 *
 * Post-cutover the agent system is ONE mode-agnostic department tree
 * (president/ + engineering/<pod>/ + product/quality/ + growth/ + _system/), so
 * resolution is no longer mode-branched. The pod specs are named by FILE-stem at
 * the pod level (engineering/security/reviewer.md whose frontmatter is
 * `name: security-reviewer`), so resolution must consult frontmatter `name:`,
 * not just the file stem.
 */

"use strict";

const path = require("path");

const projectDir = path.resolve(__dirname, "..");
process.env.CLAUDE_PROJECT_DIR = projectDir;

const dispatch = require(path.join(projectDir, "scripts", "dispatch-agent.js"));

let passed = 0;
let failed = 0;
const failures = [];

function check(name, cond, detail) {
  if (cond) {
    passed++;
  } else {
    failed++;
    failures.push(`${name}: ${detail || "false"}`);
  }
}

// The faces resolve under president/ regardless of mode.
for (const face of ["alpha", "beta", "gamma", "delta", "epsilon"]) {
  const spec = dispatch.findAgentSpec(face);
  check(
    `${face} resolves under president/`,
    spec && spec.includes(path.join("president", `${face}.md`)),
    spec,
  );
}

// Pod workers resolve under engineering/<pod>/ by FRONTMATTER name (the file
// stem is builder/reviewer/fixer at the pod level — the stem alone would miss
// the canonical name, which is the bug the DFS-by-name fix closes).
const podCases = [
  ["frontend-builder", path.join("engineering", "frontend", "builder.md")],
  ["backend-builder", path.join("engineering", "backend", "builder.md")],
  ["security-builder", path.join("engineering", "security", "builder.md")],
  ["frontend-reviewer", path.join("engineering", "frontend", "reviewer.md")],
  ["backend-reviewer", path.join("engineering", "backend", "reviewer.md")],
  ["security-reviewer", path.join("engineering", "security", "reviewer.md")],
  ["frontend-fixer", path.join("engineering", "frontend", "fixer.md")],
  ["security-fixer", path.join("engineering", "security", "fixer.md")],
];
for (const [role, expectedTail] of podCases) {
  const spec = dispatch.findAgentSpec(role);
  check(
    `${role} resolves to ${expectedTail} (by frontmatter name)`,
    spec && spec.includes(expectedTail),
    spec,
  );
}

// Quality + system roles.
const otherCases = [
  ["qa-reviewer", path.join("product", "quality", "qa-reviewer.md")],
  ["design-quality", path.join("product", "quality", "design-quality.md")],
  ["visual-review", path.join("product", "quality", "visual-review.md")],
  ["test-runner", path.join("product", "quality", "test-runner.md")],
  ["learner", path.join("_system", "learner.md")],
  ["stub-scaffold", path.join("_system", "stub-scaffold.md")],
  ["design-lead", path.join("product", "design-lead.md")],
];
for (const [role, expectedTail] of otherCases) {
  const spec = dispatch.findAgentSpec(role);
  check(
    `${role} resolves to ${expectedTail}`,
    spec && spec.includes(expectedTail),
    spec,
  );
}

// Unknown role → null
const unknown = dispatch.findAgentSpec("definitely-not-a-real-role");
check("unknown role returns null", unknown === null, String(unknown));

// detectMode still honours WARPOS_MODE (the mode signal persists even though
// resolution is mode-agnostic — the conducting face uses it for orchestration).
const prev = process.env.WARPOS_MODE;
process.env.WARPOS_MODE = "oneshot";
check("detectMode honours WARPOS_MODE=oneshot", dispatch.detectMode() === "oneshot");
process.env.WARPOS_MODE = "adhoc";
check("detectMode honours WARPOS_MODE=adhoc", dispatch.detectMode() === "adhoc");
if (prev === undefined) delete process.env.WARPOS_MODE;
else process.env.WARPOS_MODE = prev;

if (failed > 0) {
  console.error(`FAIL — ${failed} of ${passed + failed} cases failed:`);
  for (const f of failures) console.error("  -", f);
  process.exit(1);
}
console.log(`OK — ${passed} cases passed (department-tree resolution)`);
process.exit(0);
