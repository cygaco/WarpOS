#!/usr/bin/env node
/* WarpOS 0.1.x → 0.2.0 migration 002 — rename requirements/ to _requirements/.
 *
 * Idempotent. Also handles the chapter renumber + 03-requirement-standards
 * removal that was bundled with the rename.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const OLD = path.join(ROOT, "requirements");
const NEW = path.join(ROOT, "_requirements");

const RENUMBER = [
  ["04-architecture", "03-architecture"],
  ["05-features", "04-features"],
  ["06-operations", "05-operations"],
  ["07-security", "06-security"],
  ["08-testing", "07-testing"],
  ["09-automation", "08-automation"],
  ["99-audits", "_audits"],
];

function gitMv(from, to) {
  const isGit = fs.existsSync(path.join(ROOT, ".git"));
  if (isGit)
    return (
      spawnSync("git", ["mv", from, to], { cwd: ROOT, stdio: "inherit" })
        .status === 0
    );
  fs.renameSync(path.join(ROOT, from), path.join(ROOT, to));
  return true;
}

function gitRm(target) {
  const isGit = fs.existsSync(path.join(ROOT, ".git"));
  const abs = path.join(ROOT, target);
  if (!fs.existsSync(abs)) return true;
  if (isGit)
    return (
      spawnSync("git", ["rm", "-rf", target], { cwd: ROOT, stdio: "inherit" })
        .status === 0
    );
  fs.rmSync(abs, { recursive: true, force: true });
  return true;
}

function main() {
  if (fs.existsSync(NEW) && !fs.existsSync(OLD)) {
    console.log(
      "[002] _requirements/ already present; requirements/ absent — no-op.",
    );
    return 0;
  }
  if (!fs.existsSync(OLD)) {
    console.log("[002] requirements/ not found; nothing to migrate.");
    return 0;
  }
  if (fs.existsSync(NEW)) {
    console.error(
      "[002] BOTH requirements/ and _requirements/ exist — manual review required.",
    );
    return 1;
  }
  // Step 1: remove duplicate 03-requirement-standards if present
  const dupe = path.join(OLD, "03-requirement-standards");
  if (fs.existsSync(dupe) && fs.existsSync(path.join(OLD, "_standards"))) {
    gitRm("requirements/03-requirement-standards");
    console.log(
      "[002] Removed requirements/03-requirement-standards/ (duplicate of _standards/).",
    );
  }
  // Step 2: chapter renumber under old top-level name (cleaner git rename detection)
  for (const [from, to] of RENUMBER) {
    const fromAbs = path.join(OLD, from);
    const toAbs = path.join(OLD, to);
    if (fs.existsSync(fromAbs) && !fs.existsSync(toAbs)) {
      gitMv(`requirements/${from}`, `requirements/${to}`);
      console.log(
        `[002] Renumbered requirements/${from}/ → requirements/${to}/.`,
      );
    }
  }
  // Step 3: top-level rename
  gitMv("requirements", "_requirements");
  console.log("[002] Renamed requirements/ → _requirements/.");
  return 0;
}

if (require.main === module) process.exit(main());
module.exports = { main };
