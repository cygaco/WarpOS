#!/usr/bin/env node
/* WarpOS 0.1.x → 0.2.0 migration 003 — rename docs/ to _docs/, after merging
 * everything except the three carve-outs (user-communication, research,
 * karpathy-auto-research) into _requirements/.
 *
 * Idempotent. Skips merge if _requirements/ already has the merged content.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const OLD = path.join(ROOT, "docs");
const NEW = path.join(ROOT, "_docs");

// docs subdir → _requirements destination (skeleton only; consumer-specific
// content stays untouched if it has been customized)
const DOCS_TO_REQUIREMENTS = [
  ["docs/00-canonical", "_requirements/00-canonical"],
  ["docs/01-design-system", "_requirements/01-design-system"],
  ["docs/02-copy-system", "_requirements/02-copy-system"],
  ["docs/04-architecture", "_requirements/03-architecture"],
  ["docs/06-integrations", "_requirements/09-integrations"],
  ["docs/audit-reports", "_requirements/_audits"],
];

// 99-resources/* → _docs/* (carve-outs that stay)
const CARVE_OUTS = [
  ["docs/99-resources/00-user-communication", "docs/user-communication"],
  ["docs/99-resources/01-research", "docs/research"],
  ["docs/99-resources/02-karpathy-autoresearch", "docs/karpathy-auto-research"],
];

function isGit() {
  return fs.existsSync(path.join(ROOT, ".git"));
}

function gitMv(from, to) {
  const fromAbs = path.join(ROOT, from);
  const toAbs = path.join(ROOT, to);
  if (!fs.existsSync(fromAbs) || fs.existsSync(toAbs)) return true; // no-op
  if (isGit())
    return (
      spawnSync("git", ["mv", from, to], { cwd: ROOT, stdio: "inherit" })
        .status === 0
    );
  fs.mkdirSync(path.dirname(toAbs), { recursive: true });
  fs.renameSync(fromAbs, toAbs);
  return true;
}

function main() {
  if (fs.existsSync(NEW) && !fs.existsSync(OLD)) {
    console.log("[003] _docs/ already present; docs/ absent — no-op.");
    return 0;
  }
  if (!fs.existsSync(OLD)) {
    console.log("[003] docs/ not found; nothing to migrate.");
    return 0;
  }
  // Step 1: lift 99-resources carve-outs to docs/ root (under old name)
  for (const [from, to] of CARVE_OUTS) {
    if (fs.existsSync(path.join(ROOT, from))) {
      gitMv(from, to);
      console.log(`[003] Lifted ${from} → ${to}.`);
    }
  }
  // Try to remove empty 99-resources
  try {
    fs.rmdirSync(path.join(ROOT, "docs", "99-resources"));
  } catch {
    /* not empty */
  }
  // Step 2: merge framework dirs into _requirements (only if dest doesn't exist)
  for (const [from, to] of DOCS_TO_REQUIREMENTS) {
    const fromAbs = path.join(ROOT, from);
    if (!fs.existsSync(fromAbs)) continue;
    if (fs.existsSync(path.join(ROOT, to))) {
      console.log(
        `[003] ${to} already exists; leaving ${from} for manual review (write-conflict).`,
      );
      continue;
    }
    gitMv(from, to);
    console.log(`[003] Merged ${from} → ${to}.`);
  }
  // Step 3: top-level rename docs → _docs
  if (fs.existsSync(OLD) && !fs.existsSync(NEW)) {
    if (isGit())
      spawnSync("git", ["mv", "docs", "_docs"], {
        cwd: ROOT,
        stdio: "inherit",
      });
    else fs.renameSync(OLD, NEW);
    console.log("[003] Renamed docs/ → _docs/.");
  }
  return 0;
}

if (require.main === module) process.exit(main());
module.exports = { main };
