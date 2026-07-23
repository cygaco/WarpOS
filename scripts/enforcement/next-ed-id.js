"use strict";
/**
 * next-ed-id.js (SP-20260723-003 / ED-267b) — the MECHANICAL ED-id allocator for /enforcement:log.
 *
 * Replaces the log.md step-2 "count existing lines" minting, which COLLIDES: the register is 141 lines
 * but the max id is ED-269 (append-only closure/amendment rows inflate the line count above the id count),
 * so line-count minting re-issues a live id (the ED-267/268 tangle this session). This prints the true
 * next id (max ED-NNN + 1), skipping malformed lines.
 *
 *   node scripts/enforcement/next-ed-id.js            # prints e.g. ED-270
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const { nextEdId } = require("./ed-registry");

function registerPath() {
  try { return require(path.join(ROOT, "scripts", "hooks", "lib", "paths")).PATHS.enforcementDebt; }
  catch { return path.join(".claude", "project", "memory", "enforcement-debt.jsonl"); }
}

if (require.main === module) {
  let p = registerPath();
  if (!path.isAbsolute(p)) p = path.join(ROOT, p);
  let text = "";
  try { text = fs.readFileSync(p, "utf8"); } catch { text = ""; } // absent register -> ED-001
  process.stdout.write(nextEdId(text) + "\n");
}

module.exports = { nextEdId, registerPath };
