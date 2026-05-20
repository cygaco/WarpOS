#!/usr/bin/env node

/**
 * version-bump-guard.js — PreToolUse Bash guard.
 *
 * Refuses (or warns) when `git commit` stages framework-prefix files while
 * version.json#version already has a minted capsule under
 * framework/releases/<version>/. The semantic check: "did you change
 * framework code without bumping the version since the last capsule mint?"
 *
 * Background: 2026-05-20 audit found 28 new assets + 179 SHA drifts had
 * accumulated against the 0.8.0 label over 5 days because no enforcer
 * surfaced the issue at write-time. Downstream consumers running
 * `/warp:update --to 0.8.0` got a stale framework. This guard makes the
 * version-bump requirement self-detecting.
 *
 * Decision logic:
 *   1. Tool is Bash AND command contains `git commit` (heuristic — see
 *      DETECT_GIT_COMMIT below for the exact pattern).
 *   2. Gather staged file paths via `git diff --cached --name-only`.
 *   3. Filter to FRAMEWORK_PREFIXES (mirrored from
 *      scripts/warpos/promote.js — kept in sync via fixture test). Skip
 *      EXCLUDE_PREFIXES.
 *   4. If 0 framework-prefix files staged → exit 0.
 *   5. Read version.json#version. Check if framework/releases/<version>/
 *      directory exists.
 *      - NOT exists ⇒ version was already bumped, capsule not yet minted.
 *        This is a legitimate mid-release commit. Exit 0.
 *      - Exists ⇒ current version already has a capsule. Bumping is needed
 *        before more framework changes can ship honestly. Warn or block per
 *        policy mode.
 *
 * Bypass (logged via stderr):
 *   - env: WARPOS_VERSION_GUARD=off
 *   - sentinel: .warpos/version-bump-guard-disable
 *
 * Fail-open conditions (NEVER block):
 *   - Not a `git commit` command.
 *   - Cannot read version.json.
 *   - Cannot run `git diff --cached --name-only` (not a git repo, git error).
 *   - Policy file unreadable.
 *   - Bypass env var or sentinel present.
 *   - Any unexpected exception.
 *
 * Policy file: .claude/agents/00-alex/.system/policy/version-bump-guard.json
 *   { "enforcement": { "mode": "warn"|"block",
 *     "soft_rollout_until": "<ISO>" } }
 *   Soft-rollout downgrades `block` to `warn` until the date passes.
 *   Missing policy file = warn mode (delete-to-soft-disable preserved).
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const DETECT_GIT_COMMIT = /\bgit(\s+-[A-Za-z][^\s]*)*\s+commit\b/;

// Mirror of scripts/warpos/promote.js#FRAMEWORK_PREFIXES. Kept in sync via
// scripts/sprint/test-version-bump-guard.js (fixture compares both arrays).
const FRAMEWORK_PREFIXES = [
  ".claude/agents/",
  ".claude/commands/",
  ".claude/project/reference/",
  ".claude/framework-manifest.json",
  ".claude/paths.json",
  "scripts/",
  "schemas/",
  "framework/",
  "migrations/",
  "patterns/",
  "fixtures/",
  "install.ps1",
  "AGENTS.md",
  "CLAUDE.md",
  "PROJECT.md",
  "_requirements/",
  "_docs/",
];

const EXCLUDE_PREFIXES = [
  ".claude/runtime/",
  ".claude/project/events/",
  ".claude/project/memory/",
  ".claude/project/maps/",
  ".claude/project/builds/",
  ".claude/project/sprint/",
  ".claude/agents/.system/dispatch-backups/",
  ".claude/agents/02-oneshot/.system/retros/",
  ".claude/agents/00-alex/.system/beta/events.jsonl",
  "framework/releases/",
];

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  try {
    run(JSON.parse(input || "{}"));
  } catch {
    process.exit(0);
  }
});

function run(event) {
  if (!event || event.tool_name !== "Bash") return process.exit(0);

  const command = (event.tool_input && event.tool_input.command) || "";
  if (!command) return process.exit(0);
  if (!DETECT_GIT_COMMIT.test(command)) return process.exit(0);

  if (process.env.WARPOS_VERSION_GUARD === "off") {
    process.stderr.write(
      "[version-bump-guard] bypass: WARPOS_VERSION_GUARD=off (logged)\n",
    );
    return process.exit(0);
  }

  const project = resolveProject();
  if (!project) return process.exit(0);

  if (fs.existsSync(path.join(project, ".warpos", "version-bump-guard-disable"))) {
    process.stderr.write(
      "[version-bump-guard] bypass: sentinel .warpos/version-bump-guard-disable present (logged)\n",
    );
    return process.exit(0);
  }

  let version;
  try {
    const vj = JSON.parse(
      fs.readFileSync(path.join(project, "version.json"), "utf8"),
    );
    version = vj.version;
  } catch {
    return process.exit(0);
  }
  if (!version || typeof version !== "string") return process.exit(0);

  const capsuleDir = path.join(project, "framework", "releases", version);
  let capsuleExists = false;
  try {
    capsuleExists = fs.statSync(capsuleDir).isDirectory();
  } catch {
    capsuleExists = false;
  }
  if (!capsuleExists) {
    // Mid-release: version already bumped past last capsule. Allow commit.
    return process.exit(0);
  }

  let stagedRaw;
  try {
    stagedRaw = execSync("git diff --cached --name-only", {
      cwd: project,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    });
  } catch {
    return process.exit(0);
  }
  const staged = stagedRaw.split(/\r?\n/).filter(Boolean);
  if (staged.length === 0) return process.exit(0);

  const framework = staged.filter(
    (p) => matchesPrefix(p, FRAMEWORK_PREFIXES) && !matchesPrefix(p, EXCLUDE_PREFIXES),
  );
  if (framework.length === 0) return process.exit(0);

  const policy = loadPolicy(project);
  const effectiveMode = computeEffectiveMode(policy);

  const sample = framework.slice(0, 5);
  const more = framework.length > sample.length ? ` (+${framework.length - sample.length} more)` : "";
  const msg =
    `[version-bump-guard] framework files staged against version ${version}, ` +
    `but framework/releases/${version}/ already exists (capsule already minted). ` +
    `Bump version.json before committing framework changes — otherwise downstream ` +
    `consumers running /warp:update --to ${version} will get a stale capsule.\n` +
    `  Staged framework files: ${sample.join(", ")}${more}\n` +
    `  Bypass (logged): WARPOS_VERSION_GUARD=off, or touch .warpos/version-bump-guard-disable\n` +
    `  Or run: /warp:release --version patch --apply (bumps + mints capsule).\n`;

  process.stderr.write(msg);

  if (effectiveMode === "block") {
    // PreToolUse exit 2 blocks the tool call.
    return process.exit(2);
  }
  return process.exit(0);
}

function matchesPrefix(p, prefixes) {
  const norm = p.replace(/\\/g, "/");
  return prefixes.some((pref) =>
    pref.endsWith("/") ? norm.startsWith(pref) : norm === pref,
  );
}

function resolveProject() {
  if (process.env.CLAUDE_PROJECT_DIR) return process.env.CLAUDE_PROJECT_DIR;
  try {
    const paths = require("./lib/paths");
    return paths.PROJECT;
  } catch {
    return process.cwd();
  }
}

function loadPolicy(project) {
  const policyFile = path.join(
    project,
    ".claude",
    "agents",
    "00-alex",
    ".system",
    "policy",
    "version-bump-guard.json",
  );
  if (!fs.existsSync(policyFile)) return null;
  try {
    return JSON.parse(fs.readFileSync(policyFile, "utf8"));
  } catch {
    return null;
  }
}

function computeEffectiveMode(policy) {
  const declared = (policy && policy.enforcement && policy.enforcement.mode) || "warn";
  const softUntil = policy && policy.enforcement && policy.enforcement.soft_rollout_until;
  if (declared === "block" && softUntil) {
    const t = Date.parse(softUntil);
    if (!Number.isNaN(t) && Date.now() < t) return "warn";
  }
  return declared === "block" ? "block" : "warn";
}
