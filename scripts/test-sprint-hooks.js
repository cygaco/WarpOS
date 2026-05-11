#!/usr/bin/env node

/**
 * scripts/test-sprint-hooks.js — Acceptance tests for the two sprint hooks.
 *
 *   1. sprint-tracker-guard.js
 *      - allows valid sprint yaml under .claude/project/sprint/
 *      - blocks malformed sprint yaml (missing required field)
 *      - blocks edit to existing history/<sprint>/sprint-history.yaml
 *      - allows new history file write
 *      - allows non-sprint files
 *      - allows yaml without schema: field (warn-only)
 *      - respects SPRINT_GUARD=off
 *
 *   2. sprint-approval-guard.js
 *      - blocks `release.js deploy --id <id>` with no approval_ref
 *      - blocks `release.js deploy --id <id>` with pending approval
 *      - allows `release.js deploy --id <id>` with approved approval
 *      - blocks `external-service.js update --status integrated` when
 *        approval_required+pending
 *      - allows the same when approved
 *      - allows unrelated Bash commands
 *      - respects SPRINT_APPROVAL_GUARD=off
 *
 * Runs in-process with synthetic stdin and a temp project dir.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");

const REPO = path.resolve(__dirname, "..");

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

function dispatch(hook, payload, env = {}) {
  const res = spawnSync(
    process.execPath,
    [path.join(REPO, "scripts", "hooks", hook)],
    {
      input: JSON.stringify(payload),
      encoding: "utf8",
      env: { ...process.env, ...env },
    },
  );
  return {
    code: res.status,
    stdout: res.stdout || "",
    stderr: res.stderr || "",
  };
}

function isBlock(out) {
  if (!out.stdout) return false;
  try {
    const j = JSON.parse(out.stdout.trim());
    return j.decision === "block";
  } catch {
    return false;
  }
}

function setupProject() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "warpos-sprint-hooks-"));
  // copy paths.json, schemas, sprint scripts so the hooks can load them
  function copyDir(src, dst) {
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(src)) {
      const s = path.join(src, f);
      const d = path.join(dst, f);
      if (fs.statSync(s).isDirectory()) copyDir(s, d);
      else fs.copyFileSync(s, d);
    }
  }
  function copyFile(rel) {
    const src = path.join(REPO, rel);
    const dst = path.join(tmp, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
  copyFile(".claude/paths.json");
  copyDir(path.join(REPO, "schemas/sprint"), path.join(tmp, "schemas/sprint"));
  copyDir(path.join(REPO, "scripts/sprint"), path.join(tmp, "scripts/sprint"));
  copyDir(
    path.join(REPO, "scripts/hooks/lib"),
    path.join(tmp, "scripts/hooks/lib"),
  );
  return tmp;
}

function teardown(tmp) {
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
  } catch {}
}

function nowIso() {
  return new Date().toISOString();
}

// ── tracker-guard tests ─────────────────────────────────────

function testTrackerAllowsValid() {
  const tmp = setupProject();
  try {
    const fp = path.join(
      tmp,
      ".claude",
      "project",
      "sprint",
      "tickets",
      "T-20260511-001.yaml",
    );
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    const content = [
      "schema: warpos/sprint/ticket/v1",
      'id: "T-20260511-001"',
      'title: "Test ticket"',
      "type: feature",
      "status: proposed",
      'sprint: "SP-20260511-001"',
      `created_at: "${nowIso()}"`,
      `updated_at: "${nowIso()}"`,
      "owner: null",
      "owner_agent: null",
      'risk_level: "low"',
      "approval_required: false",
      'approval_state: "not_required"',
      'source_request: ""',
      'plan_contract: ""',
      "linked_requirements: []",
      "linked_high_level_story: null",
      "linked_granular_story: null",
      "linked_prd: null",
      "linked_copy: []",
      "linked_inputs: []",
      "linked_trace: []",
      "linked_acceptance_criteria: []",
      "linked_issues: []",
      "linked_decisions: []",
      "linked_external_services: []",
      "linked_files: []",
      "linked_tests: []",
      "linked_commits: []",
      "linked_prs: []",
      "linked_release: null",
      'description: "x"',
      'user_value: ""',
      'business_value: ""',
      "acceptance_criteria:",
      "  - AC-1",
      "non_goals: []",
      'implementation_notes: ""',
      'qa_notes: ""',
      'redteam_notes: ""',
      'trace_notes: ""',
      "blocked_by: []",
      "blocks: []",
      "fix_attempts: []",
      "ralph_progress: null",
      "completion_evidence: []",
      "reopen_history: []",
      "",
    ].join("\n");
    const out = dispatch(
      "sprint-tracker-guard.js",
      { tool_input: { file_path: fp, content } },
      { CLAUDE_PROJECT_DIR: tmp },
    );
    if (isBlock(out))
      fail("tracker allows valid ticket yaml", out.stdout || out.stderr);
    else ok("tracker allows valid ticket yaml");
  } finally {
    teardown(tmp);
  }
}

function testTrackerBlocksMalformed() {
  const tmp = setupProject();
  try {
    const fp = path.join(
      tmp,
      ".claude",
      "project",
      "sprint",
      "tickets",
      "T-bad.yaml",
    );
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    const content = [
      "schema: warpos/sprint/ticket/v1",
      'id: "not-a-valid-id"', // fails pattern ^T-[0-9]{8}-[0-9]{3}$
      'title: "Bad ticket"',
      "type: feature",
      "status: proposed",
      'sprint: "SP-20260511-001"',
      `created_at: "${nowIso()}"`,
      `updated_at: "${nowIso()}"`,
      'risk_level: "low"',
      "approval_required: false",
      'source_request: ""',
      'plan_contract: ""',
      'description: "x"',
      "acceptance_criteria: []",
      "",
    ].join("\n");
    const out = dispatch(
      "sprint-tracker-guard.js",
      { tool_input: { file_path: fp, content } },
      { CLAUDE_PROJECT_DIR: tmp },
    );
    if (!isBlock(out))
      fail(
        "tracker blocks malformed ticket id",
        out.stdout || out.stderr || "no block",
      );
    else ok("tracker blocks malformed ticket id (pattern violation)");
  } finally {
    teardown(tmp);
  }
}

function testTrackerBlocksHistoryEdit() {
  const tmp = setupProject();
  try {
    const fp = path.join(
      tmp,
      ".claude",
      "project",
      "sprint",
      "history",
      "SP-20260511-001",
      "sprint-history.yaml",
    );
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, "schema: warpos/sprint/sprint-history/v1\n", "utf8");
    const out = dispatch(
      "sprint-tracker-guard.js",
      {
        tool_input: { file_path: fp, content: "schema: edited\n" },
      },
      { CLAUDE_PROJECT_DIR: tmp },
    );
    if (!isBlock(out))
      fail("tracker blocks edit to existing history", out.stdout || "no block");
    else ok("tracker blocks edit to existing history yaml");
  } finally {
    teardown(tmp);
  }
}

function testTrackerAllowsNewHistory() {
  const tmp = setupProject();
  try {
    const fp = path.join(
      tmp,
      ".claude",
      "project",
      "sprint",
      "history",
      "SP-20260511-002",
      "sprint-history.yaml",
    );
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    // do NOT write the file — simulate a fresh archive
    const out = dispatch(
      "sprint-tracker-guard.js",
      { tool_input: { file_path: fp, content: "schema: x\n" } },
      { CLAUDE_PROJECT_DIR: tmp },
    );
    if (isBlock(out))
      fail("tracker allows new history file", out.stdout || "blocked");
    else ok("tracker allows NEW history file write");
  } finally {
    teardown(tmp);
  }
}

function testTrackerAllowsNonSprint() {
  const tmp = setupProject();
  try {
    const out = dispatch(
      "sprint-tracker-guard.js",
      {
        tool_input: {
          file_path: path.join(tmp, "some/other/file.yaml"),
          content: "anything: goes\n",
        },
      },
      { CLAUDE_PROJECT_DIR: tmp },
    );
    if (isBlock(out)) fail("tracker allows non-sprint files");
    else ok("tracker allows non-sprint files");
  } finally {
    teardown(tmp);
  }
}

function testTrackerKillSwitch() {
  const tmp = setupProject();
  try {
    const fp = path.join(
      tmp,
      ".claude",
      "project",
      "sprint",
      "tickets",
      "T-bad.yaml",
    );
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    const out = dispatch(
      "sprint-tracker-guard.js",
      {
        tool_input: {
          file_path: fp,
          content: "schema: warpos/sprint/ticket/v1\nid: bad\n",
        },
      },
      { CLAUDE_PROJECT_DIR: tmp, SPRINT_GUARD: "off" },
    );
    if (isBlock(out))
      fail(
        "SPRINT_GUARD=off bypasses tracker-guard",
        out.stdout || "blocked anyway",
      );
    else ok("SPRINT_GUARD=off bypasses tracker-guard");
  } finally {
    teardown(tmp);
  }
}

// ── approval-guard tests ────────────────────────────────────

function writeYaml(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const lines = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === null) lines.push(`${k}: null`);
    else if (typeof v === "string") lines.push(`${k}: "${v}"`);
    else if (typeof v === "boolean") lines.push(`${k}: ${v}`);
    else if (typeof v === "object")
      lines.push(
        `${k}: ${JSON.stringify(v).replace(/[{}]/g, (c) => (c === "{" ? "{" : "}"))}`,
      );
    else lines.push(`${k}: ${v}`);
  }
  fs.writeFileSync(file, lines.join("\n") + "\n", "utf8");
}

function setupRelease(tmp, { releaseId, approvalRef, approvalState }) {
  const releaseDir = path.join(tmp, ".claude", "project", "sprint", "releases");
  const approvalsDir = path.join(
    tmp,
    ".claude",
    "project",
    "sprint",
    "approvals",
  );
  fs.mkdirSync(releaseDir, { recursive: true });
  fs.mkdirSync(approvalsDir, { recursive: true });
  writeYaml(path.join(releaseDir, `${releaseId}.yaml`), {
    schema: "warpos/sprint/release/v1",
    id: releaseId,
    sprint: "SP-20260511-001",
    title: "Test release",
    version: "1.0.0",
    status: "ready_to_deploy",
    approval_ref: approvalRef,
    created_at: nowIso(),
    updated_at: nowIso(),
  });
  if (approvalRef && !approvalRef.endsWith(".yaml")) {
    writeYaml(path.join(approvalsDir, `${approvalRef}.yaml`), {
      schema: "warpos/sprint/approval/v1",
      id: approvalRef,
      sprint: "SP-20260511-001",
      level: "release_approval_required",
      required_for: "production deploy",
      state: approvalState,
      requested_by: "alpha",
      created_at: nowIso(),
      updated_at: nowIso(),
    });
  }
}

function testApprovalBlocksNoApprovalRef() {
  const tmp = setupProject();
  try {
    setupRelease(tmp, { releaseId: "RL-20260511-001", approvalRef: null });
    const out = dispatch(
      "sprint-approval-guard.js",
      {
        tool_input: {
          command: "node scripts/sprint/release.js deploy --id RL-20260511-001",
        },
      },
      { CLAUDE_PROJECT_DIR: tmp },
    );
    if (!isBlock(out))
      fail(
        "approval blocks deploy with no approval_ref",
        out.stdout || "no block",
      );
    else ok("approval blocks deploy with no approval_ref");
  } finally {
    teardown(tmp);
  }
}

function testApprovalBlocksPending() {
  const tmp = setupProject();
  try {
    setupRelease(tmp, {
      releaseId: "RL-20260511-002",
      approvalRef: "AP-20260511-001",
      approvalState: "pending",
    });
    const out = dispatch(
      "sprint-approval-guard.js",
      {
        tool_input: {
          command: "node scripts/sprint/release.js deploy --id RL-20260511-002",
        },
      },
      { CLAUDE_PROJECT_DIR: tmp },
    );
    if (!isBlock(out))
      fail(
        "approval blocks deploy with pending approval",
        out.stdout || "no block",
      );
    else ok("approval blocks deploy with pending approval");
  } finally {
    teardown(tmp);
  }
}

function testApprovalAllowsApproved() {
  const tmp = setupProject();
  try {
    setupRelease(tmp, {
      releaseId: "RL-20260511-003",
      approvalRef: "AP-20260511-002",
      approvalState: "approved",
    });
    const out = dispatch(
      "sprint-approval-guard.js",
      {
        tool_input: {
          command: "node scripts/sprint/release.js deploy --id RL-20260511-003",
        },
      },
      { CLAUDE_PROJECT_DIR: tmp },
    );
    if (isBlock(out))
      fail(
        "approval allows deploy with approved approval",
        out.stdout || "blocked anyway",
      );
    else ok("approval allows deploy with approved approval");
  } finally {
    teardown(tmp);
  }
}

function testApprovalAllowsUnrelatedBash() {
  const tmp = setupProject();
  try {
    const out = dispatch(
      "sprint-approval-guard.js",
      { tool_input: { command: "ls -la" } },
      { CLAUDE_PROJECT_DIR: tmp },
    );
    if (isBlock(out))
      fail("approval allows unrelated bash", out.stdout || "blocked");
    else ok("approval allows unrelated bash (ls)");
  } finally {
    teardown(tmp);
  }
}

function testApprovalKillSwitch() {
  const tmp = setupProject();
  try {
    setupRelease(tmp, { releaseId: "RL-bad", approvalRef: null });
    const out = dispatch(
      "sprint-approval-guard.js",
      {
        tool_input: {
          command: "node scripts/sprint/release.js deploy --id RL-bad",
        },
      },
      { CLAUDE_PROJECT_DIR: tmp, SPRINT_APPROVAL_GUARD: "off" },
    );
    if (isBlock(out)) fail("SPRINT_APPROVAL_GUARD=off bypass", out.stdout);
    else ok("SPRINT_APPROVAL_GUARD=off bypasses approval-guard");
  } finally {
    teardown(tmp);
  }
}

function testEsdGate() {
  const tmp = setupProject();
  try {
    const esdDir = path.join(
      tmp,
      ".claude",
      "project",
      "sprint",
      "external-services",
    );
    fs.mkdirSync(esdDir, { recursive: true });
    writeYaml(path.join(esdDir, "ESD-20260511-001.yaml"), {
      schema: "warpos/sprint/external-service-dependency/v1",
      id: "ESD-20260511-001",
      sprint: "SP-20260511-001",
      service_name: "Stripe",
      service_category: "payment",
      purpose: "subscriptions",
      status: "needs_credentials",
      approval_required: true,
      approval_state: "pending",
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    const out = dispatch(
      "sprint-approval-guard.js",
      {
        tool_input: {
          command:
            "node scripts/sprint/external-service.js update --id ESD-20260511-001 --status integrated",
        },
      },
      { CLAUDE_PROJECT_DIR: tmp },
    );
    if (!isBlock(out))
      fail(
        "approval blocks ESD --status integrated with pending approval",
        out.stdout || "no block",
      );
    else ok("approval blocks ESD --status integrated with pending approval");
  } finally {
    teardown(tmp);
  }
}

function main() {
  process.stdout.write(
    "scripts/test-sprint-hooks.js — Sprint v0.1 hook acceptance\n",
  );
  process.stdout.write("\n  tracker-guard:\n");
  testTrackerAllowsValid();
  testTrackerBlocksMalformed();
  testTrackerBlocksHistoryEdit();
  testTrackerAllowsNewHistory();
  testTrackerAllowsNonSprint();
  testTrackerKillSwitch();
  process.stdout.write("\n  approval-guard:\n");
  testApprovalBlocksNoApprovalRef();
  testApprovalBlocksPending();
  testApprovalAllowsApproved();
  testApprovalAllowsUnrelatedBash();
  testApprovalKillSwitch();
  testEsdGate();
  process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
  return failed === 0 ? 0 : 1;
}

if (require.main === module) {
  process.exit(main());
}
