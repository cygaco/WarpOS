#!/usr/bin/env node
"use strict";

/**
 * Bite-test for playbook-suite-coverage.js.
 *
 * Proves the checker catches missing required playbooks, missing sections,
 * missing reference-procedure declaration, hollow ordered steps, and runs on
 * the live tree without crashing.
 */

const assert = require("assert");
const path = require("path");
const { execFileSync } = require("child_process");
const {
  REQUIRED_PLAYBOOKS,
  REQUIRED_SECTIONS,
  evaluate,
} = require("./playbook-suite-coverage");

let passed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
}

function fixture(file = "launch-readiness-playbook.md", overrides = {}) {
  const sections = new Map(
    REQUIRED_SECTIONS.map((section) => [
      section,
      section === "Ordered Steps"
        ? "1. Run `/scan:full`.\n2. Stop at the approval gate."
        : "- Concrete item.",
    ]),
  );
  for (const [key, value] of Object.entries(overrides.sections || {})) {
    if (value === null) sections.delete(key);
    else sections.set(key, value);
  }
  const body = [...sections.entries()].map(([k, v]) => `## ${k}\n\n${v}`).join("\n\n");
  return {
    path: file,
    content: [
      "# Test Playbook",
      "",
      overrides.referenceOnly === false
        ? "Executable candidate."
        : "Reference procedure only. This is not an executable `/playbook:run` protocol.",
      "",
      overrides.suiteRef === false ? "Source design: missing" : "Source design: `_planning/playbooks/SUITE-DESIGN.md`",
      "",
      body,
      "",
    ].join("\n"),
  };
}

function completeSuite() {
  return REQUIRED_PLAYBOOKS.map((p) => fixture(p.file));
}

const has = (problems, frag) => problems.some((p) => p.includes(frag));

test("complete suite passes", () => {
  const result = evaluate({ files: completeSuite() });
  assert.deepStrictEqual(result.problems, []);
});

test("missing required playbook fails", () => {
  const files = completeSuite().filter((f) => f.path !== "provider-setup-playbook.md");
  const result = evaluate({ files });
  assert.ok(has(result.problems, "provider-setup"), result.problems.join(" | "));
});

test("missing required section fails", () => {
  const files = completeSuite();
  files[0] = fixture("launch-readiness-playbook.md", {
    sections: { Rollback: null },
  });
  const result = evaluate({ files });
  assert.ok(has(result.problems, "missing section 'Rollback'"), result.problems.join(" | "));
});

test("missing reference-procedure declaration fails", () => {
  const files = completeSuite();
  files[0] = fixture("launch-readiness-playbook.md", { referenceOnly: false });
  const result = evaluate({ files });
  assert.ok(has(result.problems, "Reference procedure only"), result.problems.join(" | "));
});

test("missing SUITE-DESIGN citation fails", () => {
  const files = completeSuite();
  files[0] = fixture("launch-readiness-playbook.md", { suiteRef: false });
  const result = evaluate({ files });
  assert.ok(has(result.problems, "SUITE-DESIGN.md"), result.problems.join(" | "));
});

test("hollow ordered steps fail", () => {
  const files = completeSuite();
  files[0] = fixture("launch-readiness-playbook.md", {
    sections: { "Ordered Steps": "Think about the work." },
  });
  const result = evaluate({ files });
  assert.ok(has(result.problems, "Ordered Steps must contain"), result.problems.join(" | "));
});

test("integration: live enforcer runs and emits a verdict", () => {
  let output = "";
  let status = 0;
  try {
    output = execFileSync(process.execPath, [path.join(__dirname, "playbook-suite-coverage.js")], {
      cwd: path.resolve(__dirname, "..", ".."),
      encoding: "utf8",
    });
  } catch (e) {
    status = e.status;
    output = `${e.stdout || ""}${e.stderr || ""}`;
  }
  assert.ok(status === 0 || status === 1, `expected exit 0/1, got ${status}: ${output}`);
  assert.ok(/\[playbook-suite-coverage\]/.test(output), `missing status line: ${output}`);
});

if (failures.length) {
  process.stderr.write(`playbook-suite-coverage bite-test: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) process.stderr.write(`  - ${f}\n`);
  process.exit(1);
}

process.stdout.write(`playbook-suite-coverage bite-test: ${passed}/${passed} passed\n`);
process.exit(0);
