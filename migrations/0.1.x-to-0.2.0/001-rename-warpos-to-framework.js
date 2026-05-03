#!/usr/bin/env node
/* WarpOS 0.1.x → 0.2.0 migration 001 — rename top-level warpos/ to framework/.
 *
 * Idempotent: no-op if framework/ already exists or warpos/ is missing.
 *
 * Run via /warp:update --to 0.2.0 --apply (the migrations-loader picks this
 * up automatically). Standalone: node migrations/0.1.x-to-0.2.0/001-rename-warpos-to-framework.js
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const OLD = path.join(ROOT, "warpos");
const NEW = path.join(ROOT, "framework");

function main() {
  if (fs.existsSync(NEW) && !fs.existsSync(OLD)) {
    console.log("[001] framework/ already present; warpos/ absent — no-op.");
    return 0;
  }
  if (!fs.existsSync(OLD)) {
    console.log("[001] warpos/ not found; nothing to rename.");
    return 0;
  }
  if (fs.existsSync(NEW)) {
    console.error(
      "[001] BOTH warpos/ and framework/ exist — manual review required.",
    );
    return 1;
  }
  // Prefer git mv when in a git repo (preserves history)
  const isGit = fs.existsSync(path.join(ROOT, ".git"));
  if (isGit) {
    const result = spawnSync("git", ["mv", "warpos", "framework"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    if (result.status !== 0) return result.status || 1;
  } else {
    fs.renameSync(OLD, NEW);
  }
  console.log("[001] Renamed warpos/ → framework/.");
  return 0;
}

if (require.main === module) process.exit(main());
module.exports = { main };
