#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * tests/regression/SP-20260518-007/docs-and-skill-bodies.test.js
 *
 * Covers consolidated docs bundle (T-20260518-111 — Beta merged S-5.1+S-5.3+S-6.1):
 *   - AC-5.1.1: sprint-workflow.md has the goal_verification section
 *   - AC-5.3.1: sprint-full-autonomy.json moderate preset description mentions the fixture gate
 *   - AC-6.1.1: four sprint skill bodies mention the convention
 */

"use strict";

const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..", "..", "..");

let passed = 0;
let failed = 0;
function ok(name) {
  passed++;
  process.stdout.write(`  ok    ${name}\n`);
}
function fail(name, detail) {
  failed++;
  process.stdout.write(`  FAIL  ${name}\n`);
  if (detail) process.stdout.write(`        ${detail}\n`);
}

function readFile(rel) {
  return fs.readFileSync(path.join(REPO, rel), "utf8");
}

function test_sprint_workflow_reference_has_goal_verification_section() {
  const ref = readFile(".claude/project/reference/sprint-workflow.md");
  if (!/## Sprint Goal Verification \(SP-20260518-007\)/.test(ref)) {
    return fail(
      "test_sprint_workflow_reference_has_goal_verification_section",
      "missing top-level section",
    );
  }
  if (!/`goal_verification`/.test(ref)) {
    return fail(
      "test_sprint_workflow_reference_has_goal_verification_section",
      "section does not name goal_verification field",
    );
  }
  if (!/verified_by:/.test(ref)) {
    return fail(
      "test_sprint_workflow_reference_has_goal_verification_section",
      "section does not document verified_by:",
    );
  }
  if (!/ENOENT/.test(ref)) {
    return fail(
      "test_sprint_workflow_reference_has_goal_verification_section",
      "section does not name the ENOENT-as-fail Beta directive",
    );
  }
  ok("test_sprint_workflow_reference_has_goal_verification_section");
}

function test_sprint_full_moderate_preset_documents_fixture_gate() {
  const cfg = JSON.parse(
    readFile(".claude/agents/00-alex/.system/policy/sprint-full-autonomy.json"),
  );
  const moderate = cfg.presets && cfg.presets.moderate;
  if (!moderate) {
    return fail(
      "test_sprint_full_moderate_preset_documents_fixture_gate",
      "no moderate preset in config",
    );
  }
  if (
    !/SP-20260518-007|goal_verification|fixture gate|verified_by/.test(
      moderate.description,
    )
  ) {
    return fail(
      "test_sprint_full_moderate_preset_documents_fixture_gate",
      "moderate.description does not mention the fixture gate",
    );
  }
  ok("test_sprint_full_moderate_preset_documents_fixture_gate");
}

function test_each_sprint_skill_body_mentions_goal_verification() {
  const skills = [
    ".claude/commands/sprint/plan.md",
    ".claude/commands/sprint/design.md",
    ".claude/commands/sprint/release.md",
    ".claude/commands/sprint/execute.md",
  ];
  for (const s of skills) {
    const body = readFile(s);
    if (!/SP-20260518-007|goal_verification|verified_by/.test(body)) {
      return fail(
        "test_each_sprint_skill_body_mentions_goal_verification",
        `${s} does not mention the convention`,
      );
    }
  }
  ok("test_each_sprint_skill_body_mentions_goal_verification");
}

test_sprint_workflow_reference_has_goal_verification_section();
test_sprint_full_moderate_preset_documents_fixture_gate();
test_each_sprint_skill_body_mentions_goal_verification();

process.stdout.write(`\n# ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
